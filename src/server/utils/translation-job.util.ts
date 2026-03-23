import { translate } from '@vitalets/google-translate-api'
import type { Knex } from 'knex'

import { JOB_STATUS } from '../../enums/translation-job.enum'
import { JOB_BATCH_SIZE, JOB_BATCH_DELAY_MS } from '../../consts/translation-job.const'
import type { ITranslationJob } from '../../interfaces/translation-job.interface'

// ── In-memory job store ───────────────────────────────────────────────────────
const _jobs = new Map<string, ITranslationJob>()

export function createJob(projectId: number, languageCode: string, languageName: string): ITranslationJob {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const job: ITranslationJob = {
    id,
    status: JOB_STATUS.RUNNING,
    projectId,
    languageCode,
    languageName,
    total: 0,
    done: 0,
    errors: 0,
    startedAt: Date.now(),
  }
  _jobs.set(id, job)
  return job
}

export function getJob(id: string): ITranslationJob | undefined {
  return _jobs.get(id)
}

// Clean up finished jobs after 10 minutes
function scheduleCleanup(id: string) {
  setTimeout(() => _jobs.delete(id), 10 * 60 * 1000)
}

// ── Main runner ───────────────────────────────────────────────────────────────
export async function runTranslationJob(db: Knex, job: ITranslationJob): Promise<void> {
  try {
    // Find source language (default lang of the project)
    const sourceLang = await db('languages')
      .where({ project_id: job.projectId, is_default: true })
      .first()
      ?? await db('languages')
        .where({ project_id: job.projectId })
        .whereNot({ code: job.languageCode })
        .first()

    if (!sourceLang) {
      job.status = JOB_STATUS.ERROR
      scheduleCleanup(job.id)
      return
    }

    // Get all source translations (keys that have a value in source language)
    const sourceTranslations = await db('translation_keys as tk')
      .join('translations as t', function () {
        this.on('t.key_id', '=', 'tk.id')
          .andOn('t.language_code', '=', db.raw('?', [sourceLang.code]))
      })
      .where('tk.project_id', job.projectId)
      .whereNotNull('t.value')
      .where('t.value', '!=', '')
      .select('tk.id as key_id', 't.value as source_value')

    if (!sourceTranslations.length) {
      job.status = JOB_STATUS.DONE
      scheduleCleanup(job.id)
      return
    }

    // Find which keys already have a translation in target language
    const existingKeyIds = new Set(
      (await db('translations')
        .whereIn('key_id', sourceTranslations.map((r: any) => r.key_id))
        .where('language_code', job.languageCode)
        .whereNotNull('value')
        .where('value', '!=', '')
        .select('key_id')
      ).map((r: any) => r.key_id),
    )

    const toTranslate = sourceTranslations.filter((r: any) => !existingKeyIds.has(r.key_id))
    job.total = toTranslate.length

    if (!toTranslate.length) {
      job.status = JOB_STATUS.DONE
      scheduleCleanup(job.id)
      return
    }

    const SEPARATOR = ' ||| '

    for (let i = 0; i < toTranslate.length; i += JOB_BATCH_SIZE) {
      const chunk = toTranslate.slice(i, i + JOB_BATCH_SIZE)
      const combined = chunk.map((r: any) => r.source_value).join(SEPARATOR)

      try {
        const result = await translate(combined, { from: sourceLang.code, to: job.languageCode })
        const translatedTexts = result.text.split(SEPARATOR)

        for (let j = 0; j < chunk.length; j++) {
          const value = (translatedTexts[j] || '').trim()
          if (!value) continue

          const existing = await db('translations')
            .where({ key_id: chunk[j].key_id, language_code: job.languageCode })
            .first()

          if (existing) {
            if (!existing.value) {
              await db('translations').where({ id: existing.id })
                .update({ value, status: 'draft', updated_at: db.fn.now() })
            }
          } else {
            await db('translations').insert({
              key_id: chunk[j].key_id,
              language_code: job.languageCode,
              value,
              status: 'draft',
            })
          }
          job.done++
        }
      } catch (e: any) {
        console.error(`[TranslationJob] Batch failed (${job.languageCode}):`, e.message)
        job.errors += chunk.length
        job.done += chunk.length
      }

      if (i + JOB_BATCH_SIZE < toTranslate.length) {
        await new Promise(r => setTimeout(r, JOB_BATCH_DELAY_MS))
      }
    }

    job.status = JOB_STATUS.DONE
  } catch (e: any) {
    console.error(`[TranslationJob] Fatal error:`, e.message)
    job.status = JOB_STATUS.ERROR
  } finally {
    scheduleCleanup(job.id)
  }
}

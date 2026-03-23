import { translate } from '@vitalets/google-translate-api'
import type { Knex } from 'knex'

import { BATCH_DELAY_MS, BATCH_SIZE } from '../../consts/auto-translate.const'

/**
 * Auto-translates all missing Dashboard UI strings for a given language,
 * using the EN translations as the source.
 * Runs in batches to stay within free API limits.
 */
export async function autoTranslateUtil(db: Knex, targetLang: string): Promise<void> {
  const systemProject = await db('projects').where({ is_system: true }).first()
  if (!systemProject) return

  // Get all EN translations for the system project
  const enTranslations = await db('translation_keys as tk')
    .join('translations as t', function () {
      this.on('t.key_id', '=', 'tk.id').andOn('t.language_code', '=', db.raw('?', ['en']))
    })
    .where('tk.project_id', systemProject.id)
    .whereNotNull('t.value')
    .where('t.value', '!=', '')
    .select('tk.id as key_id', 't.value as en_value')

  if (!enTranslations.length) return

  // Find which keys already have a translation in targetLang
  const existingTargetKeyIds = new Set(
    (await db('translations')
      .whereIn('key_id', enTranslations.map((r: any) => r.key_id))
      .where('language_code', targetLang)
      .whereNotNull('value')
      .where('value', '!=', '')
      .select('key_id')
    ).map((r: any) => r.key_id),
  )

  const toTranslate = enTranslations.filter((r: any) => !existingTargetKeyIds.has(r.key_id))
  if (!toTranslate.length) return

  console.log(`[autoTranslateUI] Translating ${toTranslate.length} UI strings to "${targetLang}"…`)

  // Process in batches
  const separator = '\n\n'

  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const chunk = toTranslate.slice(i, i + BATCH_SIZE)

    let translatedTexts: string[] | null = null

    // Attempt batch translation — faster but may fail for some languages
    try {
      const combined = chunk.map((r: any) => r.en_value).join(separator)
      const result = await translate(combined, { from: 'en', to: targetLang })
      const parts = result.text.split(separator)

      // Only use batch result if the split produced the expected number of parts
      if (parts.length === chunk.length) {
        translatedTexts = parts
      } else {
        console.warn(`[autoTranslateUI] Batch split mismatch for "${targetLang}" (got ${parts.length}, expected ${chunk.length}) — falling back to individual calls`)
      }
    } catch (e: any) {
      console.error(`[autoTranslateUI] Batch ${i / BATCH_SIZE + 1} failed for "${targetLang}":`, e.message)
    }

    // Fallback: translate each string individually when batch split is unreliable
    if (!translatedTexts) {
      translatedTexts = []
      for (const item of chunk) {
        try {
          const r = await translate(item.en_value, { from: 'en', to: targetLang })
          translatedTexts.push(r.text)
        } catch (e: any) {
          console.error(`[autoTranslateUI] Individual translation failed for "${targetLang}":`, e.message)
          translatedTexts.push('')
        }
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
      }
    }

    for (let j = 0; j < chunk.length; j++) {
      const value = (translatedTexts[j] || '').trim()
      if (!value) continue

      const existing = await db('translations')
        .where({ key_id: chunk[j].key_id, language_code: targetLang })
        .first()

      if (existing) {
        if (!existing.value) {
          await db('translations')
            .where({ id: existing.id })
            .update({ value, status: 'draft', updated_at: db.fn.now() })
        }
      } else {
        await db('translations').insert({
          key_id: chunk[j].key_id,
          language_code: targetLang,
          value,
          status: 'draft',
        })
      }
    }

    if (!translatedTexts && i + BATCH_SIZE < toTranslate.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS))
    }
  }

  console.log(`[autoTranslateUI] Done translating UI to "${targetLang}".`)
}

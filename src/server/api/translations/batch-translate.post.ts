import { translate } from '@vitalets/google-translate-api'
import { getDb } from '../../db/index'

// Auto-translate all missing translations for a given target language
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project_id, target_language, source_language } = body

  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })
  if (!target_language) {
    throw createError({ statusCode: 400, message: 'target_language is required' })
  }

  const db = getDb()

  // Get all keys that have NO translation for target language
  // but DO have a translation in source_language (or any language)
  const keysWithoutTarget = await db('translation_keys as tk')
    .leftJoin('translations as target_t', function () {
      this.on('target_t.key_id', '=', 'tk.id')
        .andOn('target_t.language_code', '=', db.raw('?', [target_language]))
    })
    .where('tk.project_id', Number(project_id))
    .where(function () {
      this.whereNull('target_t.id').orWhere('target_t.value', '').orWhereNull('target_t.value')
    })
    .select('tk.id', 'tk.key')

  if (!keysWithoutTarget.length) {
    return { translated: 0, skipped: 0, errors: 0, message: 'All translations already exist' }
  }

  // Get source translations (prefer source_language, fallback to any available)
  const keyIds = keysWithoutTarget.map((k: any) => k.id)

  let sourceTranslations: any[]
  if (source_language) {
    sourceTranslations = await db('translations')
      .whereIn('key_id', keyIds)
      .where('language_code', source_language)
      .whereNotNull('value')
      .where('value', '!=', '')
      .select('key_id', 'value', 'language_code')
  } else {
    // Pick any available translation per key (first one found)
    sourceTranslations = await db('translations')
      .whereIn('key_id', keyIds)
      .whereNotNull('value')
      .where('value', '!=', '')
      .select('key_id', 'value', 'language_code')
      .orderBy('key_id', 'asc')
  }

  // Build map: key_id → { value, language }
  const sourceMap = new Map<number, { value: string; lang: string }>()
  for (const t of sourceTranslations) {
    if (!sourceMap.has(t.key_id)) {
      sourceMap.set(t.key_id, { value: t.value, lang: t.language_code })
    }
  }

  let translated = 0
  let skipped = 0
  let errors = 0

  for (const key of keysWithoutTarget) {
    const source = sourceMap.get(key.id)
    if (!source) {
      skipped++
      continue
    }

    try {
      const result = await translate(source.value, {
        from: source.lang,
        to: target_language,
      })

      const translatedText = result.text

      const existing = await db('translations')
        .where({ key_id: key.id, language_code: target_language })
        .first()

      if (existing) {
        await db('translation_history').insert({
          translation_id: existing.id,
          old_value: existing.value,
          new_value: translatedText,
          changed_by: 'google-translate',
        })
        await db('translations')
          .where({ id: existing.id })
          .update({ value: translatedText, status: 'draft', updated_at: db.fn.now() })
      } else {
        const [id] = await db('translations').insert({
          key_id: key.id,
          language_code: target_language,
          value: translatedText,
          status: 'draft',
        })
        await db('translation_history').insert({
          translation_id: id,
          old_value: null,
          new_value: translatedText,
          changed_by: 'google-translate',
        })
      }

      translated++

      // Small delay to be polite to the free API
      await new Promise((r) => setTimeout(r, 200))
    } catch (e: any) {
      errors++
      console.error(`[batch-translate] Failed for key "${key.key}":`, e.message)
    }
  }

  return { translated, skipped, errors, total: keysWithoutTarget.length }
})

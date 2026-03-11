import { getDb } from '../db/index'

// Public endpoint — returns Dashboard UI translations as a flat key→value JSON
export default defineEventHandler(async (event) => {
  const { lang = 'en' } = getQuery(event)

  const db = getDb()
  const systemProject = await db('projects').where({ is_system: true }).first()
  if (!systemProject) return {}

  const keys = await db('translation_keys')
    .where({ project_id: systemProject.id })
    .select('id', 'key')

  const keyIds = keys.map((k: any) => k.id)
  if (!keyIds.length) return {}

  // Prefer requested lang, fallback to en then fr
  const translations = await db('translations')
    .whereIn('key_id', keyIds)
    .whereIn('language_code', [lang as string, 'en', 'fr'])
    .select('key_id', 'language_code', 'value')

  // Build map: key_id → { lang: value, en: value, fr: value }
  const byKeyId: Record<number, Record<string, string>> = {}
  for (const tr of translations) {
    if (!byKeyId[tr.key_id]) byKeyId[tr.key_id] = {}
    byKeyId[tr.key_id][tr.language_code] = tr.value
  }

  const result: Record<string, string> = {}
  for (const k of keys) {
    const langMap = byKeyId[k.id] || {}
    const value = langMap[lang as string] || langMap['en'] || langMap['fr']
    if (value) result[k.key] = value
  }

  return result
})

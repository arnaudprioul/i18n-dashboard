import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = getDb()

  const key = await db('translation_keys').where({ id: Number(id) }).first()
  if (!key) throw createError({ statusCode: 404, message: 'Key not found' })

  const languages = await db('languages')
    .where({ project_id: key.project_id })
    .orderBy('is_default', 'desc')
    .orderBy('name', 'asc')

  const translations = await db('translations')
    .where({ key_id: Number(id) })
    .select('*')

  const usages = await db('key_usages')
    .where({ key_id: Number(id) })
    .select('*')
    .orderBy('file_path', 'asc')
    .orderBy('line_number', 'asc')

  // Build translations map + fetch history per translation
  const translationMap: Record<string, any> = {}
  for (const tr of translations) {
    const history = await db('translation_history')
      .where({ translation_id: tr.id })
      .orderBy('changed_at', 'desc')
      .limit(20)
    translationMap[tr.language_code] = { ...tr, history }
  }

  return {
    ...key,
    languages,
    translations: translationMap,
    usages,
  }
})

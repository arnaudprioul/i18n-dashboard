import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const { project_id, search, page = 1, limit = 50, lang, status } = query

  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })

  const db = getDb()
  const offset = (Number(page) - 1) * Number(limit)

  const languages = await db('languages')
    .where({ project_id: Number(project_id) })
    .select('*')
    .orderBy('is_default', 'desc')
    .orderBy('name', 'asc')

  let keysQuery = db('translation_keys as tk')
    .where('tk.project_id', Number(project_id))
    .select('tk.*')
    .orderBy('tk.key', 'asc')

  if (search) {
    keysQuery = keysQuery.where('tk.key', 'like', `%${search}%`)
  }

  if (status === 'unused') {
    keysQuery = keysQuery.where('tk.is_unused', true)
  } else if (status === 'missing' && lang && lang !== 'all') {
    keysQuery = keysQuery.whereNotExists(
      db('translations as t')
        .where('t.key_id', db.ref('tk.id'))
        .where('t.language_code', lang as string)
        .whereNotNull('t.value')
        .where('t.value', '!=', '')
        .select('t.id'),
    )
  } else if (lang && lang !== 'all') {
    if (status && status !== 'all') {
      keysQuery = keysQuery.whereExists(
        db('translations as t')
          .where('t.key_id', db.ref('tk.id'))
          .where('t.language_code', lang as string)
          .where('t.status', status as string)
          .select('t.id'),
      )
    }
  } else if (status && status !== 'all' && status !== 'unused') {
    keysQuery = keysQuery.whereExists(
      db('translations as t')
        .where('t.key_id', db.ref('tk.id'))
        .where('t.status', status as string)
        .select('t.id'),
    )
  }

  const totalQuery = keysQuery.clone().clearOrder().clearSelect().count('* as count')
  const [{ count }] = await totalQuery
  const total = Number(count)

  const keys = await keysQuery.offset(offset).limit(Number(limit))
  const keyIds = keys.map((k: any) => k.id)

  let translations: any[] = []
  if (keyIds.length > 0) {
    translations = await db('translations as t')
      .whereIn('t.key_id', keyIds)
      .select('t.*')
  }

  let usages: any[] = []
  if (keyIds.length > 0) {
    usages = await db('key_usages')
      .whereIn('key_id', keyIds)
      .select('key_id', 'file_path', 'line_number', 'detected_function')
      .orderBy('file_path', 'asc')
  }

  const translationMap: Record<number, Record<string, any>> = {}
  for (const tr of translations) {
    if (!translationMap[tr.key_id]) translationMap[tr.key_id] = {}
    translationMap[tr.key_id][tr.language_code] = tr
  }

  const usageMap: Record<number, any[]> = {}
  for (const u of usages) {
    if (!usageMap[u.key_id]) usageMap[u.key_id] = []
    usageMap[u.key_id].push(u)
  }

  const result = keys.map((key: any) => ({
    ...key,
    translations: translationMap[key.id] || {},
    usages: usageMap[key.id] || [],
  }))

  return { data: result, total, page: Number(page), limit: Number(limit), languages }
})

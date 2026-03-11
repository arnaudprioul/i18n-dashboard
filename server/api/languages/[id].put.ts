import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { fallback_code, name, is_default } = body

  const db = getDb()
  const lang = await db('languages').where({ id }).first()
  if (!lang) throw createError({ statusCode: 404, message: 'Language not found' })

  if (is_default) {
    await db('languages').where({ project_id: lang.project_id }).update({ is_default: false })
  }

  const updates: Record<string, any> = {}
  if (name !== undefined) updates.name = name
  if (is_default !== undefined) updates.is_default = is_default
  // fallback_code: null = aucun fallback explicite (auto BCP 47 prend le relais)
  if ('fallback_code' in body) updates.fallback_code = fallback_code || null

  await db('languages').where({ id }).update(updates)
  return db('languages').where({ id }).first()
})

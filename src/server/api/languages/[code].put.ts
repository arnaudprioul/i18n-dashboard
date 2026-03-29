import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody(event)
  const { project_id, fallback_code, name, is_default } = body

  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })

  const db = getDb()
  const lang = await db('languages').where({ project_id: Number(project_id), code }).first()
  if (!lang) throw createError({ statusCode: 404, message: 'Language not found' })

  if (is_default) {
    await db('languages').where({ project_id: Number(project_id) }).update({ is_default: false })
  }

  const updates: Record<string, any> = {}
  if (name !== undefined) updates.name = name
  if (is_default !== undefined) updates.is_default = is_default
  if ('fallback_code' in body) updates.fallback_code = fallback_code || null

  await db('languages').where({ id: lang.id }).update(updates)
  return db('languages').where({ id: lang.id }).first()
})

import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const { project_id } = getQuery(event)

  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })

  const db = getDb()
  const language = await db('languages').where({ project_id: Number(project_id), code }).first()
  if (!language) throw createError({ statusCode: 404, message: 'Language not found' })

  await db('languages').where({ id: language.id }).delete()
  return { success: true }
})

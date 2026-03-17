import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const { project_id } = getQuery(event)
  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })
  const db = getDb()
  return db('project_modifiers')
    .where({ project_id: Number(project_id) })
    .orderBy('name')
})

import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project_id, name, body: fnBody } = body
  if (!project_id || !name || !fnBody) throw createError({ statusCode: 400, message: 'project_id, name and body are required' })
  const db = getDb()
  const [id] = await db('project_modifiers').insert({
    project_id: Number(project_id),
    name,
    body: fnBody,
  })
  return db('project_modifiers').where({ id }).first()
})

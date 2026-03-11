import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const db = getDb()

  const project = await db('projects').where({ id }).first()
  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })
  if (project.is_system) throw createError({ statusCode: 403, message: 'Le projet système ne peut pas être supprimé' })

  await db('projects').where({ id }).delete()
  return { success: true }
})

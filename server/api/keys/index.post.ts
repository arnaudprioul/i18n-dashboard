import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project_id, key, description } = body

  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })
  if (!key) throw createError({ statusCode: 400, message: 'key is required' })

  const db = getDb()

  const existing = await db('translation_keys').where({ project_id: Number(project_id), key }).first()
  if (existing) throw createError({ statusCode: 409, message: 'Key already exists' })

  const [id] = await db('translation_keys').insert({ project_id: Number(project_id), key, description })
  return db('translation_keys').where({ id }).first()
})

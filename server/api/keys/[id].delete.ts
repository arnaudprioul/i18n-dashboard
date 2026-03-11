import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db = getDb()

  const key = await db('translation_keys').where({ id: Number(id) }).first()
  if (!key) {
    throw createError({ statusCode: 404, message: 'Key not found' })
  }

  await db('translation_keys').where({ id: Number(id) }).delete()
  return { success: true }
})
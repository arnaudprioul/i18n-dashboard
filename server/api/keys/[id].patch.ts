import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { description } = body

  const db = getDb()

  const key = await db('translation_keys').where({ id: Number(id) }).first()
  if (!key) {
    throw createError({ statusCode: 404, message: 'Key not found' })
  }

  await db('translation_keys')
    .where({ id: Number(id) })
    .update({ description: description ?? null })

  return db('translation_keys').where({ id: Number(id) }).first()
})

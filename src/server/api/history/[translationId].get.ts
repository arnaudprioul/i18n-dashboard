import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const translationId = getRouterParam(event, 'translationId')
  const db = getDb()

  const history = await db('translation_history')
    .where({ translation_id: Number(translationId) })
    .orderBy('changed_at', 'desc')
    .limit(50)

  return history
})

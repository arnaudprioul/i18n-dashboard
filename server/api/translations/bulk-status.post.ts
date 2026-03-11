import { getDb } from '../../db/index'
import { TRANSLATION_STATUS } from '../../enums/translation.enum'

// Bulk update status for multiple translations by their IDs
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { ids, status } = body

  if (!ids?.length || !status) {
    throw createError({ statusCode: 400, message: 'ids and status are required' })
  }

  const validStatuses = [TRANSLATION_STATUS.DRAFT, TRANSLATION_STATUS.REVIEWED, TRANSLATION_STATUS.APPROVED]
  if (!validStatuses.includes(status)) {
    throw createError({ statusCode: 400, message: `Status must be one of: ${validStatuses.join(', ')}` })
  }

  const db = getDb()
  await db('translations')
    .whereIn('id', ids)
    .update({ status, updated_at: db.fn.now() })

  return { updated: ids.length }
})

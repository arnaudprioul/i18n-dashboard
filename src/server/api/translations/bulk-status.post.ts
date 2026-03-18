import { getDb } from '../../db/index'
import { TRANSLATION_STATUS } from '~/enums/translation.enum'

// Bulk update status for multiple translations by their IDs
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { ids, status } = body

  if (!ids?.length || !status) {
    throw createError({ statusCode: 400, message: 'ids and status are required' })
  }

  const validStatuses = Object.values(TRANSLATION_STATUS)
  if (!validStatuses.includes(status)) {
    throw createError({ statusCode: 400, message: `Status must be one of: ${validStatuses.join(', ')}` })
  }

  const db = getDb()
  if (status === TRANSLATION_STATUS.APPROVED) {
    // Freeze approved_value for each translation individually so we capture
    // its current working value at approval time.
    await db('translations')
      .whereIn('id', ids)
      .update({ status, approved_value: db.ref('value'), updated_at: db.fn.now() })
  } else {
    await db('translations')
      .whereIn('id', ids)
      .update({ status, updated_at: db.fn.now() })
  }

  return { updated: ids.length }
})

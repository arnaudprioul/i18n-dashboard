import { getDb } from '../../db/index'
import { TRANSLATION_STATUS } from '../../../enums/translation.enum'

// Update only the status of a translation (Draft → Reviewed → Approved)
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { key_id, language_code, status } = body

  if (!key_id || !language_code || !status) {
    throw createError({ statusCode: 400, message: 'key_id, language_code and status are required' })
  }

  const validStatuses = Object.values(TRANSLATION_STATUS)
  if (!validStatuses.includes(status)) {
    throw createError({ statusCode: 400, message: `Status must be one of: ${validStatuses.join(', ')}` })
  }

  const db = getDb()

  const existing = await db('translations').where({ key_id: Number(key_id), language_code }).first()
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Translation not found' })
  }

  const updates: Record<string, any> = { status, updated_at: db.fn.now() }
  // Freeze the approved value so the locale API can serve it even if the
  // translation is later edited back to draft.
  if (status === TRANSLATION_STATUS.APPROVED) {
    updates.approved_value = existing.value
  }

  await db('translations')
    .where({ id: existing.id })
    .update(updates)

  return db('translations').where({ id: existing.id }).first()
})

import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.is_super_admin) throw createError({ statusCode: 403, message: 'Forbidden' })

  const { older_than_days } = getQuery(event)
  const db = getDb()

  let query = db('system_logs')
  if (older_than_days) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - Number(older_than_days))
    query = query.where('created_at', '<', cutoff.toISOString())
  }

  const deleted = await query.delete()
  return { deleted }
})

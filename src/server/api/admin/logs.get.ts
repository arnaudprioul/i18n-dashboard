import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.is_super_admin) throw createError({ statusCode: 403, message: 'Forbidden' })

  const { page = 1, limit = 50, level, context } = getQuery(event)
  const db = getDb()
  const offset = (Number(page) - 1) * Number(limit)

  let query = db('system_logs').orderBy('created_at', 'desc')
  if (level && level !== 'all') query = query.where('level', level as string)
  if (context) query = query.where('context', 'like', `%${context}%`)

  const [{ count }] = await query.clone().clearOrder().clearSelect().count('* as count')
  const logs = await query.select('*').offset(offset).limit(Number(limit))

  return { data: logs, total: Number(count) }
})

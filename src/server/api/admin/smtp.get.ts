import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.is_super_admin) throw createError({ statusCode: 403, message: 'Forbidden' })

  const db = getDb()
  const rows = await db('settings')
    .whereIn('key', ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_from', 'dashboard_url'])
    .select('key', 'value')

  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value || ''

  return {
    host: map.smtp_host || '',
    port: map.smtp_port || '587',
    secure: map.smtp_secure || 'false',
    user: map.smtp_user || '',
    from: map.smtp_from || '',
    dashboardUrl: map.dashboard_url || '',
    // Never expose smtp_pass — just indicate whether it's set
    hasPassword: !!(await db('settings').where({ key: 'smtp_pass' }).first())?.value,
  }
})

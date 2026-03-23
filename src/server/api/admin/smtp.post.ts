import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.is_super_admin) throw createError({ statusCode: 403, message: 'Forbidden' })

  const body = await readBody(event)
  const { host, port, secure, user: smtpUser, pass, from, dashboardUrl } = body

  const db = getDb()

  const updates: Array<{ key: string; value: string }> = [
    { key: 'smtp_host', value: host || '' },
    { key: 'smtp_port', value: String(port || 587) },
    { key: 'smtp_secure', value: String(secure === true || secure === 'true') },
    { key: 'smtp_user', value: smtpUser || '' },
    { key: 'smtp_from', value: from || '' },
    { key: 'dashboard_url', value: dashboardUrl || '' },
  ]

  // Only update password if provided (non-empty)
  if (pass !== undefined && pass !== '') {
    updates.push({ key: 'smtp_pass', value: pass })
  }

  for (const { key, value } of updates) {
    const existing = await db('settings').where({ key }).first()
    if (existing) {
      await db('settings').where({ key }).update({ value, updated_at: db.fn.now() })
    }
    else {
      await db('settings').insert({ key, value })
    }
  }

  return { ok: true }
})

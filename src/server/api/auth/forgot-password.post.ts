import { createHash, randomBytes } from 'node:crypto'
import { getDb } from '../../db/index'
import { sendEmail, resetPasswordEmailHtml } from '../../utils/mailer.util'
import { useRuntimeConfig } from 'nitropack/runtime'

export default defineEventHandler(async (event) => {
  const { email } = await readBody(event)

  if (!email) {
    throw createError({ statusCode: 400, message: 'Email requis' })
  }

  const db = getDb()
  const user = await db('users').where({ email: email.toLowerCase().trim(), is_active: true }).first()

  // Always return 200 to avoid email enumeration
  if (!user) return { success: true }

  // Delete any existing reset tokens for this user
  await db('password_reset_tokens').where({ user_id: user.id }).delete()

  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const config = useRuntimeConfig()
  const expiresAt = new Date(Date.now() + (Number(config.resetTokenTtlHours) || 1) * 60 * 60 * 1000)

  await db('password_reset_tokens').insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  })

  // Read dashboardUrl from settings table, fall back to runtime config
  const dashboardUrlRow = await db('settings').where({ key: 'dashboard_url' }).first()
  const dashboardUrl = dashboardUrlRow?.value || (config.dashboardUrl as string) || 'http://localhost:3333'
  const resetUrl = `${dashboardUrl}/reset-password?token=${token}`

  try {
    await sendEmail({
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe — i18n Dashboard',
      html: resetPasswordEmailHtml({ name: user.name, resetUrl }),
    })
  } catch (e: any) {
    console.warn('[i18n-dashboard] Email de réinitialisation non envoyé:', e.message)
  }

  return { success: true }
})

import { getDb } from '../../db/index'
import { sendEmail } from '../../utils/mailer.util'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.is_super_admin) throw createError({ statusCode: 403, message: 'Forbidden' })

  const body = await readBody(event)
  const to = body.to || user.email

  try {
    await sendEmail({
      to,
      subject: '[i18n-dashboard] Test email',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #4f46e5;">✅ SMTP configuration test</h2>
          <p>If you receive this email, your SMTP configuration is working correctly.</p>
          <p style="color: #6b7280; font-size: 0.85rem;">Sent from i18n-dashboard</p>
        </div>
      `,
    })
    return { ok: true }
  }
  catch (e: any) {
    throw createError({ statusCode: 500, message: e.message || 'Failed to send test email' })
  }
})

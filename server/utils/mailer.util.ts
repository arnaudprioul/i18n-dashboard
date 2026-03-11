import { useRuntimeConfig } from '#imports'

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const config = useRuntimeConfig()

  if (!config.smtpHost) {
    // No SMTP configured — log to console as fallback
    console.log(`\n[i18n-dashboard] 📧 Email (non envoyé — SMTP non configuré)`)
    console.log(`  À      : ${to}`)
    console.log(`  Sujet  : ${subject}`)
    console.log(`  Contenu: ${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n`)
    return
  }

  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.createTransport({
    host: config.smtpHost as string,
    port: Number(config.smtpPort) || 587,
    secure: config.smtpSecure === 'true',
    auth: config.smtpUser
      ? { user: config.smtpUser as string, pass: config.smtpPass as string }
      : undefined,
  })

  await transporter.sendMail({
    from: config.smtpFrom as string || 'noreply@i18n-dashboard.local',
    to,
    subject,
    html,
  })
}

export function inviteEmailHtml({
  name,
  email,
  tempPassword,
  dashboardUrl,
  projectName,
  role,
}: {
  name: string
  email: string
  tempPassword: string
  dashboardUrl: string
  projectName?: string
  role: string
}) {
  const roleLabels: Record<string, string> = {
    translator: 'Traducteur',
    moderator: 'Modérateur',
    admin: 'Administrateur',
  }
  const scopeMsg = projectName
    ? `sur le projet <strong>${projectName}</strong>`
    : `sur tous les projets`

  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #333;">
  <div style="background: #4f46e5; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 1.5rem;">🌐 i18n Dashboard</h1>
  </div>
  <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
    <h2>Bonjour ${name},</h2>
    <p>Un compte a été créé pour vous sur <strong>vue-i18n-dashboard</strong>.</p>
    <p>Vous avez le rôle <strong>${roleLabels[role] || role}</strong> ${scopeMsg}.</p>
    <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="margin: 4px 0;"><strong>Email :</strong> ${email}</p>
      <p style="margin: 4px 0;"><strong>Mot de passe temporaire :</strong> <code style="background: #f3f4f6; padding: 2px 8px; border-radius: 4px;">${tempPassword}</code></p>
    </div>
    <p>Connectez-vous et changez votre mot de passe dès que possible :</p>
    <a href="${dashboardUrl}/login" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Se connecter</a>
    <p style="margin-top: 24px; font-size: 0.85rem; color: #6b7280;">
      Si vous n'attendiez pas cet email, vous pouvez l'ignorer.
    </p>
  </div>
</body>
</html>`
}

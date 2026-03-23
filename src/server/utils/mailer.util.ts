import { useRuntimeConfig } from 'nitropack/runtime'
import { getDb } from '../db/index'

async function getSmtpConfig() {
  try {
    const db = getDb()
    const rows = await db('settings')
      .whereIn('key', ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from', 'dashboard_url'])
      .select('key', 'value')
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value || ''
    // Fall back to runtime config for any missing values
    const rc = useRuntimeConfig()
    return {
      host: map.smtp_host || (rc.smtpHost as string) || '',
      port: Number(map.smtp_port || rc.smtpPort || 587),
      secure: (map.smtp_secure || rc.smtpSecure || 'false') === 'true',
      user: map.smtp_user || (rc.smtpUser as string) || '',
      pass: map.smtp_pass || (rc.smtpPass as string) || '',
      from: map.smtp_from || (rc.smtpFrom as string) || 'noreply@i18n-dashboard.local',
      dashboardUrl: map.dashboard_url || (rc.dashboardUrl as string) || 'http://localhost:3333',
    }
  }
  catch {
    const rc = useRuntimeConfig()
    return {
      host: (rc.smtpHost as string) || '',
      port: Number(rc.smtpPort) || 587,
      secure: rc.smtpSecure === 'true',
      user: (rc.smtpUser as string) || '',
      pass: (rc.smtpPass as string) || '',
      from: (rc.smtpFrom as string) || 'noreply@i18n-dashboard.local',
      dashboardUrl: (rc.dashboardUrl as string) || 'http://localhost:3333',
    }
  }
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const smtp = await getSmtpConfig()

  if (!smtp.host) {
    console.log(`\n[i18n-dashboard] 📧 Email (non envoyé — SMTP non configuré)`)
    console.log(`  À      : ${to}`)
    console.log(`  Sujet  : ${subject}`)
    console.log(`  Contenu: ${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n`)
    return
  }

  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
  })

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject,
    html,
  })
}

export function resetPasswordEmailHtml({
  name,
  resetUrl,
}: {
  name: string
  resetUrl: string
}) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #333;">
  <div style="background: #4f46e5; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 1.5rem;">🌐 i18n Dashboard</h1>
  </div>
  <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
    <h2>Bonjour ${name},</h2>
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
    <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valide <strong>1 heure</strong>.</p>
    <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 16px 0;">Réinitialiser mon mot de passe</a>
    <p style="margin-top: 24px; font-size: 0.85rem; color: #6b7280;">
      Si vous n'avez pas fait cette demande, ignorez cet email. Votre mot de passe restera inchangé.
    </p>
  </div>
</body>
</html>`
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
    <p>Un compte a été créé pour vous sur <strong>i18n-dashboard</strong>.</p>
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

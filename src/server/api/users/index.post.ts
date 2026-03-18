import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'
import { getDb } from '../../db/index'
import { getUserRole, canManageUsers } from '~/utils/auth.util'
import { sendEmail, inviteEmailHtml } from '~/utils/mailer.util'
import { useRuntimeConfig } from '#imports'

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(12)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

export default defineEventHandler(async (event) => {
  const currentUser = event.context.user
  const body = await readBody(event)
  const { name, email, role, project_ids, global_access } = body

  if (!name || !email) throw createError({ statusCode: 400, message: 'Nom et email requis' })
  if (!role || !['translator', 'moderator', 'admin'].includes(role)) {
    throw createError({ statusCode: 400, message: 'Rôle invalide (translator | moderator | admin)' })
  }

  const db = getDb()

  // Permission check
  if (!currentUser.is_super_admin) {
    // Project admin can only create users in their project
    const { project_id } = body
    if (!project_id) throw createError({ statusCode: 400, message: 'project_id requis' })
    const userRole = await getUserRole(currentUser.id, Number(project_id))
    if (!canManageUsers(userRole, false)) throw createError({ statusCode: 403, message: 'Accès refusé' })
    // Project admin can't create super admins
    if (body.is_super_admin) throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  // Check email uniqueness
  const existing = await db('users').where({ email: email.toLowerCase().trim() }).first()
  if (existing) throw createError({ statusCode: 409, message: 'Cet email est déjà utilisé' })

  const tempPassword = generateTempPassword()
  const hash = await bcrypt.hash(tempPassword, 12)

  const [userId] = await db('users').insert({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password_hash: hash,
    is_super_admin: false,
    is_active: true,
  })

  // Assign roles
  if (currentUser.is_super_admin && global_access) {
    // Global access: project_id = NULL
    await db('user_project_roles').insert({ user_id: userId, project_id: null, role })
  } else {
    // Assign to specific projects
    const pids: number[] = currentUser.is_super_admin
      ? (project_ids || [])
      : [body.project_id]

    for (const pid of pids) {
      await db('user_project_roles').insert({ user_id: userId, project_id: Number(pid), role })
    }
  }

  // Send invitation email
  const config = useRuntimeConfig()
  const projectName = body.project_id
    ? (await db('projects').where({ id: Number(body.project_id) }).first())?.name
    : undefined

  try {
    await sendEmail({
      to: email,
      subject: 'Votre accès à i18n-dashboard',
      html: inviteEmailHtml({
        name,
        email: email.toLowerCase().trim(),
        tempPassword,
        dashboardUrl: config.dashboardUrl as string,
        projectName,
        role,
      }),
    })
  } catch (e: any) {
    console.warn('[i18n-dashboard] Email non envoyé:', e.message)
  }

  // Never return the temporary password in the API response — it was already
  // sent via email. Returning it here would expose it in browser DevTools,
  // proxy logs, and any API monitoring tool.
  return { id: userId, email: email.toLowerCase().trim(), name }
})

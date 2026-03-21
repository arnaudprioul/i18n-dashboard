import { getDb } from '../../db/index'
import { getUserRole, canManageUsers } from '../../../utils/auth.util'

export default defineEventHandler(async (event) => {
  const currentUser = event.context.user
  const targetId = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { name, is_active, role, project_id } = body

  const db = getDb()

  // Only super admin can edit super admins
  const target = await db('users').where({ id: targetId }).first()
  if (!target) throw createError({ statusCode: 404, message: 'Utilisateur non trouvé' })
  if (target.is_super_admin && !currentUser.is_super_admin) {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  // Permission check
  if (!currentUser.is_super_admin) {
    if (!project_id) throw createError({ statusCode: 400, message: 'project_id requis' })
    const userRole = await getUserRole(currentUser.id, Number(project_id))
    if (!canManageUsers(userRole, false)) throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  // Update user fields
  const updates: any = {}
  if (name) updates.name = name.trim()
  if (is_active !== undefined) updates.is_active = is_active

  if (Object.keys(updates).length) {
    await db('users').where({ id: targetId }).update(updates)
  }

  // Update role in project if provided
  if (role && project_id !== undefined) {
    await db('user_project_roles')
      .where({ user_id: targetId, project_id: project_id || null })
      .update({ role })
  }

  return { success: true }
})

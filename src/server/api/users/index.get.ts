import { getDb } from '../../db/index'
import { getUserRole, canManageUsers } from '~/server/utils/auth.util'

export default defineEventHandler(async (event) => {
  const currentUser = event.context.user
  const { project_id, exclude_project_id } = getQuery(event)
  const db = getDb()

  // ── Project-scoped view ────────────────────────────────────────────────────
  if (project_id) {
    const pid = Number(project_id)

    if (!currentUser.is_super_admin) {
      const role = await getUserRole(currentUser.id, pid)
      if (!canManageUsers(role, false)) {
        throw createError({ statusCode: 403, message: 'Accès refusé' })
      }
    }

    const projectRoles = await db('user_project_roles as r')
      .join('users as u', 'r.user_id', 'u.id')
      .where('r.project_id', pid)
      .select('u.id', 'u.email', 'u.name', 'u.is_active', 'u.last_login_at', 'r.role')

    return projectRoles
  }

  // ── Users not yet in a given project (for "add existing user" picker) ──────
  if (exclude_project_id) {
    const pid = Number(exclude_project_id)

    if (!currentUser.is_super_admin) {
      const role = await getUserRole(currentUser.id, pid)
      if (!canManageUsers(role, false)) {
        throw createError({ statusCode: 403, message: 'Accès refusé' })
      }
    }

    const alreadyIn = await db('user_project_roles').where('project_id', pid).pluck('user_id')

    const query = db('users')
      .select('id', 'email', 'name', 'is_active', 'last_login_at')
      .orderBy('name')

    if (alreadyIn.length) query.whereNotIn('id', alreadyIn)

    return query
  }

  // ── Global view (super admin or global admins only) ────────────────────────
  if (!currentUser.is_super_admin) {
    const globalAdminRole = await db('user_project_roles')
      .where({ user_id: currentUser.id, role: 'admin' })
      .whereNull('project_id')
      .first()
    if (!globalAdminRole) throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const users = await db('users')
    .select('id', 'email', 'name', 'is_super_admin', 'is_active', 'last_login_at', 'created_at')
    .orderBy('name')

  const roles = await db('user_project_roles as r')
    .leftJoin('projects as p', 'r.project_id', 'p.id')
    .select('r.user_id', 'r.role', 'r.project_id', 'p.name as project_name', 'p.color as project_color')

  return users.map((u: any) => ({
    ...u,
    roles: roles.filter((r: any) => r.user_id === u.id),
  }))
})

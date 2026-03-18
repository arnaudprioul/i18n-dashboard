import { getDb } from '../../../db/index'
import { getUserRole, canManageUsers } from '~/server/utils/auth.util'

const VALID_ROLES = ['translator', 'moderator', 'admin']

export default defineEventHandler(async (event) => {
  const currentUser = event.context.user
  const targetId = Number(getRouterParam(event, 'id'))
  const { roles } = await readBody(event)
  // roles: Array<{ project_id: number | null, role: string | null }>
  // role = null means remove access for that project

  if (!Array.isArray(roles)) {
    throw createError({ statusCode: 400, message: 'roles must be an array' })
  }

  const db = getDb()

  const target = await db('users').where({ id: targetId }).first()
  if (!target) throw createError({ statusCode: 404, message: 'User not found' })

  if (target.is_super_admin && !currentUser.is_super_admin) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  for (const { project_id, role } of roles) {
    // Validate role value
    if (role !== null && !VALID_ROLES.includes(role)) {
      throw createError({ statusCode: 400, message: `Invalid role: ${role}` })
    }

    // Permission check per entry
    if (!currentUser.is_super_admin) {
      if (project_id === null) {
        throw createError({ statusCode: 403, message: 'Only super admins can set global access' })
      }
      const myRole = await getUserRole(currentUser.id, Number(project_id))
      if (!canManageUsers(myRole, false)) {
        throw createError({ statusCode: 403, message: 'Forbidden on this project' })
      }
    }

    // Build the WHERE clause (NULL-safe)
    const whereClause = (q: any) => {
      q.where('user_id', targetId)
      if (project_id === null) q.whereNull('project_id')
      else q.where('project_id', project_id)
    }

    if (role === null) {
      await db('user_project_roles').where(whereClause).delete()
    } else {
      const existing = await db('user_project_roles').where(whereClause).first()
      if (existing) {
        await db('user_project_roles').where(whereClause).update({ role })
      } else {
        await db('user_project_roles').insert({
          user_id: targetId,
          project_id: project_id ?? null,
          role,
        })
      }
    }
  }

  return { success: true }
})

import { getDb } from '../../db/index'
import { getUserRole, canManageUsers } from '~/server/utils/auth.util'

export default defineEventHandler(async (event) => {
  const currentUser = event.context.user
  const targetId = Number(getRouterParam(event, 'id'))

  if (targetId === currentUser.id) {
    throw createError({ statusCode: 400, message: 'Vous ne pouvez pas supprimer votre propre compte' })
  }

  const db = getDb()
  const target = await db('users').where({ id: targetId }).first()
  if (!target) throw createError({ statusCode: 404, message: 'Utilisateur non trouvé' })

  if (target.is_super_admin && !currentUser.is_super_admin) {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  if (!currentUser.is_super_admin) {
    const { project_id } = getQuery(event)
    if (!project_id) throw createError({ statusCode: 400, message: 'project_id requis' })
    const role = await getUserRole(currentUser.id, Number(project_id))
    if (!canManageUsers(role, false)) throw createError({ statusCode: 403, message: 'Accès refusé' })

    // Project admin can only remove users from their project (not delete globally)
    await db('user_project_roles')
      .where({ user_id: targetId, project_id: Number(project_id) })
      .delete()
    return { success: true }
  }

  // Super admin deletes user globally
  await db('users').where({ id: targetId }).delete()
  return { success: true }
})

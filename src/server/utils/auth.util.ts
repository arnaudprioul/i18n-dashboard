import type { H3Event } from 'h3'
import { useSession } from 'h3'
import { useRuntimeConfig } from '#imports'

import { getDb } from '../db/index'
import { ROLES } from '../enums/auth.enum'
import type { Role } from '../types/auth.type'

export function sessionConfig() {
  const config = useRuntimeConfig()
  return {
    password: config.sessionSecret as string,
    name: 'i18n-dashboard-session',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  }
}

/** Get the current session data */
export async function getSession(event: H3Event) {
  return useSession(event, sessionConfig())
}

/** Require a logged-in user. Returns user row or throws 401. */
export async function requireAuth(event: H3Event) {
  const session = await getSession(event)
  const userId = (session.data as any).userId
  if (!userId) throw createError({ statusCode: 401, message: 'Non authentifié' })

  const db = getDb()
  const user = await db('users').where({ id: userId, is_active: true }).first()
  if (!user) throw createError({ statusCode: 401, message: 'Session invalide' })

  return user
}

/** Get effective role for a user on a specific project. Returns null if no access. */
export async function getUserRole(userId: number, projectId: number): Promise<Role | null> {
  const db = getDb()

  // Specific project role takes priority
  const specific = await db('user_project_roles')
    .where({ user_id: userId, project_id: projectId })
    .first()
  if (specific) return specific.role as Role

  // Global role (project_id IS NULL) — access to all projects
  const global_ = await db('user_project_roles')
    .where({ user_id: userId })
    .whereNull('project_id')
    .first()
  if (global_) return global_.role as Role

  return null
}

/** Check if user can edit translations (translator+) */
export function canEdit(role: Role | null, isSuperAdmin: boolean) {
  return isSuperAdmin || role !== null
}

/** Check if user can approve translations (moderator+) */
export function canApprove(role: Role | null, isSuperAdmin: boolean) {
  return isSuperAdmin || role === ROLES.MODERATOR || role === ROLES.ADMIN
}

/** Check if user can manage project settings, scan, sync (admin+) */
export function canManageProject(role: Role | null, isSuperAdmin: boolean) {
  return isSuperAdmin || role === ROLES.ADMIN
}

/** Check if user can manage users (admin+ of that project, or super_admin) */
export function canManageUsers(role: Role | null, isSuperAdmin: boolean) {
  return isSuperAdmin || role === ROLES.ADMIN
}

/** Full user profile with roles */
export async function getUserProfile(userId: number) {
  const db = getDb()
  const user = await db('users').where({ id: userId }).first()
  if (!user) return null

  const roles = await db('user_project_roles as r')
    .leftJoin('projects as p', 'r.project_id', 'p.id')
    .where('r.user_id', userId)
    .select('r.role', 'r.project_id', 'p.name as project_name')

  const { password_hash, ...safeUser } = user
  return { ...safeUser, roles }
}

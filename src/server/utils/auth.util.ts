import { randomBytes, createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import { useSession, getCookie, setCookie, deleteCookie } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'

import { getDb } from '../db'
import { ROLES } from '../../enums/auth.enum'
import type { TRole } from '../../types/auth.type'

// ── Constants ─────────────────────────────────────────────────────────────────

const REFRESH_COOKIE = 'i18n-refresh-token'

// ── Session (access token) ─────────────────────────────────────────────────────

export function sessionConfig() {
  const config = useRuntimeConfig()
  return {
    password: config.sessionSecret as string,
    name: 'i18n-dashboard-session',
    maxAge: 60 * (Number(config.sessionTtlMinutes) || 15),
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

// ── Refresh token helpers ──────────────────────────────────────────────────────

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Issue a new refresh token for a user.
 * Stores the SHA-256 hash in DB and sets an HttpOnly cookie.
 * Also removes expired tokens for that user (housekeeping).
 */
export async function createRefreshToken(event: H3Event, userId: number): Promise<void> {
  const db = getDb()
  const config = useRuntimeConfig()
  const refreshTtlSeconds = (Number(config.refreshTokenTtlDays) || 7) * 60 * 60 * 24
  const token = randomBytes(32).toString('hex')
  const hash = hashToken(token)
  const expiresAt = new Date(Date.now() + refreshTtlSeconds * 1000)

  // Housekeeping: remove expired tokens for this user
  await db('refresh_tokens')
    .where({ user_id: userId })
    .where('expires_at', '<', new Date())
    .delete()

  await db('refresh_tokens').insert({
    user_id: userId,
    token_hash: hash,
    expires_at: expiresAt,
  })

  setCookie(event, REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: refreshTtlSeconds,
    path: '/',
  })
}

/**
 * Verify the refresh token cookie, rotate it (delete old, issue new),
 * and return the associated userId.
 * Throws 401 if invalid or expired.
 */
export async function verifyAndRotateRefreshToken(event: H3Event): Promise<number> {
  const token = getCookie(event, REFRESH_COOKIE)
  if (!token) throw createError({ statusCode: 401, message: 'Refresh token manquant' })

  const hash = hashToken(token)
  const db = getDb()
  const row = await db('refresh_tokens')
    .where({ token_hash: hash })
    .where('expires_at', '>', new Date())
    .first()

  if (!row) throw createError({ statusCode: 401, message: 'Refresh token invalide ou expiré' })

  // Rotation: delete consumed token immediately
  await db('refresh_tokens').where({ id: row.id }).delete()

  const userId = row.user_id

  // Issue new session + new refresh token
  const session = await getSession(event)
  await session.update({ userId })
  await createRefreshToken(event, userId)

  return userId
}

/**
 * Delete all refresh tokens for a user and clear the cookie.
 */
export async function clearRefreshToken(event: H3Event, userId?: number): Promise<void> {
  const db = getDb()
  if (userId) {
    await db('refresh_tokens').where({ user_id: userId }).delete()
  } else {
    // Best-effort: delete by hash from cookie
    const token = getCookie(event, REFRESH_COOKIE)
    if (token) {
      await db('refresh_tokens').where({ token_hash: hashToken(token) }).delete()
    }
  }
  deleteCookie(event, REFRESH_COOKIE, { path: '/' })
}

// ── Role helpers ───────────────────────────────────────────────────────────────

/** Get effective role for a user on a specific project. Returns null if no access. */
export async function getUserRole(userId: number, projectId: number): Promise<TRole | null> {
  const db = getDb()

  // Specific project role takes priority
  const specific = await db('user_project_roles')
    .where({ user_id: userId, project_id: projectId })
    .first()
  if (specific) return specific.role as TRole

  // Global role (project_id IS NULL) — access to all projects
  const global_ = await db('user_project_roles')
    .where({ user_id: userId })
    .whereNull('project_id')
    .first()
  if (global_) return global_.role as TRole

  return null
}

/** Check if user can edit translations (translator+) */
export function canEdit(role: TRole | null, isSuperAdmin: boolean) {
  return isSuperAdmin || role !== null
}

/** Check if user can approve translations (moderator+) */
export function canApprove(role: TRole | null, isSuperAdmin: boolean) {
  return isSuperAdmin || role === ROLES.MODERATOR || role === ROLES.ADMIN
}

/** Check if user can manage project settings, scan, sync (admin+) */
export function canManageProject(role: TRole | null, isSuperAdmin: boolean) {
  return isSuperAdmin || role === ROLES.ADMIN
}

/** Check if user can manage users (admin+ of that project, or super_admin) */
export function canManageUsers(role: TRole | null, isSuperAdmin: boolean) {
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
  return { ...safeUser, is_super_admin: !!safeUser.is_super_admin, is_active: !!safeUser.is_active, roles }
}

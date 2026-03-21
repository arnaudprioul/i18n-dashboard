import { getDb } from '../../../db/index'
import { getUserRole } from '../../../../utils/auth.util'
import type { IUserProfile, ProfilePeriod } from '../../../../interfaces/profile.interface'

const PERIOD_MS: Record<ProfilePeriod, number | null> = {
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '365d': 365 * 24 * 60 * 60 * 1000,
  'all': null,
}

export default defineEventHandler(async (event): Promise<IUserProfile> => {
  const currentUser = event.context.user
  const targetId = Number(getRouterParam(event, 'id'))
  const query = getQuery(event)
  const period = (query.period as ProfilePeriod) || 'all'
  const db = getDb()

  const target = await db('users')
    .where({ id: targetId })
    .select('id', 'name', 'email', 'is_super_admin', 'is_active', 'last_login_at', 'created_at')
    .first()

  if (!target) throw createError({ statusCode: 404, message: 'Utilisateur non trouvé' })

  // Access: own profile, super admin, or admin in a shared project
  const isSelf = currentUser.id === targetId
  if (!isSelf && !currentUser.is_super_admin) {
    const targetProjectIds: number[] = await db('user_project_roles')
      .where({ user_id: targetId })
      .whereNotNull('project_id')
      .pluck('project_id')

    let hasAccess = false
    for (const pid of targetProjectIds) {
      const role = await getUserRole(currentUser.id, pid)
      if (role === 'admin') { hasAccess = true; break }
    }
    if (!hasAccess) throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  // ── Roles ──────────────────────────────────────────────────────────────────
  const roles = await db('user_project_roles as upr')
    .leftJoin('projects as p', 'p.id', 'upr.project_id')
    .where('upr.user_id', targetId)
    .select('upr.role', 'upr.project_id', 'p.name as project_name', 'p.color as project_color')

  // ── Languages ──────────────────────────────────────────────────────────────
  const projectIds = roles.filter((r: any) => r.project_id).map((r: any) => r.project_id)

  let languages: any[]
  if (target.is_super_admin) {
    languages = await db('languages as l')
      .join('projects as p', 'p.id', 'l.project_id')
      .where('p.is_system', false)
      .select('l.*', 'p.name as project_name', 'p.color as project_color')
  } else if (projectIds.length) {
    languages = await db('languages as l')
      .join('projects as p', 'p.id', 'l.project_id')
      .whereIn('l.project_id', projectIds)
      .where('p.is_system', false)
      .select('l.*', 'p.name as project_name', 'p.color as project_color')
  } else {
    languages = []
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const ms = PERIOD_MS[period] ?? null
  const since = ms ? new Date(Date.now() - ms).toISOString() : null

  const periodQ = since
    ? db('translation_history').where('changed_by', target.name).where('changed_at', '>=', since)
    : db('translation_history').where('changed_by', target.name)

  const [countTotal, countPeriod] = await Promise.all([
    db('translation_history').where('changed_by', target.name).count('id as n').first(),
    periodQ.count('id as n').first(),
  ])

  // ── Recent translations ────────────────────────────────────────────────────
  const recentTranslations = await db('translation_history as th')
    .join('translations as t', 't.id', 'th.translation_id')
    .join('translation_keys as tk', 'tk.id', 't.key_id')
    .join('projects as p', 'p.id', 'tk.project_id')
    .where('th.changed_by', target.name)
    .orderBy('th.changed_at', 'desc')
    .limit(20)
    .select(
      'th.id',
      'th.new_value',
      'th.old_value',
      'th.changed_at',
      'tk.key',
      'tk.id as key_id',
      'tk.project_id',
      't.language_code',
      'p.name as project_name',
      'p.color as project_color',
    )

  return {
    user: {
      id: target.id,
      name: target.name,
      email: target.email,
      is_super_admin: !!target.is_super_admin,
      last_login_at: target.last_login_at ?? null,
      created_at: target.created_at,
    },
    roles,
    stats: {
      total: Number(countTotal?.n ?? 0),
      periodCount: Number(countPeriod?.n ?? 0),
      period,
    },
    languages,
    recentTranslations,
  }
})

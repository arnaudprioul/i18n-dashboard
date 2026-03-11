import { getDb } from '../db/index'
import type { UserProfile } from '../interfaces/profile.interface'

export default defineEventHandler(async (event): Promise<UserProfile> => {
  const user = event.context.user
  const db = getDb()

  // ── Roles with project info ───────────────────────────────────────────────
  const roles = await db('user_project_roles as upr')
    .leftJoin('projects as p', 'p.id', 'upr.project_id')
    .where('upr.user_id', user.id)
    .select('upr.role', 'upr.project_id', 'p.name as project_name', 'p.color as project_color')

  // ── Languages accessible to the user ─────────────────────────────────────
  const projectIds = roles.filter((r: any) => r.project_id).map((r: any) => r.project_id)

  let languages: any[]
  if (user.is_super_admin) {
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

  // ── Stats ─────────────────────────────────────────────────────────────────
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [countTotal, countWeek, countMonth] = await Promise.all([
    db('translation_history').where('changed_by', user.name).count('id as n').first(),
    db('translation_history').where('changed_by', user.name).where('changed_at', '>=', weekAgo).count('id as n').first(),
    db('translation_history').where('changed_by', user.name).where('changed_at', '>=', monthAgo).count('id as n').first(),
  ])

  // ── Recent translations ───────────────────────────────────────────────────
  const recentTranslations = await db('translation_history as th')
    .join('translations as t', 't.id', 'th.translation_id')
    .join('translation_keys as tk', 'tk.id', 't.key_id')
    .join('projects as p', 'p.id', 'tk.project_id')
    .where('th.changed_by', user.name)
    .orderBy('th.changed_at', 'desc')
    .limit(20)
    .select(
      'th.id',
      'th.new_value',
      'th.old_value',
      'th.changed_at',
      'tk.key',
      'tk.id as key_id',
      't.language_code',
      'p.name as project_name',
      'p.color as project_color',
    )

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      is_super_admin: !!user.is_super_admin,
      last_login_at: user.last_login_at ?? null,
      created_at: user.created_at,
    },
    roles,
    stats: {
      total: Number(countTotal?.n ?? 0),
      thisWeek: Number(countWeek?.n ?? 0),
      thisMonth: Number(countMonth?.n ?? 0),
    },
    languages,
    recentTranslations,
  }
})

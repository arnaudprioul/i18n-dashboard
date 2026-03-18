import { getDb } from '../../db/index'
import { requireAuth } from '~/server/utils/auth.util'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = getDb()

  // Determine accessible project IDs
  let projectIds: number[]

  if (user.is_super_admin) {
    const rows = await db('projects').select('id')
    projectIds = rows.map((r: any) => r.id)
  } else {
    // Check for a global role (project_id IS NULL) → access to all non-system projects
    const globalRole = await db('user_project_roles')
      .where({ user_id: user.id })
      .whereNull('project_id')
      .first()

    if (globalRole) {
      const rows = await db('projects').select('id')
      projectIds = rows.map((r: any) => r.id)
    } else {
      const specific = await db('user_project_roles')
        .where({ user_id: user.id })
        .whereNotNull('project_id')
        .select('project_id')
      projectIds = specific.map((r: any) => r.project_id)
    }
  }

  if (projectIds.length === 0) {
    return { totalKeys: 0, unusedKeys: 0, languages: [], recentActivity: [] }
  }

  // Aggregate totalKeys and unusedKeys
  const totalKeysRow = await db('translation_keys')
    .whereIn('project_id', projectIds)
    .count('* as count')
    .first()
  const unusedKeysRow = await db('translation_keys')
    .whereIn('project_id', projectIds)
    .where({ is_unused: true })
    .count('* as count')
    .first()

  const totalKeys = Number((totalKeysRow as any)?.count || 0)
  const unusedKeys = Number((unusedKeysRow as any)?.count || 0)

  // Languages: aggregate by code across all accessible projects
  const allLanguages = await db('languages')
    .whereIn('project_id', projectIds)
    .select('*')
    .orderBy('is_default', 'desc')
    .orderBy('code', 'asc')

  // Group language stats by code
  const langMap = new Map<string, { code: string; name: string; is_default: boolean; total: number; translated: number; draft: number; reviewed: number; approved: number }>()

  for (const lang of allLanguages) {
    const existing = langMap.get(lang.code)

    const translatedRow = await db('translations as t')
      .join('translation_keys as k', 't.key_id', 'k.id')
      .whereIn('k.project_id', projectIds)
      .where('t.language_code', lang.code)
      .whereNotNull('t.value')
      .where('t.value', '!=', '')
      .count('* as count')
      .first()

    const byStatus = await db('translations as t')
      .join('translation_keys as k', 't.key_id', 'k.id')
      .whereIn('k.project_id', projectIds)
      .where('t.language_code', lang.code)
      .whereNotNull('t.value')
      .where('t.value', '!=', '')
      .groupBy('t.status')
      .select('t.status')
      .count('* as count')

    const statusMap: Record<string, number> = { draft: 0, reviewed: 0, approved: 0 }
    for (const row of byStatus) {
      statusMap[(row as any).status || 'draft'] = Number((row as any).count)
    }

    const translatedCount = Number((translatedRow as any)?.count || 0)

    if (!existing) {
      langMap.set(lang.code, {
        code: lang.code,
        name: lang.name,
        is_default: !!lang.is_default,
        total: totalKeys,
        translated: translatedCount,
        draft: statusMap.draft,
        reviewed: statusMap.reviewed,
        approved: statusMap.approved,
      })
    }
    // If already exists (same lang code in multiple projects), skip — already aggregated above per-code
  }

  const langStats = Array.from(langMap.values()).map(l => ({
    ...l,
    missing: l.total - l.translated,
    coverage: l.total > 0 ? Math.round((l.translated / l.total) * 100) : 0,
  }))

  // Recent activity across all accessible projects
  const recentActivity = await db('translation_history as h')
    .join('translations as t', 'h.translation_id', 't.id')
    .join('translation_keys as k', 't.key_id', 'k.id')
    .whereIn('k.project_id', projectIds)
    .orderBy('h.changed_at', 'desc')
    .limit(20)
    .select('h.id', 'h.old_value', 'h.new_value', 'h.changed_by', 'h.changed_at', 'k.key', 't.language_code')

  return {
    totalKeys,
    unusedKeys,
    languages: langStats,
    recentActivity,
  }
})

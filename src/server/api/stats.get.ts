import { getDb } from '../db/index'

export default defineEventHandler(async (event) => {
  const { project_id } = getQuery(event)
  if (!project_id) return { totalKeys: 0, unusedKeys: 0, languages: [], recentActivity: [] }

  const db = getDb()
  const pid = Number(project_id)

  const languages = await db('languages').where({ project_id: pid }).select('*').orderBy('is_default', 'desc').orderBy('name', 'asc')
  const totalKeys = await db('translation_keys').where({ project_id: pid }).count('* as count').first()
  const unusedKeys = await db('translation_keys').where({ project_id: pid, is_unused: true }).count('* as count').first()

  const langStats = await Promise.all(
    languages.map(async (lang: any) => {
      const total = Number((totalKeys as any)?.count || 0)

      const translated = await db('translations as t')
        .join('translation_keys as k', 't.key_id', 'k.id')
        .where('k.project_id', pid)
        .where('t.language_code', lang.code)
        .whereNotNull('t.value')
        .where('t.value', '!=', '')
        .count('* as count')
        .first()

      const byStatus = await db('translations as t')
        .join('translation_keys as k', 't.key_id', 'k.id')
        .where('k.project_id', pid)
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

      const translatedCount = Number((translated as any)?.count || 0)
      return {
        ...lang,
        total,
        translated: translatedCount,
        missing: total - translatedCount,
        draft: statusMap.draft,
        reviewed: statusMap.reviewed,
        approved: statusMap.approved,
        coverage: total > 0 ? parseFloat(((translatedCount / total) * 100).toFixed(2)) : 0,
      }
    }),
  )

  const recentActivity = await db('translation_history as h')
    .join('translations as t', 'h.translation_id', 't.id')
    .join('translation_keys as k', 't.key_id', 'k.id')
    .where('k.project_id', pid)
    .orderBy('h.changed_at', 'desc')
    .limit(15)
    .select('h.id', 'h.old_value', 'h.new_value', 'h.changed_by', 'h.changed_at', 'k.key', 't.language_code')

  return {
    totalKeys: Number((totalKeys as any)?.count || 0),
    unusedKeys: Number((unusedKeys as any)?.count || 0),
    languages: langStats,
    recentActivity,
  }
})

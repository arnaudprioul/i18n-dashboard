import { getDb } from '../db/index'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const projectId = query.project_id ? Number(query.project_id) : null

  if (!projectId) throw createError({ statusCode: 400, message: 'project_id is required' })

  const db = getDb()
  const project = await db('projects').where({ id: projectId }).first()
  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })
  if (project.is_system) throw createError({ statusCode: 403, message: 'System project cannot be exported' })

  const languages = await db('languages')
    .where({ project_id: projectId })
    .select('code', 'name', 'is_default', 'fallback_code')

  const keyRows = await db('translation_keys')
    .where({ project_id: projectId })
    .select('id', 'key', 'description')

  const translationRows = await db('translations as t')
    .join('translation_keys as k', 't.key_id', 'k.id')
    .where('k.project_id', projectId)
    .select('k.key', 't.language_code', 't.value', 't.status')

  // Build keys map: key → { description, translations: { lang: { value, status } } }
  const keysMap: Record<string, { description: string | null; translations: Record<string, { value: string; status: string }> }> = {}

  for (const row of keyRows) {
    keysMap[row.key] = { description: row.description ?? null, translations: {} }
  }

  for (const row of translationRows) {
    if (!keysMap[row.key]) continue
    if (row.value !== null && row.value !== '') {
      keysMap[row.key].translations[row.language_code] = {
        value: row.value,
        status: row.status ?? 'draft',
      }
    }
  }

  const snapshot = {
    version: 1,
    exportedAt: new Date().toISOString(),
    project: {
      name: project.name,
      locales_path: project.locales_path,
      key_separator: project.key_separator,
      color: project.color ?? null,
      description: project.description ?? null,
      source_url: project.source_url ?? null,
    },
    languages: languages.map(l => ({
      code: l.code,
      name: l.name,
      is_default: !!l.is_default,
      fallback_code: l.fallback_code ?? null,
    })),
    keys: Object.entries(keysMap).map(([key, data]) => ({
      key,
      description: data.description,
      translations: data.translations,
    })),
  }

  const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}_snapshot.json`
  setHeader(event, 'Content-Type', 'application/json')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

  return snapshot
})

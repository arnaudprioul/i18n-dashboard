import { getDb } from '../db/index'
import { unflattenObject } from '../../utils/lang-api.util'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const projectId = query.project_id ? Number(query.project_id) : null
  const lang = query.lang ? String(query.lang) : null

  if (!projectId) throw createError({ statusCode: 400, message: 'project_id is required' })

  const db = getDb()
  const project = await db('projects').where({ id: projectId }).first()
  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })

  const separator = project.key_separator || '.'

  // ── Single language ────────────────────────────────────────────────────
  if (lang) {
    const language = await db('languages').where({ project_id: projectId, code: lang }).first()
    if (!language) throw createError({ statusCode: 404, message: `Language '${lang}' not found` })

    const rows = await db('translations as t')
      .join('translation_keys as k', 't.key_id', 'k.id')
      .where('t.language_code', lang)
      .where('k.project_id', projectId)
      .whereNotNull('t.value')
      .select('k.key', 't.value')

    const flat: Record<string, string> = {}
    for (const row of rows) flat[row.key] = row.value

    const nested = unflattenObject(flat, separator)
    const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}_${lang}.json`

    setHeader(event, 'Content-Type', 'application/json')
    setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
    return nested
  }

  // ── All languages ──────────────────────────────────────────────────────
  const languages = await db('languages').where({ project_id: projectId }).select('code')

  const combined: Record<string, any> = {}

  for (const { code } of languages) {
    const rows = await db('translations as t')
      .join('translation_keys as k', 't.key_id', 'k.id')
      .where('t.language_code', code)
      .where('k.project_id', projectId)
      .whereNotNull('t.value')
      .select('k.key', 't.value')

    const flat: Record<string, string> = {}
    for (const row of rows) flat[row.key] = row.value

    combined[code] = unflattenObject(flat, separator)
  }

  const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}_all.json`

  setHeader(event, 'Content-Type', 'application/json')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  return combined
})

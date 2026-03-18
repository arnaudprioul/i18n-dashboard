import { getDb } from '../db/index'
import type { IProjectSnapshot } from '~/interfaces/project-snapshot.interface'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { snapshot, project_id, mode = 'merge' } = body as {
    snapshot: IProjectSnapshot
    project_id?: number
    mode?: 'merge' | 'replace'
  }

  if (!snapshot?.version || !snapshot?.project || !Array.isArray(snapshot.keys)) {
    throw createError({ statusCode: 400, message: 'Invalid snapshot format' })
  }

  const db = getDb()
  let projectId = project_id ? Number(project_id) : null
  let stats = { keys_added: 0, keys_updated: 0, translations_added: 0, translations_updated: 0, languages_added: 0 }

  // ── Resolve or create project ──────────────────────────────────────────
  if (projectId) {
    const existing = await db('projects').where({ id: projectId }).first()
    if (!existing) throw createError({ statusCode: 404, message: 'Target project not found' })
    // Update project metadata
    await db('projects').where({ id: projectId }).update({
      name: snapshot.project.name,
      locales_path: snapshot.project.locales_path,
      key_separator: snapshot.project.key_separator,
      color: snapshot.project.color ?? existing.color,
      description: snapshot.project.description ?? existing.description,
      source_url: snapshot.project.source_url ?? existing.source_url,
    })
  } else {
    // Create new project
    const [id] = await db('projects').insert({
      name: snapshot.project.name,
      locales_path: snapshot.project.locales_path,
      key_separator: snapshot.project.key_separator,
      color: snapshot.project.color ?? '#6366f1',
      description: snapshot.project.description ?? null,
      source_url: snapshot.project.source_url ?? null,
      is_system: false,
    })
    projectId = id
  }

  const separator = snapshot.project.key_separator || '.'

  // ── Upsert languages ──────────────────────────────────────────────────
  for (const lang of snapshot.languages) {
    const existing = await db('languages').where({ project_id: projectId, code: lang.code }).first()
    if (existing) {
      await db('languages').where({ id: existing.id }).update({
        name: lang.name,
        is_default: lang.is_default ? 1 : 0,
        fallback_code: lang.fallback_code ?? null,
      })
    } else {
      await db('languages').insert({
        project_id: projectId,
        code: lang.code,
        name: lang.name,
        is_default: lang.is_default ? 1 : 0,
        fallback_code: lang.fallback_code ?? null,
      })
      stats.languages_added++
    }
  }

  // ── Replace mode: clear existing keys ────────────────────────────────
  if (mode === 'replace') {
    const keyIds = await db('translation_keys').where({ project_id: projectId }).pluck('id')
    if (keyIds.length) {
      await db('translations').whereIn('key_id', keyIds).delete()
      await db('key_usages').whereIn('key_id', keyIds).delete()
      await db('translation_keys').where({ project_id: projectId }).delete()
    }
  }

  // ── Upsert keys + translations ────────────────────────────────────────
  for (const entry of snapshot.keys) {
    if (!entry.key) continue

    let keyRecord = await db('translation_keys').where({ project_id: projectId, key: entry.key }).first()
    if (!keyRecord) {
      const [id] = await db('translation_keys').insert({
        project_id: projectId,
        key: entry.key,
        description: entry.description ?? null,
      })
      keyRecord = { id }
      stats.keys_added++
    } else if (entry.description !== undefined) {
      await db('translation_keys').where({ id: keyRecord.id }).update({ description: entry.description })
      stats.keys_updated++
    }

    for (const [langCode, translationData] of Object.entries(entry.translations)) {
      const value = typeof translationData === 'string' ? translationData : translationData.value
      const status = typeof translationData === 'object' ? (translationData.status ?? 'draft') : 'draft'
      if (!value) continue

      const existing = await db('translations').where({ key_id: keyRecord.id, language_code: langCode }).first()
      if (existing) {
        if (existing.value !== value) {
          await db('translation_history').insert({
            translation_id: existing.id,
            old_value: existing.value,
            new_value: value,
            changed_by: 'snapshot-import',
          })
          await db('translations').where({ id: existing.id }).update({ value, status, updated_at: db.fn.now() })
          stats.translations_updated++
        }
      } else {
        const [id] = await db('translations').insert({
          key_id: keyRecord.id,
          language_code: langCode,
          value,
          status,
        })
        await db('translation_history').insert({
          translation_id: id,
          old_value: null,
          new_value: value,
          changed_by: 'snapshot-import',
        })
        stats.translations_added++
      }
    }
  }

  return { success: true, project_id: projectId, stats }
})

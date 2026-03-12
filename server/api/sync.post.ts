import { resolve, extname, basename } from 'path'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { getDb } from '../db/index'

function flattenObject(obj: Record<string, any>, separator: string, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}${separator}${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, separator, fullKey))
    } else {
      result[fullKey] = String(value ?? '')
    }
  }
  return result
}

async function fetchRemoteLocale(sourceUrl: string, langCode: string): Promise<Record<string, string> | null> {
  const url = `${sourceUrl.replace(/\/$/, '')}/locale/${langCode}.json`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project_id } = body

  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })

  const db = getDb()

  const project = await db('projects').where({ id: Number(project_id) }).first()
  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })
  if (project.is_system) throw createError({ statusCode: 403, message: 'Le projet Dashboard UI ne peut pas être synchronisé.' })

  const hasLocalPath = !!project.root_path
  const hasRemoteUrl = !!project.source_url

  if (!hasLocalPath && !hasRemoteUrl) {
    throw createError({
      statusCode: 400,
      message: 'Ce projet n\'a ni chemin local ni URL distante configuré. Configurez au moins l\'un des deux pour synchroniser.',
    })
  }

  const separator = project.key_separator || '.'
  let added = 0
  let updated = 0
  let syncedFiles: string[] = []

  // ── Local filesystem sync ──────────────────────────────────────────────
  if (hasLocalPath) {
    const absoluteLocalesPath = resolve(project.root_path, project.locales_path)

    if (!existsSync(absoluteLocalesPath)) {
      throw createError({
        statusCode: 404,
        message: `Locales directory not found: ${absoluteLocalesPath}`,
      })
    }

    const files = readdirSync(absoluteLocalesPath)
    const jsonFiles = files.filter((f) => extname(f) === '.json')

    if (jsonFiles.length === 0) {
      return { added: 0, updated: 0, total: 0, message: 'No JSON locale files found' }
    }

    syncedFiles = jsonFiles

    for (const file of jsonFiles) {
      const langCode = basename(file, '.json')
      const filePath = resolve(absoluteLocalesPath, file)

      const existingLang = await db('languages').where({ project_id: Number(project_id), code: langCode }).first()
      if (!existingLang) {
        await db('languages').insert({
          project_id: Number(project_id),
          code: langCode,
          name: langCode.toUpperCase(),
          is_default: false,
        })
      }

      const raw = JSON.parse(readFileSync(filePath, 'utf-8'))
      const flattened = flattenObject(raw, separator)

      const result = await upsertTranslations(db, Number(project_id), langCode, flattened)
      added += result.added
      updated += result.updated
    }
  }
  // ── Remote URL sync ────────────────────────────────────────────────────
  else if (hasRemoteUrl) {
    const languages = await db('languages').where({ project_id: Number(project_id) }).select('code')

    if (languages.length === 0) {
      return {
        added: 0,
        updated: 0,
        total: 0,
        message: 'Aucune langue configurée. Ajoutez des langues avant de synchroniser depuis une URL distante.',
      }
    }

    for (const lang of languages) {
      const primaryUrl = project.source_url?.split(/[\n,]+/).map((u: string) => u.trim()).filter(Boolean)[0] || project.source_url
      const remoteData = await fetchRemoteLocale(primaryUrl, lang.code)
      if (!remoteData) continue

      const flattened = flattenObject(remoteData, separator)
      const result = await upsertTranslations(db, Number(project_id), lang.code, flattened)
      added += result.added
      updated += result.updated
      syncedFiles.push(`${lang.code}.json (remote)`)
    }
  }

  const total = await db('translation_keys').where({ project_id: Number(project_id) }).count('* as count').first()

  return {
    added,
    updated,
    total: Number((total as any)?.count || 0),
    files: syncedFiles,
  }
})

async function upsertTranslations(
  db: any,
  projectId: number,
  langCode: string,
  flattened: Record<string, string>,
): Promise<{ added: number; updated: number }> {
  let added = 0
  let updated = 0

  for (const [key, value] of Object.entries(flattened)) {
    let keyRecord = await db('translation_keys').where({ project_id: projectId, key }).first()
    if (!keyRecord) {
      const [id] = await db('translation_keys').insert({ project_id: projectId, key })
      keyRecord = { id }
      added++
    }

    const existing = await db('translations').where({ key_id: keyRecord.id, language_code: langCode }).first()
    if (existing) {
      if (existing.value !== value) {
        await db('translation_history').insert({
          translation_id: existing.id,
          old_value: existing.value,
          new_value: value,
          changed_by: 'sync',
        })
        await db('translations').where({ id: existing.id }).update({ value, updated_at: db.fn.now() })
        updated++
      }
    } else {
      const [id] = await db('translations').insert({
        key_id: keyRecord.id,
        language_code: langCode,
        value,
        status: 'draft',
      })
      await db('translation_history').insert({
        translation_id: id,
        old_value: null,
        new_value: value,
        changed_by: 'sync',
      })
    }
  }

  return { added, updated }
}

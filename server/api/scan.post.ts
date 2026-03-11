import { resolve } from 'path'
import { getDb } from '../db/index'
import { scanProject, detectLanguages } from '../utils/scanner.uti'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project_id, mode = 'local', root_path: bodyRootPath, url: bodyUrl } = body

  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })

  const db = getDb()
  const project = await db('projects').where({ id: Number(project_id) }).first()
  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })
  if (project.is_system) throw createError({ statusCode: 403, message: 'Cannot scan system project' })

  // ── URL mode: fetch locale files and import keys ───────────────────────
  if (mode === 'url') {
    const baseUrl = (bodyUrl || project.source_url || '').replace(/\/$/, '')
    if (!baseUrl) throw createError({ statusCode: 400, message: 'No URL provided' })

    const languages = await db('languages').where({ project_id: Number(project_id) }).select('code')
    if (!languages.length) throw createError({ statusCode: 400, message: 'No languages configured for this project' })

    const separator = project.key_separator || '.'
    let keysAdded = 0
    let keysFound = 0

    for (const lang of languages) {
      const url = `${baseUrl}/locale/${lang.code}.json`
      let data: Record<string, any>
      try {
        const res = await fetch(url)
        if (!res.ok) continue
        data = await res.json()
      } catch {
        continue
      }

      const flat = flattenObject(data, separator)

      for (const key of Object.keys(flat)) {
        keysFound++
        const existing = await db('translation_keys').where({ project_id: Number(project_id), key }).first()
        if (!existing) {
          await db('translation_keys').insert({
            project_id: Number(project_id),
            key,
            is_unused: false,
            last_scanned_at: db.fn.now(),
          })
          keysAdded++
        } else {
          await db('translation_keys').where({ id: existing.id }).update({ is_unused: false, last_scanned_at: db.fn.now() })
        }
      }
    }

    const totalKeys = await db('translation_keys').where({ project_id: Number(project_id) }).count('* as count').first()
    return { keysImported: keysFound, keysAdded, total: Number((totalKeys as any)?.count || 0) }
  }

  // ── Local mode: scan source files ─────────────────────────────────────
  const rootPath = bodyRootPath || project.root_path
  if (!rootPath) {
    throw createError({ statusCode: 400, message: 'No local path provided. Select a folder or use URL mode.' })
  }

  const settings = await db('settings').select('*')
  const settingsMap: Record<string, string> = {}
  for (const s of settings) settingsMap[s.key] = s.value

  const excludeDirs = (settingsMap['scan_exclude'] || 'node_modules,dist,.nuxt,.output,.git')
    .split(',').map((s) => s.trim()).filter(Boolean)

  const projectRoot = resolve(rootPath)

  // Auto-detect languages from locale files
  const detectedLangs = detectLanguages({ projectRoot, localesPath: project.locales_path })
  let langsAdded = 0
  for (const lang of detectedLangs) {
    const existing = await db('languages').where({ project_id: Number(project_id), code: lang.code }).first()
    if (!existing) {
      await db('languages').insert({ project_id: Number(project_id), code: lang.code, name: lang.name, is_default: false })
      langsAdded++
    }
  }

  // Scan source files
  const { usages, scannedFiles, errors } = scanProject({
    projectRoot,
    excludeDirs,
    extensions: ['.vue', '.ts', '.js', '.mts', '.mjs'],
  })

  const keyMap = new Map<string, typeof usages>()
  for (const usage of usages) {
    const existing = keyMap.get(usage.key) || []
    existing.push(usage)
    keyMap.set(usage.key, existing)
  }

  const now = db.fn.now()
  let keysAdded = 0
  let keysFound = 0

  const existingKeys = await db('translation_keys').where({ project_id: Number(project_id) }).select('id', 'key')
  const existingKeyMap = new Map<string, number>()
  for (const k of existingKeys) existingKeyMap.set(k.key, k.id)

  if (existingKeys.length > 0) {
    await db('key_usages').whereIn('key_id', existingKeys.map(k => k.id)).delete()
  }

  for (const [key, keyUsages] of keyMap.entries()) {
    let keyId = existingKeyMap.get(key)
    if (!keyId) {
      const [id] = await db('translation_keys').insert({ project_id: Number(project_id), key, is_unused: false, last_scanned_at: now })
      keyId = id
      keysAdded++
    } else {
      await db('translation_keys').where({ id: keyId }).update({ is_unused: false, last_scanned_at: now })
    }
    keysFound++

    await db('key_usages').insert(keyUsages.map(u => ({
      key_id: keyId,
      file_path: u.filePath,
      line_number: u.lineNumber,
      detected_function: u.detectedFunction,
      scanned_at: now,
    })))
  }

  const foundKeys = new Set(keyMap.keys())
  const unusedIds = existingKeys.filter(k => !foundKeys.has(k.key)).map(k => k.id)
  if (unusedIds.length > 0) {
    await db('translation_keys').whereIn('id', unusedIds).update({ is_unused: true, last_scanned_at: now })
  }

  const totalKeys = await db('translation_keys').where({ project_id: Number(project_id) }).count('* as count').first()

  return {
    keysFound,
    keysAdded,
    unusedKeys: unusedIds.length,
    scannedFiles: scannedFiles.length,
    total: Number((totalKeys as any)?.count || 0),
    langsDetected: detectedLangs.length,
    langsAdded,
    errors: errors.slice(0, 10),
  }
})

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

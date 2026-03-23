import { resolve, extname, basename } from 'path'
import { mkdtempSync, rmSync, readdirSync, readFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { spawnSync } from 'child_process'
import { getDb } from '../db/index'
import { scanProject, detectLanguages } from '../utils/scanner.util'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project_id, mode = 'local', root_path: bodyRootPath, git_url: gitUrl, git_branch: gitBranch, git_token: gitToken } = body

  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })

  const db = getDb()
  const project = await db('projects').where({ id: Number(project_id) }).first()
  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })
  if (project.is_system) throw createError({ statusCode: 403, message: 'Cannot scan system project' })

  // ── Git mode: clone repo to tmp dir, scan, then clean up ──────────────
  if (mode === 'git') {
    if (!gitUrl) throw createError({ statusCode: 400, message: 'No git repository URL provided' })

    const tmpDir = mkdtempSync(resolve(tmpdir(), 'i18n-scan-'))
    try {
      // Build authenticated URL if token provided
      let cloneUrl = gitUrl
      if (gitToken) {
        const parsed = new URL(gitUrl)
        parsed.username = 'oauth2'
        parsed.password = gitToken
        cloneUrl = parsed.toString()
      }
      // Use spawnSync with an argument array — never concatenate user-supplied
      // branch names into a shell string (command injection risk).
      const gitArgs = ['clone', '--depth', '1']
      if (gitBranch) gitArgs.push('--branch', gitBranch)
      gitArgs.push('--', cloneUrl, tmpDir)
      const gitResult = spawnSync('git', gitArgs, { timeout: 60_000, stdio: 'pipe' })
      if (gitResult.status !== 0) {
        throw new Error(gitResult.stderr?.toString().trim() || 'git clone failed')
      }
    } catch (e: any) {
      rmSync(tmpDir, { recursive: true, force: true })
      // Log the full error server-side; return a generic message to the client
      // to avoid leaking git URL, token hints, or server paths.
      console.error('[i18n-dashboard] git clone error:', e.message)
      throw createError({ statusCode: 400, message: 'Git clone failed. Check the URL, branch, and access token.' })
    }

    try {
      const settings = await db('settings').select('*')
      const settingsMap: Record<string, string> = {}
      for (const s of settings) settingsMap[s.key] = s.value

      const excludeDirs = (settingsMap['scan_exclude'] || 'node_modules,dist,.nuxt,.output,.git')
        .split(',').map((s: string) => s.trim()).filter(Boolean)

      const detectedLangs = detectLanguages({ projectRoot: tmpDir, localesPath: project.locales_path })
      let langsAdded = 0
      for (const lang of detectedLangs) {
        const existing = await db('languages').where({ project_id: Number(project_id), code: lang.code }).first()
        if (!existing) {
          await db('languages').insert({ project_id: Number(project_id), code: lang.code, name: lang.name, is_default: false })
          langsAdded++
        }
      }

      const { usages, scannedFiles, errors } = scanProject({
        projectRoot: tmpDir,
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

      // ── Sync locale JSON files from cloned repo ──────────────────────────
      let translationsAdded = 0
      let translationsUpdated = 0
      const absLocalesPath = resolve(tmpDir, project.locales_path)
      if (existsSync(absLocalesPath)) {
        const jsonFiles = readdirSync(absLocalesPath).filter(f => extname(f) === '.json')
        for (const file of jsonFiles) {
          const langCode = basename(file, '.json')
          if (!/^[a-z]{2}(-[a-z]{2,4})?$/i.test(langCode)) continue
          const raw = JSON.parse(readFileSync(resolve(absLocalesPath, file), 'utf-8'))
          const flattened = flattenObject(raw, project.key_separator || '.')
          const result = await upsertTranslations(db, Number(project_id), langCode, flattened)
          translationsAdded += result.added
          translationsUpdated += result.updated
        }
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
        translationsAdded,
        translationsUpdated,
        errors: errors.slice(0, 10),
      }
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
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

/**
 * Insert translations from locale files only when no value exists.
 * Never overwrites an existing non-empty translation to avoid conflicts.
 */
async function upsertTranslations(
  db: any,
  projectId: number,
  langCode: string,
  flattened: Record<string, string>,
): Promise<{ added: number; updated: number }> {
  let added = 0

  for (const [key, value] of Object.entries(flattened)) {
    if (!value) continue

    let keyRecord = await db('translation_keys').where({ project_id: projectId, key }).first()
    if (!keyRecord) {
      const [id] = await db('translation_keys').insert({ project_id: projectId, key })
      keyRecord = { id }
    }

    const existing = await db('translations').where({ key_id: keyRecord.id, language_code: langCode }).first()
    if (existing) {
      if (existing.value) continue // already has a value — never overwrite
      // empty value in DB — fill it
      await db('translations').where({ id: existing.id }).update({ value, updated_at: db.fn.now() })
      await db('translation_history').insert({ translation_id: existing.id, old_value: null, new_value: value, changed_by: 'sync' })
      added++
    } else {
      const [id] = await db('translations').insert({ key_id: keyRecord.id, language_code: langCode, value, status: 'draft' })
      await db('translation_history').insert({ translation_id: id, old_value: null, new_value: value, changed_by: 'sync' })
      added++
    }
  }

  return { added, updated: 0 }
}

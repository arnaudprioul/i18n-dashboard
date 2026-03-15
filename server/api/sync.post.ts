import { resolve, extname, basename } from 'path'
import { readdirSync, readFileSync, existsSync, mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { execSync } from 'child_process'
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

/**
 * Insert translations only if no value exists in DB.
 * Never overwrites an existing non-empty translation to avoid conflicts.
 */
async function insertIfEmpty(
  db: any,
  projectId: number,
  langCode: string,
  flattened: Record<string, string>,
): Promise<{ added: number; skipped: number }> {
  let added = 0
  let skipped = 0

  for (const [key, value] of Object.entries(flattened)) {
    if (!value) continue

    let keyRecord = await db('translation_keys').where({ project_id: projectId, key }).first()
    if (!keyRecord) {
      const [id] = await db('translation_keys').insert({ project_id: projectId, key })
      keyRecord = { id }
    }

    const existing = await db('translations').where({ key_id: keyRecord.id, language_code: langCode }).first()
    if (existing) {
      // Already has a value — never overwrite
      if (existing.value) {
        skipped++
        continue
      }
      // Empty value in DB — fill it
      await db('translations').where({ id: existing.id }).update({ value, updated_at: db.fn.now() })
      await db('translation_history').insert({ translation_id: existing.id, old_value: null, new_value: value, changed_by: 'sync' })
      added++
    } else {
      const [id] = await db('translations').insert({ key_id: keyRecord.id, language_code: langCode, value, status: 'draft' })
      await db('translation_history').insert({ translation_id: id, old_value: null, new_value: value, changed_by: 'sync' })
      added++
    }
  }

  return { added, skipped }
}

async function syncFromDir(
  db: any,
  projectId: number,
  localesDirPath: string,
  separator: string,
): Promise<{ added: number; skipped: number; files: string[] }> {
  let added = 0
  let skipped = 0
  const files: string[] = []

  if (!existsSync(localesDirPath)) return { added, skipped, files }

  const jsonFiles = readdirSync(localesDirPath).filter(f => extname(f) === '.json')

  for (const file of jsonFiles) {
    const langCode = basename(file, '.json')
    if (!/^[a-z]{2,8}(-[a-z0-9]{1,8})*$/i.test(langCode)) continue

    const existingLang = await db('languages').where({ project_id: projectId, code: langCode }).first()
    if (!existingLang) {
      await db('languages').insert({ project_id: projectId, code: langCode, name: langCode.toUpperCase(), is_default: false })
    }

    const raw = JSON.parse(readFileSync(resolve(localesDirPath, file), 'utf-8'))
    const flattened = flattenObject(raw, separator)
    const result = await insertIfEmpty(db, projectId, langCode, flattened)
    added += result.added
    skipped += result.skipped
    files.push(file)
  }

  return { added, skipped, files }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project_id } = body

  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })

  const db = getDb()
  const project = await db('projects').where({ id: Number(project_id) }).first()
  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })
  if (project.is_system) throw createError({ statusCode: 403, message: 'Le projet Dashboard UI ne peut pas être synchronisé.' })

  const separator = project.key_separator || '.'
  const gitRepo = project.git_repos ? JSON.parse(project.git_repos) : null

  // ── Git mode ────────────────────────────────────────────────────────────────
  if (gitRepo?.url) {
    const tmpDir = mkdtempSync(resolve(tmpdir(), 'i18n-sync-'))
    try {
      let cloneUrl = gitRepo.url
      if (gitRepo.token) {
        const parsed = new URL(gitRepo.url)
        parsed.username = 'oauth2'
        parsed.password = gitRepo.token
        cloneUrl = parsed.toString()
      }
      const branchArgs = gitRepo.branch ? `--branch ${gitRepo.branch} ` : ''
      execSync(`git clone --depth 1 ${branchArgs}-- "${cloneUrl}" "${tmpDir}"`, { timeout: 60_000, stdio: 'pipe' })

      const localesDirPath = resolve(tmpDir, project.locales_path || 'src/locales')
      const { added, skipped, files } = await syncFromDir(db, Number(project_id), localesDirPath, separator)

      const total = await db('translation_keys').where({ project_id: Number(project_id) }).count('* as count').first()
      return { added, skipped, updated: 0, total: Number((total as any)?.count || 0), files }
    } catch (e: any) {
      throw createError({ statusCode: 400, message: `Git sync failed: ${e.message ?? 'unknown'}` })
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  }

  // ── Local filesystem mode ───────────────────────────────────────────────────
  if (!project.root_path) {
    throw createError({ statusCode: 400, message: 'Ce projet n\'a ni chemin local ni dépôt git configuré.' })
  }

  const localesDirPath = resolve(project.root_path, project.locales_path || 'src/locales')
  if (!existsSync(localesDirPath)) {
    throw createError({ statusCode: 404, message: `Locales directory not found: ${localesDirPath}` })
  }

  const { added, skipped, files } = await syncFromDir(db, Number(project_id), localesDirPath, separator)
  const total = await db('translation_keys').where({ project_id: Number(project_id) }).count('* as count').first()

  return { added, skipped, updated: 0, total: Number((total as any)?.count || 0), files }
})

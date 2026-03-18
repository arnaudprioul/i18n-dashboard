import { resolve, relative, basename, join } from 'path'
import { mkdtempSync, rmSync, existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { tmpdir } from 'os'
import { execSync } from 'child_process'
import { LANGUAGES } from '~/consts/languages.const'

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function cleanPackageName(raw: string): string {
  return capitalize(raw.replace(/^@[^/]+\//, '').replace(/[-_]/g, ' '))
}

function langName(code: string): string {
  const found = LANGUAGES.find(l => l.code === code.toLowerCase())
  return found ? found.name : code.toUpperCase()
}

function findLocalesFolder(root: string, maxDepth = 3): { path: string; langs: string[] } | null {
  const EXCLUDE = new Set(['node_modules', 'dist', '.nuxt', '.output', '.git', 'coverage'])
  const LANG_RE = /^[a-z]{2}(-[a-z]{2,4})?\.json$/i
  let best: { relPath: string; langs: string[]; count: number } | null = null

  function walk(dir: string, depth: number) {
    if (depth > maxDepth) return
    let entries: string[]
    try { entries = readdirSync(dir) } catch { return }

    // Check if current dir has lang JSON files
    const langs = entries.filter(f => LANG_RE.test(f)).map(f => basename(f, '.json').toLowerCase())
    if (langs.length > 0) {
      const relPath = relative(root, dir) || '.'
      if (!best || langs.length > best.count) {
        best = { relPath, langs, count: langs.length }
      }
    }

    for (const entry of entries) {
      if (EXCLUDE.has(entry)) continue
      const full = join(dir, entry)
      try {
        if (statSync(full).isDirectory()) walk(full, depth + 1)
      } catch {}
    }
  }

  walk(root, 0)
  return best ? { path: best.relPath, langs: best.langs } : null
}

async function detect(projectRoot: string) {
  let name: string | undefined
  let localesPath: string | undefined
  const languages: Array<{ code: string; name: string }> = []

  // package.json name
  const pkgPath = join(projectRoot, 'package.json')
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      if (pkg.name) name = cleanPackageName(pkg.name)
    } catch {}
  }

  // Locales folder
  const found = findLocalesFolder(projectRoot)
  if (found) {
    localesPath = found.path === '.' ? '' : found.path
    for (const code of found.langs) {
      if (/^[a-z]{2}(-[a-z]{2,4})?$/i.test(code)) {
        languages.push({ code: code.toLowerCase(), name: langName(code) })
      }
    }
  }

  return { name, localesPath, languages }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { root_path, git_url, git_branch, git_token } = body

  if (!root_path && !git_url) {
    throw createError({ statusCode: 400, message: 'root_path or git_url required' })
  }

  if (git_url) {
    const tmpDir = mkdtempSync(resolve(tmpdir(), 'i18n-detect-'))
    try {
      let cloneUrl = git_url
      if (git_token) {
        const parsed = new URL(git_url)
        parsed.username = 'oauth2'
        parsed.password = git_token
        cloneUrl = parsed.toString()
      }
      const branchArgs = git_branch ? `--branch ${git_branch} ` : ''
      execSync(`git clone --depth 1 ${branchArgs}-- "${cloneUrl}" "${tmpDir}"`, { timeout: 60_000, stdio: 'pipe' })
      return await detect(tmpDir)
    } catch (e: any) {
      throw createError({ statusCode: 400, message: `Git clone failed: ${e.message ?? 'unknown'}` })
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  }

  if (!existsSync(root_path)) {
    throw createError({ statusCode: 400, message: `Path does not exist: ${root_path}` })
  }

  return await detect(resolve(root_path))
})

// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { detectLanguages, scanProject } from '~/server/utils/scanner.util'

// ── Temp dir helpers ──────────────────────────────────────────────────────────
const tmpdirs: string[] = []

function createTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scanner-test-'))
  tmpdirs.push(dir)
  return dir
}

function writeFile(dir: string, relPath: string, content: string): string {
  const full = path.join(dir, relPath)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
  return full
}

afterEach(() => {
  for (const dir of tmpdirs) {
    try { fs.rmSync(dir, { recursive: true, force: true }) } catch {}
  }
  tmpdirs.length = 0
})

// ── detectLanguages ───────────────────────────────────────────────────────────
describe('detectLanguages', () => {
  it('returns empty array when locales directory does not exist', () => {
    const root = createTmpDir()
    const result = detectLanguages({ projectRoot: root, localesPath: 'locales' })
    expect(result).toEqual([])
  })

  it('detects languages from JSON files in locales directory', () => {
    const root = createTmpDir()
    writeFile(root, 'locales/en.json', '{}')
    writeFile(root, 'locales/fr.json', '{}')

    const result = detectLanguages({ projectRoot: root, localesPath: 'locales' })
    const codes = result.map(l => l.code).sort()
    expect(codes).toEqual(['en', 'fr'])
  })

  it('ignores non-JSON files in locales directory', () => {
    const root = createTmpDir()
    writeFile(root, 'locales/en.json', '{}')
    writeFile(root, 'locales/readme.txt', 'ignore me')

    const result = detectLanguages({ projectRoot: root, localesPath: 'locales' })
    expect(result).toHaveLength(1)
    expect(result[0].code).toBe('en')
  })

  it('ignores JSON files whose names are not valid locale codes', () => {
    const root = createTmpDir()
    writeFile(root, 'locales/en.json', '{}')
    writeFile(root, 'locales/schema.json', '{}')  // not a locale code

    const result = detectLanguages({ projectRoot: root, localesPath: 'locales' })
    expect(result).toHaveLength(1)
    expect(result[0].code).toBe('en')
  })

  it('detects locale codes from i18n config file', () => {
    const root = createTmpDir()
    writeFile(root, 'i18n.ts', `export default { locales: ['en', 'fr', 'de'] }`)

    const result = detectLanguages({ projectRoot: root, localesPath: 'locales' })
    const codes = result.map(l => l.code).sort()
    expect(codes).toContain('en')
    expect(codes).toContain('fr')
    expect(codes).toContain('de')
  })

  it('marks source as locales-dir for JSON-detected languages', () => {
    const root = createTmpDir()
    writeFile(root, 'locales/es.json', '{}')

    const result = detectLanguages({ projectRoot: root, localesPath: 'locales' })
    expect(result[0].source).toBe('locales-dir')
  })

  it('marks source as config-file for config-detected languages', () => {
    const root = createTmpDir()
    writeFile(root, 'i18n.ts', `export default { locales: ['pt'] }`)

    const result = detectLanguages({ projectRoot: root, localesPath: 'locales' })
    const pt = result.find(l => l.code === 'pt')
    expect(pt?.source).toBe('config-file')
  })
})

// ── scanProject ───────────────────────────────────────────────────────────────
describe('scanProject', () => {
  it('detects $t("key") usages in .vue files', () => {
    const root = createTmpDir()
    writeFile(root, 'App.vue', `<template><p>{{ $t('greeting.hello') }}</p></template>`)

    const { usages } = scanProject({ projectRoot: root })
    const found = usages.find(u => u.key === 'greeting.hello')
    expect(found).toBeDefined()
    expect(found?.detectedFunction).toBe('$t')
  })

  it('detects $t("key") in .ts files', () => {
    const root = createTmpDir()
    writeFile(root, 'utils.ts', `const msg = $t('common.save')`)

    const { usages } = scanProject({ projectRoot: root })
    expect(usages.some(u => u.key === 'common.save')).toBe(true)
  })

  it('detects t("key") when useI18n is present', () => {
    const root = createTmpDir()
    writeFile(root, 'page.vue', `
<script setup>
const { t } = useI18n()
const label = t('auth.login')
</script>`)

    const { usages } = scanProject({ projectRoot: root })
    expect(usages.some(u => u.key === 'auth.login')).toBe(true)
  })

  it('does NOT detect t("key") without useI18n present', () => {
    const root = createTmpDir()
    writeFile(root, 'plain.ts', `function t(k: string) { return k }\nconst x = t('some.key')`)

    const { usages } = scanProject({ projectRoot: root })
    // t() without useI18n pattern must not be detected
    expect(usages.filter(u => u.detectedFunction === 't')).toHaveLength(0)
  })

  it('detects <i18n-t keypath="key"> component usage', () => {
    const root = createTmpDir()
    writeFile(root, 'comp.vue', `<template><i18n-t keypath="nav.home" /></template>`)

    const { usages } = scanProject({ projectRoot: root })
    expect(usages.some(u => u.key === 'nav.home' && u.detectedFunction === 'i18n-t')).toBe(true)
  })

  it('detects v-t="\'key\'" directive', () => {
    const root = createTmpDir()
    writeFile(root, 'directive.vue', `<template><span v-t="'page.title'"></span></template>`)

    const { usages } = scanProject({ projectRoot: root })
    expect(usages.some(u => u.key === 'page.title' && u.detectedFunction === 'v-t')).toBe(true)
  })

  it('deduplicates identical usages', () => {
    const root = createTmpDir()
    // Same $t call appears on same line — dedup by key+file+line+fn
    writeFile(root, 'dup.vue', `<template>{{ $t('btn.ok') }} {{ $t('btn.ok') }}</template>`)

    const { usages } = scanProject({ projectRoot: root })
    const btnOk = usages.filter(u => u.key === 'btn.ok')
    // They are on the same line and same function so they collapse to 1
    expect(btnOk.length).toBe(1)
  })

  it('excludes node_modules by default', () => {
    const root = createTmpDir()
    writeFile(root, 'node_modules/lib/index.ts', `const x = $t('lib.key')`)
    writeFile(root, 'src/app.vue', `<template>{{ $t('app.key') }}</template>`)

    const { usages } = scanProject({ projectRoot: root })
    expect(usages.some(u => u.key === 'lib.key')).toBe(false)
    expect(usages.some(u => u.key === 'app.key')).toBe(true)
  })

  it('returns scannedFiles list relative to project root', () => {
    const root = createTmpDir()
    writeFile(root, 'src/page.ts', `const x = $t('p.key')`)

    const { scannedFiles } = scanProject({ projectRoot: root })
    expect(scannedFiles.some(f => f.includes('page.ts'))).toBe(true)
    // Should be relative, not absolute
    expect(scannedFiles.every(f => !f.startsWith('/'))).toBe(true)
  })

  it('returns empty usages for empty project directory', () => {
    const root = createTmpDir()

    const { usages, scannedFiles, errors } = scanProject({ projectRoot: root })
    expect(usages).toHaveLength(0)
    expect(scannedFiles).toHaveLength(0)
    expect(errors).toHaveLength(0)
  })

  it('respects custom excludeDirs option', () => {
    const root = createTmpDir()
    writeFile(root, 'dist/bundle.ts', `const x = $t('dist.key')`)
    writeFile(root, 'src/main.ts', `const y = $t('main.key')`)

    const { usages } = scanProject({ projectRoot: root, excludeDirs: ['dist'] })
    expect(usages.some(u => u.key === 'dist.key')).toBe(false)
    expect(usages.some(u => u.key === 'main.key')).toBe(true)
  })

  it('records correct line numbers for detections', () => {
    const root = createTmpDir()
    writeFile(root, 'lines.vue', `<template>\n  <p>{{ $t('line.two') }}</p>\n</template>`)

    const { usages } = scanProject({ projectRoot: root })
    const found = usages.find(u => u.key === 'line.two')
    expect(found?.lineNumber).toBe(2)
  })

  it('detects i18n.t() call pattern', () => {
    const root = createTmpDir()
    writeFile(root, 'global.ts', `const label = i18n.t('global.key')`)

    const { usages } = scanProject({ projectRoot: root })
    expect(usages.some(u => u.key === 'global.key' && u.detectedFunction === 'i18n.t')).toBe(true)
  })
})

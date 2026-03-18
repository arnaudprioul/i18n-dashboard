// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..')
const CLI_PATH = resolve(ROOT, 'bin/cli.mjs')
const PKG_PATH = resolve(ROOT, 'package.json')

// ── Structural checks ──────────────────────────────────────────────────────────

describe('bin/cli.mjs — structure', () => {
  it('exists at bin/cli.mjs', () => {
    expect(existsSync(CLI_PATH)).toBe(true)
  })

  it('has the Node.js shebang on the first line', () => {
    const firstLine = readFileSync(CLI_PATH, 'utf-8').split('\n')[0]
    expect(firstLine).toBe('#!/usr/bin/env node')
  })

  it('package.json bin field points to ./bin/cli.mjs', () => {
    const pkg = JSON.parse(readFileSync(PKG_PATH, 'utf-8'))
    expect(pkg.bin?.['i18n-dashboard']).toBe('./bin/cli.mjs')
  })
})

// ── nuxt binary path — global install safety ──────────────────────────────────

describe('bin/cli.mjs — nuxt binary path', () => {
  const cliContent = readFileSync(CLI_PATH, 'utf-8')

  it('uses node_modules/.bin/nuxt relative to packageRoot (not npx nuxt)', () => {
    // The critical fix for global install: spawn the bundled nuxt binary
    // instead of relying on npx resolving nuxt from the user's cwd.
    expect(cliContent).toContain("node_modules/.bin/nuxt")
  })

  it('does not use spawn("npx", ["nuxt", ...]) for build or start fallback', () => {
    // npx would look for nuxt in the user's project, breaking global installs.
    // Match only the spawn calls — comments are allowed to mention npx.
    const spawnNpxNuxt = /spawn\s*\(\s*['"]npx['"]\s*,\s*\[\s*['"]nuxt['"]/
    expect(spawnNpxNuxt.test(cliContent)).toBe(false)
  })

  it('resolves the nuxt binary relative to packageRoot', () => {
    // Must use resolve(packageRoot, 'node_modules/.bin/nuxt') so the path
    // is absolute and works whether installed locally or globally.
    expect(cliContent).toContain("resolve(packageRoot, 'node_modules/.bin/nuxt')")
  })
})

// ── Command name consistency ───────────────────────────────────────────────────

describe('bin/cli.mjs — command name in messages', () => {
  const cliContent = readFileSync(CLI_PATH, 'utf-8')

  it('does not reference the old "vue-i18n-dashboard" command name in any message', () => {
    // Matches console.log/console.error strings containing the old name.
    // We look for it inside string literals (single or double quoted).
    const oldNameInString = /console\.(log|error|warn)\s*\([^)]*vue-i18n-dashboard/
    expect(oldNameInString.test(cliContent)).toBe(false)
  })

  it('references i18n-dashboard in the stop-hint message', () => {
    expect(cliContent).toContain('i18n-dashboard stop')
  })

  it('references i18n-dashboard in the post-build hint message', () => {
    expect(cliContent).toContain('i18n-dashboard start')
  })
})

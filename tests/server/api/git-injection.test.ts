// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..')

const SCAN_PATH = resolve(ROOT, 'src/server/api/scan.post.ts')
const SYNC_PATH = resolve(ROOT, 'src/server/api/sync.post.ts')

// ── Tests ──────────────────────────────────────────────────────────────────────
// These tests act as tripwires: if someone replaces spawnSync (safe) with
// execSync (shell-interpolated, injectable), CI will fail immediately.

describe('scan.post — command injection protection', () => {
  const src = readFileSync(SCAN_PATH, 'utf-8')

  it('uses spawnSync (not execSync) for git clone', () => {
    expect(src).toContain('spawnSync')
  })

  it('does NOT use execSync for git operations', () => {
    expect(src).not.toMatch(/execSync\s*\(/)
  })

  it('imports spawnSync from child_process', () => {
    expect(src).toMatch(/import\s*\{[^}]*spawnSync[^}]*\}\s*from\s*['"]child_process['"]/)
  })

  it('passes git branch as a separate argument (not shell-interpolated)', () => {
    // The branch must be pushed onto an args array, never concatenated into a string command
    expect(src).toMatch(/gitArgs\.push\(['"]--branch['"],\s*gitBranch\)/)
    // Must NOT construct a shell string like `git clone --branch ${gitBranch}`
    expect(src).not.toMatch(/`git\s+clone[^`]*\$\{/)
  })

  it('uses the end-of-options separator (--) before clone URL', () => {
    // Prevents a URL starting with '-' from being treated as a flag
    expect(src).toMatch(/gitArgs\.push\(['"]--['"],/)
  })

  it('logs the real error server-side and returns a generic client message', () => {
    expect(src).toContain('console.error')
    expect(src).toContain('Git clone failed. Check the URL, branch, and access token.')
  })
})

describe('sync.post — command injection protection', () => {
  const src = readFileSync(SYNC_PATH, 'utf-8')

  it('uses spawnSync (not execSync) for git clone', () => {
    expect(src).toContain('spawnSync')
  })

  it('does NOT use execSync for git operations', () => {
    expect(src).not.toMatch(/execSync\s*\(/)
  })

  it('imports spawnSync from child_process', () => {
    expect(src).toMatch(/import\s*\{[^}]*spawnSync[^}]*\}\s*from\s*['"]child_process['"]/)
  })

  it('passes git branch as a separate argument (not shell-interpolated)', () => {
    expect(src).toMatch(/gitArgs\.push\(['"]--branch['"],\s*gitRepo\.branch\)/)
    expect(src).not.toMatch(/`git\s+clone[^`]*\$\{/)
  })

  it('uses the end-of-options separator (--) before clone URL', () => {
    expect(src).toMatch(/gitArgs\.push\(['"]--['"],/)
  })

  it('logs the real error server-side and returns a generic client message', () => {
    expect(src).toContain('console.error')
    expect(src).toContain('Git sync failed. Check the URL, branch, and access token.')
  })
})

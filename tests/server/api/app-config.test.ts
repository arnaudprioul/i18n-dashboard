// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/server/db/index', () => ({ getDb: vi.fn() }))
vi.mock('~/server/utils/project-config.util', () => ({
  readProjectConfig: vi.fn().mockReturnValue({}),
}))

import { getDb } from '~/server/db/index'
import { readProjectConfig } from '~/server/utils/project-config.util'
import handler from '~/server/api/app-config.get'

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeDb(settingsRows: Array<{ key: string; value: string }> = []) {
  const chain = {
    whereIn: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue(settingsRows),
  }
  return vi.fn(() => chain) as any
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/app-config — public endpoint', () => {
  beforeEach(() => {
    vi.mocked(getDb).mockReset()
    vi.mocked(readProjectConfig).mockReturnValue({})
  })

  it('returns null for all fields when DB is empty and no config file', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb([]))

    const result = await (handler as Function)()

    expect(result.branding).toBeNull()
    expect(result.theme).toBeNull()
    expect(result.widgets).toBeNull()
  })

  it('returns branding from DB when config file has no branding', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb([
      { key: 'branding_name', value: 'My Dashboard' },
    ]))

    const result = await (handler as Function)()

    expect(result.branding?.name).toBe('My Dashboard')
  })

  it('returns theme from DB when config file has no theme', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb([
      { key: 'theme_primary', value: 'violet' },
    ]))

    const result = await (handler as Function)()

    expect(result.theme?.primary).toBe('violet')
  })

  it('config file branding overrides DB branding', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb([
      { key: 'branding_name', value: 'DB Name' },
    ]))
    vi.mocked(readProjectConfig).mockReturnValue({
      branding: { name: 'Config File Name' },
    })

    const result = await (handler as Function)()

    expect(result.branding?.name).toBe('Config File Name')
  })

  it('config file theme overrides DB theme', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb([
      { key: 'theme_primary', value: 'blue' },
    ]))
    vi.mocked(readProjectConfig).mockReturnValue({
      theme: { primary: 'violet' },
    })

    const result = await (handler as Function)()

    expect(result.theme?.primary).toBe('violet')
  })

  it('does NOT crash when custom_widgets JSON in DB is corrupted', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb([
      { key: 'custom_widgets', value: 'this { is not } valid json' },
    ]))

    // Must not throw
    const result = await (handler as Function)()
    expect(result.widgets).toBeNull()
  })

  it('returns null widgets when custom_widgets is an empty array in DB', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb([
      { key: 'custom_widgets', value: '[]' },
    ]))

    const result = await (handler as Function)()
    expect(result.widgets).toBeNull()
  })

  it('config file widgets take priority over DB widgets', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb([
      { key: 'custom_widgets', value: JSON.stringify([
        { type: 'db-widget', label: 'DB Widget', sizes: ['md'], defaultSize: 'md',
          config: { kind: 'iframe', url: 'https://db.example.com' } },
      ]) },
    ]))
    vi.mocked(readProjectConfig).mockReturnValue({
      widgets: { custom: [
        { type: 'file-widget', label: 'File Widget', sizes: ['md'], defaultSize: 'md',
          config: { kind: 'iframe', url: 'https://file.example.com' } },
      ] },
    })

    const result = await (handler as Function)()

    expect(result.widgets?.custom).toHaveLength(1)
    expect(result.widgets?.custom?.[0].type).toBe('file-widget')
  })
})

// ── Tripwire: /api/app-config must not require authentication ────────────────

describe('app-config.get.ts — source code tripwires', () => {
  const { readFileSync } = require('fs')
  const { resolve } = require('path')
  const { fileURLToPath } = require('url')
  const ROOT = resolve(fileURLToPath(import.meta.url), '../../../..')
  const src = readFileSync(resolve(ROOT, 'src/server/api/app-config.get.ts'), 'utf-8')

  it('does NOT throw on unauthenticated requests (no auth check)', () => {
    // The endpoint is intentionally public — branding/theme are needed pre-login.
    // If an auth check is accidentally added, this tripwire will catch it.
    expect(src).not.toMatch(/is_super_admin/)
    expect(src).not.toMatch(/requireAuth/)
  })

  it('wraps JSON.parse in a try/catch to prevent crashes on corrupted DB data', () => {
    expect(src).toMatch(/try\s*\{[\s\S]*?JSON\.parse[\s\S]*?\}\s*catch/)
  })
})

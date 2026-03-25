// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/server/db/index', () => ({ getDb: vi.fn() }))
vi.mock('~/server/utils/project-config.util', () => ({
  readProjectConfig: vi.fn().mockReturnValue({}),
}))

import { getDb } from '~/server/db/index'
import getHandler from '~/server/api/admin/customization.get'
import postHandler from '~/server/api/admin/customization.post'

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeEvent(body: Record<string, any> = {}, isSuperAdmin = true) {
  return {
    _body: body,
    context: { user: { id: 1, is_super_admin: isSuperAdmin } },
  }
}

/** Builds a chainable knex-like mock. `rows` are returned by whereIn().select(). */
function makeDb(settingsRows: Array<{ key: string; value: string }> = []) {
  const chain = {
    whereIn: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue(settingsRows),
    where: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(1),
    insert: vi.fn().mockResolvedValue(1),
  }
  const db = vi.fn(() => chain) as any
  db.fn = { now: vi.fn(() => 'NOW()') }
  return { db, chain }
}

const validWidget = {
  type: 'my-metrics',
  label: 'My Metrics',
  description: 'Metrics',
  icon: 'i-heroicons-chart-bar',
  sizes: ['md', 'wide'],
  defaultSize: 'md',
  config: { kind: 'iframe', url: 'https://metrics.example.com/embed' },
}

// ── GET /api/admin/customization ─────────────────────────────────────────────

describe('GET /api/admin/customization — authorization', () => {
  it('returns 403 for non-super-admin users', async () => {
    await expect((getHandler as Function)(makeEvent({}, false)))
      .rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns 403 when user is missing', async () => {
    await expect((getHandler as Function)({ _body: {}, context: {} }))
      .rejects.toMatchObject({ statusCode: 403 })
  })
})

describe('GET /api/admin/customization — data loading', () => {
  beforeEach(() => vi.mocked(getDb).mockReset())

  it('returns empty defaults when no settings in DB', async () => {
    const { db } = makeDb([])
    vi.mocked(getDb).mockReturnValue(db)

    const result = await (getHandler as Function)(makeEvent())

    expect(result.branding).toEqual({ name: '', subtitle: '', logoUrl: '' })
    expect(result.theme).toEqual({ primary: '', neutral: '' })
    expect(result.customWidgets).toEqual([])
  })

  it('returns stored branding values', async () => {
    const { db } = makeDb([
      { key: 'branding_name', value: 'My Dashboard' },
      { key: 'branding_subtitle', value: 'Custom subtitle' },
    ])
    vi.mocked(getDb).mockReturnValue(db)

    const result = await (getHandler as Function)(makeEvent())

    expect(result.branding.name).toBe('My Dashboard')
    expect(result.branding.subtitle).toBe('Custom subtitle')
  })

  it('returns stored theme values', async () => {
    const { db } = makeDb([
      { key: 'theme_primary', value: 'violet' },
      { key: 'theme_neutral', value: 'slate' },
    ])
    vi.mocked(getDb).mockReturnValue(db)

    const result = await (getHandler as Function)(makeEvent())

    expect(result.theme.primary).toBe('violet')
    expect(result.theme.neutral).toBe('slate')
  })

  it('returns custom widgets parsed from JSON', async () => {
    const { db } = makeDb([
      { key: 'custom_widgets', value: JSON.stringify([validWidget]) },
    ])
    vi.mocked(getDb).mockReturnValue(db)

    const result = await (getHandler as Function)(makeEvent())

    expect(result.customWidgets).toHaveLength(1)
    expect(result.customWidgets[0].type).toBe('my-metrics')
  })

  it('returns empty array when custom_widgets JSON is corrupted', async () => {
    const { db } = makeDb([
      { key: 'custom_widgets', value: '{ this is not valid json }}' },
    ])
    vi.mocked(getDb).mockReturnValue(db)

    // Must not throw
    const result = await (getHandler as Function)(makeEvent())
    expect(result.customWidgets).toEqual([])
  })

  it('sets hasConfigFile=false when no config file fields are present', async () => {
    const { db } = makeDb([])
    vi.mocked(getDb).mockReturnValue(db)

    const result = await (getHandler as Function)(makeEvent())
    expect(result.hasConfigFile).toBe(false)
  })
})

// ── POST /api/admin/customization — authorization ────────────────────────────

describe('POST /api/admin/customization — authorization', () => {
  it('returns 403 for non-super-admin', async () => {
    await expect((postHandler as Function)(makeEvent({}, false)))
      .rejects.toMatchObject({ statusCode: 403 })
  })
})

// ── POST /api/admin/customization — input validation ────────────────────────

describe('POST /api/admin/customization — branding validation', () => {
  it('rejects a javascript: logoUrl', async () => {
    await expect((postHandler as Function)(makeEvent({
      branding: { logoUrl: 'javascript:alert(1)' },
    }))).rejects.toMatchObject({ statusCode: 422 })
  })

  it('rejects a data: logoUrl', async () => {
    await expect((postHandler as Function)(makeEvent({
      branding: { logoUrl: 'data:image/svg+xml,<svg/>' },
    }))).rejects.toMatchObject({ statusCode: 422 })
  })

  it('rejects a name longer than 100 characters', async () => {
    await expect((postHandler as Function)(makeEvent({
      branding: { name: 'a'.repeat(101) },
    }))).rejects.toMatchObject({ statusCode: 422 })
  })

  it('rejects a subtitle longer than 200 characters', async () => {
    await expect((postHandler as Function)(makeEvent({
      branding: { subtitle: 'a'.repeat(201) },
    }))).rejects.toMatchObject({ statusCode: 422 })
  })
})

describe('POST /api/admin/customization — theme validation', () => {
  it('rejects an unknown primary color', async () => {
    await expect((postHandler as Function)(makeEvent({
      theme: { primary: 'magenta' },
    }))).rejects.toMatchObject({ statusCode: 422 })
  })

  it('rejects a CSS injection attempt in primary', async () => {
    await expect((postHandler as Function)(makeEvent({
      theme: { primary: 'red; background:url(evil)' },
    }))).rejects.toMatchObject({ statusCode: 422 })
  })

  it('rejects an unknown neutral color', async () => {
    await expect((postHandler as Function)(makeEvent({
      theme: { neutral: 'charcoal' },
    }))).rejects.toMatchObject({ statusCode: 422 })
  })
})

describe('POST /api/admin/customization — widget validation', () => {
  it('rejects a javascript: widget URL', async () => {
    await expect((postHandler as Function)(makeEvent({
      customWidgets: [{ ...validWidget, config: { kind: 'iframe', url: 'javascript:alert(1)' } }],
    }))).rejects.toMatchObject({ statusCode: 422 })
  })

  it('rejects a data: widget URL', async () => {
    await expect((postHandler as Function)(makeEvent({
      customWidgets: [{ ...validWidget, config: { kind: 'iframe', url: 'data:text/html,<b>x</b>' } }],
    }))).rejects.toMatchObject({ statusCode: 422 })
  })

  it('rejects a widget type with invalid characters', async () => {
    await expect((postHandler as Function)(makeEvent({
      customWidgets: [{ ...validWidget, type: 'Widget<XSS>' }],
    }))).rejects.toMatchObject({ statusCode: 422 })
  })

  it('rejects duplicate widget types', async () => {
    await expect((postHandler as Function)(makeEvent({
      customWidgets: [validWidget, { ...validWidget }],
    }))).rejects.toMatchObject({ statusCode: 422 })
  })

  it('rejects more than 20 widgets', async () => {
    const widgets = Array.from({ length: 21 }, (_, i) => ({ ...validWidget, type: `widget-${i}` }))
    await expect((postHandler as Function)(makeEvent({ customWidgets: widgets })))
      .rejects.toMatchObject({ statusCode: 422 })
  })
})

// ── POST /api/admin/customization — happy path ──────────────────────────────

describe('POST /api/admin/customization — persistence', () => {
  beforeEach(() => vi.mocked(getDb).mockReset())

  it('returns { ok: true } on success', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    const result = await (postHandler as Function)(makeEvent({
      branding: { name: 'My App', subtitle: '', logoUrl: '' },
      theme: { primary: 'violet', neutral: 'slate' },
      customWidgets: [validWidget],
    }))

    expect(result).toEqual({ ok: true })
  })

  it('upserts branding_name into settings', async () => {
    const { db, chain } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await (postHandler as Function)(makeEvent({
      branding: { name: 'Acme Dashboard', subtitle: '', logoUrl: '' },
    }))

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'branding_name', value: 'Acme Dashboard' }),
    )
  })

  it('upserts theme_primary into settings', async () => {
    const { db, chain } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await (postHandler as Function)(makeEvent({
      theme: { primary: 'green', neutral: '' },
    }))

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'theme_primary', value: 'green' }),
    )
  })

  it('serialises customWidgets as JSON into settings', async () => {
    const { db, chain } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await (postHandler as Function)(makeEvent({ customWidgets: [validWidget] }))

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'custom_widgets',
        value: JSON.stringify([validWidget]),
      }),
    )
  })
})

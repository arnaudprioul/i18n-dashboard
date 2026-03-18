// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/server/db/index', () => ({
  buildConnectionFromParams: vi.fn().mockReturnValue({ client: 'pg', connection: {} }),
  saveDbOverride: vi.fn(),
  resetDb: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs')
  return { ...actual, existsSync: vi.fn().mockReturnValue(false), writeFileSync: vi.fn(), mkdirSync: vi.fn() }
})

// knex is used to test the DB connection — we control what it returns
let mockRaw = vi.fn()
let mockDestroy = vi.fn().mockResolvedValue(undefined)

vi.mock('knex', () => ({
  default: vi.fn(() => ({ raw: mockRaw, destroy: mockDestroy })),
}))

import handler from '~/server/api/db-config.post'

function makeEvent(body: Record<string, any>) {
  return { _body: body }
}

const pgBody = {
  type: 'postgresql',
  host: '10.0.0.1',
  port: 5432,
  user: 'admin',
  password: 's3cr3t_pass_w0rd!',
  database: 'i18n_db',
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('db-config.post — error message sanitization', () => {
  beforeEach(() => {
    mockRaw = vi.fn()
    mockDestroy = vi.fn().mockResolvedValue(undefined)
  })

  it('returns a generic error message when DB connection fails', async () => {
    mockRaw.mockRejectedValue(
      new Error('ECONNREFUSED: connect ECONNREFUSED 10.0.0.1:5432 — password authentication failed for user "admin"'),
    )

    await expect((handler as Function)(makeEvent(pgBody)))
      .rejects.toMatchObject({ statusCode: 400, message: 'Database connection failed. Please check your settings.' })
  })

  it('does NOT expose the DB host in the error response', async () => {
    mockRaw.mockRejectedValue(new Error('Connection to 10.0.0.1:5432 refused'))

    try {
      await (handler as Function)(makeEvent(pgBody))
    } catch (e: any) {
      expect(e.message).not.toContain('10.0.0.1')
      expect(e.message).not.toContain('5432')
    }
  })

  it('does NOT expose the DB password in the error response', async () => {
    mockRaw.mockRejectedValue(new Error('Auth failed for password: s3cr3t_pass_w0rd!'))

    try {
      await (handler as Function)(makeEvent(pgBody))
    } catch (e: any) {
      expect(e.message).not.toContain('s3cr3t_pass_w0rd!')
    }
  })

  it('does NOT expose the DB username in the error response', async () => {
    mockRaw.mockRejectedValue(new Error('User "admin" has no access to database i18n_db'))

    try {
      await (handler as Function)(makeEvent(pgBody))
    } catch (e: any) {
      expect(e.message).not.toContain('admin')
      expect(e.message).not.toContain('i18n_db')
    }
  })

  it('still returns success when the connection succeeds', async () => {
    mockRaw.mockResolvedValue({ rows: [{ '?column?': 1 }] })

    const result = await (handler as Function)(makeEvent({ ...pgBody, testOnly: true }))
    expect(result).toEqual({ success: true })
  })

  it('does not persist config on testOnly=true', async () => {
    mockRaw.mockResolvedValue({})

    const { saveDbOverride, resetDb } = await import('~/server/db/index')
    vi.mocked(saveDbOverride).mockClear()
    vi.mocked(resetDb).mockClear()

    await (handler as Function)(makeEvent({ ...pgBody, testOnly: true }))

    expect(saveDbOverride).not.toHaveBeenCalled()
    expect(resetDb).not.toHaveBeenCalled()
  })
})

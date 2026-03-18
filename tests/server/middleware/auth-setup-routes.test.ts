// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('h3', () => ({ useSession: vi.fn() }))
vi.mock('~/server/db/index', () => ({ getDb: vi.fn() }))
vi.mock('~/utils/auth.util', () => ({
  sessionConfig: vi.fn(() => ({})),
  canEdit: vi.fn(),
  canApprove: vi.fn(),
  canManageProject: vi.fn(),
  canManageUsers: vi.fn(),
  getUserRole: vi.fn(),
}))

import { useSession } from 'h3'
import { getDb } from '~/server/db/index'
import middleware from '~/server/middleware/auth'

// ── DB mock factory ────────────────────────────────────────────────────────────

function makeDb(userCount: number, user?: Record<string, any>) {
  const chain = {
    where: vi.fn().mockReturnThis(),
    count: vi.fn().mockReturnThis(),
    first: vi.fn()
      .mockResolvedValueOnce({ count: userCount })  // 1st: count('* as count')
      .mockResolvedValueOnce(user),                  // 2nd: where({ id }).first()
  }
  return vi.fn(() => chain) as any
}

function makeEvent(path: string) {
  return { path, context: {} as any }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('auth middleware — SETUP_ONLY_ROUTES (/api/db-config)', () => {
  beforeEach(() => {
    vi.mocked(getDb).mockReset()
    vi.mocked(useSession).mockReset()
  })

  // ── During onboarding (no users yet) ───────────────────────────────────────

  it('allows /api/db-config without auth when no users exist (onboarding in progress)', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb(0))

    const event = makeEvent('/api/db-config')
    await expect((middleware as Function)(event)).resolves.toBeUndefined()
  })

  it('does NOT attach a user to context when accessed during onboarding', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb(0))

    const event = makeEvent('/api/db-config')
    await (middleware as Function)(event)
    expect(event.context.user).toBeUndefined()
  })

  // ── After onboarding (users exist) — unauthenticated ───────────────────────

  it('rejects /api/db-config with 401 when users exist and no session', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb(1))
    vi.mocked(useSession).mockResolvedValue({ data: {} } as any) // no userId

    await expect((middleware as Function)(makeEvent('/api/db-config')))
      .rejects.toMatchObject({ statusCode: 401 })
  })

  // ── After onboarding — authenticated but not super_admin ──────────────────

  it('rejects /api/db-config with 403 when authenticated user is not super_admin', async () => {
    const regularUser = { id: 5, is_active: true, is_super_admin: false }
    vi.mocked(getDb).mockReturnValue(makeDb(1, regularUser))
    vi.mocked(useSession).mockResolvedValue({ data: { userId: 5 } } as any)

    await expect((middleware as Function)(makeEvent('/api/db-config')))
      .rejects.toMatchObject({ statusCode: 403 })
  })

  it('rejects /api/db-config with 403 for admin role (not super_admin)', async () => {
    const adminUser = { id: 3, is_active: true, is_super_admin: false, role: 'admin' }
    vi.mocked(getDb).mockReturnValue(makeDb(2, adminUser))
    vi.mocked(useSession).mockResolvedValue({ data: { userId: 3 } } as any)

    await expect((middleware as Function)(makeEvent('/api/db-config')))
      .rejects.toMatchObject({ statusCode: 403 })
  })

  // ── After onboarding — super_admin ────────────────────────────────────────

  it('allows /api/db-config for super_admin when users exist', async () => {
    const superAdmin = { id: 1, is_active: true, is_super_admin: true }
    vi.mocked(getDb).mockReturnValue(makeDb(1, superAdmin))
    vi.mocked(useSession).mockResolvedValue({ data: { userId: 1 } } as any)

    const event = makeEvent('/api/db-config')
    await expect((middleware as Function)(event)).resolves.toBeUndefined()
    expect(event.context.user).toEqual(superAdmin)
  })

  // ── Normal protected route sanity check ───────────────────────────────────

  it('still rejects a normal protected route with 401 when not authenticated', async () => {
    const db = makeDb(0) // count not needed for this path
    vi.mocked(getDb).mockReturnValue(db)
    vi.mocked(useSession).mockResolvedValue({ data: {} } as any)

    await expect((middleware as Function)(makeEvent('/api/projects')))
      .rejects.toMatchObject({ statusCode: 401 })
  })

  it('allows public routes through without any DB check', async () => {
    // getDb should never be called for truly public routes
    const db = makeDb(0)
    vi.mocked(getDb).mockReturnValue(db)

    await expect((middleware as Function)(makeEvent('/api/auth/login'))).resolves.toBeUndefined()
    expect(db).not.toHaveBeenCalled()
  })
})

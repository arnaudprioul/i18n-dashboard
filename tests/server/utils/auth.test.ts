// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { canEdit, canApprove, canManageProject, canManageUsers, getUserRole } from '~/utils/auth.util'
import { ROLES } from '~/enums/auth.enum'
import type { Role } from '~/types/auth.type'

// ── canEdit ───────────────────────────────────────────────────────────────────
describe('canEdit', () => {
  it('returns false when role is null and isSuperAdmin is false', () => {
    expect(canEdit(null, false)).toBe(false)
  })

  it('returns true for translator role', () => {
    expect(canEdit(ROLES.TRANSLATOR, false)).toBe(true)
  })

  it('returns true for moderator role', () => {
    expect(canEdit(ROLES.MODERATOR, false)).toBe(true)
  })

  it('returns true for admin role', () => {
    expect(canEdit(ROLES.ADMIN, false)).toBe(true)
  })

  it('returns true when isSuperAdmin is true regardless of role', () => {
    expect(canEdit(null, true)).toBe(true)
  })

  it('returns true when both role and isSuperAdmin are set', () => {
    expect(canEdit(ROLES.TRANSLATOR, true)).toBe(true)
  })
})

// ── canApprove ────────────────────────────────────────────────────────────────
describe('canApprove', () => {
  it('returns false for null role and not super_admin', () => {
    expect(canApprove(null, false)).toBe(false)
  })

  it('returns false for translator role', () => {
    expect(canApprove(ROLES.TRANSLATOR, false)).toBe(false)
  })

  it('returns true for moderator role', () => {
    expect(canApprove(ROLES.MODERATOR, false)).toBe(true)
  })

  it('returns true for admin role', () => {
    expect(canApprove(ROLES.ADMIN, false)).toBe(true)
  })

  it('returns true when isSuperAdmin regardless of role', () => {
    expect(canApprove(null, true)).toBe(true)
    expect(canApprove(ROLES.TRANSLATOR, true)).toBe(true)
  })
})

// ── canManageProject ──────────────────────────────────────────────────────────
describe('canManageProject', () => {
  it('returns false for null role and not super_admin', () => {
    expect(canManageProject(null, false)).toBe(false)
  })

  it('returns false for translator role', () => {
    expect(canManageProject(ROLES.TRANSLATOR, false)).toBe(false)
  })

  it('returns false for moderator role', () => {
    expect(canManageProject(ROLES.MODERATOR, false)).toBe(false)
  })

  it('returns true for admin role', () => {
    expect(canManageProject(ROLES.ADMIN, false)).toBe(true)
  })

  it('returns true when isSuperAdmin regardless of role', () => {
    expect(canManageProject(null, true)).toBe(true)
    expect(canManageProject(ROLES.TRANSLATOR, true)).toBe(true)
    expect(canManageProject(ROLES.MODERATOR, true)).toBe(true)
  })
})

// ── canManageUsers ────────────────────────────────────────────────────────────
describe('canManageUsers', () => {
  it('returns false for null role and not super_admin', () => {
    expect(canManageUsers(null, false)).toBe(false)
  })

  it('returns false for translator role', () => {
    expect(canManageUsers(ROLES.TRANSLATOR, false)).toBe(false)
  })

  it('returns false for moderator role', () => {
    expect(canManageUsers(ROLES.MODERATOR, false)).toBe(false)
  })

  it('returns true for admin role', () => {
    expect(canManageUsers(ROLES.ADMIN, false)).toBe(true)
  })

  it('returns true when isSuperAdmin regardless of role', () => {
    expect(canManageUsers(null, true)).toBe(true)
    expect(canManageUsers(ROLES.TRANSLATOR, true)).toBe(true)
  })
})

// ── getUserRole ───────────────────────────────────────────────────────────────
function makeDbMock(specificRole: any, globalRole: any) {
  const chain = {
    where: vi.fn().mockReturnThis(),
    whereNull: vi.fn().mockReturnThis(),
    first: vi.fn(),
  }

  chain.first
    .mockResolvedValueOnce(specificRole)
    .mockResolvedValueOnce(globalRole)

  const db = vi.fn(() => chain) as any
  return { db, chain }
}

vi.mock('~/server/db/index', () => ({
  getDb: vi.fn(),
}))

import { getDb } from '~/server/db/index'

describe('getUserRole', () => {
  beforeEach(() => {
    vi.mocked(getDb).mockReset()
  })

  it('returns the specific project role when found', async () => {
    const chain = {
      where: vi.fn().mockReturnThis(),
      whereNull: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValueOnce({ role: 'admin' }).mockResolvedValueOnce(null),
    }
    vi.mocked(getDb).mockReturnValue(vi.fn(() => chain) as any)

    const role = await getUserRole(1, 10)
    expect(role).toBe('admin')
  })

  it('falls back to global role when no specific project role exists', async () => {
    const chain = {
      where: vi.fn().mockReturnThis(),
      whereNull: vi.fn().mockReturnThis(),
      first: vi.fn()
        .mockResolvedValueOnce(undefined)        // no specific role
        .mockResolvedValueOnce({ role: 'moderator' }), // global role
    }
    vi.mocked(getDb).mockReturnValue(vi.fn(() => chain) as any)

    const role = await getUserRole(1, 10)
    expect(role).toBe('moderator')
  })

  it('returns null when neither specific nor global role exists', async () => {
    const chain = {
      where: vi.fn().mockReturnThis(),
      whereNull: vi.fn().mockReturnThis(),
      first: vi.fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined),
    }
    vi.mocked(getDb).mockReturnValue(vi.fn(() => chain) as any)

    const role = await getUserRole(1, 10)
    expect(role).toBeNull()
  })

  it('returns translator role from specific project assignment', async () => {
    const chain = {
      where: vi.fn().mockReturnThis(),
      whereNull: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValueOnce({ role: 'translator' }),
    }
    vi.mocked(getDb).mockReturnValue(vi.fn(() => chain) as any)

    const role = await getUserRole(5, 20)
    expect(role).toBe('translator')
  })

  it('specific role takes priority over global role', async () => {
    const chain = {
      where: vi.fn().mockReturnThis(),
      whereNull: vi.fn().mockReturnThis(),
      first: vi.fn()
        .mockResolvedValueOnce({ role: 'translator' }) // specific
        .mockResolvedValueOnce({ role: 'admin' }),      // global (should NOT be used)
    }
    vi.mocked(getDb).mockReturnValue(vi.fn(() => chain) as any)

    const role = await getUserRole(3, 15)
    expect(role).toBe('translator')
    // second first() should never be called
    expect(chain.first).toHaveBeenCalledTimes(1)
  })
})

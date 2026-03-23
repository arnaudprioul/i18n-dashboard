// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

vi.mock('bcryptjs', () => ({ default: { hash: vi.fn().mockResolvedValue('$2b$12$hashed') } }))
vi.mock('~/server/db/index', () => ({ getDb: vi.fn() }))
vi.mock('~/server/utils/auth.util', () => ({
  getUserRole: vi.fn().mockResolvedValue('admin'),
  canManageUsers: vi.fn().mockReturnValue(true),
}))
vi.mock('~/server/utils/mailer.util', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  inviteEmailHtml: vi.fn().mockReturnValue('<html>invite</html>'),
}))

import { getDb } from '~/server/db/index'
import handler from '~/server/api/users/index.post'

const USERS_POST_PATH = resolve(
  fileURLToPath(import.meta.url),
  '../../../../../src/server/api/users/index.post.ts',
)

// ── DB mock factory ────────────────────────────────────────────────────────────

function makeDb() {
  const usersChain = {
    where: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),   // no existing user with that email
    insert: vi.fn().mockResolvedValue([42]),   // new user id = 42
  }
  const rolesChain = {
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue([1]),
  }
  const projectsChain = {
    where: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue({ id: 1, name: 'My Project' }),
  }
  const settingsChain = {
    where: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),   // no dashboard_url override in settings
  }

  const db = vi.fn((table: string) => {
    if (table === 'users') return usersChain
    if (table === 'user_project_roles') return rolesChain
    if (table === 'projects') return projectsChain
    if (table === 'settings') return settingsChain
    return usersChain
  }) as any

  return { db, usersChain }
}

function makeEvent(body: Record<string, any>, isSuperAdmin = true) {
  return {
    _body: body,
    context: { user: { id: 99, is_super_admin: isSuperAdmin } },
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('users/index.post — password security', () => {
  beforeEach(() => vi.mocked(getDb).mockReset())

  // ── tempPassword must never appear in the API response ────────────────────

  it('does NOT include tempPassword in the API response', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    const result = await (handler as Function)(
      makeEvent({ name: 'Alice', email: 'alice@test.com', role: 'translator', project_ids: [1] }),
    )

    expect(result).not.toHaveProperty('tempPassword')
  })

  it('returns only id, email, and name in the response', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    const result = await (handler as Function)(
      makeEvent({ name: 'Alice', email: 'alice@test.com', role: 'translator', project_ids: [1] }),
    )

    expect(Object.keys(result).sort()).toEqual(['email', 'id', 'name'])
  })

  it('returns the correct user id and normalised email', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    const result = await (handler as Function)(
      makeEvent({ name: 'Bob', email: '  Bob@Test.COM  ', role: 'moderator', project_ids: [1] }),
    )

    expect(result.id).toBe(42)
    expect(result.email).toBe('bob@test.com')
    expect(result.name).toBe('Bob')
  })

  // ── Cryptographically secure password generation ──────────────────────────

  it('uses crypto.randomBytes for password generation (not Math.random)', () => {
    const src = readFileSync(USERS_POST_PATH, 'utf-8')
    // Must import randomBytes from the crypto module
    expect(src).toMatch(/import\s*\{[^}]*randomBytes[^}]*\}\s*from\s*['"]crypto['"]/)
    // Must use randomBytes in generateTempPassword
    expect(src).toContain('randomBytes')
    // Must NOT fall back to Math.random()
    expect(src).not.toMatch(/Math\.random\(\)/)
  })

  // ── Input validation ──────────────────────────────────────────────────────

  it('throws 400 when name is missing', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent({ email: 'alice@test.com', role: 'translator' })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when email is missing', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent({ name: 'Alice', role: 'translator' })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for an invalid role', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent({ name: 'Alice', email: 'alice@test.com', role: 'supervillain' })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 409 when email is already in use', async () => {
    const { db, usersChain } = makeDb()
    // Override: existing user found with that email
    usersChain.first.mockResolvedValue({ id: 1, email: 'alice@test.com' })
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent({ name: 'Alice', email: 'alice@test.com', role: 'translator' })),
    ).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 403 when a non-super-admin tries to create a super_admin user', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(
        makeEvent(
          { name: 'Evil', email: 'evil@test.com', role: 'admin', project_id: 1, is_super_admin: true },
          false, // isSuperAdmin = false for the current user
        ),
      ),
    ).rejects.toMatchObject({ statusCode: 403 })
  })
})

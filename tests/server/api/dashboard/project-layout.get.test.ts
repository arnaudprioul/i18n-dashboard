// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/server/db/index', () => ({ getDb: vi.fn() }))
vi.mock('~/server/utils/auth.util', () => ({ requireAuth: vi.fn() }))

import { getDb } from '~/server/db/index'
import { requireAuth } from '~/server/utils/auth.util'
import handler from '~/server/api/dashboard/project-layout.get'

// ── DB mock helpers ────────────────────────────────────────────────────────────

function makeDb(row: Record<string, any> | undefined) {
  const chain = {
    where: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(row),
  }
  return vi.fn(() => chain) as any
}

function makeEvent(query: Record<string, any> = {}) {
  return { _query: query }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('dashboard/project-layout.get', () => {
  beforeEach(() => {
    vi.mocked(getDb).mockReset()
    vi.mocked(requireAuth).mockReset()
    vi.mocked(requireAuth).mockResolvedValue({ id: 7, is_super_admin: false } as any)
  })

  it('returns null when no setting row exists', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb(undefined))

    const result = await (handler as Function)(makeEvent({ project_id: '5' }))
    expect(result).toBeNull()
  })

  it('returns null when row has no value', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb({ key: 'dashboard_project_layout_7_5', value: null }))

    const result = await (handler as Function)(makeEvent({ project_id: '5' }))
    expect(result).toBeNull()
  })

  it('returns parsed JSON when row exists', async () => {
    const layout = [{ id: 'w1', type: 'stat-keys', size: 'sm' }]
    vi.mocked(getDb).mockReturnValue(makeDb({ key: 'dashboard_project_layout_7_5', value: JSON.stringify(layout) }))

    const result = await (handler as Function)(makeEvent({ project_id: '5' }))
    expect(result).toEqual(layout)
  })

  it('returns null when row value is invalid JSON', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb({ key: 'dashboard_project_layout_7_5', value: 'not-json{{{' }))

    const result = await (handler as Function)(makeEvent({ project_id: '5' }))
    expect(result).toBeNull()
  })

  it('uses the correct setting key: dashboard_project_layout_{userId}_{projectId}', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: 42, is_super_admin: false } as any)
    const chain = { where: vi.fn().mockReturnThis(), first: vi.fn().mockResolvedValue(undefined) }
    const db = vi.fn(() => chain) as any
    vi.mocked(getDb).mockReturnValue(db)

    await (handler as Function)(makeEvent({ project_id: '99' }))

    expect(chain.where).toHaveBeenCalledWith({ key: 'dashboard_project_layout_42_99' })
  })

  it('throws 400 when project_id is missing', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb(undefined))

    await expect((handler as Function)(makeEvent({}))).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when project_id is 0', async () => {
    vi.mocked(getDb).mockReturnValue(makeDb(undefined))

    await expect((handler as Function)(makeEvent({ project_id: '0' }))).rejects.toMatchObject({ statusCode: 400 })
  })
})

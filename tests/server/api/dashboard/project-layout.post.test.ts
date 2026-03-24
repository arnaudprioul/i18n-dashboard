// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/server/db/index', () => ({ getDb: vi.fn() }))
vi.mock('~/server/utils/auth.util', () => ({ requireAuth: vi.fn() }))

import { getDb } from '~/server/db/index'
import { requireAuth } from '~/server/utils/auth.util'
import handler from '~/server/api/dashboard/project-layout.post'

// ── DB mock helpers ────────────────────────────────────────────────────────────

function makeDb() {
  const chain = {
    insert: vi.fn().mockReturnThis(),
    onConflict: vi.fn().mockReturnThis(),
    merge: vi.fn().mockResolvedValue(undefined),
  }
  const db = vi.fn(() => chain) as any
  db.fn = { now: vi.fn(() => 'NOW()') }
  return { db, chain }
}

function makeEvent(body: Record<string, any>) {
  return { _body: body }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('dashboard/project-layout.post', () => {
  beforeEach(() => {
    vi.mocked(getDb).mockReset()
    vi.mocked(requireAuth).mockReset()
    vi.mocked(requireAuth).mockResolvedValue({ id: 7, is_super_admin: false } as any)
  })

  it('returns { ok: true } on success', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    const result = await (handler as Function)(makeEvent({
      project_id: 5,
      widgets: [{ id: 'w1', type: 'stat-keys', size: 'sm' }],
    }))

    expect(result).toEqual({ ok: true })
  })

  it('inserts with the correct setting key', async () => {
    vi.mocked(requireAuth).mockResolvedValue({ id: 42, is_super_admin: false } as any)
    const { db, chain } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await (handler as Function)(makeEvent({ project_id: 99, widgets: [] }))

    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'dashboard_project_layout_42_99' }),
    )
  })

  it('stores the widgets as serialized JSON', async () => {
    const { db, chain } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    const widgets = [
      { id: 'proj-1', type: 'stat-keys', size: 'sm', dataSource: { type: 'project', projectId: 5 } },
      { id: 'proj-2', type: 'stat-coverage', size: 'sm', dataSource: { type: 'project', projectId: 5 } },
    ]

    await (handler as Function)(makeEvent({ project_id: 5, widgets }))

    const insertArg = chain.insert.mock.calls[0][0]
    expect(insertArg.value).toBe(JSON.stringify(widgets))
  })

  it('calls onConflict("key").merge() for upsert', async () => {
    const { db, chain } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await (handler as Function)(makeEvent({ project_id: 5, widgets: [] }))

    expect(chain.onConflict).toHaveBeenCalledWith('key')
    expect(chain.merge).toHaveBeenCalled()
  })

  it('throws 400 when project_id is missing', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent({ widgets: [] })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when project_id is 0', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent({ project_id: 0, widgets: [] })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})

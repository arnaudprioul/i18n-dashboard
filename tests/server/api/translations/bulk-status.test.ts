// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TRANSLATION_STATUS } from '~/server/enums/translation.enum'

vi.mock('~/server/db/index', () => ({ getDb: vi.fn() }))

import { getDb } from '~/server/db/index'
import handler from '~/server/api/translations/bulk-status.post'

// ── DB mock helpers ────────────────────────────────────────────────────────────

function makeDb() {
  let capturedUpdate: Record<string, any> | null = null

  const chain = {
    whereIn: vi.fn().mockReturnThis(),
    update: vi.fn().mockImplementation((data: Record<string, any>) => {
      capturedUpdate = data
      return Promise.resolve(1)
    }),
  }

  const db = vi.fn(() => chain) as any
  db.fn = { now: vi.fn(() => 'NOW()') }
  // db.ref() simulates a Knex column reference (used for approved_value = db.ref('value'))
  db.ref = vi.fn((col: string) => `__REF(${col})__`)

  return { db, chain, getUpdate: () => capturedUpdate }
}

function makeEvent(body: Record<string, any>) {
  return { _body: body }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('translations/bulk-status.post — approved_value', () => {
  beforeEach(() => {
    vi.mocked(getDb).mockReset()
  })

  it('includes approved_value = db.ref("value") when bulk-approving', async () => {
    const { db, getUpdate } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    const result = await (handler as Function)(
      makeEvent({ ids: [1, 2, 3], status: TRANSLATION_STATUS.APPROVED }),
    )

    expect(getUpdate()).toHaveProperty('approved_value')
    // The value should be a Knex column reference pointing to the current value column
    expect(getUpdate()?.approved_value).toBe('__REF(value)__')
    expect(getUpdate()?.status).toBe(TRANSLATION_STATUS.APPROVED)
    expect(result).toEqual({ updated: 3 })
  })

  it('does NOT include approved_value when bulk-setting status to draft', async () => {
    const { db, getUpdate } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await (handler as Function)(makeEvent({ ids: [1, 2], status: TRANSLATION_STATUS.DRAFT }))

    expect(getUpdate()).not.toHaveProperty('approved_value')
    expect(getUpdate()?.status).toBe(TRANSLATION_STATUS.DRAFT)
  })

  it('does NOT include approved_value when bulk-setting status to reviewed', async () => {
    const { db, getUpdate } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await (handler as Function)(makeEvent({ ids: [1], status: TRANSLATION_STATUS.REVIEWED }))

    expect(getUpdate()).not.toHaveProperty('approved_value')
  })

  it('does NOT include approved_value when bulk-setting status to rejected', async () => {
    const { db, getUpdate } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await (handler as Function)(makeEvent({ ids: [4, 5], status: TRANSLATION_STATUS.REJECTED }))

    expect(getUpdate()).not.toHaveProperty('approved_value')
  })

  it('returns the count of updated translations', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    const result = await (handler as Function)(
      makeEvent({ ids: [10, 20, 30, 40], status: TRANSLATION_STATUS.APPROVED }),
    )

    expect(result).toEqual({ updated: 4 })
  })

  it('calls whereIn with the provided ids', async () => {
    const { db, chain } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await (handler as Function)(
      makeEvent({ ids: [7, 8, 9], status: TRANSLATION_STATUS.APPROVED }),
    )

    expect(chain.whereIn).toHaveBeenCalledWith('id', [7, 8, 9])
  })

  it('throws 400 when ids is empty', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent({ ids: [], status: TRANSLATION_STATUS.APPROVED })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when ids is missing', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent({ status: TRANSLATION_STATUS.APPROVED })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when status is missing', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent({ ids: [1, 2] })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for an invalid status value', async () => {
    const { db } = makeDb()
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent({ ids: [1], status: 'published' })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})

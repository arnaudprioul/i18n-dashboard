// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TRANSLATION_STATUS } from '~/server/enums/translation.enum'

vi.mock('~/server/db/index', () => ({ getDb: vi.fn() }))

import { getDb } from '~/server/db/index'
import handler from '~/server/api/translations/status.post'

// ── DB mock helpers ────────────────────────────────────────────────────────────

function makeDb(existing: Record<string, any> | undefined) {
  let capturedUpdate: Record<string, any> | null = null

  const chain = {
    where: vi.fn().mockReturnThis(),
    first: vi.fn()
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(existing ? { ...existing, status: 'result' } : undefined),
    update: vi.fn().mockImplementation((data: Record<string, any>) => {
      capturedUpdate = data
      return Promise.resolve(1)
    }),
  }

  const db = vi.fn(() => chain) as any
  db.fn = { now: vi.fn(() => 'NOW()') }

  return { db, getUpdate: () => capturedUpdate }
}

function makeEvent(body: Record<string, any>) {
  return { _body: body }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('translations/status.post — approved_value', () => {
  beforeEach(() => {
    vi.mocked(getDb).mockReset()
  })

  it('sets approved_value to current value when approving', async () => {
    const existing = { id: 5, value: 'Bonjour', status: TRANSLATION_STATUS.DRAFT }
    const { db, getUpdate } = makeDb(existing)
    vi.mocked(getDb).mockReturnValue(db)

    await (handler as Function)(makeEvent({ key_id: 1, language_code: 'fr', status: TRANSLATION_STATUS.APPROVED }))

    expect(getUpdate()?.approved_value).toBe('Bonjour')
    expect(getUpdate()?.status).toBe(TRANSLATION_STATUS.APPROVED)
  })

  it('does not touch approved_value when setting status to draft', async () => {
    const existing = { id: 5, value: 'Bonjour', status: TRANSLATION_STATUS.REVIEWED }
    const { db, getUpdate } = makeDb(existing)
    vi.mocked(getDb).mockReturnValue(db)

    await (handler as Function)(makeEvent({ key_id: 1, language_code: 'fr', status: TRANSLATION_STATUS.DRAFT }))

    expect(getUpdate()).not.toHaveProperty('approved_value')
    expect(getUpdate()?.status).toBe(TRANSLATION_STATUS.DRAFT)
  })

  it('does not touch approved_value when setting status to reviewed', async () => {
    const existing = { id: 5, value: 'Bonjour', status: TRANSLATION_STATUS.DRAFT }
    const { db, getUpdate } = makeDb(existing)
    vi.mocked(getDb).mockReturnValue(db)

    await (handler as Function)(makeEvent({ key_id: 1, language_code: 'fr', status: TRANSLATION_STATUS.REVIEWED }))

    expect(getUpdate()).not.toHaveProperty('approved_value')
  })

  it('does not touch approved_value when setting status to rejected', async () => {
    const existing = { id: 5, value: 'Bonjour', status: TRANSLATION_STATUS.REVIEWED }
    const { db, getUpdate } = makeDb(existing)
    vi.mocked(getDb).mockReturnValue(db)

    await (handler as Function)(makeEvent({ key_id: 1, language_code: 'fr', status: TRANSLATION_STATUS.REJECTED }))

    expect(getUpdate()).not.toHaveProperty('approved_value')
  })

  it('approved_value captures the value at approval time, not a later edit', async () => {
    const existing = { id: 7, value: 'Hello world', status: TRANSLATION_STATUS.DRAFT }
    const { db, getUpdate } = makeDb(existing)
    vi.mocked(getDb).mockReturnValue(db)

    await (handler as Function)(makeEvent({ key_id: 2, language_code: 'en', status: TRANSLATION_STATUS.APPROVED }))

    expect(getUpdate()?.approved_value).toBe('Hello world')
  })

  it('throws 400 when key_id is missing', async () => {
    const { db } = makeDb(undefined)
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent({ language_code: 'fr', status: TRANSLATION_STATUS.APPROVED })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when language_code is missing', async () => {
    const { db } = makeDb(undefined)
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent({ key_id: 1, status: TRANSLATION_STATUS.APPROVED })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 when status is missing', async () => {
    const { db } = makeDb(undefined)
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent({ key_id: 1, language_code: 'fr' })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 400 for an invalid status value', async () => {
    const { db } = makeDb(undefined)
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent({ key_id: 1, language_code: 'fr', status: 'published' })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 404 when the translation does not exist', async () => {
    const { db } = makeDb(undefined) // first() returns undefined → not found
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent({ key_id: 99, language_code: 'fr', status: TRANSLATION_STATUS.APPROVED })),
    ).rejects.toMatchObject({ statusCode: 404 })
  })
})

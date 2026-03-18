// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('~/server/db/index', () => ({ getDb: vi.fn() }))
vi.mock('#server/utils/lang-api.util', () => ({
  // passthrough: let us verify the flat object that was built before unflattening
  unflattenObject: vi.fn((flat: Record<string, string>) => flat),
}))

import { getDb } from '~/server/db/index'
import { unflattenObject } from '#server/utils/lang-api.util'
import handler from '~/server/routes/locale/[lang].get'

// ── DB mock factory ────────────────────────────────────────────────────────────

type TranslationRow = { key: string; value: string }

/**
 * Builds a Knex-like mock that routes calls by table name and captures
 * the column arguments passed to whereNotNull() and select() on the
 * translations query so tests can assert them.
 */
function makeLocaleDb(translationRows: TranslationRow[] = []) {
  const capturedWhereNotNull: string[] = []
  const capturedSelect: string[] = []

  // translations chain (most complex — we want to spy on column names)
  const tChain: Record<string, any> = {}
  tChain.join = vi.fn(() => tChain)
  tChain.where = vi.fn(() => tChain)
  tChain.whereNotNull = vi.fn((col: string) => {
    capturedWhereNotNull.push(col)
    return tChain
  })
  tChain.select = vi.fn((...args: string[]) => {
    capturedSelect.push(...args)
    return Promise.resolve(translationRows)
  })

  // languages chain (for fallback chain resolution)
  const langChain = {
    where: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue({ id: 1, code: 'fr', fallback_code: null }),
  }

  // projects chain (project lookup + separator)
  const projectsChain = {
    where: vi.fn().mockReturnThis(),
    whereNotNull: vi.fn().mockReturnThis(),
    where2: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue([]),
    first: vi.fn().mockResolvedValue({ id: 1, key_separator: '.', source_url: null, is_system: false }),
  }

  const db = vi.fn((table: string) => {
    if (table === 'translations as t') return tChain
    if (table === 'languages') return langChain
    return projectsChain
  }) as any

  db.fn = { now: vi.fn(() => 'NOW()') }

  return { db, capturedWhereNotNull, capturedSelect }
}

function makeEvent(path: string, query: Record<string, any> = {}) {
  return {
    path,
    _path: path,
    _query: query,
    _headers: {},
    _params: {},
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('locale/[lang].get — serves only approved_value', () => {
  beforeEach(() => {
    vi.mocked(getDb).mockReset()
    vi.mocked(unflattenObject).mockClear()
  })

  it('queries approved_value instead of value', async () => {
    const { db, capturedSelect } = makeLocaleDb([])
    vi.mocked(getDb).mockReturnValue(db)

    await (handler as Function)(makeEvent('/locale/fr.json', { project_id: 1 }))

    // The select must reference approved_value, not the raw value column
    expect(capturedSelect.join(' ')).toContain('approved_value')
    expect(capturedSelect.join(' ')).not.toContain('t.value')
  })

  it('filters with whereNotNull on approved_value, not value', async () => {
    const { db, capturedWhereNotNull } = makeLocaleDb([])
    vi.mocked(getDb).mockReturnValue(db)

    await (handler as Function)(makeEvent('/locale/fr.json', { project_id: 1 }))

    expect(capturedWhereNotNull).toContain('t.approved_value')
    expect(capturedWhereNotNull).not.toContain('t.value')
  })

  it('returns only translations that have an approved_value', async () => {
    const rows = [
      { key: 'hello', value: 'Bonjour' },
      { key: 'save', value: 'Enregistrer' },
    ]
    const { db } = makeLocaleDb(rows)
    vi.mocked(getDb).mockReturnValue(db)

    const result = await (handler as Function)(makeEvent('/locale/fr.json', { project_id: 1 }))

    // unflattenObject is a passthrough mock so the result is the flat object
    expect(result).toEqual({ hello: 'Bonjour', save: 'Enregistrer' })
  })

  it('returns an empty object when no translations have been approved', async () => {
    const { db } = makeLocaleDb([]) // no rows → nothing approved
    vi.mocked(getDb).mockReturnValue(db)

    const result = await (handler as Function)(makeEvent('/locale/fr.json', { project_id: 1 }))

    expect(result).toEqual({})
  })

  it('does not include a key whose translation is still in draft (approved_value is null)', async () => {
    // Simulate: the DB correctly returns nothing for draft translations
    // because the WHERE approved_value IS NOT NULL filter excludes them.
    // The test verifies the query never contains a draft-only key.
    const rows = [
      { key: 'approved.key', value: 'Approved text' },
      // 'draft.key' would have been filtered out at DB level
    ]
    const { db } = makeLocaleDb(rows)
    vi.mocked(getDb).mockReturnValue(db)

    const result = await (handler as Function)(makeEvent('/locale/fr.json', { project_id: 1 }))

    expect(result).toHaveProperty('approved.key', 'Approved text')
    expect(result).not.toHaveProperty('draft.key')
  })

  it('throws 404 when no project can be resolved', async () => {
    const { db } = makeLocaleDb([])
    // Override projects chain to return nothing
    const noProjectChain = {
      where: vi.fn().mockReturnThis(),
      whereNotNull: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue([]),
      first: vi.fn().mockResolvedValue(null), // no project found
    }
    db.mockImplementation((table: string) => {
      if (table === 'projects') return noProjectChain
      return noProjectChain
    })
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent('/locale/fr.json')),
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 400 when no lang is provided in the URL', async () => {
    const { db } = makeLocaleDb([])
    vi.mocked(getDb).mockReturnValue(db)

    await expect(
      (handler as Function)(makeEvent('/locale/.json', { project_id: 1 })),
    ).rejects.toMatchObject({ statusCode: 400 })
  })
})

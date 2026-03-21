// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createJob, getJob, runTranslationJob } from '~/utils/translation-job.util'
import { JOB_STATUS } from '~/enums/translation-job.enum'

vi.mock('@vitalets/google-translate-api', () => ({
  translate: vi.fn(),
}))

// Import after mock so we get the mocked version
import { translate } from '@vitalets/google-translate-api'

// ── Knex mock builder ─────────────────────────────────────────────────────────
function makeKnexMock(overrides: Record<string, any> = {}) {
  const defaultChain = {
    where: vi.fn().mockReturnThis(),
    whereNot: vi.fn().mockReturnThis(),
    whereNull: vi.fn().mockReturnThis(),
    whereNotNull: vi.fn().mockReturnThis(),
    whereIn: vi.fn().mockReturnThis(),
    andOn: vi.fn().mockReturnThis(),
    join: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue([]),
    first: vi.fn().mockResolvedValue(undefined),
    insert: vi.fn().mockResolvedValue([1]),
    update: vi.fn().mockResolvedValue(1),
    ...overrides,
  }

  const db = vi.fn(() => defaultChain) as any
  db.raw = vi.fn((sql: string, bindings: any[]) => bindings?.[0] ?? sql)
  db.fn = { now: vi.fn(() => new Date().toISOString()) }
  return { db, chain: defaultChain }
}

describe('createJob', () => {
  it('creates a job with RUNNING status', () => {
    const job = createJob(1, 'fr', 'French')
    expect(job.status).toBe(JOB_STATUS.RUNNING)
  })

  it('assigns the correct projectId, languageCode, and languageName', () => {
    const job = createJob(42, 'de', 'German')
    expect(job.projectId).toBe(42)
    expect(job.languageCode).toBe('de')
    expect(job.languageName).toBe('German')
  })

  it('initialises total, done, and errors to zero', () => {
    const job = createJob(1, 'es', 'Spanish')
    expect(job.total).toBe(0)
    expect(job.done).toBe(0)
    expect(job.errors).toBe(0)
  })

  it('assigns a unique id to each job', () => {
    const job1 = createJob(1, 'fr', 'French')
    const job2 = createJob(1, 'fr', 'French')
    expect(job1.id).not.toBe(job2.id)
  })

  it('sets startedAt to a timestamp close to now', () => {
    const before = Date.now()
    const job = createJob(1, 'fr', 'French')
    const after = Date.now()
    expect(job.startedAt).toBeGreaterThanOrEqual(before)
    expect(job.startedAt).toBeLessThanOrEqual(after)
  })
})

describe('getJob', () => {
  it('returns the job after creation', () => {
    const job = createJob(5, 'it', 'Italian')
    expect(getJob(job.id)).toBe(job)
  })

  it('returns undefined for an unknown id', () => {
    expect(getJob('non-existent-id-xyz')).toBeUndefined()
  })

  it('returns the correct job when multiple jobs exist', () => {
    const jobA = createJob(1, 'fr', 'French')
    const jobB = createJob(2, 'de', 'German')
    expect(getJob(jobA.id)).toBe(jobA)
    expect(getJob(jobB.id)).toBe(jobB)
  })
})

describe('runTranslationJob', () => {
  beforeEach(() => {
    vi.mocked(translate).mockReset()
  })

  it('sets job.status to ERROR when no source language is found', async () => {
    const { db, chain } = makeKnexMock()
    chain.first.mockResolvedValue(undefined)

    const job = createJob(1, 'fr', 'French')
    await runTranslationJob(db, job)

    expect(job.status).toBe(JOB_STATUS.ERROR)
  })

  it('sets job.status to DONE when there are no source translations', async () => {
    const { db, chain } = makeKnexMock()

    // first call: source language found
    chain.first.mockResolvedValueOnce({ code: 'en', is_default: true })
    // source translations query: returns empty array
    chain.select.mockResolvedValueOnce([])

    const job = createJob(1, 'fr', 'French')
    await runTranslationJob(db, job)

    expect(job.status).toBe(JOB_STATUS.DONE)
  })

  it('sets job.status to DONE when everything is already translated', async () => {
    const { db, chain } = makeKnexMock()

    chain.first.mockResolvedValueOnce({ code: 'en', is_default: true })
    // source translations: two keys
    chain.select
      .mockResolvedValueOnce([
        { key_id: 1, source_value: 'Hello' },
        { key_id: 2, source_value: 'World' },
      ])
      // existing key IDs in target lang: both keys already translated
      .mockResolvedValueOnce([{ key_id: 1 }, { key_id: 2 }])

    const job = createJob(1, 'fr', 'French')
    await runTranslationJob(db, job)

    expect(job.status).toBe(JOB_STATUS.DONE)
    expect(translate).not.toHaveBeenCalled()
  })

  it('translates a batch and increments job.done', async () => {
    const { db, chain } = makeKnexMock()

    chain.first
      .mockResolvedValueOnce({ code: 'en', is_default: true }) // source lang
      .mockResolvedValueOnce(undefined)                         // no existing translation for key 1
      .mockResolvedValueOnce(undefined)                         // no existing translation for key 2

    chain.select
      .mockResolvedValueOnce([
        { key_id: 10, source_value: 'Hello' },
        { key_id: 11, source_value: 'World' },
      ])  // sourceTranslations
      .mockResolvedValueOnce([]) // existingKeyIds (none already translated)

    vi.mocked(translate).mockResolvedValueOnce({ text: 'Bonjour ||| Monde' } as any)

    const job = createJob(1, 'fr', 'French')
    await runTranslationJob(db, job)

    expect(job.status).toBe(JOB_STATUS.DONE)
    expect(job.done).toBe(2)
    expect(job.errors).toBe(0)
    expect(translate).toHaveBeenCalledOnce()
  })

  it('handles translate() error gracefully — increments errors and continues', async () => {
    const { db, chain } = makeKnexMock()

    chain.first.mockResolvedValueOnce({ code: 'en', is_default: true })

    chain.select
      .mockResolvedValueOnce([{ key_id: 20, source_value: 'Test' }])
      .mockResolvedValueOnce([])

    vi.mocked(translate).mockRejectedValueOnce(new Error('API rate limit'))

    const job = createJob(1, 'fr', 'French')
    await runTranslationJob(db, job)

    expect(job.status).toBe(JOB_STATUS.DONE)
    expect(job.errors).toBe(1)
  })

  it('updates existing empty translation instead of inserting new one', async () => {
    const { db, chain } = makeKnexMock()

    chain.first
      .mockResolvedValueOnce({ code: 'en', is_default: true })
      // existing translation row (has no value yet)
      .mockResolvedValueOnce({ id: 99, value: null })

    chain.select
      .mockResolvedValueOnce([{ key_id: 30, source_value: 'Update me' }])
      .mockResolvedValueOnce([])

    vi.mocked(translate).mockResolvedValueOnce({ text: 'Mets-moi à jour' } as any)

    const job = createJob(1, 'fr', 'French')
    await runTranslationJob(db, job)

    expect(chain.update).toHaveBeenCalled()
    expect(job.done).toBe(1)
  })

  it('inserts a new translation row when none exists', async () => {
    const { db, chain } = makeKnexMock()

    chain.first
      .mockResolvedValueOnce({ code: 'en', is_default: true })
      .mockResolvedValueOnce(undefined) // no existing translation row

    chain.select
      .mockResolvedValueOnce([{ key_id: 40, source_value: 'New key' }])
      .mockResolvedValueOnce([])

    vi.mocked(translate).mockResolvedValueOnce({ text: 'Nouvelle clé' } as any)

    const job = createJob(1, 'fr', 'French')
    await runTranslationJob(db, job)

    expect(chain.insert).toHaveBeenCalled()
    expect(job.done).toBe(1)
  })

  it('falls back to non-default source language when no default is set', async () => {
    const { db, chain } = makeKnexMock()

    chain.first
      .mockResolvedValueOnce(undefined)                         // no is_default lang
      .mockResolvedValueOnce({ code: 'en', is_default: false }) // fallback lang
      .mockResolvedValueOnce(undefined)                         // no existing translation

    chain.select
      .mockResolvedValueOnce([{ key_id: 50, source_value: 'Fallback' }])
      .mockResolvedValueOnce([])

    vi.mocked(translate).mockResolvedValueOnce({ text: 'Repli' } as any)

    const job = createJob(1, 'fr', 'French')
    await runTranslationJob(db, job)

    expect(job.status).toBe(JOB_STATUS.DONE)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { SBaseService } from '~/services/base.service'

// ── Concrete test subclass ────────────────────────────────────────────────────
class TestService extends SBaseService {
  async testGet<T>(path: string, config?: any): Promise<T> {
    return this.get<T>(path, config)
  }

  async testPost<T>(path: string, config?: any): Promise<T> {
    return this.post<T>(path, config)
  }

  async testPut<T>(path: string, config?: any): Promise<T> {
    return this.put<T>(path, config)
  }

  async testPatch<T>(path: string, config?: any): Promise<T> {
    return this.patch<T>(path, config)
  }

  async testDelete<T>(path: string, config?: any): Promise<T> {
    return this.delete<T>(path, config)
  }
}

const mockFetch = vi.mocked(globalThis.$fetch as any)

describe('BaseService', () => {
  let service: TestService

  beforeEach(() => {
    service = new TestService()
  })

  // ── HTTP method wiring ────────────────────────────────────────────────────

  it('get() calls $fetch with GET method and path', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })
    await service.testGet('/api/test')
    expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ method: 'GET' }))
  })

  it('get() forwards query params', async () => {
    mockFetch.mockResolvedValueOnce([])
    await service.testGet('/api/keys', { query: { project_id: 1 } })
    expect(mockFetch).toHaveBeenCalledWith('/api/keys', expect.objectContaining({
      method: 'GET',
      query: { project_id: 1 },
    }))
  })

  it('post() calls $fetch with POST method and body', async () => {
    mockFetch.mockResolvedValueOnce({ id: 1 })
    await service.testPost('/api/keys', { body: { key: 'hello' } })
    expect(mockFetch).toHaveBeenCalledWith('/api/keys', expect.objectContaining({
      method: 'POST',
      body: { key: 'hello' },
    }))
  })

  it('put() calls $fetch with PUT method', async () => {
    mockFetch.mockResolvedValueOnce({})
    await service.testPut('/api/keys/1', { body: { description: 'updated' } })
    expect(mockFetch).toHaveBeenCalledWith('/api/keys/1', expect.objectContaining({ method: 'PUT' }))
  })

  it('patch() calls $fetch with PATCH method', async () => {
    mockFetch.mockResolvedValueOnce({})
    await service.testPatch('/api/keys/1', { body: { description: null } })
    expect(mockFetch).toHaveBeenCalledWith('/api/keys/1', expect.objectContaining({ method: 'PATCH' }))
  })

  it('delete() calls $fetch with DELETE method', async () => {
    mockFetch.mockResolvedValueOnce(undefined)
    await service.testDelete('/api/keys/1')
    expect(mockFetch).toHaveBeenCalledWith('/api/keys/1', expect.objectContaining({ method: 'DELETE' }))
  })

  // ── loading ref ───────────────────────────────────────────────────────────

  it('loading starts as false', () => {
    expect(service.loading.value).toBe(false)
  })

  it('loading becomes false after request resolves', async () => {
    mockFetch.mockResolvedValueOnce({ data: [] })
    await service.testGet('/api/test')
    expect(service.loading.value).toBe(false)
  })

  // ── Deduplication ─────────────────────────────────────────────────────────

  it('two concurrent identical GET requests share the same promise', async () => {
    let resolveFirst!: (v: any) => void
    const controlled = new Promise(r => { resolveFirst = r })
    mockFetch.mockReturnValueOnce(controlled)

    const p1 = service.testGet('/api/dup')
    const p2 = service.testGet('/api/dup')

    resolveFirst({ result: 1 })
    const [r1, r2] = await Promise.all([p1, p2])

    expect(r1).toEqual(r2)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('skipDedup bypasses deduplication — issues two separate requests', async () => {
    mockFetch
      .mockResolvedValueOnce({ n: 1 })
      .mockResolvedValueOnce({ n: 2 })

    const [r1, r2] = await Promise.all([
      service.testGet('/api/dup', { skipDedup: true }),
      service.testGet('/api/dup', { skipDedup: true }),
    ])

    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  // ── 401 retry ─────────────────────────────────────────────────────────────

  it('retries once after a successful session refresh on 401', async () => {
    const authError = Object.assign(new Error('Unauthorized'), { status: 401 })
    mockFetch
      .mockRejectedValueOnce(authError)  // initial request fails
      .mockResolvedValueOnce(true)        // /api/auth/me succeeds (session valid)
      .mockResolvedValueOnce({ ok: true }) // retry succeeds

    const result = await service.testGet('/api/protected')
    expect(result).toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('calls navigateTo /login when session refresh fails on 401', async () => {
    const authError = Object.assign(new Error('Unauthorized'), { status: 401 })
    mockFetch
      .mockRejectedValueOnce(authError)  // initial request fails
      .mockRejectedValueOnce(new Error('no session')) // /api/auth/me fails
      .mockResolvedValueOnce(undefined)  // logout call

    await expect(service.testGet('/api/protected')).rejects.toThrow()
    expect(vi.mocked(globalThis.navigateTo as any)).toHaveBeenCalledWith('/login', { replace: true })
  })

  // ── Error handling ────────────────────────────────────────────────────────

  it('rethrows non-401 errors', async () => {
    const serverError = Object.assign(new Error('Server Error'), { status: 500 })
    mockFetch.mockRejectedValueOnce(serverError)

    await expect(service.testGet('/api/fail')).rejects.toThrow()
  })

  it('shows error toast by default on failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('something went wrong'))

    await expect(service.testGet('/api/fail')).rejects.toThrow()

    const toast = vi.mocked(globalThis.useToast as any)()
    expect(toast.add).toHaveBeenCalled()
  })

  it('skips error toast when skipErrorToast is true', async () => {
    mockFetch.mockRejectedValueOnce(new Error('login failed'))

    await expect(service.testPost('/api/auth/login', { skipErrorToast: true })).rejects.toThrow()

    const toast = vi.mocked(globalThis.useToast as any)()
    expect(toast.add).not.toHaveBeenCalled()
  })

  it('uses data.message from error response when available', async () => {
    const err = Object.assign(new Error('raw'), { data: { message: 'Custom server message' } })
    mockFetch.mockRejectedValueOnce(err)

    await expect(service.testGet('/api/fail', { skipErrorToast: true }))
      .rejects.toThrow('Custom server message')
  })
})

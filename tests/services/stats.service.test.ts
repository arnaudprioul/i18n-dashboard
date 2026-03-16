import { describe, it, expect, vi } from 'vitest'
import { statsService } from '~/services/stats.service'

const mockFetch = vi.mocked(globalThis.$fetch as any)

const fakeStats = {
  total_keys: 100,
  translated_keys: 80,
  approved_keys: 60,
  languages: [{ code: 'fr', name: 'French', translated: 80, approved: 60 }],
}

describe('statsService', () => {
  describe('getStats()', () => {
    it('returns null without calling $fetch when projectId is undefined', async () => {
      const result = await statsService.getStats(undefined)
      expect(result).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('returns null without calling $fetch when projectId is 0', async () => {
      const result = await statsService.getStats(0)
      expect(result).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('calls GET /api/stats with project_id when provided', async () => {
      mockFetch.mockResolvedValueOnce(fakeStats)

      const result = await statsService.getStats(1)

      expect(mockFetch).toHaveBeenCalledWith('/api/stats', expect.objectContaining({
        method: 'GET',
        query: { project_id: 1 },
      }))
      expect(result).toEqual(fakeStats)
    })

    it('passes different project ids correctly', async () => {
      mockFetch.mockResolvedValueOnce(fakeStats)

      await statsService.getStats(42)

      expect(mockFetch).toHaveBeenCalledWith('/api/stats', expect.objectContaining({
        query: { project_id: 42 },
      }))
    })

    it('returns the stats response as-is', async () => {
      const customStats = { total_keys: 5, translated_keys: 3, approved_keys: 1, languages: [] }
      mockFetch.mockResolvedValueOnce(customStats)

      const result = await statsService.getStats(7)
      expect(result).toEqual(customStats)
    })
  })
})

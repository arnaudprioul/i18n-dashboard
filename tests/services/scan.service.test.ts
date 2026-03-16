import { describe, it, expect, vi } from 'vitest'
import { scanService } from '~/services/scan.service'

const mockFetch = vi.mocked(globalThis.$fetch as any)

describe('scanService', () => {
  describe('scan()', () => {
    it('calls POST /api/scan with project_id', async () => {
      const fakeScanResult = {
        found: 15,
        new: 3,
        unused: 2,
        scanned_files: ['src/App.vue', 'src/pages/index.vue'],
      }
      mockFetch.mockResolvedValueOnce(fakeScanResult)

      const result = await scanService.scan(1)

      expect(mockFetch).toHaveBeenCalledWith('/api/scan', expect.objectContaining({
        method: 'POST',
        body: { project_id: 1 },
      }))
      expect(result).toEqual(fakeScanResult)
    })

    it('passes correct project_id in body', async () => {
      mockFetch.mockResolvedValueOnce({ found: 0, new: 0, unused: 0, scanned_files: [] })

      await scanService.scan(7)

      expect(mockFetch).toHaveBeenCalledWith('/api/scan', expect.objectContaining({
        body: { project_id: 7 },
      }))
    })

    it('uses skipDedup so concurrent scan calls are independent', async () => {
      mockFetch.mockResolvedValue({ found: 0, new: 0, unused: 0, scanned_files: [] })

      await Promise.all([scanService.scan(1), scanService.scan(1)])

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('sync()', () => {
    it('calls POST /api/sync with project_id', async () => {
      const fakeSyncResult = { imported: 10, updated: 5, skipped: 2 }
      mockFetch.mockResolvedValueOnce(fakeSyncResult)

      const result = await scanService.sync(2)

      expect(mockFetch).toHaveBeenCalledWith('/api/sync', expect.objectContaining({
        method: 'POST',
        body: { project_id: 2 },
      }))
      expect(result).toEqual(fakeSyncResult)
    })

    it('passes correct project_id in body', async () => {
      mockFetch.mockResolvedValueOnce({ imported: 0, updated: 0, skipped: 0 })

      await scanService.sync(99)

      expect(mockFetch).toHaveBeenCalledWith('/api/sync', expect.objectContaining({
        body: { project_id: 99 },
      }))
    })

    it('uses skipDedup so concurrent sync calls are independent', async () => {
      mockFetch.mockResolvedValue({ imported: 0, updated: 0, skipped: 0 })

      await Promise.all([scanService.sync(1), scanService.sync(1)])

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})

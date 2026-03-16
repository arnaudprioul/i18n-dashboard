import { describe, it, expect, vi } from 'vitest'
import { jobService } from '~/services/job.service'

const mockFetch = vi.mocked(globalThis.$fetch as any)

describe('jobService', () => {
  describe('getJob()', () => {
    it('calls GET /api/translations/job/:jobId', async () => {
      const fakeJobStatus = {
        id: 'abc-123',
        status: 'running',
        total: 50,
        done: 10,
        errors: 0,
        projectId: 1,
        languageCode: 'fr',
        languageName: 'French',
        startedAt: Date.now(),
      }
      mockFetch.mockResolvedValueOnce(fakeJobStatus)

      const result = await jobService.getJob('abc-123')

      expect(mockFetch).toHaveBeenCalledWith('/api/translations/job/abc-123', expect.objectContaining({
        method: 'GET',
      }))
      expect(result).toEqual(fakeJobStatus)
    })

    it('uses correct job id in URL path', async () => {
      mockFetch.mockResolvedValueOnce({ id: 'xyz-456', status: 'done', total: 20, done: 20, errors: 0 })

      await jobService.getJob('xyz-456')

      expect(mockFetch).toHaveBeenCalledWith('/api/translations/job/xyz-456', expect.anything())
    })

    it('returns job with DONE status', async () => {
      const doneJob = { id: 'done-job', status: 'done', total: 100, done: 100, errors: 0 }
      mockFetch.mockResolvedValueOnce(doneJob)

      const result = await jobService.getJob('done-job')
      expect(result).toEqual(doneJob)
    })

    it('returns job with ERROR status', async () => {
      const errorJob = { id: 'err-job', status: 'error', total: 5, done: 3, errors: 2 }
      mockFetch.mockResolvedValueOnce(errorJob)

      const result = await jobService.getJob('err-job')
      expect(result).toEqual(errorJob)
    })

    it('propagates fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Job not found'))

      await expect(jobService.getJob('missing-job')).rejects.toThrow()
    })
  })
})

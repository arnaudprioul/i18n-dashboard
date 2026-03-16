import { describe, it, expect, vi } from 'vitest'
import { profileService } from '~/services/profile.service'

const mockFetch = vi.mocked(globalThis.$fetch as any)

const fakeProfile = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  stats: {
    total_translations: 150,
    reviewed: 80,
    approved: 60,
  },
  activity: [],
}

describe('profileService', () => {
  describe('getProfile()', () => {
    it('calls GET /api/profile with default period "all"', async () => {
      mockFetch.mockResolvedValueOnce(fakeProfile)

      const result = await profileService.getProfile()

      expect(mockFetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({
        method: 'GET',
        query: { period: 'all' },
      }))
      expect(result).toEqual(fakeProfile)
    })

    it('calls GET /api/profile with custom period', async () => {
      mockFetch.mockResolvedValueOnce(fakeProfile)

      await profileService.getProfile('week')

      expect(mockFetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({
        query: { period: 'week' },
      }))
    })

    it('calls GET /api/profile with month period', async () => {
      mockFetch.mockResolvedValueOnce(fakeProfile)

      await profileService.getProfile('month')

      expect(mockFetch).toHaveBeenCalledWith('/api/profile', expect.objectContaining({
        query: { period: 'month' },
      }))
    })
  })

  describe('getUserProfile()', () => {
    it('calls GET /api/users/:id/profile with default period "all"', async () => {
      mockFetch.mockResolvedValueOnce(fakeProfile)

      const result = await profileService.getUserProfile(5)

      expect(mockFetch).toHaveBeenCalledWith('/api/users/5/profile', expect.objectContaining({
        method: 'GET',
        query: { period: 'all' },
      }))
      expect(result).toEqual(fakeProfile)
    })

    it('calls GET /api/users/:id/profile with custom period', async () => {
      mockFetch.mockResolvedValueOnce(fakeProfile)

      await profileService.getUserProfile(3, 'week')

      expect(mockFetch).toHaveBeenCalledWith('/api/users/3/profile', expect.objectContaining({
        query: { period: 'week' },
      }))
    })

    it('accepts string user id', async () => {
      mockFetch.mockResolvedValueOnce(fakeProfile)

      await profileService.getUserProfile('42')

      expect(mockFetch).toHaveBeenCalledWith('/api/users/42/profile', expect.anything())
    })

    it('uses correct user id in URL path', async () => {
      mockFetch.mockResolvedValueOnce(fakeProfile)

      await profileService.getUserProfile(99)

      expect(mockFetch).toHaveBeenCalledWith('/api/users/99/profile', expect.anything())
    })

    it('returns the profile data as-is', async () => {
      const customProfile = { ...fakeProfile, name: 'Bob', stats: { total_translations: 5, reviewed: 2, approved: 1 } }
      mockFetch.mockResolvedValueOnce(customProfile)

      const result = await profileService.getUserProfile(10, 'all')
      expect(result).toEqual(customProfile)
    })
  })
})

import { describe, it, expect, vi } from 'vitest'
import { settingsService } from '~/services/settings.service'

const mockFetch = vi.mocked(globalThis.$fetch as any)

describe('settingsService', () => {
  describe('getSettings()', () => {
    it('calls GET /api/settings', async () => {
      const fakeSettings = { google_translate_api_key: 'key-abc', scan_exclude: 'node_modules' }
      mockFetch.mockResolvedValueOnce(fakeSettings)

      const result = await settingsService.getSettings()

      expect(mockFetch).toHaveBeenCalledWith('/api/settings', expect.objectContaining({
        method: 'GET',
      }))
      expect(result).toEqual(fakeSettings)
    })

    it('returns empty object when no settings exist', async () => {
      mockFetch.mockResolvedValueOnce({})

      const result = await settingsService.getSettings()
      expect(result).toEqual({})
    })
  })

  describe('saveSettings()', () => {
    it('calls POST /api/settings with settings payload', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await settingsService.saveSettings({ google_translate_api_key: 'new-key' })

      expect(mockFetch).toHaveBeenCalledWith('/api/settings', expect.objectContaining({
        method: 'POST',
        body: { google_translate_api_key: 'new-key' },
      }))
    })

    it('passes all settings fields', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await settingsService.saveSettings({
        google_translate_api_key: 'abc',
        scan_exclude: 'dist,build',
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/settings', expect.objectContaining({
        body: { google_translate_api_key: 'abc', scan_exclude: 'dist,build' },
      }))
    })

    it('uses skipDedup to ensure every save is independent', async () => {
      mockFetch.mockResolvedValue(undefined)

      // Two concurrent saves should both fire
      await Promise.all([
        settingsService.saveSettings({ google_translate_api_key: 'key1' }),
        settingsService.saveSettings({ google_translate_api_key: 'key2' }),
      ])

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})

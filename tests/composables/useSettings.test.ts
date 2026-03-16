import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

vi.mock('~/services/settings.service', () => ({
  settingsService: {
    getSettings: vi.fn().mockResolvedValue({}),
    saveSettings: vi.fn().mockResolvedValue(undefined),
  },
}))

import { useSettings } from '~/composables/useSettings'
import { settingsService } from '~/services/settings.service'

describe('useSettings', () => {
  beforeEach(() => {
    vi.mocked(settingsService.getSettings).mockReset()
    vi.mocked(settingsService.saveSettings).mockReset()
    vi.mocked(settingsService.getSettings).mockResolvedValue({})
  })

  describe('initial state', () => {
    it('settings starts as empty object (via computed)', () => {
      const { settings } = useSettings()
      // data starts as {} so computed settings returns {}
      expect(settings.value).toEqual({})
    })

    it('pending starts false', () => {
      const { pending } = useSettings()
      expect(pending.value).toBe(false)
    })
  })

  describe('refresh', () => {
    it('calls settingsService.getSettings and updates settings', async () => {
      const mockData = { google_translate_api_key: 'abc123', scan_exclude: 'node_modules' }
      vi.mocked(settingsService.getSettings).mockResolvedValue(mockData)

      const { refresh, settings } = useSettings()
      await refresh()

      expect(settingsService.getSettings).toHaveBeenCalledOnce()
      expect(settings.value).toEqual(mockData)
    })

    it('sets pending to true while fetching, false after', async () => {
      let resolveFetch!: (v: any) => void
      vi.mocked(settingsService.getSettings).mockReturnValue(
        new Promise(resolve => { resolveFetch = resolve }),
      )

      const { refresh, pending } = useSettings()
      expect(pending.value).toBe(false)

      const refreshPromise = refresh()
      await nextTick()
      expect(pending.value).toBe(true)

      resolveFetch({ key: 'value' })
      await refreshPromise
      expect(pending.value).toBe(false)
    })

    it('keeps settings as {} on error', async () => {
      vi.mocked(settingsService.getSettings).mockRejectedValue(new Error('Network error'))

      const { refresh, settings } = useSettings()
      await refresh()

      expect(settings.value).toEqual({})
    })
  })

  describe('saveSettings', () => {
    it('calls settingsService.saveSettings with payload', async () => {
      vi.mocked(settingsService.saveSettings).mockResolvedValue(undefined)
      vi.mocked(settingsService.getSettings).mockResolvedValue({})

      const { saveSettings } = useSettings()
      await saveSettings({ google_translate_api_key: 'key123' })

      expect(settingsService.saveSettings).toHaveBeenCalledWith({ google_translate_api_key: 'key123' })
    })

    it('shows success toast on success', async () => {
      vi.mocked(settingsService.saveSettings).mockResolvedValue(undefined)
      vi.mocked(settingsService.getSettings).mockResolvedValue({})
      const mockToast = vi.mocked(globalThis.useToast)()

      const { saveSettings } = useSettings()
      await saveSettings({ google_translate_api_key: 'key123' })

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'success' }),
      )
    })

    it('shows error toast with message on failure', async () => {
      vi.mocked(settingsService.saveSettings).mockRejectedValue(
        Object.assign(new Error('Invalid config'), { message: 'Invalid config' }),
      )
      const mockToast = vi.mocked(globalThis.useToast)()

      const { saveSettings } = useSettings()
      await saveSettings({ google_translate_api_key: 'bad' })

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'error', description: 'Invalid config' }),
      )
    })

    it('saving flag is true during save and false after', async () => {
      let resolveSave!: () => void
      vi.mocked(settingsService.saveSettings).mockReturnValue(
        new Promise<void>(resolve => { resolveSave = resolve }),
      )

      const { saveSettings, saving } = useSettings()
      expect(saving.value).toBe(false)

      const savePromise = saveSettings({ google_translate_api_key: 'key' })
      await nextTick()
      expect(saving.value).toBe(true)

      resolveSave()
      // saveSettings also calls refresh after save
      vi.mocked(settingsService.getSettings).mockResolvedValue({})
      await savePromise
      expect(saving.value).toBe(false)
    })

    it('calls refresh after successful save', async () => {
      vi.mocked(settingsService.saveSettings).mockResolvedValue(undefined)
      const updatedSettings = { google_translate_api_key: 'newkey' }
      vi.mocked(settingsService.getSettings).mockResolvedValue(updatedSettings)

      const { saveSettings, settings } = useSettings()
      await saveSettings({ google_translate_api_key: 'newkey' })

      expect(settingsService.getSettings).toHaveBeenCalled()
      expect(settings.value).toEqual(updatedSettings)
    })
  })
})

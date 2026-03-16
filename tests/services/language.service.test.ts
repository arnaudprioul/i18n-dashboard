import { describe, it, expect, vi } from 'vitest'
import { languageService } from '~/services/language.service'
import type { LanguageItem } from '~/interfaces/languages.interface'

const mockFetch = vi.mocked(globalThis.$fetch as any)

const fakeLang: LanguageItem = {
  id: 1,
  code: 'fr',
  name: 'French',
  is_default: false,
  fallback_code: null,
  project_id: 1,
}

describe('languageService', () => {
  describe('getLanguages()', () => {
    it('returns empty array without calling $fetch when projectId is undefined', async () => {
      const result = await languageService.getLanguages(undefined)
      expect(result).toEqual([])
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('returns empty array without calling $fetch when projectId is 0', async () => {
      const result = await languageService.getLanguages(0)
      expect(result).toEqual([])
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('calls GET /api/languages with project_id when provided', async () => {
      mockFetch.mockResolvedValueOnce([fakeLang])

      const result = await languageService.getLanguages(1)

      expect(mockFetch).toHaveBeenCalledWith('/api/languages', expect.objectContaining({
        method: 'GET',
        query: { project_id: 1 },
      }))
      expect(result).toEqual([fakeLang])
    })

    it('returns multiple languages', async () => {
      const langs = [
        { ...fakeLang, code: 'en', name: 'English', is_default: true },
        { ...fakeLang, code: 'fr', name: 'French', is_default: false },
      ]
      mockFetch.mockResolvedValueOnce(langs)

      const result = await languageService.getLanguages(2)
      expect(result).toHaveLength(2)
    })
  })

  describe('create()', () => {
    it('calls POST /api/languages with language payload', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await languageService.create({ project_id: 1, code: 'de', name: 'German', is_default: false })

      expect(mockFetch).toHaveBeenCalledWith('/api/languages', expect.objectContaining({
        method: 'POST',
        body: { project_id: 1, code: 'de', name: 'German', is_default: false },
      }))
    })
  })

  describe('setDefault()', () => {
    it('calls POST /api/languages with is_default: true', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await languageService.setDefault(fakeLang, 1)

      expect(mockFetch).toHaveBeenCalledWith('/api/languages', expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          ...fakeLang,
          project_id: 1,
          is_default: true,
        }),
      }))
    })

    it('preserves all language fields when setting default', async () => {
      mockFetch.mockResolvedValueOnce(undefined)
      const lang = { ...fakeLang, code: 'en', name: 'English' }

      await languageService.setDefault(lang, 5)

      expect(mockFetch).toHaveBeenCalledWith('/api/languages', expect.objectContaining({
        body: expect.objectContaining({ code: 'en', name: 'English', project_id: 5, is_default: true }),
      }))
    })
  })

  describe('remove()', () => {
    it('calls DELETE /api/languages/:code with project_id query', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await languageService.remove('fr', 1)

      expect(mockFetch).toHaveBeenCalledWith('/api/languages/fr', expect.objectContaining({
        method: 'DELETE',
        query: { project_id: 1 },
      }))
    })

    it('uses correct language code in URL path', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await languageService.remove('de', 3)

      expect(mockFetch).toHaveBeenCalledWith('/api/languages/de', expect.anything())
    })
  })
})

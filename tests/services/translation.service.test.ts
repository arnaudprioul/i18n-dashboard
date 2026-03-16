import { describe, it, expect, vi } from 'vitest'
import { translationService } from '~/services/translation.service'

const mockFetch = vi.mocked(globalThis.$fetch as any)

describe('translationService', () => {
  describe('save()', () => {
    it('calls POST /api/translations with payload', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await translationService.save({ key_id: 1, language_code: 'fr', value: 'Bonjour' })

      expect(mockFetch).toHaveBeenCalledWith('/api/translations', expect.objectContaining({
        method: 'POST',
        body: { key_id: 1, language_code: 'fr', value: 'Bonjour' },
      }))
    })

    it('can save an empty string value', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await translationService.save({ key_id: 2, language_code: 'de', value: '' })

      expect(mockFetch).toHaveBeenCalledWith('/api/translations', expect.objectContaining({
        body: expect.objectContaining({ value: '' }),
      }))
    })
  })

  describe('setStatus()', () => {
    it('calls POST /api/translations/status with status payload', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await translationService.setStatus({ key_id: 5, language_code: 'fr', status: 'approved' })

      expect(mockFetch).toHaveBeenCalledWith('/api/translations/status', expect.objectContaining({
        method: 'POST',
        body: { key_id: 5, language_code: 'fr', status: 'approved' },
      }))
    })
  })

  describe('bulkStatus()', () => {
    it('calls POST /api/translations/bulk-status with ids and status', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await translationService.bulkStatus([1, 2, 3], 'reviewed')

      expect(mockFetch).toHaveBeenCalledWith('/api/translations/bulk-status', expect.objectContaining({
        method: 'POST',
        body: { ids: [1, 2, 3], status: 'reviewed' },
      }))
    })
  })

  describe('batchTranslate()', () => {
    it('calls POST /api/translations/batch-translate with project_id and target_language', async () => {
      const response = { translated: 5, skipped: 2, errors: 0 }
      mockFetch.mockResolvedValueOnce(response)

      const result = await translationService.batchTranslate(1, 'fr')

      expect(mockFetch).toHaveBeenCalledWith('/api/translations/batch-translate', expect.objectContaining({
        method: 'POST',
        body: { project_id: 1, target_language: 'fr' },
      }))
      expect(result).toEqual(response)
    })
  })

  describe('translateAll()', () => {
    it('calls POST /api/translations/translate-all with correct body', async () => {
      mockFetch.mockResolvedValueOnce({ jobId: 'abc-123' })

      const result = await translationService.translateAll(1, 'fr', 'French')

      expect(mockFetch).toHaveBeenCalledWith('/api/translations/translate-all', expect.objectContaining({
        method: 'POST',
        body: { project_id: 1, language_code: 'fr', language_name: 'French' },
      }))
      expect(result).toEqual({ jobId: 'abc-123' })
    })
  })

  describe('translateText()', () => {
    it('calls POST /api/translate with text, from, and to', async () => {
      mockFetch.mockResolvedValueOnce({ text: 'Bonjour' })

      const result = await translationService.translateText('Hello', 'en', 'fr')

      expect(mockFetch).toHaveBeenCalledWith('/api/translate', expect.objectContaining({
        method: 'POST',
        body: { text: 'Hello', from: 'en', to: 'fr' },
      }))
      expect(result).toEqual({ text: 'Bonjour' })
    })
  })
})

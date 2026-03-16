import { describe, it, expect, vi } from 'vitest'
import { keyService } from '~/services/key.service'
import type { KeyItem, KeysResponse } from '~/interfaces/key.interface'

const mockFetch = vi.mocked(globalThis.$fetch as any)

const fakeKey: KeyItem = {
  id: 1,
  key: 'greeting.hello',
  description: 'A greeting',
  is_unused: false,
  translations: { en: { id: 1, value: 'Hello', status: 'approved', language_code: 'en', key_id: 1 } },
  usages: [],
}

const fakeKeysResponse: KeysResponse = {
  data: [fakeKey],
  total: 1,
  page: 1,
  limit: 50,
  languages: [],
}

describe('keyService', () => {
  describe('getKeys()', () => {
    it('calls GET /api/keys with query params', async () => {
      mockFetch.mockResolvedValueOnce(fakeKeysResponse)

      const result = await keyService.getKeys({ project_id: 1 })

      expect(mockFetch).toHaveBeenCalledWith('/api/keys', expect.objectContaining({
        method: 'GET',
        query: { project_id: 1 },
      }))
      expect(result).toEqual(fakeKeysResponse)
    })

    it('passes all filter parameters', async () => {
      mockFetch.mockResolvedValueOnce(fakeKeysResponse)

      await keyService.getKeys({ project_id: 2, search: 'hello', lang: 'fr', status: 'draft', page: 2, limit: 25 })

      expect(mockFetch).toHaveBeenCalledWith('/api/keys', expect.objectContaining({
        query: { project_id: 2, search: 'hello', lang: 'fr', status: 'draft', page: 2, limit: 25 },
      }))
    })
  })

  describe('getKey()', () => {
    it('calls GET /api/keys/:id', async () => {
      mockFetch.mockResolvedValueOnce(fakeKey)

      const result = await keyService.getKey(1)

      expect(mockFetch).toHaveBeenCalledWith('/api/keys/1', expect.objectContaining({
        method: 'GET',
      }))
      expect(result).toEqual(fakeKey)
    })

    it('accepts string id', async () => {
      mockFetch.mockResolvedValueOnce(fakeKey)

      await keyService.getKey('42')

      expect(mockFetch).toHaveBeenCalledWith('/api/keys/42', expect.anything())
    })
  })

  describe('createKey()', () => {
    it('calls POST /api/keys with body', async () => {
      mockFetch.mockResolvedValueOnce(fakeKey)

      const result = await keyService.createKey({ project_id: 1, key: 'nav.home', description: 'Home navigation' })

      expect(mockFetch).toHaveBeenCalledWith('/api/keys', expect.objectContaining({
        method: 'POST',
        body: { project_id: 1, key: 'nav.home', description: 'Home navigation' },
      }))
      expect(result).toEqual(fakeKey)
    })

    it('works without optional description', async () => {
      mockFetch.mockResolvedValueOnce(fakeKey)

      await keyService.createKey({ project_id: 1, key: 'btn.ok' })

      expect(mockFetch).toHaveBeenCalledWith('/api/keys', expect.objectContaining({
        body: { project_id: 1, key: 'btn.ok' },
      }))
    })
  })

  describe('updateKey()', () => {
    it('calls PATCH /api/keys/:id with body', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await keyService.updateKey(5, { description: 'Updated desc' })

      expect(mockFetch).toHaveBeenCalledWith('/api/keys/5', expect.objectContaining({
        method: 'PATCH',
        body: { description: 'Updated desc' },
      }))
    })

    it('can set description to null', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await keyService.updateKey(5, { description: null })

      expect(mockFetch).toHaveBeenCalledWith('/api/keys/5', expect.objectContaining({
        body: { description: null },
      }))
    })
  })

  describe('deleteKey()', () => {
    it('calls DELETE /api/keys/:id', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await keyService.deleteKey(10)

      expect(mockFetch).toHaveBeenCalledWith('/api/keys/10', expect.objectContaining({
        method: 'DELETE',
      }))
    })
  })
})

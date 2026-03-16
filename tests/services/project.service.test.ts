import { describe, it, expect, vi } from 'vitest'
import { projectService } from '~/services/project.service'
import type { Project } from '~/composables/useProject'

const mockFetch = vi.mocked(globalThis.$fetch as any)

const fakeProject: Project = {
  id: 1,
  name: 'My App',
  root_path: '/projects/my-app',
  locales_path: 'locales',
  key_separator: '.',
  color: '#3B82F6',
  description: 'Main app',
}

describe('projectService', () => {
  describe('getAll()', () => {
    it('calls GET /api/projects', async () => {
      mockFetch.mockResolvedValueOnce([fakeProject])

      const result = await projectService.getAll()

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({
        method: 'GET',
      }))
      expect(result).toEqual([fakeProject])
    })

    it('returns empty array when no projects exist', async () => {
      mockFetch.mockResolvedValueOnce([])

      const result = await projectService.getAll()
      expect(result).toEqual([])
    })

    it('returns multiple projects', async () => {
      const projects = [fakeProject, { ...fakeProject, id: 2, name: 'Other App' }]
      mockFetch.mockResolvedValueOnce(projects)

      const result = await projectService.getAll()
      expect(result).toHaveLength(2)
    })
  })

  describe('create()', () => {
    it('calls POST /api/projects with payload', async () => {
      mockFetch.mockResolvedValueOnce(fakeProject)

      const payload = {
        name: 'My App',
        root_path: '/projects/my-app',
        locales_path: 'locales',
        key_separator: '.',
      }
      const result = await projectService.create(payload)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({
        method: 'POST',
        body: payload,
      }))
      expect(result).toEqual(fakeProject)
    })

    it('passes optional fields when provided', async () => {
      mockFetch.mockResolvedValueOnce(fakeProject)

      await projectService.create({
        name: 'My App',
        locales_path: 'locales',
        key_separator: '.',
        color: '#FF0000',
        description: 'Desc',
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', expect.objectContaining({
        body: expect.objectContaining({ color: '#FF0000', description: 'Desc' }),
      }))
    })
  })

  describe('update()', () => {
    it('calls PUT /api/projects/:id with partial payload', async () => {
      const updated = { ...fakeProject, name: 'Updated App' }
      mockFetch.mockResolvedValueOnce(updated)

      const result = await projectService.update(1, { name: 'Updated App' })

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/1', expect.objectContaining({
        method: 'PUT',
        body: { name: 'Updated App' },
      }))
      expect(result).toEqual(updated)
    })

    it('uses correct id in URL path', async () => {
      mockFetch.mockResolvedValueOnce(fakeProject)

      await projectService.update(42, { description: 'New desc' })

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/42', expect.anything())
    })
  })

  describe('remove()', () => {
    it('calls DELETE /api/projects/:id', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await projectService.remove(1)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/1', expect.objectContaining({
        method: 'DELETE',
      }))
    })

    it('uses correct id in URL path', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await projectService.remove(99)

      expect(mockFetch).toHaveBeenCalledWith('/api/projects/99', expect.anything())
    })
  })
})

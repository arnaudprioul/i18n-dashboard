import { describe, it, expect, vi } from 'vitest'
import { userService } from '~/services/user.service'
import type { UserItem, RoleEntry } from '~/interfaces/user.interface'

const mockFetch = vi.mocked(globalThis.$fetch as any)

const fakeUser: UserItem = {
  id: 1,
  name: 'Alice',
  email: 'alice@example.com',
  is_active: true,
  is_super_admin: false,
}

describe('userService', () => {
  describe('getUsers()', () => {
    it('calls GET /api/users without query when no args', async () => {
      mockFetch.mockResolvedValueOnce([fakeUser])

      const result = await userService.getUsers()

      expect(mockFetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
        method: 'GET',
      }))
      expect(result).toEqual([fakeUser])
    })

    it('passes project_id query when provided', async () => {
      mockFetch.mockResolvedValueOnce([fakeUser])

      await userService.getUsers({ project_id: 3 })

      expect(mockFetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
        query: { project_id: 3 },
      }))
    })
  })

  describe('getAvailableUsers()', () => {
    it('calls GET /api/users with exclude_project_id query', async () => {
      mockFetch.mockResolvedValueOnce([fakeUser])

      await userService.getAvailableUsers(5)

      expect(mockFetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
        method: 'GET',
        query: { exclude_project_id: 5 },
      }))
    })
  })

  describe('create()', () => {
    it('calls POST /api/users with user payload', async () => {
      const response = { id: 2, tempPassword: 'abc123', email: 'bob@example.com', name: 'Bob' }
      mockFetch.mockResolvedValueOnce(response)

      const result = await userService.create({ name: 'Bob', email: 'bob@example.com', role: 'translator' })

      expect(mockFetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
        method: 'POST',
        body: { name: 'Bob', email: 'bob@example.com', role: 'translator' },
      }))
      expect(result).toEqual(response)
    })
  })

  describe('update()', () => {
    it('calls PUT /api/users/:id with is_active update', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await userService.update(1, { is_active: false })

      expect(mockFetch).toHaveBeenCalledWith('/api/users/1', expect.objectContaining({
        method: 'PUT',
        body: { is_active: false },
      }))
    })

    it('calls PUT /api/users/:id with project_id update', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await userService.update(2, { project_id: 10 })

      expect(mockFetch).toHaveBeenCalledWith('/api/users/2', expect.objectContaining({
        body: { project_id: 10 },
      }))
    })
  })

  describe('updateRoles()', () => {
    it('calls PUT /api/users/:id/roles with roles array', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      const roles: RoleEntry[] = [{ project_id: 1, role: 'translator' }]
      await userService.updateRoles(3, roles)

      expect(mockFetch).toHaveBeenCalledWith('/api/users/3/roles', expect.objectContaining({
        method: 'PUT',
        body: { roles },
      }))
    })

    it('supports multiple role entries', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      const roles: RoleEntry[] = [
        { project_id: 1, role: 'admin' },
        { project_id: 2, role: 'translator' },
      ]
      await userService.updateRoles(4, roles)

      expect(mockFetch).toHaveBeenCalledWith('/api/users/4/roles', expect.objectContaining({
        body: { roles },
      }))
    })
  })

  describe('remove()', () => {
    it('calls DELETE /api/users/:id without query when no projectId', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await userService.remove(1)

      expect(mockFetch).toHaveBeenCalledWith('/api/users/1', expect.objectContaining({
        method: 'DELETE',
      }))
    })

    it('calls DELETE /api/users/:id with project_id query when provided', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await userService.remove(1, 5)

      expect(mockFetch).toHaveBeenCalledWith('/api/users/1', expect.objectContaining({
        method: 'DELETE',
        query: { project_id: 5 },
      }))
    })
  })
})

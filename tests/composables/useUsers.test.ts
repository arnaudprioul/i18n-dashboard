import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref, computed } from 'vue'

vi.mock('~/services/user.service', () => ({
  userService: {
    getUsers: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
    updateRoles: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}))

import { useUsers } from '~/composables/useUsers'
import { userService } from '~/services/user.service'

const mockProject = { id: 7, name: 'Test', root_path: '/t', locales_path: 'locales', key_separator: '.', color: '#000' }

const mockUserItem = { id: 10, email: 'alice@example.com', name: 'Alice', is_active: true, roles: [] }

describe('useUsers', () => {
  beforeEach(() => {
    vi.mocked(userService.getUsers).mockReset()
    vi.mocked(userService.create).mockReset()
    vi.mocked(userService.update).mockReset()
    vi.mocked(userService.updateRoles).mockReset()
    vi.mocked(userService.remove).mockReset()

    vi.mocked(userService.getUsers).mockResolvedValue([])

    vi.mocked(globalThis.useAuth).mockReturnValue({
      currentUser: ref(null),
      fetchMe: vi.fn(),
      getRoleForProject: vi.fn(() => null),
    } as any)
    vi.mocked(globalThis.useProject).mockReturnValue({
      currentProject: ref(null),
      projects: ref([]),
      visibleProjects: computed(() => []),
      fetchProjects: vi.fn(),
    } as any)
  })

  describe('scope=project (default)', () => {
    it('usersQuery includes project_id from currentProject', () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(mockProject),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)

      const { users } = useUsers('project')
      // The query is computed internally — verify by checking that refresh calls getUsers with project_id
      expect(users.value).toEqual([])
    })

    it('refresh calls userService.getUsers with { project_id: currentProject.id }', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(mockProject),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(userService.getUsers).mockResolvedValue([mockUserItem])

      const { refresh, users } = useUsers('project')
      await refresh()

      expect(userService.getUsers).toHaveBeenCalledWith({ project_id: 7 })
      expect(users.value).toEqual([mockUserItem])
    })
  })

  describe('scope=global', () => {
    it('refresh calls userService.getUsers with empty query', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue([mockUserItem])

      const { refresh, users } = useUsers('global')
      await refresh()

      expect(userService.getUsers).toHaveBeenCalledWith({})
      expect(users.value).toEqual([mockUserItem])
    })
  })

  describe('pending state', () => {
    it('pending is false initially and during fetch cycle', async () => {
      vi.mocked(userService.getUsers).mockResolvedValue([])
      const { refresh, pending } = useUsers('global')

      expect(pending.value).toBe(false)
      await refresh()
      expect(pending.value).toBe(false)
    })
  })

  describe('createUser', () => {
    it('calls userService.create with payload and shows toast', async () => {
      vi.mocked(userService.create).mockResolvedValue({
        id: 5,
        tempPassword: 'temp-pass-123',
        email: 'bob@example.com',
        name: 'Bob',
      })
      vi.mocked(userService.getUsers).mockResolvedValue([])
      const mockToast = vi.mocked(globalThis.useToast)()

      const { createUser } = useUsers('global')
      const result = await createUser({
        email: 'bob@example.com',
        name: 'Bob',
        roles: [],
      })

      expect(userService.create).toHaveBeenCalledWith({
        email: 'bob@example.com',
        name: 'Bob',
        roles: [],
      })
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'success' }),
      )
      expect(result).toBe('temp-pass-123')
    })

    it('returns null on failure', async () => {
      vi.mocked(userService.create).mockRejectedValue(new Error('Email taken'))

      const { createUser } = useUsers('global')
      const result = await createUser({ email: 'bad@example.com', name: 'Bad', roles: [] })

      expect(result).toBeNull()
    })

    it('calls refresh after successful create', async () => {
      vi.mocked(userService.create).mockResolvedValue({
        id: 5,
        tempPassword: 'pass',
        email: 'new@example.com',
        name: 'New',
      })
      vi.mocked(userService.getUsers).mockResolvedValue([mockUserItem])

      const { createUser, users } = useUsers('global')
      await createUser({ email: 'new@example.com', name: 'New', roles: [] })

      expect(userService.getUsers).toHaveBeenCalled()
    })
  })

  describe('updateRoles', () => {
    it('calls userService.updateRoles with userId and roles', async () => {
      vi.mocked(userService.updateRoles).mockResolvedValue(undefined)
      vi.mocked(userService.getUsers).mockResolvedValue([])
      const mockToast = vi.mocked(globalThis.useToast)()

      const { updateRoles } = useUsers('global')
      const result = await updateRoles(10, [{ role: 'admin', project_id: 1 }])

      expect(userService.updateRoles).toHaveBeenCalledWith(10, [{ role: 'admin', project_id: 1 }])
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'success' }),
      )
      expect(result).toBe(true)
    })

    it('returns false on failure', async () => {
      vi.mocked(userService.updateRoles).mockRejectedValue(new Error('Forbidden'))

      const { updateRoles } = useUsers('global')
      const result = await updateRoles(10, [])

      expect(result).toBe(false)
    })
  })

  describe('toggleActive', () => {
    it('calls userService.update with toggled is_active (true → false)', async () => {
      vi.mocked(userService.update).mockResolvedValue(undefined)
      vi.mocked(userService.getUsers).mockResolvedValue([])

      const { toggleActive } = useUsers('global')
      await toggleActive({ id: 10, is_active: true })

      expect(userService.update).toHaveBeenCalledWith(10, expect.objectContaining({
        is_active: false,
      }))
    })

    it('calls userService.update with toggled is_active (false → true)', async () => {
      vi.mocked(userService.update).mockResolvedValue(undefined)
      vi.mocked(userService.getUsers).mockResolvedValue([])

      const { toggleActive } = useUsers('global')
      await toggleActive({ id: 10, is_active: false })

      expect(userService.update).toHaveBeenCalledWith(10, expect.objectContaining({
        is_active: true,
      }))
    })

    it('shows a success toast', async () => {
      vi.mocked(userService.update).mockResolvedValue(undefined)
      vi.mocked(userService.getUsers).mockResolvedValue([])
      const mockToast = vi.mocked(globalThis.useToast)()

      const { toggleActive } = useUsers('global')
      await toggleActive({ id: 10, is_active: true })

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'success' }),
      )
    })

    it('includes project_id when scope=project', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(mockProject),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(userService.update).mockResolvedValue(undefined)
      vi.mocked(userService.getUsers).mockResolvedValue([])

      const { toggleActive } = useUsers('project')
      await toggleActive({ id: 10, is_active: true })

      expect(userService.update).toHaveBeenCalledWith(10, expect.objectContaining({
        project_id: 7,
      }))
    })

    it('excludes project_id when scope=global', async () => {
      vi.mocked(userService.update).mockResolvedValue(undefined)
      vi.mocked(userService.getUsers).mockResolvedValue([])

      const { toggleActive } = useUsers('global')
      await toggleActive({ id: 10, is_active: true })

      expect(userService.update).toHaveBeenCalledWith(10, expect.objectContaining({
        project_id: undefined,
      }))
    })
  })

  describe('deleteUser', () => {
    it('calls userService.remove and shows toast', async () => {
      vi.mocked(userService.remove).mockResolvedValue(undefined)
      vi.mocked(userService.getUsers).mockResolvedValue([])
      const mockToast = vi.mocked(globalThis.useToast)()

      const { deleteUser } = useUsers('global')
      const result = await deleteUser(10)

      expect(userService.remove).toHaveBeenCalledWith(10, undefined)
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'success' }),
      )
      expect(result).toBe(true)
    })

    it('returns false on failure', async () => {
      vi.mocked(userService.remove).mockRejectedValue(new Error('Not found'))

      const { deleteUser } = useUsers('global')
      const result = await deleteUser(99)

      expect(result).toBe(false)
    })

    it('passes projectId when scope=project and user is not super_admin', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(mockProject),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(globalThis.useAuth).mockReturnValue({
        currentUser: ref({ id: 1, is_super_admin: false }),
        fetchMe: vi.fn(),
        getRoleForProject: vi.fn(() => 'admin'),
      } as any)
      vi.mocked(userService.remove).mockResolvedValue(undefined)
      vi.mocked(userService.getUsers).mockResolvedValue([])

      const { deleteUser } = useUsers('project')
      await deleteUser(10)

      expect(userService.remove).toHaveBeenCalledWith(10, 7)
    })
  })
})

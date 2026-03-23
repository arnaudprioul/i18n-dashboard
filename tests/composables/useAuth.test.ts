import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'

vi.mock('~/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    updateMe: vi.fn(),
  },
}))

// Reset module between tests so _currentUser module-level ref is fresh
// We use vi.isolateModules or just reset state manually via the composable itself

import { useAuth } from '~/composables/useAuth'
import { authService } from '~/services/auth.service'

const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  is_super_admin: false,
  is_active: true,
  roles: [],
}

describe('useAuth', () => {
  beforeEach(async () => {
    vi.mocked(authService.me).mockReset()
    vi.mocked(authService.login).mockReset()
    vi.mocked(authService.logout).mockReset()
    vi.mocked(authService.changePassword).mockReset()
    vi.mocked(authService.updateMe).mockReset()
    // Reset module-level _currentUser to null between tests
    const auth = useAuth()
    // Force null state by making logout resolve without error
    vi.mocked(authService.logout).mockResolvedValue(undefined)
    await auth.logout()
    vi.mocked(authService.logout).mockReset()
  })

  describe('initial state', () => {
    it('currentUser starts as null', () => {
      const { currentUser } = useAuth()
      expect(currentUser.value).toBeNull()
    })
  })

  describe('fetchMe', () => {
    it('calls $fetch /api/auth/me and sets currentUser on success', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce(mockUser)
      const { currentUser, fetchMe } = useAuth()

      const result = await fetchMe()

      expect(globalThis.$fetch).toHaveBeenCalledWith('/api/auth/me')
      expect(currentUser.value).toEqual(mockUser)
      expect(result).toEqual(mockUser)
    })

    it('sets currentUser to null and returns null on failure', async () => {
      vi.mocked(globalThis.$fetch as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const { currentUser, fetchMe } = useAuth()

      const result = await fetchMe()

      expect(currentUser.value).toBeNull()
      expect(result).toBeNull()
    })
  })

  describe('login', () => {
    it('calls authService.login with credentials and sets currentUser', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockUser)
      const { currentUser, login } = useAuth()

      const result = await login('test@example.com', 'password123')

      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(currentUser.value).toEqual(mockUser)
      expect(result).toEqual(mockUser)
    })
  })

  describe('logout', () => {
    it('calls authService.logout and sets currentUser to null', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce(mockUser)
      vi.mocked(authService.logout).mockResolvedValue(undefined)
      const { currentUser, fetchMe, logout } = useAuth()

      await fetchMe()
      expect(currentUser.value).toEqual(mockUser)

      const result = await logout()

      expect(authService.logout).toHaveBeenCalledOnce()
      expect(currentUser.value).toBeNull()
      expect(result).toBeNull()
    })
  })

  describe('changePassword', () => {
    it('calls authService.changePassword with both passwords', async () => {
      vi.mocked(authService.changePassword).mockResolvedValue(undefined)
      const { changePassword } = useAuth()

      await changePassword('oldPass', 'newPass')

      expect(authService.changePassword).toHaveBeenCalledWith('oldPass', 'newPass')
    })
  })

  describe('getRoleForProject', () => {
    it('returns null when no user is logged in', () => {
      const { getRoleForProject } = useAuth()
      expect(getRoleForProject(1)).toBeNull()
    })

    it('returns super_admin when user is_super_admin', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({ ...mockUser, is_super_admin: true })
      const { fetchMe, getRoleForProject } = useAuth()
      await fetchMe()

      expect(getRoleForProject(1)).toBe('super_admin')
    })

    it('returns specific project role when found', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({
        ...mockUser,
        roles: [{ role: 'moderator', project_id: 5 }],
      })
      const { fetchMe, getRoleForProject } = useAuth()
      await fetchMe()

      expect(getRoleForProject(5)).toBe('moderator')
    })

    it('falls back to global role (project_id: null) when no specific role', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({
        ...mockUser,
        roles: [
          { role: 'translator', project_id: null },
          { role: 'admin', project_id: 99 },
        ],
      })
      const { fetchMe, getRoleForProject } = useAuth()
      await fetchMe()

      // Project 5 has no specific role, should fall back to global
      expect(getRoleForProject(5)).toBe('translator')
    })

    it('returns null when no specific or global role found', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({
        ...mockUser,
        roles: [{ role: 'admin', project_id: 99 }],
      })
      const { fetchMe, getRoleForProject } = useAuth()
      await fetchMe()

      expect(getRoleForProject(1)).toBeNull()
    })
  })

  describe('canApprove', () => {
    it('returns true for super_admin', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({ ...mockUser, is_super_admin: true })
      const { fetchMe, canApprove } = useAuth()
      await fetchMe()

      expect(canApprove(1)).toBe(true)
    })

    it('returns true for admin role', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({
        ...mockUser,
        roles: [{ role: 'admin', project_id: 1 }],
      })
      const { fetchMe, canApprove } = useAuth()
      await fetchMe()

      expect(canApprove(1)).toBe(true)
    })

    it('returns true for moderator role', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({
        ...mockUser,
        roles: [{ role: 'moderator', project_id: 1 }],
      })
      const { fetchMe, canApprove } = useAuth()
      await fetchMe()

      expect(canApprove(1)).toBe(true)
    })

    it('returns false for translator role', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({
        ...mockUser,
        roles: [{ role: 'translator', project_id: 1 }],
      })
      const { fetchMe, canApprove } = useAuth()
      await fetchMe()

      expect(canApprove(1)).toBe(false)
    })

    it('returns false when no role', () => {
      const { canApprove } = useAuth()
      expect(canApprove(1)).toBe(false)
    })
  })

  describe('canManageProject', () => {
    it('returns true for super_admin', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({ ...mockUser, is_super_admin: true })
      const { fetchMe, canManageProject } = useAuth()
      await fetchMe()

      expect(canManageProject(1)).toBe(true)
    })

    it('returns true for admin role', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({
        ...mockUser,
        roles: [{ role: 'admin', project_id: 1 }],
      })
      const { fetchMe, canManageProject } = useAuth()
      await fetchMe()

      expect(canManageProject(1)).toBe(true)
    })

    it('returns false for moderator role', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({
        ...mockUser,
        roles: [{ role: 'moderator', project_id: 1 }],
      })
      const { fetchMe, canManageProject } = useAuth()
      await fetchMe()

      expect(canManageProject(1)).toBe(false)
    })

    it('returns false for translator role', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({
        ...mockUser,
        roles: [{ role: 'translator', project_id: 1 }],
      })
      const { fetchMe, canManageProject } = useAuth()
      await fetchMe()

      expect(canManageProject(1)).toBe(false)
    })
  })

  describe('canManageUsers', () => {
    it('returns false when no user logged in', () => {
      const { canManageUsers } = useAuth()
      expect(canManageUsers(1)).toBe(false)
    })

    it('returns true for super_admin regardless of projectId', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({ ...mockUser, is_super_admin: true })
      const { fetchMe, canManageUsers } = useAuth()
      await fetchMe()

      expect(canManageUsers()).toBe(true)
      expect(canManageUsers(1)).toBe(true)
      expect(canManageUsers(999)).toBe(true)
    })

    it('returns false when no projectId provided for non-super-admin', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({
        ...mockUser,
        roles: [{ role: 'admin', project_id: null }],
      })
      const { fetchMe, canManageUsers } = useAuth()
      await fetchMe()

      expect(canManageUsers()).toBe(false)
    })

    it('returns true for admin with projectId', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({
        ...mockUser,
        roles: [{ role: 'admin', project_id: 1 }],
      })
      const { fetchMe, canManageUsers } = useAuth()
      await fetchMe()

      expect(canManageUsers(1)).toBe(true)
    })

    it('returns false for moderator with projectId', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValueOnce({
        ...mockUser,
        roles: [{ role: 'moderator', project_id: 1 }],
      })
      const { fetchMe, canManageUsers } = useAuth()
      await fetchMe()

      expect(canManageUsers(1)).toBe(false)
    })
  })
})

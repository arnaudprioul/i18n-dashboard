import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'

vi.mock('~/services/profile.service', () => ({
  profileService: {
    getProfile: vi.fn().mockResolvedValue({ id: 1, name: 'Me', email: 'me@example.com' }),
    getUserProfile: vi.fn().mockResolvedValue({ id: 2, name: 'Other', email: 'other@example.com' }),
  },
}))

vi.mock('~/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    updateMe: vi.fn().mockResolvedValue({ id: 1, name: 'Updated', email: 'updated@example.com' }),
  },
}))

vi.mock('~/services/user.service', () => ({
  userService: {
    getUsers: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
    updateRoles: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}))

import { useProfile } from '~/composables/useProfile'
import { profileService } from '~/services/profile.service'
import { authService } from '~/services/auth.service'
import { userService } from '~/services/user.service'

describe('useProfile', () => {
  beforeEach(() => {
    vi.mocked(profileService.getProfile).mockReset()
    vi.mocked(profileService.getUserProfile).mockReset()
    vi.mocked(authService.updateMe).mockReset()
    vi.mocked(userService.updateRoles).mockReset()

    vi.mocked(profileService.getProfile).mockResolvedValue({ id: 1, name: 'Me' } as any)
    vi.mocked(profileService.getUserProfile).mockResolvedValue({ id: 2, name: 'Other' } as any)
    vi.mocked(authService.updateMe).mockResolvedValue({ id: 1, name: 'Updated', email: 'u@example.com' } as any)
    vi.mocked(userService.updateRoles).mockResolvedValue(undefined)

    vi.mocked(globalThis.useAuth).mockReturnValue({
      currentUser: ref(null),
      fetchMe: vi.fn().mockResolvedValue(null),
      getRoleForProject: vi.fn(() => null),
    } as any)
  })

  describe('without userId', () => {
    it('calls profileService.getProfile when no userId provided', async () => {
      const { refresh } = useProfile()
      await refresh()

      expect(profileService.getProfile).toHaveBeenCalledWith('all')
      expect(profileService.getUserProfile).not.toHaveBeenCalled()
    })

    it('sets profile from getProfile result', async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue({ id: 1, name: 'Current User' } as any)
      const { refresh, profile } = useProfile()
      await refresh()

      expect(profile.value).toEqual({ id: 1, name: 'Current User' })
    })
  })

  describe('with userId', () => {
    it('calls profileService.getUserProfile with id and period', async () => {
      vi.mocked(profileService.getUserProfile).mockResolvedValue({ id: 5, name: 'Target' } as any)

      const { refresh, profile } = useProfile(5)
      await refresh()

      expect(profileService.getUserProfile).toHaveBeenCalledWith(5, 'all')
      expect(profile.value).toEqual({ id: 5, name: 'Target' })
    })

    it('uses string userId correctly', async () => {
      vi.mocked(profileService.getUserProfile).mockResolvedValue({ id: 5, name: 'Target' } as any)

      const { refresh } = useProfile('5')
      await refresh()

      expect(profileService.getUserProfile).toHaveBeenCalledWith('5', 'all')
    })
  })

  describe('period', () => {
    it('initial period is "all"', () => {
      const { period } = useProfile()
      expect(period.value).toBe('all')
    })

    it('changing period triggers refresh with new period', async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue({ id: 1 } as any)
      const { period, refresh } = useProfile()

      period.value = 'month' as any
      await refresh()

      expect(profileService.getProfile).toHaveBeenCalledWith('month')
    })
  })

  describe('updateProfile', () => {
    it('calls authService.updateMe with name and email', async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue({ id: 1 } as any)
      const mockToast = vi.mocked(globalThis.useToast)()

      const { updateProfile } = useProfile()
      const result = await updateProfile('New Name', 'new@example.com')

      expect(authService.updateMe).toHaveBeenCalledWith({ name: 'New Name', email: 'new@example.com' })
      expect(result).toBe(true)
    })

    it('shows success toast on success', async () => {
      vi.mocked(profileService.getProfile).mockResolvedValue({ id: 1 } as any)
      const mockToast = vi.mocked(globalThis.useToast)()

      const { updateProfile } = useProfile()
      await updateProfile('Name', 'email@example.com')

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'success' }),
      )
    })

    it('sets editError and returns false on failure', async () => {
      vi.mocked(authService.updateMe).mockRejectedValue(
        Object.assign(new Error('Email already taken'), { message: 'Email already taken' }),
      )

      const { updateProfile, editError } = useProfile()
      const result = await updateProfile('Name', 'taken@example.com')

      expect(result).toBe(false)
      expect(editError.value).toBe('Email already taken')
    })

    it('clears editError at the start of each call', async () => {
      vi.mocked(authService.updateMe).mockRejectedValue(
        Object.assign(new Error('Error 1'), { message: 'Error 1' }),
      )
      const { updateProfile, editError } = useProfile()
      await updateProfile('Name', 'a@b.com')
      expect(editError.value).toBe('Error 1')

      vi.mocked(authService.updateMe).mockResolvedValue({ id: 1, name: 'OK', email: 'ok@example.com' } as any)
      vi.mocked(profileService.getProfile).mockResolvedValue({ id: 1 } as any)
      await updateProfile('Name', 'ok@example.com')
      expect(editError.value).toBe('')
    })
  })

  describe('saveRoles', () => {
    it('calls userService.updateRoles with targetId converted to number', async () => {
      vi.mocked(profileService.getUserProfile).mockResolvedValue({ id: 5 } as any)
      const mockToast = vi.mocked(globalThis.useToast)()

      const { saveRoles } = useProfile(5)
      const result = await saveRoles([{ project_id: 1, role: 'admin' }])

      expect(userService.updateRoles).toHaveBeenCalledWith(5, [{ project_id: 1, role: 'admin' }])
      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'success' }),
      )
      expect(result).toBe(true)
    })

    it('returns false when no targetId (no userId provided)', async () => {
      const { saveRoles } = useProfile()
      const result = await saveRoles([{ project_id: 1, role: 'admin' }])

      expect(userService.updateRoles).not.toHaveBeenCalled()
      expect(result).toBe(false)
    })

    it('returns false on service failure', async () => {
      vi.mocked(userService.updateRoles).mockRejectedValue(new Error('Forbidden'))

      const { saveRoles } = useProfile(5)
      const result = await saveRoles([{ project_id: 1, role: 'admin' }])

      expect(result).toBe(false)
    })
  })

  describe('pending state', () => {
    it('pending is false initially', () => {
      const { pending } = useProfile()
      expect(pending.value).toBe(false)
    })

    it('sets pending true during fetch and false after', async () => {
      let resolveFetch!: (v: any) => void
      vi.mocked(profileService.getProfile).mockReturnValue(
        new Promise(resolve => { resolveFetch = resolve }),
      )

      const { refresh, pending } = useProfile()
      expect(pending.value).toBe(false)

      const refreshPromise = refresh()
      await nextTick()
      expect(pending.value).toBe(true)

      resolveFetch({ id: 1 })
      await refreshPromise
      expect(pending.value).toBe(false)
    })
  })
})

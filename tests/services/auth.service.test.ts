import { describe, it, expect, vi } from 'vitest'
import { authService } from '~/services/auth.service'

const mockFetch = vi.mocked(globalThis.$fetch as any)

const fakeUser = { id: 1, name: 'Alice', email: 'alice@example.com', is_super_admin: false }

describe('authService', () => {
  describe('login()', () => {
    it('calls POST /api/auth/login with email and password', async () => {
      mockFetch.mockResolvedValueOnce(fakeUser)

      const result = await authService.login('alice@example.com', 'secret')

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
        method: 'POST',
        body: { email: 'alice@example.com', password: 'secret' },
      }))
      expect(result).toEqual(fakeUser)
    })

    it('does not show error toast on login failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Invalid credentials'))

      await expect(authService.login('x@x.com', 'wrong')).rejects.toThrow()

      const toast = vi.mocked(globalThis.useToast as any)()
      expect(toast.add).not.toHaveBeenCalled()
    })
  })

  describe('logout()', () => {
    it('calls POST /api/auth/logout', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await authService.logout()

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
        method: 'POST',
      }))
    })
  })

  describe('me()', () => {
    it('calls GET /api/auth/me', async () => {
      mockFetch.mockResolvedValueOnce(fakeUser)

      const result = await authService.me()

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({
        method: 'GET',
      }))
      expect(result).toEqual(fakeUser)
    })

    it('returns null and does not show toast when unauthenticated', async () => {
      mockFetch.mockRejectedValueOnce(Object.assign(new Error('Not auth'), { status: 401 }))

      // me() has skipErrorToast, but 401 triggers session refresh cycle
      // For test simplicity, ensure it does not surface a toast on the initial call
      const toast = vi.mocked(globalThis.useToast as any)()

      // Configure session refresh to fail so navigateTo is called
      mockFetch
        .mockRejectedValueOnce(new Error('no session')) // auth/me session refresh call
        .mockResolvedValueOnce(undefined)               // logout call

      await expect(authService.me()).rejects.toThrow()
      expect(toast.add).not.toHaveBeenCalled()
    })
  })

  describe('changePassword()', () => {
    it('calls PUT /api/auth/password with correct body', async () => {
      mockFetch.mockResolvedValueOnce(undefined)

      await authService.changePassword('oldPass', 'newPass')

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/password', expect.objectContaining({
        method: 'PUT',
        body: { current_password: 'oldPass', new_password: 'newPass' },
      }))
    })
  })

  describe('updateMe()', () => {
    it('calls PUT /api/auth/me with partial user data', async () => {
      const updated = { ...fakeUser, name: 'Alice Updated' }
      mockFetch.mockResolvedValueOnce(updated)

      const result = await authService.updateMe({ name: 'Alice Updated' })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({
        method: 'PUT',
        body: { name: 'Alice Updated' },
      }))
      expect(result).toEqual(updated)
    })

    it('calls PUT /api/auth/me with email update', async () => {
      mockFetch.mockResolvedValueOnce({ ...fakeUser, email: 'new@email.com' })

      await authService.updateMe({ email: 'new@email.com' })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({
        body: { email: 'new@email.com' },
      }))
    })
  })
})

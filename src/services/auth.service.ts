import { SBase } from './base.service'
import type { IAuthUser } from '../interfaces/auth.interface'

class SAuth extends SBase {
  async login(email: string, password: string): Promise<IAuthUser> {
    return this.post<IAuthUser>('/api/auth/login', {
      body: { email, password },
      skipErrorToast: true, // login errors are handled by the page
    })
  }

  async logout(): Promise<void> {
    return this.post('/api/auth/logout', { skipDedup: true })
  }

  async me(): Promise<IAuthUser | null> {
    return this.get<IAuthUser | null>('/api/auth/me', { skipErrorToast: true })
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.put('/api/auth/password', {
      body: { current_password: currentPassword, new_password: newPassword },
    })
  }

  async updateMe(data: { name?: string; email?: string }): Promise<IAuthUser> {
    return this.put<IAuthUser>('/api/auth/me', { body: data })
  }

  async forgotPassword(email: string): Promise<void> {
    return this.post('/api/auth/forgot-password', { body: { email }, skipDedup: true, skipErrorToast: true })
  }

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<void> {
    return this.post('/api/auth/reset-password', {
      body: { token, password, confirm_password: confirmPassword },
      skipDedup: true,
      skipErrorToast: true,
    })
  }
}

export const authService = new SAuth()

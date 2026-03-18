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
}

export const authService = new SAuth()

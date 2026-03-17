import { BaseService } from './base.service'
import type { AuthUser } from '../composables/useAuth'

class AuthService extends BaseService {
  async login(email: string, password: string): Promise<AuthUser> {
    return this.post<AuthUser>('/api/auth/login', {
      body: { email, password },
      skipErrorToast: true, // login errors are handled by the page
    })
  }

  async logout(): Promise<void> {
    return this.post('/api/auth/logout', { skipDedup: true })
  }

  async me(): Promise<AuthUser | null> {
    return this.get<AuthUser | null>('/api/auth/me', { skipErrorToast: true })
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.put('/api/auth/password', {
      body: { current_password: currentPassword, new_password: newPassword },
    })
  }

  async updateMe(data: { name?: string; email?: string }): Promise<AuthUser> {
    return this.put<AuthUser>('/api/auth/me', { body: data })
  }
}

export const authService = new AuthService()

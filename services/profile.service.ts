import { BaseService } from './base.service'
import type { UserProfile } from '../server/interfaces/profile.interface'

class ProfileService extends BaseService {
  async getProfile(): Promise<UserProfile> {
    return this.get<UserProfile>('/api/profile')
  }

  async getUserProfile(id: number | string): Promise<UserProfile> {
    return this.get<UserProfile>(`/api/users/${id}/profile`)
  }
}

export const profileService = new ProfileService()

import { BaseService } from './base.service'
import type { UserProfile, ProfilePeriod } from '../server/interfaces/profile.interface'

class ProfileService extends BaseService {
  async getProfile(period: ProfilePeriod = 'all'): Promise<UserProfile> {
    return this.get<UserProfile>('/api/profile', { query: { period } })
  }

  async getUserProfile(id: number | string, period: ProfilePeriod = 'all'): Promise<UserProfile> {
    return this.get<UserProfile>(`/api/users/${id}/profile`, { query: { period } })
  }
}

export const profileService = new ProfileService()

import { SBaseService } from './base.service'
import type { IUserProfile, ProfilePeriod } from '../server/interfaces/profile.interface'

class SProfileService extends SBaseService {
  async getProfile(period: ProfilePeriod = 'all'): Promise<IUserProfile> {
    return this.get<IUserProfile>('/api/profile', { query: { period } })
  }

  async getUserProfile(id: number | string, period: ProfilePeriod = 'all'): Promise<IUserProfile> {
    return this.get<IUserProfile>(`/api/users/${id}/profile`, { query: { period } })
  }
}

export const profileService = new SProfileService()

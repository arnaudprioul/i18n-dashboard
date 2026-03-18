import { SBaseService } from './base.service'
import type { ISettingsPayload } from '../interfaces/settings.interface'

class SSettingsService extends SBaseService {
  async getSettings(): Promise<Record<string, string>> {
    return this.get<Record<string, string>>('/api/settings')
  }

  async saveSettings(data: ISettingsPayload): Promise<void> {
    return this.post('/api/settings', { body: data, skipDedup: true })
  }
}

export const settingsService = new SSettingsService()

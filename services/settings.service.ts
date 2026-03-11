import { BaseService } from './base.service'
import type { SettingsPayload } from '../interfaces/settings.interface'

class SettingsService extends BaseService {
  async getSettings(): Promise<Record<string, string>> {
    return this.get<Record<string, string>>('/api/settings')
  }

  async saveSettings(data: SettingsPayload): Promise<void> {
    return this.post('/api/settings', { body: data, skipDedup: true })
  }
}

export const settingsService = new SettingsService()

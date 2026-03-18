import { SBase } from './base.service'
import type { ISettingsPayload } from '../interfaces/settings.interface'

class SSettings extends SBase {
  async getSettings(): Promise<Record<string, string>> {
    return this.get<Record<string, string>>('/api/settings')
  }

  async saveSettings(data: ISettingsPayload): Promise<void> {
    return this.post('/api/settings', { body: data, skipDedup: true })
  }
}

export const settingsService = new SSettings()

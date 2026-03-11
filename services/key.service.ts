import { BaseService } from './base.service'
import type { KeyItem, KeysQuery, KeysResponse } from '../interfaces/key.interface'

class KeyService extends BaseService {
  async getKeys(query: KeysQuery): Promise<KeysResponse> {
    return this.get<KeysResponse>('/api/keys', { query })
  }

  async getKey(id: number | string): Promise<KeyItem> {
    return this.get<KeyItem>(`/api/keys/${id}`)
  }

  async createKey(data: { project_id: number; key: string; description?: string }): Promise<KeyItem> {
    return this.post<KeyItem>('/api/keys', { body: data, skipDedup: true })
  }

  async updateKey(id: number | string, data: { description?: string | null }): Promise<void> {
    return this.patch(`/api/keys/${id}`, { body: data })
  }

  async deleteKey(id: number | string): Promise<void> {
    return this.delete(`/api/keys/${id}`)
  }
}

export const keyService = new KeyService()

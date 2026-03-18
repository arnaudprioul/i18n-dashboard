import { SBaseService } from './base.service'
import type { IKeyItem, IKeysQuery, IKeysResponse } from '../interfaces/key.interface'

class SKeyService extends SBaseService {
  async getKeys(query: IKeysQuery): Promise<IKeysResponse> {
    return this.get<IKeysResponse>('/api/keys', { query })
  }

  async getKey(id: number | string): Promise<IKeyItem> {
    return this.get<IKeyItem>(`/api/keys/${id}`)
  }

  async createKey(data: { project_id: number; key: string; description?: string }): Promise<IKeyItem> {
    return this.post<IKeyItem>('/api/keys', { body: data, skipDedup: true })
  }

  async updateKey(id: number | string, data: { description?: string | null }): Promise<void> {
    return this.patch(`/api/keys/${id}`, { body: data })
  }

  async deleteKey(id: number | string): Promise<void> {
    return this.delete(`/api/keys/${id}`)
  }
}

export const keyService = new SKeyService()

import { BaseService } from './base.service'
import type { CreateLanguagePayload, LanguageItem } from '../interfaces/languages.interface'

class LanguageService extends BaseService {
  async getLanguages(projectId?: number): Promise<LanguageItem[]> {
    if (!projectId) return []
    return this.get<LanguageItem[]>('/api/languages', { query: { project_id: projectId } })
  }

  async create(data: CreateLanguagePayload): Promise<void> {
    return this.post('/api/languages', { body: data, skipDedup: true })
  }

  async setDefault(lang: LanguageItem, projectId: number): Promise<void> {
    return this.post('/api/languages', {
      body: { ...lang, project_id: projectId, is_default: true },
      skipDedup: true,
    })
  }

  async remove(code: string, projectId: number): Promise<void> {
    return this.delete(`/api/languages/${code}`, { query: { project_id: projectId } })
  }
}

export const languageService = new LanguageService()

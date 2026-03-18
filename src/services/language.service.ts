import { SBase } from './base.service'
import type { ICreateLanguagePayload, ILanguageItem } from '../interfaces/languages.interface'

class SLanguage extends SBase {
  async getLanguages(projectId?: number): Promise<ILanguageItem[]> {
    if (!projectId) return []
    return this.get<ILanguageItem[]>('/api/languages', { query: { project_id: projectId } })
  }

  async create(data: ICreateLanguagePayload): Promise<void> {
    return this.post('/api/languages', { body: data, skipDedup: true })
  }

  async setDefault(lang: ILanguageItem, projectId: number): Promise<void> {
    return this.post('/api/languages', {
      body: { ...lang, project_id: projectId, is_default: true },
      skipDedup: true,
    })
  }

  async remove(code: string, projectId: number): Promise<void> {
    return this.delete(`/api/languages/${code}`, { query: { project_id: projectId } })
  }
}

export const languageService = new SLanguage()

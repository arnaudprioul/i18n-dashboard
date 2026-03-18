import { SBaseService } from './base.service'
import type { ISaveTranslationPayload, ISetStatusPayload } from '../interfaces/translation.interface'

class STranslationService extends SBaseService {
  async save(data: ISaveTranslationPayload): Promise<void> {
    return this.post('/api/translations', { body: data, skipDedup: true })
  }

  async setStatus(data: ISetStatusPayload): Promise<void> {
    return this.post('/api/translations/status', { body: data, skipDedup: true })
  }

  async bulkStatus(ids: number[], status: string): Promise<void> {
    return this.post('/api/translations/bulk-status', { body: { ids, status }, skipDedup: true })
  }

  async batchTranslate(projectId: number, targetLanguage: string): Promise<{ translated: number; skipped: number; errors: number }> {
    return this.post('/api/translations/batch-translate', {
      body: { project_id: projectId, target_language: targetLanguage },
      skipDedup: true,
    })
  }

  async translateAll(projectId: number, languageCode: string, languageName: string): Promise<{ jobId: string }> {
    return this.post('/api/translations/translate-all', {
      body: { project_id: projectId, language_code: languageCode, language_name: languageName },
      skipDedup: true,
    })
  }

  async translateText(text: string, from: string, to: string): Promise<{ text: string }> {
    return this.post<{ text: string }>('/api/translate', { body: { text, from, to }, skipDedup: true })
  }
}

export const translationService = new STranslationService()

import { SBase } from './base.service'

class SLocale extends SBase {
  async getUiLocale(lang: string): Promise<Record<string, string>> {
    return this.get<Record<string, string>>('/api/ui-locale', { query: { lang }, skipErrorToast: true })
  }
}

export const localeService = new SLocale()

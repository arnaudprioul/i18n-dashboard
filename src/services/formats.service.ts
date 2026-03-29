import { SBase } from './base.service'

class SFormats extends SBase {
  // Number formats
  async getNumberFormats(projectId?: number): Promise<any[]> {
    return this.get<any[]>('/api/formats/number', { query: { project_id: projectId } })
  }

  async createNumberFormat(projectId: number | undefined, locale: string, name: string, options: Record<string, any>): Promise<void> {
    return this.post('/api/formats/number', { body: { project_id: projectId, locale, name, options }, skipDedup: true })
  }

  async updateNumberFormat(id: number, locale: string, name: string, options: Record<string, any>): Promise<void> {
    return this.put(`/api/formats/number/${id}`, { body: { locale, name, options } })
  }

  async deleteNumberFormat(id: number): Promise<void> {
    return this.delete(`/api/formats/number/${id}`)
  }

  // Datetime formats
  async getDatetimeFormats(projectId?: number): Promise<any[]> {
    return this.get<any[]>('/api/formats/datetime', { query: { project_id: projectId } })
  }

  async createDatetimeFormat(projectId: number | undefined, locale: string, name: string, options: Record<string, any>): Promise<void> {
    return this.post('/api/formats/datetime', { body: { project_id: projectId, locale, name, options }, skipDedup: true })
  }

  async updateDatetimeFormat(id: number, locale: string, name: string, options: Record<string, any>): Promise<void> {
    return this.put(`/api/formats/datetime/${id}`, { body: { locale, name, options } })
  }

  async deleteDatetimeFormat(id: number): Promise<void> {
    return this.delete(`/api/formats/datetime/${id}`)
  }

  // Modifiers
  async getModifiers(projectId?: number): Promise<any[]> {
    return this.get<any[]>('/api/formats/modifiers', { query: { project_id: projectId } })
  }

  async createModifier(projectId: number | undefined, name: string, body: string): Promise<void> {
    return this.post('/api/formats/modifiers', { body: { project_id: projectId, name, body }, skipDedup: true })
  }

  async updateModifier(id: number, name: string, body: string): Promise<void> {
    return this.put(`/api/formats/modifiers/${id}`, { body: { name, body } })
  }

  async deleteModifier(id: number): Promise<void> {
    return this.delete(`/api/formats/modifiers/${id}`)
  }

  async getSnippet(projectId?: number): Promise<{ snippet: string }> {
    if (!projectId) return { snippet: '' }
    return this.get<{ snippet: string }>('/api/formats/snippet', { query: { project_id: projectId } })
  }

  async detectFromConfig(projectId: number, rootPath?: string): Promise<any> {
    return this.post('/api/formats/detect', { body: { project_id: projectId, root_path: rootPath } })
  }

  async importFromConfig(
    projectId: number,
    numberFormats: Array<{ locale: string; name: string; options: Record<string, any> }>,
    datetimeFormats: Array<{ locale: string; name: string; options: Record<string, any> }>,
    modifiers: Array<{ name: string; body: string }>,
  ): Promise<any> {
    return this.post('/api/formats/import-from-config', {
      body: { project_id: projectId, numberFormats, datetimeFormats, modifiers },
    })
  }
}

export const formatsService = new SFormats()

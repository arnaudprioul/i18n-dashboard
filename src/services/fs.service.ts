import { SBase } from './base.service'

export interface IFsBrowseResult {
  current: string
  parent: string | null
  home: string
  breadcrumbs: { name: string; path: string }[]
  entries: { name: string; path: string }[]
}

class SFs extends SBase {
  async browse(path?: string): Promise<IFsBrowseResult> {
    return this.get<IFsBrowseResult>('/api/fs/browse', { query: path ? { path } : {}, skipErrorToast: true })
  }
}

export const fsService = new SFs()

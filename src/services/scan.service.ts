import { SBase } from './base.service'
import type { IScanResult, ISyncResult } from '../interfaces/scan.interface'

class SScan extends SBase {
  async scan(projectId: number): Promise<IScanResult> {
    return this.post<IScanResult>('/api/scan', { body: { project_id: projectId }, skipDedup: true })
  }

  async sync(projectId: number): Promise<ISyncResult> {
    return this.post<ISyncResult>('/api/sync', { body: { project_id: projectId }, skipDedup: true })
  }

  async scanWithOptions(body: {
    project_id: number
    mode: string
    root_path?: string
    git_url?: string
    git_branch?: string
    git_token?: string
  }): Promise<IScanResult> {
    return this.post<IScanResult>('/api/scan', { body, skipDedup: true })
  }
}

export const scanService = new SScan()

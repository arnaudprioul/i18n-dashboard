import { SBaseService } from './base.service'
import type { IScanResult, ISyncResult } from '../interfaces/scan.interface'

class SScanService extends SBaseService {
  async scan(projectId: number): Promise<IScanResult> {
    return this.post<IScanResult>('/api/scan', { body: { project_id: projectId }, skipDedup: true })
  }

  async sync(projectId: number): Promise<ISyncResult> {
    return this.post<ISyncResult>('/api/sync', { body: { project_id: projectId }, skipDedup: true })
  }
}

export const scanService = new SScanService()

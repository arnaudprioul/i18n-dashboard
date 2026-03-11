import { BaseService } from './base.service'
import type { ScanResult, SyncResult } from '../interfaces/scan.interface'

class ScanService extends BaseService {
  async scan(projectId: number): Promise<ScanResult> {
    return this.post<ScanResult>('/api/scan', { body: { project_id: projectId }, skipDedup: true })
  }

  async sync(projectId: number): Promise<SyncResult> {
    return this.post<SyncResult>('/api/sync', { body: { project_id: projectId }, skipDedup: true })
  }
}

export const scanService = new ScanService()

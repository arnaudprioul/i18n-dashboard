import { SBase } from './base.service'
import type { IStatsResponse } from '../interfaces/stat.interface'

class SStats extends SBase {
  async getStats(projectId?: number): Promise<IStatsResponse | null> {
    if (!projectId) return null
    return this.get<IStatsResponse>('/api/stats', { query: { project_id: projectId } })
  }

  async getGlobalStats(): Promise<any> {
    return this.get<any>('/api/stats/global')
  }
}

export const statsService = new SStats()

import { SBaseService } from './base.service'
import type { IStatsResponse } from '../interfaces/stat.interface'

class SStatsService extends SBaseService {
  async getStats(projectId?: number): Promise<IStatsResponse | null> {
    if (!projectId) return null
    return this.get<IStatsResponse>('/api/stats', { query: { project_id: projectId } })
  }
}

export const statsService = new SStatsService()

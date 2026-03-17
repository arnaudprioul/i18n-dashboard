import { BaseService } from './base.service'
import type { StatsResponse } from '../interfaces/stat.interface'

class StatsService extends BaseService {
  async getStats(projectId?: number): Promise<StatsResponse | null> {
    if (!projectId) return null
    return this.get<StatsResponse>('/api/stats', { query: { project_id: projectId } })
  }
}

export const statsService = new StatsService()

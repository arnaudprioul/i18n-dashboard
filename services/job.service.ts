import { BaseService } from './base.service'
import type { JobStatus } from '../interfaces/job.interface'

class JobService extends BaseService {
  async getJob(jobId: string): Promise<JobStatus> {
    return this.get<JobStatus>(`/api/translations/job/${jobId}`)
  }
}

export const jobService = new JobService()

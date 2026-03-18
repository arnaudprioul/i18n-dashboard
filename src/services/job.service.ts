import { SBase } from './base.service'
import type { IJobStatus } from '../interfaces/job.interface'

class SJob extends SBase {
  async getJob(jobId: string): Promise<IJobStatus> {
    return this.get<IJobStatus>(`/api/translations/job/${jobId}`)
  }
}

export const jobService = new SJob()

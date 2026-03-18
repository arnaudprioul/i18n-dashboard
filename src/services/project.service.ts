import { SBaseService } from './base.service'
import type { IProject } from '../interfaces/project.interface'
import type { IProjectPayload } from '../interfaces/project.interface'

class SProjectService extends SBaseService {
  async getAll(): Promise<IProject[]> {
    return this.get<IProject[]>('/api/projects')
  }

  async create(data: IProjectPayload): Promise<IProject> {
    return this.post<IProject>('/api/projects', { body: data, skipDedup: true })
  }

  async update(id: number, data: Partial<IProjectPayload>): Promise<IProject> {
    return this.put<IProject>(`/api/projects/${id}`, { body: data })
  }

  async remove(id: number): Promise<void> {
    return this.delete(`/api/projects/${id}`)
  }
}

export const projectService = new SProjectService()

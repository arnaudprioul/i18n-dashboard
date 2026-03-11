import { BaseService } from './base.service'
import type { Project } from '../composables/useProject'
import type { ProjectPayload } from '../interfaces/project.interface'

class ProjectService extends BaseService {
  async getAll(): Promise<Project[]> {
    return this.get<Project[]>('/api/projects')
  }

  async create(data: ProjectPayload): Promise<Project> {
    return this.post<Project>('/api/projects', { body: data, skipDedup: true })
  }

  async update(id: number, data: Partial<ProjectPayload>): Promise<Project> {
    return this.put<Project>(`/api/projects/${id}`, { body: data })
  }

  async remove(id: number): Promise<void> {
    return this.delete(`/api/projects/${id}`)
  }
}

export const projectService = new ProjectService()

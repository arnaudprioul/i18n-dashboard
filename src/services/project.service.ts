import { SBase } from './base.service'
import type { IProject } from '../interfaces/project.interface'
import type { IProjectPayload } from '../interfaces/project.interface'

class SProject extends SBase {
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

  async checkName(name: string, excludeId?: number): Promise<{ available: boolean }> {
    return this.get<{ available: boolean }>('/api/projects/check-name', {
      query: excludeId !== undefined ? { name, exclude_id: excludeId } : { name },
      skipErrorToast: true,
    })
  }

  async detect(body: any): Promise<{ name?: string; localesPath?: string; languages: Array<{ code: string; name: string }> }> {
    return this.post('/api/projects/detect', { body, skipDedup: true, skipErrorToast: true })
  }

  async importSnapshot(data: { snapshot: any; project_id: number; mode: string }): Promise<any> {
    return this.post<any>('/api/project-snapshot', { body: data, skipDedup: true })
  }
}

export const projectService = new SProject()

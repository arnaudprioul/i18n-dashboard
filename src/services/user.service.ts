import { SBase } from './base.service'
import type { ICreateUserPayload, IRoleEntry, IUserItem } from '../interfaces/user.interface'

class SUser extends SBase {
  async getUsers(query?: { project_id?: number }): Promise<IUserItem[]> {
    return this.get<IUserItem[]>('/api/users', { query })
  }

  async getAvailableUsers(excludeProjectId: number): Promise<IUserItem[]> {
    return this.get<IUserItem[]>('/api/users', { query: { exclude_project_id: excludeProjectId }, skipErrorToast: true })
  }

  async create(data: ICreateUserPayload): Promise<{ id: number; tempPassword: string; email: string; name: string }> {
    return this.post('/api/users', { body: data, skipDedup: true })
  }

  async update(id: number, data: { is_active?: boolean; project_id?: number }): Promise<void> {
    return this.put(`/api/users/${id}`, { body: data })
  }

  async updateRoles(id: number, roles: IRoleEntry[]): Promise<void> {
    return this.put(`/api/users/${id}/roles`, { body: { roles } })
  }

  async remove(id: number, projectId?: number): Promise<void> {
    return this.delete(`/api/users/${id}`, {
      query: projectId ? { project_id: projectId } : undefined,
    })
  }
}

export const userService = new SUser()

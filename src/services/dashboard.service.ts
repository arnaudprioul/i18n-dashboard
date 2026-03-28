import { SBase } from './base.service'
import type { IWidgetConfig } from '../interfaces/dashboard.interface'

class SDashboard extends SBase {
  async getLayout(): Promise<IWidgetConfig[]> {
    return this.get<IWidgetConfig[]>('/api/dashboard/layout')
  }

  async saveLayout(widgets: IWidgetConfig[]): Promise<void> {
    return this.post('/api/dashboard/layout', { body: widgets, skipDedup: true })
  }

  async getProjectLayout(projectId: number): Promise<IWidgetConfig[]> {
    return this.get<IWidgetConfig[]>('/api/dashboard/project-layout', { query: { project_id: projectId } })
  }

  async saveProjectLayout(projectId: number, widgets: IWidgetConfig[]): Promise<void> {
    return this.post('/api/dashboard/project-layout', { body: { project_id: projectId, widgets }, skipDedup: true })
  }
}

export const dashboardService = new SDashboard()

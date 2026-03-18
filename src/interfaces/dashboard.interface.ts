export interface IWidgetDataSource {
  type: 'global' | 'project'
  projectId?: number // only when type === 'project'
}

export interface IWidgetConfig {
  id: string
  type: 'stat-keys' | 'stat-coverage' | 'stat-languages' | 'stat-unused' | 'projects' | 'languages-coverage' | 'last-activity' | 'review-queue'
  size: 'sm' | 'md' | 'lg' | 'wide' | 'xl'
  dataSource?: IWidgetDataSource // default = 'global'
  title?: string // optional custom title override
}

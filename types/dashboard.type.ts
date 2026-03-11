export type WidgetType =
  | 'stat-keys'
  | 'stat-coverage'
  | 'stat-languages'
  | 'stat-unused'
  | 'projects'
  | 'languages-coverage'
  | 'last-activity'
  | 'review-queue'

export type WidgetSize = 'sm' | 'md' | 'lg' | 'wide' | 'xl'

export type DataSourceType = 'global' | 'project'

export interface WidgetDataSource {
  type: DataSourceType
  projectId?: number // only when type === 'project'
}

export interface WidgetConfig {
  id: string
  type: WidgetType
  size: WidgetSize
  dataSource?: WidgetDataSource // default = 'global'
  title?: string // optional custom title override
}

export type TWidgetType =
  | 'stat-keys'
  | 'stat-coverage'
  | 'stat-languages'
  | 'stat-unused'
  | 'projects'
  | 'languages-coverage'
  | 'last-activity'
  | 'review-queue'

export type TWidgetSize = 'sm' | 'md' | 'lg' | 'wide' | 'xl'

export type TDataSourceType = 'global' | 'project'

// Re-export interface types for backward compatibility (consumers use these names)
export type { IWidgetDataSource as WidgetDataSource, IWidgetConfig as WidgetConfig } from '../interfaces/dashboard.interface'

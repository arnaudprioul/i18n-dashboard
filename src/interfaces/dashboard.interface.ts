export interface IWidgetDataSource {
  type: 'global' | 'project'
  projectId?: number // only when type === 'project'
}

export interface IWidgetConfig {
  id: string
  type: string  // built-in TWidgetType or any custom widget type defined in config
  size: 'sm' | 'md' | 'lg' | 'wide' | 'xl'
  dataSource?: IWidgetDataSource // default = 'global'
  title?: string // optional custom title override
}

import type { TWidgetSize, TDataSourceType, TWidgetType } from '../types/dashboard.type'

export interface IWidgetDataSource {
  type: TDataSourceType
  projectId?: number // only when type === 'project'
}

export interface IWidgetConfig {
  id: string
  type: string  // built-in TWidgetType or any custom widget type defined in config
  size: TWidgetSize
  dataSource?: IWidgetDataSource // default = 'global'
  title?: string // optional custom title override
}

// ── Shared widget props (used by all built-in widgets) ────────────────────────

export interface IWidgetBaseProps {
  id: string
  size: TWidgetSize
  editing: boolean
  dataSource?: IWidgetDataSource
  title?: string
}

export interface IStatWidgetProps extends IWidgetBaseProps {
  type: TWidgetType
}

// ── Component props ────────────────────────────────────────────────────────────

export interface IWidgetGridProps {
  projectId: number
}

export interface IWidgetPickerProps {
  modelValue: boolean
  excludeTypes?: string[]
}

export interface ICustomIframeWidgetProps {
  id: string
  type: string
  size: TWidgetSize
  editing?: boolean
  title?: string
}

export interface IProjectsWidgetProps {
  size: TWidgetSize
  editing: boolean
}

export interface IWidgetConfigModalProps {
  open: boolean
  widget?: IWidgetConfig | null
  index?: number
}

// ── Emits ─────────────────────────────────────────────────────────────────────

export interface IWidgetPickerEmits {
  'update:modelValue': [value: boolean]
  add: [widget: IWidgetConfig]
}

export interface IWidgetConfigModalEmits {
  'update:open': [value: boolean]
  save: [value: { dataSource: IWidgetDataSource | undefined; title: string | undefined }]
}

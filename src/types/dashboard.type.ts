import { WIDGET_SIZE, WIDGET_TYPE, DATA_SOURCE_TYPE } from '../enums/dashboard.enum'

export type TWidgetSize = `${WIDGET_SIZE}`

export type TWidgetType = `${WIDGET_TYPE}`

export type TDataSourceType = `${DATA_SOURCE_TYPE}`

// Re-export interface types for backward compatibility (consumers use these names)
export type { IWidgetDataSource as WidgetDataSource, IWidgetConfig as WidgetConfig } from '../interfaces/dashboard.interface'

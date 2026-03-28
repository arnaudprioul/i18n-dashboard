import type { TWidgetSize, TWidgetType } from '../types/dashboard.type'
import type { IWidgetConfig } from '../interfaces/dashboard.interface'
import { WIDGET_SIZE, WIDGET_TYPE, DATA_SOURCE_TYPE } from '../enums/dashboard.enum'

export const WIDGET_SIZES: Record<TWidgetSize, { cols: number; rows: number; label: string }> = {
  [WIDGET_SIZE.SM]:   { cols: 1, rows: 1, label: 'Petit' },
  [WIDGET_SIZE.MD]:   { cols: 2, rows: 1, label: 'Moyen' },
  [WIDGET_SIZE.LG]:   { cols: 2, rows: 2, label: 'Grand' },
  [WIDGET_SIZE.WIDE]: { cols: 4, rows: 1, label: 'Large' },
  [WIDGET_SIZE.XL]:   { cols: 4, rows: 2, label: 'Très grand' },
}

export const WIDGET_SIZE_CLASSES: Record<TWidgetSize, string> = {
  [WIDGET_SIZE.SM]:   'col-span-1 row-span-1',
  [WIDGET_SIZE.MD]:   'col-span-2 row-span-1',
  [WIDGET_SIZE.LG]:   'col-span-2 row-span-2',
  [WIDGET_SIZE.WIDE]: 'col-span-4 row-span-1',
  [WIDGET_SIZE.XL]:   'col-span-4 row-span-2',
}

export const WIDGET_REGISTRY: Record<TWidgetType, { label: string; description: string; icon: string; sizes: TWidgetSize[]; defaultSize: TWidgetSize; hasDataSource: boolean }> = {
  [WIDGET_TYPE.STAT_KEYS]: {
    label: 'Clés totales',
    description: 'Nombre total de clés de traduction',
    icon: 'i-heroicons-key',
    sizes: [WIDGET_SIZE.SM, WIDGET_SIZE.MD],
    defaultSize: WIDGET_SIZE.SM,
    hasDataSource: true,
  },
  [WIDGET_TYPE.STAT_COVERAGE]: {
    label: 'Couverture',
    description: 'Taux de couverture global des traductions',
    icon: 'i-heroicons-chart-bar',
    sizes: [WIDGET_SIZE.SM, WIDGET_SIZE.MD],
    defaultSize: WIDGET_SIZE.SM,
    hasDataSource: true,
  },
  [WIDGET_TYPE.STAT_LANGUAGES]: {
    label: 'Langues',
    description: 'Nombre de langues configurées',
    icon: 'i-heroicons-language',
    sizes: [WIDGET_SIZE.SM, WIDGET_SIZE.MD],
    defaultSize: WIDGET_SIZE.SM,
    hasDataSource: true,
  },
  [WIDGET_TYPE.STAT_UNUSED]: {
    label: 'Clés inutilisées',
    description: 'Clés non trouvées dans le code source',
    icon: 'i-heroicons-exclamation-triangle',
    sizes: [WIDGET_SIZE.SM, WIDGET_SIZE.MD],
    defaultSize: WIDGET_SIZE.SM,
    hasDataSource: true,
  },
  [WIDGET_TYPE.PROJECTS]: {
    label: 'Projets',
    description: 'Liste de vos projets de traduction',
    icon: 'i-heroicons-rectangle-stack',
    sizes: [WIDGET_SIZE.MD, WIDGET_SIZE.LG, WIDGET_SIZE.WIDE],
    defaultSize: WIDGET_SIZE.WIDE,
    hasDataSource: false,
  },
  [WIDGET_TYPE.LANGUAGES_COVERAGE]: {
    label: 'Couverture par langue',
    description: 'Progression de chaque langue',
    icon: 'i-heroicons-globe-alt',
    sizes: [WIDGET_SIZE.MD, WIDGET_SIZE.LG, WIDGET_SIZE.WIDE],
    defaultSize: WIDGET_SIZE.MD,
    hasDataSource: true,
  },
  [WIDGET_TYPE.LAST_ACTIVITY]: {
    label: 'Activité récente',
    description: 'Dernières modifications de traductions',
    icon: 'i-heroicons-clock',
    sizes: [WIDGET_SIZE.MD, WIDGET_SIZE.LG, WIDGET_SIZE.WIDE],
    defaultSize: WIDGET_SIZE.MD,
    hasDataSource: true,
  },
  [WIDGET_TYPE.REVIEW_QUEUE]: {
    label: 'File de révision',
    description: 'Traductions en attente de validation',
    icon: 'i-heroicons-clipboard-document-check',
    sizes: [WIDGET_SIZE.MD, WIDGET_SIZE.LG, WIDGET_SIZE.WIDE],
    defaultSize: WIDGET_SIZE.MD,
    hasDataSource: true,
  },
}

export function DEFAULT_PROJECT_LAYOUT(projectId: number): IWidgetConfig[] {
  const ds = { type: DATA_SOURCE_TYPE.PROJECT, projectId }
  return [
    { id: 'proj-default-1', type: WIDGET_TYPE.STAT_KEYS,           size: WIDGET_SIZE.SM,   dataSource: ds },
    { id: 'proj-default-2', type: WIDGET_TYPE.STAT_COVERAGE,       size: WIDGET_SIZE.SM,   dataSource: ds },
    { id: 'proj-default-3', type: WIDGET_TYPE.STAT_LANGUAGES,      size: WIDGET_SIZE.SM,   dataSource: ds },
    { id: 'proj-default-4', type: WIDGET_TYPE.STAT_UNUSED,         size: WIDGET_SIZE.SM,   dataSource: ds },
    { id: 'proj-default-5', type: WIDGET_TYPE.LANGUAGES_COVERAGE,  size: WIDGET_SIZE.WIDE, dataSource: ds },
    { id: 'proj-default-6', type: WIDGET_TYPE.LAST_ACTIVITY,       size: WIDGET_SIZE.MD,   dataSource: ds },
    { id: 'proj-default-7', type: WIDGET_TYPE.REVIEW_QUEUE,        size: WIDGET_SIZE.MD,   dataSource: ds },
  ]
}

export const DEFAULT_LAYOUT: IWidgetConfig[] = [
  { id: 'default-1', type: WIDGET_TYPE.STAT_KEYS,          size: WIDGET_SIZE.SM },
  { id: 'default-2', type: WIDGET_TYPE.STAT_COVERAGE,      size: WIDGET_SIZE.SM },
  { id: 'default-3', type: WIDGET_TYPE.STAT_LANGUAGES,     size: WIDGET_SIZE.SM },
  { id: 'default-4', type: WIDGET_TYPE.STAT_UNUSED,        size: WIDGET_SIZE.SM },
  { id: 'default-5', type: WIDGET_TYPE.PROJECTS,           size: WIDGET_SIZE.WIDE },
  { id: 'default-6', type: WIDGET_TYPE.LANGUAGES_COVERAGE, size: WIDGET_SIZE.MD },
  { id: 'default-7', type: WIDGET_TYPE.LAST_ACTIVITY,      size: WIDGET_SIZE.MD },
]

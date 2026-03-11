import type { WidgetSize, WidgetType, WidgetConfig } from '../types/dashboard.type'

export const WIDGET_SIZES: Record<WidgetSize, { cols: number; rows: number; label: string }> = {
  sm: { cols: 1, rows: 1, label: 'Petit' },
  md: { cols: 2, rows: 1, label: 'Moyen' },
  lg: { cols: 2, rows: 2, label: 'Grand' },
  wide: { cols: 4, rows: 1, label: 'Large' },
  xl: { cols: 4, rows: 2, label: 'Très grand' },
}

export const WIDGET_SIZE_CLASSES: Record<WidgetSize, string> = {
  sm: 'col-span-1 row-span-1',
  md: 'col-span-2 row-span-1',
  lg: 'col-span-2 row-span-2',
  wide: 'col-span-4 row-span-1',
  xl: 'col-span-4 row-span-2',
}

export const WIDGET_REGISTRY: Record<WidgetType, { label: string; description: string; icon: string; sizes: WidgetSize[]; defaultSize: WidgetSize; hasDataSource: boolean }> = {
  'stat-keys': {
    label: 'Clés totales',
    description: 'Nombre total de clés de traduction',
    icon: 'i-heroicons-key',
    sizes: ['sm', 'md'],
    defaultSize: 'sm',
    hasDataSource: true,
  },
  'stat-coverage': {
    label: 'Couverture',
    description: 'Taux de couverture global des traductions',
    icon: 'i-heroicons-chart-bar',
    sizes: ['sm', 'md'],
    defaultSize: 'sm',
    hasDataSource: true,
  },
  'stat-languages': {
    label: 'Langues',
    description: 'Nombre de langues configurées',
    icon: 'i-heroicons-language',
    sizes: ['sm', 'md'],
    defaultSize: 'sm',
    hasDataSource: true,
  },
  'stat-unused': {
    label: 'Clés inutilisées',
    description: 'Clés non trouvées dans le code source',
    icon: 'i-heroicons-exclamation-triangle',
    sizes: ['sm', 'md'],
    defaultSize: 'sm',
    hasDataSource: true,
  },
  'projects': {
    label: 'Projets',
    description: 'Liste de vos projets de traduction',
    icon: 'i-heroicons-rectangle-stack',
    sizes: ['md', 'lg', 'wide'],
    defaultSize: 'wide',
    hasDataSource: false,
  },
  'languages-coverage': {
    label: 'Couverture par langue',
    description: 'Progression de chaque langue',
    icon: 'i-heroicons-globe-alt',
    sizes: ['md', 'lg', 'wide'],
    defaultSize: 'md',
    hasDataSource: true,
  },
  'last-activity': {
    label: 'Activité récente',
    description: 'Dernières modifications de traductions',
    icon: 'i-heroicons-clock',
    sizes: ['md', 'lg', 'wide'],
    defaultSize: 'md',
    hasDataSource: true,
  },
  'review-queue': {
    label: 'File de révision',
    description: 'Traductions en attente de validation',
    icon: 'i-heroicons-clipboard-document-check',
    sizes: ['md', 'lg', 'wide'],
    defaultSize: 'md',
    hasDataSource: true,
  },
}

export const DEFAULT_LAYOUT: WidgetConfig[] = [
  { id: 'default-1', type: 'stat-keys', size: 'sm' },
  { id: 'default-2', type: 'stat-coverage', size: 'sm' },
  { id: 'default-3', type: 'stat-languages', size: 'sm' },
  { id: 'default-4', type: 'stat-unused', size: 'sm' },
  { id: 'default-5', type: 'projects', size: 'wide' },
  { id: 'default-6', type: 'languages-coverage', size: 'md' },
  { id: 'default-7', type: 'last-activity', size: 'md' },
]

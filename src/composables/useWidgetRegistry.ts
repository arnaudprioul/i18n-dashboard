import { WIDGET_REGISTRY } from '../consts/dashboard.const'
import type { TWidgetSize } from '../types/dashboard.type'

export interface IWidgetRegistryEntry {
  label: string
  description: string
  icon: string
  sizes: TWidgetSize[]
  defaultSize: TWidgetSize
  hasDataSource: boolean
  isCustom?: boolean
}

export function useWidgetRegistry() {
  const { customWidgets } = useModuleConfig()

  const registry = computed<Record<string, IWidgetRegistryEntry>>(() => {
    const base: Record<string, IWidgetRegistryEntry> = { ...WIDGET_REGISTRY }
    for (const w of customWidgets.value) {
      base[w.type] = {
        label: w.label,
        description: w.description ?? '',
        icon: w.icon ?? 'i-heroicons-puzzle-piece',
        sizes: (w.sizes as TWidgetSize[]) ?? ['md', 'lg'],
        defaultSize: (w.defaultSize as TWidgetSize) ?? 'md',
        hasDataSource: false,
        isCustom: true,
      }
    }
    return base
  })

  function getEntry(type: string): IWidgetRegistryEntry | undefined {
    return registry.value[type]
  }

  return { registry, getEntry }
}

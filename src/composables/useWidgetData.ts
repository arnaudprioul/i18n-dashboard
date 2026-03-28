import type { Ref } from 'vue'
import type { IWidgetDataSource } from '../interfaces/dashboard.interface'
import { statsService } from '../services/stats.service'
import { DATA_SOURCE_TYPE } from '../enums/dashboard.enum'

export function useWidgetData(widgetId: string, dataSource: Ref<IWidgetDataSource | undefined>) {
  const { currentProject, projects } = useProject()

  const effectiveSource = computed(() => dataSource.value ?? { type: DATA_SOURCE_TYPE.GLOBAL })

  const fetchKey = computed(() => {
    const src = effectiveSource.value
    if (src.type === DATA_SOURCE_TYPE.PROJECT) return `widget-stats-${widgetId}-project-${src.projectId}`
    return `widget-stats-${widgetId}-global`
  })

  const projectId = computed(() => {
    const src = effectiveSource.value
    if (src.type === DATA_SOURCE_TYPE.PROJECT) return src.projectId
    return undefined
  })

  const { data: stats, pending, refresh } = useAsyncData(
    () => fetchKey.value,
    async () => {
      const src = effectiveSource.value
      if (src.type === DATA_SOURCE_TYPE.PROJECT) {
        if (!src.projectId) return null
        return await statsService.getStats(src.projectId)
      }
      return await statsService.getGlobalStats()
    },
    { server: false, watch: [fetchKey] },
  )

  const sourceLabel = computed(() => {
    const src = effectiveSource.value
    if (src.type === DATA_SOURCE_TYPE.PROJECT) {
      const p = projects.value.find((p: any) => p.id === src.projectId)
      return p?.name ?? 'Projet'
    }
    return 'Global'
  })

  const hasProject = computed(() => {
    const src = effectiveSource.value
    if (src.type === DATA_SOURCE_TYPE.GLOBAL) return true
    return !!src.projectId
  })

  return { stats, pending, refresh, sourceLabel, hasProject, effectiveSource }
}

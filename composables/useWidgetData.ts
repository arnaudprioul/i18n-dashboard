import type { Ref } from 'vue'
import type { WidgetDataSource } from '~/types/dashboard.type'

export function useWidgetData(widgetId: string, dataSource: Ref<WidgetDataSource | undefined>) {
  const { currentProject, projects } = useProject()

  const effectiveSource = computed(() => dataSource.value ?? { type: 'global' as const })

  const fetchKey = computed(() => {
    const src = effectiveSource.value
    if (src.type === 'project') return `widget-stats-${widgetId}-project-${src.projectId}`
    return `widget-stats-${widgetId}-global`
  })

  const projectId = computed(() => {
    const src = effectiveSource.value
    if (src.type === 'project') return src.projectId
    return undefined
  })

  const { data: stats, pending, refresh } = useAsyncData(
    () => fetchKey.value,
    async () => {
      const src = effectiveSource.value
      if (src.type === 'project') {
        if (!src.projectId) return null
        return await $fetch<any>('/api/stats', { query: { project_id: src.projectId } })
      }
      return await $fetch<any>('/api/stats/global')
    },
    { server: false, watch: [fetchKey] },
  )

  const sourceLabel = computed(() => {
    const src = effectiveSource.value
    if (src.type === 'project') {
      const p = projects.value.find((p: any) => p.id === src.projectId)
      return p?.name ?? 'Projet'
    }
    return 'Global'
  })

  const hasProject = computed(() => {
    const src = effectiveSource.value
    if (src.type === 'global') return true
    return !!src.projectId
  })

  return { stats, pending, refresh, sourceLabel, hasProject, effectiveSource }
}

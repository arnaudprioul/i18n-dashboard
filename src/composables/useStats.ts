import { statsService } from '../services/stats.service'
import type { StatsResponse } from '../services/stats.service'

export function useStats() {
  const { currentProject } = useProject()

  const { data, pending, refresh } = useAsyncData<StatsResponse | null>(
    'project-stats',
    () => statsService.getStats(currentProject.value?.id),
    { watch: [() => currentProject.value?.id] },
  )

  const stats = computed(() => data.value ?? null)

  return { stats, pending, refresh }
}

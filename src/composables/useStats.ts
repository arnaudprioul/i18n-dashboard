import { statsService } from '../services/stats.service'
import type { IStatsResponse } from '../interfaces/stat.interface'

export function useStats() {
  const { currentProject } = useProject()

  const { data, pending, refresh } = useAsyncData<IStatsResponse | null>(
    'project-stats',
    () => statsService.getStats(currentProject.value?.id),
    { watch: [() => currentProject.value?.id] },
  )

  const stats = computed(() => data.value ?? null)

  return { stats, pending, refresh }
}

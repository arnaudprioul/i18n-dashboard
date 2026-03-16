import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

vi.mock('~/services/stats.service', () => ({
  statsService: {
    getStats: vi.fn().mockResolvedValue(null),
  },
}))

import { useStats } from '~/composables/useStats'
import { statsService } from '~/services/stats.service'

const mockStats = {
  total_keys: 100,
  translated: 80,
  untranslated: 20,
  coverage: 80,
  languages: 3,
  unused_keys: 5,
}

describe('useStats', () => {
  beforeEach(() => {
    vi.mocked(statsService.getStats).mockReset()

    vi.mocked(globalThis.useProject).mockReturnValue({
      currentProject: ref(null),
      projects: ref([]),
      visibleProjects: computed(() => []),
      fetchProjects: vi.fn(),
    } as any)

    // Reset useAsyncData mock to default behavior
    vi.mocked(globalThis.useAsyncData).mockReturnValue({
      data: ref(null),
      pending: ref(false),
      refresh: vi.fn(),
    } as any)
  })

  describe('stats computed', () => {
    it('stats is null when useAsyncData data is null', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(null),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { stats } = useStats()
      expect(stats.value).toBeNull()
    })

    it('stats reflects the data from useAsyncData', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(mockStats),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { stats } = useStats()
      expect(stats.value).toEqual(mockStats)
    })
  })

  describe('pending state', () => {
    it('exposes pending from useAsyncData', () => {
      const pendingRef = ref(true)
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(null),
        pending: pendingRef,
        refresh: vi.fn(),
      } as any)

      const { pending } = useStats()
      expect(pending.value).toBe(true)
    })
  })

  describe('refresh', () => {
    it('exposes refresh from useAsyncData', () => {
      const refreshFn = vi.fn()
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(null),
        pending: ref(false),
        refresh: refreshFn,
      } as any)

      const { refresh } = useStats()
      refresh()
      expect(refreshFn).toHaveBeenCalledOnce()
    })
  })

  describe('useAsyncData call', () => {
    it('calls useAsyncData with "project-stats" key', () => {
      useStats()

      expect(globalThis.useAsyncData).toHaveBeenCalledWith(
        'project-stats',
        expect.any(Function),
        expect.any(Object),
      )
    })

    it('fetcher calls statsService.getStats with currentProject.id', () => {
      const currentProject = ref({ id: 10, name: 'MyProject', root_path: '/p', locales_path: 'l', key_separator: '.', color: '#000' })
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject,
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)

      vi.mocked(globalThis.useAsyncData).mockImplementation((_key, fetcher) => {
        // Call the fetcher to verify it calls statsService correctly
        fetcher()
        return { data: ref(null), pending: ref(false), refresh: vi.fn() } as any
      })

      vi.mocked(statsService.getStats).mockResolvedValue(mockStats as any)

      useStats()

      expect(statsService.getStats).toHaveBeenCalledWith(10)
    })

    it('fetcher returns null when currentProject.id is undefined', () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(null),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)

      vi.mocked(globalThis.useAsyncData).mockImplementation((_key, fetcher) => {
        fetcher()
        return { data: ref(null), pending: ref(false), refresh: vi.fn() } as any
      })

      vi.mocked(statsService.getStats).mockResolvedValue(null)

      useStats()

      expect(statsService.getStats).toHaveBeenCalledWith(undefined)
    })
  })
})

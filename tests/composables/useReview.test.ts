import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref, computed } from 'vue'

vi.mock('~/services/key.service', () => ({
  keyService: {
    getKeys: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getKey: vi.fn(),
    createKey: vi.fn(),
    updateKey: vi.fn(),
    deleteKey: vi.fn(),
  },
}))

vi.mock('~/services/translation.service', () => ({
  translationService: {
    save: vi.fn().mockResolvedValue(undefined),
    setStatus: vi.fn().mockResolvedValue(undefined),
    bulkStatus: vi.fn().mockResolvedValue(undefined),
    batchTranslate: vi.fn(),
    translateAll: vi.fn(),
  },
}))

import { useReview } from '~/composables/useReview'
import { keyService } from '~/services/key.service'
import { translationService } from '~/services/translation.service'
import { TRANSLATION_STATUS } from '~/server/enums/translation.enum'

const mockProject = { id: 5, name: 'Test', root_path: '/test', locales_path: 'locales', key_separator: '.', color: '#000' }

// Helper to create a mock keys API response with draft items
function makeDraftResponse() {
  return {
    data: [
      {
        id: 1,
        key: 'greeting',
        description: 'A greeting',
        translations: {
          fr: { id: 101, value: 'Bonjour', status: TRANSLATION_STATUS.DRAFT },
          de: { id: 102, value: 'Hallo', status: TRANSLATION_STATUS.REVIEWED },
        },
      },
      {
        id: 2,
        key: 'farewell',
        description: null,
        translations: {
          fr: { id: 103, value: 'Au revoir', status: TRANSLATION_STATUS.DRAFT },
        },
      },
    ],
    total: 2,
  }
}

describe('useReview', () => {
  beforeEach(() => {
    vi.mocked(keyService.getKeys).mockReset()
    vi.mocked(translationService.bulkStatus).mockReset()
    vi.mocked(keyService.getKeys).mockResolvedValue({ data: [], total: 0 } as any)
    vi.mocked(translationService.bulkStatus).mockResolvedValue(undefined)

    vi.mocked(globalThis.useProject).mockReturnValue({
      currentProject: ref(null),
      projects: ref([]),
      visibleProjects: computed(() => []),
      fetchProjects: vi.fn(),
    } as any)
  })

  describe('initial state', () => {
    it('reviewItems starts empty', () => {
      const { reviewItems } = useReview()
      expect(reviewItems.value).toEqual([])
    })

    it('pending starts false', () => {
      const { pending } = useReview()
      expect(pending.value).toBe(false)
    })
  })

  describe('refresh', () => {
    it('does nothing when currentProject is null', async () => {
      const { refresh } = useReview()
      await refresh()

      expect(keyService.getKeys).not.toHaveBeenCalled()
    })

    it('calls keyService.getKeys with draft status when project exists', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(mockProject),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(keyService.getKeys).mockResolvedValue({ data: [], total: 0 } as any)

      const { refresh } = useReview()
      await refresh()

      expect(keyService.getKeys).toHaveBeenCalledWith({
        project_id: 5,
        status: TRANSLATION_STATUS.DRAFT,
        limit: 200,
      })
    })

    it('sets pending true during fetch and false after', async () => {
      // Start with null so the immediate watch does nothing (early return)
      const currentProject = ref<any>(null)
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject,
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)

      let resolveFetch!: (v: any) => void
      vi.mocked(keyService.getKeys).mockReturnValue(
        new Promise(resolve => { resolveFetch = resolve }),
      )

      const { refresh, pending } = useReview()
      expect(pending.value).toBe(false)

      // Now give a real project so refresh() proceeds
      currentProject.value = mockProject
      const refreshPromise = refresh()
      await nextTick()
      expect(pending.value).toBe(true)

      resolveFetch({ data: [], total: 0 })
      await refreshPromise
      expect(pending.value).toBe(false)
    })
  })

  describe('reviewItems computed', () => {
    it('filters only DRAFT translations with a value', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(mockProject),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(keyService.getKeys).mockResolvedValue(makeDraftResponse() as any)

      const { refresh, reviewItems } = useReview()
      await refresh()

      // Only fr translations have DRAFT status (de is REVIEWED)
      expect(reviewItems.value).toHaveLength(2)
      expect(reviewItems.value.every(i => i.language_code === 'fr')).toBe(true)
    })

    it('maps review items with correct shape', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(mockProject),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(keyService.getKeys).mockResolvedValue(makeDraftResponse() as any)

      const { refresh, reviewItems } = useReview()
      await refresh()

      const first = reviewItems.value[0]
      expect(first).toMatchObject({
        id: 101,
        key: 'greeting',
        key_description: 'A greeting',
        language_code: 'fr',
        value: 'Bonjour',
      })
    })

    it('excludes draft translations without a value', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(mockProject),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(keyService.getKeys).mockResolvedValue({
        data: [{
          id: 1,
          key: 'empty',
          description: null,
          translations: {
            fr: { id: 200, value: '', status: TRANSLATION_STATUS.DRAFT },
          },
        }],
        total: 1,
      } as any)

      const { refresh, reviewItems } = useReview()
      await refresh()

      expect(reviewItems.value).toHaveLength(0)
    })
  })

  describe('setStatus', () => {
    it('calls translationService.bulkStatus with item id and status', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(mockProject),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(keyService.getKeys).mockResolvedValue({ data: [], total: 0 } as any)

      const { setStatus } = useReview()
      const item = { id: 101, key: 'greeting', language_code: 'fr', value: 'Bonjour' }
      await setStatus(item, TRANSLATION_STATUS.REVIEWED)

      expect(translationService.bulkStatus).toHaveBeenCalledWith([101], TRANSLATION_STATUS.REVIEWED)
    })

    it('sets processingId and processingAction during operation', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(mockProject),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)

      let resolveBulk!: () => void
      vi.mocked(translationService.bulkStatus).mockReturnValue(
        new Promise<void>(resolve => { resolveBulk = resolve }),
      )
      vi.mocked(keyService.getKeys).mockResolvedValue({ data: [], total: 0 } as any)

      const { setStatus, processingId, processingAction } = useReview()
      const item = { id: 101, key: 'greeting', language_code: 'fr', value: 'Bonjour' }

      const setStatusPromise = setStatus(item, TRANSLATION_STATUS.REVIEWED)
      await nextTick()

      expect(processingId.value).toBe(101)
      expect(processingAction.value).toBe(TRANSLATION_STATUS.REVIEWED)

      resolveBulk()
      await setStatusPromise

      expect(processingId.value).toBeNull()
      expect(processingAction.value).toBe('')
    })

    it('calls refreshNuxtData after status update', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(mockProject),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(keyService.getKeys).mockResolvedValue({ data: [], total: 0 } as any)

      const { setStatus } = useReview()
      const item = { id: 101, key: 'greeting', language_code: 'fr', value: 'Bonjour' }
      await setStatus(item, TRANSLATION_STATUS.APPROVED)

      expect(globalThis.refreshNuxtData).toHaveBeenCalledWith('project-stats')
    })
  })

  describe('markAllReviewed', () => {
    it('calls translationService.bulkStatus with all review item ids', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(mockProject),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(keyService.getKeys).mockResolvedValue(makeDraftResponse() as any)

      const { refresh, markAllReviewed } = useReview()
      await refresh()
      await markAllReviewed()

      expect(translationService.bulkStatus).toHaveBeenCalledWith(
        [101, 103],
        TRANSLATION_STATUS.REVIEWED,
      )
    })

    it('shows success toast with count', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(mockProject),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(keyService.getKeys).mockResolvedValue(makeDraftResponse() as any)
      const mockToast = vi.mocked(globalThis.useToast)()

      const { refresh, markAllReviewed } = useReview()
      await refresh()
      await markAllReviewed()

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'success' }),
      )
    })

    it('sets approvingAll true during operation and false after', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(mockProject),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(keyService.getKeys).mockResolvedValue({ data: [], total: 0 } as any)

      let resolveBulk!: () => void
      vi.mocked(translationService.bulkStatus).mockReturnValue(
        new Promise<void>(resolve => { resolveBulk = resolve }),
      )

      const { markAllReviewed, approvingAll } = useReview()
      expect(approvingAll.value).toBe(false)

      const markPromise = markAllReviewed()
      await nextTick()
      expect(approvingAll.value).toBe(true)

      resolveBulk()
      // markAllReviewed calls refresh after bulkStatus
      vi.mocked(keyService.getKeys).mockResolvedValue({ data: [], total: 0 } as any)
      await markPromise
      expect(approvingAll.value).toBe(false)
    })

    it('calls refreshNuxtData after marking all reviewed', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(mockProject),
        projects: ref([]),
        visibleProjects: computed(() => []),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(keyService.getKeys).mockResolvedValue({ data: [], total: 0 } as any)

      const { markAllReviewed } = useReview()
      await markAllReviewed()

      expect(globalThis.refreshNuxtData).toHaveBeenCalledWith('project-stats')
    })
  })
})

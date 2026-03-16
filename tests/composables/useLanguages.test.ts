import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'

vi.mock('~/services/language.service', () => ({
  languageService: {
    getLanguages: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    setDefault: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('~/services/translation.service', () => ({
  translationService: {
    translateAll: vi.fn().mockResolvedValue({ jobId: 'job-123' }),
    batchTranslate: vi.fn().mockResolvedValue({ translated: 0, skipped: 0, errors: 0 }),
  },
}))

vi.mock('~/services/job.service', () => ({
  jobService: {
    getJob: vi.fn().mockResolvedValue({ total: 10, done: 5, percent: 50, status: 'running', errors: 0 }),
  },
}))

import { useLanguages } from '~/composables/useLanguages'
import { languageService } from '~/services/language.service'
import { LANGUAGES } from '~/consts/languages.const'

const mockProject = { id: 42, name: 'Test Project', root_path: '/test', locales_path: 'locales', key_separator: '.', color: '#000' }

const mockLangItems = [
  { id: 1, code: 'en', name: 'English', is_default: true, project_id: 42 },
  { id: 2, code: 'fr', name: 'French', is_default: false, project_id: 42 },
]

describe('useLanguages', () => {
  beforeEach(() => {
    vi.mocked(languageService.getLanguages).mockReset()
    vi.mocked(languageService.create).mockReset()
    vi.mocked(languageService.remove).mockReset()
    vi.mocked(languageService.setDefault).mockReset()

    // Default useProject stub provides null currentProject — override per test as needed
    vi.mocked(globalThis.useProject).mockReturnValue({
      currentProject: ref(null),
      projects: ref([]),
      visibleProjects: ref([]),
      fetchProjects: vi.fn(),
    } as any)
  })

  describe('initial state', () => {
    it('projectLanguages starts empty', () => {
      vi.mocked(languageService.getLanguages).mockResolvedValue([])
      const { projectLanguages } = useLanguages()
      expect(projectLanguages.value).toEqual([])
    })

    it('pending starts false', () => {
      const { pending } = useLanguages()
      expect(pending.value).toBe(false)
    })
  })

  describe('refresh', () => {
    it('calls languageService.getLanguages with currentProject.id', async () => {
      const currentProject = ref(mockProject)
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject,
        projects: ref([]),
        visibleProjects: ref([]),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(languageService.getLanguages).mockResolvedValue(mockLangItems)

      const { refresh, projectLanguages } = useLanguages()
      await refresh()

      expect(languageService.getLanguages).toHaveBeenCalledWith(42)
      expect(projectLanguages.value).toEqual(mockLangItems)
    })

    it('sets pending to true during fetch and false after', async () => {
      const currentProject = ref(mockProject)
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject,
        projects: ref([]),
        visibleProjects: ref([]),
        fetchProjects: vi.fn(),
      } as any)

      let resolveFetch!: (v: any) => void
      vi.mocked(languageService.getLanguages).mockReturnValue(
        new Promise(resolve => { resolveFetch = resolve }),
      )

      const { refresh, pending } = useLanguages()
      expect(pending.value).toBe(false)

      const refreshPromise = refresh()
      await nextTick()
      expect(pending.value).toBe(true)

      resolveFetch(mockLangItems)
      await refreshPromise
      expect(pending.value).toBe(false)
    })

    it('resets projectLanguages to [] on error', async () => {
      const currentProject = ref(mockProject)
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject,
        projects: ref([]),
        visibleProjects: ref([]),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(languageService.getLanguages).mockRejectedValue(new Error('Network error'))

      const { refresh, projectLanguages } = useLanguages()
      await refresh()

      expect(projectLanguages.value).toEqual([])
    })
  })

  describe('findLanguage', () => {
    it('returns correct language by exact code', () => {
      const { findLanguage } = useLanguages()
      const lang = findLanguage('fr')
      expect(lang).toBeDefined()
      expect(lang!.code).toBe('fr')
      expect(lang!.name).toBe('French')
    })

    it('falls back to base language code for regional variant (fr-ZZ → fr)', () => {
      const { findLanguage } = useLanguages()
      // fr-ZZ does not exist in LANGUAGES, should fall back to fr
      const lang = findLanguage('fr-ZZ')
      expect(lang).toBeDefined()
      expect(lang!.code).toBe('fr')
    })

    it('returns exact match before falling back when exact code exists', () => {
      const { findLanguage } = useLanguages()
      // ar-SA should return ar-SA, not ar
      const lang = findLanguage('ar-SA')
      expect(lang).toBeDefined()
      expect(lang!.code).toBe('ar-SA')
    })

    it('returns undefined for unknown code with no base match', () => {
      const { findLanguage } = useLanguages()
      const lang = findLanguage('xyz-UNKNOWN')
      expect(lang).toBeUndefined()
    })
  })

  describe('getLanguageName', () => {
    it('returns formatted name for known code', () => {
      const { getLanguageName } = useLanguages()
      const name = getLanguageName('en')
      expect(name).toContain('English')
      // Format is "nativeName (name)"
      expect(name).toMatch(/\(.+\)/)
    })

    it('returns the code itself for unknown code', () => {
      const { getLanguageName } = useLanguages()
      const name = getLanguageName('xyz-UNKNOWN')
      expect(name).toBe('xyz-UNKNOWN')
    })
  })

  describe('filteredLanguages', () => {
    it('returns all LANGUAGES when searchQuery is empty', () => {
      const { filteredLanguages, searchQuery } = useLanguages()
      searchQuery.value = ''
      expect(filteredLanguages.value).toEqual(LANGUAGES)
    })

    it('filters by code', () => {
      const { filteredLanguages, searchQuery } = useLanguages()
      searchQuery.value = 'fr'
      const codes = filteredLanguages.value.map(l => l.code)
      expect(codes.some(c => c.startsWith('fr'))).toBe(true)
    })

    it('filters by name (case-insensitive)', () => {
      const { filteredLanguages, searchQuery } = useLanguages()
      searchQuery.value = 'french'
      const names = filteredLanguages.value.map(l => l.name.toLowerCase())
      expect(names.some(n => n.includes('french'))).toBe(true)
    })

    it('returns empty array when no match', () => {
      const { filteredLanguages, searchQuery } = useLanguages()
      searchQuery.value = 'ZZZNOMATCH999'
      expect(filteredLanguages.value).toEqual([])
    })
  })

  describe('addLanguage', () => {
    it('calls languageService.create with project_id merged in', async () => {
      const currentProject = ref(mockProject)
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject,
        projects: ref([]),
        visibleProjects: ref([]),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(languageService.create).mockResolvedValue(undefined)
      vi.mocked(languageService.getLanguages).mockResolvedValue(mockLangItems)

      const { addLanguage } = useLanguages()
      await addLanguage({ code: 'de', name: 'German', is_default: false })

      expect(languageService.create).toHaveBeenCalledWith({
        code: 'de',
        name: 'German',
        is_default: false,
        project_id: 42,
      })
    })

    it('does nothing when currentProject is null', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(null),
        projects: ref([]),
        visibleProjects: ref([]),
        fetchProjects: vi.fn(),
      } as any)

      const { addLanguage } = useLanguages()
      await addLanguage({ code: 'de', name: 'German', is_default: false })

      expect(languageService.create).not.toHaveBeenCalled()
    })

    it('calls refresh after creating language', async () => {
      const currentProject = ref(mockProject)
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject,
        projects: ref([]),
        visibleProjects: ref([]),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(languageService.create).mockResolvedValue(undefined)
      vi.mocked(languageService.getLanguages).mockResolvedValue(mockLangItems)

      const { addLanguage } = useLanguages()
      await addLanguage({ code: 'de', name: 'German', is_default: false })

      // refresh calls getLanguages
      expect(languageService.getLanguages).toHaveBeenCalled()
    })
  })

  describe('deleteLanguage', () => {
    it('calls languageService.remove with code and project_id', async () => {
      const currentProject = ref(mockProject)
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject,
        projects: ref([]),
        visibleProjects: ref([]),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(languageService.remove).mockResolvedValue(undefined)
      vi.mocked(languageService.getLanguages).mockResolvedValue([])

      const { deleteLanguage } = useLanguages()
      await deleteLanguage('fr')

      expect(languageService.remove).toHaveBeenCalledWith('fr', 42)
    })

    it('shows success toast after deletion', async () => {
      const currentProject = ref(mockProject)
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject,
        projects: ref([]),
        visibleProjects: ref([]),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(languageService.remove).mockResolvedValue(undefined)
      vi.mocked(languageService.getLanguages).mockResolvedValue([])
      const mockToast = vi.mocked(globalThis.useToast)()

      const { deleteLanguage } = useLanguages()
      await deleteLanguage('fr')

      expect(mockToast.add).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'success' }),
      )
    })

    it('does nothing when currentProject is null', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(null),
        projects: ref([]),
        visibleProjects: ref([]),
        fetchProjects: vi.fn(),
      } as any)

      const { deleteLanguage } = useLanguages()
      await deleteLanguage('fr')

      expect(languageService.remove).not.toHaveBeenCalled()
    })
  })

  describe('setDefault', () => {
    it('calls languageService.setDefault with lang and project_id', async () => {
      const currentProject = ref(mockProject)
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject,
        projects: ref([]),
        visibleProjects: ref([]),
        fetchProjects: vi.fn(),
      } as any)
      vi.mocked(languageService.setDefault).mockResolvedValue(undefined)
      vi.mocked(languageService.getLanguages).mockResolvedValue(mockLangItems)

      const { setDefault } = useLanguages()
      await setDefault(mockLangItems[1])

      expect(languageService.setDefault).toHaveBeenCalledWith(mockLangItems[1], 42)
    })

    it('does nothing when currentProject is null', async () => {
      vi.mocked(globalThis.useProject).mockReturnValue({
        currentProject: ref(null),
        projects: ref([]),
        visibleProjects: ref([]),
        fetchProjects: vi.fn(),
      } as any)

      const { setDefault } = useLanguages()
      await setDefault(mockLangItems[0])

      expect(languageService.setDefault).not.toHaveBeenCalled()
    })
  })

  describe('startPolling and closeProgress', () => {
    it('startPolling sets showProgress, progressLangName and running status', () => {
      const { startPolling, showProgress, progressLangName, progressStatus } = useLanguages()

      startPolling('job-abc', 'French')

      expect(showProgress.value).toBe(true)
      expect(progressLangName.value).toBe('French')
      expect(progressStatus.value).toBe('running')
    })

    it('closeProgress clears showProgress', () => {
      const { startPolling, closeProgress, showProgress } = useLanguages()

      startPolling('job-abc', 'French')
      closeProgress()

      expect(showProgress.value).toBe(false)
    })
  })
})

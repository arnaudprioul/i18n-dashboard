import { LANGUAGES } from '../consts/languages.const'
import { languageService } from '../services/language.service'
import { translationService } from '../services/translation.service'
import { jobService } from '../services/job.service'
import type { ILanguage, ILanguageItem, ICreateLanguagePayload } from '../interfaces/languages.interface'

// ── Static language lookup ───────────────────────────────────────────────────

export function useLanguages() {
  const toast = useToast()
  const { t } = useT()
  const { currentProject } = useProject()

  // ── Static lookup ────────────────────────────────────────────────────────

  const searchQuery = ref('')

  const filteredLanguages = computed(() => {
    const q = searchQuery.value.toLowerCase()
    if (!q) return LANGUAGES
    return LANGUAGES.filter(
      l => l.code.toLowerCase().includes(q)
        || l.name.toLowerCase().includes(q)
        || l.nativeName.toLowerCase().includes(q),
    )
  })

  const findLanguage = (code: string): ILanguage | undefined => {
    // Exact match first, then fall back to base language (fr-CA → fr)
    return LANGUAGES.find(l => l.code === code)
      ?? LANGUAGES.find(l => l.code === code.split('-')[0])
  }

  const getLanguageName = (code: string): string => {
    const lang = findLanguage(code)
    return lang ? `${lang.nativeName} (${lang.name})` : code
  }

  // ── Project languages (API) ──────────────────────────────────────────────

  const data = ref<ILanguageItem[]>([])
  const pending = ref(false)

  const refresh = async () => {
    pending.value = true
    try {
      data.value = await languageService.getLanguages(currentProject.value?.id)
    }
    catch {
      data.value = []
    }
    finally {
      pending.value = false
    }
  }

  onMounted(refresh)
  watch(() => currentProject.value?.id, (id) => { if (id) refresh() })

  const projectLanguages = computed(() => data.value ?? [])

  const adding = ref(false)
  const addLanguage = async (payload: Omit<ICreateLanguagePayload, 'project_id'>): Promise<void> => {
    if (!currentProject.value) return
    adding.value = true
    try {
      await languageService.create({ ...payload, project_id: currentProject.value.id })
      await refresh()
      refreshNuxtData('project-stats')
    }
    finally {
      adding.value = false
    }
  }

  const deleting = ref(false)
  const deleteLanguage = async (code: string): Promise<void> => {
    if (!currentProject.value) return
    deleting.value = true
    try {
      await languageService.remove(code, currentProject.value.id)
      await refresh()
      refreshNuxtData('project-stats')
      toast.add({ title: t('languages.deleted', 'Language deleted'), color: 'success' })
    }
    finally {
      deleting.value = false
    }
  }

  const setDefault = async (lang: ILanguageItem): Promise<void> => {
    if (!currentProject.value) return
    try {
      await languageService.setDefault(lang, currentProject.value.id)
      await refresh()
    }
    catch {}
  }

  const setFallback = async (lang: ILanguageItem, fallbackCode: string | null): Promise<void> => {
    await languageService.update(lang.code, lang.project_id, { fallback_code: fallbackCode })
    await refresh()
  }

  const createLanguageForProject = async (projectId: number, payload: Omit<ICreateLanguagePayload, 'project_id'>): Promise<void> => {
    await languageService.create({ ...payload, project_id: projectId })
  }

  const startTranslateAll = async (languageCode: string, languageName: string): Promise<string | null> => {
    if (!currentProject.value) return null
    try {
      const job = await translationService.translateAll(currentProject.value.id, languageCode, languageName)
      return job.jobId
    }
    catch {
      return null
    }
  }

  // ── Translation job polling ──────────────────────────────────────────────

  const showProgress = ref(false)
  const progressJobId = ref<string | null>(null)
  const progressLangName = ref('')
  const progressTotal = ref(0)
  const progressDone = ref(0)
  const progressPercent = ref(0)
  const progressStatus = ref<'running' | 'done' | 'error'>('running')

  let _pollInterval: ReturnType<typeof setInterval> | null = null

  const _pollJob = async () => {
    if (!progressJobId.value) return
    try {
      const job = await jobService.getJob(progressJobId.value)
      progressTotal.value = job.total
      progressDone.value = job.done
      progressPercent.value = job.percent
      progressStatus.value = job.status
      if (job.status !== 'running') _stopPolling()
    }
    catch {
      _stopPolling()
    }
  }

  const _stopPolling = () => {
    if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null }
  }

  const startPolling = (jobId: string, langName: string) => {
    progressJobId.value = jobId
    progressLangName.value = langName
    progressTotal.value = 0
    progressDone.value = 0
    progressPercent.value = 0
    progressStatus.value = 'running'
    showProgress.value = true
    _stopPolling()
    _pollInterval = setInterval(_pollJob, 800)
  }

  const closeProgress = () => {
    showProgress.value = false
    _stopPolling()
    progressJobId.value = null
  }

  const sendToBackground = (onDone?: () => void) => {
    showProgress.value = false
    const langName = progressLangName.value

    const toastRef = toast.add({
      title: `${t('languages.translating', 'Translating')} ${langName}…`,
      description: `${progressPercent.value}% — ${progressDone.value} / ${progressTotal.value} ${t('scan.keys_found', 'keys')}`,
      duration: 0,
      color: 'info',
    })

    const bgInterval = setInterval(async () => {
      if (!progressJobId.value) { clearInterval(bgInterval); return }
      try {
        const job = await jobService.getJob(progressJobId.value)
        progressTotal.value = job.total
        progressDone.value = job.done
        progressPercent.value = job.percent
        progressStatus.value = job.status

        if (job.status !== 'running') {
          clearInterval(bgInterval)
          _stopPolling()
          toast.remove(toastRef?.id ?? '')
          toast.add({
            title: job.errors
              ? `${t('languages.translate_done', 'Translation complete')} ${langName} ${t('languages.with_errors', 'with errors')}`
              : `${t('languages.translate_done', 'Translation complete')} ${langName}`,
            description: `${job.done} ${t('keys.translated', 'translated')}${job.errors ? ` · ${job.errors} ${t('common.errors', 'errors')}` : ''}`,
            color: job.errors ? 'warning' : 'success',
          })
          onDone?.()
        }
      }
      catch { clearInterval(bgInterval) }
    }, 800)
  }

  onUnmounted(_stopPolling)

  return {
    // Static lookup
    languages: LANGUAGES,
    filteredLanguages,
    searchQuery,
    findLanguage,
    getLanguageName,
    // Project languages
    projectLanguages,
    pending,
    refresh,
    adding,
    addLanguage,
    deleting,
    deleteLanguage,
    setDefault,
    setFallback,
    createLanguageForProject,
    startTranslateAll,
    // Translation job
    showProgress,
    progressLangName,
    progressTotal,
    progressDone,
    progressPercent,
    progressStatus,
    startPolling,
    closeProgress,
    sendToBackground,
  }
}

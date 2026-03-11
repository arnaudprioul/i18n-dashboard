import { LANGUAGES } from '../consts/languages.const'
import { languageService } from '../services/language.service'
import { translationService } from '../services/translation.service'
import { jobService } from '../services/job.service'
import type { Language, LanguageItem, CreateLanguagePayload } from '../interfaces/languages.interface'

// ── Static language lookup ───────────────────────────────────────────────────

export function useLanguages() {
  const toast = useToast()
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

  function findLanguage(code: string): Language | undefined {
    // Exact match first, then fall back to base language (fr-CA → fr)
    return LANGUAGES.find(l => l.code === code)
      ?? LANGUAGES.find(l => l.code === code.split('-')[0])
  }

  function getLanguageName(code: string): string {
    const lang = findLanguage(code)
    return lang ? `${lang.nativeName} (${lang.name})` : code
  }

  // ── Project languages (API) ──────────────────────────────────────────────

  const { data, pending, refresh } = useAsyncData<LanguageItem[]>(
    'project-languages',
    () => languageService.getLanguages(currentProject.value?.id),
    { watch: [() => currentProject.value?.id], default: () => [] },
  )

  const projectLanguages = computed(() => data.value ?? [])

  const adding = ref(false)
  async function addLanguage(payload: Omit<CreateLanguagePayload, 'project_id'>): Promise<void> {
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
  async function deleteLanguage(code: string): Promise<void> {
    if (!currentProject.value) return
    deleting.value = true
    try {
      await languageService.remove(code, currentProject.value.id)
      await refresh()
      refreshNuxtData('project-stats')
      toast.add({ title: 'Langue supprimée', color: 'success' })
    }
    finally {
      deleting.value = false
    }
  }

  async function setDefault(lang: LanguageItem): Promise<void> {
    if (!currentProject.value) return
    try {
      await languageService.setDefault(lang, currentProject.value.id)
      await refresh()
    }
    catch {}
  }

  async function setFallback(lang: LanguageItem, fallbackCode: string | null): Promise<void> {
    await $fetch(`/api/languages/${lang.id}`, {
      method: 'PUT',
      body: { fallback_code: fallbackCode },
    })
    await refresh()
  }

  async function startTranslateAll(languageCode: string, languageName: string): Promise<string | null> {
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

  async function _pollJob() {
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

  function _stopPolling() {
    if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null }
  }

  function startPolling(jobId: string, langName: string) {
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

  function closeProgress() {
    showProgress.value = false
    _stopPolling()
    progressJobId.value = null
  }

  function sendToBackground(onDone?: () => void) {
    showProgress.value = false
    const langName = progressLangName.value

    const toastRef = toast.add({
      title: `Traduction ${langName} en cours…`,
      description: `${progressPercent.value}% — ${progressDone.value} / ${progressTotal.value} clés`,
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
            title: job.errors ? `Traduction ${langName} terminée avec erreurs` : `Traduction ${langName} terminée`,
            description: `${job.done} clés traduites${job.errors ? ` · ${job.errors} erreurs` : ''}`,
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

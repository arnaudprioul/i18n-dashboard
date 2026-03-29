import { formatsService } from '../services/formats.service'

export function useFormats() {
  const { currentProject } = useProject()
  const projectId = computed(() => currentProject.value?.id)

  // Number formats
  const { data: numberFormats, refresh: refreshNumber } = useAsyncData(
    () => `formats-number-${projectId.value}`,
    () => formatsService.getNumberFormats(projectId.value),
    { default: () => [], watch: [projectId] },
  )

  // Datetime formats
  const { data: datetimeFormats, refresh: refreshDatetime } = useAsyncData(
    () => `formats-datetime-${projectId.value}`,
    () => formatsService.getDatetimeFormats(projectId.value),
    { default: () => [], watch: [projectId] },
  )

  // Snippet — fetched client-side only, directly watches projectId
  const snippet = ref('')
  const refreshSnippet = async () => {
    if (!projectId.value) return
    const data = await formatsService.getSnippet(projectId.value)
    snippet.value = data.snippet ?? ''
  }
  watch(projectId, (id) => { if (id) refreshSnippet() }, { immediate: true })

  // Modifiers
  const { data: modifiers, refresh: refreshModifiers } = useAsyncData(
    () => `formats-modifiers-${projectId.value}`,
    () => formatsService.getModifiers(projectId.value),
    { default: () => [], watch: [projectId] },
  )

  const createNumberFormat = async (locale: string, name: string, options: Record<string, any>) => {
    await formatsService.createNumberFormat(projectId.value, locale, name, options)
    await Promise.all([refreshNumber(), refreshSnippet()])
  }

  const updateNumberFormat = async (id: number, locale: string, name: string, options: Record<string, any>) => {
    await formatsService.updateNumberFormat(id, locale, name, options)
    await Promise.all([refreshNumber(), refreshSnippet()])
  }

  const deleteNumberFormat = async (id: number) => {
    await formatsService.deleteNumberFormat(id)
    await Promise.all([refreshNumber(), refreshSnippet()])
  }

  const createDatetimeFormat = async (locale: string, name: string, options: Record<string, any>) => {
    await formatsService.createDatetimeFormat(projectId.value, locale, name, options)
    await Promise.all([refreshDatetime(), refreshSnippet()])
  }

  const updateDatetimeFormat = async (id: number, locale: string, name: string, options: Record<string, any>) => {
    await formatsService.updateDatetimeFormat(id, locale, name, options)
    await Promise.all([refreshDatetime(), refreshSnippet()])
  }

  const deleteDatetimeFormat = async (id: number) => {
    await formatsService.deleteDatetimeFormat(id)
    await Promise.all([refreshDatetime(), refreshSnippet()])
  }

  const createModifier = async (name: string, body: string) => {
    await formatsService.createModifier(projectId.value, name, body)
    await Promise.all([refreshModifiers(), refreshSnippet()])
  }

  const updateModifier = async (id: number, name: string, body: string) => {
    await formatsService.updateModifier(id, name, body)
    await Promise.all([refreshModifiers(), refreshSnippet()])
  }

  const deleteModifier = async (id: number) => {
    await formatsService.deleteModifier(id)
    await Promise.all([refreshModifiers(), refreshSnippet()])
  }

  const detectFromConfig = async (rootPath?: string) => {
    if (!projectId.value) return null
    return formatsService.detectFromConfig(projectId.value, rootPath)
  }

  const importFromConfig = async (
    numberFormatsToImport: Array<{ locale: string; name: string; options: Record<string, any> }>,
    datetimeFormatsToImport: Array<{ locale: string; name: string; options: Record<string, any> }>,
    modifiersToImport: Array<{ name: string; body: string }>,
  ) => {
    if (!projectId.value) return null
    const result = await formatsService.importFromConfig(
      projectId.value,
      numberFormatsToImport,
      datetimeFormatsToImport,
      modifiersToImport,
    )
    await Promise.all([refreshNumber(), refreshDatetime(), refreshModifiers(), refreshSnippet()])
    return result
  }

  return {
    numberFormats,
    datetimeFormats,
    modifiers,
    snippet,
    refreshSnippet,
    createNumberFormat,
    updateNumberFormat,
    deleteNumberFormat,
    createDatetimeFormat,
    updateDatetimeFormat,
    deleteDatetimeFormat,
    createModifier,
    updateModifier,
    deleteModifier,
    detectFromConfig,
    importFromConfig,
  }
}

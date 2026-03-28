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

  // Modifiers
  const { data: modifiers, refresh: refreshModifiers } = useAsyncData(
    () => `formats-modifiers-${projectId.value}`,
    () => formatsService.getModifiers(projectId.value),
    { default: () => [], watch: [projectId] },
  )

  const createNumberFormat = async (locale: string, name: string, options: Record<string, any>) => {
    await formatsService.createNumberFormat(projectId.value, locale, name, options)
    await refreshNumber()
  }

  const updateNumberFormat = async (id: number, locale: string, name: string, options: Record<string, any>) => {
    await formatsService.updateNumberFormat(id, locale, name, options)
    await refreshNumber()
  }

  const deleteNumberFormat = async (id: number) => {
    await formatsService.deleteNumberFormat(id)
    await refreshNumber()
  }

  const createDatetimeFormat = async (locale: string, name: string, options: Record<string, any>) => {
    await formatsService.createDatetimeFormat(projectId.value, locale, name, options)
    await refreshDatetime()
  }

  const updateDatetimeFormat = async (id: number, locale: string, name: string, options: Record<string, any>) => {
    await formatsService.updateDatetimeFormat(id, locale, name, options)
    await refreshDatetime()
  }

  const deleteDatetimeFormat = async (id: number) => {
    await formatsService.deleteDatetimeFormat(id)
    await refreshDatetime()
  }

  const createModifier = async (name: string, body: string) => {
    await formatsService.createModifier(projectId.value, name, body)
    await refreshModifiers()
  }

  const updateModifier = async (id: number, name: string, body: string) => {
    await formatsService.updateModifier(id, name, body)
    await refreshModifiers()
  }

  const deleteModifier = async (id: number) => {
    await formatsService.deleteModifier(id)
    await refreshModifiers()
  }

  return {
    numberFormats,
    datetimeFormats,
    modifiers,
    createNumberFormat,
    updateNumberFormat,
    deleteNumberFormat,
    createDatetimeFormat,
    updateDatetimeFormat,
    deleteDatetimeFormat,
    createModifier,
    updateModifier,
    deleteModifier,
  }
}

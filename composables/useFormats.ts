export function useFormats() {
  const { currentProject } = useProject()
  const projectId = computed(() => currentProject.value?.id)

  // Number formats
  const { data: numberFormats, refresh: refreshNumber } = useFetch<any[]>('/api/formats/number', {
    query: computed(() => ({ project_id: projectId.value })),
    default: () => [],
  })

  // Datetime formats
  const { data: datetimeFormats, refresh: refreshDatetime } = useFetch<any[]>('/api/formats/datetime', {
    query: computed(() => ({ project_id: projectId.value })),
    default: () => [],
  })

  // Modifiers
  const { data: modifiers, refresh: refreshModifiers } = useFetch<any[]>('/api/formats/modifiers', {
    query: computed(() => ({ project_id: projectId.value })),
    default: () => [],
  })

  async function createNumberFormat(locale: string, name: string, options: Record<string, any>) {
    await $fetch('/api/formats/number', {
      method: 'POST',
      body: { project_id: projectId.value, locale, name, options },
    })
    await refreshNumber()
  }

  async function updateNumberFormat(id: number, locale: string, name: string, options: Record<string, any>) {
    await $fetch(`/api/formats/number/${id}`, {
      method: 'PUT',
      body: { locale, name, options },
    })
    await refreshNumber()
  }

  async function deleteNumberFormat(id: number) {
    await $fetch(`/api/formats/number/${id}`, { method: 'DELETE' })
    await refreshNumber()
  }

  async function createDatetimeFormat(locale: string, name: string, options: Record<string, any>) {
    await $fetch('/api/formats/datetime', {
      method: 'POST',
      body: { project_id: projectId.value, locale, name, options },
    })
    await refreshDatetime()
  }

  async function updateDatetimeFormat(id: number, locale: string, name: string, options: Record<string, any>) {
    await $fetch(`/api/formats/datetime/${id}`, {
      method: 'PUT',
      body: { locale, name, options },
    })
    await refreshDatetime()
  }

  async function deleteDatetimeFormat(id: number) {
    await $fetch(`/api/formats/datetime/${id}`, { method: 'DELETE' })
    await refreshDatetime()
  }

  async function createModifier(name: string, body: string) {
    await $fetch('/api/formats/modifiers', {
      method: 'POST',
      body: { project_id: projectId.value, name, body },
    })
    await refreshModifiers()
  }

  async function updateModifier(id: number, name: string, body: string) {
    await $fetch(`/api/formats/modifiers/${id}`, {
      method: 'PUT',
      body: { name, body },
    })
    await refreshModifiers()
  }

  async function deleteModifier(id: number) {
    await $fetch(`/api/formats/modifiers/${id}`, { method: 'DELETE' })
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

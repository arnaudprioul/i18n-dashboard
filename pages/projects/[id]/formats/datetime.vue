<template>
  <div class="p-6 max-w-5xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('formats.datetime_title', 'Date formats') }}</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('formats.datetime_subtitle', 'Configure') }} <code class="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">$d(date, 'short')</code> {{ t('formats.per_locale', 'by locale.') }}
        </p>
      </div>
      <UButton icon="i-heroicons-plus" @click="openCreate">{{ t('formats.add_datetime_format', 'Add a format') }}</UButton>
    </div>

    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-300 flex gap-2">
      <UIcon name="i-heroicons-information-circle" class="shrink-0 mt-0.5" />
      <div>
        {{ t('formats.datetime_info', 'Use') }} <code class="font-mono text-xs bg-blue-100 dark:bg-blue-900/40 px-1 rounded">$d(new Date(), 'short')</code> {{ t('formats.datetime_info2', 'in your templates. Options correspond to') }} <strong>Intl.DateTimeFormat</strong> {{ t('formats.parameters', 'parameters.') }}
        <NuxtLink to="https://vue-i18n.intlify.dev/guide/essentials/datetime.html" target="_blank" class="underline ml-1">{{ t('formats.documentation', 'Documentation vue-i18n') }} ↗</NuxtLink>
      </div>
    </div>

    <div v-if="!datetimeFormats?.length" class="text-center py-16 text-gray-400">
      <UIcon name="i-heroicons-calendar" class="text-4xl mb-3" />
      <p class="font-medium">{{ t('formats.no_format', 'No format configured') }}</p>
      <p class="text-sm mt-1">{{ t('formats.add_to_use', 'Add formats to use') }} <code class="font-mono text-xs">$d()</code> {{ t('formats.in_templates', 'in your templates.') }}</p>
      <UButton class="mt-4" icon="i-heroicons-plus" @click="openCreate">{{ t('formats.add_datetime_format', 'Add a format') }}</UButton>
    </div>

    <div v-else class="space-y-6">
      <div v-for="(formats, locale) in groupedByLocale" :key="locale">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500 dark:text-gray-400 uppercase">{{ locale }}</span>
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ findLanguage(locale)?.nativeName || locale }}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <UCard v-for="fmt in formats" :key="fmt.id">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <code class="text-sm font-mono font-semibold text-primary-600 dark:text-primary-400">'{{ fmt.name }}'</code>
                </div>
                <p class="text-xs text-gray-400 font-mono">{{ previewDate(fmt.options, fmt.locale) }}</p>
                <div class="mt-2 flex flex-wrap gap-1">
                  <span v-for="(v, k) in fmt.options" :key="k" class="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 font-mono text-gray-500 dark:text-gray-400">
                    {{ k }}: {{ v }}
                  </span>
                </div>
              </div>
              <div class="flex gap-1 shrink-0">
                <UButton icon="i-heroicons-pencil" size="xs" color="neutral" variant="ghost" @click="openEdit(fmt)" />
                <UButton icon="i-heroicons-trash" size="xs" color="error" variant="ghost" @click="remove(fmt.id)" />
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <UModal v-model:open="showModal" :title="editing ? t('formats.edit_format', 'Edit format') : t('formats.new_datetime_format', 'New date format')">
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <UFormField :label="t('formats.locale', 'Locale')" required>
              <USelect v-model="form.locale" :items="localeOptions" class="w-full" />
            </UFormField>
            <UFormField :label="t('formats.format_name', 'Format name')" :hint="t('formats.datetime_format_name_hint', 'E.g.: short, long, medium')" required>
              <UInput v-model="form.name" placeholder="short" class="w-full" />
            </UFormField>
          </div>

          <!-- Shortcut preset styles -->
          <div class="grid grid-cols-2 gap-3">
            <UFormField :label="t('formats.date_style', 'Date style (shortcut)')">
              <USelect v-model="form.options.dateStyle" :items="[{label: t('formats.none_default', 'None (default)'), value: ''}, 'full', 'long', 'medium', 'short']" class="w-full" />
            </UFormField>
            <UFormField :label="t('formats.time_style', 'Time style (shortcut)')">
              <USelect v-model="form.options.timeStyle" :items="[{label: t('formats.none_default', 'None (default)'), value: ''}, 'full', 'long', 'medium', 'short']" class="w-full" />
            </UFormField>
          </div>

          <!-- When no shortcut, show individual options -->
          <template v-if="!form.options.dateStyle && !form.options.timeStyle">
            <div class="grid grid-cols-3 gap-3">
              <UFormField :label="t('formats.year', 'Year')">
                <USelect v-model="form.options.year" :items="[{label: '—', value: ''}, 'numeric', '2-digit']" class="w-full" />
              </UFormField>
              <UFormField :label="t('formats.month', 'Month')">
                <USelect v-model="form.options.month" :items="[{label: '—', value: ''}, 'numeric', '2-digit', 'long', 'short', 'narrow']" class="w-full" />
              </UFormField>
              <UFormField :label="t('formats.day', 'Day')">
                <USelect v-model="form.options.day" :items="[{label: '—', value: ''}, 'numeric', '2-digit']" class="w-full" />
              </UFormField>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <UFormField :label="t('formats.weekday', 'Weekday')">
                <USelect v-model="form.options.weekday" :items="[{label: '—', value: ''}, 'long', 'short', 'narrow']" class="w-full" />
              </UFormField>
              <UFormField :label="t('formats.hour', 'Hour')">
                <USelect v-model="form.options.hour" :items="[{label: '—', value: ''}, 'numeric', '2-digit']" class="w-full" />
              </UFormField>
              <UFormField :label="t('formats.minute', 'Minute')">
                <USelect v-model="form.options.minute" :items="[{label: '—', value: ''}, 'numeric', '2-digit']" class="w-full" />
              </UFormField>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <UFormField :label="t('formats.second', 'Second')">
                <USelect v-model="form.options.second" :items="[{label: '—', value: ''}, 'numeric', '2-digit']" class="w-full" />
              </UFormField>
              <UFormField :label="t('formats.hour12', '12h format')">
                <USelect v-model="form.options.hour12" :items="[{label: t('formats.auto_default', 'Auto (default)'), value: ''}, {label: t('formats.yes', 'Yes'), value: true}, {label: t('formats.no', 'No'), value: false}]" class="w-full" />
              </UFormField>
              <UFormField :label="t('formats.timezone', 'Timezone')">
                <UInput v-model="form.options.timeZone" placeholder="Europe/Paris" class="w-full" />
              </UFormField>
            </div>
          </template>

          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p class="text-xs text-gray-400 mb-1">{{ t('formats.preview', 'Preview') }}:</p>
            <p class="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300">{{ previewDate(cleanOptions, form.locale) }}</p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="showModal = false">{{ t('common.cancel', 'Cancel') }}</UButton>
          <UButton :loading="saving" @click="save">{{ editing ? t('formats.update', 'Update') : t('common.create', 'Create') }}</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const { currentProject } = useProject()
const { datetimeFormats, createDatetimeFormat, updateDatetimeFormat, deleteDatetimeFormat } = useFormats()
const { findLanguage, projectLanguages } = useLanguages()
const toast = useToast()
const { t } = useT()

const localeOptions = computed(() =>
  (projectLanguages.value || []).map((l: any) => ({ label: `${l.code} — ${l.name}`, value: l.code }))
)

const groupedByLocale = computed(() => {
  const groups: Record<string, any[]> = {}
  for (const fmt of (datetimeFormats.value || [])) {
    if (!groups[fmt.locale]) groups[fmt.locale] = []
    groups[fmt.locale].push(fmt)
  }
  return groups
})

const PREVIEW_DATE = new Date(2024, 0, 15, 14, 30, 0)

function previewDate(opts: Record<string, any>, locale: string) {
  try {
    const clean: any = {}
    for (const [k, v] of Object.entries(opts)) {
      if (v !== '' && v !== null && v !== undefined) clean[k] = v
    }
    return new Intl.DateTimeFormat(locale || 'fr-FR', clean).format(PREVIEW_DATE)
  } catch {
    return '—'
  }
}

const showModal = ref(false)
const saving = ref(false)
const editing = ref<any>(null)

const defaultOptions = () => ({
  dateStyle: '',
  timeStyle: '',
  year: '',
  month: '',
  day: '',
  weekday: '',
  hour: '',
  minute: '',
  second: '',
  hour12: '',
  timeZone: '',
} as Record<string, any>)

const defaultForm = () => ({
  locale: (projectLanguages.value as any[])?.[0]?.code || 'fr',
  name: '',
  options: defaultOptions(),
})

const form = ref(defaultForm())

const cleanOptions = computed(() => {
  const o: Record<string, any> = {}
  for (const [k, v] of Object.entries(form.value.options)) {
    if (v !== '' && v !== null && v !== undefined) o[k] = v
  }
  return o
})

function openCreate() {
  editing.value = null
  form.value = defaultForm()
  showModal.value = true
}

function openEdit(fmt: any) {
  editing.value = fmt
  form.value = {
    locale: fmt.locale,
    name: fmt.name,
    options: { ...defaultOptions(), ...fmt.options },
  }
  showModal.value = true
}

async function save() {
  if (!form.value.locale || !form.value.name) return
  saving.value = true
  try {
    if (editing.value) {
      await updateDatetimeFormat(editing.value.id, form.value.locale, form.value.name, cleanOptions.value)
      toast.add({ title: t('formats.format_updated', 'Format updated'), color: 'success' })
    } else {
      await createDatetimeFormat(form.value.locale, form.value.name, cleanOptions.value)
      toast.add({ title: t('formats.format_created', 'Format created'), color: 'success' })
    }
    showModal.value = false
  } catch (e: any) {
    toast.add({ title: t('common.error', 'Error'), description: e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

async function remove(id: number) {
  await deleteDatetimeFormat(id)
  toast.add({ title: t('formats.format_deleted', 'Format deleted'), color: 'success' })
}
</script>

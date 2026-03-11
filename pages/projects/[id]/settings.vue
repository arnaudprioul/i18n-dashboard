<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('settings.title', 'Settings') }}</h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">{{ t('settings.subtitle', 'Global dashboard configuration') }}</p>
    </div>

    <!-- Skeleton -->
    <div v-if="pending" class="max-w-2xl space-y-6">
      <UCard v-for="i in 3" :key="i">
        <template #header>
          <USkeleton class="h-5 w-1/3"/>
        </template>
        <div class="space-y-3">
          <USkeleton class="h-4 w-full"/>
          <USkeleton class="h-9 w-full rounded-lg"/>
          <USkeleton class="h-4 w-2/3"/>
        </div>
      </UCard>
    </div>

    <div v-else class="max-w-2xl space-y-6">
      <!-- Current project settings (editable) -->
      <UCard v-if="currentProject">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon class="text-primary-500" name="i-heroicons-folder"/>
            <h2 class="font-semibold text-gray-900 dark:text-white">{{ t('settings.current_project', 'Current project') }}</h2>
          </div>
        </template>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormField class="col-span-2" :label="t('settings.project_name', 'Project name')">
              <UInput v-model="form.name" class="w-full" :placeholder="t('settings.project_name_placeholder', 'My project')"/>
            </UFormField>
            <UFormField :label="t('settings.root_path', 'Root path')" :hint="t('settings.root_path_hint', 'Absolute path to the project root')">
              <PathPicker v-model="form.root_path" class="w-full" />
            </UFormField>
            <UFormField :label="t('settings.source_url', 'Source URL')" :hint="t('settings.source_url_hint', 'App URL (for CORS auto-detection)')">
              <UInput v-model="form.source_url" class="w-full" placeholder="https://my-app.com"/>
            </UFormField>
            <UFormField :label="t('settings.locales_folder', 'Locales folder')" :hint="t('settings.locales_folder_hint', 'Relative to root')">
              <UInput v-model="form.locales_path" class="w-full" placeholder="src/locales"/>
            </UFormField>
            <UFormField :label="t('settings.key_separator', 'Key separator')">
              <UInput v-model="form.key_separator" class="w-full" placeholder="." style="font-family: monospace"/>
            </UFormField>
            <UFormField class="col-span-2" :label="t('settings.description', 'Description')">
              <UTextarea v-model="form.description" class="w-full" :rows="2" :placeholder="t('settings.description_placeholder', 'Project description…')"/>
            </UFormField>
            <UFormField :label="t('settings.color', 'Color')">
              <div class="flex items-center gap-2">
                <input v-model="form.color" type="color" class="h-9 w-12 rounded border border-gray-200 dark:border-gray-700 cursor-pointer p-0.5"/>
                <code class="text-xs font-mono text-gray-500">{{ form.color }}</code>
              </div>
            </UFormField>
          </div>
        </div>
      </UCard>

      <!-- Scanner settings -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon class="text-blue-500" name="i-heroicons-magnifying-glass"/>
            <h2 class="font-semibold text-gray-900 dark:text-white">{{ t('settings.scanner_title', 'vue-i18n Scanner') }}</h2>
          </div>
        </template>

        <div class="space-y-4">
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p class="text-sm text-blue-700 dark:text-blue-300">
              <UIcon class="inline mr-1" name="i-heroicons-information-circle"/>
              {{ t('settings.scanner_info', 'The scanner automatically detects all keys used in your code via') }}
              <code class="font-mono text-xs">$t()</code>, <code class="font-mono text-xs">t()</code>,
              <code class="font-mono text-xs">&lt;i18n-t&gt;</code>, <code class="font-mono text-xs">v-t</code>
              {{ t('settings.scanner_info_and', 'and') }} <code class="font-mono text-xs">&lt;i18n&gt;</code> {{ t('settings.scanner_info_blocks', 'blocks in your SFCs.') }}
            </p>
          </div>

          <UFormField
              :hint="t('settings.scan_exclude_hint', 'Comma-separated')"
              :label="t('settings.scan_exclude', 'Folders excluded from scan')"
          >
            <UInput
                v-model="form.scan_exclude"
                class="w-full"
                placeholder="node_modules,dist,.nuxt,.output"
            />
          </UFormField>

          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">{{ t('settings.detected_functions', 'Auto-detected functions') }} :</p>
            <div class="flex flex-wrap gap-1.5">
              <code
                  v-for="fn in detectedFunctions"
                  :key="fn"
                  class="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5 text-gray-700 dark:text-gray-300"
              >{{ fn }}</code>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Format pages -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon class="text-purple-500" name="i-heroicons-adjustments-horizontal"/>
            <h2 class="font-semibold text-gray-900 dark:text-white">{{ t('settings.advanced_title', 'Advanced features') }}</h2>
          </div>
        </template>
        <div class="space-y-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('settings.advanced_hint', 'Enable advanced configuration pages for this project. They will appear in the sidebar navigation.') }}
          </p>
          <div class="space-y-3">
            <div class="flex items-center justify-between py-1">
              <div>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ t('settings.number_formats', 'Number formats') }}</p>
                <p class="text-xs text-gray-400">{{ t('settings.number_formats_hint', 'Configure') }} <code class="font-mono">$n(value, 'currency')</code> — Intl.NumberFormat</p>
              </div>
              <UToggle v-model="form.enable_number_formats" />
            </div>
            <div class="flex items-center justify-between py-1 border-t border-gray-100 dark:border-gray-800">
              <div>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ t('settings.datetime_formats', 'Date formats') }}</p>
                <p class="text-xs text-gray-400">{{ t('settings.datetime_formats_hint', 'Configure') }} <code class="font-mono">$d(date, 'short')</code> — Intl.DateTimeFormat</p>
              </div>
              <UToggle v-model="form.enable_datetime_formats" />
            </div>
            <div class="flex items-center justify-between py-1 border-t border-gray-100 dark:border-gray-800">
              <div>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ t('settings.custom_modifiers', 'Custom modifiers') }}</p>
                <p class="text-xs text-gray-400">{{ t('settings.custom_modifiers_hint', 'Add custom') }} <code class="font-mono">@.modifier:key</code> {{ t('settings.custom_modifiers_hint2', 'modifiers') }}</p>
              </div>
              <UToggle v-model="form.enable_modifiers" />
            </div>
          </div>
        </div>
      </UCard>

      <!-- Google Translate settings -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon class="text-yellow-500" name="i-heroicons-sparkles"/>
            <h2 class="font-semibold text-gray-900 dark:text-white">Google Translate</h2>
          </div>
        </template>

        <div class="space-y-4">
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p class="text-sm text-blue-700 dark:text-blue-300">
              <UIcon class="inline mr-1" name="i-heroicons-information-circle"/>
              {{ t('settings.google_translate_info', 'By default, the free Google Translate API is used (no key required). For production use, add an official key for better rate limits.') }}
            </p>
          </div>

          <UFormField
              :hint="t('settings.google_api_key_hint', 'Optional. Leave blank to use the free tier.')"
              :label="t('settings.google_api_key', 'Google Translate API Key')"
          >
            <UInput
                v-model="form.google_translate_api_key"
                class="w-full"
                placeholder="AIza..."
                type="password"
            />
          </UFormField>
        </div>
      </UCard>

      <!-- API Info -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon class="text-green-500" name="i-heroicons-code-bracket"/>
            <h2 class="font-semibold text-gray-900 dark:text-white">{{ t('settings.api_endpoints', 'API Endpoints') }}</h2>
          </div>
        </template>

        <div class="space-y-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('settings.api_endpoints_hint', 'Use these endpoints in your vue-i18n configuration:') }}
          </p>

          <div v-for="example in apiExamples" :key="example.label" class="group">
            <p class="text-xs text-gray-400 mb-1">{{ example.label }}</p>
            <div class="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
              <code class="text-sm font-mono text-gray-700 dark:text-gray-300 flex-1">{{ example.url }}</code>
              <UButton
                  color="neutral"
                  icon="i-heroicons-clipboard"
                  size="xs"
                  variant="ghost"
                  @click="copyToClipboard(example.url)"
              />
            </div>
          </div>

          <div class="mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p class="text-xs text-gray-400 mb-2 font-mono font-semibold">{{ t('settings.vue_i18n_example', 'vue-i18n configuration example:') }}</p>
            <pre class="text-xs font-mono text-gray-700 dark:text-gray-300 overflow-auto">{{ vueI18nExample }}</pre>
          </div>
        </div>
      </UCard>

      <!-- Export -->
      <UCard v-if="currentProject">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon class="text-purple-500" name="i-heroicons-arrow-down-tray"/>
            <h2 class="font-semibold text-gray-900 dark:text-white">{{ t('settings.export_title', 'Export translations') }}</h2>
          </div>
        </template>

        <div class="space-y-4">
          <!-- All languages -->
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ t('settings.export_all_languages', 'All languages') }}</p>
              <p class="text-xs text-gray-400">{{ t('settings.export_all_languages_hint', 'A single JSON file with all languages') }}</p>
            </div>
            <UButton
                color="neutral"
                icon="i-heroicons-arrow-down-tray"
                size="sm"
                variant="outline"
                @click="downloadAll"
            >
              {{ t('settings.export_all', 'Export all') }}
            </UButton>
          </div>

          <!-- Per language -->
          <div v-if="projectLanguages.length" class="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2">
            <p class="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">{{ t('settings.export_per_language', 'Per language') }}</p>
            <div
                v-for="lang in projectLanguages"
                :key="lang.code"
                class="flex items-center justify-between py-1.5"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ lang.name }}</span>
                <code class="text-xs text-gray-400 font-mono">{{ lang.code }}</code>
                <UBadge v-if="lang.is_default" color="primary" size="xs" variant="soft">{{ t('languages.default_badge', 'Default') }}</UBadge>
              </div>
              <UButton
                  color="neutral"
                  icon="i-heroicons-arrow-down-tray"
                  size="xs"
                  variant="ghost"
                  @click="downloadLang(lang.code)"
              >
                {{ lang.code }}.json
              </UButton>
            </div>
          </div>

          <p v-else class="text-xs text-gray-400 italic">{{ t('settings.no_languages', 'No language configured for this project.') }}</p>
        </div>
      </UCard>

      <!-- Snapshot export / import -->
      <UCard v-if="currentProject">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon class="text-indigo-500" name="i-heroicons-archive-box"/>
            <h2 class="font-semibold text-gray-900 dark:text-white">{{ t('settings.snapshot_title', 'Project snapshot') }}</h2>
          </div>
        </template>
        <div class="space-y-5">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('settings.snapshot_hint', 'Export a complete snapshot of this project (config, languages, all translation keys and values) as a single JSON file. Import it on any other instance to restore.') }}
          </p>

          <!-- Export -->
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ t('settings.snapshot_export', 'Export snapshot') }}</p>
              <p class="text-xs text-gray-400">{{ t('settings.snapshot_export_hint', 'Full backup: config + languages + all keys') }}</p>
            </div>
            <UButton
              color="indigo"
              icon="i-heroicons-arrow-down-tray"
              size="sm"
              variant="outline"
              @click="downloadSnapshot"
            >
              {{ t('settings.snapshot_export_btn', 'Export') }}
            </UButton>
          </div>

          <!-- Import -->
          <div class="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ t('settings.snapshot_import', 'Import snapshot') }}</p>
                <p class="text-xs text-gray-400">{{ t('settings.snapshot_import_hint', 'Merge or replace the current project with an exported snapshot') }}</p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <USelect
                  v-model="importMode"
                  :items="importModes"
                  size="xs"
                  class="w-28"
                />
                <UButton
                  color="indigo"
                  icon="i-heroicons-arrow-up-tray"
                  size="sm"
                  variant="outline"
                  :loading="importing"
                  @click="triggerImport"
                >
                  {{ t('settings.snapshot_import_btn', 'Import') }}
                </UButton>
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              class="hidden"
              @change="onFileSelected"
            />
            <div v-if="importMode === 'replace'" class="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <UIcon name="i-heroicons-exclamation-triangle" class="shrink-0 mt-0.5"/>
              {{ t('settings.snapshot_replace_warning', 'Replace mode: all existing keys and translations will be deleted before import.') }}
            </div>
          </div>
        </div>
      </UCard>

      <!-- Save button -->
      <div class="flex justify-end">
        <UButton :loading="saving" icon="i-heroicons-check" @click="onSave">
          {{ t('settings.save', 'Save') }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  const toast = useToast()
  const { t } = useT()
  const { currentProject, fetchProjects } = useProject()
  const { settings, pending, saving, saveSettings } = useSettings()
  const { projectLanguages } = useLanguages()

  const detectedFunctions = [
    '$t()', '$tc()', '$te()', '$tm()',
    't() via useI18n', 'tc()', 'te()', 'tm()',
    'i18n.t()', 'i18n.global.t()',
    '<i18n-t keypath="...">',
    'v-t="\'key\'"',
    'Bloc <i18n> SFC',
  ]

  const form = ref({
    scan_exclude: 'node_modules,dist,.nuxt,.output',
    google_translate_api_key: '',
    enable_number_formats: false,
    enable_datetime_formats: false,
    enable_modifiers: false,
    // Project fields
    name: '',
    root_path: '',
    source_url: '',
    locales_path: 'src/locales',
    key_separator: '.',
    color: '#6366f1',
    description: '',
  })

  watch(settings, (val) => {
    if (val) {
      form.value.scan_exclude = val.scan_exclude || 'node_modules,dist,.nuxt,.output'
      form.value.google_translate_api_key = val.google_translate_api_key || ''
    }
  }, { immediate: true })

  watch(currentProject, (val) => {
    if (val) {
      form.value.enable_number_formats = val.enable_number_formats || false
      form.value.enable_datetime_formats = val.enable_datetime_formats || false
      form.value.enable_modifiers = val.enable_modifiers || false
      form.value.name = val.name || ''
      form.value.root_path = val.root_path || ''
      form.value.source_url = val.source_url || ''
      form.value.locales_path = val.locales_path || 'src/locales'
      form.value.key_separator = val.key_separator || '.'
      form.value.color = val.color || '#6366f1'
      form.value.description = val.description || ''
    }
  }, { immediate: true })

  const apiAddress = document.location.origin

  const apiExamples = computed(() => [
    { label: t('settings.api_example_english', 'English translations'), url: `${apiAddress}/locale/en.json` },
    { label: t('settings.api_example_generic', 'Generic pattern'), url: `[i18n_dahsboard_address]/locale/[lang].json` },
  ])

  const vueI18nExample = computed(() => `import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  locale: 'en',
  messages: {
    en: await fetch('${apiAddress}/locale/en.json').then(r => r.json()),
    [lang]: await fetch('[i18n_dahsboard_address]/locale/[lang].json').then(r => r.json()),
  }
})`)

  async function copyToClipboard (text: string) {
    await navigator.clipboard.writeText(text)
    toast.add({ title: t('common.copied', 'Copied!'), color: 'success' })
  }

  async function onSave () {
    await saveSettings({ scan_exclude: form.value.scan_exclude, google_translate_api_key: form.value.google_translate_api_key })
    if (currentProject.value) {
      await $fetch(`/api/projects/${currentProject.value.id}`, {
        method: 'PUT',
        body: {
          name: form.value.name,
          root_path: form.value.root_path,
          source_url: form.value.source_url,
          locales_path: form.value.locales_path,
          key_separator: form.value.key_separator,
          color: form.value.color,
          description: form.value.description,
          enable_number_formats: form.value.enable_number_formats,
          enable_datetime_formats: form.value.enable_datetime_formats,
          enable_modifiers: form.value.enable_modifiers,
        },
      })
      await fetchProjects()
    }
  }

  function triggerDownload(url: string, filename: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  function downloadAll() {
    if (!currentProject.value) return
    const projectName = currentProject.value.name.replace(/[^a-z0-9]/gi, '_')
    triggerDownload(`/api/export?project_id=${currentProject.value.id}`, `${projectName}_all.json`)
  }

  function downloadLang(code: string) {
    if (!currentProject.value) return
    const projectName = currentProject.value.name.replace(/[^a-z0-9]/gi, '_')
    triggerDownload(`/api/export?project_id=${currentProject.value.id}&lang=${code}`, `${projectName}_${code}.json`)
  }

  // ── Snapshot ───────────────────────────────────────────────────────────────

  function downloadSnapshot() {
    if (!currentProject.value) return
    const projectName = currentProject.value.name.replace(/[^a-z0-9]/gi, '_')
    triggerDownload(`/api/project-snapshot?project_id=${currentProject.value.id}`, `${projectName}_snapshot.json`)
  }

  const importMode = ref<'merge' | 'replace'>('merge')
  const importModes = computed(() => [
    { label: t('settings.snapshot_mode_merge', 'Merge'), value: 'merge' },
    { label: t('settings.snapshot_mode_replace', 'Replace'), value: 'replace' },
  ])
  const importing = ref(false)
  const fileInput = ref<HTMLInputElement>()

  function triggerImport() {
    fileInput.value?.click()
  }

  async function onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file || !currentProject.value) return
    ;(event.target as HTMLInputElement).value = ''

    let snapshot: any
    try {
      snapshot = JSON.parse(await file.text())
    } catch {
      toast.add({ title: t('settings.snapshot_parse_error', 'Invalid JSON file'), color: 'error' })
      return
    }

    importing.value = true
    try {
      const result = await $fetch('/api/project-snapshot', {
        method: 'POST',
        body: { snapshot, project_id: currentProject.value.id, mode: importMode.value },
      }) as any

      await fetchProjects()
      toast.add({
        title: t('settings.snapshot_import_success', 'Snapshot imported'),
        description: `+${result.stats.keys_added} keys · ${result.stats.translations_added} translations added`,
        color: 'success',
      })
    } catch (e: any) {
      toast.add({ title: t('settings.snapshot_import_error', 'Import failed'), description: e?.data?.message, color: 'error' })
    } finally {
      importing.value = false
    }
  }
</script>

<template>
  <UModal v-model:open="open" :title="t('scan.modal_title', 'Scan project')" :ui="{ width: 'sm:max-w-lg' }">
    <template #body>
      <div class="space-y-5">

        <!-- Mode tabs -->
        <div class="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            v-for="m in modes"
            :key="m.value"
            class="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            :class="mode === m.value
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
            @click="mode = m.value"
          >
            <UIcon :name="m.icon" class="text-sm" />
            {{ m.label }}
          </button>
        </div>

        <!-- Local mode -->
        <div v-if="mode === 'local'" class="space-y-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('scan.local_hint', 'Select the root folder of your Vue.js project. The scanner will detect all $t(), t(), <i18n-t> and v-t usages.') }}
          </p>
          <UFormField :label="t('scan.local_path_label', 'Project root folder')">
            <PathPicker v-model="localPath" class="w-full" />
          </UFormField>
        </div>

        <!-- URL mode -->
        <div v-if="mode === 'url'" class="space-y-3">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('scan.url_hint', 'Enter the base URL of your app. The scanner will fetch each configured locale file (en.json, fr.json…) and import all keys it finds.') }}
          </p>
          <UFormField :label="t('scan.url_label', 'Base URL')" :hint="t('scan.url_hint2', 'Example: https://my-app.com')">
            <UInput v-model="remoteUrl" class="w-full" placeholder="https://my-app.com" />
          </UFormField>
          <div v-if="!project?.languages?.length" class="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            <UIcon name="i-heroicons-exclamation-triangle" class="shrink-0 mt-0.5" />
            {{ t('scan.url_no_langs', 'No languages configured on this project yet. Add languages first so the scanner knows which locale files to fetch.') }}
          </div>
          <div v-else class="flex flex-wrap gap-1.5">
            <UBadge v-for="lang in project.languages" :key="lang.code" color="neutral" variant="soft" size="xs">
              <UIcon name="i-heroicons-document-text" class="mr-1 opacity-60" />
              {{ lang.code }}.json
            </UBadge>
          </div>
        </div>

        <!-- Results -->
        <div v-if="result" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ t('scan.results', 'Results') }}</p>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-white dark:bg-gray-900 rounded-lg p-2.5 text-center">
              <p class="text-xl font-bold text-gray-900 dark:text-white">{{ result.keysFound ?? result.keysImported }}</p>
              <p class="text-xs text-gray-400">{{ t('scan.keys_found', 'keys found') }}</p>
            </div>
            <div class="bg-white dark:bg-gray-900 rounded-lg p-2.5 text-center">
              <p class="text-xl font-bold text-green-600 dark:text-green-400">{{ result.keysAdded }}</p>
              <p class="text-xs text-gray-400">{{ t('scan.keys_added', 'new keys') }}</p>
            </div>
            <div v-if="result.unusedKeys !== undefined" class="bg-white dark:bg-gray-900 rounded-lg p-2.5 text-center">
              <p class="text-xl font-bold text-amber-500">{{ result.unusedKeys }}</p>
              <p class="text-xs text-gray-400">{{ t('scan.unused', 'unused') }}</p>
            </div>
            <div v-if="result.scannedFiles !== undefined" class="bg-white dark:bg-gray-900 rounded-lg p-2.5 text-center">
              <p class="text-xl font-bold text-gray-900 dark:text-white">{{ result.scannedFiles }}</p>
              <p class="text-xs text-gray-400">{{ t('scan.files_scanned', 'files scanned') }}</p>
            </div>
          </div>
          <p v-if="result.errors?.length" class="text-xs text-red-500">
            {{ result.errors.length }} {{ t('scan.errors', 'errors') }}
          </p>
        </div>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="open = false">{{ t('common.cancel', 'Cancel') }}</UButton>
        <UButton
          :loading="loading"
          :disabled="mode === 'local' ? !localPath : !remoteUrl"
          icon="i-heroicons-magnifying-glass"
          @click="runScan"
        >
          {{ t('scan.run', 'Scan') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { t } = useT()

const props = defineProps<{
  projectId: number
  project?: { languages?: { code: string; name: string }[]; root_path?: string; source_url?: string }
}>()

const emit = defineEmits<{ done: [] }>()

const open = defineModel<boolean>('open', { default: false })

const mode = ref<'local' | 'url'>('local')
const localPath = ref(props.project?.root_path ?? '')
const remoteUrl = ref(props.project?.source_url ?? '')
const loading = ref(false)
const result = ref<any>(null)
const error = ref('')

const modes = computed(() => [
  { value: 'local', label: t('scan.mode_local', 'Local'), icon: 'i-heroicons-computer-desktop' },
  { value: 'url', label: t('scan.mode_url', 'Via URL'), icon: 'i-heroicons-globe-alt' },
])

watch(open, (val) => {
  if (val) {
    result.value = null
    error.value = ''
    localPath.value = props.project?.root_path ?? ''
    remoteUrl.value = props.project?.source_url ?? ''
    mode.value = props.project?.root_path ? 'local' : props.project?.source_url ? 'url' : 'local'
  }
})

async function runScan() {
  loading.value = true
  error.value = ''
  result.value = null
  try {
    result.value = await $fetch('/api/scan', {
      method: 'POST',
      body: {
        project_id: props.projectId,
        mode: mode.value,
        root_path: mode.value === 'local' ? localPath.value : undefined,
        url: mode.value === 'url' ? remoteUrl.value : undefined,
      },
    })
    emit('done')
  } catch (e: any) {
    error.value = e?.data?.message ?? t('common.error', 'Error')
  } finally {
    loading.value = false
  }
}
</script>

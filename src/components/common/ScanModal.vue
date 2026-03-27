<template>
  <u-modal
    v-model:open="open"
    :title="t('scan.modal_title', 'Scan project')"
    :ui="{ width: '48rem' }"
  >
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
            <u-icon
              :name="m.icon"
              class="text-sm"
            />
            {{ m.label }}
          </button>
        </div>

        <!-- Local mode -->
        <div
          v-if="mode === 'local'"
          class="space-y-3"
        >
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('scan.local_hint', 'Select the root folder of your Vue.js project. The scanner will detect all $t(), t(), <i18n-t> and v-t usages.') }}
          </p>
          <u-form-field :label="t('scan.local_path_label', 'Project root folder')">
            <project-path-picker
              v-model="localPath"
              class="w-full"
            />
          </u-form-field>
        </div>

        <!-- Git mode -->
        <div
          v-if="mode === 'git'"
          class="space-y-4"
        >
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('scan.git_hint', 'Clone a Git repository and scan source files for translation keys.') }}
          </p>
          <project-git-repo-manager v-model="gitRepo" />
          <label class="flex items-center gap-2 cursor-pointer">
            <u-toggle
              v-model="saveRepo"
              size="sm"
            />
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ t('scan.git_save', 'Save this repository to the project') }}</span>
          </label>
        </div>

        <!-- Results -->
        <div
          v-if="result"
          class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2"
        >
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {{ t('scan.results', 'Results') }}
          </p>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-white dark:bg-gray-900 rounded-lg p-2.5 text-center">
              <p class="text-xl font-bold text-gray-900 dark:text-white">
                {{ result.keysFound ?? result.keysImported }}
              </p>
              <p class="text-xs text-gray-400">
                {{ t('scan.keys_found', 'keys found') }}
              </p>
            </div>
            <div class="bg-white dark:bg-gray-900 rounded-lg p-2.5 text-center">
              <p class="text-xl font-bold text-green-600 dark:text-green-400">
                {{ result.keysAdded }}
              </p>
              <p class="text-xs text-gray-400">
                {{ t('scan.keys_added', 'new keys') }}
              </p>
            </div>
            <div
              v-if="result.unusedKeys !== undefined"
              class="bg-white dark:bg-gray-900 rounded-lg p-2.5 text-center"
            >
              <p class="text-xl font-bold text-amber-500">
                {{ result.unusedKeys }}
              </p>
              <p class="text-xs text-gray-400">
                {{ t('scan.unused', 'unused') }}
              </p>
            </div>
            <div
              v-if="result.scannedFiles !== undefined"
              class="bg-white dark:bg-gray-900 rounded-lg p-2.5 text-center"
            >
              <p class="text-xl font-bold text-gray-900 dark:text-white">
                {{ result.scannedFiles }}
              </p>
              <p class="text-xs text-gray-400">
                {{ t('scan.files_scanned', 'files scanned') }}
              </p>
            </div>
            <div
              v-if="result.langsAdded"
              class="bg-white dark:bg-gray-900 rounded-lg p-2.5 text-center"
            >
              <p class="text-xl font-bold text-primary-600 dark:text-primary-400">
                {{ result.langsAdded }}
              </p>
              <p class="text-xs text-gray-400">
                {{ t('scan.langs_added', 'language(s) added') }}
              </p>
            </div>
            <div
              v-if="result.translationsAdded !== undefined"
              class="bg-white dark:bg-gray-900 rounded-lg p-2.5 text-center col-span-2"
            >
              <p class="text-xl font-bold text-green-600 dark:text-green-400">
                {{ result.translationsAdded }}
              </p>
              <p class="text-xs text-gray-400">
                {{ t('scan.translations_synced', 'translations imported') }}
              </p>
            </div>
          </div>
          <p
            v-if="result.errors?.length"
            class="text-xs text-red-500"
          >
            {{ result.errors.length }} {{ t('scan.errors', 'errors') }}
          </p>
        </div>

        <p
          v-if="error"
          class="text-sm text-red-500"
        >
          {{ error }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <u-button
          color="neutral"
          variant="ghost"
          @click="open = false"
        >
          {{ t('common.cancel', 'Cancel') }}
        </u-button>
        <u-button
          :loading="loading"
          :disabled="mode === 'local' ? !localPath : !gitRepo?.url"
          icon="i-heroicons-magnifying-glass"
          @click="runScan"
        >
          {{ t('scan.run', 'Scan') }}
        </u-button>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import type { IGitRepo } from '../interfaces/project.interface'

const { t } = useT()

const props = defineProps<{
  projectId: number
  project?: { languages?: { code: string; name: string }[]; root_path?: string; git_repo?: IGitRepo | null }
}>()

const emit = defineEmits<{ done: [] }>()

const open = defineModel<boolean>('open', { default: false })

const mode = ref<'local' | 'git'>('local')
const localPath = ref(props.project?.root_path ?? '')
const gitRepo = ref<IGitRepo | null>(null)
const saveRepo = ref(false)
const loading = ref(false)
const result = ref<any>(null)
const error = ref('')

const modes = computed(() => [
  { value: 'local', label: t('scan.mode_local', 'Local'), icon: 'i-heroicons-computer-desktop' },
  { value: 'git', label: t('scan.mode_git', 'Git repo'), icon: 'i-heroicons-code-bracket' },
])

watch(open, (val) => {
  if (val) {
    result.value = null
    error.value = ''
    localPath.value = props.project?.root_path ?? ''
    saveRepo.value = false
    mode.value = props.project?.root_path ? 'local' : 'git'
    gitRepo.value = props.project?.git_repo ? { ...props.project.git_repo } : null
  }
})

async function runScan() {
  loading.value = true
  error.value = ''
  result.value = null
  try {
    if (mode.value === 'git' && saveRepo.value && gitRepo.value?.url) {
      await $fetch(`/api/projects/${props.projectId}`, {
        method: 'PUT',
        body: { git_repo: gitRepo.value },
      })
    }

    result.value = await $fetch('/api/scan', {
      method: 'POST',
      body: {
        project_id: props.projectId,
        mode: mode.value,
        root_path: mode.value === 'local' ? localPath.value : undefined,
        git_url: mode.value === 'git' ? gitRepo.value?.url : undefined,
        git_branch: mode.value === 'git' ? gitRepo.value?.branch : undefined,
        git_token: mode.value === 'git' ? gitRepo.value?.token : undefined,
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

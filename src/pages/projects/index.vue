<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('nav.projects', 'Projects') }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
          {{ t('projects.subtitle', 'Manage your Vue.js projects') }}
        </p>
      </div>
      <u-button
        data-cy="projects-add-btn"
        icon="i-heroicons-plus"
        :disabled="pending"
        @click="openAdd"
      >
        {{ t('projects.add', 'Add a project') }}
      </u-button>
    </div>

    <!-- Skeleton -->
    <div
      v-if="pending"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4"
      >
        <div class="flex items-center gap-3">
          <u-skeleton class="w-10 h-10 rounded-lg shrink-0" />
          <div class="flex-1 space-y-1.5">
            <u-skeleton class="h-4 w-2/3" />
            <u-skeleton class="h-3 w-full" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <u-skeleton class="h-16 rounded-lg" />
          <u-skeleton class="h-16 rounded-lg" />
        </div>
        <u-skeleton class="h-8 rounded-lg" />
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!userProjects.length"
      class="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-16 text-center"
    >
      <u-icon
        class="text-6xl text-gray-300 dark:text-gray-600 mb-4"
        name="i-heroicons-folder-open"
      />
      <h2 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
        {{ t('projects.none', 'No project') }}
      </h2>
      <p class="text-gray-400 text-sm max-w-md mx-auto mb-6">
        {{ t('projects.none_hint', 'Add a Vue.js project to start managing its translation keys. Point to the root folder of your project.') }}
      </p>
      <u-button
        icon="i-heroicons-plus"
        size="lg"
        @click="openAdd"
      >
        {{ t('projects.add_first', 'Add your first project') }}
      </u-button>
    </div>

    <!-- Project cards -->
    <div
      v-else-if="userProjects.length"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start"
    >
      <div
        v-for="project in userProjects"
        :key="project.id"
        :data-cy="'project-card-' + project.id"
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-pointer"
        @click="router.push(`/projects/${project.id}`)"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-3 min-w-0">
            <div
              :class="`bg-${project.color || 'primary'}-100 dark:bg-${project.color || 'primary'}-900/30`"
              class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            >
              <u-icon
                :class="`text-${project.color || 'primary'}-600`"
                class="text-xl"
                name="i-heroicons-folder"
              />
            </div>
            <div class="min-w-0">
              <h3
                :data-cy="'project-name-' + project.id"
                class="font-semibold text-gray-900 dark:text-white truncate"
              >
                {{ project.name }}
              </h3>
              <p
                v-if="project.description"
                class="text-xs text-gray-400 truncate mt-0.5"
              >
                {{ project.description }}
              </p>
              <p
                v-else
                class="text-xs text-gray-300 dark:text-gray-600 truncate mt-0.5 italic"
              >
                {{ t('projects.no_description', 'No description') }}
              </p>
            </div>
          </div>
          <u-dropdown-menu
            :items="projectActions(project)"
            @click.stop
          >
            <u-button
              :data-cy="'project-menu-btn-' + project.id"
              color="neutral"
              icon="i-heroicons-ellipsis-vertical"
              size="xs"
              variant="ghost"
              @click.stop
            />
          </u-dropdown-menu>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ project.key_count }}
            </p>
            <p
              :data-cy="'project-keys-stat-' + project.id"
              class="text-xs text-gray-400 mt-0.5"
            >
              {{ t('projects.keys_stat', 'Translation keys') }}
            </p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ project.language_count }}
            </p>
            <p class="text-xs text-gray-400 mt-0.5">
              {{ t('nav.languages', 'Languages') }}
            </p>
          </div>
        </div>

        <!-- Config info -->
        <div class="space-y-1.5">
          <div
            v-if="project.root_path"
            class="flex items-center gap-2 text-xs text-gray-400"
          >
            <u-icon
              name="i-heroicons-folder"
              class="shrink-0 text-gray-300 dark:text-gray-600"
            />
            <span class="truncate font-mono">{{ project.root_path }}/{{ project.locales_path }}</span>
          </div>
          <div
            v-if="project.git_repo?.url"
            class="flex items-center gap-2 text-xs text-blue-500 dark:text-blue-400"
          >
            <u-icon
              name="i-heroicons-code-bracket"
              class="shrink-0"
            />
            <span class="truncate font-mono">{{ project.git_repo.url }}</span>
            <span
              v-if="project.git_repo.branch"
              class="shrink-0 text-gray-400"
            >· {{ project.git_repo.branch }}</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <u-icon
              name="i-heroicons-key"
              class="shrink-0 text-gray-300 dark:text-gray-600"
            />
            <span>{{ t('projects.separator', 'separator:') }} <code class="font-mono text-gray-600 dark:text-gray-300">{{ project.key_separator }}</code></span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
          <template v-if="!project.is_system">
            <u-tooltip
              :text="!canScanProject(project) ? t('projects.scan_requires_source', 'Requires a local path or git repo') : t('projects.scan_tooltip', 'Scan source files')"
              :disabled="canScanProject(project)"
            >
              <u-button
                :disabled="!canScanProject(project)"
                color="neutral"
                icon="i-heroicons-magnifying-glass"
                size="xs"
                variant="outline"
                @click.stop="canScanProject(project) && openScanModal(project)"
              >
                {{ t('sidebar.scan', 'Scan') }}
              </u-button>
            </u-tooltip>
            <u-tooltip
              :text="!canSyncProject(project) ? t('projects.sync_requires_source', 'Requires a local path or git repo') : t('projects.sync_tooltip', 'Sync JSON files')"
              :disabled="canSyncProject(project)"
            >
              <u-button
                :disabled="!canSyncProject(project)"
                :loading="syncing === project.id"
                color="neutral"
                icon="i-heroicons-arrow-path"
                size="xs"
                variant="outline"
                @click.stop="canSyncProject(project) && syncProject(project)"
              >
                {{ t('sidebar.sync', 'Sync JSON') }}
              </u-button>
            </u-tooltip>
          </template>
          <u-button
            :data-cy="'project-open-btn-' + project.id"
            class="ml-auto"
            color="primary"
            size="xs"
            @click.stop="router.push(`/projects/${project.id}`)"
          >
            {{ t('projects.open', 'Open') }}
          </u-button>
        </div>
      </div>
    </div>

    <!-- Add / Edit modal -->
    <u-modal
      v-model:open="showModal"
      data-cy="project-modal"
      :title="editingProject ? t('projects.edit_modal_title', 'Edit project') : t('projects.add_modal_title', 'Add a project')"
      :ui="{ width: 'max-w-2xl' }"
    >
      <template #body>
        <!-- Step indicator (creation only) -->
        <div
          v-if="!editingProject"
          class="flex items-center gap-2 mb-5"
        >
          <div
            v-for="(label, i) in [t('projects.step_source', 'Source'), t('projects.step_info', 'Info'), t('projects.step_languages', 'Languages')]"
            :key="i"
            class="flex items-center gap-2"
          >
            <div
              class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              :class="step === i + 1
                ? 'bg-primary-500 text-white'
                : step > i + 1 ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'"
            >
              <u-icon
                v-if="step > i + 1"
                name="i-heroicons-check"
                class="text-xs"
              />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span
              class="text-sm"
              :class="step === i + 1 ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-400'"
            >{{ label }}</span>
            <div
              v-if="i < 2"
              class="flex-1 h-px bg-gray-200 dark:bg-gray-700 w-8"
            />
          </div>
        </div>

        <!-- Creation: Step 1 — Source -->
        <div
          v-if="!editingProject && step === 1"
          data-cy="project-step-source"
          class="space-y-4"
        >
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('projects.step_source_hint', 'Enter a local path and/or a git repository to auto-detect project configuration.') }}
          </p>
          <u-form-field :label="t('projects.local_path_label', 'Local path (optional)')">
            <project-path-picker
              v-model="form.root_path"
              class="w-full"
            />
          </u-form-field>
          <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {{ t('projects.git_repo_title', 'Git repository') }}
            </p>
            <project-git-repo-manager v-model="form.git_repo" />
          </div>
        </div>

        <!-- Creation: Step 2 — Project info -->
        <div
          v-if="!editingProject && step === 2"
          class="space-y-4"
        >
          <u-form-field
            :label="t('projects.name_label', 'Project name')"
            required
            :error="nameError"
          >
            <u-input
              v-model="form.name"
              class="w-full"
              :placeholder="t('projects.name_placeholder', 'My Vue App')"
              @input="nameError = ''"
            />
          </u-form-field>

          <u-form-field
            :hint="t('projects.locales_path_hint', 'Relative to the project root')"
            :label="t('projects.locales_path_label', 'Locales folder')"
          >
            <u-input
              v-model="form.locales_path"
              class="w-full"
              :placeholder="t('projects.locales_path_placeholder', 'src/locales')"
            />
          </u-form-field>

          <div class="grid grid-cols-2 gap-4">
            <u-form-field :label="t('projects.key_separator_label', 'Key separator')">
              <u-input
                v-model="form.key_separator"
                :maxlength="5"
                class="w-full"
                :placeholder="t('projects.key_separator_placeholder', '.')"
              />
            </u-form-field>
            <u-form-field :label="t('projects.color_label', 'Color')">
              <u-select
                v-model="form.color"
                :items="colorOptions"
                class="w-full"
              />
            </u-form-field>
          </div>

          <u-form-field :label="t('translations.description_label', 'Description')">
            <u-input
              v-model="form.description"
              class="w-full"
              :placeholder="t('projects.description_placeholder', 'Optional description')"
            />
          </u-form-field>

          <div
            v-if="form.root_path"
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
          >
            <p class="text-xs text-gray-500 font-medium mb-1">
              {{ t('projects.locales_path_preview', 'Locales path:') }}
            </p>
            <code class="text-xs text-gray-700 dark:text-gray-300 font-mono break-all">
              {{ form.root_path }}/{{ form.locales_path || 'src/locales' }}
            </code>
          </div>
        </div>

        <!-- Creation: Step 3 — Languages -->
        <div
          v-if="!editingProject && step === 3"
          class="space-y-3"
        >
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ t('projects.step_languages_hint', 'Add the languages for this project. The first one will be set as default. You can add more later.') }}
          </p>
          <project-language-picker v-model="form.languages" />
        </div>

        <!-- Edit: single step (all fields) -->
        <div
          v-if="editingProject"
          class="space-y-4"
        >
          <u-form-field
            :label="t('projects.name_label', 'Project name')"
            required
            :error="nameError"
          >
            <u-input
              v-model="form.name"
              class="w-full"
              :placeholder="t('projects.name_placeholder', 'My Vue App')"
              @input="nameError = ''"
            />
          </u-form-field>

          <u-form-field
            :hint="t('projects.local_path_hint', 'Absolute path on the server where the dashboard runs')"
            :label="t('projects.local_path_label', 'Local path (optional)')"
          >
            <project-path-picker
              v-model="form.root_path"
              class="w-full"
            />
          </u-form-field>

          <u-form-field
            :hint="t('projects.locales_path_hint', 'Relative to the project root')"
            :label="t('projects.locales_path_label', 'Locales folder')"
          >
            <u-input
              v-model="form.locales_path"
              class="w-full"
              :placeholder="t('projects.locales_path_placeholder', 'src/locales')"
            />
          </u-form-field>

          <div class="grid grid-cols-2 gap-4">
            <u-form-field :label="t('projects.key_separator_label', 'Key separator')">
              <u-input
                v-model="form.key_separator"
                :maxlength="5"
                class="w-full"
                :placeholder="t('projects.key_separator_placeholder', '.')"
              />
            </u-form-field>
            <u-form-field :label="t('projects.color_label', 'Color')">
              <u-select
                v-model="form.color"
                :items="colorOptions"
                class="w-full"
              />
            </u-form-field>
          </div>

          <u-form-field :label="t('translations.description_label', 'Description')">
            <u-input
              v-model="form.description"
              class="w-full"
              :placeholder="t('projects.description_placeholder', 'Optional description')"
            />
          </u-form-field>

          <div
            v-if="form.root_path"
            class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
          >
            <p class="text-xs text-gray-500 font-medium mb-1">
              {{ t('projects.locales_path_preview', 'Locales path:') }}
            </p>
            <code class="text-xs text-gray-700 dark:text-gray-300 font-mono break-all">
              {{ form.root_path }}/{{ form.locales_path || 'src/locales' }}
            </code>
          </div>

          <!-- Git repository -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {{ t('projects.git_repo_title', 'Git repository') }}
            </p>
            <project-git-repo-manager v-model="form.git_repo" />
          </div>
        </div>
      </template>
      <template #footer>
        <!-- Creation footer -->
        <div
          v-if="!editingProject"
          class="flex justify-between gap-3"
        >
          <!-- Step 1 -->
          <template v-if="step === 1">
            <u-button
              data-cy="modal-cancel-btn"
              color="neutral"
              variant="ghost"
              @click="showModal = false"
            >
              {{ t('common.cancel', 'Cancel') }}
            </u-button>
            <u-button
              :disabled="!form.root_path && !form.git_repo?.url"
              :loading="detecting"
              @click="detectAndNext"
            >
              {{ detecting ? t('projects.detecting', 'Detecting...') : t('projects.detect_next', 'Detect & Next') }}
              <u-icon
                v-if="!detecting"
                name="i-heroicons-arrow-right"
                class="ml-1"
              />
            </u-button>
          </template>
          <!-- Step 2 -->
          <template v-else-if="step === 2">
            <u-button
              color="neutral"
              variant="ghost"
              icon="i-heroicons-arrow-left"
              @click="step = 1"
            >
              {{ t('common.back', 'Back') }}
            </u-button>
            <div class="flex gap-3">
              <u-button
                color="neutral"
                variant="ghost"
                @click="showModal = false"
              >
                {{ t('common.cancel', 'Cancel') }}
              </u-button>
              <u-button
                :disabled="!form.name || !!nameError"
                @click="step = 3"
              >
                {{ t('common.next', 'Next') }} <u-icon
                  name="i-heroicons-arrow-right"
                  class="ml-1"
                />
              </u-button>
            </div>
          </template>
          <!-- Step 3 -->
          <template v-else-if="step === 3">
            <u-button
              color="neutral"
              variant="ghost"
              icon="i-heroicons-arrow-left"
              :disabled="saving || !!creationStep"
              @click="step = 2"
            >
              {{ t('common.back', 'Back') }}
            </u-button>
            <div class="flex gap-3">
              <u-button
                color="neutral"
                variant="ghost"
                :disabled="saving || !!creationStep"
                @click="showModal = false"
              >
                {{ t('common.cancel', 'Cancel') }}
              </u-button>
              <u-button
                :disabled="!form.name"
                :loading="saving || !!creationStep"
                @click="saveProject"
              >
                {{ creationStep || t('common.create', 'Create') }}
              </u-button>
            </div>
          </template>
        </div>
        <!-- Edit footer -->
        <div
          v-else
          class="flex justify-end gap-3"
        >
          <u-button
            color="neutral"
            variant="ghost"
            @click="showModal = false"
          >
            {{ t('common.cancel', 'Cancel') }}
          </u-button>
          <u-button
            :disabled="!form.name || !!nameError"
            :loading="saving"
            @click="saveProject"
          >
            {{ t('common.edit', 'Edit') }}
          </u-button>
        </div>
      </template>
    </u-modal>

    <!-- Scan modal -->
    <common-scan-modal
      v-if="scanningProject"
      v-model:open="showScanModal"
      :project-id="scanningProject.id"
      :project="scanningProject"
      @done="() => { fetchProjects(); showScanModal = false }"
    />

    <!-- Delete confirm -->
    <u-modal
      v-model:open="showDeleteConfirm"
      :title="t('projects.delete_title', 'Delete project')"
    >
      <template #body>
        <div data-cy="project-delete-modal">
          <p class="text-gray-600 dark:text-gray-400">
            {{ t('projects.delete_confirm', 'Delete') }} <strong>{{ deletingProject?.name }}</strong>? {{ t('projects.delete_warning', 'All keys, translations and history will be deleted.') }}
          </p>
          <p
            data-cy="delete-irreversible-text"
            class="text-red-500 text-sm mt-2 font-medium"
          >
            {{ t('common.irreversible', 'This action is irreversible.') }}
          </p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <u-button
            color="neutral"
            variant="ghost"
            @click="showDeleteConfirm = false"
          >
            {{ t('common.cancel', 'Cancel') }}
          </u-button>
          <u-button
            data-cy="project-delete-confirm-btn"
            :loading="deleting"
            color="error"
            @click="deleteProject"
          >
            {{ t('common.delete', 'Delete') }}
          </u-button>
        </div>
      </template>
    </u-modal>
  </div>
</template>

<script lang="ts" setup>
import { canScanProject, canSyncProject } from '../../composables/useProject'

const router = useRouter()
const { t } = useT()
const toast = useToast()

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editingProject = ref<any>(null)
const deletingProject = ref<any>(null)
const nameError = ref('')

const step = ref(1)
const detecting = ref(false)
const creationStep = ref('')

const form = ref<{
  name: string
  root_path: string
  locales_path: string
  key_separator: string
  color: string
  description: string
  git_repo: { url: string; branch?: string; name?: string; token?: string } | null
  languages: Array<{ code: string; name: string; is_default: boolean }>
}>({
  name: '',
  root_path: '',
  locales_path: 'src/locales',
  key_separator: '.',
  color: 'primary',
  description: '',
  git_repo: null,
  languages: [],
})


const colorOptions = computed(() => [
  { label: t('projects.color_blue', 'Blue (primary)'), value: 'primary' },
  { label: t('projects.color_green', 'Green'), value: 'green' },
  { label: t('projects.color_orange', 'Orange'), value: 'orange' },
  { label: t('projects.color_red', 'Red'), value: 'red' },
  { label: t('projects.color_purple', 'Purple'), value: 'purple' },
  { label: t('projects.color_pink', 'Pink'), value: 'pink' },
  { label: t('projects.color_yellow', 'Yellow'), value: 'yellow' },
  { label: t('projects.color_gray', 'Gray'), value: 'gray' },
])

const {
  pending,
  saving,
  createProject,
  updateProject,
  deleting,
  deleteProject: doDeleteProject,
  syncing,
  syncProject,
  fetchProjects,
  visibleProjects: userProjects,
  checkProjectName,
  detectProject,
  scanWithOptions,
} = useProject()

const { createLanguageForProject } = useLanguages()

const showScanModal = ref(false)
const scanningProject = ref<any>(null)

const openScanModal = (project: any) => {
  scanningProject.value = project
  showScanModal.value = true
}

let _nameCheckTimer: ReturnType<typeof setTimeout> | null = null
watch(() => form.value.name, (name) => {
  if (_nameCheckTimer) clearTimeout(_nameCheckTimer)
  if (!name.trim()) { nameError.value = ''; return }
  _nameCheckTimer = setTimeout(async () => {
    const result = await checkProjectName(name, editingProject.value?.id ?? undefined)
    nameError.value = result.available ? '' : t('projects.name_taken', 'This name is already taken')
  }, 400)
})

const openAdd = () => {
  editingProject.value = null
  nameError.value = ''
  step.value = 1
  form.value = { name: '', root_path: '', locales_path: 'src/locales', key_separator: '.', color: 'primary', description: '', git_repo: null, languages: [] }
  showModal.value = true
}

const openEdit = (project: any) => {
  editingProject.value = project
  step.value = 1
  form.value = {
    name: project.name,
    root_path: project.root_path || '',
    locales_path: project.locales_path,
    key_separator: project.key_separator,
    color: project.color || 'primary',
    description: project.description || '',
    git_repo: project.git_repo ? { ...project.git_repo } : null,
    languages: [],
  }
  showModal.value = true
}

const projectActions = (project: any) => {
  return [
    [
      { label: t('common.edit', 'Edit'), icon: 'i-heroicons-pencil', onSelect: () => openEdit(project) },
      ...(!project.is_system ? [{
        label: t('common.delete', 'Delete'),
        icon: 'i-heroicons-trash',
        color: 'error' as const,
        onSelect: () => { deletingProject.value = project; showDeleteConfirm.value = true },
      }] : []),
    ],
  ]
}

const detectAndNext = async () => {
  detecting.value = true
  try {
    const body: Record<string, string> = {}
    if (form.value.root_path) body.root_path = form.value.root_path
    if (form.value.git_repo?.url) {
      body.git_url = form.value.git_repo.url
      if (form.value.git_repo.branch) body.git_branch = form.value.git_repo.branch
      if (form.value.git_repo.token) body.git_token = form.value.git_repo.token
    }

    const data = await detectProject(body)

    if (data.name) form.value.name = data.name
    if (data.localesPath !== undefined) form.value.locales_path = data.localesPath || 'src/locales'
    if (data.languages?.length) {
      form.value.languages = data.languages.map((l, i) => ({ ...l, is_default: i === 0 }))
    }

    step.value = 2
  } catch (e: any) {
    toast.add({
      title: t('common.error', 'Error'),
      description: e?.data?.message ?? e?.message ?? t('projects.detection_failed', 'Detection failed'),
      color: 'error',
    })
  } finally {
    detecting.value = false
  }
}

const saveProject = async () => {
  if (!form.value.name || nameError.value) return
  nameError.value = ''
  if (editingProject.value) {
    const ok = await updateProject(editingProject.value.id, form.value)
    if (ok) showModal.value = false
  } else {
    try {
      const newProject = await createProject(form.value)
      if (newProject) {
        // Create languages
        if (form.value.languages.length) {
          creationStep.value = t('projects.creating_languages', 'Adding languages...')
          for (const lang of form.value.languages) {
            await createLanguageForProject(newProject.id, { code: lang.code, name: lang.name, is_default: lang.is_default })
          }
        }

        // Scan source files
        const scanBody: Record<string, any> = { project_id: newProject.id }
        if (form.value.git_repo?.url) {
          scanBody.mode = 'git'
          scanBody.git_url = form.value.git_repo.url
          if (form.value.git_repo.branch) scanBody.git_branch = form.value.git_repo.branch
          if (form.value.git_repo.token) scanBody.git_token = form.value.git_repo.token
        } else if (form.value.root_path) {
          scanBody.mode = 'local'
          scanBody.root_path = form.value.root_path
        }

        if (scanBody.mode) {
          creationStep.value = t('projects.scanning_files', 'Scanning source files...')
          try {
            await scanWithOptions(scanBody)
          } catch {}

          if (scanBody.mode === 'local') {
            creationStep.value = t('projects.syncing_translations', 'Syncing translations...')
            try {
              await syncProject({ id: newProject.id, name: newProject.name })
            } catch {}
          }
        }

        creationStep.value = ''
        showModal.value = false
        await router.push(`/projects/${newProject.id}`)
      }
    } catch (e: any) {
      creationStep.value = ''
      if (e?.data?.message === 'project_name_taken') {
        nameError.value = t('projects.name_taken', 'This name is already taken')
        step.value = 2
      } else {
        toast.add({
          title: t('common.error', 'Error'),
          description: e?.data?.message ?? e?.message ?? t('projects.create_failed', 'Could not create project'),
          color: 'error',
        })
      }
    }
  }
}

const deleteProject = async () => {
  if (!deletingProject.value) return
  const ok = await doDeleteProject(deletingProject.value.id)
  if (ok) showDeleteConfirm.value = false
}
</script>

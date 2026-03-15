<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('nav.projects', 'Projects') }}</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">{{ t('projects.subtitle', 'Manage your Vue.js projects') }}</p>
      </div>
      <UButton icon="i-heroicons-plus" @click="openAdd">{{ t('projects.add', 'Add a project') }}</UButton>
    </div>

    <!-- Skeleton -->
    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <div class="flex items-center gap-3">
          <USkeleton class="w-10 h-10 rounded-lg shrink-0" />
          <div class="flex-1 space-y-1.5">
            <USkeleton class="h-4 w-2/3" />
            <USkeleton class="h-3 w-full" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <USkeleton class="h-16 rounded-lg" />
          <USkeleton class="h-16 rounded-lg" />
        </div>
        <USkeleton class="h-8 rounded-lg" />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!userProjects.length"
         class="bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-16 text-center">
      <UIcon class="text-6xl text-gray-300 dark:text-gray-600 mb-4" name="i-heroicons-folder-open"/>
      <h2 class="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">{{ t('projects.none', 'No project') }}</h2>
      <p class="text-gray-400 text-sm max-w-md mx-auto mb-6">
        {{ t('projects.none_hint', 'Add a Vue.js project to start managing its translation keys. Point to the root folder of your project.') }}
      </p>
      <UButton icon="i-heroicons-plus" size="lg" @click="openAdd">{{ t('projects.add_first', 'Add your first project') }}</UButton>
    </div>

    <!-- Project cards -->
    <div v-else-if="userProjects.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
          v-for="project in userProjects"
          :key="project.id"
          class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors cursor-pointer"
          @click="router.push(`/projects/${project.id}`)"
      >
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div :class="`bg-${project.color || 'primary'}-100 dark:bg-${project.color || 'primary'}-900/30`"
                 class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
              <UIcon :class="`text-${project.color || 'primary'}-600`" class="text-xl" name="i-heroicons-folder"/>
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold text-gray-900 dark:text-white truncate">{{ project.name }}</h3>
              <p class="text-xs text-gray-400 truncate font-mono mt-0.5">{{ project.root_path }}</p>
            </div>
          </div>
          <UDropdownMenu :items="projectActions(project)" @click.stop>
            <UButton color="neutral" icon="i-heroicons-ellipsis-vertical" size="xs" variant="ghost" @click.stop/>
          </UDropdownMenu>
        </div>

        <!-- Description -->
        <p v-if="project.description" class="text-sm text-gray-500 dark:text-gray-400">
          {{ project.description }}
        </p>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ project.key_count }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ t('projects.keys_stat', 'Translation keys') }}</p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ project.language_count }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ t('nav.languages', 'Languages') }}</p>
          </div>
        </div>

        <!-- Config info -->
        <div class="flex flex-wrap gap-3 text-xs text-gray-400">
          <span v-if="project.root_path" class="flex items-center gap-1">
            <UIcon class="text-xs" name="i-heroicons-folder"/>
            {{ project.locales_path }}
          </span>
          <span v-if="project.git_repos?.length" class="flex items-center gap-1 text-blue-400">
            <UIcon class="text-xs" name="i-heroicons-code-bracket"/>
            {{ project.git_repos.length }} {{ t('projects.git_repos_count', 'git repo(s)') }}
          </span>
          <span class="flex items-center gap-1">
            <UIcon class="text-xs" name="i-heroicons-key"/>
            {{ t('projects.separator', 'separator:') }} <code class="font-mono">{{ project.key_separator }}</code>
          </span>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
          <UTooltip :text="!canScanProject(project) ? t('projects.scan_requires_local', 'Requires a local path') : t('projects.scan_tooltip', 'Scan source files')" :disabled="canScanProject(project)">
            <UButton
                :disabled="!canScanProject(project)"
                :loading="scanning === project.id"
                color="neutral"
                icon="i-heroicons-magnifying-glass"
                size="xs"
                variant="outline"
                @click.stop="canScanProject(project) && scanProject(project)"
            >
              {{ t('sidebar.scan', 'Scan') }}
            </UButton>
          </UTooltip>
          <UTooltip :text="!canSyncProject(project) ? t('projects.sync_requires_source', 'Requires a local path or remote URL') : t('projects.sync_tooltip', 'Sync JSON files')" :disabled="canSyncProject(project)">
            <UButton
                :disabled="!canSyncProject(project)"
                :loading="syncing === project.id"
                color="neutral"
                icon="i-heroicons-arrow-path"
                size="xs"
                variant="outline"
                @click.stop="canSyncProject(project) && syncProject(project)"
            >
              {{ t('sidebar.sync', 'Sync JSON') }}
            </UButton>
          </UTooltip>
          <UButton class="ml-auto" color="primary" size="xs" @click.stop="router.push(`/projects/${project.id}`)">
            {{ t('projects.open', 'Open') }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- Add / Edit modal -->
    <UModal v-model:open="showModal" :title="editingProject ? t('projects.edit_modal_title', 'Edit project') : t('projects.add_modal_title', 'Add a project')">
      <template #body>
        <div class="space-y-4">
          <UFormField :label="t('projects.name_label', 'Project name')" required :error="nameError">
            <UInput v-model="form.name" class="w-full" :placeholder="t('projects.name_placeholder', 'My Vue App')" @input="nameError = ''"/>
          </UFormField>

          <UFormField :hint="t('projects.local_path_hint', 'Absolute path on the server where the dashboard runs')" :label="t('projects.local_path_label', 'Local path (optional)')">
            <PathPicker v-model="form.root_path" class="w-full" />
          </UFormField>

          <UFormField :hint="t('projects.locales_path_hint', 'Relative to the project root')" :label="t('projects.locales_path_label', 'Locales folder')">
            <UInput v-model="form.locales_path" class="w-full" placeholder="src/locales"/>
          </UFormField>

          <div class="grid grid-cols-2 gap-4">
            <UFormField :label="t('projects.key_separator_label', 'Key separator')">
              <UInput v-model="form.key_separator" :maxlength="5" class="w-full" placeholder="."/>
            </UFormField>
            <UFormField :label="t('projects.color_label', 'Color')">
              <USelect v-model="form.color" :items="colorOptions" class="w-full"/>
            </UFormField>
          </div>

          <UFormField :label="t('translations.description_label', 'Description')">
            <UInput v-model="form.description" class="w-full" :placeholder="t('projects.description_placeholder', 'Optional description')"/>
          </UFormField>

          <div v-if="form.root_path" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p class="text-xs text-gray-500 font-medium mb-1">{{ t('projects.locales_path_preview', 'Locales path:') }}</p>
            <code class="text-xs text-gray-700 dark:text-gray-300 font-mono break-all">
              {{ form.root_path }}/{{ form.locales_path || 'src/locales' }}
            </code>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="showModal = false">{{ t('common.cancel', 'Cancel') }}</UButton>
          <UButton :disabled="!form.name" :loading="saving" @click="saveProject">
            {{ editingProject ? t('common.edit', 'Edit') : t('common.add', 'Add') }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete confirm -->
    <UModal v-model:open="showDeleteConfirm" :title="t('projects.delete_title', 'Delete project')">
      <template #body>
        <p class="text-gray-600 dark:text-gray-400">
          {{ t('projects.delete_confirm', 'Delete') }} <strong>{{ deletingProject?.name }}</strong>? {{ t('projects.delete_warning', 'All keys, translations and history will be deleted.') }}
        </p>
        <p class="text-red-500 text-sm mt-2 font-medium">{{ t('common.irreversible', 'This action is irreversible.') }}</p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="showDeleteConfirm = false">{{ t('common.cancel', 'Cancel') }}</UButton>
          <UButton :loading="deleting" color="error" @click="deleteProject">{{ t('common.delete', 'Delete') }}</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
import { canScanProject, canSyncProject } from '~/composables/useProject'

const router = useRouter()
const { t } = useT()

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editingProject = ref<any>(null)
const deletingProject = ref<any>(null)
const nameError = ref('')

const form = ref({
  name: '',
  root_path: '',
  locales_path: 'src/locales',
  key_separator: '.',
  color: 'primary',
  description: '',
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
  scanning,
  scanProject,
  syncing,
  syncProject,
  visibleProjects: userProjects,
} = useProject()

let _nameCheckTimer: ReturnType<typeof setTimeout> | null = null
watch(() => form.value.name, (name) => {
  if (_nameCheckTimer) clearTimeout(_nameCheckTimer)
  if (!name.trim()) { nameError.value = ''; return }
  _nameCheckTimer = setTimeout(async () => {
    const result = await $fetch<{ available: boolean }>('/api/projects/check-name', {
      query: { name, exclude_id: editingProject.value?.id ?? undefined },
    })
    nameError.value = result.available ? '' : t('projects.name_taken', 'This name is already taken')
  }, 400)
})

function openAdd() {
  editingProject.value = null
  nameError.value = ''
  form.value = { name: '', root_path: '', locales_path: 'src/locales', key_separator: '.', color: 'primary', description: '' }
  showModal.value = true
}

function openEdit(project: any) {
  editingProject.value = project
  form.value = {
    name: project.name,
    root_path: project.root_path || '',
    locales_path: project.locales_path,
    key_separator: project.key_separator,
    color: project.color || 'primary',
    description: project.description || '',
  }
  showModal.value = true
}

function projectActions(project: any) {
  return [
    [
      { label: t('common.edit', 'Edit'), icon: 'i-heroicons-pencil', onSelect: () => openEdit(project) },
      {
        label: t('common.delete', 'Delete'),
        icon: 'i-heroicons-trash',
        color: 'error' as const,
        onSelect: () => { deletingProject.value = project; showDeleteConfirm.value = true },
      },
    ],
  ]
}

async function saveProject() {
  if (!form.value.name || nameError.value) return
  nameError.value = ''
  if (editingProject.value) {
    const ok = await updateProject(editingProject.value.id, form.value)
    if (ok) showModal.value = false
  } else {
    try {
      const newProject = await createProject(form.value)
      if (newProject) {
        showModal.value = false
        await router.push(`/projects/${newProject.id}`)
      }
    } catch (e: any) {
      if (e?.data?.message === 'project_name_taken') {
        nameError.value = t('projects.name_taken', 'This name is already taken')
      }
    }
  }
}

async function deleteProject() {
  if (!deletingProject.value) return
  const ok = await doDeleteProject(deletingProject.value.id)
  if (ok) showDeleteConfirm.value = false
}
</script>

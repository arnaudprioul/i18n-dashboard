<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 data-cy="project-users-title" class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('users.title', 'Users') }}</h1>
        <p data-cy="project-users-subtitle" class="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
          {{ t('users.project_members', 'Members of project') }} <strong>{{ currentProject?.name }}</strong>
        </p>
      </div>
      <UButton data-cy="users-add-btn" icon="i-heroicons-plus" @click="openAdd">{{ t('users.add', 'Add a user') }}</UButton>
    </div>

    <!-- Users table -->
    <UCard>
      <div v-if="pending" class="space-y-3">
        <USkeleton v-for="i in 4" :key="i" class="h-12" />
      </div>
      <div v-else-if="!users.length" class="text-center py-12">
        <UIcon name="i-heroicons-users" class="text-4xl text-gray-300 mb-2" />
        <p class="text-gray-400">{{ t('users.none_in_project', 'No users in this project') }}</p>
      </div>
      <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
        <div
          v-for="user in users"
          :key="user.id"
          class="flex items-center justify-between py-3 gap-4"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
              <span class="text-sm font-bold text-primary-600 dark:text-primary-400">
                {{ user.name.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-medium text-gray-900 dark:text-white text-sm truncate">{{ user.name }}</p>
                <UBadge v-if="!user.is_active" size="xs" color="neutral" variant="outline">{{ t('users.inactive', 'Inactive') }}</UBadge>
              </div>
              <p class="text-xs text-gray-400 truncate">{{ user.email }}</p>
            </div>
          </div>

          <!-- Role badge -->
          <div class="flex-1 flex justify-center">
            <UBadge v-if="user.role" size="xs" :color="roleColor(user.role)" variant="soft">
              {{ roleLabel(user.role) }}
            </UBadge>
            <span v-else class="text-xs text-gray-400 italic">{{ t('users.no_role', 'No role') }}</span>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs text-gray-400">
              {{ user.last_login_at ? formatRelative(user.last_login_at) : t('users.never_connected', 'Never logged in') }}
            </span>
            <UDropdownMenu :items="userActions(user)">
              <UButton icon="i-heroicons-ellipsis-vertical" color="neutral" variant="ghost" size="xs" />
            </UDropdownMenu>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Add user modal -->
    <UModal data-cy="add-user-modal" v-model:open="showModal" :title="addModalTitle">
      <template #body>

        <!-- ── Mode: select existing ──────────────────────────────────────── -->
        <div v-if="addMode === 'select'" class="space-y-4">
          <!-- Search -->
          <UInput
            data-cy="user-search-input"
            v-model="search"
            :placeholder="t('users.search_placeholder', 'Search by name or email…')"
            icon="i-heroicons-magnifying-glass"
            class="w-full"
          />

          <!-- User list -->
          <div class="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <div v-if="loadingAvailable" class="flex items-center justify-center py-8">
              <UIcon name="i-heroicons-arrow-path" class="animate-spin text-primary-500 text-xl" />
            </div>
            <div v-else-if="!filteredAvailable.length" class="py-8 text-center text-sm text-gray-400">
              <UIcon name="i-heroicons-users" class="text-2xl mb-1 block mx-auto text-gray-300" />
              {{ search ? t('users.no_match', 'No user matches your search') : t('users.all_already_members', 'All users are already members of this project') }}
            </div>
            <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
              <button
                v-for="u in filteredAvailable"
                :key="u.id"
                type="button"
                class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors text-left"
                :class="selectedUser?.id === u.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''"
                @click="selectUser(u)"
              >
                <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <span class="text-xs font-bold text-primary-600 dark:text-primary-400">{{ u.name.charAt(0).toUpperCase() }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ u.name }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ u.email }}</p>
                </div>
                <UIcon v-if="selectedUser?.id === u.id" name="i-heroicons-check-circle" class="text-primary-500 shrink-0" />
              </button>
            </div>
          </div>

          <!-- Role picker (shown when a user is selected) -->
          <Transition name="slide-down">
            <div v-if="selectedUser" class="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-4 space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                  <span class="text-xs font-bold text-primary-600">{{ selectedUser.name.charAt(0).toUpperCase() }}</span>
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ selectedUser.name }}</p>
                  <p class="text-xs text-gray-400">{{ selectedUser.email }}</p>
                </div>
              </div>
              <UFormField :label="t('users.role_label', 'Role')" required>
                <USelect v-model="selectRole" :items="roleOptions" class="w-full" />
              </UFormField>
            </div>
          </Transition>

          <!-- Divider + create new -->
          <div class="flex items-center gap-3">
            <div class="flex-1 border-t border-gray-200 dark:border-gray-700" />
            <span class="text-xs text-gray-400">{{ t('common.or', 'or') }}</span>
            <div class="flex-1 border-t border-gray-200 dark:border-gray-700" />
          </div>

          <UButton data-cy="create-new-user-btn" block color="neutral" variant="outline" icon="i-heroicons-user-plus" @click="switchToCreate">
            {{ t('users.create_new_user', 'Create a new user') }}
          </UButton>
        </div>

        <!-- ── Mode: create new ───────────────────────────────────────────── -->
        <div v-else class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormField :label="t('users.full_name', 'Full name')" required>
              <UInput data-cy="user-form-name" v-model="form.name" placeholder="Marie Dupont" class="w-full" />
            </UFormField>
            <UFormField :label="t('login.email', 'Email')" required>
              <UInput data-cy="user-form-email" v-model="form.email" type="email" placeholder="marie@example.com" class="w-full" />
            </UFormField>
          </div>

          <UFormField :label="t('users.role_label', 'Role')" required>
            <USelect v-model="form.role" :items="roleOptions" class="w-full" />
          </UFormField>

          <UFormField :label="t('users.project_label', 'Project')">
            <UInput :model-value="currentProject?.name" class="w-full" disabled />
          </UFormField>

          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p class="text-xs text-blue-600 dark:text-blue-400">
              <UIcon name="i-heroicons-information-circle" class="inline mr-1" />
              {{ t('users.temp_password_info', 'A temporary password will be generated and shown below.') }}
            </p>
          </div>

          <div v-if="createdTempPassword" class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <p class="text-xs text-green-700 dark:text-green-300 font-medium mb-1">
              <UIcon name="i-heroicons-key" class="inline mr-1" />
              {{ t('users.temp_password_label', 'Temporary password (copy it now):') }}
            </p>
            <div class="flex items-center gap-2">
              <code class="text-sm font-mono text-green-800 dark:text-green-200 flex-1">{{ createdTempPassword }}</code>
              <UButton size="xs" icon="i-heroicons-clipboard" color="neutral" variant="ghost" @click="copyTemp" />
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex items-center justify-between gap-3">
          <!-- Back button in create mode -->
          <UButton
            data-cy="add-user-back-btn"
            v-if="addMode === 'create' && !createdTempPassword"
            color="neutral"
            variant="ghost"
            icon="i-heroicons-arrow-left"
            @click="addMode = 'select'"
          >
            {{ t('users.back_to_select', 'Back') }}
          </UButton>
          <div v-else class="flex-1" />

          <div class="flex gap-3">
            <UButton data-cy="add-user-cancel-btn" color="neutral" variant="ghost" @click="closeModal">
              {{ createdTempPassword ? t('common.close', 'Close') : t('common.cancel', 'Cancel') }}
            </UButton>
            <!-- Select mode: add existing user -->
            <UButton
              v-if="addMode === 'select'"
              :disabled="!selectedUser"
              :loading="rolesSaving"
              @click="addExistingUser"
            >
              {{ t('users.add_to_project', 'Add to project') }}
            </UButton>
            <!-- Create mode: create new user -->
            <UButton v-else-if="!createdTempPassword" :loading="saving" @click="saveUser">
              {{ t('common.create', 'Create') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Role modal -->
    <UModal v-model:open="showRoleModal" :title="t('users.edit_role_title', 'Edit role')">
      <template #body>
        <div class="space-y-4">
          <div class="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
              <span class="font-bold text-primary-600 dark:text-primary-400">
                {{ roleModalUser?.name.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white text-sm">{{ roleModalUser?.name }}</p>
              <p class="text-xs text-gray-400">{{ roleModalUser?.email }}</p>
            </div>
          </div>
          <UFormField :label="`${t('users.role_in_project', 'Role in')} ${currentProject?.name}`">
            <USelect v-model="roleModalValue" :items="roleOptions" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="showRoleModal = false">{{ t('common.cancel', 'Cancel') }}</UButton>
          <UButton :loading="rolesSaving" @click="saveRole">{{ t('common.save', 'Save') }}</UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete confirm -->
    <UModal v-model:open="showDeleteConfirm" :title="t('users.remove_user_title', 'Remove user')">
      <template #body>
        <p class="text-gray-600 dark:text-gray-400">
          {{ t('users.remove_confirm', 'Remove') }} <strong>{{ deletingUser?.name }}</strong> {{ t('users.remove_from_project', 'from project') }} <strong>{{ currentProject?.name }}</strong>?
          {{ t('users.remove_account_kept', 'Their account will not be deleted.') }}
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="showDeleteConfirm = false">{{ t('common.cancel', 'Cancel') }}</UButton>
          <UButton color="error" :loading="deleting" @click="deleteUser">{{ t('users.remove_btn', 'Remove') }}</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { userService } from '~/services/user.service'
import type { IUserItem } from '~/interfaces/user.interface'

const toast = useToast()
const { currentUser } = useAuth()
const { currentProject } = useProject()
const { t } = useT()

// Guard: requires project context (client-only — server: false on projects prevents SSR redirect)
watch(currentProject, (p) => { if (import.meta.client && !p) navigateTo('/projects') })

// ── Modal state ────────────────────────────────────────────────────────────────
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const showRoleModal = ref(false)
const deletingUser = ref<any>(null)
const createdTempPassword = ref('')
const roleModalUser = ref<any>(null)
const roleModalValue = ref('translator')

// ── Add modal modes ────────────────────────────────────────────────────────────
const addMode = ref<'select' | 'create'>('select')

const addModalTitle = computed(() => {
  if (addMode.value === 'create') return t('users.add_user_title', 'Add a user')
  return t('users.add_to_project_title', 'Add a user to the project')
})

// ── Select mode: existing users ────────────────────────────────────────────────
const search = ref('')
const availableUsers = ref<IUserItem[]>([])
const loadingAvailable = ref(false)
const selectedUser = ref<IUserItem | null>(null)
const selectRole = ref('translator')

const filteredAvailable = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return availableUsers.value
  return availableUsers.value.filter(u =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  )
})

async function loadAvailableUsers() {
  if (!currentProject.value) return
  loadingAvailable.value = true
  try {
    availableUsers.value = await userService.getAvailableUsers(currentProject.value.id)
  }
  catch {
    availableUsers.value = []
  }
  finally {
    loadingAvailable.value = false
  }
}

function selectUser(u: IUserItem) {
  selectedUser.value = selectedUser.value?.id === u.id ? null : u
}

function switchToCreate() {
  addMode.value = 'create'
  form.value = { name: '', email: '', role: 'translator' }
  createdTempPassword.value = ''
}

// ── Create mode: new user form ─────────────────────────────────────────────────
const form = ref({ name: '', email: '', role: 'translator' })

// ── Shared ─────────────────────────────────────────────────────────────────────
const roleOptions = computed(() => [
  { label: t('users.role_translator', 'Translator'), value: 'translator' },
  { label: t('users.role_moderator', 'Moderator'), value: 'moderator' },
  { label: t('users.role_admin', 'Admin'), value: 'admin' },
])

const { users, pending, saving, createUser, rolesSaving, updateRoles, toggleActive, deleting, deleteUser: doDeleteUser } = useUsers('project')

function roleLabel(role: string) {
  return { translator: t('users.role_translator', 'Translator'), moderator: t('users.role_moderator', 'Moderator'), admin: t('users.role_admin', 'Admin') }[role] || role
}

function roleColor(role: string) {
  return { translator: 'primary', moderator: 'warning', admin: 'success' }[role] || 'neutral'
}

function formatRelative(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return t('common.just_now', 'just now')
  if (min < 60) return `${t('common.ago', 'ago')} ${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${t('common.ago', 'ago')} ${h}h`
  return `${t('common.ago', 'ago')} ${Math.floor(h / 24)}d`
}

function userActions(user: any) {
  const isSelf = user.id === currentUser.value?.id
  return [
    [
      ...(!isSelf ? [{
        label: t('users.edit_role', 'Edit role'),
        icon: 'i-heroicons-shield-check',
        onSelect: () => openRoleModal(user),
      }] : []),
      {
        label: user.is_active ? t('users.deactivate', 'Deactivate') : t('users.reactivate', 'Reactivate'),
        icon: user.is_active ? 'i-heroicons-pause' : 'i-heroicons-play',
        onSelect: () => toggleActive(user),
      },
    ],
    [
      {
        label: t('users.remove_from_project_action', 'Remove from project'),
        icon: 'i-heroicons-user-minus',
        color: 'error' as const,
        onSelect: () => { deletingUser.value = user; showDeleteConfirm.value = true },
      },
    ],
  ]
}

function openAdd() {
  addMode.value = 'select'
  search.value = ''
  selectedUser.value = null
  selectRole.value = 'translator'
  createdTempPassword.value = ''
  form.value = { name: '', email: '', role: 'translator' }
  showModal.value = true
  loadAvailableUsers()
}

function openRoleModal(user: any) {
  roleModalUser.value = user
  roleModalValue.value = user.role || 'translator'
  showRoleModal.value = true
}

function closeModal() {
  showModal.value = false
  createdTempPassword.value = ''
  selectedUser.value = null
}

async function addExistingUser() {
  if (!selectedUser.value || !currentProject.value) return
  const ok = await updateRoles(selectedUser.value.id, [
    { project_id: currentProject.value.id, role: selectRole.value },
  ])
  if (ok) closeModal()
}

async function saveUser() {
  if (!form.value.name || !form.value.email || !currentProject.value) return
  const tempPassword = await createUser({
    ...form.value,
    project_id: currentProject.value.id,
    project_ids: [currentProject.value.id],
    global_access: false,
  })
  if (tempPassword) createdTempPassword.value = tempPassword
}

async function saveRole() {
  if (!roleModalUser.value || !currentProject.value) return
  const ok = await updateRoles(roleModalUser.value.id, [
    { project_id: currentProject.value.id, role: roleModalValue.value },
  ])
  if (ok) showRoleModal.value = false
}

async function deleteUser() {
  if (!deletingUser.value) return
  const ok = await doDeleteUser(deletingUser.value.id)
  if (ok) showDeleteConfirm.value = false
}

async function copyTemp() {
  await navigator.clipboard.writeText(createdTempPassword.value)
  toast.add({ title: t('common.copied', 'Copied!'), color: 'success' })
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

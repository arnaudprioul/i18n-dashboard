<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('users.title', 'Users') }}</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
          {{ t('users.project_members', 'Members of project') }} <strong>{{ currentProject?.name }}</strong>
        </p>
      </div>
      <UButton icon="i-heroicons-plus" @click="openAdd">{{ t('users.add', 'Add a user') }}</UButton>
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
    <UModal v-model:open="showModal" :title="t('users.add_user_title', 'Add a user')">
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormField :label="t('users.full_name', 'Full name')" required>
              <UInput v-model="form.name" placeholder="Marie Dupont" class="w-full" />
            </UFormField>
            <UFormField :label="t('login.email', 'Email')" required>
              <UInput v-model="form.email" type="email" placeholder="marie@example.com" class="w-full" />
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
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="closeModal">
            {{ createdTempPassword ? t('common.close', 'Close') : t('common.cancel', 'Cancel') }}
          </UButton>
          <UButton v-if="!createdTempPassword" :loading="saving" @click="saveUser">{{ t('common.create', 'Create') }}</UButton>
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
const toast = useToast()
const { currentUser } = useAuth()
const { currentProject } = useProject()
const { t } = useT()

// Guard: requires project context
watch(currentProject, (p) => { if (!p) navigateTo('/projects') }, { immediate: true })

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const showRoleModal = ref(false)
const deletingUser = ref<any>(null)
const createdTempPassword = ref('')
const roleModalUser = ref<any>(null)
const roleModalValue = ref('translator')

const form = ref({ name: '', email: '', role: 'translator' })

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
  createdTempPassword.value = ''
  form.value = { name: '', email: '', role: 'translator' }
  showModal.value = true
}

function openRoleModal(user: any) {
  roleModalUser.value = user
  roleModalValue.value = user.role || 'translator'
  showRoleModal.value = true
}

function closeModal() {
  showModal.value = false
  createdTempPassword.value = ''
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

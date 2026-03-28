<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1
          data-cy="all-users-title"
          class="text-2xl font-bold text-gray-900 dark:text-white"
        >
          {{ t('users.all_title', 'All users') }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
          {{ t('users.subtitle', 'Manage dashboard access') }}
        </p>
      </div>
      <u-button
        data-cy="global-users-add-btn"
        icon="i-heroicons-plus"
        @click="openAdd"
      >
        {{ t('users.add', 'Add a user') }}
      </u-button>
    </div>

    <!-- Users table -->
    <u-card>
      <div
        v-if="pending"
        class="space-y-3"
      >
        <u-skeleton
          v-for="i in 4"
          :key="i"
          class="h-12"
        />
      </div>
      <div
        v-else-if="!users.length"
        class="text-center py-12"
      >
        <u-icon
          name="i-heroicons-users"
          class="text-4xl text-gray-300 mb-2"
        />
        <p class="text-gray-400">
          {{ t('users.none', 'No users') }}
        </p>
      </div>
      <div
        v-else
        class="divide-y divide-gray-100 dark:divide-gray-800"
      >
        <div
          v-for="user in users"
          :key="user.id"
          :data-cy="'user-row-' + user.id"
          class="flex items-center justify-between py-3 gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg px-2 -mx-2 transition-colors"
          @click="router.push(`/users/${user.id}/profile`)"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
              <span class="text-sm font-bold text-primary-600 dark:text-primary-400">
                {{ user.name.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p
                  :data-cy="'user-name-' + user.id"
                  class="font-medium text-gray-900 dark:text-white text-sm truncate"
                >
                  {{ user.name }}
                </p>
                <u-badge
                  v-if="user.is_super_admin"
                  size="xs"
                  color="error"
                >
                  Super Admin
                </u-badge>
                <u-badge
                  v-if="!user.is_active"
                  size="xs"
                  color="neutral"
                  variant="outline"
                >
                  {{ t('users.inactive', 'Inactive') }}
                </u-badge>
              </div>
              <p
                :data-cy="'user-email-' + user.id"
                class="text-xs text-gray-400 truncate"
              >
                {{ user.email }}
              </p>
            </div>
          </div>

          <!-- Roles summary -->
          <div class="flex flex-wrap gap-1 flex-1 justify-center">
            <template v-if="user.roles?.length">
              <u-badge
                v-for="r in user.roles.slice(0, 3)"
                :key="`${r.project_id}-${r.role}`"
                size="xs"
                :color="roleColor(r.role)"
                variant="soft"
              >
                {{ r.project_id === null ? t('users.global_access', 'Global') : r.project_name }} · {{ roleLabel(r.role) }}
              </u-badge>
              <u-badge
                v-if="user.roles.length > 3"
                size="xs"
                color="neutral"
                variant="soft"
              >
                +{{ user.roles.length - 3 }}
              </u-badge>
            </template>
            <span
              v-else
              class="text-xs text-gray-400 italic"
            >{{ t('users.no_role', 'No role') }}</span>
          </div>

          <div
            class="flex items-center gap-2 shrink-0"
            @click.stop
          >
            <span class="text-xs text-gray-400">
              {{ user.last_login_at ? formatRelative(user.last_login_at) : t('users.never_connected', 'Never logged in') }}
            </span>
            <u-dropdown-menu :items="userActions(user)">
              <u-button
                icon="i-heroicons-ellipsis-vertical"
                color="neutral"
                variant="ghost"
                size="xs"
              />
            </u-dropdown-menu>
          </div>
        </div>
      </div>
    </u-card>

    <!-- Add user modal -->
    <u-modal
      v-model:open="showModal"
      data-cy="global-add-user-modal"
      :title="t('users.add_user_title', 'Add a user')"
    >
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <u-form-field
              :label="t('users.full_name', 'Full name')"
              required
            >
              <u-input
                v-model="form.name"
                placeholder="Marie Dupont"
                class="w-full"
              />
            </u-form-field>
            <u-form-field
              :label="t('login.email', 'Email')"
              required
            >
              <u-input
                v-model="form.email"
                type="email"
                placeholder="marie@example.com"
                class="w-full"
              />
            </u-form-field>
          </div>

          <u-form-field
            :label="t('users.role_label', 'Role')"
            required
          >
            <u-select
              v-model="form.role"
              :items="roleOptions"
              class="w-full"
            />
          </u-form-field>

          <u-form-field :label="t('users.project_access_label', 'Project access')">
            <div class="space-y-2">
              <UCheckbox
                v-model="form.global_access"
                :label="t('users.global_access_label', 'Global access (all projects)')"
              />
              <div
                v-if="!form.global_access"
                class="space-y-1 pl-1"
              >
                <UCheckbox
                  v-for="p in projects"
                  :key="p.id"
                  :label="p.name"
                  :model-value="form.project_ids.includes(p.id)"
                  @update:model-value="toggleProject(p.id, $event)"
                />
              </div>
            </div>
          </u-form-field>

          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p class="text-xs text-blue-600 dark:text-blue-400">
              <u-icon
                name="i-heroicons-information-circle"
                class="inline mr-1"
              />
              {{ t('users.temp_password_info', 'A temporary password will be generated and shown below.') }}
            </p>
          </div>

          <div
            v-if="createdTempPassword"
            class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3"
          >
            <p class="text-xs text-green-700 dark:text-green-300 font-medium mb-1">
              <u-icon
                name="i-heroicons-key"
                class="inline mr-1"
              />
              {{ t('users.temp_password_label', 'Temporary password (copy it now):') }}
            </p>
            <div class="flex items-center gap-2">
              <code class="text-sm font-mono text-green-800 dark:text-green-200 flex-1">{{ createdTempPassword }}</code>
              <u-button
                size="xs"
                icon="i-heroicons-clipboard"
                color="neutral"
                variant="ghost"
                @click="copyTemp"
              />
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <u-button
            data-cy="global-add-user-cancel-btn"
            color="neutral"
            variant="ghost"
            @click="closeModal"
          >
            {{ createdTempPassword ? t('common.close', 'Close') : t('common.cancel', 'Cancel') }}
          </u-button>
          <u-button
            v-if="!createdTempPassword"
            :loading="saving"
            @click="saveUser"
          >
            {{ t('common.create', 'Create') }}
          </u-button>
        </div>
      </template>
    </u-modal>

    <!-- Roles modal -->
    <u-modal
      v-model:open="showRolesModal"
      :title="t('users.manage_access_title', 'Manage access')"
    >
      <template #body>
        <div class="space-y-4">
          <div class="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
              <span class="font-bold text-primary-600 dark:text-primary-400">
                {{ rolesUser?.name.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white text-sm">
                {{ rolesUser?.name }}
              </p>
              <p class="text-xs text-gray-400">
                {{ rolesUser?.email }}
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="item in rolesForm"
              :key="item.project_id ?? 'global'"
              class="flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <u-icon
                  v-if="item.project_id === null"
                  name="i-heroicons-globe-alt"
                  class="text-gray-400 shrink-0"
                />
                <span
                  v-else
                  class="w-2 h-2 rounded-full shrink-0"
                  :class="`bg-${item.project_color || 'primary'}-500`"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ item.project_name }}</span>
              </div>
              <u-select
                v-model="item.role"
                :items="accessOptions"
                class="w-44 shrink-0"
              />
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <u-button
            color="neutral"
            variant="ghost"
            @click="showRolesModal = false"
          >
            {{ t('common.cancel', 'Cancel') }}
          </u-button>
          <u-button
            :loading="rolesSaving"
            @click="saveRoles"
          >
            {{ t('common.save', 'Save') }}
          </u-button>
        </div>
      </template>
    </u-modal>

    <!-- Delete confirm -->
    <u-modal
      v-model:open="showDeleteConfirm"
      :title="t('users.delete_user_title', 'Delete user')"
    >
      <template #body>
        <p class="text-gray-600 dark:text-gray-400">
          {{ t('users.delete_confirm', 'Permanently delete') }} <strong>{{ deletingUser?.name }}</strong>?
          {{ t('users.delete_warning', 'All their data will be deleted.') }}
        </p>
        <p class="text-red-500 text-sm mt-2 font-medium">
          {{ t('common.irreversible', 'This action is irreversible.') }}
        </p>
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
            color="error"
            :loading="deleting"
            @click="deleteUser"
          >
            {{ t('common.delete', 'Delete') }}
          </u-button>
        </div>
      </template>
    </u-modal>
  </div>
</template>

<script setup lang="ts">
  const router = useRouter()
  const toast = useToast()
  const { currentUser } = useAuth()
  const { t } = useT()

  // Guard: super admin only (client-only to avoid SSR redirect before auth is loaded)
  watch(() => currentUser.value?.is_super_admin, (ok) => { if (import.meta.client && ok === false) navigateTo('/') }, { immediate: true })

  const showModal = ref(false)
  const showDeleteConfirm = ref(false)
  const showRolesModal = ref(false)
  const deletingUser = ref<any>(null)
  const createdTempPassword = ref('')

  const rolesUser = ref<any>(null)
  const rolesForm = ref<Array<{
    project_id: number | null
    project_name: string
    project_color: string | null
    role: string
  }>>([])

  const form = ref({ name: '', email: '', role: 'translator', project_ids: [] as number[], global_access: false })

  const roleOptions = computed(() => [
    { label: t('users.role_translator', 'Translator'), value: 'translator' },
    { label: t('users.role_moderator', 'Moderator'), value: 'moderator' },
    { label: t('users.role_admin', 'Admin'), value: 'admin' },
  ])

  const accessOptions = computed(() => [
    { label: t('users.no_access', 'No access'), value: 'none' },
    { label: t('users.role_translator', 'Translator'), value: 'translator' },
    { label: t('users.role_moderator', 'Moderator'), value: 'moderator' },
    { label: t('users.role_admin', 'Admin'), value: 'admin' },
  ])

  const { projects } = useProject()
  const { users, pending, saving, createUser, rolesSaving, updateRoles, toggleActive, deleting, deleteUser: doDeleteUser } = useUsers('global')

  const roleLabel = (role: string) => {
    return { translator: t('users.role_translator', 'Translator'), moderator: t('users.role_moderator', 'Moderator'), admin: t('users.role_admin', 'Admin') }[role] || role
  }

  const roleColor = (role: string) => {
    return { translator: 'primary', moderator: 'warning', admin: 'success' }[role] || 'neutral'
  }

  const formatRelative = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return t('common.just_now', 'just now')
    if (min < 60) return `${t('common.ago', 'ago')} ${min}min`
    const h = Math.floor(min / 60)
    if (h < 24) return `${t('common.ago', 'ago')} ${h}h`
    return `${t('common.ago', 'ago')} ${Math.floor(h / 24)}d`
  }

  const toggleProject = (id: number, checked: boolean) => {
    if (checked) form.value.project_ids = [...form.value.project_ids, id]
    else form.value.project_ids = form.value.project_ids.filter((p) => p !== id)
  }

  const userActions = (user: any) => {
    const isSelf = user.id === currentUser.value?.id
    const canEdit = !user.is_super_admin && !isSelf

    return [
      [
        ...(canEdit ? [{
          label: t('users.manage_access', 'Manage access'),
          icon: 'i-heroicons-shield-check',
          onSelect: () => openRoles(user),
        }] : []),
        {
          label: user.is_active ? t('users.deactivate', 'Deactivate') : t('users.reactivate', 'Reactivate'),
          icon: user.is_active ? 'i-heroicons-pause' : 'i-heroicons-play',
          onSelect: () => toggleActive(user),
        },
      ],
      [
        {
          label: t('common.delete', 'Delete'),
          icon: 'i-heroicons-trash',
          color: 'error' as const,
          onSelect: () => { deletingUser.value = user; showDeleteConfirm.value = true },
        },
      ],
    ]
  }

  const openAdd = () => {
    createdTempPassword.value = ''
    form.value = { name: '', email: '', role: 'translator', project_ids: [], global_access: false }
    showModal.value = true
  }

  const openRoles = (user: any) => {
    rolesUser.value = user
    const globalRole = user.roles?.find((r: any) => r.project_id === null)
    rolesForm.value = [
      {
        project_id: null,
        project_name: t('users.global_access_all', 'Global access (all projects)'),
        project_color: null,
        role: globalRole?.role ?? 'none',
      },
      ...projects.value.map((p: any) => {
        const existing = user.roles?.find((r: any) => r.project_id === p.id)
        return {
          project_id: p.id,
          project_name: p.name,
          project_color: p.color ?? null,
          role: existing?.role ?? 'none',
        }
      }),
    ]
    showRolesModal.value = true
  }

  const closeModal = () => {
    showModal.value = false
    createdTempPassword.value = ''
  }

  const saveUser = async () => {
    if (!form.value.name || !form.value.email) return
    const tempPassword = await createUser({ ...form.value })
    if (tempPassword) createdTempPassword.value = tempPassword
  }

  const saveRoles = async () => {
    const roles = rolesForm.value.map(({ project_id, role }) => ({
      project_id,
      role: role === 'none' ? null : role,
    }))
    const ok = await updateRoles(rolesUser.value.id, roles)
    if (ok) showRolesModal.value = false
  }

  const deleteUser = async () => {
    if (!deletingUser.value) return
    const ok = await doDeleteUser(deletingUser.value.id)
    if (ok) showDeleteConfirm.value = false
  }

  const copyTemp = async () => {
    await navigator.clipboard.writeText(createdTempPassword.value)
    toast.add({ title: t('common.copied', 'Copied!'), color: 'success' })
  }
</script>

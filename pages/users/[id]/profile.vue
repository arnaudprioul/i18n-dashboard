<template>
  <div class="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <USkeleton class="h-24" />
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <USkeleton class="h-4 w-16" />
          <USkeleton class="h-8 w-52" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <USkeleton v-for="i in 2" :key="i" class="h-20" />
        </div>
      </div>
    </div>

    <template v-else-if="profile">
      <!-- Header -->
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
          <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {{ profile.user.name?.charAt(0)?.toUpperCase() }}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ profile.user.name }}</h1>
            <UBadge v-if="profile.user.is_super_admin" color="warning" variant="soft">
              <UIcon name="i-heroicons-star" class="mr-1" />
              Super Admin
            </UBadge>
          </div>
          <p class="text-sm text-gray-400 mt-0.5">{{ profile.user.email }}</p>
          <div class="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
            <span class="flex items-center gap-1">
              <UIcon name="i-heroicons-calendar" />
              {{ t('profile.member_since', 'Member since') }} {{ formatDate(profile.user.created_at) }}
            </span>
            <span v-if="profile.user.last_login_at" class="flex items-center gap-1">
              <UIcon name="i-heroicons-clock" />
              {{ t('profile.last_login', 'Last login') }} {{ formatDate(profile.user.last_login_at) }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <!-- Edit own account -->
          <UButton v-if="isSelf" color="neutral" variant="outline" icon="i-heroicons-pencil" @click="openEdit">
            {{ t('profile.edit_account', 'Edit my account') }}
          </UButton>
          <!-- Manage roles (authorized viewers only) -->
          <UButton v-if="canManageRoles" color="neutral" variant="outline" icon="i-heroicons-shield-check" @click="openRoles">
            {{ t('users.manage_access', 'Manage access') }}
          </UButton>
        </div>
      </div>

      <!-- Stats -->
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-4">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">{{ t('profile.stats_title', 'Activity') }}</p>
          <USelect
            v-model="period"
            :items="periodOptions"
            class="w-52"
            value-key="value"
            label-key="label"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <UCard v-for="stat in statCards" :key="stat.label">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg" :class="stat.bg">
                <UIcon :name="stat.icon" class="text-xl" :class="stat.color" />
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        <!-- Left column -->
        <div class="space-y-4">

          <!-- Roles & Projects -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-briefcase" class="text-gray-400" />
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">{{ t('profile.projects_roles', 'Projects & Roles') }}</p>
              </div>
            </template>
            <div v-if="!profile.roles.length" class="text-sm text-gray-400 italic">{{ t('profile.no_roles', 'No role assigned') }}</div>
            <div v-else class="space-y-2">
              <div
                v-for="role in profile.roles"
                :key="`${role.project_id}-${role.role}`"
                class="flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    v-if="role.project_id"
                    class="w-2 h-2 rounded-full shrink-0"
                    :class="`bg-${role.project_color || 'primary'}-500`"
                  />
                  <UIcon v-else name="i-heroicons-globe-alt" class="text-gray-400 text-xs shrink-0" />
                  <span class="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {{ role.project_name ?? t('users.all_projects', 'All projects') }}
                  </span>
                </div>
                <UBadge :color="roleColor(role.role)" variant="soft" size="xs" class="shrink-0">
                  {{ roleLabel(role.role) }}
                </UBadge>
              </div>
            </div>
          </UCard>

          <!-- Languages -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-language" class="text-gray-400" />
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">{{ t('nav.languages', 'Languages') }}</p>
              </div>
            </template>
            <div v-if="!profile.languages.length" class="text-sm text-gray-400 italic">{{ t('profile.no_languages', 'No language available') }}</div>
            <div v-else>
              <div v-for="(langs, projectName) in languagesByProject" :key="projectName" class="mb-3 last:mb-0">
                <p class="text-xs text-gray-400 mb-1.5 font-medium">{{ projectName }}</p>
                <div class="flex flex-wrap gap-1.5">
                  <UBadge
                    v-for="lang in langs"
                    :key="lang.code"
                    color="neutral"
                    variant="soft"
                    size="xs"
                    class="font-mono"
                  >
                    {{ nativeName(lang.code) || lang.name }}
                    <span class="ml-1 opacity-50">{{ lang.code }}</span>
                  </UBadge>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Right column: Activity -->
        <div class="lg:col-span-2">
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-clock" class="text-gray-400" />
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">{{ t('dashboard.recent_activity', 'Recent activity') }}</p>
              </div>
            </template>

            <div v-if="!profile.recentTranslations.length" class="text-center py-10">
              <UIcon name="i-heroicons-pencil-square" class="text-4xl text-gray-300 dark:text-gray-600 mb-2" />
              <p class="text-sm text-gray-400">{{ t('profile.no_translations', 'No translations yet') }}</p>
            </div>

            <div v-else class="space-y-1">
              <NuxtLink
                v-for="tr in profile.recentTranslations"
                :key="tr.id"
                :to="tr.project_id ? `/projects/${tr.project_id}/translations/${tr.key_id}` : `/projects`"
                class="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group"
              >
                <span class="font-mono text-xs font-bold bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 uppercase shrink-0 mt-0.5">
                  {{ tr.language_code }}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-mono font-medium text-gray-700 dark:text-gray-300 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {{ tr.key }}
                    </span>
                    <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="`bg-${tr.project_color || 'primary'}-500`" />
                    <span class="text-xs text-gray-400 shrink-0">{{ tr.project_name }}</span>
                  </div>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span v-if="tr.old_value" class="text-xs text-red-400 line-through truncate max-w-[120px]">{{ tr.old_value }}</span>
                    <UIcon v-if="tr.old_value" name="i-heroicons-arrow-right" class="text-gray-300 text-xs shrink-0" />
                    <span class="text-xs text-gray-600 dark:text-gray-400 truncate max-w-xs">{{ tr.new_value }}</span>
                  </div>
                </div>
                <span class="text-xs text-gray-400 shrink-0 mt-0.5">{{ timeAgo(tr.changed_at) }}</span>
              </NuxtLink>
            </div>
          </UCard>
        </div>
      </div>
    </template>

    <!-- Error state -->
    <div v-else class="text-center py-20">
      <UIcon name="i-heroicons-exclamation-circle" class="text-5xl text-gray-300 mb-3" />
      <p class="text-gray-400">{{ t('profile.not_found', 'Profile not found or access denied.') }}</p>
      <UButton to="/users" class="mt-4" variant="outline" color="neutral">{{ t('profile.back', 'Back') }}</UButton>
    </div>

    <!-- Edit account modal (self only) -->
    <UModal v-model:open="showEdit" :title="t('profile.edit_modal_title', 'Edit my account')">
      <template #body>
        <div class="space-y-4">
          <UFormField :label="t('profile.name_label', 'Name')" required>
            <UInput v-model="editForm.name" :placeholder="t('profile.name_placeholder', 'Your name')" class="w-full" />
          </UFormField>
          <UFormField :label="t('login.email', 'Email')" required>
            <UInput v-model="editForm.email" type="email" placeholder="you@example.com" class="w-full" />
          </UFormField>
          <p v-if="editError" class="text-sm text-red-500">{{ editError }}</p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="showEdit = false">{{ t('common.cancel', 'Cancel') }}</UButton>
          <UButton :loading="editSaving" @click="saveEdit">{{ t('common.save', 'Save') }}</UButton>
        </div>
      </template>
    </UModal>

    <!-- Roles modal (authorized viewers) -->
    <UModal v-model:open="showRolesModal" :title="t('users.manage_access_title', 'Manage access')">
      <template #body>
        <div class="space-y-4">
          <div class="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
              <span class="font-bold text-primary-600 dark:text-primary-400">
                {{ profile?.user.name?.charAt(0)?.toUpperCase() }}
              </span>
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white text-sm">{{ profile?.user.name }}</p>
              <p class="text-xs text-gray-400">{{ profile?.user.email }}</p>
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="item in rolesForm"
              :key="item.project_id ?? 'global'"
              class="flex items-center justify-between gap-3"
            >
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <UIcon v-if="item.project_id === null" name="i-heroicons-globe-alt" class="text-gray-400 shrink-0" />
                <span v-else class="w-2 h-2 rounded-full shrink-0" :class="`bg-${item.project_color || 'primary'}-500`" />
                <span class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ item.project_name }}</span>
              </div>
              <USelect v-model="item.role" :items="accessOptions(item.project_id)" class="w-44 shrink-0" />
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" @click="showRolesModal = false">{{ t('common.cancel', 'Cancel') }}</UButton>
          <UButton :loading="rolesSaving" @click="doSaveRoles">{{ t('common.save', 'Save') }}</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script lang="ts" setup>
const route = useRoute()
const { findLanguage } = useLanguages()
const { currentUser, canManageUsers, getRoleForProject } = useAuth()
const { projects } = useProject()
const { t } = useT()

const userId = computed(() => Number(route.params.id))
const { profile, period, pending, refresh, editSaving: selfEditSaving, editError, updateProfile, rolesSaving, saveRoles } = useProfile(userId)

const isSelf = computed(() => currentUser.value?.id === userId.value)

// Viewer can manage roles if super admin OR admin in at least one project the target belongs to
const canManageRoles = computed(() => {
  if (!currentUser.value || !profile.value) return false
  if (currentUser.value.is_super_admin) return true
  const targetProjectIds = new Set(
    profile.value.roles.filter(r => r.project_id !== null).map(r => r.project_id),
  )
  return [...targetProjectIds].some(pid => getRoleForProject(pid as number) === 'admin')
})

// ── Edit own account ───────────────────────────────────────────────────────────
const showEdit = ref(false)
const editForm = ref({ name: '', email: '' })
const editSaving = selfEditSaving

function openEdit() {
  editForm.value.name = profile.value?.user.name ?? ''
  editForm.value.email = profile.value?.user.email ?? ''
  showEdit.value = true
}

async function saveEdit() {
  if (!editForm.value.name.trim() || !editForm.value.email.trim()) {
    editError.value = t('profile.name_email_required', 'Name and email are required.')
    return
  }
  const ok = await updateProfile(editForm.value.name, editForm.value.email)
  if (ok) {
    showEdit.value = false
    await refresh()
  }
}

// ── Roles management ──────────────────────────────────────────────────────────
const showRolesModal = ref(false)
const rolesForm = ref<Array<{
  project_id: number | null
  project_name: string
  project_color: string | null
  role: string
}>>([])

function accessOptions(projectId: number | null) {
  const base = [
    { label: t('users.no_access', 'No access'), value: 'none' },
    { label: t('users.role_translator', 'Translator'), value: 'translator' },
    { label: t('users.role_moderator', 'Moderator'), value: 'moderator' },
    { label: t('users.role_admin', 'Admin'), value: 'admin' },
  ]
  // Non-super-admin can only set roles on projects where they are admin
  if (!currentUser.value?.is_super_admin && projectId !== null) {
    const myRole = getRoleForProject(projectId)
    if (myRole !== 'admin') return base.map(o => ({ ...o, disabled: true }))
  }
  return base
}

function openRoles() {
  const targetRoles = profile.value?.roles ?? []

  // Super admin sees all projects + global; others see only their admin projects
  const visibleProjects = currentUser.value?.is_super_admin
    ? projects.value
    : projects.value.filter(p => getRoleForProject(p.id) === 'admin')

  rolesForm.value = [
    // Global access row (super admin only)
    ...(currentUser.value?.is_super_admin ? [{
      project_id: null,
      project_name: t('users.global_access_all', 'Global access (all projects)'),
      project_color: null,
      role: targetRoles.find(r => r.project_id === null)?.role ?? 'none',
    }] : []),
    ...visibleProjects.map((p: any) => ({
      project_id: p.id,
      project_name: p.name,
      project_color: p.color ?? null,
      role: targetRoles.find(r => r.project_id === p.id)?.role ?? 'none',
    })),
  ]
  showRolesModal.value = true
}

async function doSaveRoles() {
  const roles = rolesForm.value.map(({ project_id, role }) => ({
    project_id,
    role: role === 'none' ? null : role,
  }))
  const ok = await saveRoles(roles)
  if (ok) showRolesModal.value = false
}

// ── Stats ──────────────────────────────────────────────────────────────────────
const periodOptions = computed(() => [
  { label: t('profile.period_1d', 'Last 24 hours'), value: '1d' },
  { label: t('profile.period_7d', 'Last 7 days'), value: '7d' },
  { label: t('profile.period_30d', 'Last 30 days'), value: '30d' },
  { label: t('profile.period_365d', 'Last year'), value: '365d' },
  { label: t('profile.period_all', 'Since account creation'), value: 'all' },
])

const periodLabel = computed(() => periodOptions.value.find(o => o.value === period.value)?.label ?? '')

const statCards = computed(() => [
  {
    label: t('profile.total_translations', 'Total translations'),
    value: profile.value?.stats.total ?? 0,
    icon: 'i-heroicons-pencil-square',
    color: 'text-primary-600',
    bg: 'bg-primary-50 dark:bg-primary-900/20',
  },
  {
    label: periodLabel.value,
    value: profile.value?.stats.periodCount ?? 0,
    icon: 'i-heroicons-calendar-days',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
])

// ── Languages grouped by project ───────────────────────────────────────────────
const languagesByProject = computed(() => {
  const groups: Record<string, any[]> = {}
  for (const lang of profile.value?.languages ?? []) {
    const key = lang.project_name ?? t('profile.general', 'General')
    if (!groups[key]) groups[key] = []
    groups[key].push(lang)
  }
  return groups
})

function nativeName(code: string) {
  return findLanguage(code)?.nativeName
}

// ── Role helpers ───────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = { admin: 'error', moderator: 'warning', translator: 'info' }
function roleLabel(role: string) {
  return { admin: t('users.role_admin', 'Admin'), moderator: t('users.role_moderator', 'Moderator'), translator: t('users.role_translator', 'Translator') }[role] ?? role
}
function roleColor(role: string) { return ROLE_COLORS[role] ?? 'neutral' }

// ── Date helpers ───────────────────────────────────────────────────────────────
function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(date))
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t('common.just_now', 'just now')
  if (mins < 60) return `${t('common.ago', 'ago')} ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${t('common.ago', 'ago')} ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${t('common.ago', 'ago')} ${days}d`
  return formatDate(date)
}
</script>

<template>
  <!-- Global loading overlay -->
  <Transition name="fade">
    <div
      v-if="!appReady || pending"
      class="fixed inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-gray-950/60 backdrop-blur-sm"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="text-4xl text-primary-500 animate-spin"
      />
    </div>
  </Transition>

  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
    <!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
    <aside
      data-cy="main-sidebar"
      class="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0"
    >
      <!-- Logo -->
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <NuxtLink
          to="/"
          class="flex items-center gap-2.5"
        >
          <div class="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              v-if="logoUrl"
              :src="logoUrl"
              :alt="appName"
              class="w-full h-full object-cover"
            >
            <UIcon
              v-else
              name="i-heroicons-language"
              class="text-white text-base"
            />
          </div>
          <div>
            <h1 class="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              {{ appName }}
            </h1>
            <p class="text-xs text-gray-400">
              {{ appSubtitle }}
            </p>
          </div>
        </NuxtLink>
      </div>

      <!-- ── Project context sidebar ──────────────────────────────────────── -->
      <template v-if="inProjectContext">
        <!-- Back + Project name -->
        <div class="p-2 border-b border-gray-200 dark:border-gray-800">
          <NuxtLink
            to="/projects"
            class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-1"
          >
            <UIcon
              name="i-heroicons-arrow-left"
              class="text-sm"
            />
            {{ t('nav.all_projects', 'All projects') }}
          </NuxtLink>
          <div
            v-if="currentProject"
            class="flex items-center gap-2 px-2 py-1.5"
          >
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :class="`bg-${currentProject.color || 'primary'}-500`"
            />
            <span class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ currentProject.name }}</span>
          </div>
        </div>

        <!-- Scan / Sync actions -->
        <div
          v-if="currentProject && userCanManage && !currentProject.is_system"
          class="p-2 border-b border-gray-200 dark:border-gray-800 space-y-1"
        >
          <UButton
            block
            variant="soft"
            color="neutral"
            size="sm"
            icon="i-heroicons-magnifying-glass"
            @click="showScanModal = true"
          >
            {{ t('sidebar.scan', 'Scan project') }}
          </UButton>
          <UTooltip
            :text="t('sidebar.sync_disabled_hint', 'Requiert un chemin local ou une URL distante')"
            :disabled="canSyncProject(currentProject)"
          >
            <UButton
              block
              variant="soft"
              color="neutral"
              size="sm"
              icon="i-heroicons-arrow-path"
              :loading="syncing !== null"
              :disabled="!canSyncProject(currentProject)"
              @click="doSync"
            >
              {{ t('sidebar.sync', 'Sync JSON') }}
            </UButton>
          </UTooltip>
        </div>

        <!-- Project navigation -->
        <nav class="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <NuxtLink
            v-for="item in projectNavigation"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            :class="isActive(item.to)
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
          >
            <UIcon
              :name="item.icon"
              class="text-base shrink-0"
            />
            <span class="flex-1">{{ item.label }}</span>
            <UBadge
              v-if="item.badge"
              size="xs"
              :color="item.badgeColor || 'neutral'"
            >
              {{ item.badge }}
            </UBadge>
          </NuxtLink>
        </nav>
      </template>

      <!-- ── Global sidebar ───────────────────────────────────────────────── -->
      <template v-else>
        <div class="p-2 border-b border-gray-200 dark:border-gray-800">
          <p class="text-xs text-gray-400 font-medium px-2 mb-1.5 uppercase tracking-wide">
            {{ t('sidebar.project_label', 'Projects') }}
          </p>

          <div
            v-if="!userProjects.length"
            class="px-2 py-2"
          >
            <p class="text-xs text-gray-400 italic mb-2">
              {{ t('sidebar.no_project', 'No project configured') }}
            </p>
            <UButton
              size="xs"
              block
              icon="i-heroicons-plus"
              to="/projects"
            >
              {{ t('sidebar.add_project', 'Add a project') }}
            </UButton>
          </div>

          <div
            v-else
            class="space-y-0.5"
          >
            <NuxtLink
              v-for="project in userProjects"
              :key="project.id"
              :data-cy="'sidebar-project-' + project.id"
              :to="`/projects/${project.id}`"
              class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left"
              :class="'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            >
              <span
                class="w-2.5 h-2.5 rounded-full shrink-0"
                :class="`bg-${project.color || 'primary'}-500`"
              />
              <span class="flex-1 truncate font-medium">{{ project.name }}</span>
              <UIcon
                v-if="project.is_system"
                name="i-heroicons-lock-closed"
                class="text-xs text-gray-400 shrink-0"
              />
            </NuxtLink>

            <NuxtLink
              to="/projects"
              class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <UIcon
                name="i-heroicons-rectangle-stack"
                class="text-sm"
              />
              {{ t('sidebar.manage_projects', 'Manage projects') }}
            </NuxtLink>
          </div>
        </div>

        <div class="flex-1" />
      </template>

      <!-- Admin section (super admin only) -->
      <div
        v-if="isSuperAdmin"
        class="p-2 border-t border-gray-200 dark:border-gray-800"
      >
        <p class="text-xs text-gray-400 font-medium px-2 mb-1.5 uppercase tracking-wide">
          {{ t('nav.administration', 'Administration') }}
        </p>
        <NuxtLink
          data-cy="sidebar-all-users-link"
          to="/users"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="isActive('/users')
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <UIcon
            name="i-heroicons-user-group"
            class="text-base shrink-0"
          />
          <span class="flex-1">{{ t('users.all_title', 'All users') }}</span>
        </NuxtLink>
        <NuxtLink
          to="/admin/security"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="isActive('/admin/security')
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <UIcon
            name="i-heroicons-shield-check"
            class="text-base shrink-0"
          />
          <span class="flex-1">{{ t('security.nav_label', 'Security') }}</span>
        </NuxtLink>
        <NuxtLink
          to="/admin/customization"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="isActive('/admin/customization')
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <UIcon
            name="i-heroicons-paint-brush"
            class="text-base shrink-0"
          />
          <span class="flex-1">{{ t('customization.nav_label', 'Customization') }}</span>
        </NuxtLink>
        <NuxtLink
          to="/admin/smtp"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="isActive('/admin/smtp')
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <UIcon
            name="i-heroicons-envelope"
            class="text-base shrink-0"
          />
          <span class="flex-1">{{ t('smtp.nav_label', 'SMTP') }}</span>
        </NuxtLink>
        <NuxtLink
          to="/admin/logs"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          :class="isActive('/admin/logs')
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >
          <UIcon
            name="i-heroicons-document-text"
            class="text-base shrink-0"
          />
          <span class="flex-1">{{ t('logs.nav_label', 'System logs') }}</span>
        </NuxtLink>
      </div>
    </aside>

    <!-- ── Right column ────────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
      <header class="h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2 px-4 shrink-0">
        <!-- UI Language -->
        <USelect
          v-if="uiLangsOptions.length > 1"
          :model-value="uiLang"
          :items="uiLangsOptions"
          size="xs"
          class="w-36"
          @update:model-value="setLang"
        />

        <!-- Theme toggle -->
        <UButton
          :icon="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="toggleDark"
        />

        <UDivider
          orientation="vertical"
          class="h-5"
        />

        <!-- User menu -->
        <UDropdownMenu :items="userMenuItems">
          <button class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div class="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
              <span class="text-xs font-bold text-primary-600 dark:text-primary-400">
                {{ currentUser?.name?.charAt(0)?.toUpperCase() || '?' }}
              </span>
            </div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-32 truncate">{{ currentUser?.name }}</span>
            <UIcon
              name="i-heroicons-chevron-down"
              class="text-xs text-gray-400"
            />
          </button>
        </UDropdownMenu>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-auto min-w-0">
        <slot />
      </main>
    </div>
  </div>

  <!-- Scan modal -->
  <ScanModal
    v-if="currentProject"
    v-model:open="showScanModal"
    :project-id="currentProject.id"
    :project="currentProject"
    @done="() => { fetchProjects(); refreshStats() }"
  />

  <!-- Change password modal -->
  <UModal
    v-model:open="showPasswordModal"
    :title="t('user.change_password_title', 'Change password')"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField
          :label="t('user.current_password', 'Current password')"
          required
        >
          <UInput
            v-model="passwordForm.current"
            type="password"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="t('user.new_password', 'New password')"
          :hint="t('user.password_hint', 'Minimum 8 characters')"
          required
        >
          <UInput
            v-model="passwordForm.next"
            type="password"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="t('user.confirm_password', 'Confirm')"
          required
        >
          <UInput
            v-model="passwordForm.confirm"
            type="password"
            class="w-full"
          />
        </UFormField>
        <p
          v-if="passwordError"
          class="text-sm text-red-500"
        >
          {{ passwordError }}
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          @click="showPasswordModal = false"
        >
          {{ t('translations.cancel', 'Cancel') }}
        </UButton>
        <UButton
          :loading="passwordSaving"
          @click="changePassword"
        >
          {{ t('user.save_password', 'Save') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { canSyncProject } from '../composables/useProject'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const colorMode = useColorMode()
const { branding } = useModuleConfig()
const appName = computed(() => branding.value?.name || 'i18n Dashboard')
const appSubtitle = computed(() => branding.value?.subtitle || 'vue-i18n manager')
const logoUrl = computed(() => branding.value?.logoUrl || null)
const { currentProject, projects: projectsData, systemProject, fetchProjects, visibleProjects: userProjects, syncing, syncProject, pending } = useProject()

const appReady = ref(false)
// No `immediate` — with server:false, pending starts false before client fetch begins.
// We only mark ready when pending transitions true→false (i.e. after first real load).
watch(pending, (val) => { if (!val) appReady.value = true })
const showScanModal = ref(false)
const { currentUser, fetchMe, logout, changePassword: changePasswordFn, canManageProject, canApprove } = useAuth()
const { t, lang: uiLang, setLang, getLangs } = useT()
const { findLanguage } = useLanguages()

const inProjectContext = computed(() => route.path.includes('projects') && !!route.params.id)

const uiLangs = ref<any[]>([])
watch(
  () => systemProject.value?.id,
  async (projectId) => {
    uiLangs.value = projectId ? await getLangs(projectId) as any[] : []
  },
  { immediate: true, flush: 'post' },
)

const uiLangsOptions = computed(() =>
  uiLangs.value.map((l: any) => {
    const meta = findLanguage(l.code)
    const label = meta ? meta.nativeName : l.name
    return { label, value: l.code }
  }),
)

const isDark = computed(() => colorMode.value === 'dark')
function toggleDark() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const userCanManage = computed(() => currentProject.value ? canManageProject(currentProject.value.id) : false)
const userCanApprove = computed(() => currentProject.value ? canApprove(currentProject.value.id) : false)
const isSuperAdmin = computed(() => currentUser.value?.is_super_admin ?? false)

onMounted(() => {
  fetchMe()
  // fetchProjects() is handled automatically by useAsyncData server:false auto-fetch
})


function isActive(to: string) {
  const [toPath, toQuery] = to.split('?')
  const projectBase = `/projects/${route.params.id}`
  if (toPath === projectBase) return route.path === projectBase
  if (to === '/') return route.path === '/'
  if (!route.path.startsWith(toPath)) return false
  if (toQuery) {
    const params = new URLSearchParams(toQuery)
    return [...params.entries()].every(([k, v]) => route.query[k] === v)
  }
  return true
}

const { stats: statsData, refresh: refreshStats } = useStats()

const projectNavigation = computed(() => {
  const id = route.params.id
  if (!id) return []
  const s = statsData.value as any
  const translateCount = s?.totalKeys || 0
  const unusedCount = s?.unusedKeys || 0
  const reviewedCount = (s?.languages || []).reduce((sum: number, l: any) => sum + (l.draft || 0), 0)
  const languageCount = (s?.languages || []).length

  return [
    { to: `/projects/${id}`, label: t('nav.dashboard', 'Dashboard'), icon: 'i-heroicons-chart-bar-square' },
    { to: `/projects/${id}/translations`, label: t('nav.translations', 'Translations'), icon: 'i-heroicons-globe-alt', badge: translateCount || undefined, badgeColor: 'info' as const },
    { to: `/projects/${id}/translations?status=unused`, label: t('nav.unused', 'Unused'), icon: 'i-heroicons-exclamation-triangle', badge: unusedCount || undefined, badgeColor: 'warning' as const },
    { to: `/projects/${id}/languages`, label: t('nav.languages', 'Languages'), icon: 'i-heroicons-flag', badge: languageCount || undefined, badgeColor: 'info' as const },
    ...(userCanApprove.value ? [{ to: `/projects/${id}/review`, label: t('nav.review', 'Review'), icon: 'i-heroicons-clipboard-document-check', badge: reviewedCount || undefined, badgeColor: 'warning' as const }] : []),
    { to: `/projects/${id}/settings`, label: t('nav.settings', 'Settings'), icon: 'i-heroicons-cog-6-tooth' },
    ...(userCanManage.value || currentUser.value?.is_super_admin ? [{ to: `/projects/${id}/users`, label: t('nav.users', 'Users'), icon: 'i-heroicons-users' }] : []),
    ...(currentProject.value?.enable_number_formats ? [{ to: `/projects/${id}/formats/number`, label: t('nav.format_numbers', 'Number formats'), icon: 'i-heroicons-calculator' }] : []),
    ...(currentProject.value?.enable_datetime_formats ? [{ to: `/projects/${id}/formats/datetime`, label: t('nav.format_dates', 'Date formats'), icon: 'i-heroicons-calendar' }] : []),
    ...(currentProject.value?.enable_modifiers ? [{ to: `/projects/${id}/formats/modifiers`, label: t('nav.modifiers', 'Modifiers'), icon: 'i-heroicons-code-bracket' }] : []),
  ]
})

const userMenuItems = computed(() => [
  [{ label: t('user.profile', 'My profile'), icon: 'i-heroicons-user-circle', onSelect: () => router.push(`/users/${currentUser.value?.id}/profile`) }],
  [{ label: t('user.change_password', 'Change password'), icon: 'i-heroicons-key', onSelect: () => showPasswordModal.value = true }],
  [{ label: t('user.logout', 'Log out'), icon: 'i-heroicons-arrow-right-on-rectangle', color: 'error' as const, onSelect: handleLogout }],
])

const showPasswordModal = ref(false)
const passwordForm = ref({ current: '', next: '', confirm: '' })
const passwordError = ref('')
const passwordSaving = ref(false)

async function handleLogout() {
  await logout()
  router.push('/login')
}

async function changePassword() {
  passwordError.value = ''
  if (passwordForm.value.next.length < 8) { passwordError.value = t('user.password_hint', 'Minimum 8 characters'); return }
  if (passwordForm.value.next !== passwordForm.value.confirm) { passwordError.value = t('user.passwords_mismatch', 'Passwords do not match'); return }
  passwordSaving.value = true
  try {
    await changePasswordFn(passwordForm.value.current, passwordForm.value.next)
    toast.add({ title: t('user.password_changed', 'Password changed'), color: 'success' })
    showPasswordModal.value = false
    passwordForm.value = { current: '', next: '', confirm: '' }
  } catch (e: any) {
    passwordError.value = e.message || 'Error'
  } finally {
    passwordSaving.value = false
  }
}

async function doSync() {
  if (!currentProject.value) return
  await syncProject(currentProject.value)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

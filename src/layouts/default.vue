<template>
  <!-- Global loading overlay -->
  <Transition name="fade">
    <div
        v-if="!appReady || pending"
        class="fixed inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-gray-950/60 backdrop-blur-sm"
    >
      <u-icon
          class="text-4xl text-primary-500 animate-spin"
          name="i-heroicons-arrow-path"
      />
    </div>
  </Transition>

  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
    <!-- ── Sidebar ─────────────────────────────────────────────────────────── -->
    <aside
        class="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0"
        data-cy="main-sidebar"
    >
      <!-- Logo -->
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <nuxt-link
            class="flex items-center gap-2.5"
            to="/"
        >
          <div class="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shrink-0 overflow-hidden">
            <img
                v-if="logoUrl"
                :alt="appName"
                :src="logoUrl"
                class="w-full h-full object-cover"
            >
            <u-icon
                v-else
                class="text-white text-base"
                name="i-heroicons-language"
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
        </nuxt-link>
      </div>

      <!-- ── Project context sidebar ──────────────────────────────────────── -->
      <template v-if="inProjectContext">
        <!-- Back + Project name -->
        <div class="p-2 border-b border-gray-200 dark:border-gray-800">
          <nuxt-link
              class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-1"
              to="/projects"
          >
            <u-icon
                class="text-sm"
                name="i-heroicons-arrow-left"
            />
            {{ t('nav.all_projects', 'All projects') }}
          </nuxt-link>
          <div
              v-if="currentProject"
              class="flex items-center gap-2 px-2 py-1.5"
          >
            <span
                :class="`bg-${currentProject.color || 'primary'}-500`"
                class="w-2.5 h-2.5 rounded-full shrink-0"
            />
            <span class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ currentProject.name }}</span>
          </div>
        </div>

        <!-- Scan / Sync actions -->
        <div
            v-if="currentProject && userCanManage && !currentProject.is_system"
            class="p-2 border-b border-gray-200 dark:border-gray-800 space-y-1"
        >
          <u-button
              block
              color="neutral"
              icon="i-heroicons-magnifying-glass"
              size="sm"
              variant="soft"
              @click="showScanModal = true"
          >
            {{ t('sidebar.scan', 'Scan project') }}
          </u-button>
          <u-tooltip
              :disabled="canSyncProject(currentProject)"
              :text="t('sidebar.sync_disabled_hint', 'Requiert un chemin local ou une URL distante')"
          >
            <u-button
                :disabled="!canSyncProject(currentProject)"
                :loading="syncing !== null"
                block
                color="neutral"
                icon="i-heroicons-arrow-path"
                size="sm"
                variant="soft"
                @click="doSync"
            >
              {{ t('sidebar.sync', 'Sync JSON') }}
            </u-button>
          </u-tooltip>
        </div>

        <!-- Project navigation -->
        <nav class="flex-1 p-2 space-y-0.5 overflow-y-auto">
          <nuxt-link
              v-for="item in projectNavigation"
              :key="item.to"
              :class="isActive(item.to)
              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
              :to="item.to"
              class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
          >
            <u-icon
                :name="item.icon"
                class="text-base shrink-0"
            />
            <span class="flex-1">{{ item.label }}</span>
            <u-badge
                v-if="item.badge"
                :color="item.badgeColor || 'neutral'"
                size="xs"
            >
              {{ item.badge }}
            </u-badge>
          </nuxt-link>
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
            <u-button
                block
                icon="i-heroicons-plus"
                size="xs"
                to="/projects"
            >
              {{ t('sidebar.add_project', 'Add a project') }}
            </u-button>
          </div>

          <div
              v-else
              class="space-y-0.5"
          >
            <nuxt-link
                v-for="project in userProjects"
                :key="project.id"
                :class="'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
                :data-cy="'sidebar-project-' + project.id"
                :to="`/projects/${project.id}`"
                class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left"
            >
              <span
                  :class="`bg-${project.color || 'primary'}-500`"
                  class="w-2.5 h-2.5 rounded-full shrink-0"
              />
              <span class="flex-1 truncate font-medium">{{ project.name }}</span>
              <u-icon
                  v-if="project.is_system"
                  class="text-xs text-gray-400 shrink-0"
                  name="i-heroicons-lock-closed"
              />
            </nuxt-link>

            <nuxt-link
                class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                to="/projects"
            >
              <u-icon
                  class="text-sm"
                  name="i-heroicons-rectangle-stack"
              />
              {{ t('sidebar.manage_projects', 'Manage projects') }}
            </nuxt-link>
          </div>
        </div>

        <div class="flex-1"/>
      </template>

      <!-- Admin section (super admin only) -->
      <div
          v-if="isSuperAdmin"
          class="p-2 border-t border-gray-200 dark:border-gray-800"
      >
        <p class="text-xs text-gray-400 font-medium px-2 mb-1.5 uppercase tracking-wide">
          {{ t('nav.administration', 'Administration') }}
        </p>
        <nuxt-link
            :class="isActive('/users')
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            data-cy="sidebar-all-users-link"
            to="/users"
        >
          <u-icon
              class="text-base shrink-0"
              name="i-heroicons-user-group"
          />
          <span class="flex-1">{{ t('users.all_title', 'All users') }}</span>
        </nuxt-link>
        <nuxt-link
            :class="isActive('/admin/security')
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            to="/admin/security"
        >
          <u-icon
              class="text-base shrink-0"
              name="i-heroicons-shield-check"
          />
          <span class="flex-1">{{ t('security.nav_label', 'Security') }}</span>
        </nuxt-link>
        <nuxt-link
            :class="isActive('/admin/customization')
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            to="/admin/customization"
        >
          <u-icon
              class="text-base shrink-0"
              name="i-heroicons-paint-brush"
          />
          <span class="flex-1">{{ t('customization.nav_label', 'Customization') }}</span>
        </nuxt-link>
        <nuxt-link
            :class="isActive('/admin/smtp')
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            to="/admin/smtp"
        >
          <u-icon
              class="text-base shrink-0"
              name="i-heroicons-envelope"
          />
          <span class="flex-1">{{ t('smtp.nav_label', 'SMTP') }}</span>
        </nuxt-link>
        <nuxt-link
            :class="isActive('/admin/logs')
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
            class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            to="/admin/logs"
        >
          <u-icon
              class="text-base shrink-0"
              name="i-heroicons-document-text"
          />
          <span class="flex-1">{{ t('logs.nav_label', 'System logs') }}</span>
        </nuxt-link>
      </div>
    </aside>

    <!-- ── Right column ────────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header -->
      <header
          class="h-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2 px-4 shrink-0">
        <!-- UI Language -->
        <u-select
            v-if="uiLangsOptions.length > 1"
            :items="uiLangsOptions"
            :model-value="uiLang"
            class="w-36"
            size="xs"
            @update:model-value="setLang"
        />

        <!-- Theme toggle -->
        <u-button
            :icon="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
            color="neutral"
            size="sm"
            variant="ghost"
            @click="toggleDark"
        />

        <u-separator
            class="h-5"
            orientation="vertical"
        />

        <!-- User menu -->
        <u-dropdown-menu :items="userMenuItems">
          <button
              class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div
                class="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
              <span class="text-xs font-bold text-primary-600 dark:text-primary-400">
                {{ currentUser?.name?.charAt(0)?.toUpperCase() || '?' }}
              </span>
            </div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-32 truncate">{{
                currentUser?.name
              }}</span>
            <u-icon
                class="text-xs text-gray-400"
                name="i-heroicons-chevron-down"
            />
          </button>
        </u-dropdown-menu>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-auto min-w-0">
        <slot/>
      </main>
    </div>
  </div>

  <!-- Scan modal -->
  <common-scan-modal
      v-if="currentProject"
      v-model:open="showScanModal"
      :project="currentProject"
      :project-id="currentProject.id"
      @done="() => { fetchProjects(); refreshStats() }"
  />

  <!-- Change password modal -->
  <u-modal
      v-model:open="showPasswordModal"
      :title="t('user.change_password_title', 'Change password')"
  >
    <template #body>
      <div class="space-y-4">
        <u-form-field
            :label="t('user.current_password', 'Current password')"
            required
        >
          <u-input
              v-model="passwordForm.current"
              class="w-full"
              type="password"
          />
        </u-form-field>
        <u-form-field
            :hint="t('user.password_hint', 'Minimum 8 characters')"
            :label="t('user.new_password', 'New password')"
            required
        >
          <u-input
              v-model="passwordForm.next"
              class="w-full"
              type="password"
          />
        </u-form-field>
        <u-form-field
            :label="t('user.confirm_password', 'Confirm')"
            required
        >
          <u-input
              v-model="passwordForm.confirm"
              class="w-full"
              type="password"
          />
        </u-form-field>
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
        <u-button
            color="neutral"
            variant="ghost"
            @click="showPasswordModal = false"
        >
          {{ t('translations.cancel', 'Cancel') }}
        </u-button>
        <u-button
            :loading="passwordSaving"
            @click="changePassword"
        >
          {{ t('user.save_password', 'Save') }}
        </u-button>
      </div>
    </template>
  </u-modal>
</template>

<script lang="ts" setup>
  import { canSyncProject } from '../composables/useProject'

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const colorMode = useColorMode()
  const { t, lang: uiLang, setLang, getLangs } = useT()
  const { findLanguage } = useLanguages()
  const { branding } = useModuleConfig()
  const appName = computed(() => branding.value?.name || t('customization.default_app_name', 'i18n Dashboard'))
  const appSubtitle = computed(() => branding.value?.subtitle || t('customization.default_subtitle', 'vue-i18n manager'))
  const logoUrl = computed(() => branding.value?.logoUrl || null)
  const {
    currentProject,
    projects: projectsData,
    systemProject,
    fetchProjects,
    visibleProjects: userProjects,
    syncing,
    syncProject,
    pending
  } = useProject()

  const appReady = ref(false)
  // No `immediate` — with server:false, pending starts false before client fetch begins.
  // We only mark ready when pending transitions true→false (i.e. after first real load).
  watch(pending, (val) => {
    if (!val) appReady.value = true
  })
  const showScanModal = ref(false)
  const { currentUser, fetchMe, logout, changePassword: changePasswordFn, canManageProject, canApprove } = useAuth()
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

  const toggleDark = () => {
    colorMode.preference = isDark.value ? 'light' : 'dark'
  }

  const userCanManage = computed(() => currentProject.value ? canManageProject(currentProject.value.id) : false)
  const userCanApprove = computed(() => currentProject.value ? canApprove(currentProject.value.id) : false)
  const isSuperAdmin = computed(() => currentUser.value?.is_super_admin ?? false)

  onMounted(() => {
    fetchMe()
    // fetchProjects() is handled automatically by useAsyncData server:false auto-fetch
  })


  const isActive = (to: string) => {
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
      {
        to: `/projects/${id}/translations`,
        label: t('nav.translations', 'Translations'),
        icon: 'i-heroicons-globe-alt',
        badge: translateCount || undefined,
        badgeColor: 'info' as const
      },
      {
        to: `/projects/${id}/translations?status=unused`,
        label: t('nav.unused', 'Unused'),
        icon: 'i-heroicons-exclamation-triangle',
        badge: unusedCount || undefined,
        badgeColor: 'warning' as const
      },
      {
        to: `/projects/${id}/languages`,
        label: t('nav.languages', 'Languages'),
        icon: 'i-heroicons-flag',
        badge: languageCount || undefined,
        badgeColor: 'info' as const
      },
      ...(userCanApprove.value ? [{
        to: `/projects/${id}/review`,
        label: t('nav.review', 'Review'),
        icon: 'i-heroicons-clipboard-document-check',
        badge: reviewedCount || undefined,
        badgeColor: 'warning' as const
      }] : []),
      { to: `/projects/${id}/settings`, label: t('nav.settings', 'Settings'), icon: 'i-heroicons-cog-6-tooth' },
      ...(userCanManage.value || currentUser.value?.is_super_admin ? [{
        to: `/projects/${id}/users`,
        label: t('nav.users', 'Users'),
        icon: 'i-heroicons-users'
      }] : []),
      ...(currentProject.value?.enable_number_formats ? [{
        to: `/projects/${id}/formats/number`,
        label: t('nav.format_numbers', 'Number formats'),
        icon: 'i-heroicons-calculator'
      }] : []),
      ...(currentProject.value?.enable_datetime_formats ? [{
        to: `/projects/${id}/formats/datetime`,
        label: t('nav.format_dates', 'Date formats'),
        icon: 'i-heroicons-calendar'
      }] : []),
      ...(currentProject.value?.enable_modifiers ? [{
        to: `/projects/${id}/formats/modifiers`,
        label: t('nav.modifiers', 'Modifiers'),
        icon: 'i-heroicons-code-bracket'
      }] : []),
    ]
  })

  const userMenuItems = computed(() => [
    [{
      label: t('user.profile', 'My profile'),
      icon: 'i-heroicons-user-circle',
      onSelect: () => router.push(`/users/${currentUser.value?.id}/profile`)
    }],
    [{
      label: t('user.change_password', 'Change password'),
      icon: 'i-heroicons-key',
      onSelect: () => showPasswordModal.value = true
    }],
    [{
      label: t('user.logout', 'Log out'),
      icon: 'i-heroicons-arrow-right-on-rectangle',
      color: 'error' as const,
      onSelect: handleLogout
    }],
  ])

  const showPasswordModal = ref(false)
  const passwordForm = ref({ current: '', next: '', confirm: '' })
  const passwordError = ref('')
  const passwordSaving = ref(false)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const changePassword = async () => {
    passwordError.value = ''
    if (passwordForm.value.next.length < 8) {
      passwordError.value = t('user.password_hint', 'Minimum 8 characters')
      return
    }
    if (passwordForm.value.next !== passwordForm.value.confirm) {
      passwordError.value = t('user.passwords_mismatch', 'Passwords do not match')
      return
    }
    passwordSaving.value = true
    try {
      await changePasswordFn(passwordForm.value.current, passwordForm.value.next)
      toast.add({ title: t('user.password_changed', 'Password changed'), color: 'success' })
      showPasswordModal.value = false
      passwordForm.value = { current: '', next: '', confirm: '' }
    } catch (e: any) {
      passwordError.value = e.message || t('common.error', 'Error')
    } finally {
      passwordSaving.value = false
    }
  }

  const doSync = async () => {
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

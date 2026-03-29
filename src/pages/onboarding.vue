<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <!-- Hydration sentinel: only rendered after onMounted() fires (Vue fully hydrated) -->
    <span
      v-if="isMounted"
      class="sr-only"
      data-cy="onboarding-mounted"
    />
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 mb-4">
          <u-icon
            class="text-white text-3xl"
            name="i-heroicons-language"
          />
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          i18n Dashboard
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          {{ t('onboarding.subtitle', 'Configurons votre espace de travail en quelques étapes') }}
        </p>
      </div>

      <!-- Steps indicator -->
      <div
        class="flex items-center justify-center gap-2 mb-8"
        data-cy="onboarding-step-indicator"
      >
        <template
          v-for="(step, i) in steps"
          :key="i"
        >
          <div class="flex items-center gap-2">
            <div
              :class="i < currentStep
                ? 'bg-primary-500 text-white'
                : i === currentStep
                  ? 'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900/30'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors"
            >
              <u-icon
                v-if="i < currentStep"
                class="text-sm"
                name="i-heroicons-check"
              />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span
              :class="i === currentStep ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'"
              class="text-sm hidden sm:block"
            >{{ step.label }}</span>
          </div>
          <div
            v-if="i < steps.length - 1"
            class="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 max-w-12"
          />
        </template>
      </div>

      <u-card>
        <!-- ── Step 0 : Database ──────────────────────────────────────────── -->
        <div
          v-if="currentStep === 0"
          class="space-y-4"
        >
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('onboarding.db_title', 'Database') }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{
                t('onboarding.db_subtitle', 'Configure your database connection. Values are pre-filled from your config file.')
              }}
              <code class="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">i18n-dashboard.config.js</code>
            </p>
          </div>

          <!-- DB type selector -->
          <u-form-field :label="t('onboarding.db_type_label', 'Database type')">
            <div data-cy="onboarding-db-type-select">
              <u-select
                v-model="dbForm.type"
                :items="dbTypeOptions"
                class="w-full"
              />
            </div>
          </u-form-field>

          <!-- SQLite fields -->
          <template v-if="dbForm.type === 'sqlite'">
            <u-form-field :label="t('onboarding.db_file_label', 'Database file')">
              <div class="flex gap-2">
                <u-input
                  v-model="dbForm.connection"
                  class="flex-1"
                  data-cy="onboarding-sqlite-path"
                  placeholder="./i18n-dashboard.db"
                />
                <u-button
                  v-if="!sqliteFileExists"
                  :loading="creatingFile"
                  color="neutral"
                  data-cy="onboarding-sqlite-create"
                  icon="i-heroicons-document-plus"
                  variant="outline"
                  @click="createSqliteFile"
                >
                  {{ t('onboarding.db_create_file', 'Create') }}
                </u-button>
                <u-badge
                  v-else
                  class="shrink-0 self-center"
                  color="success"
                  data-cy="onboarding-sqlite-file-found"
                  variant="soft"
                >
                  <u-icon
                    class="mr-1"
                    name="i-heroicons-check"
                  />
                  {{ t('onboarding.db_file_found', 'File found') }}
                </u-badge>
              </div>
              <p
                v-if="!sqliteFileExists"
                class="text-xs text-amber-500 mt-1"
              >
                <u-icon
                  class="inline mr-1"
                  name="i-heroicons-exclamation-triangle"
                />
                {{ t('onboarding.db_file_missing', 'The file does not exist yet. Click "Create" to create it.') }}
              </p>
            </u-form-field>
          </template>

          <!-- PostgreSQL / MySQL fields -->
          <template v-else>
            <div class="grid grid-cols-2 gap-3">
              <u-form-field
                :label="t('onboarding.db_host', 'Host')"
                class="col-span-1"
              >
                <u-input
                  v-model="dbForm.host"
                  class="w-full"
                  placeholder="localhost"
                />
              </u-form-field>
              <u-form-field
                :label="t('onboarding.db_port', 'Port')"
                class="col-span-1"
              >
                <u-input
                  v-model="dbForm.port"
                  :placeholder="dbForm.type === 'mysql' ? '3306' : '5432'"
                  class="w-full"
                />
              </u-form-field>
            </div>
            <u-form-field :label="t('onboarding.db_user', 'User')">
              <u-input
                v-model="dbForm.user"
                class="w-full"
                placeholder="postgres"
              />
            </u-form-field>
            <u-form-field :label="t('onboarding.db_password', 'Password')">
              <u-input
                v-model="dbForm.password"
                class="w-full"
                placeholder="••••••••"
                type="password"
              />
            </u-form-field>
            <u-form-field :label="t('onboarding.db_name', 'Database name')">
              <u-input
                v-model="dbForm.database"
                class="w-full"
                placeholder="i18n_dashboard"
              />
            </u-form-field>
          </template>

          <!-- Actions -->
          <div class="flex items-center gap-3 flex-wrap">
            <u-button
              :loading="testingDb"
              color="neutral"
              data-cy="onboarding-db-test"
              icon="i-heroicons-signal"
              variant="outline"
              @click="testDbConnection"
            >
              {{ t('onboarding.db_test', 'Test connection') }}
            </u-button>
            <u-button
              v-if="dbFormChanged"
              :loading="applyingDb"
              icon="i-heroicons-check"
              @click="applyDbConfig"
            >
              {{ t('onboarding.db_test_apply', 'Apply') }}
            </u-button>
            <u-badge
              v-if="dbConnected"
              color="success"
              data-cy="onboarding-db-connected"
              variant="soft"
            >
              <u-icon
                class="mr-1"
                name="i-heroicons-check-circle"
              />
              {{ t('onboarding.db_connected', 'Connection OK') }}
            </u-badge>
          </div>

          <p
            v-if="dbError"
            class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
            data-cy="onboarding-db-error"
          >
            <u-icon
              class="inline mr-1"
              name="i-heroicons-exclamation-circle"
            />
            {{ dbError }}
          </p>
        </div>

        <!-- ── Step 1 : Admin account ─────────────────────────────────────── -->
        <div
          v-if="currentStep === 1"
          class="space-y-4"
        >
          <!-- Fresh install: creation form -->
          <template v-if="!hasUsers">
            <div class="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
              <p class="text-sm text-primary-700 dark:text-primary-300">
                <u-icon
                  class="inline mr-1"
                  name="i-heroicons-information-circle"
                />
                {{ t('onboarding.create_admin_hint', 'Create the') }}
                <strong>{{ t('onboarding.super_admin_role', 'Super Administrator') }}</strong>
                {{ t('onboarding.create_admin_hint2', 'account to get started.') }}
              </p>
            </div>
            <form
              class="space-y-4"
              @submit.prevent="createAdmin"
            >
              <u-form-field
                :label="t('users.full_name', 'Full name')"
                required
              >
                <u-input
                  v-model="adminForm.name"
                  autofocus
                  class="w-full"
                  data-cy="onboarding-admin-name"
                  placeholder="Marie Dupont"
                />
              </u-form-field>
              <u-form-field
                :label="t('login.email', 'Email')"
                required
              >
                <u-input
                  v-model="adminForm.email"
                  class="w-full"
                  data-cy="onboarding-admin-email"
                  placeholder="admin@example.com"
                  type="email"
                />
              </u-form-field>
              <u-form-field
                :hint="t('user.password_hint', 'Minimum 8 characters')"
                :label="t('login.password', 'Password')"
                required
              >
                <u-input
                  v-model="adminForm.password"
                  class="w-full"
                  data-cy="onboarding-admin-password"
                  placeholder="••••••••"
                  type="password"
                />
              </u-form-field>
              <u-form-field
                :label="t('onboarding.confirm_password', 'Confirm password')"
                required
              >
                <u-input
                  v-model="adminForm.confirm"
                  class="w-full"
                  data-cy="onboarding-admin-confirm"
                  placeholder="••••••••"
                  type="password"
                />
              </u-form-field>
              <p
                v-if="adminError"
                class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
                data-cy="onboarding-admin-error"
              >
                <u-icon
                  class="inline mr-1"
                  name="i-heroicons-exclamation-circle"
                />
                {{ adminError }}
              </p>
            </form>
          </template>
          <!-- Existing install: confirmation -->
          <template v-else>
            <div
              class="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
              data-cy="onboarding-admin-done"
            >
              <u-icon
                class="text-green-500 text-2xl shrink-0"
                name="i-heroicons-check-circle"
              />
              <div>
                <p class="font-medium text-green-700 dark:text-green-400">
                  {{ t('onboarding.admin_done', 'Compte administrateur créé avec succès.') }}
                </p>
                <p class="text-sm text-green-600 dark:text-green-500 mt-0.5">
                  {{ currentUser?.name }} — {{ currentUser?.email }}
                </p>
              </div>
            </div>
          </template>
        </div>

        <!-- ── Step 2 : UI Languages ──────────────────────────────────────── -->
        <div
          v-if="currentStep === 2"
          class="space-y-4"
        >
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('onboarding.languages_title', 'Langues de l\'interface') }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{
                t('onboarding.languages_hint', 'Sélectionnez les langues disponibles pour l\'interface du dashboard.')
              }}
            </p>
          </div>
          <u-input
            v-model="uiLangSearch"
            :placeholder="t('onboarding.languages_search', 'Rechercher une langue...')"
            class="w-full"
            data-cy="onboarding-lang-search"
            icon="i-heroicons-magnifying-glass"
          />
          <div
            class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-56 overflow-y-auto"
            data-cy="onboarding-lang-list"
          >
            <button
              v-for="lang in filteredUiLangs"
              :key="lang.code"
              :class="selectedUiLangs.includes(lang.code) ? 'bg-primary-50 dark:bg-primary-900/20' : ''"
              class="w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              @click="toggleUiLang(lang)"
            >
              <span class="font-mono text-xs text-gray-400 w-10 shrink-0">{{ lang.code }}</span>
              <span class="flex-1 text-gray-700 dark:text-gray-300">{{ lang.nativeName }}</span>
              <span class="text-xs text-gray-400">{{ lang.name }}</span>
              <u-icon
                v-if="selectedUiLangs.includes(lang.code)"
                class="text-primary-500 shrink-0"
                name="i-heroicons-check"
              />
            </button>
          </div>
          <p class="text-xs text-gray-400">
            {{ selectedUiLangs.length }} {{ t('onboarding.languages_selected', 'langue(s) sélectionnée(s)') }}
            <span
              v-if="nonEnLangs.length"
              class="ml-1 text-primary-500"
            >
              — {{
                nonEnLangs.length
              }} {{
                t('onboarding.langs_will_be_translated', 'language(s) will be automatically translated via Google Translate')
              }}
            </span>
          </p>
          <u-form-field :label="t('onboarding.languages_default', 'Langue par défaut')">
            <u-select
              v-model="defaultUiLang"
              :items="selectedUiLangsOptions"
              class="w-full"
            />
          </u-form-field>
        </div>

        <!-- ── Step 3 : First project ─────────────────────────────────────── -->
        <div
          v-if="currentStep === 3"
          class="space-y-4"
        >
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('onboarding.project_title', 'Votre premier projet') }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ t('onboarding.project_hint', 'Configurez le projet Vue.js que vous souhaitez gérer.') }}
            </p>
          </div>

          <u-form-field
            :label="t('projects.name_label', 'Project name')"
            required
          >
            <u-input
              v-model="projectForm.name"
              :placeholder="t('projects.name_placeholder', 'My App')"
              class="w-full"
              data-cy="onboarding-project-name"
            />
          </u-form-field>

          <!-- Source type toggle -->
          <div class="flex gap-2">
            <u-button
              :color="projectSourceType === 'local' ? 'primary' : 'neutral'"
              :variant="projectSourceType === 'local' ? 'solid' : 'outline'"
              icon="i-heroicons-folder"
              size="sm"
              @click="projectSourceType = 'local'"
            >
              {{ t('onboarding.source_local', 'Local path') }}
            </u-button>
            <u-button
              :color="projectSourceType === 'git' ? 'primary' : 'neutral'"
              :variant="projectSourceType === 'git' ? 'solid' : 'outline'"
              icon="i-heroicons-code-bracket"
              size="sm"
              @click="projectSourceType = 'git'"
            >
              {{ t('onboarding.source_git', 'Git repository') }}
            </u-button>
          </div>

          <!-- Local path fields -->
          <template v-if="projectSourceType === 'local'">
            <u-form-field
              :label="t('settings.root_path', 'Project path')"
              required
            >
              <u-input
                v-model="projectForm.root_path"
                class="w-full"
                data-cy="onboarding-project-path"
                placeholder="/path/to/my-project"
              />
            </u-form-field>
          </template>

          <!-- Git fields -->
          <template v-else>
            <u-form-field
              :label="t('projects.git_repo_url_label', 'Repository URL')"
              required
            >
              <u-input
                v-model="projectForm.git_url"
                class="w-full"
                data-cy="onboarding-project-git-url"
                placeholder="https://github.com/org/repo"
              />
            </u-form-field>
            <u-form-field :label="t('projects.git_repo_branch_label', 'Branch')">
              <u-input
                v-model="projectForm.git_branch"
                class="w-full"
                placeholder="main"
              />
            </u-form-field>
            <u-form-field :label="t('projects.git_token_label', 'Access token (optional)')">
              <u-input
                v-model="projectForm.git_token"
                :placeholder="t('projects.git_token_placeholder', 'ghp_...')"
                class="w-full"
                type="password"
              />
            </u-form-field>
          </template>

          <u-form-field :label="t('settings.locales_folder', 'Locales folder')">
            <u-input
              v-model="projectForm.locales_path"
              class="w-full"
              data-cy="onboarding-project-locales"
              placeholder="src/locales"
            />
          </u-form-field>

          <p
            v-if="projectError"
            class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
            data-cy="onboarding-project-error"
          >
            {{ projectError }}
          </p>
        </div>

        <!-- ── Step 4 : Done ──────────────────────────────────────────────── -->
        <div
          v-if="currentStep === 4"
          class="text-center space-y-4 py-4"
        >
          <div
            class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-2"
          >
            <u-icon
              class="text-green-500 text-3xl"
              name="i-heroicons-check"
            />
          </div>
          <h2
            class="text-xl font-bold text-gray-900 dark:text-white"
            data-cy="onboarding-done-title"
          >
            {{ t('onboarding.done_title', 'Tout est prêt !') }}
          </h2>
          <p class="text-gray-500 dark:text-gray-400">
            {{
              t('onboarding.done_hint', 'Votre dashboard est configuré. Vous pouvez maintenant gérer vos traductions.')
            }}
          </p>
          <p
            v-if="nonEnLangs.length"
            class="text-sm text-primary-500"
          >
            {{ t('onboarding.translating_in_progress', 'Interface translation is in progress in the background for') }}
            {{ nonEnLangs.join(', ') }}.
          </p>
        </div>

        <!-- ── Footer navigation ──────────────────────────────────────────── -->
        <template #footer>
          <div class="flex items-center justify-between">
            <u-button
              v-if="currentStep > 0 && currentStep < 4"
              color="neutral"
              data-cy="onboarding-prev"
              icon="i-heroicons-arrow-left"
              variant="ghost"
              @click="currentStep--"
            >
              {{ t('onboarding.previous', 'Précédent') }}
            </u-button>
            <div v-else />

            <div class="flex items-center gap-3">
              <u-button
                v-if="currentStep === 3"
                color="neutral"
                data-cy="onboarding-skip-project"
                variant="ghost"
                @click="skipProject"
              >
                {{ t('onboarding.project_skip', 'Passer cette étape') }}
              </u-button>

              <!-- Step 0: DB -->
              <u-button
                v-if="currentStep === 0"
                data-cy="onboarding-next"
                icon="i-heroicons-arrow-right"
                trailing
                @click="currentStep++"
              >
                {{ t('onboarding.next', 'Suivant') }}
              </u-button>

              <!-- Step 1: Admin -->
              <u-button
                v-if="currentStep === 1"
                :loading="saving"
                data-cy="onboarding-next"
                icon="i-heroicons-arrow-right"
                trailing
                @click="hasUsers ? currentStep++ : createAdmin()"
              >
                {{ t('onboarding.next', 'Suivant') }}
              </u-button>

              <!-- Step 2: Languages -->
              <u-button
                v-if="currentStep === 2"
                :disabled="selectedUiLangs.length === 0"
                :loading="saving"
                data-cy="onboarding-next"
                icon="i-heroicons-arrow-right"
                trailing
                @click="onSaveLanguages"
              >
                {{ t('onboarding.next', 'Suivant') }}
              </u-button>

              <!-- Step 3: Project -->
              <u-button
                v-if="currentStep === 3"
                :loading="saving"
                data-cy="onboarding-finish"
                icon="i-heroicons-arrow-right"
                trailing
                @click="saveProject"
              >
                {{ t('onboarding.finish', 'Terminer') }}
              </u-button>

              <!-- Step 4: Done -->
              <u-button
                v-if="currentStep === 4"
                data-cy="onboarding-go-dashboard"
                icon="i-heroicons-home"
                trailing
                @click="goToDashboard"
              >
                {{ t('onboarding.go_to_dashboard', 'Aller au dashboard') }}
              </u-button>
            </div>
          </div>
        </template>
      </u-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
  definePageMeta({ layout: false })

  const router = useRouter()
  const { t } = useT()
  const { currentUser, fetchMe } = useAuth()
  const { getDbConfig, saveDbConfig, setup, saveLanguages, getAuthStatus, getConfig } = useOnboarding()
  const { createProject } = useProject()
  await fetchMe()

  const { data: authStatus } = await useAsyncData('auth-status', () => getAuthStatus(), { server: false })
  const hasUsers = computed(() => !!(authStatus.value as any)?.hasUsers)

  const { data: dbConfig, refresh: refreshDbConfig } = await useAsyncData('onboarding-db-config', () => getDbConfig(), { server: false })
  const { data: configData } = await useAsyncData('onboarding-config', () => getConfig(), { server: false })

  const currentStep = ref(0)
  const saving = ref(false)

  const steps = [
    { label: t('onboarding.step_db', 'Database') },
    { label: t('onboarding.step_admin', 'Admin account') },
    { label: t('onboarding.step_languages', 'Interface languages') },
    { label: t('onboarding.step_project', 'First project') },
    { label: t('onboarding.step_done', 'Done') },
  ]

  // ─── Step 0 : Database config ──────────────────────────────────────────────────

  const dbTypeOptions = computed(() => [
    { label: t('onboarding.db_type_sqlite', 'SQLite (local file)'), value: 'sqlite' },
    { label: t('onboarding.db_type_postgresql', 'PostgreSQL'), value: 'postgresql' },
    { label: t('onboarding.db_type_mysql', 'MySQL / MariaDB'), value: 'mysql' },
  ])

  const dbForm = ref({
    type: (dbConfig.value?.type as string) || 'sqlite',
    connection: (dbConfig.value?.connection as string) || './i18n-dashboard.db',
    host: (dbConfig.value?.host as string) || 'localhost',
    port: (dbConfig.value?.port as string) || '5432',
    user: (dbConfig.value?.user as string) || '',
    password: '',
    database: (dbConfig.value?.database as string) || '',
  })

  const sqliteFileExists = ref<boolean>(dbConfig.value?.fileExists ?? true)
  const dbConnected = ref(false)
  const testingDb = ref(false)
  const applyingDb = ref(false)
  const creatingFile = ref(false)
  const dbError = ref('')

  const dbFormOriginal = JSON.stringify(dbForm.value)
  const dbFormChanged = computed(() => JSON.stringify(dbForm.value) !== dbFormOriginal)

  let _checkPathTimer: ReturnType<typeof setTimeout> | null = null
  watch(() => dbForm.value.connection, (path) => {
    if (dbForm.value.type !== 'sqlite') return
    if (_checkPathTimer) clearTimeout(_checkPathTimer)
    _checkPathTimer = setTimeout(async () => {
      try {
        const result = await getDbConfig(path)
        sqliteFileExists.value = result.fileExists ?? false
      } catch { /* ignore */ }
    }, 400)
  })

  const createSqliteFile = async () => {
    creatingFile.value = true
    dbError.value = ''
    try {
      await saveDbConfig({ type: 'sqlite', connection: dbForm.value.connection, createFile: true })
      sqliteFileExists.value = true
    } catch (e: any) {
      dbError.value = e.message || t('onboarding.db_create_file_error', 'Error creating the file.')
    } finally {
      creatingFile.value = false
    }
  }

  const dbBody = () => {
    return {
      type: dbForm.value.type,
      connection: dbForm.value.connection,
      host: dbForm.value.host,
      port: dbForm.value.port,
      user: dbForm.value.user,
      password: dbForm.value.password,
      database: dbForm.value.database,
    }
  }

  const testDbConnection = async () => {
    testingDb.value = true
    dbConnected.value = false
    dbError.value = ''
    try {
      await saveDbConfig({ ...dbBody(), testOnly: true })
      dbConnected.value = true
    } catch (e: any) {
      dbError.value = e.message || 'Connection failed.'
    } finally {
      testingDb.value = false
    }
  }

  const applyDbConfig = async () => {
    applyingDb.value = true
    dbError.value = ''
    try {
      await saveDbConfig(dbBody())
      dbConnected.value = true
      await refreshDbConfig()
      sqliteFileExists.value = dbConfig.value?.fileExists ?? true
    } catch (e: any) {
      dbError.value = e.message || 'Failed to apply configuration.'
      dbConnected.value = false
    } finally {
      applyingDb.value = false
    }
  }

  // ─── Step 1 : Admin account ────────────────────────────────────────────────────

  const adminForm = ref({ name: '', email: '', password: '', confirm: '' })
  const adminError = ref('')

  const createAdmin = async () => {
    adminError.value = ''
    if (!adminForm.value.name || !adminForm.value.email || !adminForm.value.password) {
      adminError.value = t('onboarding.all_fields_required', 'All fields are required.')
      return
    }
    if (adminForm.value.password.length < 8) {
      adminError.value = t('onboarding.password_min_length', 'Password must be at least 8 characters.')
      return
    }
    if (adminForm.value.password !== adminForm.value.confirm) {
      adminError.value = t('onboarding.passwords_mismatch', 'Passwords do not match.')
      return
    }
    saving.value = true
    try {
      await setup({ name: adminForm.value.name, email: adminForm.value.email, password: adminForm.value.password })
      await fetchMe()
      currentStep.value = 2
    } catch (e: any) {
      adminError.value = e.message || t('onboarding.admin_creation_error', 'Error creating the account.')
    } finally {
      saving.value = false
    }
  }

  // ─── Step 2 : UI Languages ─────────────────────────────────────────────────────

  const { languages: allWorldLangs, filteredLanguages, searchQuery: uiLangSearch } = useLanguages()

  const selectedUiLangs = ref<string[]>(configData.value?.uiLanguages || ['en'])
  const defaultUiLang = ref(configData.value?.defaultUiLanguage || 'en')

  const filteredUiLangs = computed(() => filteredLanguages.value)
  const nonEnLangs = computed(() => selectedUiLangs.value.filter(c => c !== 'en'))

  const selectedUiLangsOptions = computed(() =>
    selectedUiLangs.value.map((code) => {
      const lang = allWorldLangs.find((l) => l.code === code)
      return { label: lang ? `${lang.nativeName} (${code})` : code, value: code }
    }),
  )

  const toggleUiLang = (lang: { code: string; name: string; nativeName: string }) => {
    const idx = selectedUiLangs.value.indexOf(lang.code)
    if (idx >= 0) {
      if (selectedUiLangs.value.length === 1) return
      selectedUiLangs.value.splice(idx, 1)
      if (defaultUiLang.value === lang.code) defaultUiLang.value = selectedUiLangs.value[0]
    } else {
      selectedUiLangs.value.push(lang.code)
      if (selectedUiLangs.value.length === 1) defaultUiLang.value = lang.code
    }
  }

  const onSaveLanguages = async () => {
    saving.value = true
    try {
      const langs = selectedUiLangs.value.map((code) => {
        const lang = allWorldLangs.find((l) => l.code === code)
        return { code, name: lang?.name || code }
      })
      await saveLanguages(langs, defaultUiLang.value)
      currentStep.value = 3
    } catch {
      // silent — onboarding marked complete regardless
    } finally {
      saving.value = false
    }
  }

  // ─── Step 3 : First project ────────────────────────────────────────────────────

  const projectSourceType = ref<'local' | 'git'>('local')
  const projectForm = ref({
    name: configData.value?.project?.name || '',
    root_path: '',
    locales_path: configData.value?.project?.localesPath || 'src/locales',
    git_url: '',
    git_branch: '',
    git_token: '',
  })
  const projectError = ref('')

  const saveProject = async () => {
    projectError.value = ''
    if (!projectForm.value.name.trim()) {
      projectError.value = t('onboarding.project_name_required', 'Project name is required.')
      return
    }
    if (projectSourceType.value === 'local' && !projectForm.value.root_path.trim()) {
      projectError.value = t('onboarding.project_path_required', 'Project path is required.')
      return
    }
    if (projectSourceType.value === 'git' && !projectForm.value.git_url.trim()) {
      projectError.value = t('onboarding.project_git_url_required', 'Repository URL is required.')
      return
    }
    saving.value = true
    try {
      const body: Record<string, any> = {
        name: projectForm.value.name.trim(),
        locales_path: projectForm.value.locales_path || 'src/locales',
      }
      if (projectSourceType.value === 'local') {
        body.root_path = projectForm.value.root_path.trim()
      } else {
        body.git_repo = {
          url: projectForm.value.git_url.trim(),
          branch: projectForm.value.git_branch.trim() || 'main',
          token: projectForm.value.git_token.trim() || undefined,
        }
      }
      await createProject(body)
      currentStep.value = 4
    } catch (e: any) {
      projectError.value = e.message || t('onboarding.project_creation_error', 'Error creating the project.')
    } finally {
      saving.value = false
    }
  }

  const skipProject = () => {
    currentStep.value = 4
  }

  // ─── Hydration sentinel (used by Cypress tests) ────────────────────────────────

  const isMounted = ref(false)
  onMounted(() => {
    isMounted.value = true
  })

  // ─── Step 4 : Done ─────────────────────────────────────────────────────────────

  const goToDashboard = async () => {
    await clearNuxtData('auth-status')
    await router.push('/')
  }
</script>

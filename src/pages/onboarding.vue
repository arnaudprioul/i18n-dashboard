<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <!-- Hydration sentinel: only rendered after onMounted() fires (Vue fully hydrated) -->
    <span
      v-if="isMounted"
      data-cy="onboarding-mounted"
      class="sr-only"
    />
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500 mb-4">
          <UIcon
            name="i-heroicons-language"
            class="text-white text-3xl"
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
        data-cy="onboarding-step-indicator"
        class="flex items-center justify-center gap-2 mb-8"
      >
        <template
          v-for="(step, i) in steps"
          :key="i"
        >
          <div class="flex items-center gap-2">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors"
              :class="i < currentStep
                ? 'bg-primary-500 text-white'
                : i === currentStep
                  ? 'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900/30'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
            >
              <UIcon
                v-if="i < currentStep"
                name="i-heroicons-check"
                class="text-sm"
              />
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span
              class="text-sm hidden sm:block"
              :class="i === currentStep ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'"
            >{{ step.label }}</span>
          </div>
          <div
            v-if="i < steps.length - 1"
            class="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 max-w-12"
          />
        </template>
      </div>

      <UCard>
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
              {{ t('onboarding.db_subtitle', 'Configure your database connection. Values are pre-filled from your config file.') }}
              <code class="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">i18n-dashboard.config.js</code>
            </p>
          </div>

          <!-- DB type selector -->
          <UFormField :label="t('onboarding.db_type_label', 'Database type')">
            <div data-cy="onboarding-db-type-select">
              <USelect
                v-model="dbForm.type"
                :items="dbTypeOptions"
                class="w-full"
              />
            </div>
          </UFormField>

          <!-- SQLite fields -->
          <template v-if="dbForm.type === 'sqlite'">
            <UFormField :label="t('onboarding.db_file_label', 'Database file')">
              <div class="flex gap-2">
                <UInput
                  v-model="dbForm.connection"
                  placeholder="./i18n-dashboard.db"
                  class="flex-1"
                  data-cy="onboarding-sqlite-path"
                />
                <UButton
                  v-if="!sqliteFileExists"
                  color="neutral"
                  variant="outline"
                  icon="i-heroicons-document-plus"
                  :loading="creatingFile"
                  data-cy="onboarding-sqlite-create"
                  @click="createSqliteFile"
                >
                  {{ t('onboarding.db_create_file', 'Create') }}
                </UButton>
                <UBadge
                  v-else
                  color="success"
                  variant="soft"
                  class="shrink-0 self-center"
                  data-cy="onboarding-sqlite-file-found"
                >
                  <UIcon
                    name="i-heroicons-check"
                    class="mr-1"
                  />
                  {{ t('onboarding.db_file_found', 'File found') }}
                </UBadge>
              </div>
              <p
                v-if="!sqliteFileExists"
                class="text-xs text-amber-500 mt-1"
              >
                <UIcon
                  name="i-heroicons-exclamation-triangle"
                  class="inline mr-1"
                />
                {{ t('onboarding.db_file_missing', 'The file does not exist yet. Click "Create" to create it.') }}
              </p>
            </UFormField>
          </template>

          <!-- PostgreSQL / MySQL fields -->
          <template v-else>
            <div class="grid grid-cols-2 gap-3">
              <UFormField
                :label="t('onboarding.db_host', 'Host')"
                class="col-span-1"
              >
                <UInput
                  v-model="dbForm.host"
                  placeholder="localhost"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                :label="t('onboarding.db_port', 'Port')"
                class="col-span-1"
              >
                <UInput
                  v-model="dbForm.port"
                  :placeholder="dbForm.type === 'mysql' ? '3306' : '5432'"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField :label="t('onboarding.db_user', 'User')">
              <UInput
                v-model="dbForm.user"
                placeholder="postgres"
                class="w-full"
              />
            </UFormField>
            <UFormField :label="t('onboarding.db_password', 'Password')">
              <UInput
                v-model="dbForm.password"
                type="password"
                placeholder="••••••••"
                class="w-full"
              />
            </UFormField>
            <UFormField :label="t('onboarding.db_name', 'Database name')">
              <UInput
                v-model="dbForm.database"
                placeholder="i18n_dashboard"
                class="w-full"
              />
            </UFormField>
          </template>

          <!-- Actions -->
          <div class="flex items-center gap-3 flex-wrap">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-heroicons-signal"
              :loading="testingDb"
              data-cy="onboarding-db-test"
              @click="testDbConnection"
            >
              {{ t('onboarding.db_test', 'Test connection') }}
            </UButton>
            <UButton
              v-if="dbFormChanged"
              icon="i-heroicons-check"
              :loading="applyingDb"
              @click="applyDbConfig"
            >
              {{ t('onboarding.db_test_apply', 'Apply') }}
            </UButton>
            <UBadge
              v-if="dbConnected"
              color="success"
              variant="soft"
              data-cy="onboarding-db-connected"
            >
              <UIcon
                name="i-heroicons-check-circle"
                class="mr-1"
              />
              {{ t('onboarding.db_connected', 'Connection OK') }}
            </UBadge>
          </div>

          <p
            v-if="dbError"
            class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
            data-cy="onboarding-db-error"
          >
            <UIcon
              name="i-heroicons-exclamation-circle"
              class="inline mr-1"
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
                <UIcon
                  name="i-heroicons-information-circle"
                  class="inline mr-1"
                />
                {{ t('onboarding.create_admin_hint', 'Create the') }} <strong>{{ t('onboarding.super_admin_role', 'Super Administrator') }}</strong> {{ t('onboarding.create_admin_hint2', 'account to get started.') }}
              </p>
            </div>
            <form
              class="space-y-4"
              @submit.prevent="createAdmin"
            >
              <UFormField
                :label="t('users.full_name', 'Full name')"
                required
              >
                <UInput
                  v-model="adminForm.name"
                  placeholder="Marie Dupont"
                  class="w-full"
                  autofocus
                  data-cy="onboarding-admin-name"
                />
              </UFormField>
              <UFormField
                :label="t('login.email', 'Email')"
                required
              >
                <UInput
                  v-model="adminForm.email"
                  type="email"
                  placeholder="admin@example.com"
                  class="w-full"
                  data-cy="onboarding-admin-email"
                />
              </UFormField>
              <UFormField
                :label="t('login.password', 'Password')"
                :hint="t('user.password_hint', 'Minimum 8 characters')"
                required
              >
                <UInput
                  v-model="adminForm.password"
                  type="password"
                  placeholder="••••••••"
                  class="w-full"
                  data-cy="onboarding-admin-password"
                />
              </UFormField>
              <UFormField
                :label="t('onboarding.confirm_password', 'Confirm password')"
                required
              >
                <UInput
                  v-model="adminForm.confirm"
                  type="password"
                  placeholder="••••••••"
                  class="w-full"
                  data-cy="onboarding-admin-confirm"
                />
              </UFormField>
              <p
                v-if="adminError"
                class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
                data-cy="onboarding-admin-error"
              >
                <UIcon
                  name="i-heroicons-exclamation-circle"
                  class="inline mr-1"
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
              <UIcon
                name="i-heroicons-check-circle"
                class="text-green-500 text-2xl shrink-0"
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
              {{ t('onboarding.languages_hint', 'Sélectionnez les langues disponibles pour l\'interface du dashboard.') }}
            </p>
          </div>
          <UInput
            v-model="uiLangSearch"
            :placeholder="t('onboarding.languages_search', 'Rechercher une langue...')"
            icon="i-heroicons-magnifying-glass"
            class="w-full"
            data-cy="onboarding-lang-search"
          />
          <div
            class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-56 overflow-y-auto"
            data-cy="onboarding-lang-list"
          >
            <button
              v-for="lang in filteredUiLangs"
              :key="lang.code"
              class="w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              :class="selectedUiLangs.includes(lang.code) ? 'bg-primary-50 dark:bg-primary-900/20' : ''"
              @click="toggleUiLang(lang)"
            >
              <span class="font-mono text-xs text-gray-400 w-10 shrink-0">{{ lang.code }}</span>
              <span class="flex-1 text-gray-700 dark:text-gray-300">{{ lang.nativeName }}</span>
              <span class="text-xs text-gray-400">{{ lang.name }}</span>
              <UIcon
                v-if="selectedUiLangs.includes(lang.code)"
                name="i-heroicons-check"
                class="text-primary-500 shrink-0"
              />
            </button>
          </div>
          <p class="text-xs text-gray-400">
            {{ selectedUiLangs.length }} {{ t('onboarding.languages_selected', 'langue(s) sélectionnée(s)') }}
            <span
              v-if="nonEnLangs.length"
              class="ml-1 text-primary-500"
            >
              — {{ nonEnLangs.length }} {{ t('onboarding.langs_will_be_translated', 'language(s) will be automatically translated via Google Translate') }}
            </span>
          </p>
          <UFormField :label="t('onboarding.languages_default', 'Langue par défaut')">
            <USelect
              v-model="defaultUiLang"
              :items="selectedUiLangsOptions"
              class="w-full"
            />
          </UFormField>
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
          <UFormField
            :label="t('projects.name_label', 'Project name')"
            required
          >
            <UInput
              v-model="projectForm.name"
              :placeholder="t('projects.name_placeholder', 'My App')"
              class="w-full"
              data-cy="onboarding-project-name"
            />
          </UFormField>
          <UFormField
            :label="t('settings.root_path', 'Project path')"
            required
          >
            <UInput
              v-model="projectForm.root_path"
              placeholder="/path/to/my-project"
              class="w-full"
              data-cy="onboarding-project-path"
            />
          </UFormField>
          <UFormField :label="t('settings.locales_folder', 'Locales folder')">
            <UInput
              v-model="projectForm.locales_path"
              placeholder="src/locales"
              class="w-full"
              data-cy="onboarding-project-locales"
            />
          </UFormField>
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
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-2">
            <UIcon
              name="i-heroicons-check"
              class="text-green-500 text-3xl"
            />
          </div>
          <h2
            class="text-xl font-bold text-gray-900 dark:text-white"
            data-cy="onboarding-done-title"
          >
            {{ t('onboarding.done_title', 'Tout est prêt !') }}
          </h2>
          <p class="text-gray-500 dark:text-gray-400">
            {{ t('onboarding.done_hint', 'Votre dashboard est configuré. Vous pouvez maintenant gérer vos traductions.') }}
          </p>
          <p
            v-if="nonEnLangs.length"
            class="text-sm text-primary-500"
          >
            {{ t('onboarding.translating_in_progress', 'Interface translation is in progress in the background for') }} {{ nonEnLangs.join(', ') }}.
          </p>
        </div>

        <!-- ── Footer navigation ──────────────────────────────────────────── -->
        <template #footer>
          <div class="flex items-center justify-between">
            <UButton
              v-if="currentStep > 0 && currentStep < 4"
              color="neutral"
              variant="ghost"
              icon="i-heroicons-arrow-left"
              data-cy="onboarding-prev"
              @click="currentStep--"
            >
              {{ t('onboarding.previous', 'Précédent') }}
            </UButton>
            <div v-else />

            <div class="flex items-center gap-3">
              <UButton
                v-if="currentStep === 3"
                color="neutral"
                variant="ghost"
                data-cy="onboarding-skip-project"
                @click="skipProject"
              >
                {{ t('onboarding.project_skip', 'Passer cette étape') }}
              </UButton>

              <!-- Step 0: DB -->
              <UButton
                v-if="currentStep === 0"
                icon="i-heroicons-arrow-right"
                trailing
                data-cy="onboarding-next"
                @click="currentStep++"
              >
                {{ t('onboarding.next', 'Suivant') }}
              </UButton>

              <!-- Step 1: Admin -->
              <UButton
                v-if="currentStep === 1"
                :loading="saving"
                icon="i-heroicons-arrow-right"
                trailing
                data-cy="onboarding-next"
                @click="hasUsers ? currentStep++ : createAdmin()"
              >
                {{ t('onboarding.next', 'Suivant') }}
              </UButton>

              <!-- Step 2: Languages -->
              <UButton
                v-if="currentStep === 2"
                :loading="saving"
                :disabled="selectedUiLangs.length === 0"
                icon="i-heroicons-arrow-right"
                trailing
                data-cy="onboarding-next"
                @click="saveLanguages"
              >
                {{ t('onboarding.next', 'Suivant') }}
              </UButton>

              <!-- Step 3: Project -->
              <UButton
                v-if="currentStep === 3"
                :loading="saving"
                icon="i-heroicons-arrow-right"
                trailing
                data-cy="onboarding-finish"
                @click="saveProject"
              >
                {{ t('onboarding.finish', 'Terminer') }}
              </UButton>

              <!-- Step 4: Done -->
              <UButton
                v-if="currentStep === 4"
                icon="i-heroicons-home"
                trailing
                data-cy="onboarding-go-dashboard"
                @click="goToDashboard"
              >
                {{ t('onboarding.go_to_dashboard', 'Aller au dashboard') }}
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: false })

const router = useRouter()
const { t } = useT()
const { currentUser, fetchMe } = useAuth()
await fetchMe()

const { data: authStatus } = await useFetch('/api/auth/status', { key: 'auth-status' })
const hasUsers = computed(() => !!(authStatus.value as any)?.hasUsers)

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
const { data: dbConfig, refresh: refreshDbConfig } = await useFetch<any>('/api/db-config')

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

// Track if form changed from initial config
const dbFormOriginal = JSON.stringify(dbForm.value)
const dbFormChanged = computed(() => JSON.stringify(dbForm.value) !== dbFormOriginal)

// Update sqliteFileExists when SQLite path changes
let _checkPathTimer: ReturnType<typeof setTimeout> | null = null
watch(() => dbForm.value.connection, (path) => {
  if (dbForm.value.type !== 'sqlite') return
  if (_checkPathTimer) clearTimeout(_checkPathTimer)
  _checkPathTimer = setTimeout(async () => {
    try {
      const result = await $fetch<any>(`/api/db-config?checkPath=${encodeURIComponent(path)}`)
      sqliteFileExists.value = result.fileExists ?? false
    } catch { /* ignore */ }
  }, 400)
})

async function createSqliteFile() {
  creatingFile.value = true
  dbError.value = ''
  try {
    await $fetch('/api/db-config', {
      method: 'POST',
      body: { type: 'sqlite', connection: dbForm.value.connection, createFile: true },
    })
    sqliteFileExists.value = true
  } catch (e: any) {
    dbError.value = e.data?.message || t('onboarding.db_create_file_error', 'Error creating the file.')
  } finally {
    creatingFile.value = false
  }
}

function dbBody() {
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

async function testDbConnection() {
  testingDb.value = true
  dbConnected.value = false
  dbError.value = ''
  try {
    await $fetch('/api/db-config', { method: 'POST', body: { ...dbBody(), testOnly: true } })
    dbConnected.value = true
  } catch (e: any) {
    dbError.value = e.data?.message || 'Connection failed.'
  } finally {
    testingDb.value = false
  }
}

async function applyDbConfig() {
  applyingDb.value = true
  dbError.value = ''
  try {
    await $fetch('/api/db-config', { method: 'POST', body: dbBody() })
    dbConnected.value = true
    await refreshDbConfig()
    sqliteFileExists.value = dbConfig.value?.fileExists ?? true
  } catch (e: any) {
    dbError.value = e.data?.message || 'Failed to apply configuration.'
    dbConnected.value = false
  } finally {
    applyingDb.value = false
  }
}


// ─── Step 1 : Admin account ────────────────────────────────────────────────────
const adminForm = ref({ name: '', email: '', password: '', confirm: '' })
const adminError = ref('')

async function createAdmin() {
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
    await $fetch('/api/setup', {
      method: 'POST',
      body: { name: adminForm.value.name, email: adminForm.value.email, password: adminForm.value.password },
    })
    await fetchMe()
    currentStep.value = 2
  } catch (e: any) {
    adminError.value = e.data?.message || t('onboarding.admin_creation_error', 'Error creating the account.')
  } finally {
    saving.value = false
  }
}

// ─── Step 2 : UI Languages ─────────────────────────────────────────────────────
const { languages: allWorldLangs, filteredLanguages, searchQuery: uiLangSearch } = useLanguages()

const { data: configData } = await useFetch<{ uiLanguages?: string[]; defaultUiLanguage?: string }>('/api/config')
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

function toggleUiLang(lang: { code: string; name: string; nativeName: string }) {
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

async function saveLanguages() {
  saving.value = true
  try {
    const langs = selectedUiLangs.value.map((code) => {
      const lang = allWorldLangs.find((l) => l.code === code)
      return { code, name: lang?.name || code }
    })
    await $fetch('/api/onboarding', {
      method: 'POST',
      body: { languages: langs, defaultLanguage: defaultUiLang.value },
    })
    currentStep.value = 3
  } catch {
    // silent — onboarding marked complete regardless
  } finally {
    saving.value = false
  }
}

// ─── Step 3 : First project ────────────────────────────────────────────────────
const projectForm = ref({
  name: configData.value?.project?.name || '',
  root_path: '',
  locales_path: configData.value?.project?.localesPath || 'src/locales',
})
const projectError = ref('')

async function saveProject() {
  projectError.value = ''
  if (!projectForm.value.name.trim() || !projectForm.value.root_path.trim()) {
    projectError.value = t('onboarding.project_name_path_required', 'Project name and path are required.')
    return
  }
  saving.value = true
  try {
    await $fetch('/api/projects', {
      method: 'POST',
      body: {
        name: projectForm.value.name.trim(),
        root_path: projectForm.value.root_path.trim(),
        locales_path: projectForm.value.locales_path || 'src/locales',
      },
    })
    currentStep.value = 4
  } catch (e: any) {
    projectError.value = e.data?.message || t('onboarding.project_creation_error', 'Error creating the project.')
  } finally {
    saving.value = false
  }
}

function skipProject() {
  currentStep.value = 4
}

// ─── Hydration sentinel (used by Cypress tests) ────────────────────────────────
const isMounted = ref(false)
onMounted(() => { isMounted.value = true })

// ─── Step 4 : Done ─────────────────────────────────────────────────────────────
async function goToDashboard() {
  await clearNuxtData('auth-status')
  await router.push('/')
}
</script>

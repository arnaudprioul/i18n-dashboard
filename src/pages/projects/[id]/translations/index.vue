<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h1
            class="text-2xl font-bold text-gray-900 dark:text-white"
            data-cy="translations-title"
        >
          {{ t('translations.title', 'Translations') }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
          {{ data?.total || 0 }} {{ t('translations.keys_count', 'keys') }} · {{ languages.length }}
          {{ t('translations.langs_count', 'languages') }}
        </p>
      </div>
      <div class="flex gap-2">
        <u-button
            v-if="userCanManage"
            data-cy="new-key-btn"
            icon="i-heroicons-plus"
            @click="showAddKey = true"
        >
          {{ t('translations.add_key', 'New key') }}
        </u-button>
      </div>
    </div>

    <!-- Filters bar -->
    <div class="flex flex-col sm:flex-row gap-3 mb-5">
      <u-input
          v-model="search"
          :placeholder="t('translations.search', 'Search for a key...')"
          class="flex-1"
          data-cy="translations-search"
          icon="i-heroicons-magnifying-glass"
          @input="debouncedRefresh"
      />
      <u-selectMenu
          v-model="filterLangs"
          :items="langOptions"
          :placeholder="filterLangs.length ? `${filterLangs.length} ${t('translations.language', 'language')}${filterLangs.length > 1 ? 's' : ''}` : t('translations.all_languages', 'All languages')"
          class="w-48"
          multiple
          value-key="value"
          @update:model-value="refresh"
      />
    </div>

    <!-- Status legend pills -->
    <div class="flex gap-2 mb-4 flex-wrap">
      <button
          v-for="s in statusFilters"
          :key="s.value"
          :class="filterStatus === s.value
          ? `${s.activeBg} ${s.activeText} border-transparent`
          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'"
          :data-cy="'filter-' + s.value"
          class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all"
          @click="filterStatus = s.value; refresh()"
      >
        <span
            :class="s.dot"
            class="w-2 h-2 rounded-full"
        />
        {{ s.label }}
      </button>
    </div>

    <!-- Empty state -->
    <div
        v-if="!pending && !data?.data?.length"
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 py-16 text-center"
    >
      <u-icon
          class="text-5xl text-gray-300 dark:text-gray-600 mb-3"
          name="i-heroicons-inbox"
      />
      <p class="text-gray-500 font-medium">
        {{ t('translations.no_results', 'No keys found') }}
      </p>
      <p class="text-gray-400 text-sm mt-1">
        <template v-if="search || filterStatus !== 'all'">
          {{ t('translations.modify_filters', 'Modify your filters or') }}
        </template>
        {{ t('translations.add_or_scan', 'add a key manually or scan your project.') }}
      </p>
      <div class="flex justify-center gap-3 mt-4">
        <u-button
            size="sm"
            @click="showAddKey = true"
        >
          {{ t('translations.add_key', 'New key') }}
        </u-button>
        <u-button
            :loading="scanning"
            color="neutral"
            size="sm"
            variant="outline"
            @click="scanProject"
        >
          {{ t('translations.scan', 'Scan') }}
        </u-button>
        <u-button
            :loading="syncing"
            color="neutral"
            size="sm"
            variant="outline"
            @click="syncFiles"
        >
          {{ t('translations.sync', 'Sync JSON') }}
        </u-button>
      </div>
    </div>

    <!-- Table -->
    <div
        v-else
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
    >
      <!-- Table header -->
      <div
          :style="gridStyle"
          class="grid border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"
      >
        <div class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {{ t('translations.key_label', 'Key') }}
        </div>
        <div
            v-for="lang in visibleLanguages"
            :key="lang.code"
            class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5"
        >
          {{ findLanguage(lang.code)?.nativeName || lang.name }}
          <u-badge
              color="neutral"
              size="xs"
              variant="outline"
          >
            {{ lang.code }}
          </u-badge>
          <u-tooltip
              v-if="filterStatus === 'missing'"
              :text="langsWithMissing.has(lang.code)
              ? t('translations.translate_all', 'Translate all') + ' ' + lang.code.toUpperCase()
              : t('translations.nothing_to_translate', 'Nothing to translate')"
          >
            <u-button
                :disabled="batchTranslating || !langsWithMissing.has(lang.code)"
                :loading="loadingLangs.has(lang.code)"
                color="warning"
                icon="i-heroicons-sparkles"
                size="xs"
                variant="ghost"
                @click.stop="batchTranslateForLang(lang.code)"
            />
          </u-tooltip>
        </div>
        <div class="px-3 py-3"/>
      </div>

      <!-- Loading -->
      <div v-if="pending">
        <div
            v-for="i in 6"
            :key="i"
            :style="gridStyle"
            class="grid border-b border-gray-100 dark:border-gray-800 last:border-0"
        >
          <div class="px-4 py-4">
            <u-skeleton class="h-4 w-3/4"/>
          </div>
          <div
              v-for="j in visibleLanguages.length"
              :key="j"
              class="px-4 py-4"
          >
            <u-skeleton class="h-4"/>
          </div>
          <div class="px-3 py-4"/>
        </div>
      </div>

      <!-- Rows -->
      <div v-else>
        <project-translation-row
            v-for="key in data.data"
            :key="key.id"
            :grid-style="gridStyle"
            :languages="visibleLanguages"
            :project-id="currentProject?.id"
            :translation-key="key"
            @updated="refresh"
        />
      </div>
    </div>

    <!-- Pagination -->
    <div
        v-if="(data?.total || 0) > limit"
        class="flex justify-center mt-5"
    >
      <u-pagination
          v-model:page="page"
          :items-per-page="limit"
          :total="data?.total || 0"
          @update:page="refresh"
      />
    </div>

    <!-- Add Key modal -->
    <u-modal
        v-model:open="showAddKey"
        :title="t('translations.add_key_title', 'New translation key')"
    >
      <template #body>
        <div
            class="space-y-4"
            data-cy="add-key-modal"
        >
          <u-form-field
              :hint="t('translations.key_hint', 'Example: home.title or nav.menu.about')"
              :label="t('translations.key_label', 'Key')"
              required
          >
            <u-input
                v-model="newKey.key"
                class="w-full font-mono"
                placeholder="home.title"
            />
          </u-form-field>
          <u-form-field
              :hint="t('translations.description_hint', 'Context for translators')"
              :label="t('translations.description_label', 'Description')"
          >
            <u-input
                v-model="newKey.description"
                :placeholder="t('translations.description_placeholder', 'Home page title')"
                class="w-full"
            />
          </u-form-field>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <u-button
              color="neutral"
              data-cy="add-key-cancel-btn"
              variant="ghost"
              @click="showAddKey = false"
          >
            {{ t('common.cancel', 'Cancel') }}
          </u-button>
          <u-button
              :loading="addingKey"
              data-cy="add-key-create-btn"
              @click="addKey"
          >
            {{ t('common.create', 'Create') }}
          </u-button>
        </div>
      </template>
    </u-modal>
  </div>
</template>

<script lang="ts" setup>
  import { TRANSLATION_STATUS } from '../../../../enums/translation.enum'

  const route = useRoute()
  const { currentProject } = useProject()
  const { canManageProject } = useAuth()
  const { findLanguage, projectLanguages: languages } = useLanguages()
  const { t } = useT()

  const userCanManage = computed(() =>
      currentProject.value ? canManageProject(currentProject.value.id) : false,
  )

  const search = ref('')
  const filterLangs = ref<string[]>([])
  const filterStatus = ref((route.query.status as string) || 'all')
  const page = ref(1)
  const limit = 25
  const showAddKey = ref(false)
  const newKey = ref({ key: '', description: '' })

  const langOptions = computed(() =>
      languages.value.map((l: any) => ({ label: findLanguage(l.code)?.nativeName || l.name, value: l.code }))
  )

  const visibleLanguages = computed(() =>
      filterLangs.value.length
          ? languages.value.filter((l: any) => filterLangs.value.includes(l.code))
          : languages.value
  )

  const statusFilters = computed(() => [
    {
      value: 'all',
      label: t('status.all', 'All'),
      dot: 'bg-gray-300',
      activeBg: 'bg-gray-100 dark:bg-gray-700',
      activeText: 'text-gray-700 dark:text-gray-200'
    },
    {
      value: 'missing',
      label: t('status.missing', 'Missing'),
      dot: 'bg-red-400',
      activeBg: 'bg-red-50 dark:bg-red-900/20',
      activeText: 'text-red-700 dark:text-red-300'
    },
    {
      value: TRANSLATION_STATUS.DRAFT,
      label: t('status.draft', 'Draft'),
      dot: 'bg-yellow-400',
      activeBg: 'bg-yellow-50 dark:bg-yellow-900/20',
      activeText: 'text-yellow-700 dark:text-yellow-300'
    },
    {
      value: TRANSLATION_STATUS.REVIEWED,
      label: t('status.reviewed', 'Reviewed'),
      dot: 'bg-blue-400',
      activeBg: 'bg-blue-50 dark:bg-blue-900/20',
      activeText: 'text-blue-700 dark:text-blue-300'
    },
    {
      value: TRANSLATION_STATUS.APPROVED,
      label: t('status.approved', 'Approved'),
      dot: 'bg-green-500',
      activeBg: 'bg-green-50 dark:bg-green-900/20',
      activeText: 'text-green-700 dark:text-green-300'
    },
    {
      value: 'unused',
      label: t('status.unused', 'Unused'),
      dot: 'bg-orange-400',
      activeBg: 'bg-orange-50 dark:bg-orange-900/20',
      activeText: 'text-orange-700 dark:text-orange-300'
    },
  ])

  const langsWithMissing = computed(() => {
    if (filterStatus.value !== 'missing' || !data.value?.data) return new Set<string>()
    const set = new Set<string>()
    for (const key of data.value.data) {
      for (const lang of visibleLanguages.value) {
        const tr = (key.translations as any)?.[lang.code]
        if (!tr?.value) set.add(lang.code)
      }
    }
    return set
  })

  const gridStyle = computed(() => ({
    gridTemplateColumns: `minmax(220px, 1.5fr) ${visibleLanguages.value.map(() => 'minmax(160px, 1fr)').join(' ')} 48px`,
  }))

  const queryParams = computed(() => ({
    project_id: currentProject.value?.id,
    search: search.value || undefined,
    lang: filterLangs.value.length === 1 ? filterLangs.value[0] : undefined,
    status: filterStatus.value !== 'all' ? filterStatus.value : undefined,
    page: page.value,
    limit,
  }))

  const {
    data,
    pending,
    refresh,
    addingKey,
    createKey,
    scanning,
    scan,
    syncing,
    sync,
    batchTranslating,
    batchTranslate: doBatchTranslate,
  } = useKeys({ queryParams })

  let searchTimeout: ReturnType<typeof setTimeout>

  function debouncedRefresh () {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      page.value = 1
      refresh()
    }, 300)
  }

  async function addKey () {
    if (!newKey.value.key.trim() || !currentProject.value) return
    const ok = await createKey(currentProject.value.id, newKey.value.key, newKey.value.description)
    if (ok) {
      showAddKey.value = false
      newKey.value = { key: '', description: '' }
    }
  }

  async function scanProject () {
    if (!currentProject.value) return
    await scan(currentProject.value.id)
  }

  async function syncFiles () {
    if (!currentProject.value) return
    await sync(currentProject.value.id)
  }

  const loadingLangs = ref(new Set<string>())

  async function batchTranslateForLang (langCode: string) {
    if (!currentProject.value || loadingLangs.value.has(langCode)) return
    loadingLangs.value = new Set(loadingLangs.value).add(langCode)
    try {
      await doBatchTranslate(currentProject.value.id, langCode)
      await refresh()
    } finally {
      const next = new Set(loadingLangs.value)
      next.delete(langCode)
      loadingLangs.value = next
    }
  }
</script>

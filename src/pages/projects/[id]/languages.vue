<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1
            class="text-2xl font-bold text-gray-900 dark:text-white"
            data-cy="languages-title"
        >
          {{ t('languages.title', 'Languages') }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
          {{ t('languages.subtitle', 'Manage project languages') }}
        </p>
      </div>
      <u-button
          data-cy="languages-add-btn"
          icon="i-heroicons-plus"
          @click="showAdd = true"
      >
        {{ t('languages.add', 'Add a language') }}
      </u-button>
    </div>

    <!-- Skeleton -->
    <div
        v-if="pending"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <u-card
          v-for="i in 3"
          :key="i"
      >
        <div class="flex items-center gap-3 mb-4">
          <u-skeleton class="w-10 h-10 rounded-full shrink-0"/>
          <div class="flex-1 space-y-1.5">
            <u-skeleton class="h-4 w-1/2"/>
            <u-skeleton class="h-3 w-1/4"/>
          </div>
        </div>
        <u-skeleton class="h-2 w-full rounded-full mt-4"/>
        <u-skeleton class="h-3 w-1/3 mt-2"/>
      </u-card>
    </div>

    <!-- Languages list -->
    <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <u-card
          v-for="lang in languages"
          :key="lang.code"
          :data-cy="'language-card-' + lang.code"
          class="relative"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span class="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase">{{
                  lang.code.split('-')[0]
                }}</span>
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">
                {{ findLanguage(lang.code)?.nativeName || lang.name }}
              </p>
              <p class="text-sm text-gray-400">
                {{ lang.code }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <u-badge
                v-if="lang.is_default"
                :data-cy="'lang-default-badge-' + lang.code"
                color="primary"
                size="xs"
            >
              {{ t('languages.default_badge', 'Default') }}
            </u-badge>
            <u-dropdown-menu :items="getLangActions(lang)">
              <u-button
                  color="neutral"
                  icon="i-heroicons-ellipsis-vertical"
                  size="xs"
                  variant="ghost"
              />
            </u-dropdown-menu>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">{{ t('languages.coverage', 'Coverage') }}</span>
            <span
                :data-cy="'lang-coverage-' + lang.code"
                class="font-medium text-gray-700 dark:text-gray-300"
            >
              {{ getCoverage(lang.code).toFixed(2) }}%
            </span>
          </div>
          <div class="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
                :class="getCoverage(lang.code) >= 80 ? 'bg-green-500' : getCoverage(lang.code) >= 50 ? 'bg-yellow-500' : 'bg-red-400'"
                :style="{ width: `${getCoverage(lang.code)}%` }"
                class="h-full rounded-full"
            />
          </div>
          <p class="text-xs text-gray-400 mt-1">
            {{ getTranslatedCount(lang.code) }} / {{ totalKeys }} {{
              t('languages.keys_translated', 'keys translated')
            }}
          </p>

          <!-- Translate missing shortcut -->
          <div
              v-if="!lang.is_default && getMissingCount(lang.code) > 0"
              class="mt-2"
          >
            <u-button
                :disabled="showProgress || (translatingLang !== null && translatingLang !== lang.code)"
                :loading="translatingLang === lang.code"
                color="warning"
                icon="i-heroicons-sparkles"
                size="xs"
                variant="ghost"
                @click="translateMissing(lang)"
            >
              {{ t('languages.translate_missing', 'Translate missing') }}
              <span class="opacity-60">({{ getMissingCount(lang.code) }})</span>
            </u-button>
          </div>

          <!-- Fallback indicator -->
          <div class="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
                class="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors w-full text-left"
                @click="openFallbackModal(lang)"
            >
              <u-icon
                  class="text-xs shrink-0"
                  name="i-heroicons-arrow-uturn-left"
              />
              <span v-if="lang.fallback_code">
                {{ t('languages.fallback_label', 'Fallback') }}: <code
                  class="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{{ lang.fallback_code }}</code>
              </span>
              <span v-else-if="getAutoBcp47Fallback(lang.code)">
                {{ t('languages.fallback_auto', 'Auto fallback') }}: <code
                  class="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{{
                  getAutoBcp47Fallback(lang.code)
                }}</code>
                <u-badge
                    class="ml-1"
                    color="neutral"
                    size="xs"
                    variant="soft"
                >BCP 47</u-badge>
              </span>
              <span
                  v-else
                  class="italic"
              >{{ t('languages.no_fallback', 'No fallback') }}</span>
              <u-icon
                  class="ml-auto text-xs opacity-40"
                  name="i-heroicons-pencil-square"
              />
            </button>
          </div>
        </div>
      </u-card>

      <!-- Empty state -->
      <div
          v-if="!languages.length"
          class="col-span-full text-center py-16"
      >
        <u-icon
            class="text-5xl text-gray-300 dark:text-gray-600 mb-3"
            name="i-heroicons-flag"
        />
        <p class="text-gray-400 font-medium">
          {{ t('languages.none', 'No language configured') }}
        </p>
        <p class="text-gray-400 text-sm mt-1">
          {{ t('languages.none_hint', 'Add languages to start translating.') }}
        </p>
        <u-button
            class="mt-4"
            @click="showAdd = true"
        >
          {{ t('languages.add', 'Add a language') }}
        </u-button>
      </div>
    </div>

    <!-- Add Language modal -->
    <u-modal
        v-model:open="showAdd"
        :title="t('languages.add_modal_title', 'Add a language')"
        data-cy="add-language-modal"
    >
      <template #body>
        <div class="space-y-4">
          <u-form-field
              :label="t('languages.language_label', 'Language')"
              required
          >
            <u-input
                v-model="langSearch"
                :placeholder="t('onboarding.languages_search', 'Search for a language...')"
                class="w-full mb-2"
                data-cy="lang-search-input"
                icon="i-heroicons-magnifying-glass"
            />
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div class="max-h-52 overflow-y-auto">
                <button
                    v-for="lang in filteredWorldLangs"
                    :key="lang.code"
                    :class="selectedWorldLang?.code === lang.code ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'"
                    class="w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    @click="selectWorldLang(lang)"
                >
                  <span class="font-mono text-xs text-gray-400 w-14 shrink-0">{{ lang.code }}</span>
                  <span class="flex-1">{{ lang.nativeName }}</span>
                  <span class="text-xs text-gray-400 shrink-0">{{ lang.name }}</span>
                  <u-icon
                      v-if="selectedWorldLang?.code === lang.code"
                      class="text-primary-500 shrink-0"
                      name="i-heroicons-check"
                  />
                </button>
                <div
                    v-if="!filteredWorldLangs.length"
                    class="px-3 py-4 text-sm text-center text-gray-400"
                >
                  {{ t('languages.none_found', 'No language found') }}
                </div>
              </div>

              <!-- Custom BCP 47 entry when search looks like a code -->
              <div
                  v-if="langSearch && isValidBcp47(langSearch) && !filteredWorldLangs.find(l => l.code.toLowerCase() === langSearch.toLowerCase())"
                  class="border-t border-gray-200 dark:border-gray-700"
              >
                <button
                    :class="selectedWorldLang?.code === langSearch ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400'"
                    class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    @click="useCustomCode(langSearch)"
                >
                  <u-icon
                      class="shrink-0 text-amber-500"
                      name="i-heroicons-plus-circle"
                  />
                  <span class="flex-1">{{ t('languages.use_code', 'Use code') }} <code
                      class="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{{ langSearch }}</code></span>
                  <u-badge
                      color="warning"
                      size="xs"
                      variant="soft"
                  >
                    BCP 47
                  </u-badge>
                </button>
              </div>
            </div>
          </u-form-field>

          <!-- Selected preview -->
          <div
              v-if="selectedWorldLang"
              class="flex items-center gap-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-3 py-2"
          >
            <div
                class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0">
              <span class="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase">{{
                  selectedWorldLang.code.split('-')[0]
                }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {{ selectedWorldLang.nativeName }}
              </p>
              <p class="text-xs font-mono text-gray-400">
                {{ selectedWorldLang.code }}
              </p>
            </div>
            <u-badge
                v-if="selectedWorldLang.code.includes('-')"
                color="info"
                size="xs"
                variant="soft"
            >
              BCP 47
            </u-badge>
          </div>

          <u-form-field label="">
            <UCheckbox
                v-model="newLang.is_default"
                :label="t('languages.set_as_default', 'Set as default language')"
            />
          </u-form-field>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <u-button
              color="neutral"
              data-cy="add-language-cancel-btn"
              variant="ghost"
              @click="showAdd = false"
          >
            {{ t('common.cancel', 'Cancel') }}
          </u-button>
          <u-button
              :disabled="!newLang.code"
              :loading="adding"
              @click="addLanguage"
          >
            {{ t('languages.add', 'Add') }}
          </u-button>
        </div>
      </template>
    </u-modal>

    <!-- Fallback config modal -->
    <u-modal
        v-model:open="showFallbackModal"
        :title="t('languages.fallback_modal_title', 'Configure fallback')"
    >
      <template #body>
        <div class="space-y-4">
          <div
              v-if="fallbackTarget"
              class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
          >
            <span>{{ t('languages.language_label', 'Language') }}:</span>
            <code
                class="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-semibold text-gray-800 dark:text-gray-200">{{
                fallbackTarget.code
              }}</code>
          </div>

          <!-- Info box -->
          <div
              class="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2.5 text-xs text-blue-700 dark:text-blue-300 flex gap-2">
            <u-icon
                class="shrink-0 mt-0.5"
                name="i-heroicons-information-circle"
            />
            <div>
              {{ t('languages.fallback_info', 'When a key is missing in') }} <strong>{{ fallbackTarget?.code }}</strong>,
              {{
                t('languages.fallback_info2', 'the dashboard returns the value from the fallback language. Useful for')
              }} <code class="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">fr-CA → fr</code>
              {{ t('languages.fallback_info3', 'or regional sub-variants.') }}
            </div>
          </div>

          <u-form-field :label="t('languages.fallback_language', 'Fallback language')">
            <div class="space-y-1.5">
              <!-- Auto BCP 47 option -->
              <label
                  v-if="fallbackTarget && getAutoBcp47Fallback(fallbackTarget.code)"
                  :class="fallbackChoice === '__auto__'
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors"
              >
                <input
                    v-model="fallbackChoice"
                    class="hidden"
                    type="radio"
                    value="__auto__"
                >
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Auto BCP 47 —
                    <code class="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">{{
                        getAutoBcp47Fallback(fallbackTarget.code)
                      }}</code>
                  </p>
                  <p class="text-xs text-gray-400">
                    {{ t('languages.fallback_auto_detect', 'Automatic detection from language code') }}</p>
                </div>
                <u-badge
                    color="info"
                    size="xs"
                    variant="soft"
                >{{ t('languages.recommended', 'Recommended') }}
                </u-badge>
                <div
                    :class="fallbackChoice === '__auto__' ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-600'"
                    class="w-4 h-4 rounded-full border-2 shrink-0"
                />
              </label>

              <!-- None option -->
              <label
                  :class="fallbackChoice === '__none__'
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors"
              >
                <input
                    v-model="fallbackChoice"
                    class="hidden"
                    type="radio"
                    value="__none__"
                >
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {{ t('languages.no_fallback', 'No fallback') }}</p>
                  <p class="text-xs text-gray-400">
                    {{ t('languages.no_fallback_hint', 'Returns 404 if language is missing') }}</p>
                </div>
                <div
                    :class="fallbackChoice === '__none__' ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-600'"
                    class="w-4 h-4 rounded-full border-2 shrink-0"
                />
              </label>

              <!-- Language list -->
              <label
                  v-for="l in fallbackCandidates"
                  :key="l.code"
                  :class="fallbackChoice === l.code
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors"
              >
                <input
                    v-model="fallbackChoice"
                    :value="l.code"
                    class="hidden"
                    type="radio"
                >
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {{ findLanguage(l.code)?.nativeName || l.name }}
                    <code class="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded ml-1">{{ l.code }}</code>
                  </p>
                  <p class="text-xs text-gray-400">{{ getCoverage(l.code).toFixed(2) }}%
                    {{ t('languages.translated', 'translated') }}</p>
                </div>
                <u-badge
                    v-if="l.is_default"
                    color="primary"
                    size="xs"
                    variant="soft"
                >{{ t('languages.default_badge', 'Default') }}
                </u-badge>
                <div
                    :class="fallbackChoice === l.code ? 'border-primary-500 bg-primary-500' : 'border-gray-300 dark:border-gray-600'"
                    class="w-4 h-4 rounded-full border-2 shrink-0"
                />
              </label>
            </div>
          </u-form-field>

          <!-- Chain preview -->
          <div
              v-if="fallbackChainPreview.length > 1"
              class="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2"
          >
            <p class="text-xs text-gray-400 mb-1.5">
              {{ t('languages.resolution_chain', 'Resolution chain:') }}
            </p>
            <div class="flex items-center gap-1.5 flex-wrap">
              <template
                  v-for="(code, i) in fallbackChainPreview"
                  :key="i"
              >
                <code
                    class="text-xs font-mono bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">{{
                    code
                  }}</code>
                <span
                    v-if="i < fallbackChainPreview.length - 1"
                    class="text-gray-400 text-xs"
                >→</span>
              </template>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <u-button
              color="neutral"
              variant="ghost"
              @click="showFallbackModal = false"
          >
            {{ t('common.cancel', 'Cancel') }}
          </u-button>
          <u-button
              :loading="savingFallback"
              @click="saveFallback"
          >
            {{ t('common.save', 'Save') }}
          </u-button>
        </div>
      </template>
    </u-modal>

    <!-- Translation progress modal -->
    <u-modal
        v-model:open="showProgress"
        :dismissible="false"
        :title="`${t('languages.translating_to', 'Translating to')} ${progressLangName}`"
    >
      <template #body>
        <div class="space-y-4 py-2">
          <div
              v-if="progressTotal === 0"
              class="flex items-center gap-3 text-sm text-gray-500"
          >
            <u-icon
                class="animate-spin text-primary-500 text-xl shrink-0"
                name="i-heroicons-arrow-path"
            />
            {{ t('languages.initializing', 'Initializing…') }}
          </div>
          <template v-else>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">{{ progressDone }} / {{
                  progressTotal
                }} {{ t('languages.keys', 'keys') }}</span>
              <span class="font-semibold text-gray-900 dark:text-white">{{ progressPercent }}%</span>
            </div>
            <div class="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                  :style="{ width: `${progressPercent}%` }"
                  class="h-full bg-primary-500 rounded-full transition-all duration-500"
              />
            </div>
            <p class="text-xs text-gray-400 text-center">
              {{ t('languages.auto_translate_via', 'Auto-translation via Google Translate') }} —
              {{ progressTotal - progressDone }} {{ t('languages.remaining', 'remaining') }}
            </p>
          </template>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-between items-center w-full">
          <u-button
              color="neutral"
              icon="i-heroicons-arrow-down-tray"
              size="sm"
              variant="ghost"
              @click="sendToBackground"
          >
            {{ t('languages.send_to_background', 'Send to background') }}
          </u-button>
          <span
              v-if="progressStatus === 'done'"
              class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium"
          >
            <u-icon name="i-heroicons-check-circle"/>
            {{ t('languages.done', 'Done!') }}
          </span>
          <u-button
              v-if="progressStatus === 'done'"
              @click="closeProgress"
          >
            {{ t('common.close', 'Close') }}
          </u-button>
        </div>
      </template>
    </u-modal>

    <!-- Delete confirm modal -->
    <u-modal
        v-model:open="showDeleteConfirm"
        :title="t('languages.delete_modal_title', 'Delete language')"
    >
      <template #body>
        <p class="text-gray-600 dark:text-gray-400">
          {{ t('languages.delete_confirm', 'Delete') }} <strong>{{ deletingLang?.name }}</strong>?
          {{ t('languages.delete_confirm2', 'This will also delete the') }}
          <strong>{{ getTranslatedCount(deletingLang?.code) }}</strong>
          {{ t('languages.delete_confirm3', 'associated translations.') }}
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
              :loading="deleting"
              color="error"
              @click="deleteLanguage"
          >
            {{ t('common.delete', 'Delete') }}
          </u-button>
        </div>
      </template>
    </u-modal>
  </div>
</template>

<script lang="ts" setup>
  const toast = useToast()
  const { t } = useT()
  const { currentProject } = useProject()

  const showAdd = ref(false)
  const showDeleteConfirm = ref(false)
  const deletingLang = ref<any>(null)

  const newLang = ref({ code: '', name: '', is_default: false })

  const {
    projectLanguages: languages,
    pending,
    adding,
    addLanguage: doAddLanguage,
    deleting,
    deleteLanguage: doDeleteLanguage,
    setDefault: doSetDefault,
    setFallback: doSetFallback,
    startTranslateAll,
    refresh: refreshLanguages,
    filteredLanguages,
    searchQuery: langSearch,
    findLanguage,
    showProgress,
    progressLangName,
    progressTotal,
    progressDone,
    progressPercent,
    progressStatus,
    startPolling,
    sendToBackground: doSendToBackground,
    closeProgress,
  } = useLanguages()

  const { stats } = useStats()

  const totalKeys = computed(() => (stats.value?.languages?.[0] as any)?.total || (stats.value as any)?.totalKeys || 0)

  function getTranslatedCount (code: string): number {
    return (stats.value?.languages as any[])?.find((l: any) => l.code === code)?.translated || 0
  }

  function getCoverage (code: string): number {
    return (stats.value?.languages as any[])?.find((l: any) => l.code === code)?.coverage || 0
  }

  // World language selector
  const selectedWorldLang = ref<{ code: string; name: string; nativeName: string } | null>(null)

  const existingCodes = computed(() => languages.value.map((l: any) => l.code))
  const filteredWorldLangs = computed(() =>
      filteredLanguages.value.filter((l) => !existingCodes.value.includes(l.code)),
  )

  function selectWorldLang (lang: { code: string; name: string; nativeName: string }) {
    selectedWorldLang.value = lang
    newLang.value.code = lang.code
    newLang.value.name = lang.name
  }

  // BCP 47 custom code: language[-Script][-REGION][-variant]
  function isValidBcp47 (code: string): boolean {
    return /^[a-z]{2,8}(-[A-Za-z0-9]{1,8})*$/i.test(code) && code.length >= 2
  }

  function useCustomCode (code: string) {
    const normalized = code.trim()
    selectedWorldLang.value = { code: normalized, name: normalized, nativeName: normalized }
    newLang.value.code = normalized
    newLang.value.name = normalized
  }

  // ── Fallback configuration ────────────────────────────────────────────────
  const showFallbackModal = ref(false)
  const fallbackTarget = ref<any>(null)
  const fallbackChoice = ref<string>('__auto__')
  const savingFallback = ref(false)

  function getAutoBcp47Fallback (code: string): string | null {
    const parts = code.split('-')
    if (parts.length <= 1) return null
    parts.pop()
    const base = parts.join('-')
    // Only show auto if the base language actually exists in the project
    return languages.value.find((l: any) => l.code === base) ? base : null
  }

  const fallbackCandidates = computed(() =>
      (languages.value as any[]).filter((l) =>
          fallbackTarget.value && l.code !== fallbackTarget.value.code,
      ),
  )

  const fallbackChainPreview = computed(() => {
    if (!fallbackTarget.value) return []
    const chain: string[] = [fallbackTarget.value.code]
    const choice = fallbackChoice.value
    if (choice === '__none__') return chain
    const next = choice === '__auto__'
        ? getAutoBcp47Fallback(fallbackTarget.value.code)
        : choice
    if (next) {
      chain.push(next)
      // Show one more level if that lang also has a fallback
      const nextLang = (languages.value as any[]).find(l => l.code === next)
      if (nextLang?.fallback_code) chain.push(nextLang.fallback_code)
      else {
        const autoNext = getAutoBcp47Fallback(next)
        if (autoNext) chain.push(autoNext)
      }
    }
    return chain
  })

  function openFallbackModal (lang: any) {
    fallbackTarget.value = lang
    if (lang.fallback_code) {
      fallbackChoice.value = lang.fallback_code
    } else if (getAutoBcp47Fallback(lang.code)) {
      fallbackChoice.value = '__auto__'
    } else {
      fallbackChoice.value = '__none__'
    }
    showFallbackModal.value = true
  }

  async function saveFallback () {
    if (!fallbackTarget.value) return
    savingFallback.value = true
    try {
      const explicit = fallbackChoice.value === '__auto__' || fallbackChoice.value === '__none__'
          ? null
          : fallbackChoice.value
      await doSetFallback(fallbackTarget.value, explicit)
      toast.add({ title: t('languages.fallback_saved', 'Fallback configured'), color: 'success' })
      showFallbackModal.value = false
    } catch (e: any) {
      toast.add({ title: t('common.error', 'Error'), description: e.message, color: 'error' })
    } finally {
      savingFallback.value = false
    }
  }

  function getLangActions (lang: any) {
    return [
      [
        ...(lang.is_default ? [] : [{
          label: t('languages.set_default', 'Set as default'),
          icon: 'i-heroicons-star',
          onSelect: () => doSetDefault(lang),
        }]),
        {
          label: t('common.delete', 'Delete'),
          icon: 'i-heroicons-trash',
          color: 'error' as const,
          onSelect: () => confirmDelete(lang),
        },
      ],
    ]
  }

  function sendToBackground () {
    doSendToBackground(() => {
      refreshLanguages()
      refreshNuxtData('project-stats')
    })
  }

  const translatingLang = ref<string | null>(null)

  function getMissingCount (code: string): number {
    return Math.max(0, totalKeys.value - getTranslatedCount(code))
  }

  async function translateMissing (lang: any) {
    if (translatingLang.value) return
    translatingLang.value = lang.code
    try {
      const langName = findLanguage(lang.code)?.nativeName || lang.name
      const jobId = await startTranslateAll(lang.code, lang.name)
      if (jobId) startPolling(jobId, langName)
    } finally {
      translatingLang.value = null
    }
  }

  // ── Add language ─────────────────────────────────────────────────────────
  async function addLanguage () {
    if (!newLang.value.code || !newLang.value.name || !currentProject.value) return
    try {
      await doAddLanguage({ code: newLang.value.code, name: newLang.value.name, is_default: newLang.value.is_default })
      showAdd.value = false

      if (totalKeys.value > 0 && !currentProject.value.is_system) {
        const langName = selectedWorldLang.value?.nativeName || newLang.value.name
        const jobId = await startTranslateAll(newLang.value.code, newLang.value.name)
        if (jobId) startPolling(jobId, langName)
      } else {
        toast.add({ title: t('languages.added', 'Language added'), color: 'success' })
      }

      newLang.value = { code: '', name: '', is_default: false }
      selectedWorldLang.value = null
      langSearch.value = ''
    } catch (e: any) {
      toast.add({ title: t('common.error', 'Error'), description: e.message, color: 'error' })
    }
  }

  function confirmDelete (lang: any) {
    deletingLang.value = lang
    showDeleteConfirm.value = true
  }

  async function deleteLanguage () {
    if (!deletingLang.value) return
    await doDeleteLanguage(deletingLang.value.code)
    showDeleteConfirm.value = false
  }
</script>

<template>
  <div>
    <div
        v-if="pending"
        class="p-4 lg:p-6 max-w-6xl mx-auto space-y-4"
    >
      <div class="flex items-start gap-3">
        <u-skeleton class="w-8 h-8 rounded-lg shrink-0 mt-0.5"/>
        <div class="flex-1 space-y-2">
          <u-skeleton class="h-6 w-1/2"/>
          <u-skeleton class="h-3 w-1/4"/>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-start">
        <div class="lg:col-span-2 space-y-3">
          <u-card
              v-for="i in 3"
              :key="i"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <u-skeleton class="h-5 w-10 rounded"/>
                  <u-skeleton class="h-4 w-24"/>
                </div>
                <u-skeleton class="h-5 w-16 rounded"/>
              </div>
            </template>
            <u-skeleton class="h-12 w-full rounded-lg"/>
          </u-card>
        </div>
        <div class="space-y-4">
          <u-card>
            <template #header>
              <u-skeleton class="h-4 w-24"/>
            </template>
            <u-skeleton class="h-16 w-full"/>
          </u-card>
          <u-card>
            <template #header>
              <u-skeleton class="h-4 w-8"/>
            </template>
            <div class="space-y-2">
              <u-skeleton class="h-3 w-3/4"/>
              <u-skeleton class="h-3 w-1/2"/>
              <u-skeleton class="h-3 w-2/3"/>
            </div>
          </u-card>
        </div>
      </div>
    </div>

    <div
        v-else-if="keyData"
        class="p-4 lg:p-6 max-w-6xl mx-auto space-y-4"
    >
      <!-- Header -->
      <div class="flex items-start gap-3">
        <u-button
            :to="`/projects/${projectId}/translations`"
            class="mt-0.5 shrink-0"
            color="neutral"
            data-cy="key-back-link"
            icon="i-heroicons-arrow-left"
            size="xs"
            variant="ghost"
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h1
                class="text-lg font-mono font-bold text-gray-900 dark:text-white break-all"
                data-cy="key-title"
            >
              {{ keyData.key }}
            </h1>
            <u-badge
                v-if="keyData.is_unused"
                color="warning"
                size="xs"
                variant="subtle"
            >
              <u-icon
                  class="mr-1"
                  name="i-heroicons-exclamation-triangle"
              />
              {{ t('status.unused', 'Unused') }}
            </u-badge>
          </div>
          <p class="text-xs text-gray-400 mt-0.5">
            {{ coverageCount }} / {{ keyData.languages.length }} {{ t('translations.langs_count', 'languages') }}
          </p>
        </div>
        <u-dropdown-menu
            v-if="keyActions[0]?.length"
            :items="keyActions"
        >
          <u-button
              color="neutral"
              icon="i-heroicons-ellipsis-vertical"
              size="sm"
              variant="ghost"
          />
        </u-dropdown-menu>
      </div>

      <!-- Body: 2 columns -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 items-start">
        <!-- ── Left : Translation cards ───────────────────────────────────── -->
        <div class="lg:col-span-2 space-y-3">
          <u-card
              v-for="lang in keyData.languages"
              :key="lang.code"
          >
            <template #header>
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span
                      class="font-mono text-xs font-bold bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 uppercase">{{
                      lang.code
                    }}</span>
                  <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{
                      findLanguage(lang.code)?.nativeName || lang.name
                    }}</span>
                  <u-badge
                      v-if="lang.is_default"
                      color="primary"
                      size="xs"
                      variant="soft"
                  >
                    {{ t('languages.default_badge', 'Default') }}
                  </u-badge>
                </div>
                <div class="flex items-center gap-1">
                  <u-badge
                      :color="statusColor(lang.code)"
                      :data-cy="'translation-status-' + lang.code"
                      size="xs"
                      variant="soft"
                  >
                    {{ statusLabel(lang.code) }}
                  </u-badge>
                  <u-tooltip
                      :text="sourceText ? `${t('translations.translate_to', 'Translate to')} ${findLanguage(lang.code)?.nativeName || lang.name}` : t('translations.no_source', 'No source available')">
                    <u-button
                        :disabled="!sourceText || editingLang === lang.code"
                        :loading="translating === lang.code"
                        color="warning"
                        icon="i-heroicons-sparkles"
                        size="xs"
                        variant="ghost"
                        @click="autoTranslate(lang)"
                    />
                  </u-tooltip>
                  <u-dropdown-menu :items="statusActions(lang.code)">
                    <u-button
                        color="neutral"
                        icon="i-heroicons-ellipsis-vertical"
                        size="xs"
                        variant="ghost"
                    />
                  </u-dropdown-menu>
                </div>
              </div>
            </template>

            <div class="space-y-3">
              <!-- Rejected notice -->
              <div
                  v-if="getStatus(lang.code) === 'rejected'"
                  class="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
              >
                <u-icon
                    class="shrink-0"
                    name="i-heroicons-x-circle"
                />
                {{ t('key.rejected_notice', 'This translation was rejected. Please update it.') }}
              </div>

              <!-- Edit mode -->
              <template v-if="editingLang === lang.code">
                <!-- Plural editor -->
                <project-plural-editor
                    v-if="pluralMode"
                    v-model="editValue"
                />

                <!-- Single textarea -->
                <div
                    v-else
                    :ref="el => activeTextareaWrapper = el as HTMLElement"
                >
                  <u-textarea
                      v-model="editValue"
                      :data-cy="'translation-textarea-' + lang.code"
                      :rows="3"
                      autofocus
                      class="w-full"
                      @keydown.ctrl.enter="saveTranslation(lang.code)"
                      @keydown.meta.enter="saveTranslation(lang.code)"
                      @keydown.escape="editingLang = null"
                  />
                </div>

                <!-- Insertion helpers toolbar -->
                <div
                    class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 pb-1 border-b border-gray-100 dark:border-gray-800">
                  <!-- Named params -->
                  <template v-if="detectedParams.length">
                    <div class="flex items-center gap-1 flex-wrap">
                      <span class="text-xs text-gray-400">{{ t('key.params_label', 'Params:') }}</span>
                      <button
                          v-for="param in detectedParams"
                          :key="param"
                          class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                          @mousedown.prevent="insertAtCursor('{' + param + '}')"
                      >
                        <u-icon
                            class="text-xs opacity-60"
                            name="i-heroicons-cursor-arrow-rays"
                        />
                        {{ '{' + param + '}' }}
                      </button>
                    </div>
                  </template>

                  <!-- Literal / escape special chars -->
                  <div class="flex items-center gap-1 flex-wrap">
                    <span class="text-xs text-gray-400">{{ t('key.escapes_label', 'Escapes:') }}</span>
                    <u-tooltip
                        v-for="esc in ALL_ESCAPES"
                        :key="esc.insert"
                        :text="esc.hint"
                    >
                      <button
                          class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                          @mousedown.prevent="insertAtCursor(esc.insert)"
                      >
                        {{ esc.label }}
                      </button>
                    </u-tooltip>
                  </div>

                  <!-- Modifiers -->
                  <div class="flex items-center gap-1 flex-wrap">
                    <span class="text-xs text-gray-400">{{ t('key.modifiers_label', 'Modifiers:') }}</span>
                    <u-tooltip
                        v-for="mod in LINK_MODIFIERS"
                        :key="mod.prefix"
                        :text="mod.hint"
                    >
                      <button
                          class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
                          @mousedown.prevent="insertAtCursor(mod.prefix)"
                      >
                        {{ mod.prefix }}
                      </button>
                    </u-tooltip>
                  </div>

                  <!-- Linked key -->
                  <project-linked-key-picker
                      :project-id="currentProject?.id"
                      @select="insertLinkedKey"
                  />
                </div>

                <!-- Actions row -->
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                  <u-button
                      :data-cy="'save-translation-btn-' + lang.code"
                      :loading="saving === lang.code"
                      size="xs"
                      @click="saveTranslation(lang.code)"
                  >
                    {{ t('translations.save', 'Save') }}
                  </u-button>
                  <u-button
                      :data-cy="'cancel-translation-btn-' + lang.code"
                      color="neutral"
                      size="xs"
                      variant="ghost"
                      @click="editingLang = null"
                  >
                    {{ t('translations.cancel', 'Cancel') }}
                  </u-button>
                  <div class="ml-auto flex items-center gap-1.5">
                    <u-tooltip
                        :text="pluralMode ? t('key.back_to_simple', 'Back to simple edit') : t('key.switch_to_plural', 'Switch to plural editor (form1 | form2 | …)')">
                      <u-button
                          :color="pluralMode ? 'success' : 'neutral'"
                          :variant="pluralMode ? 'soft' : 'ghost'"
                          icon="i-heroicons-bars-3-bottom-left"
                          size="xs"
                          @click="togglePluralMode(lang.code)"
                      >
                        {{
                          pluralMode ? `${editValue.split(' | ').length} ${t('key.forms', 'forms')}` : t('key.plural', 'Plural')
                        }}
                      </u-button>
                    </u-tooltip>
                  </div>
                </div>
              </template>

              <!-- Read mode -->
              <template v-else>
                <!-- Plural display -->
                <div
                    v-if="getTranslationValue(lang.code) && getPluralForms(lang.code).length > 1"
                    :data-cy="'translation-value-' + lang.code"
                    class="cursor-pointer group"
                    @click="startEdit(lang)"
                >
                  <div class="flex items-center gap-1.5 mb-1.5">
                    <u-badge
                        color="success"
                        icon="i-heroicons-bars-3-bottom-left"
                        size="xs"
                        variant="soft"
                    >
                      {{ getPluralForms(lang.code).length }} {{ t('key.plural_forms', 'plural forms') }}
                    </u-badge>
                  </div>
                  <div class="space-y-1">
                    <div
                        v-for="(form, i) in getPluralForms(lang.code)"
                        :key="i"
                        class="flex items-start gap-2 px-2 py-1 rounded group-hover:bg-gray-50 dark:group-hover:bg-gray-800/60 transition-colors"
                    >
                      <span class="text-xs font-mono text-green-500 shrink-0 w-10 pt-0.5">{{
                          PLURAL_FORM_LABELS[i] ?? `[${i}]`
                        }}</span>
                      <span class="text-sm text-gray-700 dark:text-gray-300 leading-snug">{{ form.trim() }}</span>
                    </div>
                  </div>
                </div>
                <!-- Single value display -->
                <p
                    v-else-if="getTranslationValue(lang.code)"
                    :data-cy="'translation-value-' + lang.code"
                    class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 whitespace-pre-wrap px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
                    @click="startEdit(lang)"
                >
                  {{ getTranslationValue(lang.code) }}
                </p>
                <button
                    v-else
                    :data-cy="'translation-value-' + lang.code"
                    class="text-sm text-gray-400 italic hover:text-primary-500 transition-colors px-2 py-1.5"
                    @click="startEdit(lang)"
                >
                  {{ t('translations.click_to_add', 'Click to add...') }}
                </button>
              </template>

              <!-- History -->
              <div
                  v-if="keyData.translations[lang.code]?.history?.length"
                  class="border-t border-gray-100 dark:border-gray-800 pt-3"
              >
                <button
                    class="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-2"
                    @click="toggleHistory(lang.code)"
                >
                  <u-icon
                      :name="expandedHistory.includes(lang.code) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"/>
                  {{ t('translations.history', 'History') }} · {{ keyData.translations[lang.code].history.length }}
                </button>

                <div
                    v-if="expandedHistory.includes(lang.code)"
                    class="space-y-2"
                >
                  <div
                      v-for="entry in keyData.translations[lang.code].history"
                      :key="entry.id"
                      class="group flex items-start gap-2 text-xs p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div class="flex-1 min-w-0 space-y-1">
                      <div class="flex items-center gap-2 text-gray-400">
                        <u-icon name="i-heroicons-clock"/>
                        <span>{{ formatDate(entry.changed_at) }}</span>
                        <u-badge
                            color="neutral"
                            size="xs"
                            variant="soft"
                        >
                          {{ entry.changed_by || 'user' }}
                        </u-badge>
                      </div>
                      <div class="flex gap-2 items-start flex-wrap">
                        <span
                            v-if="entry.old_value"
                            class="line-through text-red-400 max-w-xs truncate"
                        >{{ entry.old_value }}</span>
                        <u-icon
                            v-if="entry.old_value"
                            class="text-gray-300 shrink-0 mt-0.5"
                            name="i-heroicons-arrow-right"
                        />
                        <span class="text-gray-700 dark:text-gray-300 break-words">{{ entry.new_value }}</span>
                      </div>
                    </div>
                    <u-button
                        v-if="entry.new_value && entry.new_value !== getTranslationValue(lang.code)"
                        :loading="restoring === `${lang.code}-${entry.id}`"
                        class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        color="neutral"
                        icon="i-heroicons-arrow-uturn-left"
                        size="xs"
                        variant="soft"
                        @click="restoreVersion(lang.code, entry)"
                    >
                      {{ t('key.restore', 'Restore') }}
                    </u-button>
                  </div>
                </div>
              </div>
            </div>
          </u-card>
        </div>

        <!-- ── Right : Key info ───────────────────────────────────────────── -->
        <div class="space-y-4">
          <!-- Description -->
          <u-card>
            <template #header>
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {{ t('translations.description_label', 'Description') }}
                </p>
                <u-button
                    v-if="!editingDescription"
                    color="neutral"
                    icon="i-heroicons-pencil"
                    size="xs"
                    variant="ghost"
                    @click="startEditDescription"
                />
              </div>
            </template>
            <template v-if="editingDescription">
              <u-textarea
                  v-model="descriptionDraft"
                  :placeholder="t('translations.add_description', 'Add a description…')"
                  :rows="3"
                  autofocus
                  class="w-full"
              />
              <div class="flex gap-2 mt-2">
                <u-button
                    :loading="savingDescription"
                    size="xs"
                    @click="saveDescription"
                >
                  {{ t('translations.save', 'Save') }}
                </u-button>
                <u-button
                    color="neutral"
                    size="xs"
                    variant="ghost"
                    @click="editingDescription = false"
                >
                  {{ t('translations.cancel', 'Cancel') }}
                </u-button>
              </div>
            </template>
            <template v-else>
              <p
                  v-if="keyData.description"
                  class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary-500 transition-colors"
                  data-cy="key-description"
                  @click="startEditDescription"
              >
                {{ keyData.description }}
              </p>
              <button
                  v-else
                  class="text-sm text-gray-400 italic hover:text-primary-500 transition-colors"
                  @click="startEditDescription"
              >
                {{ t('translations.add_description', 'Add a description…') }}
              </button>
            </template>
          </u-card>

          <!-- Metadata -->
          <u-card>
            <template #header>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {{ t('translations.metadata_info', 'info') }}
              </p>
            </template>
            <div class="space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-2">
                <u-icon
                    class="shrink-0"
                    name="i-heroicons-calendar"
                />
                <span>{{ formatDate(keyData.created_at) }}</span>
              </div>
              <div
                  v-if="keyData.last_scanned_at"
                  class="flex items-center gap-2"
              >
                <u-icon
                    class="shrink-0"
                    name="i-heroicons-magnifying-glass"
                />
                <span>{{ formatDate(keyData.last_scanned_at) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <u-icon
                    class="shrink-0"
                    name="i-heroicons-language"
                />
                <span>{{ coverageCount }} / {{ keyData.languages.length }} {{
                    t('translations.langs_count', 'languages')
                  }}</span>
              </div>
            </div>
          </u-card>

          <!-- Usages -->
          <u-card v-if="keyData.usages.length">
            <template #header>
              <div class="flex items-center gap-2">
                <u-icon
                    class="text-gray-400 shrink-0"
                    name="i-heroicons-code-bracket"
                />
                <p
                    class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                    data-cy="history-section"
                >
                  {{ keyData.usages.length }} {{
                    keyData.usages.length > 1 ? t('translations.references_plural', 'references') : t('translations.references', 'reference')
                  }}
                </p>
              </div>
            </template>
            <div
                class="space-y-3"
                data-cy="key-usages"
            >
              <div
                  v-for="(usage, i) in keyData.usages"
                  :key="i"
                  class="text-xs"
              >
                <p
                    :title="usage.file_path"
                    class="font-mono text-gray-600 dark:text-gray-400 truncate"
                >
                  {{ usage.file_path }}
                </p>
                <div class="flex items-center gap-2 text-gray-400 mt-0.5">
                  <span>{{ t('translations.line', 'line') }} {{ usage.line_number }}</span>
                  <u-badge
                      color="neutral"
                      size="xs"
                      variant="soft"
                  >
                    {{ usage.detected_function }}
                  </u-badge>
                </div>
              </div>
            </div>
          </u-card>
        </div>
      </div>
    </div>

    <!-- Delete confirm modal -->
    <u-modal
        v-model:open="showDeleteConfirm"
        :title="t('translations.delete_key', 'Delete key')"
    >
      <template #body>
        <p class="text-gray-600 dark:text-gray-400">
          {{ t('translations.delete_key_confirm', 'Delete') }} <strong class="font-mono">{{ keyData?.key }}</strong>?
          {{ t('translations.delete_key_warning', 'All translations will be permanently removed.') }}
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
            {{ t('translations.cancel', 'Cancel') }}
          </u-button>
          <u-button
              :loading="deleting"
              color="error"
              @click="deleteKey"
          >
            {{ t('translations.delete_key', 'Delete') }}
          </u-button>
        </div>
      </template>
    </u-modal>
  </div>
</template>

<script lang="ts" setup>
  const route = useRoute()
  const projectId = computed(() => route.params.id)
  const { t } = useT()
  const { canManageProject, canApprove } = useAuth()
  const { currentProject } = useProject()
  const { findLanguage } = useLanguages()

  const {
    keyData,
    pending,
    refresh,
    savingLang: saving,
    saveTranslation: _saveTranslation,
    settingStatus,
    setStatus: _setStatus,
    restoreVersion: _restoreVersion,
    autoTranslate: _autoTranslate,
    savingDescription,
    updateDescription,
    deleting,
    deleteKey: _deleteKey,
  } = useKeys({ id: computed(() => route.params.keyId) })

  watch([keyData, pending], () => {
    if (!pending.value && !keyData.value) {
      throw createError({ statusCode: 404, message: 'Key not found' })
    }
  })

  const userCanDelete = computed(() => currentProject.value ? canManageProject(currentProject.value.id) : false)
  const userCanApprove = computed(() => currentProject.value ? canApprove(currentProject.value.id) : false)

  const coverageCount = computed(() =>
      keyData.value?.languages.filter((l: any) => keyData.value?.translations[l.code]?.value).length || 0,
  )

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const getTranslationValue = (langCode: string): string => {
    return keyData.value?.translations[langCode]?.value || ''
  }

  const getStatus = (langCode: string): string => {
    return keyData.value?.translations[langCode]?.status || 'draft'
  }

  const STATUS_COLORS: Record<string, string> = {
    draft: 'neutral',
    reviewed: 'info',
    approved: 'success',
    rejected: 'error',
  }
  const STATUS_LABELS = computed((): Record<string, string> => ({
    draft: t('status.draft', 'Draft'),
    reviewed: t('status.reviewed', 'Reviewed'),
    approved: t('status.approved', 'Approved'),
    rejected: t('key.status_rejected', 'Rejected'),
  }))

  const statusColor = (langCode: string) => {
    return STATUS_COLORS[getStatus(langCode)] || 'neutral'
  }

  const statusLabel = (langCode: string) => {
    if (!getTranslationValue(langCode)) return t('status.missing', 'Missing')
    return STATUS_LABELS.value[getStatus(langCode)] || getStatus(langCode)
  }

  // ── Status actions ────────────────────────────────────────────────────────────
  const statusActions = (langCode: string) => {
    if (!getTranslationValue(langCode)) return []
    const current = getStatus(langCode)

    const all = [
      { label: STATUS_LABELS.value.draft, icon: 'i-heroicons-pencil', status: 'draft' },
      { label: STATUS_LABELS.value.reviewed, icon: 'i-heroicons-eye', status: 'reviewed' },
    ]

    if (userCanApprove.value) {
      all.push({ label: STATUS_LABELS.value.approved, icon: 'i-heroicons-check-circle', status: 'approved' })
      all.push({ label: STATUS_LABELS.value.rejected, icon: 'i-heroicons-x-circle', status: 'rejected' })
    }

    return [
      all
          .filter(a => a.status !== current)
          .map(a => ({
            label: a.label,
            icon: a.icon,
            color: a.status === 'rejected' ? ('error' as const) : undefined,
            onSelect: () => setStatus(langCode, a.status),
          })),
    ]
  }

  const setStatus = async (langCode: string, status: string) => {
    await _setStatus(langCode, status)
    refreshNuxtData('project-stats')
  }

  // ── Source text for auto-translate ───────────────────────────────────────────
  const sourceText = computed(() => {
    const tr = keyData.value?.translations
    if (!tr) return ''
    const defaultLang = keyData.value?.languages.find((l: any) => l.is_default)
    if (defaultLang && tr[defaultLang.code]?.value) return tr[defaultLang.code].value
    const first = Object.values(tr).find((t: any) => t?.value)
    return (first as any)?.value || ''
  })

  // ── Edit translation ──────────────────────────────────────────────────────────
  const editingLang = ref<string | null>(null)
  const editValue = ref('')
  const translating = ref<string | null>(null)
  const activeTextareaWrapper = ref<HTMLElement | null>(null)

  // ── Plural editor ─────────────────────────────────────────────────────────────
  const PLURAL_SEP = ' | '
  const pluralMode = ref(false)

  const getPluralForms = (langCode: string): string[] => {
    const val = getTranslationValue(langCode)
    return val.includes(PLURAL_SEP) ? val.split(PLURAL_SEP) : [val]
  }

  const togglePluralMode = (langCode: string) => {
    if (!pluralMode.value && !editValue.value.includes(PLURAL_SEP)) {
      // Entering plural mode: seed with current value as first form
      editValue.value = editValue.value ? `${editValue.value} | ` : ' | '
    }
    pluralMode.value = !pluralMode.value
  }

  const LINK_MODIFIERS = computed(() => [
    { prefix: '@:', hint: t('key.modifier_simple', 'Simple link — @:key (inserts value as-is)') },
    { prefix: '@.lower:', hint: t('key.modifier_lower', '@.lower:key — converts to lowercase') },
    { prefix: '@.upper:', hint: t('key.modifier_upper', '@.upper:key — converts to UPPERCASE') },
    { prefix: '@.capitalize:', hint: t('key.modifier_capitalize', '@.capitalize:key — capitalizes first letter') },
  ])

  // Literal interpolation {'x'} + backslash escapes \x (v11.3+), grouped
  const ALL_ESCAPES = computed(() => [
    { label: `{'@'}`, insert: `{'@'}`, hint: t('key.escape_at', `@ → {'@'} — prevents interpretation as link`) },
    { label: `{'{'}`, insert: `{'{'}`, hint: t('key.escape_open', `{ → {'{'} — prevents opening interpolation`) },
    { label: `{'}'}`, insert: `{'}'}`, hint: t('key.escape_close', `} → {'}'} — prevents closing interpolation`) },
    {
      label: `{'$'}`,
      insert: `{'$'}`,
      hint: t('key.escape_dollar', `$ → {'$'} — prevents interpretation as modifier`)
    },
    { label: `{'|'}`, insert: `{'|'}`, hint: t('key.escape_pipe', `| → {'|'} — literal pipe (≠ plural separator)`) },
    {
      label: `\\{`,
      insert: `\\{`,
      hint: t('key.escape_bs_open', `\\{ — backslash escape (vue-i18n v11.3+), alternative to {'{'}`)
    },
    {
      label: `\\}`,
      insert: `\\}`,
      hint: t('key.escape_bs_close', `\\} — backslash escape (vue-i18n v11.3+), alternative to {'}'}`)
    },
    {
      label: `\\@`,
      insert: `\\@`,
      hint: t('key.escape_bs_at', `\\@ — backslash escape (vue-i18n v11.3+), alternative to {'@'}`)
    },
    { label: `\\\\`, insert: `\\\\`, hint: t('key.escape_bs_bs', `\\\\ — literal backslash`) },
  ])

  // Plural form labels
  const PLURAL_FORM_LABELS = computed(() => [
    `[0] ${t('key.plural_none', 'none')}`,
    `[1] ${t('key.plural_sing', 'sing.')}`,
    `[n] ${t('key.plural_plural', 'plural')}`,
    '[n+1]',
    '[n+2]',
  ])

  const PARAM_REGEX = /\{([a-zA-Z_$][a-zA-Z0-9_\-$]*|\d+)\}/g
  const detectedParams = computed(() => {
    const params = new Set<string>()
    const tr = keyData.value?.translations
    if (!tr) return []
    for (const entry of Object.values(tr)) {
      if (!(entry as any)?.value) continue
      for (const match of ((entry as any).value as string).matchAll(PARAM_REGEX)) {
        params.add(match[1])
      }
    }
    return [...params]
  })

  const insertAtCursor = (insertion: string) => {
    const textarea = activeTextareaWrapper.value?.querySelector('textarea')
    if (textarea) {
      const start = textarea.selectionStart ?? editValue.value.length
      const end = textarea.selectionEnd ?? editValue.value.length
      editValue.value = editValue.value.slice(0, start) + insertion + editValue.value.slice(end)
      nextTick(() => {
        textarea.focus()
        textarea.selectionStart = textarea.selectionEnd = start + insertion.length
      })
    } else {
      editValue.value += insertion
    }
  }

  const insertLinkedKey = (value: string) => {
    insertAtCursor(value)
  }

  const startEdit = (lang: any) => {
    editingLang.value = lang.code
    editValue.value = getTranslationValue(lang.code)
    pluralMode.value = editValue.value.includes(PLURAL_SEP)
  }

  const saveTranslation = async (langCode: string) => {
    await _saveTranslation(langCode, editValue.value)
    editingLang.value = null
    pluralMode.value = false
    refreshNuxtData('project-stats')
  }

  const autoTranslate = async (lang: any) => {
    if (!sourceText.value) return
    translating.value = lang.code
    const sourceLang = keyData.value?.languages.find((l: any) => l.is_default)?.code || 'en'
    const text = await _autoTranslate(lang.code, sourceText.value, sourceLang)
    if (text) {
      editValue.value = text
      editingLang.value = lang.code
    }
    translating.value = null
  }

  // ── Restore historical version ────────────────────────────────────────────────
  const restoring = ref<string | null>(null)

  const restoreVersion = async (langCode: string, entry: any) => {
    restoring.value = `${langCode}-${entry.id}`
    await _restoreVersion(langCode, entry.new_value)
    restoring.value = null
  }

  // ── History ───────────────────────────────────────────────────────────────────
  const expandedHistory = ref<string[]>([])

  const toggleHistory = (langCode: string) => {
    const idx = expandedHistory.value.indexOf(langCode)
    if (idx >= 0) expandedHistory.value.splice(idx, 1)
    else expandedHistory.value.push(langCode)
  }

  // ── Description ───────────────────────────────────────────────────────────────
  const editingDescription = ref(false)
  const descriptionDraft = ref('')

  const startEditDescription = () => {
    descriptionDraft.value = keyData.value?.description || ''
    editingDescription.value = true
  }

  const saveDescription = async () => {
    await updateDescription(descriptionDraft.value || null)
    editingDescription.value = false
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  const showDeleteConfirm = ref(false)

  const keyActions = computed(() => {
    if (!userCanDelete.value) return [[]]
    return [[{
      label: t('translations.delete_key', 'Delete key'),
      icon: 'i-heroicons-trash',
      color: 'error' as const,
      onSelect: () => {
        showDeleteConfirm.value = true
      },
    }]]
  })

  const deleteKey = async () => {
    await _deleteKey()
    refreshNuxtData('project-stats')
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const formatDate = (date: string) => {
    if (!date) return '—'
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date))
  }
</script>

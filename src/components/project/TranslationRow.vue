<template>
  <div
    class="grid border-b border-gray-100 dark:border-gray-800 last:border-0 group/row hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
    :class="translationKey.is_unused ? 'opacity-60' : ''"
    :style="gridStyle"
  >
    <!-- Key column -->
    <div class="px-4 py-3 flex flex-col justify-center min-w-0">
      <div class="flex items-center gap-2 min-w-0">
        <u-tooltip
          v-if="translationKey.is_unused"
          :text="t('translations.unused_tooltip', 'Key not found in source code')"
        >
          <u-icon
            name="i-heroicons-exclamation-triangle"
            class="text-orange-400 text-sm shrink-0"
          />
        </u-tooltip>
        <nuxt-link
          :to="projectId ? `/projects/${projectId}/translations/${translationKey.id}` : `/keys/${translationKey.id}`"
          class="text-sm font-mono font-medium text-gray-900 dark:text-gray-100 truncate hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          {{ translationKey.key }}
        </nuxt-link>
      </div>
      <!-- Description: inline edit -->
      <template v-if="editingDescription">
        <div class="flex items-center gap-1 mt-0.5">
          <u-input
            v-model="descriptionDraft"
            size="xs"
            class="flex-1 text-xs"
            placeholder="Description…"
            autofocus
            @keydown.enter="saveDescription"
            @keydown.escape="cancelDescription"
          />
          <u-button
            size="xs"
            :loading="savingDescription"
            @click="saveDescription"
          >
            OK
          </u-button>
          <u-button
            size="xs"
            color="neutral"
            variant="ghost"
            @click="cancelDescription"
          >
            ✕
          </u-button>
        </div>
      </template>
      <template v-else>
        <p
          class="text-xs mt-0.5 truncate cursor-pointer"
          :class="translationKey.description ? 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300' : 'text-gray-300 dark:text-gray-600 italic hover:text-primary-400'"
          @click="startEditDescription"
        >
          {{ translationKey.description || t('translations.add_description', 'Add a description…') }}
        </p>
      </template>
      <!-- Usage info -->
      <div
        v-if="translationKey.usages?.length"
        class="flex items-center gap-1 mt-1"
      >
        <u-tooltip :text="usageTooltip">
          <button class="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-500 transition-colors">
            <u-icon
              name="i-heroicons-code-bracket"
              class="text-xs"
            />
            <span>{{ translationKey.usages.length }} {{ translationKey.usages.length > 1 ? t('translations.references', 'references') : t('translations.reference', 'reference') }}</span>
          </button>
        </u-tooltip>
      </div>
    </div>

    <!-- Translation columns -->
    <div
      v-for="lang in languages"
      :key="lang.code"
      class="px-3 py-2 flex items-start gap-2 min-w-0 group/cell"
    >
      <div class="flex-1 min-w-0">
        <!-- Edit mode -->
        <template v-if="editingCell === `${translationKey.id}-${lang.code}`">
          <div :ref="el => textareaWrappers[lang.code] = el as HTMLElement">
            <u-textarea
              v-model="editValues[lang.code]"
              :rows="2"
              autofocus
              class="text-sm w-full"
              @keydown.ctrl.enter="saveTranslation(lang.code)"
              @keydown.meta.enter="saveTranslation(lang.code)"
              @keydown.escape="cancelEdit(lang.code)"
            />
          </div>
          <!-- Insertion helpers toolbar -->
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 pb-1.5 border-b border-gray-100 dark:border-gray-800">
            <!-- Named params -->
            <template v-if="detectedParams.length">
              <div class="flex items-center gap-1 flex-wrap">
                <span class="text-xs text-gray-400">{{ t('key.params_label', 'Params:') }}</span>
                <button
                  v-for="param in detectedParams"
                  :key="param"
                  class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                  @mousedown.prevent="insertAtCursor(lang.code, '{' + param + '}')"
                >
                  <u-icon
                    name="i-heroicons-cursor-arrow-rays"
                    class="text-xs opacity-60"
                  />
                  {{ '{' + param + '}' }}
                </button>
              </div>
            </template>
            <!-- Literal / backslash escapes -->
            <div class="flex items-center gap-1 flex-wrap">
              <span class="text-xs text-gray-400">{{ t('key.escapes_label', 'Escapes:') }}</span>
              <u-tooltip
                v-for="esc in ALL_ESCAPES"
                :key="esc.insert"
                :text="esc.hint"
              >
                <button
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  @mousedown.prevent="insertAtCursor(lang.code, esc.insert)"
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
                  @mousedown.prevent="insertAtCursor(lang.code, mod.prefix)"
                >
                  {{ mod.prefix }}
                </button>
              </u-tooltip>
            </div>
            <!-- Plural separator -->
            <u-tooltip :text="t('translations.insert_plural_sep', 'Insert a plural form separator | (e.g. car | cars)')">
              <button
                class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                @mousedown.prevent="insertAtCursor(lang.code, ' | ')"
              >
                <u-icon
                  name="i-heroicons-bars-3-bottom-left"
                  class="text-xs opacity-60"
                />
                {{ ' | ' }}
              </button>
            </u-tooltip>
            <!-- Linked key picker -->
            <project-linked-key-picker
              :project-id="projectId"
              @select="(val) => insertLinkedKey(lang.code, val)"
            />
          </div>
          <div class="flex gap-1 mt-1.5">
            <u-button
              size="xs"
              :loading="saving === `${translationKey.id}-${lang.code}`"
              @click="saveTranslation(lang.code)"
            >
              {{ t('translations.save', 'Save') }}
            </u-button>
            <u-button
              size="xs"
              color="neutral"
              variant="ghost"
              @click="cancelEdit(lang.code)"
            >
              {{ t('common.cancel', 'Cancel') }}
            </u-button>
          </div>
        </template>

        <!-- View mode -->
        <template v-else>
          <div class="flex items-start gap-1.5">
            <!-- Status dot -->
            <u-tooltip
              :text="statusLabel(lang.code)"
              :delay-duration="300"
            >
              <span
                class="mt-1.5 w-2 h-2 rounded-full shrink-0 transition-opacity"
                :class="[
                  cyclingStatusLang === lang.code ? 'bg-gray-300 dark:bg-gray-600 animate-pulse cursor-wait' : statusDot(lang.code),
                  canClickStatus(lang.code) && cyclingStatusLang !== lang.code ? 'cursor-pointer' : 'cursor-default'
                ]"
                @click="cycleStatus(lang.code)"
              />
            </u-tooltip>

            <div
              class="flex-1 min-w-0 cursor-pointer"
              @click="startEdit(lang.code)"
            >
              <template v-if="getTranslation(lang.code)">
                <!-- Plural: show forms stacked -->
                <div
                  v-if="getPluralCount(lang.code) > 1"
                  class="space-y-0.5"
                >
                  <div
                    v-for="(form, i) in getTranslation(lang.code).split(' | ')"
                    :key="i"
                    class="flex items-baseline gap-1.5"
                  >
                    <span class="text-xs font-mono text-green-500 shrink-0">[{{ i }}]</span>
                    <span class="text-sm text-gray-700 dark:text-gray-300 leading-snug truncate hover:text-primary-600 dark:hover:text-primary-400">{{ form.trim() }}</span>
                  </div>
                </div>
                <!-- Single value -->
                <p
                  v-else
                  class="text-sm text-gray-700 dark:text-gray-300 leading-snug truncate hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {{ getTranslation(lang.code) }}
                </p>
              </template>
              <span
                v-else
                class="text-xs text-gray-300 dark:text-gray-600 italic hover:text-primary-500 transition-colors"
              >
                {{ t('translations.click_to_add', 'Click to add…') }}
              </span>
            </div>
          </div>
        </template>
      </div>

      <!-- Actions: Google Translate + status toggle -->
      <div class="flex flex-col gap-1 opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0">
        <u-tooltip :text="hasSourceText ? t('translations.translate_to', 'Translate to') + ` ${lang.name}` : t('translations.no_source', 'No source available')">
          <u-button
            icon="i-heroicons-sparkles"
            size="xs"
            color="warning"
            variant="ghost"
            :disabled="!hasSourceText"
            :loading="translateLoading === `${translationKey.id}-${lang.code}`"
            @click="autoTranslate(lang)"
          />
        </u-tooltip>
      </div>
    </div>

    <!-- Row actions -->
    <div class="px-2 py-3 flex items-center justify-center">
      <u-dropdown-menu :items="rowActions">
        <u-button
          icon="i-heroicons-ellipsis-vertical"
          size="xs"
          color="neutral"
          variant="ghost"
          class="opacity-0 group-hover/row:opacity-100 transition-opacity"
        />
      </u-dropdown-menu>
    </div>
  </div>

  <!-- History modal -->
  <tranlation-history-modal
    v-if="showHistory"
    :translation-id="historyTranslationId"
    @close="showHistory = false"
  />
</template>

<script setup lang="ts">
import { TRANSLATION_STATUS } from '../../enums/translation.enum'
import type { ITranslationRowProps, ITranslationRowEmits } from '../../interfaces/key.interface'

const { t } = useT()
const {
  saveTranslationById,
  setTranslationStatusById,
  autoTranslateById,
  updateDescriptionById,
  deleteKeyById,
} = useKeys()

const props = defineProps<ITranslationRowProps>()

const emit = defineEmits<ITranslationRowEmits>()

const toast = useToast()
const { canApprove, canManageProject } = useAuth()

const userCanApprove = computed(() => props.projectId ? canApprove(props.projectId) : false)
const userCanDelete = computed(() => props.projectId ? canManageProject(props.projectId) : false)

// Description inline edit
const editingDescription = ref(false)
const descriptionDraft = ref('')
const savingDescription = ref(false)

const startEditDescription = () => {
  descriptionDraft.value = props.translationKey.description || ''
  editingDescription.value = true
}

const cancelDescription = () => {
  editingDescription.value = false
}

const saveDescription = async () => {
  savingDescription.value = true
  try {
    await updateDescriptionById(props.translationKey.id, descriptionDraft.value || null)
    editingDescription.value = false
    emit('updated')
  } catch (e: any) {
    toast.add({ title: t('common.error', 'Error'), description: e.message, color: 'error' })
  } finally {
    savingDescription.value = false
  }
}

const editingCell = ref<string | null>(null)
const editValues = ref<Record<string, string>>({})
const saving = ref<string | null>(null)
const translateLoading = ref<string | null>(null)
const cyclingStatusLang = ref<string | null>(null)
const deletingKey = ref(false)
const showHistory = ref(false)
const historyTranslationId = ref<number | null>(null)
const textareaWrappers = ref<Record<string, HTMLElement | null>>({})

// Literal interpolation {'x'} + backslash escapes (v11.3+), grouped
const ALL_ESCAPES = computed(() => [
  { label: `{'@'}`, insert: `{'@'}`, hint: t('key.escape_at', `@ → {'@'} — prevents link interpretation`) },
  { label: `{'{'}`, insert: `{'{'}`, hint: t('key.escape_open_brace', `{ → {'{'} — prevents interpolation opening`) },
  { label: `{'}'}`, insert: `{'}'}`, hint: t('key.escape_close_brace', `} → {'}'} — prevents interpolation closing`) },
  { label: `{'$'}`, insert: `{'$'}`, hint: t('key.escape_dollar', `$ → {'$'} — prevents modifier interpretation`) },
  { label: `{'|'}`, insert: `{'|'}`, hint: t('key.escape_pipe', `| → {'|'} — literal pipe (≠ plural separator)`) },
  { label: `\\{`, insert: `\\{`, hint: t('key.escape_backslash_open', `\\{ — backslash escape (v11.3+), alternative to {'{'}`) },
  { label: `\\}`, insert: `\\}`, hint: t('key.escape_backslash_close', `\\} — backslash escape (v11.3+), alternative to {'}'}`) },
  { label: `\\@`, insert: `\\@`, hint: t('key.escape_backslash_at', `\\@ — backslash escape (v11.3+), alternative to {'@'}`) },
  { label: `\\\\`, insert: `\\\\`, hint: t('key.escape_backslash', `\\\\ — literal backslash`) },
])

// Modifier prefixes for linked messages
const LINK_MODIFIERS = computed(() => [
  { prefix: '@:', hint: t('key.modifier_simple', '@:key — inserts the value as-is') },
  { prefix: '@.lower:', hint: t('key.modifier_lower', '@.lower:key — converts to lowercase') },
  { prefix: '@.upper:', hint: t('key.modifier_upper', '@.upper:key — converts to UPPERCASE') },
  { prefix: '@.capitalize:', hint: t('key.modifier_capitalize', '@.capitalize:key — capitalizes first letter') },
])

// Detect named/list params like {name}, {0} across all existing translations
const PARAM_REGEX = /\{([a-zA-Z_$][a-zA-Z0-9_\-$]*|\d+)\}/g
const detectedParams = computed(() => {
  const params = new Set<string>()
  for (const tr of Object.values(props.translationKey.translations)) {
    if (!tr?.value) continue
    for (const match of tr.value.matchAll(PARAM_REGEX)) {
      params.add(match[1])
    }
  }
  return [...params]
})

const insertAtCursor = (langCode: string, insertion: string) => {
  const wrapper = textareaWrappers.value[langCode]
  const textarea = wrapper?.querySelector('textarea')
  const current = editValues.value[langCode] || ''

  if (textarea) {
    const start = textarea.selectionStart ?? current.length
    const end = textarea.selectionEnd ?? current.length
    editValues.value[langCode] = current.slice(0, start) + insertion + current.slice(end)
    nextTick(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + insertion.length
    })
  } else {
    editValues.value[langCode] = current + insertion
  }
}

const insertLinkedKey = (langCode: string, value: string) => {
  insertAtCursor(langCode, value)
}

const getTranslation = (langCode: string): string => {
  return props.translationKey.translations[langCode]?.value || ''
}

const getPluralCount = (langCode: string): number => {
  const val = getTranslation(langCode)
  return val ? val.split(' | ').length : 0
}

const getStatus = (langCode: string): TRANSLATION_STATUS | null => {
  const tr = props.translationKey.translations[langCode]
  if (!tr?.value) return null
  return (tr.status as TRANSLATION_STATUS) || TRANSLATION_STATUS.DRAFT
}

const statusDot = (langCode: string): string => {
  const status = getStatus(langCode)
  if (!status) return 'bg-gray-200 dark:bg-gray-700'
  const map: Record<TRANSLATION_STATUS, string> = {
    [TRANSLATION_STATUS.DRAFT]: 'bg-yellow-400',
    [TRANSLATION_STATUS.REVIEWED]: 'bg-blue-400',
    [TRANSLATION_STATUS.APPROVED]: 'bg-green-500',
    [TRANSLATION_STATUS.REJECTED]: 'bg-red-400',
  }
  return map[status] || 'bg-gray-200'
}

const statusLabel = (langCode: string): string => {
  const status = getStatus(langCode)
  if (!status) return t('translations.status_missing', 'Missing — click to add')
  if (status === TRANSLATION_STATUS.DRAFT) return userCanApprove.value
    ? t('translations.status_draft_approver', 'Draft — click to mark as reviewed')
    : t('translations.status_draft_translator', 'Draft — click to mark as reviewed')
  if (status === TRANSLATION_STATUS.REVIEWED) return userCanApprove.value
    ? t('translations.status_reviewed_approver', 'Reviewed — click to approve')
    : t('translations.status_reviewed_translator', 'Reviewed (approval reserved for moderators)')
  if (status === TRANSLATION_STATUS.APPROVED) return userCanApprove.value
    ? t('translations.status_approved_approver', 'Approved — click to revert to draft')
    : t('translations.status_approved', 'Approved')
  if (status === TRANSLATION_STATUS.REJECTED) return t('status.rejected', 'Rejected')
  return status
}

const canClickStatus = (langCode: string): boolean => {
  const tr = props.translationKey.translations[langCode]
  if (!tr?.value) return false
  if (!userCanApprove.value && tr.status === TRANSLATION_STATUS.APPROVED) return false
  return true
}

const cycleStatus = async (langCode: string) => {
  const tr = props.translationKey.translations[langCode]
  if (!tr?.value || cyclingStatusLang.value) return

  const current = (tr.status as TRANSLATION_STATUS) || TRANSLATION_STATUS.DRAFT
  let next: TRANSLATION_STATUS
  if (userCanApprove.value) {
    // moderator+ can cycle through all statuses
    next = current === TRANSLATION_STATUS.DRAFT ? TRANSLATION_STATUS.REVIEWED : current === TRANSLATION_STATUS.REVIEWED ? TRANSLATION_STATUS.APPROVED : TRANSLATION_STATUS.DRAFT
  } else {
    // translator can only toggle draft ↔ reviewed
    if (current === TRANSLATION_STATUS.APPROVED) return // cannot change approved
    next = current === TRANSLATION_STATUS.DRAFT ? TRANSLATION_STATUS.REVIEWED : TRANSLATION_STATUS.DRAFT
  }

  cyclingStatusLang.value = langCode
  try {
    await setTranslationStatusById(props.translationKey.id, langCode, next)
    emit('updated')
    refreshNuxtData('project-stats')
  } catch (e: any) {
    toast.add({ title: t('common.error', 'Error'), description: e.message, color: 'error' })
  } finally {
    cyclingStatusLang.value = null
  }
}

const hasSourceText = computed(() =>
  Object.values(props.translationKey.translations).some((tr) => tr?.value),
)

const getSourceText = (): { text: string; lang: string } | null => {
  const entries = Object.entries(props.translationKey.translations)
  const withValue = entries.filter(([, tr]) => tr?.value)
  if (!withValue.length) return null
  return { text: withValue[0][1]!.value, lang: withValue[0][0] }
}

const usageTooltip = computed(() => {
  const usages = props.translationKey.usages || []
  // Group by file
  const byFile = usages.reduce((acc: Record<string, number[]>, u) => {
    if (!acc[u.file_path]) acc[u.file_path] = []
    acc[u.file_path].push(u.line_number)
    return acc
  }, {})
  return Object.entries(byFile)
    .slice(0, 5)
    .map(([file, lines]) => `${file}:${lines.join(',')}`)
    .join('\n')
})

const startEdit = (langCode: string) => {
  editingCell.value = `${props.translationKey.id}-${langCode}`
  editValues.value[langCode] = getTranslation(langCode)
}

const cancelEdit = (langCode: string) => {
  editingCell.value = null
  delete editValues.value[langCode]
}

const saveTranslation = async (langCode: string) => {
  saving.value = `${props.translationKey.id}-${langCode}`
  try {
    await saveTranslationById(props.translationKey.id, langCode, editValues.value[langCode])
    editingCell.value = null
    emit('updated')
  } catch (e: any) {
    toast.add({ title: t('common.error', 'Error'), description: e.message, color: 'error' })
  } finally {
    saving.value = null
  }
}

const autoTranslate = async (lang: { code: string; name: string }) => {
  const source = getSourceText()
  if (!source) return

  translateLoading.value = `${props.translationKey.id}-${lang.code}`
  try {
    await autoTranslateById(props.translationKey.id, lang.code, source.text, source.lang)
    toast.add({ title: t('translations.translated', 'Translated'), description: `${props.translationKey.key} → ${lang.name}`, color: 'success' })
    emit('updated')
  } catch (e: any) {
    toast.add({ title: t('translations.translate_error', 'Google Translate error'), description: e.message, color: 'error' })
  } finally {
    translateLoading.value = null
  }
}

const viewHistory = (langCode: string) => {
  const tr = props.translationKey.translations[langCode]
  if (tr) {
    historyTranslationId.value = tr.id
    showHistory.value = true
  }
}

const rowActions = computed(() => {
  const groups: any[] = [
    [
      {
        label: t('translations.history_by_lang', 'History by language'),
        type: 'label' as const,
      },
      ...props.languages.map((lang) => ({
        label: `${lang.name} (${lang.code})`,
        icon: 'i-heroicons-clock',
        disabled: !props.translationKey.translations[lang.code],
        onSelect: () => viewHistory(lang.code),
      })),
    ],
  ]
  if (userCanDelete.value) {
    groups.push([
      {
        label: t('translations.delete_key', 'Delete key'),
        icon: 'i-heroicons-trash',
        color: 'error' as const,
        onSelect: deleteKey,
      },
    ])
  }
  return groups
})

const deleteKey = async () => {
  deletingKey.value = true
  try {
    await deleteKeyById(props.translationKey.id)
    toast.add({ title: t('translations.key_deleted', 'Key deleted'), color: 'success' })
    emit('updated')
    refreshNuxtData('project-stats')
  } catch (e: any) {
    toast.add({ title: t('common.error', 'Error'), description: e.message, color: 'error' })
  } finally {
    deletingKey.value = false
  }
}
</script>

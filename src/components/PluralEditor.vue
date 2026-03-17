<template>
  <div class="space-y-4">

    <!-- Template picker -->
    <div>
      <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{{ t('plural.template_title', 'Pluralization template') }}</p>
      <div class="grid grid-cols-1 gap-1.5">
        <button
          v-for="tpl in TEMPLATES"
          :key="tpl.id"
          class="flex items-start gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors"
          :class="activeTplId === tpl.id
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
          @click="applyTemplate(tpl)"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ tpl.name }}</span>
              <span class="text-xs text-gray-400">{{ tpl.langs }}</span>
            </div>
            <code class="text-xs font-mono text-green-600 dark:text-green-400 mt-0.5 block truncate">{{ tpl.preview }}</code>
          </div>
          <UBadge size="xs" :color="activeTplId === tpl.id ? 'success' : 'neutral'" variant="soft">
            {{ tpl.forms.length }} {{ t('plural.forms', 'forms') }}
          </UBadge>
        </button>
      </div>
    </div>

    <!-- Implicit params hint -->
    <div class="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
      <UIcon name="i-heroicons-information-circle" class="shrink-0 mt-0.5" />
      <div>
        <span class="font-semibold">{{ t('plural.implicit_params_title', 'Implicit parameters:') }}</span>
        <code class="font-mono mx-1 bg-amber-100 dark:bg-amber-900/40 px-1 rounded">{count}</code> {{ t('plural.and', 'and') }}
        <code class="font-mono mx-1 bg-amber-100 dark:bg-amber-900/40 px-1 rounded">{n}</code>
        {{ t('plural.implicit_params_hint', 'are automatically available in any pluralized key — you don\'t need to pass them explicitly.') }}
      </div>
    </div>

    <!-- Form fields -->
    <div class="space-y-2">
      <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ t('plural.forms_title', 'Forms') }}</p>
      <div
        v-for="(form, i) in forms"
        :key="i"
        class="flex items-start gap-3"
      >
        <!-- Label column -->
        <div class="shrink-0 w-28 pt-1.5 space-y-0.5">
          <div class="flex items-center gap-1">
            <span class="text-xs font-mono font-bold text-green-600 dark:text-green-400">
              [{{ i }}]
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ formLabel(i) }}</span>
          </div>
          <p class="text-xs text-gray-400 font-mono">count={{ triggerCount(i) }}</p>
          <button
            v-if="forms.length > 2"
            class="text-xs text-gray-300 hover:text-red-400 transition-colors flex items-center gap-0.5"
            @click="removeForm(i)"
          >
            <UIcon name="i-heroicons-trash" class="text-xs" />
            {{ t('plural.remove', 'Remove') }}
          </button>
        </div>

        <!-- Textarea + implicit param chips -->
        <div class="flex-1 space-y-1">
          <UTextarea
            v-model="forms[i]"
            :rows="2"
            class="w-full text-sm"
            :placeholder="formPlaceholder(i)"
            @input="emitValue"
          />
          <!-- Implicit param quick-insert -->
          <div class="flex gap-1">
            <button
              v-for="p in IMPLICIT_PARAMS"
              :key="p"
              class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 hover:bg-amber-100 transition-colors"
              @mousedown.prevent="insertInForm(i, `{${p}}`)"
            >
              <UIcon name="i-heroicons-cursor-arrow-rays" class="text-xs mr-0.5 opacity-60" />
              {{ `{/${p}/}` }}
            </button>
          </div>
        </div>
      </div>

      <button
        class="text-xs text-green-600 dark:text-green-400 hover:text-green-700 flex items-center gap-1 transition-colors mt-1"
        @click="addForm"
      >
        <UIcon name="i-heroicons-plus-circle" class="text-sm" />
        {{ t('plural.add_form', 'Add a form') }}
      </button>
    </div>

    <!-- Live preview -->
    <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{{ t('formats.preview', 'Preview') }}</p>
      <div class="grid grid-cols-3 gap-2">
        <div
          v-for="n in PREVIEW_COUNTS"
          :key="n"
          class="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 px-2.5 py-2"
        >
          <p class="text-xs text-gray-400 mb-1">count = <strong class="text-gray-600 dark:text-gray-300">{{ n }}</strong></p>
          <p class="text-sm text-gray-700 dark:text-gray-300 font-medium min-h-[1.25rem]">
            <span v-if="resolvePreview(n)">{{ resolvePreview(n) }}</span>
            <span v-else class="text-gray-300 italic text-xs">{{ t('plural.empty', 'empty') }}</span>
          </p>
        </div>
      </div>
      <p class="text-xs text-gray-400">
        {{ t('plural.selection_rule', 'Selection rule: English rule by default (count=1 → form [1] for 2 forms, count=0 → [0], count=1 → [1], count≥2 → [2] for 3 forms).') }}
      </p>
    </div>

    <!-- Raw value -->
    <div class="flex items-center gap-2 text-xs text-gray-400">
      <span class="shrink-0">{{ t('plural.raw_value', 'Raw value:') }}</span>
      <code class="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded flex-1 truncate text-gray-600 dark:text-gray-300">
        {{ joinedValue }}
      </code>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useT()

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// ── Constants ─────────────────────────────────────────────────────────────────

const PLURAL_SEP = ' | '
const IMPLICIT_PARAMS = ['count', 'n']
const PREVIEW_COUNTS = [0, 1, 5]

const TEMPLATES = computed(() => [
  {
    id: '2-standard',
    name: t('plural.tpl_2_standard', '2 forms — standard'),
    langs: t('plural.tpl_2_langs', 'English, German, Dutch…'),
    preview: 'car | cars',
    forms: ['car', 'cars'],
    // English 2-form rule: 1→[0], else→[1]
    rule: (n: number, len: number) => n === 1 ? 0 : Math.min(1, len - 1),
  },
  {
    id: '3-zero-one-many',
    name: t('plural.tpl_3_zero', '3 forms — zero / one / many'),
    langs: t('plural.tpl_3_langs', 'French, Spanish, Italian…'),
    preview: 'no car | {count} car | {count} cars',
    forms: ['no car', '{count} car', '{count} cars'],
    // French 3-form rule: 0→[0], 1→[1], else→[2]
    rule: (n: number, len: number) => n === 0 ? 0 : n === 1 ? 1 : Math.min(2, len - 1),
  },
  {
    id: '4-slavic',
    name: t('plural.tpl_4_slavic', '4 forms — Slavic languages'),
    langs: t('plural.tpl_4_langs', 'Russian, Polish, Ukrainian…'),
    preview: '0 машин | {n} машина | {n} машины | {n} машин',
    forms: ['0 машин', '{n} машина', '{n} машины', '{n} машин'],
    // Simplified Slavic rule
    rule: (n: number, len: number) => {
      if (n === 0) return 0
      const teen = n > 10 && n < 20
      const end = n % 10
      if (!teen && end === 1) return Math.min(1, len - 1)
      if (!teen && end >= 2 && end <= 4) return Math.min(2, len - 1)
      return Math.min(3, len - 1)
    },
  },
  {
    id: 'custom',
    name: t('plural.tpl_custom', 'Custom'),
    langs: t('plural.tpl_custom_hint', 'Define your own forms'),
    preview: t('plural.tpl_custom_preview', 'form 1 | form 2 | …'),
    forms: ['', ''],
    rule: (n: number, len: number) => n === 1 ? 0 : Math.min(1, len - 1),
  },
])

// ── State ─────────────────────────────────────────────────────────────────────

const forms = ref<string[]>(['', ''])
const activeTplId = ref<string>('2-standard')

// Active template rule for preview
const activeRule = computed(
  () => TEMPLATES.value.find(t => t.id === activeTplId.value)?.rule
    ?? TEMPLATES.value[0].rule,
)

// ── Init from modelValue ──────────────────────────────────────────────────────

watch(
  () => props.modelValue,
  (val) => {
    if (!val) return
    const split = val.split(PLURAL_SEP)
    forms.value = split
    // Auto-detect template
    if (split.length === 4) activeTplId.value = '4-slavic'
    else if (split.length === 3) activeTplId.value = '3-zero-one-many'
    else activeTplId.value = '2-standard'
  },
  { immediate: true },
)

// ── Computed ──────────────────────────────────────────────────────────────────

const joinedValue = computed(() => forms.value.join(PLURAL_SEP))

// ── Label helpers ─────────────────────────────────────────────────────────────

function formLabel(index: number): string {
  const len = forms.value.length
  if (len === 2) return index === 0 ? t('plural.singular', 'singular') : t('plural.plural_form', 'plural')
  if (len === 3) return [t('plural.zero', 'zero'), t('plural.singular', 'singular'), t('plural.plural_form', 'plural')][index] ?? `${t('plural.form', 'form')} ${index}`
  if (len === 4) return [t('plural.zero', 'zero'), t('plural.singular', 'singular'), t('plural.few', 'few'), t('plural.plural_form', 'plural')][index] ?? `${t('plural.form', 'form')} ${index}`
  return `${t('plural.form', 'form')} ${index}`
}

function triggerCount(index: number): string {
  const len = forms.value.length
  if (len === 2) return index === 0 ? '1' : '0, 2, 3…'
  if (len === 3) return ['0', '1', '2, 3…'][index] ?? '…'
  if (len === 4) return ['0', 'x1 (excl. 11)', 'x2–4', t('plural.others', 'others')][index] ?? '…'
  return '…'
}

function formPlaceholder(index: number): string {
  const len = forms.value.length
  if (len === 2) return index === 0 ? 'car' : 'cars'
  if (len === 3) {
    return ['no car', 'one car', '{count} cars'][index] ?? ''
  }
  return `${t('plural.form', 'form')} ${index + 1}`
}

// ── Preview ───────────────────────────────────────────────────────────────────

function resolvePreview(n: number): string {
  const len = forms.value.length
  if (!len) return ''
  const idx = activeRule.value(n, len)
  const raw = forms.value[idx] ?? forms.value[len - 1] ?? ''
  return raw.replace(/\{count\}/g, String(n)).replace(/\{n\}/g, String(n))
}

// ── Actions ───────────────────────────────────────────────────────────────────

function applyTemplate(tpl: ReturnType<typeof TEMPLATES.value[0]['rule']> extends Function ? any : any) {
  activeTplId.value = tpl.id
  if (tpl.id !== 'custom') {
    forms.value = [...tpl.forms]
  } else {
    forms.value = ['', '']
  }
  emitValue()
}

function addForm() {
  forms.value.push('')
  activeTplId.value = 'custom'
  emitValue()
}

function removeForm(index: number) {
  if (forms.value.length <= 2) return
  forms.value.splice(index, 1)
  emitValue()
}

function insertInForm(formIndex: number, text: string) {
  forms.value[formIndex] = (forms.value[formIndex] ?? '') + text
  emitValue()
}

function emitValue() {
  emit('update:modelValue', joinedValue.value)
}
</script>

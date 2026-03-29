<template>
  <u-modal
    v-model:open="open"
    :title="t('formats.import_title', 'Import formats from project config')"
    :ui="{ width: '40rem' }"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Loading -->
        <div
          v-if="loading"
          class="flex items-center justify-center py-10 gap-3 text-gray-400"
        >
          <u-icon
            class="animate-spin text-xl"
            name="i-heroicons-arrow-path"
          />
          <span class="text-sm">{{ t('formats.import_scanning', 'Scanning config files…') }}</span>
        </div>

        <!-- No formats found -->
        <div
          v-else-if="result && !result.sourceFile"
          class="text-center py-10 text-gray-400"
        >
          <u-icon
            class="text-3xl mb-2"
            name="i-heroicons-magnifying-glass"
          />
          <p class="font-medium text-sm">
            {{ t('formats.import_none_found', 'No formats detected') }}
          </p>
          <p class="text-xs mt-1">
            {{ t('formats.import_none_found_hint', 'No numberFormats, datetimeFormats or modifiers found in config files.') }}
          </p>
        </div>

        <template v-else-if="result">
          <!-- Source file -->
          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
            <u-icon name="i-heroicons-document-text" />
            {{ t('formats.import_source', 'Detected in') }}
            <code class="font-mono font-medium text-gray-700 dark:text-gray-300">{{ result.sourceFile }}</code>
          </div>

          <!-- Nothing new to import -->
          <div
            v-if="totalToImport === 0"
            class="bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2 text-sm text-green-700 dark:text-green-400 flex items-center gap-2"
          >
            <u-icon name="i-heroicons-check-circle" />
            {{ t('formats.import_all_synced', 'All detected formats are already configured in this project.') }}
          </div>

          <!-- Formats to import -->
          <template v-if="totalToImport > 0">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('formats.import_new', 'New formats to import') }}
              <u-badge
                :label="String(totalToImport)"
                color="primary"
                size="xs"
                class="ml-1"
                variant="soft"
              />
            </p>

            <!-- Number formats -->
            <div v-if="selected.numberFormats.length">
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                {{ t('formats.number_title', 'Number formats') }}
              </p>
              <div class="space-y-1">
                <div
                  v-for="f in selected.numberFormats"
                  :key="`n-${f.locale}-${f.name}`"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  @click="f.checked = !f.checked"
                >
                  <u-checkbox
                    :model-value="f.checked"
                    @click.stop
                    @update:model-value="f.checked = Boolean($event)"
                  />
                  <span class="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{{ f.locale }}</span>
                  <span class="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">{{ f.name }}</span>
                  <code class="text-xs text-gray-400 truncate max-w-40">{{ formatOptionsPreview(f.options) }}</code>
                </div>
              </div>
            </div>

            <!-- Datetime formats -->
            <div v-if="selected.datetimeFormats.length">
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                {{ t('formats.datetime_title', 'Date formats') }}
              </p>
              <div class="space-y-1">
                <div
                  v-for="f in selected.datetimeFormats"
                  :key="`d-${f.locale}-${f.name}`"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  @click="f.checked = !f.checked"
                >
                  <u-checkbox
                    :model-value="f.checked"
                    @click.stop
                    @update:model-value="f.checked = Boolean($event)"
                  />
                  <span class="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{{ f.locale }}</span>
                  <span class="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">{{ f.name }}</span>
                  <code class="text-xs text-gray-400 truncate max-w-40">{{ formatOptionsPreview(f.options) }}</code>
                </div>
              </div>
            </div>

            <!-- Modifiers -->
            <div v-if="selected.modifiers.length">
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                {{ t('settings.custom_modifiers', 'Custom modifiers') }}
              </p>
              <div class="space-y-1">
                <div
                  v-for="m in selected.modifiers"
                  :key="`m-${m.name}`"
                  class="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  @click="m.checked = !m.checked"
                >
                  <u-checkbox
                    :model-value="m.checked"
                    @click.stop
                    @update:model-value="m.checked = Boolean($event)"
                  />
                  <span class="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">{{ m.name }}</span>
                  <code class="text-xs text-gray-400 truncate max-w-48 font-mono">{{ m.body }}</code>
                </div>
              </div>
            </div>
          </template>

          <!-- Already existing -->
          <div
            v-if="totalAlreadyExisting > 0"
            class="text-xs text-gray-400 flex items-center gap-1.5 pt-1"
          >
            <u-icon name="i-heroicons-check" />
            {{ totalAlreadyExisting }}
            {{ t('formats.import_already_exist', 'format(s) already configured — skipped') }}
          </div>
        </template>

        <p
          v-if="error"
          class="text-sm text-red-500"
        >
          {{ error }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <u-button
          color="neutral"
          variant="ghost"
          @click="open = false"
        >
          {{ t('common.cancel', 'Cancel') }}
        </u-button>
        <u-button
          v-if="totalToImport > 0"
          :disabled="checkedCount === 0"
          :loading="importing"
          icon="i-heroicons-arrow-down-tray"
          @click="doImport"
        >
          {{ t('formats.import_btn', 'Import') }} ({{ checkedCount }})
        </u-button>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
const { t } = useT()
const { detectFromConfig, importFromConfig } = useFormats()
const toast = useToast()

const props = defineProps<{
  rootPath?: string
}>()

const emit = defineEmits<{ done: [] }>()

const open = defineModel<boolean>('open', { default: false })

const loading = ref(false)
const importing = ref(false)
const error = ref('')
const result = ref<any>(null)

const selected = ref<{
  numberFormats: Array<{ locale: string; name: string; options: Record<string, any>; checked: boolean }>
  datetimeFormats: Array<{ locale: string; name: string; options: Record<string, any>; checked: boolean }>
  modifiers: Array<{ name: string; body: string; checked: boolean }>
}>({ numberFormats: [], datetimeFormats: [], modifiers: [] })

const totalToImport = computed(
  () => selected.value.numberFormats.length + selected.value.datetimeFormats.length + selected.value.modifiers.length,
)
const totalAlreadyExisting = computed(() => {
  if (!result.value) return 0
  return (
    result.value.alreadyExisting.numberFormats.length +
    result.value.alreadyExisting.datetimeFormats.length +
    result.value.alreadyExisting.modifiers.length
  )
})
const checkedCount = computed(
  () =>
    selected.value.numberFormats.filter((f) => f.checked).length +
    selected.value.datetimeFormats.filter((f) => f.checked).length +
    selected.value.modifiers.filter((m) => m.checked).length,
)

const formatOptionsPreview = (opts: Record<string, any>) => {
  const entries = Object.entries(opts).slice(0, 3)
  return entries.map(([k, v]) => `${k}: ${v}`).join(', ')
}

watch(open, async (val) => {
  if (!val) return
  error.value = ''
  result.value = null
  selected.value = { numberFormats: [], datetimeFormats: [], modifiers: [] }
  loading.value = true
  try {
    result.value = await detectFromConfig(props.rootPath)
    if (result.value) {
      selected.value.numberFormats = result.value.toImport.numberFormats.map((f: any) => ({ ...f, checked: true }))
      selected.value.datetimeFormats = result.value.toImport.datetimeFormats.map((f: any) => ({ ...f, checked: true }))
      selected.value.modifiers = result.value.toImport.modifiers.map((m: any) => ({ ...m, checked: true }))
    }
  } catch (e: any) {
    error.value = e?.data?.message ?? e?.message ?? t('common.error', 'Error')
  } finally {
    loading.value = false
  }
})

const doImport = async () => {
  importing.value = true
  try {
    const res = await importFromConfig(
      selected.value.numberFormats.filter((f) => f.checked).map(({ locale, name, options }) => ({ locale, name, options })),
      selected.value.datetimeFormats.filter((f) => f.checked).map(({ locale, name, options }) => ({ locale, name, options })),
      selected.value.modifiers.filter((m) => m.checked).map(({ name, body }) => ({ name, body })),
    ) as any
    const total = res.added.numberFormats + res.added.datetimeFormats + res.added.modifiers
    toast.add({
      title: t('formats.import_success', 'Formats imported'),
      description: `${total} ${t('formats.import_added', 'format(s) added')}`,
      color: 'success',
    })
    open.value = false
    emit('done')
  } catch (e: any) {
    error.value = e?.data?.message ?? e?.message ?? t('common.error', 'Error')
  } finally {
    importing.value = false
  }
}
</script>

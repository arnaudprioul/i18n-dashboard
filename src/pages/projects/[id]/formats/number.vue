<template>
  <div class="p-6 max-w-5xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('formats.number_title', 'Number formats') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('formats.number_subtitle', 'Configure') }} <code
            class="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">$n(value, 'currency')</code>
          {{ t('formats.per_locale', 'by locale.') }}
        </p>
      </div>
      <u-button
          icon="i-heroicons-plus"
          @click="openCreate"
      >
        {{ t('formats.add_number_format', 'Add a format') }}
      </u-button>
    </div>

    <!-- Info box -->
    <div
        class="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-300 flex gap-2">
      <u-icon
          class="shrink-0 mt-0.5"
          name="i-heroicons-information-circle"
      />
      <div>
        {{ t('formats.number_info', 'Use') }} <code
          class="font-mono text-xs bg-blue-100 dark:bg-blue-900/40 px-1 rounded">$n(1234.56, 'currency')</code>
        {{ t('formats.number_info2', 'in your templates. Options correspond to') }} <strong>Intl.NumberFormat</strong>
        {{ t('formats.parameters', 'parameters.') }}
        <nuxt-link
            class="underline ml-1"
            target="_blank"
            to="https://vue-i18n.intlify.dev/guide/essentials/number.html"
        >
          {{ t('formats.documentation', 'Documentation vue-i18n') }} ↗
        </nuxt-link>
      </div>
    </div>

    <!-- Empty -->
    <div
        v-if="!numberFormats?.length"
        class="text-center py-16 text-gray-400"
    >
      <u-icon
          class="text-4xl mb-3"
          name="i-heroicons-calculator"
      />
      <p class="font-medium">
        {{ t('formats.no_format', 'No format configured') }}
      </p>
      <p class="text-sm mt-1">
        {{ t('formats.add_to_use', 'Add formats to use') }} <code class="font-mono text-xs">$n()</code>
        {{ t('formats.in_templates', 'in your templates.') }}
      </p>
      <u-button
          class="mt-4"
          icon="i-heroicons-plus"
          @click="openCreate"
      >
        {{ t('formats.add_number_format', 'Add a format') }}
      </u-button>
    </div>

    <!-- Grouped by locale -->
    <div
        v-else
        class="space-y-6"
    >
      <div
          v-for="(formats, locale) in groupedByLocale"
          :key="locale"
      >
        <div class="flex items-center gap-2 mb-3">
          <span
              class="text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500 dark:text-gray-400 uppercase">{{
              locale
            }}</span>
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{
              findLanguage(locale)?.nativeName || locale
            }}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <u-card
              v-for="fmt in formats"
              :key="fmt.id"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <code class="text-sm font-mono font-semibold text-primary-600 dark:text-primary-400">'{{
                      fmt.name
                    }}'</code>
                  <u-badge
                      color="neutral"
                      size="xs"
                      variant="soft"
                  >
                    {{ fmt.options.style || 'decimal' }}
                  </u-badge>
                  <u-badge
                      v-if="fmt.options.currency"
                      color="info"
                      size="xs"
                      variant="soft"
                  >
                    {{ fmt.options.currency }}
                  </u-badge>
                </div>
                <!-- Live preview -->
                <p class="text-xs text-gray-400 font-mono">
                  {{ previewNumber(fmt.options) }}
                </p>
                <!-- Options summary -->
                <div class="mt-2 flex flex-wrap gap-1">
                  <span
                      v-for="(v, k) in fmt.options"
                      :key="k"
                      class="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 font-mono text-gray-500 dark:text-gray-400"
                  >
                    {{ k }}: {{ v }}
                  </span>
                </div>
              </div>
              <div class="flex gap-1 shrink-0">
                <u-button
                    color="neutral"
                    icon="i-heroicons-pencil"
                    size="xs"
                    variant="ghost"
                    @click="openEdit(fmt)"
                />
                <u-button
                    color="error"
                    icon="i-heroicons-trash"
                    size="xs"
                    variant="ghost"
                    @click="remove(fmt.id)"
                />
              </div>
            </div>
          </u-card>
        </div>
      </div>
    </div>

    <!-- Create/Edit modal -->
    <u-modal
        v-model:open="showModal"
        :title="editing ? t('formats.edit_format', 'Edit format') : t('formats.new_number_format', 'New number format')"
    >
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <u-form-field
                :label="t('formats.locale', 'Locale')"
                required
            >
              <u-select
                  v-model="form.locale"
                  :items="localeOptions"
                  class="w-full"
              />
            </u-form-field>
            <u-form-field
                :hint="t('formats.format_name_hint', 'E.g.: currency, decimal, percent')"
                :label="t('formats.format_name', 'Format name')"
                required
            >
              <u-input
                  v-model="form.name"
                  class="w-full"
                  placeholder="currency"
              />
            </u-form-field>
          </div>

          <u-form-field :label="t('formats.style', 'Style')">
            <div class="grid grid-cols-4 gap-1.5">
              <button
                  v-for="s in ['decimal', 'currency', 'percent', 'unit']"
                  :key="s"
                  :class="form.options.style === s
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'"
                  class="px-2 py-1.5 rounded border text-xs font-mono transition-colors"
                  @click="form.options.style = s"
              >
                {{ s }}
              </button>
            </div>
          </u-form-field>

          <!-- Currency options -->
          <div
              v-if="form.options.style === 'currency'"
              class="grid grid-cols-2 gap-3"
          >
            <u-form-field :label="t('formats.currency', 'Currency (ISO 4217)')">
              <u-input
                  v-model="form.options.currency"
                  class="w-full"
                  placeholder="EUR"
              />
            </u-form-field>
            <u-form-field :label="t('formats.currency_display', 'Currency display')">
              <u-select
                  v-model="form.options.currencyDisplay"
                  :items="['symbol', 'narrowSymbol', 'code', 'name']"
                  class="w-full"
              />
            </u-form-field>
          </div>

          <!-- Unit options -->
          <div
              v-if="form.options.style === 'unit'"
              class="grid grid-cols-2 gap-3"
          >
            <u-form-field
                :hint="t('formats.unit_hint', 'E.g.: kilometer, kilogram')"
                :label="t('formats.unit', 'Unit')"
            >
              <u-input
                  v-model="form.options.unit"
                  class="w-full"
                  placeholder="kilometer"
              />
            </u-form-field>
            <u-form-field :label="t('formats.unit_display', 'Unit display')">
              <u-select
                  v-model="form.options.unitDisplay"
                  :items="['short', 'long', 'narrow']"
                  class="w-full"
              />
            </u-form-field>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <u-form-field :label="t('formats.notation', 'Notation')">
              <u-select
                  v-model="form.options.notation"
                  :items="[{label: t('formats.standard_default', 'Standard (default)'), value: ''}, 'standard', 'scientific', 'engineering', 'compact']"
                  class="w-full"
              />
            </u-form-field>
            <u-form-field :label="t('formats.grouping', 'Grouping')">
              <u-select
                  v-model="form.options.useGrouping"
                  :items="[{label: t('formats.auto_default', 'Auto (default)'), value: ''}, {label: t('formats.enabled', 'Enabled'), value: true}, {label: t('formats.disabled', 'Disabled'), value: false}]"
                  class="w-full"
              />
            </u-form-field>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <u-form-field :label="t('formats.min_fraction_digits', 'Min digits after decimal')">
              <u-input
                  v-model.number="form.options.minimumFractionDigits"
                  class="w-full"
                  max="20"
                  min="0"
                  placeholder="0"
                  type="number"
              />
            </u-form-field>
            <u-form-field :label="t('formats.max_fraction_digits', 'Max digits after decimal')">
              <u-input
                  v-model.number="form.options.maximumFractionDigits"
                  class="w-full"
                  max="20"
                  min="0"
                  placeholder="3"
                  type="number"
              />
            </u-form-field>
          </div>

          <!-- Live preview -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p class="text-xs text-gray-400 mb-1">
              {{ t('formats.preview', 'Preview') }} (1234.56):
            </p>
            <p class="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300">
              {{ previewNumber(cleanOptions) }}
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <u-button
              color="neutral"
              variant="ghost"
              @click="showModal = false"
          >
            {{ t('common.cancel', 'Cancel') }}
          </u-button>
          <u-button
              :loading="saving"
              @click="save"
          >
            {{ editing ? t('formats.update', 'Update') : t('common.create', 'Create') }}
          </u-button>
        </div>
      </template>
    </u-modal>
  </div>
</template>

<script lang="ts" setup>
  const { numberFormats, snippet, createNumberFormat, updateNumberFormat, deleteNumberFormat } = useFormats()
  const { findLanguage, projectLanguages } = useLanguages()
  const toast = useToast()
  const { t } = useT()

  const localeOptions = computed(() =>
      (projectLanguages.value || []).map((l: any) => ({ label: `${l.code} — ${l.name}`, value: l.code }))
  )

  const groupedByLocale = computed(() => {
    const groups: Record<string, any[]> = {}
    for (const fmt of (numberFormats.value || [])) {
      if (!groups[fmt.locale]) groups[fmt.locale] = []
      groups[fmt.locale].push(fmt)
    }
    return groups
  })

  const previewNumber = (opts: Record<string, any>) => {
    try {
      const clean: any = {}
      for (const [k, v] of Object.entries(opts)) {
        if (v !== '' && v !== null && v !== undefined) clean[k] = v
      }
      return new Intl.NumberFormat('fr-FR', clean).format(1234.56)
    } catch {
      return '—'
    }
  }

  const showModal = ref(false)
  const saving = ref(false)
  const editing = ref<any>(null)

  const defaultForm = () => ({
    locale: (projectLanguages.value as any[])?.[0]?.code || 'fr',
    name: '',
    options: {
      style: 'decimal',
      currency: '',
      currencyDisplay: 'symbol',
      notation: '',
      useGrouping: '',
      minimumFractionDigits: '',
      maximumFractionDigits: '',
      unit: '',
      unitDisplay: 'short',
    } as Record<string, any>,
  })

  const form = ref(defaultForm())

  const cleanOptions = computed(() => {
    const o: Record<string, any> = {}
    for (const [k, v] of Object.entries(form.value.options)) {
      if (v !== '' && v !== null && v !== undefined) o[k] = v
    }
    return o
  })

  const openCreate = () => {
    editing.value = null
    form.value = defaultForm()
    showModal.value = true
  }

  const openEdit = (fmt: any) => {
    editing.value = fmt
    form.value = {
      locale: fmt.locale,
      name: fmt.name,
      options: {
        style: 'decimal',
        currency: '',
        currencyDisplay: 'symbol',
        notation: '',
        useGrouping: '',
        minimumFractionDigits: '',
        maximumFractionDigits: '',
        unit: '',
        unitDisplay: 'short', ...fmt.options
      },
    }
    showModal.value = true
  }

  const save = async () => {
    if (!form.value.locale || !form.value.name) return
    saving.value = true
    try {
      if (editing.value) {
        await updateNumberFormat(editing.value.id, form.value.locale, form.value.name, cleanOptions.value)
        toast.add({ title: t('formats.format_updated', 'Format updated'), color: 'success' })
      } else {
        await createNumberFormat(form.value.locale, form.value.name, cleanOptions.value)
        toast.add({ title: t('formats.format_created', 'Format created'), color: 'success' })
      }
      showModal.value = false
    } catch (e: any) {
      toast.add({ title: t('common.error', 'Error'), description: e.message, color: 'error' })
    } finally {
      saving.value = false
    }
  }

  const remove = async (id: number) => {
    await deleteNumberFormat(id)
    toast.add({ title: t('formats.format_deleted', 'Format deleted'), color: 'success' })
  }
</script>

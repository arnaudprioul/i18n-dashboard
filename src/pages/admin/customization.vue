<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('customization.title', 'Customization') }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">
        {{ t('customization.description', 'Configure branding, theme and custom widgets') }}
      </p>
    </div>

    <!-- Config file override notice -->
    <u-alert
        v-if="hasConfigFile"
        :description="t('customization.config_file_description', 'Values in i18n-dashboard.config.json override these settings.')"
        :title="t('customization.config_file_active', 'Config file is active')"
        class="mb-6"
        color="info"
        icon="i-heroicons-information-circle"
    />

    <div class="max-w-3xl space-y-6">
      <!-- ── Branding ──────────────────────────────────────────────────── -->
      <u-card>
        <template #header>
          <div class="flex items-center gap-2">
            <u-icon
                class="text-primary-500"
                name="i-heroicons-paint-brush"
            />
            <h2 class="font-semibold text-gray-900 dark:text-white">
              {{ t('customization.branding', 'Branding') }}
            </h2>
          </div>
        </template>

        <div class="space-y-4">
          <u-form-field :label="t('customization.app_name', 'App name')">
            <u-input
                v-model="branding.name"
                :placeholder="t('customization.app_name_placeholder', 'i18n Dashboard')"
                class="w-full"
            />
          </u-form-field>
          <u-form-field :label="t('customization.subtitle', 'Subtitle')">
            <u-input
                v-model="branding.subtitle"
                :placeholder="t('customization.subtitle_placeholder', 'vue-i18n manager')"
                class="w-full"
            />
          </u-form-field>
          <u-form-field :label="t('customization.logo_url', 'Logo URL')">
            <u-input
                v-model="branding.logoUrl"
                :placeholder="t('customization.logo_url_placeholder', 'https://example.com/logo.png')"
                class="w-full"
            />
            <template #help>
              {{ t('customization.logo_url_hint', 'URL or base64 data URI. Replaces the default language icon.') }}
            </template>
          </u-form-field>

          <!-- Logo preview -->
          <div
              v-if="branding.logoUrl"
              class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div class="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center overflow-hidden shrink-0">
              <img
                  :alt="branding.name || t('customization.logo_alt', 'logo')"
                  :src="branding.logoUrl"
                  class="w-full h-full object-cover"
              >
            </div>
            <div>
              <p class="text-sm font-bold text-gray-900 dark:text-white">
                {{ branding.name || t('customization.default_app_name', 'i18n Dashboard') }}
              </p>
              <p class="text-xs text-gray-400">
                {{ branding.subtitle || t('customization.default_subtitle', 'vue-i18n manager') }}
              </p>
            </div>
          </div>
        </div>
      </u-card>

      <!-- ── Theme ─────────────────────────────────────────────────────── -->
      <u-card>
        <template #header>
          <div class="flex items-center gap-2">
            <u-icon
                class="text-primary-500"
                name="i-heroicons-swatch"
            />
            <h2 class="font-semibold text-gray-900 dark:text-white">
              {{ t('customization.theme', 'Theme') }}
            </h2>
          </div>
        </template>

        <div class="space-y-5">
          <!-- Primary color -->
          <u-form-field :label="t('customization.primary_color', 'Primary color')">
            <div class="flex flex-wrap gap-2 mt-1">
              <button
                  v-for="color in PRIMARY_COLORS"
                  :key="color"
                  :class="theme.primary === color
                  ? 'border-gray-900 dark:border-white scale-110'
                  : 'border-black/10 hover:scale-105'"
                  :style="{ backgroundColor: COLOR_HEX[color] }"
                  :title="color"
                  class="w-7 h-7 rounded-full border-2 transition-all"
                  @click="theme.primary = theme.primary === color ? '' : color"
              />
              <button
                  :class="!theme.primary ? 'border-gray-900 dark:border-white' : ''"
                  :title="t('customization.default', 'Default')"
                  class="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:border-gray-400 transition-colors"
                  @click="theme.primary = ''"
              >
                <u-icon
                    class="text-xs"
                    name="i-heroicons-x-mark"
                />
              </button>
            </div>
            <p
                v-if="theme.primary"
                class="mt-1.5 text-xs text-gray-400"
            >
              {{ theme.primary }}
            </p>
          </u-form-field>

          <!-- Neutral color -->
          <u-form-field :label="t('customization.neutral_color', 'Neutral color')">
            <div class="flex flex-wrap gap-2 mt-1">
              <button
                  v-for="color in NEUTRAL_COLORS"
                  :key="color"
                  :class="theme.neutral === color
                  ? 'border-gray-900 dark:border-white scale-110'
                  : 'border-black/10 hover:scale-105'"
                  :style="{ backgroundColor: COLOR_HEX[color] }"
                  :title="color"
                  class="w-7 h-7 rounded-full border-2 transition-all"
                  @click="theme.neutral = theme.neutral === color ? '' : color"
              />
              <button
                  :class="!theme.neutral ? 'border-gray-900 dark:border-white' : ''"
                  :title="t('customization.default', 'Default')"
                  class="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:border-gray-400 transition-colors"
                  @click="theme.neutral = ''"
              >
                <u-icon
                    class="text-xs"
                    name="i-heroicons-x-mark"
                />
              </button>
            </div>
            <p
                v-if="theme.neutral"
                class="mt-1.5 text-xs text-gray-400"
            >
              {{ theme.neutral }}
            </p>
          </u-form-field>
        </div>
      </u-card>

      <!-- ── Custom widgets ────────────────────────────────────────────── -->
      <u-card>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <u-icon
                  class="text-primary-500"
                  name="i-heroicons-puzzle-piece"
              />
              <h2 class="font-semibold text-gray-900 dark:text-white">
                {{ t('customization.custom_widgets', 'Custom widgets') }}
              </h2>
            </div>
            <u-button
                color="neutral"
                icon="i-heroicons-plus"
                size="xs"
                variant="outline"
                @click="openAddWidget"
            >
              {{ t('common.add', 'Add') }}
            </u-button>
          </div>
        </template>

        <div
            v-if="customWidgets.length === 0"
            class="text-center py-8 text-gray-400"
        >
          <u-icon
              class="text-3xl mb-2"
              name="i-heroicons-puzzle-piece"
          />
          <p class="text-sm">
            {{ t('customization.no_custom_widgets', 'No custom widgets defined') }}
          </p>
          <p class="text-xs mt-1">
            {{
              t('customization.custom_widgets_hint', 'Add iframe-based widgets that appear in the dashboard widget picker')
            }}
          </p>
        </div>

        <div
            v-else
            class="space-y-2"
        >
          <div
              v-for="(widget, index) in customWidgets"
              :key="widget.type"
              class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div class="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950 flex items-center justify-center shrink-0">
              <u-icon
                  :name="widget.icon || 'i-heroicons-puzzle-piece'"
                  class="text-primary-500"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {{ widget.label }}
              </p>
              <p class="text-xs text-gray-400 truncate">
                {{ widget.config.url }}
              </p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <u-button
                  color="neutral"
                  icon="i-heroicons-pencil"
                  size="xs"
                  variant="ghost"
                  @click="openEditWidget(widget, index)"
              />
              <u-button
                  color="error"
                  icon="i-heroicons-trash"
                  size="xs"
                  variant="ghost"
                  @click="removeWidget(index)"
              />
            </div>
          </div>
        </div>
      </u-card>

      <!-- Save button -->
      <div class="flex justify-end">
        <u-button
            :loading="saving"
            icon="i-heroicons-check"
            @click="save"
        >
          {{ t('common.save', 'Save') }}
        </u-button>
      </div>
    </div>

    <!-- ── Widget editor modal ─────────────────────────────────────────── -->
    <u-modal
        v-model:open="showWidgetEditor"
        :title="editingIndex === -1
        ? t('customization.add_widget', 'Add custom widget')
        : t('customization.edit_widget', 'Edit custom widget')"
    >
      <template #body>
        <div class="space-y-4 p-1">
          <div class="grid grid-cols-2 gap-4">
            <u-form-field
                :label="t('customization.widget_type', 'Type ID')"
                required
            >
              <u-input
                  v-model="widgetForm.type"
                  :disabled="editingIndex !== -1"
                  :placeholder="t('customization.widget_type_placeholder', 'my-metrics')"
                  class="w-full"
              />
              <template #help>
                {{ t('customization.widget_type_hint', 'Unique identifier, no spaces') }}
              </template>
            </u-form-field>

            <u-form-field
                :label="t('customization.widget_label', 'Label')"
                required
            >
              <u-input
                  v-model="widgetForm.label"
                  :placeholder="t('customization.widget_label_placeholder', 'My Metrics')"
                  class="w-full"
              />
            </u-form-field>
          </div>

          <u-form-field :label="t('customization.widget_description', 'Description')">
            <u-input
                v-model="widgetForm.description"
                :placeholder="t('customization.widget_description_placeholder', 'Short description shown in the widget picker')"
                class="w-full"
            />
          </u-form-field>

          <u-form-field
              :label="t('customization.widget_url', 'iframe URL')"
              required
          >
            <u-input
                v-model="widgetForm.config.url"
                class="w-full"
                placeholder="https://example.com/embed"
            />
          </u-form-field>

          <u-form-field :label="t('customization.widget_icon', 'Icon')">
            <u-input
                v-model="widgetForm.icon"
                class="w-full"
                placeholder="i-heroicons-chart-bar"
            />
            <template #help>
              {{ t('customization.widget_icon_hint', 'Heroicons name, e.g. i-heroicons-chart-bar') }}
            </template>
          </u-form-field>

          <u-form-field :label="t('customization.widget_sizes', 'Available sizes')">
            <div class="flex gap-2 mt-1">
              <button
                  v-for="size in WIDGET_SIZES"
                  :key="size"
                  :class="widgetForm.sizes.includes(size)
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400'"
                  class="px-3 py-1.5 text-xs rounded-lg border transition-colors"
                  @click="toggleWidgetSize(size)"
              >
                {{ size }}
              </button>
            </div>
          </u-form-field>

          <u-form-field :label="t('customization.widget_default_size', 'Default size')">
            <div class="flex gap-2 mt-1">
              <button
                  v-for="size in widgetForm.sizes"
                  :key="size"
                  :class="widgetForm.defaultSize === size
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400'"
                  class="px-3 py-1.5 text-xs rounded-lg border transition-colors"
                  @click="widgetForm.defaultSize = size"
              >
                {{ size }}
              </button>
            </div>
          </u-form-field>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <u-button
              color="neutral"
              variant="ghost"
              @click="showWidgetEditor = false"
          >
            {{ t('common.cancel', 'Cancel') }}
          </u-button>
          <u-button
              :disabled="!widgetForm.type || !widgetForm.label || !widgetForm.config.url"
              @click="saveWidget"
          >
            {{ editingIndex === -1 ? t('common.add', 'Add') : t('common.save', 'Save') }}
          </u-button>
        </div>
      </template>
    </u-modal>
  </div>
</template>

<script lang="ts" setup>
  import type { ICustomWidgetDef } from '../../interfaces/project-config.interface'
  import { WIDGET_SIZE } from '../../enums/dashboard.enum'

  const { t } = useT()
  const { loadCustomization, saveCustomization: adminSaveCustomization, customizationSaving: saving } = useAdmin()
  const { refresh: refreshModuleConfig } = useModuleConfig()

  const PRIMARY_COLORS = [
    'red', 'orange', 'amber', 'yellow', 'lime',
    'green', 'emerald', 'teal', 'cyan', 'sky',
    'blue', 'indigo', 'violet', 'purple', 'fuchsia',
    'pink', 'rose',
  ]

  const NEUTRAL_COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone']

  // Hardcoded palette values (shade 500 for primary, shade 400 for neutral).
  // Tailwind v4 only generates CSS variables for statically-referenced colors,
  // so dynamic `var(--color-${color}-500)` references are undefined at runtime.
  const COLOR_HEX: Record<string, string> = {
    // primary (500)
    red: '#ef4444',
    orange: '#f97316',
    amber: '#f59e0b',
    yellow: '#eab308',
    lime: '#84cc16',
    green: '#22c55e',
    emerald: '#10b981',
    teal: '#14b8a6',
    cyan: '#06b6d4',
    sky: '#0ea5e9',
    blue: '#3b82f6',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    purple: '#a855f7',
    fuchsia: '#d946ef',
    pink: '#ec4899',
    rose: '#f43f5e',
    // neutral (400)
    slate: '#94a3b8',
    gray: '#9ca3af',
    zinc: '#a1a1aa',
    neutral: '#a3a3a3',
    stone: '#a8a29e',
  }

  const appConfig = useAppConfig()

  // ── State ──────────────────────────────────────────────────────────────────

  const pending = ref(true)
  const hasConfigFile = ref(false)

  const branding = reactive({ name: '', subtitle: '', logoUrl: '' })
  const theme = reactive({ primary: '', neutral: '' })

  // Live preview: update appConfig so the @nuxt/ui colors plugin applies
  // changes immediately as the user clicks swatches (before saving to DB)
  watch(() => theme.primary, (color) => {
    if (color) appConfig.ui.colors.primary = color
  })
  watch(() => theme.neutral, (color) => {
    if (color) appConfig.ui.colors.neutral = color
  })
  const customWidgets = ref<ICustomWidgetDef[]>([])

  // Widget editor
  const showWidgetEditor = ref(false)
  const editingWidget = ref<ICustomWidgetDef | null>(null)
  const editingIndex = ref(-1)
  const widgetForm = reactive<ICustomWidgetDef>({
    type: '',
    label: '',
    description: '',
    icon: 'i-heroicons-puzzle-piece',
    sizes: [WIDGET_SIZE.MD, WIDGET_SIZE.LG, WIDGET_SIZE.WIDE],
    defaultSize: WIDGET_SIZE.MD,
    config: { kind: 'iframe', url: '' },
  })
  const WIDGET_SIZES = Object.values(WIDGET_SIZE)

  // ── Load ───────────────────────────────────────────────────────────────────

  const { data, refresh } = await useAsyncData('admin-customization', () => loadCustomization())

  watchEffect(() => {
    if (!data.value) return
    hasConfigFile.value = data.value.hasConfigFile ?? false
    Object.assign(branding, data.value.branding ?? {})
    Object.assign(theme, data.value.theme ?? {})
    customWidgets.value = data.value.customWidgets ?? []
    pending.value = false
  })

  // ── Save ───────────────────────────────────────────────────────────────────

  async function save () {
    const ok = await adminSaveCustomization({
      branding: { ...branding },
      theme: { ...theme },
      customWidgets: customWidgets.value,
    })
    if (ok) await refreshModuleConfig()
  }

  // ── Widget editor ──────────────────────────────────────────────────────────

  function openAddWidget () {
    Object.assign(widgetForm, {
      type: '',
      label: '',
      description: '',
      icon: 'i-heroicons-puzzle-piece',
      sizes: [WIDGET_SIZE.MD, WIDGET_SIZE.LG, WIDGET_SIZE.WIDE],
      defaultSize: WIDGET_SIZE.MD,
      config: { kind: 'iframe', url: '' },
    })
    editingIndex.value = -1
    showWidgetEditor.value = true
  }

  function openEditWidget (widget: ICustomWidgetDef, index: number) {
    Object.assign(widgetForm, {
      ...widget,
      sizes: [...widget.sizes],
      config: { ...widget.config },
    })
    editingIndex.value = index
    showWidgetEditor.value = true
  }

  function toggleWidgetSize (size: string) {
    const idx = widgetForm.sizes.indexOf(size)
    if (idx === -1) {
      widgetForm.sizes.push(size)
    } else if (widgetForm.sizes.length > 1) {
      widgetForm.sizes.splice(idx, 1)
      if (widgetForm.defaultSize === size) {
        widgetForm.defaultSize = widgetForm.sizes[0]
      }
    }
  }

  function saveWidget () {
    if (!widgetForm.type || !widgetForm.label || !widgetForm.config.url) return
    const widget: ICustomWidgetDef = {
      type: widgetForm.type,
      label: widgetForm.label,
      description: widgetForm.description,
      icon: widgetForm.icon,
      sizes: [...widgetForm.sizes],
      defaultSize: widgetForm.defaultSize,
      config: { kind: 'iframe', url: widgetForm.config.url },
    }
    if (editingIndex.value === -1) {
      customWidgets.value.push(widget)
    } else {
      customWidgets.value[editingIndex.value] = widget
    }
    showWidgetEditor.value = false
  }

  function removeWidget (index: number) {
    customWidgets.value.splice(index, 1)
  }
</script>

<script lang="ts" setup>
import type { ICustomWidgetDef } from '../../interfaces/project-config.interface'

const { t } = useT()
const toast = useToast()
const { refresh: refreshModuleConfig } = useModuleConfig()

const TAILWIND_COLORS = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose',
]

const PRIMARY_COLORS = [
  'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose',
]

const NEUTRAL_COLORS = ['slate', 'gray', 'zinc', 'neutral', 'stone']

// ── State ──────────────────────────────────────────────────────────────────

const pending = ref(true)
const saving = ref(false)
const hasConfigFile = ref(false)

const branding = reactive({ name: '', subtitle: '', logoUrl: '' })
const theme = reactive({ primary: '', neutral: '' })
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
  sizes: ['md', 'lg', 'wide'],
  defaultSize: 'md',
  config: { kind: 'iframe', url: '' },
})
const WIDGET_SIZES = ['sm', 'md', 'lg', 'wide', 'xl']

// ── Load ───────────────────────────────────────────────────────────────────

const { data, refresh } = await useFetch('/api/admin/customization', { key: 'admin-customization' })

watchEffect(() => {
  if (!data.value) return
  hasConfigFile.value = data.value.hasConfigFile ?? false
  Object.assign(branding, data.value.branding ?? {})
  Object.assign(theme, data.value.theme ?? {})
  customWidgets.value = data.value.customWidgets ?? []
  pending.value = false
})

// ── Save ───────────────────────────────────────────────────────────────────

async function save() {
  saving.value = true
  try {
    await $fetch('/api/admin/customization', {
      method: 'POST',
      body: {
        branding: { ...branding },
        theme: { ...theme },
        customWidgets: customWidgets.value,
      },
    })
    await refreshModuleConfig()
    toast.add({ title: t('customization.saved', 'Customization saved'), color: 'success' })
  }
  catch {
    toast.add({ title: t('common.error', 'An error occurred'), color: 'error' })
  }
  finally {
    saving.value = false
  }
}

// ── Widget editor ──────────────────────────────────────────────────────────

function openAddWidget() {
  Object.assign(widgetForm, {
    type: '',
    label: '',
    description: '',
    icon: 'i-heroicons-puzzle-piece',
    sizes: ['md', 'lg', 'wide'],
    defaultSize: 'md',
    config: { kind: 'iframe', url: '' },
  })
  editingIndex.value = -1
  showWidgetEditor.value = true
}

function openEditWidget(widget: ICustomWidgetDef, index: number) {
  Object.assign(widgetForm, {
    ...widget,
    sizes: [...widget.sizes],
    config: { ...widget.config },
  })
  editingIndex.value = index
  showWidgetEditor.value = true
}

function toggleWidgetSize(size: string) {
  const idx = widgetForm.sizes.indexOf(size)
  if (idx === -1) {
    widgetForm.sizes.push(size)
  }
  else if (widgetForm.sizes.length > 1) {
    widgetForm.sizes.splice(idx, 1)
    if (widgetForm.defaultSize === size) {
      widgetForm.defaultSize = widgetForm.sizes[0]
    }
  }
}

function saveWidget() {
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
  }
  else {
    customWidgets.value[editingIndex.value] = widget
  }
  showWidgetEditor.value = false
}

function removeWidget(index: number) {
  customWidgets.value.splice(index, 1)
}
</script>

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
    <UAlert
      v-if="hasConfigFile"
      class="mb-6"
      icon="i-heroicons-information-circle"
      color="info"
      :title="t('customization.config_file_active', 'Config file is active')"
      :description="t('customization.config_file_description', 'Values in i18n-dashboard.config.json override these settings.')"
    />

    <div class="max-w-3xl space-y-6">
      <!-- ── Branding ──────────────────────────────────────────────────── -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons-paint-brush"
              class="text-primary-500"
            />
            <h2 class="font-semibold text-gray-900 dark:text-white">
              {{ t('customization.branding', 'Branding') }}
            </h2>
          </div>
        </template>

        <div class="space-y-4">
          <UFormField :label="t('customization.app_name', 'App name')">
            <UInput
              v-model="branding.name"
              :placeholder="t('customization.app_name_placeholder', 'i18n Dashboard')"
              class="w-full"
            />
          </UFormField>
          <UFormField :label="t('customization.subtitle', 'Subtitle')">
            <UInput
              v-model="branding.subtitle"
              :placeholder="t('customization.subtitle_placeholder', 'vue-i18n manager')"
              class="w-full"
            />
          </UFormField>
          <UFormField :label="t('customization.logo_url', 'Logo URL')">
            <UInput
              v-model="branding.logoUrl"
              :placeholder="t('customization.logo_url_placeholder', 'https://example.com/logo.png')"
              class="w-full"
            />
            <template #help>
              {{ t('customization.logo_url_hint', 'URL or base64 data URI. Replaces the default language icon.') }}
            </template>
          </UFormField>

          <!-- Logo preview -->
          <div
            v-if="branding.logoUrl"
            class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div class="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center overflow-hidden shrink-0">
              <img
                :src="branding.logoUrl"
                :alt="branding.name || 'logo'"
                class="w-full h-full object-cover"
              >
            </div>
            <div>
              <p class="text-sm font-bold text-gray-900 dark:text-white">
                {{ branding.name || 'i18n Dashboard' }}
              </p>
              <p class="text-xs text-gray-400">
                {{ branding.subtitle || 'vue-i18n manager' }}
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- ── Theme ─────────────────────────────────────────────────────── -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons-swatch"
              class="text-primary-500"
            />
            <h2 class="font-semibold text-gray-900 dark:text-white">
              {{ t('customization.theme', 'Theme') }}
            </h2>
          </div>
        </template>

        <div class="space-y-5">
          <!-- Primary color -->
          <UFormField :label="t('customization.primary_color', 'Primary color')">
            <div class="flex flex-wrap gap-2 mt-1">
              <button
                v-for="color in PRIMARY_COLORS"
                :key="color"
                class="w-7 h-7 rounded-full border-2 transition-all"
                :class="[
                  `bg-${color}-500`,
                  theme.primary === color
                    ? 'border-gray-900 dark:border-white scale-110'
                    : 'border-transparent hover:scale-105',
                ]"
                :title="color"
                @click="theme.primary = theme.primary === color ? '' : color"
              />
              <button
                class="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:border-gray-400 transition-colors"
                :class="!theme.primary ? 'border-gray-900 dark:border-white' : ''"
                :title="t('customization.default', 'Default')"
                @click="theme.primary = ''"
              >
                <UIcon
                  name="i-heroicons-x-mark"
                  class="text-xs"
                />
              </button>
            </div>
            <p
              v-if="theme.primary"
              class="mt-1.5 text-xs text-gray-400"
            >
              {{ theme.primary }}
            </p>
          </UFormField>

          <!-- Neutral color -->
          <UFormField :label="t('customization.neutral_color', 'Neutral color')">
            <div class="flex flex-wrap gap-2 mt-1">
              <button
                v-for="color in NEUTRAL_COLORS"
                :key="color"
                class="w-7 h-7 rounded-full border-2 transition-all"
                :class="[
                  `bg-${color}-400`,
                  theme.neutral === color
                    ? 'border-gray-900 dark:border-white scale-110'
                    : 'border-transparent hover:scale-105',
                ]"
                :title="color"
                @click="theme.neutral = theme.neutral === color ? '' : color"
              />
              <button
                class="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:border-gray-400 transition-colors"
                :class="!theme.neutral ? 'border-gray-900 dark:border-white' : ''"
                :title="t('customization.default', 'Default')"
                @click="theme.neutral = ''"
              >
                <UIcon
                  name="i-heroicons-x-mark"
                  class="text-xs"
                />
              </button>
            </div>
            <p
              v-if="theme.neutral"
              class="mt-1.5 text-xs text-gray-400"
            >
              {{ theme.neutral }}
            </p>
          </UFormField>
        </div>
      </UCard>

      <!-- ── Custom widgets ────────────────────────────────────────────── -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-heroicons-puzzle-piece"
                class="text-primary-500"
              />
              <h2 class="font-semibold text-gray-900 dark:text-white">
                {{ t('customization.custom_widgets', 'Custom widgets') }}
              </h2>
            </div>
            <UButton
              size="xs"
              icon="i-heroicons-plus"
              variant="outline"
              color="neutral"
              @click="openAddWidget"
            >
              {{ t('common.add', 'Add') }}
            </UButton>
          </div>
        </template>

        <div
          v-if="customWidgets.length === 0"
          class="text-center py-8 text-gray-400"
        >
          <UIcon
            name="i-heroicons-puzzle-piece"
            class="text-3xl mb-2"
          />
          <p class="text-sm">
            {{ t('customization.no_custom_widgets', 'No custom widgets defined') }}
          </p>
          <p class="text-xs mt-1">
            {{ t('customization.custom_widgets_hint', 'Add iframe-based widgets that appear in the dashboard widget picker') }}
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
              <UIcon
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
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-heroicons-pencil"
                @click="openEditWidget(widget, index)"
              />
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                icon="i-heroicons-trash"
                @click="removeWidget(index)"
              />
            </div>
          </div>
        </div>
      </UCard>

      <!-- Save button -->
      <div class="flex justify-end">
        <UButton
          :loading="saving"
          icon="i-heroicons-check"
          @click="save"
        >
          {{ t('common.save', 'Save') }}
        </UButton>
      </div>
    </div>

    <!-- ── Widget editor modal ─────────────────────────────────────────── -->
    <UModal
      v-model:open="showWidgetEditor"
      :title="editingIndex === -1
        ? t('customization.add_widget', 'Add custom widget')
        : t('customization.edit_widget', 'Edit custom widget')"
    >
      <template #body>
        <div class="space-y-4 p-1">
          <div class="grid grid-cols-2 gap-4">
            <UFormField
              :label="t('customization.widget_type', 'Type ID')"
              required
            >
              <UInput
                v-model="widgetForm.type"
                placeholder="my-metrics"
                :disabled="editingIndex !== -1"
                class="w-full"
              />
              <template #help>
                {{ t('customization.widget_type_hint', 'Unique identifier, no spaces') }}
              </template>
            </UFormField>

            <UFormField
              :label="t('customization.widget_label', 'Label')"
              required
            >
              <UInput
                v-model="widgetForm.label"
                :placeholder="t('customization.widget_label_placeholder', 'My Metrics')"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField :label="t('customization.widget_description', 'Description')">
            <UInput
              v-model="widgetForm.description"
              :placeholder="t('customization.widget_description_placeholder', 'Short description shown in the widget picker')"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="t('customization.widget_url', 'iframe URL')"
            required
          >
            <UInput
              v-model="widgetForm.config.url"
              placeholder="https://example.com/embed"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('customization.widget_icon', 'Icon')">
            <UInput
              v-model="widgetForm.icon"
              placeholder="i-heroicons-chart-bar"
              class="w-full"
            />
            <template #help>
              {{ t('customization.widget_icon_hint', 'Heroicons name, e.g. i-heroicons-chart-bar') }}
            </template>
          </UFormField>

          <UFormField :label="t('customization.widget_sizes', 'Available sizes')">
            <div class="flex gap-2 mt-1">
              <button
                v-for="size in WIDGET_SIZES"
                :key="size"
                class="px-3 py-1.5 text-xs rounded-lg border transition-colors"
                :class="widgetForm.sizes.includes(size)
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400'"
                @click="toggleWidgetSize(size)"
              >
                {{ size }}
              </button>
            </div>
          </UFormField>

          <UFormField :label="t('customization.widget_default_size', 'Default size')">
            <div class="flex gap-2 mt-1">
              <button
                v-for="size in widgetForm.sizes"
                :key="size"
                class="px-3 py-1.5 text-xs rounded-lg border transition-colors"
                :class="widgetForm.defaultSize === size
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400'"
                @click="widgetForm.defaultSize = size"
              >
                {{ size }}
              </button>
            </div>
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="showWidgetEditor = false"
          >
            {{ t('common.cancel', 'Cancel') }}
          </UButton>
          <UButton
            :disabled="!widgetForm.type || !widgetForm.label || !widgetForm.config.url"
            @click="saveWidget"
          >
            {{ editingIndex === -1 ? t('common.add', 'Add') : t('common.save', 'Save') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

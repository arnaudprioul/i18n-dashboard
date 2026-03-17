<script lang="ts" setup>
import type { WidgetConfig, WidgetSize } from '~/types/dashboard.type'
import { WIDGET_REGISTRY } from '~/consts/dashboard.const'

const { t } = useT()

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'add': [widget: WidgetConfig]
}>()

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const selectedSizes = ref<Record<string, WidgetSize>>({})

function getSelectedSize(type: string): WidgetSize {
  return selectedSizes.value[type] ?? WIDGET_REGISTRY[type as keyof typeof WIDGET_REGISTRY].defaultSize
}

function addWidget(type: string) {
  const size = getSelectedSize(type)
  const id = Date.now().toString(36)
  emit('add', { id, type: type as WidgetConfig['type'], size })
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" :title="t('dashboard.add_widget', 'Add a widget')" :ui="{ width: 'max-w-2xl' }">
    <template #body>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
        <div
          v-for="(config, type) in WIDGET_REGISTRY"
          :key="type"
          class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
        >
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
              <UIcon :name="config.icon" class="text-gray-600 dark:text-gray-400" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ config.label }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ config.description }}</p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              v-for="s in config.sizes"
              :key="s"
              class="px-2 py-0.5 text-xs rounded-md border transition-colors"
              :class="getSelectedSize(type) === s
                ? 'bg-primary-500 border-primary-500 text-white'
                : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400'"
              @click="selectedSizes[type] = s"
            >
              {{ s }}
            </button>
          </div>

          <UButton size="xs" variant="soft" class="w-full justify-center" @click="addWidget(type)">
            {{ t('common.add', 'Add') }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

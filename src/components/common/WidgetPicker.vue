<template>
  <u-modal
    v-model:open="open"
    :title="t('dashboard.add_widget', 'Add a widget')"
    :ui="{ width: 'max-w-2xl' }"
  >
    <template #body>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
        <div
          v-for="[type, config] in availableWidgets"
          :key="type"
          class="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
        >
          <div class="flex items-start gap-3">
            <div
              :class="config.isCustom ? 'bg-primary-50 dark:bg-primary-950' : 'bg-gray-100 dark:bg-gray-800'"
              class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            >
              <u-icon
                :class="config.isCustom ? 'text-primary-500' : 'text-gray-600 dark:text-gray-400'"
                :name="config.icon"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">
                  {{ config.label }}
                </p>
                <span
                  v-if="config.isCustom"
                  class="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-medium leading-none"
                >
                  {{ t('dashboard.custom', 'Custom') }}
                </span>
              </div>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ config.description }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              v-for="s in config.sizes"
              :key="s"
              :class="getSelectedSize(type) === s
                ? 'bg-primary-500 border-primary-500 text-white'
                : 'bg-transparent border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-400'"
              class="px-2 py-0.5 text-xs rounded-md border transition-colors"
              @click="selectedSizes[type] = s"
            >
              {{ s }}
            </button>
          </div>

          <u-button
            class="w-full justify-center"
            size="xs"
            variant="soft"
            @click="addWidget(type)"
          >
            {{ t('common.add', 'Add') }}
          </u-button>
        </div>
      </div>
    </template>
  </u-modal>
</template>

<script lang="ts" setup>
  import type { TWidgetSize } from '../../types/dashboard.type'
  import type { IWidgetConfig, IWidgetPickerProps, IWidgetPickerEmits } from '../../interfaces/dashboard.interface'

  const { t } = useT()

  const props = defineProps<IWidgetPickerProps>()

  const emit = defineEmits<IWidgetPickerEmits>()

  const open = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v),
  })

  const { registry } = useWidgetRegistry()

  const availableWidgets = computed(() =>
      Object.entries(registry.value).filter(([type]) => !props.excludeTypes?.includes(type)),
  )

  const selectedSizes = ref<Record<string, TWidgetSize>>({})

  const getSelectedSize = (type: string): TWidgetSize => {
    return selectedSizes.value[type] ?? registry.value[type]?.defaultSize ?? 'md'
  }

  const addWidget = (type: string) => {
    const size = getSelectedSize(type)
    const id = Date.now().toString(36)
    emit('add', { id, type, size })
    open.value = false
  }
</script>

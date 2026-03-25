<script lang="ts" setup>
import type { ICustomWidgetDef } from '../../../interfaces/project-config.interface'

const props = defineProps<{
  id: string
  type: string
  size: string
  editing?: boolean
  title?: string
}>()

const { customWidgets } = useModuleConfig()
const def = computed<ICustomWidgetDef | undefined>(() =>
  customWidgets.value.find(w => w.type === props.type),
)
const url = computed(() =>
  def.value?.config?.kind === 'iframe' ? def.value.config.url : null,
)
const label = computed(() => props.title || def.value?.label || props.type)
</script>

<template>
  <div class="w-full h-full relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
    <!-- Edit-mode overlay -->
    <div
      v-if="editing"
      class="absolute inset-0 z-10 bg-gray-900/30 flex flex-col items-center justify-center gap-2 pointer-events-none"
    >
      <UIcon
        name="i-heroicons-puzzle-piece"
        class="text-white text-3xl"
      />
      <span class="text-white text-xs font-medium">{{ label }}</span>
    </div>

    <iframe
      v-if="url"
      :src="url"
      :title="label"
      class="w-full h-full border-0"
      loading="lazy"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
    <div
      v-else
      class="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2"
    >
      <UIcon
        name="i-heroicons-puzzle-piece"
        class="text-3xl"
      />
      <span class="text-xs">{{ label }}</span>
      <span class="text-xs text-gray-300 dark:text-gray-600">No URL configured</span>
    </div>
  </div>
</template>

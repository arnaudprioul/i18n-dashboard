<script lang="ts" setup>
import type { PropType } from 'vue'
import type { TWidgetSize } from '~/types/dashboard.type'
import type { IWidgetDataSource } from '~/interfaces/dashboard.interface'
import { TRANSLATION_STATUS } from '~/enums/translation.enum'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  size: {
    type: String as PropType<TWidgetSize>,
    required: true,
  },
  editing: {
    type: Boolean,
    required: true,
  },
  dataSource: {
    type: Object as PropType<IWidgetDataSource | undefined>,
    default: undefined,
  },
  title: {
    type: String as PropType<string | undefined>,
    default: undefined,
  },
})

const { t } = useT()

const { effectiveSource, sourceLabel, hasProject } = useWidgetData(
  props.id,
  computed(() => props.dataSource),
)

const effectiveProjectId = computed(() => {
  const src = effectiveSource.value
  if (src.type === 'project') return src.projectId
  return undefined // global = unsupported for review queue
})

const fetchKey = computed(() => `widget-review-${props.id}-${effectiveProjectId.value ?? 'none'}`)

const { data: reviewData, pending, refresh } = useAsyncData(
  () => fetchKey.value,
  async () => {
    if (!effectiveProjectId.value) return null
    return await $fetch<any>('/api/keys', {
      query: {
        project_id: effectiveProjectId.value,
        status: TRANSLATION_STATUS.DRAFT,
        limit: 200,
      },
    })
  },
  { server: false, watch: [fetchKey] },
)

const reviewItems = computed(() => {
  const keys = reviewData.value?.data ?? []
  const result: Array<{ id: number; key: string; key_description?: string; language_code: string; value: string }> = []
  for (const k of keys) {
    for (const [lang, tr] of Object.entries(k.translations as Record<string, any>)) {
      if (tr?.status === TRANSLATION_STATUS.DRAFT && tr?.value) {
        result.push({ id: tr.id, key: k.key, key_description: k.description, language_code: lang, value: tr.value })
      }
    }
  }
  return result
})

const maxItems = computed(() => {
  if (props.size === 'lg') return 8
  return 4
})

const displayedItems = computed(() => reviewItems.value.slice(0, maxItems.value))

const displayTitle = computed(() => props.title || t('review.title', 'Review queue'))

const processingId = ref<number | null>(null)
const processingAction = ref('')

async function setStatus(item: { id: number }, status: string): Promise<void> {
  processingId.value = item.id
  processingAction.value = status
  try {
    await $fetch('/api/translations/bulk-status', {
      method: 'POST',
      body: { ids: [item.id], status },
    })
    await refresh()
  } catch {} finally {
    processingId.value = null
    processingAction.value = ''
  }
}
</script>

<template>
  <UCard class="h-full overflow-hidden">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-clipboard-document-check" class="text-gray-400" />
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ displayTitle }}</span>
        <UBadge v-if="reviewItems.length" :label="String(reviewItems.length)" color="warning" variant="soft" size="xs" class="ml-auto" />
        <span v-else-if="sourceLabel" class="ml-auto text-xs text-gray-400 dark:text-gray-500">{{ sourceLabel }}</span>
      </div>
    </template>

    <div v-if="pending" class="space-y-2">
      <USkeleton v-for="i in 3" :key="i" class="h-12 w-full" />
    </div>

    <div v-else-if="!hasProject" class="flex flex-col items-center justify-center h-full py-6 text-center">
      <UIcon name="i-heroicons-clipboard-document-check" class="text-3xl text-gray-300 dark:text-gray-600 mb-2" />
      <p class="text-sm text-gray-400">{{ t('dashboard.select_project', 'Select a project') }}</p>
    </div>

    <div v-else-if="!displayedItems.length" class="flex flex-col items-center justify-center h-full py-6 text-center">
      <UIcon name="i-heroicons-check-circle" class="text-3xl text-green-400 mb-2" />
      <p class="text-sm text-gray-400">{{ t('review.empty_title', 'No translations pending') }}</p>
    </div>

    <div v-else class="overflow-y-auto space-y-2">
      <div
        v-for="item in displayedItems"
        :key="item.id"
        class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
      >
        <div class="min-w-0 flex-1">
          <p class="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">{{ item.key }}</p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <UBadge :label="item.language_code.toUpperCase()" color="neutral" variant="soft" size="xs" />
            <p class="text-xs text-gray-500 truncate">{{ item.value }}</p>
          </div>
        </div>
        <UButton
          v-if="!editing"
          icon="i-heroicons-check"
          size="xs"
          color="success"
          variant="soft"
          :loading="processingId === item.id && processingAction === TRANSLATION_STATUS.REVIEWED"
          @click="setStatus(item, TRANSLATION_STATUS.REVIEWED)"
        />
      </div>
    </div>
  </UCard>
</template>

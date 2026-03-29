<template>
  <u-card class="h-full overflow-hidden">
    <template #header>
      <div class="flex items-center gap-2">
        <u-icon
          class="text-gray-400"
          name="i-heroicons-clipboard-document-check"
        />
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ displayTitle }}</span>
        <u-badge
          v-if="allReviewItems.length"
          :label="String(allReviewItems.length)"
          class="ml-auto"
          color="warning"
          size="xs"
          variant="soft"
        />
        <span
          v-else-if="sourceLabel"
          class="ml-auto text-xs text-gray-400 dark:text-gray-500"
        >{{ sourceLabel }}</span>
      </div>
    </template>

    <div
      v-if="pending"
      class="space-y-2"
    >
      <u-skeleton
        v-for="i in 3"
        :key="i"
        class="h-12 w-full"
      />
    </div>

    <div
      v-else-if="!hasProject"
      class="flex flex-col items-center justify-center h-full py-6 text-center"
    >
      <u-icon
        class="text-3xl text-gray-300 dark:text-gray-600 mb-2"
        name="i-heroicons-clipboard-document-check"
      />
      <p class="text-sm text-gray-400">
        {{ t('dashboard.select_project', 'Select a project') }}
      </p>
    </div>

    <div
      v-else-if="!displayedItems.length"
      class="flex flex-col items-center justify-center h-full py-6 text-center"
    >
      <u-icon
        class="text-3xl text-green-400 mb-2"
        name="i-heroicons-check-circle"
      />
      <p class="text-sm text-gray-400">
        {{ t('review.empty_title', 'No translations pending') }}
      </p>
    </div>

    <div
      v-else
      class="overflow-y-auto space-y-2"
    >
      <div
        v-for="item in displayedItems"
        :key="item.id"
        class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
      >
        <div class="min-w-0 flex-1">
          <p class="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
            {{ item.key }}
          </p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <u-badge
              :label="item.language_code.toUpperCase()"
              color="neutral"
              size="xs"
              variant="soft"
            />
            <p class="text-xs text-gray-500 truncate">
              {{ item.value }}
            </p>
          </div>
        </div>
        <u-button
          v-if="!editing"
          :loading="processingId === item.id && processingAction === TRANSLATION_STATUS.REVIEWED"
          color="success"
          icon="i-heroicons-check"
          size="xs"
          variant="soft"
          @click="setStatus(item, TRANSLATION_STATUS.REVIEWED)"
        />
      </div>
    </div>
  </u-card>
</template>

<script lang="ts" setup>
  import type { IWidgetBaseProps } from '../../../interfaces/dashboard.interface'
  import { TRANSLATION_STATUS } from '../../../enums/translation.enum'
  import { DATA_SOURCE_TYPE, WIDGET_SIZE } from '../../../enums/dashboard.enum'

  const props = defineProps<IWidgetBaseProps>()

  const { t } = useT()

  const { effectiveSource, sourceLabel, hasProject } = useWidgetData(
      props.id,
      computed(() => props.dataSource),
  )

  const effectiveProjectId = computed(() => {
    const src = effectiveSource.value
    if (src.type === DATA_SOURCE_TYPE.PROJECT) return src.projectId
    return undefined // global = unsupported for review queue
  })

  const { reviewItems: allReviewItems, pending, refresh, processingId, processingAction, setStatus } = useReview({
    projectId: effectiveProjectId,
  })

  const maxItems = computed(() => {
    if (props.size === WIDGET_SIZE.LG) return 8
    return 4
  })

  const displayedItems = computed(() => allReviewItems.value.slice(0, maxItems.value))

  const displayTitle = computed(() => props.title || t('review.title', 'Review queue'))
</script>

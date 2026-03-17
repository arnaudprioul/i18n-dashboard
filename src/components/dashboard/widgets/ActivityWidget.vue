<script lang="ts" setup>
import type { PropType } from 'vue'
import type { WidgetSize, WidgetDataSource } from '~/types/dashboard.type'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  size: {
    type: String as PropType<WidgetSize>,
    required: true,
  },
  editing: {
    type: Boolean,
    required: true,
  },
  dataSource: {
    type: Object as PropType<WidgetDataSource | undefined>,
    default: undefined,
  },
  title: {
    type: String as PropType<string | undefined>,
    default: undefined,
  },
})

const { t } = useT()

const { stats, pending, sourceLabel, hasProject } = useWidgetData(
  props.id,
  computed(() => props.dataSource),
)

const maxItems = computed(() => {
  if (props.size === 'lg') return 10
  if (props.size === 'wide') return 8
  return 5
})

const displayedActivity = computed(() => (stats.value?.recentActivity ?? []).slice(0, maxItems.value))

const displayTitle = computed(() => props.title || t('dashboard.recent_activity', 'Recent activity'))

function formatRelative(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return t('common.just_now', 'just now')
  if (min < 60) return `${min}min ${t('common.ago', 'ago')}`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h ${t('common.ago', 'ago')}`
  return `${Math.floor(h / 24)}d ${t('common.ago', 'ago')}`
}

function activityIcon(changedBy: string) {
  if (changedBy === 'google-translate') return 'i-heroicons-sparkles'
  if (changedBy === 'sync') return 'i-heroicons-arrow-path'
  return 'i-heroicons-pencil'
}
</script>

<template>
  <UCard class="h-full overflow-hidden">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-clock" class="text-gray-400" />
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ displayTitle }}</span>
        <span v-if="sourceLabel" class="ml-auto text-xs text-gray-400 dark:text-gray-500">{{ sourceLabel }}</span>
      </div>
    </template>

    <div v-if="pending" class="space-y-2">
      <USkeleton v-for="i in 4" :key="i" class="h-8 w-full" />
    </div>

    <div v-else-if="!hasProject" class="flex flex-col items-center justify-center h-full py-6 text-center">
      <UIcon name="i-heroicons-clock" class="text-3xl text-gray-300 dark:text-gray-600 mb-2" />
      <p class="text-sm text-gray-400">{{ t('dashboard.select_project', 'Select a project') }}</p>
    </div>

    <div v-else-if="!displayedActivity.length" class="flex flex-col items-center justify-center h-full py-6 text-center">
      <UIcon name="i-heroicons-clock" class="text-3xl text-gray-300 dark:text-gray-600 mb-2" />
      <p class="text-sm text-gray-400">{{ t('dashboard.no_activity', 'No recent activity') }}</p>
    </div>

    <div
      v-else
      class="overflow-y-auto"
      :class="size === 'wide' ? 'grid grid-cols-2 gap-x-4 gap-y-2' : 'space-y-2'"
    >
      <div
        v-for="item in displayedActivity"
        :key="item.id"
        class="flex items-start gap-2 py-1"
      >
        <div class="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
          <UIcon :name="activityIcon(item.changed_by)" class="text-xs text-gray-500 dark:text-gray-400" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">{{ item.key }}</p>
          <div class="flex items-center gap-1.5 mt-0.5">
            <UBadge :label="item.language_code.toUpperCase()" color="neutral" variant="soft" size="xs" />
            <span class="text-xs text-gray-400">{{ formatRelative(item.changed_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

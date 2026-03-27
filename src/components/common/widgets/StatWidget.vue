<template>
  <u-card class="h-full overflow-hidden">
    <div class="flex flex-col h-full justify-between">
      <div
          v-if="pending"
          class="space-y-2"
      >
        <u-skeleton class="h-8 w-16"/>
        <u-skeleton class="h-4 w-24"/>
      </div>

      <div
          v-else
          class="flex flex-col h-full"
      >
        <div class="flex items-start justify-between">
          <div
              :class="config.bgColor"
              class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          >
            <u-icon
                :class="config.iconColor"
                :name="config.icon"
                class="text-xl"
            />
          </div>
        </div>

        <div class="mt-auto">
          <p class="text-3xl font-bold text-gray-900 dark:text-white mt-3">
            {{ hasProject ? displayValue : '—' }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {{ displayLabel }}
          </p>
          <p
              v-if="!hasProject"
              class="text-xs text-gray-400 dark:text-gray-600 mt-1"
          >
            {{ t('dashboard.select_project', 'Select a project') }}
          </p>
          <p
              v-else-if="sourceLabel"
              class="text-xs text-gray-400 dark:text-gray-500 mt-1"
          >
            {{ sourceLabel }}
          </p>
        </div>

        <div
            v-if="size === 'md' && type === 'stat-coverage' && stats && hasProject"
            class="mt-3"
        >
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
                :style="{ width: `${coverage}%` }"
                class="bg-green-500 h-1.5 rounded-full transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  </u-card>
</template>

<script lang="ts" setup>
  import type { PropType } from 'vue'
  import type { TWidgetSize, TWidgetType } from '../../../types/dashboard.type'
  import type { IWidgetDataSource } from '../../../interfaces/dashboard.interface'

  const props = defineProps({
    id: {
      type: String,
      required: true,
    },
    type: {
      type: String as PropType<TWidgetType>,
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

  const { stats, pending, sourceLabel, hasProject } = useWidgetData(
      props.id,
      computed(() => props.dataSource),
  )

  const config = computed(() => {
    switch (props.type) {
      case 'stat-keys':
        return {
          label: t('dashboard.stat_total_keys', 'Total keys'),
          icon: 'i-heroicons-key',
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        }
      case 'stat-coverage':
        return {
          label: t('dashboard.stat_coverage', 'Coverage'),
          icon: 'i-heroicons-chart-bar',
          iconColor: 'text-green-600',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
        }
      case 'stat-languages':
        return {
          label: t('dashboard.stat_languages', 'Languages'),
          icon: 'i-heroicons-language',
          iconColor: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        }
      case 'stat-unused':
        return {
          label: t('dashboard.stat_unused', 'Unused'),
          icon: 'i-heroicons-exclamation-triangle',
          iconColor: 'text-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        }
      default:
        return { label: '', icon: '', iconColor: '', bgColor: '' }
    }
  })

  const displayLabel = computed(() => props.title || config.value.label)

  const coverage = computed(() => {
    const langs = stats.value?.languages
    if (!langs?.length) return 0
    const total = langs.reduce((sum: number, l: any) => sum + l.coverage, 0)
    return parseFloat((total / langs.length).toFixed(2))
  })

  const displayValue = computed(() => {
    if (!stats.value) return '—'
    switch (props.type) {
      case 'stat-keys':
        return stats.value.totalKeys ?? '—'
      case 'stat-coverage':
        return `${coverage.value.toFixed(2)}%`
      case 'stat-languages':
        return stats.value.languages?.length ?? '—'
      case 'stat-unused':
        return stats.value.unusedKeys ?? '—'
      default:
        return '—'
    }
  })
</script>

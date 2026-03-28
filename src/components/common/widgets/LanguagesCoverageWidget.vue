<template>
  <u-card class="h-full overflow-hidden">
    <template #header>
      <div class="flex items-center gap-2">
        <u-icon
            class="text-gray-400"
            name="i-heroicons-globe-alt"
        />
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ displayTitle }}</span>
        <span
            v-if="sourceLabel"
            class="ml-auto text-xs text-gray-400 dark:text-gray-500"
        >{{ sourceLabel }}</span>
      </div>
    </template>

    <div
        v-if="pending"
        class="space-y-3"
    >
      <u-skeleton
          v-for="i in 3"
          :key="i"
          class="h-8 w-full"
      />
    </div>

    <div
        v-else-if="!hasProject"
        class="flex flex-col items-center justify-center h-full py-6 text-center"
    >
      <u-icon
          class="text-3xl text-gray-300 dark:text-gray-600 mb-2"
          name="i-heroicons-globe-alt"
      />
      <p class="text-sm text-gray-400">
        {{ t('dashboard.select_project', 'Select a project') }}
      </p>
    </div>

    <div
        v-else-if="!displayedLanguages.length"
        class="flex flex-col items-center justify-center h-full py-6 text-center"
    >
      <u-icon
          class="text-3xl text-gray-300 dark:text-gray-600 mb-2"
          name="i-heroicons-globe-alt"
      />
      <p class="text-sm text-gray-400">
        {{ t('dashboard.no_languages', 'No language configured') }}
      </p>
    </div>

    <div
        v-else
        :class="size === WIDGET_SIZE.WIDE ? 'grid grid-cols-2 gap-3 space-y-0' : ''"
        class="overflow-y-auto space-y-3"
    >
      <div
          v-for="lang in displayedLanguages"
          :key="lang.code"
          class="space-y-1"
      >
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-gray-700 dark:text-gray-300">
            {{ lang.name }}
            <span class="text-gray-400 ml-1 font-mono">{{ lang.code }}</span>
          </span>
          <span
              :class="lang.coverage >= 90 ? 'text-green-600' : lang.coverage >= 60 ? 'text-yellow-500' : 'text-red-500'"
              class="font-semibold"
          >
            {{ lang.coverage.toFixed(2) }}%
          </span>
        </div>
        <div class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
          <div
              :class="coverageColor(lang.coverage)"
              :style="{ width: `${lang.coverage}%` }"
              class="h-1.5 rounded-full transition-all"
          />
        </div>
        <p
            v-if="size !== WIDGET_SIZE.SM"
            class="text-xs text-gray-400"
        >
          {{ lang.translated }} / {{ lang.total }} · {{ lang.missing }} {{ t('dashboard.missing', 'missing') }}
        </p>
      </div>
    </div>
  </u-card>
</template>

<script lang="ts" setup>
  import type { IWidgetBaseProps } from '../../../interfaces/dashboard.interface'
  import { WIDGET_SIZE } from '../../../enums/dashboard.enum'

  const props = defineProps<IWidgetBaseProps>()

  const { t } = useT()

  const { stats, pending, sourceLabel, hasProject } = useWidgetData(
      props.id,
      computed(() => props.dataSource),
  )

  const maxItems = computed(() => {
    if (props.size === WIDGET_SIZE.LG) return 6
    if (props.size === WIDGET_SIZE.WIDE) return 8
    return 3
  })

  const displayedLanguages = computed(() => (stats.value?.languages ?? []).slice(0, maxItems.value))

  const displayTitle = computed(() => props.title || t('dashboard.languages_coverage', 'Language coverage'))

  function coverageColor (coverage: number) {
    if (coverage >= 90) return 'bg-green-500'
    if (coverage >= 60) return 'bg-yellow-400'
    return 'bg-red-400'
  }
</script>

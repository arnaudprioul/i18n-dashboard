<template>
  <u-modal
    :open="open"
    :title="t('dashboard.configure_widget', 'Configure widget')"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-6">
        <div
          v-if="hasDataSource"
          class="space-y-3"
        >
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ t('dashboard.data_source', 'Data source') }}
          </p>
          <div class="flex gap-2">
            <button
              :class="draftSource === DATA_SOURCE_TYPE.GLOBAL
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
              class="flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
              @click="draftSource = DATA_SOURCE_TYPE.GLOBAL"
            >
              {{ t('dashboard.global_project', 'Global') }}
            </button>
            <button
              :class="draftSource === DATA_SOURCE_TYPE.PROJECT
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
              class="flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors"
              @click="draftSource = DATA_SOURCE_TYPE.PROJECT"
            >
              {{ t('dashboard.specific_project', 'Specific project') }}
            </button>
          </div>

          <div v-if="draftSource === DATA_SOURCE_TYPE.PROJECT">
            <u-select
              v-model="draftProjectId"
              :items="projectItems"
              :placeholder="t('dashboard.select_project', 'Select a project')"
            />
          </div>
        </div>

        <div class="space-y-2">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ t('dashboard.custom_title', 'Custom title') }}
          </p>
          <u-input
            v-model="draftTitle"
            :placeholder="t('dashboard.default_title', 'Default title')"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <u-button
          color="neutral"
          variant="ghost"
          @click="emit('update:open', false)"
        >
          {{ t('common.cancel', 'Cancel') }}
        </u-button>
        <u-button @click="save">
          {{ t('common.save', 'Save') }}
        </u-button>
      </div>
    </template>
  </u-modal>
</template>

<script lang="ts" setup>
  import type { TDataSourceType } from '../../types/dashboard.type'
  import type { IWidgetDataSource, IWidgetConfigModalProps, IWidgetConfigModalEmits } from '../../interfaces/dashboard.interface'
  import { WIDGET_REGISTRY } from '../../consts/dashboard.const'
  import { DATA_SOURCE_TYPE } from '../../enums/dashboard.enum'

  const props = defineProps<IWidgetConfigModalProps>()
  const emit = defineEmits<IWidgetConfigModalEmits>()

  const { t } = useT()
  const { visibleProjects } = useProject()

  const draftSource = ref<TDataSourceType>(DATA_SOURCE_TYPE.GLOBAL)
  const draftProjectId = ref<number | undefined>()
  const draftTitle = ref('')

  watch(
      () => props.widget,
      (w) => {
        if (!w) return
        draftSource.value = w.dataSource?.type ?? DATA_SOURCE_TYPE.GLOBAL
        draftProjectId.value = w.dataSource?.projectId
        draftTitle.value = w.title ?? ''
      },
      { immediate: true },
  )

  const projectItems = computed(() =>
      visibleProjects.value
          .filter((p: any) => !p.is_system)
          .map((p: any) => ({ label: p.name, value: p.id })),
  )

  const hasDataSource = computed(() => {
    if (!props.widget) return false
    return WIDGET_REGISTRY[props.widget.type].hasDataSource
  })

  const save = () => {
    const dataSource: IWidgetDataSource = draftSource.value === DATA_SOURCE_TYPE.PROJECT
        ? { type: DATA_SOURCE_TYPE.PROJECT, projectId: draftProjectId.value }
        : { type: DATA_SOURCE_TYPE.GLOBAL }
    emit('save', { dataSource, title: draftTitle.value || undefined })
    emit('update:open', false)
  }
</script>

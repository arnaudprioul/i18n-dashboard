<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('dashboard.hello', 'Hello') }}{{ currentUser?.name ? `, ${currentUser.name}` : '' }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
          {{ t('dashboard.title', 'Dashboard') }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <u-button
            v-if="!editing"
            color="neutral"
            icon="i-heroicons-pencil-square"
            variant="ghost"
            @click="startEditing"
        >
          {{ t('dashboard.edit', 'Edit') }}
        </u-button>
        <template v-else>
          <u-button
              color="neutral"
              variant="ghost"
              @click="cancelEditing"
          >
            {{ t('common.cancel', 'Cancel') }}
          </u-button>
          <u-button
              color="neutral"
              icon="i-heroicons-plus"
              variant="outline"
              @click="showPicker = true"
          >
            {{ t('common.add', 'Add') }}
          </u-button>
          <u-button
              :loading="saving"
              icon="i-heroicons-check"
              @click="saveLayout"
          >
            {{ t('dashboard.done', 'Done') }}
          </u-button>
        </template>
      </div>
    </div>

    <div
        v-if="activeLayout.length === 0"
        class="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-16 text-center"
    >
      <u-icon
          class="text-5xl text-gray-300 dark:text-gray-600 mb-3"
          name="i-heroicons-squares-2x2"
      />
      <p class="text-gray-400 font-medium">
        {{ t('dashboard.no_widgets', 'No widgets') }}
      </p>
      <u-button
          v-if="editing"
          class="mt-4"
          icon="i-heroicons-plus"
          @click="showPicker = true"
      >
        {{ t('dashboard.add_widget', 'Add a widget') }}
      </u-button>
    </div>

    <div
        v-else
        class="grid grid-cols-4 gap-4 auto-rows-[minmax(140px,auto)]"
    >
      <div
          v-for="(widget, index) in activeLayout"
          :key="widget.id"
          :class="[sizeClass(widget.size), 'relative', editing ? 'cursor-grab' : '']"
          :draggable="editing"
          @dragend="onDragEnd"
          @dragover="onDragOver($event, index)"
          @dragstart="onDragStart(index)"
      >
        <button
            v-if="editing"
            class="absolute -top-2 -left-2 z-10 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center text-xs shadow-sm hover:bg-red-600 transition-colors"
            @click.stop="removeWidget(index)"
        >
          ×
        </button>

        <div
            v-if="editing"
            class="absolute -top-2 right-0 z-10 flex gap-0.5"
        >
          <button
              v-for="s in widgetRegistry[widget.type]?.sizes ?? []"
              :key="s"
              :class="widget.size === s
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
              class="px-1 py-0.5 text-xs rounded shadow-sm transition-colors"
              @click.stop="resizeWidget(index, s)"
          >
            {{ s }}
          </button>
        </div>

        <button
            v-if="editing && widgetRegistry[widget.type]?.hasDataSource"
            class="absolute bottom-1 right-1 z-10 w-6 h-6 bg-gray-600/80 dark:bg-gray-400/80 rounded-full text-white flex items-center justify-center text-xs hover:bg-gray-700 transition-colors"
            @click.stop="configIndex = index"
        >
          <u-icon
              class="text-xs"
              name="i-heroicons-cog-6-tooth"
          />
        </button>

        <div :class="editing ? 'animate-wiggle h-full' : 'h-full'">
          <component
              :is="widgetComponent(widget.type)"
              :id="widget.id"
              :data-source="widget.dataSource"
              :editing="editing"
              :size="widget.size"
              :title="widget.title"
              :type="widget.type"
          />
        </div>
      </div>
    </div>

    <common-widget-picker
        v-model="showPicker"
        @add="onAddWidget"
    />

    <common-widget-config-modal
        :index="configIndex"
        :open="configIndex !== -1"
        :widget="configIndex !== -1 ? activeLayout[configIndex] : null"
        @save="onSaveConfig"
        @update:open="val => { if (!val) configIndex = -1 }"
    />
  </div>
</template>

<script lang="ts" setup>
  import { WIDGET_SIZE_CLASSES } from '../../consts/dashboard.const'
  import { WIDGET_TYPE } from '../../enums/dashboard.enum'

  const { t } = useT()
  const { currentUser } = useAuth()
  const {
    layout,
    editing,
    localLayout,
    saving,
    startEditing,
    cancelEditing,
    saveLayout,
    onDragStart,
    onDragOver,
    onDragEnd,
    removeWidget,
    addWidget,
    resizeWidget,
    updateWidgetConfig,
  } = useDashboard()

  const showPicker = ref(false)
  const configIndex = ref(-1)

  const activeLayout = computed(() => editing.value ? localLayout.value : layout.value)
  const { registry: widgetRegistry, getEntry } = useWidgetRegistry()

  function sizeClass (size: string) {
    return WIDGET_SIZE_CLASSES[size as keyof typeof WIDGET_SIZE_CLASSES] ?? 'col-span-1 row-span-1'
  }

  function widgetComponent (type: string) {
    switch (type) {
      case WIDGET_TYPE.STAT_KEYS:
      case WIDGET_TYPE.STAT_COVERAGE:
      case WIDGET_TYPE.STAT_LANGUAGES:
      case WIDGET_TYPE.STAT_UNUSED:
        return resolveComponent('CommonWidgetsStatWidget')
      case WIDGET_TYPE.PROJECTS:
        return resolveComponent('CommonWidgetsProjectsWidget')
      case WIDGET_TYPE.LANGUAGES_COVERAGE:
        return resolveComponent('CommonWidgetsLanguagesCoverageWidget')
      case WIDGET_TYPE.LAST_ACTIVITY:
        return resolveComponent('CommonWidgetsActivityWidget')
      case WIDGET_TYPE.REVIEW_QUEUE:
        return resolveComponent('CommonWidgetsReviewWidget')
      default:
        if (getEntry(type)?.isCustom) {
          return resolveComponent('CommonWidgetsCustomIframeWidget')
        }
        return 'div'
    }
  }

  function onAddWidget (widget: Parameters<typeof addWidget>[0]) {
    addWidget(widget)
  }

  function onSaveConfig (patch: { dataSource?: any; title?: string | undefined }) {
    updateWidgetConfig(configIndex.value, patch)
    configIndex.value = -1
  }
</script>

<style scoped>
@keyframes wiggle {
  0%, 100% {
    transform: rotate(-0.5deg);
  }
  50% {
    transform: rotate(0.5deg);
  }
}

.animate-wiggle {
  animation: wiggle 0.4s ease-in-out infinite;
}
</style>

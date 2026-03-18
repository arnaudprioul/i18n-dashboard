<script lang="ts" setup>
import type { TWidgetType } from '~/types/dashboard.type'
import { WIDGET_REGISTRY, WIDGET_SIZE_CLASSES } from '~/consts/dashboard.const'

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

function sizeClass(size: string) {
  return WIDGET_SIZE_CLASSES[size as keyof typeof WIDGET_SIZE_CLASSES] ?? 'col-span-1 row-span-1'
}

function widgetComponent(type: TWidgetType) {
  switch (type) {
    case 'stat-keys':
    case 'stat-coverage':
    case 'stat-languages':
    case 'stat-unused':
      return resolveComponent('DashboardWidgetsStatWidget')
    case 'projects':
      return resolveComponent('DashboardWidgetsProjectsWidget')
    case 'languages-coverage':
      return resolveComponent('DashboardWidgetsLanguagesCoverageWidget')
    case 'last-activity':
      return resolveComponent('DashboardWidgetsActivityWidget')
    case 'review-queue':
      return resolveComponent('DashboardWidgetsReviewWidget')
    default:
      return 'div'
  }
}

function onAddWidget(widget: Parameters<typeof addWidget>[0]) {
  addWidget(widget)
}

function onSaveConfig(patch: { dataSource?: any; title?: string | undefined }) {
  updateWidgetConfig(configIndex.value, patch)
  configIndex.value = -1
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('dashboard.hello', 'Hello') }}{{ currentUser?.name ? `, ${currentUser.name}` : '' }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">{{ t('dashboard.title', 'Dashboard') }}</p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          v-if="!editing"
          variant="ghost"
          color="neutral"
          icon="i-heroicons-pencil-square"
          @click="startEditing"
        >
          {{ t('dashboard.edit', 'Edit') }}
        </UButton>
        <template v-else>
          <UButton variant="ghost" color="neutral" @click="cancelEditing">
            {{ t('common.cancel', 'Cancel') }}
          </UButton>
          <UButton
            icon="i-heroicons-plus"
            variant="outline"
            color="neutral"
            @click="showPicker = true"
          >
            {{ t('common.add', 'Add') }}
          </UButton>
          <UButton :loading="saving" icon="i-heroicons-check" @click="saveLayout">
            {{ t('dashboard.done', 'Done') }}
          </UButton>
        </template>
      </div>
    </div>

    <div
      v-if="activeLayout.length === 0"
      class="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-16 text-center"
    >
      <UIcon name="i-heroicons-squares-2x2" class="text-5xl text-gray-300 dark:text-gray-600 mb-3" />
      <p class="text-gray-400 font-medium">{{ t('dashboard.no_widgets', 'No widgets') }}</p>
      <UButton v-if="editing" class="mt-4" icon="i-heroicons-plus" @click="showPicker = true">
        {{ t('dashboard.add_widget', 'Add a widget') }}
      </UButton>
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
        @dragstart="onDragStart(index)"
        @dragover="onDragOver($event, index)"
        @dragend="onDragEnd"
      >
        <button
          v-if="editing"
          class="absolute -top-2 -left-2 z-10 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center text-xs shadow-sm hover:bg-red-600 transition-colors"
          @click.stop="removeWidget(index)"
        >
          ×
        </button>

        <div v-if="editing" class="absolute -top-2 right-0 z-10 flex gap-0.5">
          <button
            v-for="s in WIDGET_REGISTRY[widget.type].sizes"
            :key="s"
            class="px-1 py-0.5 text-xs rounded shadow-sm transition-colors"
            :class="widget.size === s
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
            @click.stop="resizeWidget(index, s)"
          >
            {{ s }}
          </button>
        </div>

        <button
          v-if="editing && WIDGET_REGISTRY[widget.type].hasDataSource"
          class="absolute bottom-1 right-1 z-10 w-6 h-6 bg-gray-600/80 dark:bg-gray-400/80 rounded-full text-white flex items-center justify-center text-xs hover:bg-gray-700 transition-colors"
          @click.stop="configIndex = index"
        >
          <UIcon name="i-heroicons-cog-6-tooth" class="text-xs" />
        </button>

        <div :class="editing ? 'animate-wiggle h-full' : 'h-full'">
          <component
            :is="widgetComponent(widget.type)"
            :id="widget.id"
            :type="widget.type"
            :size="widget.size"
            :editing="editing"
            :data-source="widget.dataSource"
            :title="widget.title"
          />
        </div>
      </div>
    </div>

    <DashboardWidgetPicker v-model="showPicker" @add="onAddWidget" />

    <DashboardWidgetConfigModal
      :open="configIndex !== -1"
      :widget="configIndex !== -1 ? activeLayout[configIndex] : null"
      :index="configIndex"
      @update:open="val => { if (!val) configIndex = -1 }"
      @save="onSaveConfig"
    />
  </div>
</template>

<style scoped>
@keyframes wiggle {
  0%, 100% { transform: rotate(-0.5deg); }
  50% { transform: rotate(0.5deg); }
}
.animate-wiggle {
  animation: wiggle 0.4s ease-in-out infinite;
}
</style>

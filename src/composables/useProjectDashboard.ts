import type { IWidgetConfig, IWidgetDataSource } from '../interfaces/dashboard.interface'
import type { TWidgetSize } from '../types/dashboard.type'
import { DEFAULT_PROJECT_LAYOUT } from '../consts/dashboard.const'

export function useProjectDashboard(projectId: number) {
  const { data, refresh } = useAsyncData(
    `project-dashboard-layout-${projectId}`,
    () => $fetch(`/api/dashboard/project-layout?project_id=${projectId}`),
    { server: false },
  )

  const layout = computed<IWidgetConfig[]>(() => (data.value as IWidgetConfig[]) ?? DEFAULT_PROJECT_LAYOUT(projectId))

  const editing = ref(false)
  const localLayout = ref<IWidgetConfig[]>([])

  function startEditing() {
    localLayout.value = [...layout.value]
    editing.value = true
  }

  const draggingIndex = ref<number | null>(null)

  function onDragStart(index: number) {
    draggingIndex.value = index
  }

  function onDragOver(e: DragEvent, index: number) {
    e.preventDefault()
    if (draggingIndex.value === null || draggingIndex.value === index) return
    const arr = [...localLayout.value]
    const [item] = arr.splice(draggingIndex.value, 1)
    arr.splice(index, 0, item)
    localLayout.value = arr
    draggingIndex.value = index
  }

  function onDragEnd() {
    draggingIndex.value = null
  }

  function removeWidget(index: number) {
    localLayout.value.splice(index, 1)
  }

  function addWidget(widget: IWidgetConfig) {
    // Force data source to this project when not explicitly set
    const withSource: IWidgetConfig = widget.dataSource
      ? widget
      : { ...widget, dataSource: { type: 'project', projectId } }
    localLayout.value.push(withSource)
  }

  function resizeWidget(index: number, size: TWidgetSize) {
    localLayout.value[index].size = size
  }

  function updateWidgetConfig(index: number, patch: { dataSource?: IWidgetDataSource | undefined; title?: string | undefined }) {
    if (index < 0 || index >= localLayout.value.length) return
    localLayout.value[index] = { ...localLayout.value[index], ...patch }
  }

  const saving = ref(false)

  async function saveLayout() {
    saving.value = true
    try {
      await $fetch('/api/dashboard/project-layout', {
        method: 'POST',
        body: { project_id: projectId, widgets: localLayout.value },
      })
      await refresh()
      editing.value = false
    } finally {
      saving.value = false
    }
  }

  function cancelEditing() {
    editing.value = false
    localLayout.value = []
  }

  return {
    layout,
    editing,
    localLayout,
    saving,
    draggingIndex,
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
  }
}

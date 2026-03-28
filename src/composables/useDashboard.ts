import type { IWidgetConfig, IWidgetDataSource } from '../interfaces/dashboard.interface'
import type { TWidgetSize } from '../types/dashboard.type'
import { DEFAULT_LAYOUT } from '../consts/dashboard.const'
import { dashboardService } from '../services/dashboard.service'

export function useDashboard() {
  const { data, refresh } = useAsyncData('dashboard-layout', () => dashboardService.getLayout(), { server: false })
  const layout = computed<IWidgetConfig[]>(() => (data.value as IWidgetConfig[]) ?? DEFAULT_LAYOUT)

  const editing = ref(false)
  const localLayout = ref<IWidgetConfig[]>([])

  const startEditing = () => {
    localLayout.value = [...layout.value]
    editing.value = true
  }

  const draggingIndex = ref<number | null>(null)

  const onDragStart = (index: number) => {
    draggingIndex.value = index
  }

  const onDragOver = (e: DragEvent, index: number) => {
    e.preventDefault()
    if (draggingIndex.value === null || draggingIndex.value === index) return
    const arr = [...localLayout.value]
    const [item] = arr.splice(draggingIndex.value, 1)
    arr.splice(index, 0, item)
    localLayout.value = arr
    draggingIndex.value = index
  }

  const onDragEnd = () => {
    draggingIndex.value = null
  }

  const removeWidget = (index: number) => {
    localLayout.value.splice(index, 1)
  }

  const addWidget = (widget: IWidgetConfig) => {
    localLayout.value.push(widget)
  }

  const resizeWidget = (index: number, size: TWidgetSize) => {
    localLayout.value[index].size = size
  }

  const updateWidgetConfig = (index: number, patch: { dataSource?: IWidgetDataSource | undefined; title?: string | undefined }) => {
    if (index < 0 || index >= localLayout.value.length) return
    localLayout.value[index] = { ...localLayout.value[index], ...patch }
  }

  const saving = ref(false)

  const saveLayout = async () => {
    saving.value = true
    try {
      await dashboardService.saveLayout(localLayout.value)
      await refresh()
      editing.value = false
    } finally {
      saving.value = false
    }
  }

  const cancelEditing = () => {
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

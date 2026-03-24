import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'

import { useProjectDashboard } from '~/composables/useProjectDashboard'
import { DEFAULT_PROJECT_LAYOUT } from '~/consts/dashboard.const'
import type { IWidgetConfig } from '~/interfaces/dashboard.interface'

const PROJECT_ID = 3

describe('useProjectDashboard', () => {
  beforeEach(() => {
    vi.mocked(globalThis.$fetch as any).mockReset()

    vi.mocked(globalThis.useAsyncData).mockReturnValue({
      data: ref(null),
      pending: ref(false),
      refresh: vi.fn(),
    } as any)
  })

  describe('layout computed', () => {
    it('returns DEFAULT_PROJECT_LAYOUT when useAsyncData data is null', () => {
      const { layout } = useProjectDashboard(PROJECT_ID)
      expect(layout.value).toEqual(DEFAULT_PROJECT_LAYOUT(PROJECT_ID))
    })

    it('DEFAULT_PROJECT_LAYOUT embeds projectId in every widget dataSource', () => {
      const defaultLayout = DEFAULT_PROJECT_LAYOUT(PROJECT_ID)
      for (const widget of defaultLayout) {
        expect(widget.dataSource).toEqual({ type: 'project', projectId: PROJECT_ID })
      }
    })

    it('returns persisted layout when useAsyncData data is populated', () => {
      const customLayout: IWidgetConfig[] = [
        { id: 'custom-1', type: 'stat-keys', size: 'md', dataSource: { type: 'project', projectId: PROJECT_ID } },
      ]
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(customLayout),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { layout } = useProjectDashboard(PROJECT_ID)
      expect(layout.value).toEqual(customLayout)
    })

    it('fetches from the project-specific API URL', () => {
      useProjectDashboard(PROJECT_ID)
      expect(globalThis.useAsyncData).toHaveBeenCalledWith(
        `project-dashboard-layout-${PROJECT_ID}`,
        expect.any(Function),
        expect.anything(),
      )
    })
  })

  describe('startEditing', () => {
    it('sets editing to true', () => {
      const { startEditing, editing } = useProjectDashboard(PROJECT_ID)
      expect(editing.value).toBe(false)
      startEditing()
      expect(editing.value).toBe(true)
    })

    it('copies current layout into localLayout', () => {
      const customLayout: IWidgetConfig[] = [
        { id: 'a', type: 'stat-keys', size: 'sm', dataSource: { type: 'project', projectId: PROJECT_ID } },
      ]
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(customLayout),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, localLayout } = useProjectDashboard(PROJECT_ID)
      startEditing()

      expect(localLayout.value).toEqual(customLayout)
      expect(localLayout.value).not.toBe(customLayout)
    })
  })

  describe('cancelEditing', () => {
    it('sets editing to false and clears localLayout', () => {
      const { startEditing, cancelEditing, editing, localLayout } = useProjectDashboard(PROJECT_ID)
      startEditing()
      expect(editing.value).toBe(true)

      cancelEditing()
      expect(editing.value).toBe(false)
      expect(localLayout.value).toEqual([])
    })
  })

  describe('addWidget', () => {
    it('injects project dataSource when widget has none', () => {
      const { startEditing, addWidget, localLayout } = useProjectDashboard(PROJECT_ID)
      startEditing()

      addWidget({ id: 'new-1', type: 'review-queue', size: 'md' })

      const added = localLayout.value[localLayout.value.length - 1]
      expect(added.dataSource).toEqual({ type: 'project', projectId: PROJECT_ID })
    })

    it('preserves existing dataSource when widget already has one', () => {
      const { startEditing, addWidget, localLayout } = useProjectDashboard(PROJECT_ID)
      startEditing()

      const customSource = { type: 'project' as const, projectId: 99 }
      addWidget({ id: 'new-2', type: 'stat-keys', size: 'sm', dataSource: customSource })

      const added = localLayout.value[localLayout.value.length - 1]
      expect(added.dataSource).toEqual(customSource)
    })

    it('appends widget to localLayout', () => {
      const { startEditing, addWidget, localLayout } = useProjectDashboard(PROJECT_ID)
      startEditing()
      const initial = localLayout.value.length

      addWidget({ id: 'new-3', type: 'last-activity', size: 'md' })

      expect(localLayout.value).toHaveLength(initial + 1)
    })
  })

  describe('removeWidget', () => {
    it('removes widget at given index', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref([
          { id: 'a', type: 'stat-keys', size: 'sm' },
          { id: 'b', type: 'stat-coverage', size: 'sm' },
          { id: 'c', type: 'stat-languages', size: 'sm' },
        ] as IWidgetConfig[]),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, removeWidget, localLayout } = useProjectDashboard(PROJECT_ID)
      startEditing()

      removeWidget(1)

      expect(localLayout.value.map(w => w.id)).toEqual(['a', 'c'])
    })
  })

  describe('resizeWidget', () => {
    it('updates size of the widget at given index', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref([{ id: 'a', type: 'stat-keys', size: 'sm' }] as IWidgetConfig[]),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, resizeWidget, localLayout } = useProjectDashboard(PROJECT_ID)
      startEditing()

      resizeWidget(0, 'lg')
      expect(localLayout.value[0].size).toBe('lg')
    })
  })

  describe('updateWidgetConfig', () => {
    it('merges patch into widget at given index', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref([{ id: 'a', type: 'stat-keys', size: 'sm' }] as IWidgetConfig[]),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, updateWidgetConfig, localLayout } = useProjectDashboard(PROJECT_ID)
      startEditing()

      updateWidgetConfig(0, { title: 'My Title', dataSource: { type: 'project', projectId: PROJECT_ID } })

      expect(localLayout.value[0].title).toBe('My Title')
      expect(localLayout.value[0].id).toBe('a')
    })

    it('does nothing when index is out of bounds', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref([{ id: 'a', type: 'stat-keys', size: 'sm' }] as IWidgetConfig[]),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, updateWidgetConfig, localLayout } = useProjectDashboard(PROJECT_ID)
      startEditing()

      updateWidgetConfig(10, { title: 'Ghost' })

      expect(localLayout.value[0].title).toBeUndefined()
    })
  })

  describe('drag-drop state management', () => {
    it('draggingIndex starts null', () => {
      const { draggingIndex } = useProjectDashboard(PROJECT_ID)
      expect(draggingIndex.value).toBeNull()
    })

    it('onDragStart sets draggingIndex', () => {
      const { onDragStart, draggingIndex } = useProjectDashboard(PROJECT_ID)
      onDragStart(2)
      expect(draggingIndex.value).toBe(2)
    })

    it('onDragEnd resets draggingIndex to null', () => {
      const { onDragStart, onDragEnd, draggingIndex } = useProjectDashboard(PROJECT_ID)
      onDragStart(2)
      onDragEnd()
      expect(draggingIndex.value).toBeNull()
    })

    it('onDragOver reorders localLayout and updates draggingIndex', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref([
          { id: 'a', type: 'stat-keys', size: 'sm' },
          { id: 'b', type: 'stat-coverage', size: 'sm' },
          { id: 'c', type: 'stat-languages', size: 'sm' },
        ] as IWidgetConfig[]),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, onDragStart, onDragOver, localLayout, draggingIndex } = useProjectDashboard(PROJECT_ID)
      startEditing()

      onDragStart(0)
      onDragOver({ preventDefault: vi.fn() } as any, 2)

      expect(localLayout.value.map(w => w.id)).toEqual(['b', 'c', 'a'])
      expect(draggingIndex.value).toBe(2)
    })

    it('onDragOver does nothing when draggingIndex equals target index', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref([
          { id: 'a', type: 'stat-keys', size: 'sm' },
          { id: 'b', type: 'stat-coverage', size: 'sm' },
        ] as IWidgetConfig[]),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, onDragStart, onDragOver, localLayout } = useProjectDashboard(PROJECT_ID)
      startEditing()

      onDragStart(1)
      onDragOver({ preventDefault: vi.fn() } as any, 1)

      expect(localLayout.value.map(w => w.id)).toEqual(['a', 'b'])
    })
  })

  describe('saveLayout', () => {
    it('calls $fetch POST to /api/dashboard/project-layout with project_id and widgets', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValue(undefined)
      const refreshFn = vi.fn()
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(null),
        pending: ref(false),
        refresh: refreshFn,
      } as any)

      const { startEditing, saveLayout, localLayout } = useProjectDashboard(PROJECT_ID)
      startEditing()

      await saveLayout()

      expect(globalThis.$fetch).toHaveBeenCalledWith(
        '/api/dashboard/project-layout',
        expect.objectContaining({
          method: 'POST',
          body: { project_id: PROJECT_ID, widgets: localLayout.value },
        }),
      )
    })

    it('sets editing to false after save', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValue(undefined)
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(null),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, saveLayout, editing } = useProjectDashboard(PROJECT_ID)
      startEditing()
      await saveLayout()

      expect(editing.value).toBe(false)
    })

    it('saving is true during save and false after', async () => {
      let resolveSave!: () => void
      vi.mocked(globalThis.$fetch as any).mockReturnValue(
        new Promise<void>(resolve => { resolveSave = resolve }),
      )
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(null),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, saveLayout, saving } = useProjectDashboard(PROJECT_ID)
      startEditing()

      expect(saving.value).toBe(false)
      const savePromise = saveLayout()
      await nextTick()
      expect(saving.value).toBe(true)

      resolveSave()
      await savePromise
      expect(saving.value).toBe(false)
    })

    it('calls refresh after saving', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValue(undefined)
      const refreshFn = vi.fn()
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(null),
        pending: ref(false),
        refresh: refreshFn,
      } as any)

      const { startEditing, saveLayout } = useProjectDashboard(PROJECT_ID)
      startEditing()
      await saveLayout()

      expect(refreshFn).toHaveBeenCalledOnce()
    })
  })
})

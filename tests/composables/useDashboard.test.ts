import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'

import { useDashboard } from '~/composables/useDashboard'
import { DEFAULT_LAYOUT } from '~/consts/dashboard.const'
import type { WidgetConfig } from '~/types/dashboard.type'

describe('useDashboard', () => {
  beforeEach(() => {
    vi.mocked(globalThis.$fetch as any).mockReset()

    // Default: useAsyncData returns null data (DEFAULT_LAYOUT will be used)
    vi.mocked(globalThis.useAsyncData).mockReturnValue({
      data: ref(null),
      pending: ref(false),
      refresh: vi.fn(),
    } as any)
  })

  describe('layout computed', () => {
    it('returns DEFAULT_LAYOUT when useAsyncData data is null', () => {
      const { layout } = useDashboard()
      expect(layout.value).toEqual(DEFAULT_LAYOUT)
    })

    it('returns persisted layout when useAsyncData data is populated', () => {
      const customLayout: WidgetConfig[] = [
        { id: 'custom-1', type: 'stat-keys', size: 'md' },
      ]
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(customLayout),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { layout } = useDashboard()
      expect(layout.value).toEqual(customLayout)
    })
  })

  describe('startEditing', () => {
    it('sets editing to true', () => {
      const { startEditing, editing } = useDashboard()
      expect(editing.value).toBe(false)
      startEditing()
      expect(editing.value).toBe(true)
    })

    it('copies current layout into localLayout', () => {
      const customLayout: WidgetConfig[] = [
        { id: 'a', type: 'stat-keys', size: 'sm' },
        { id: 'b', type: 'stat-coverage', size: 'md' },
      ]
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(customLayout),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, localLayout } = useDashboard()
      startEditing()

      expect(localLayout.value).toEqual(customLayout)
      // Should be a copy, not the same reference
      expect(localLayout.value).not.toBe(customLayout)
    })
  })

  describe('cancelEditing', () => {
    it('sets editing to false', () => {
      const { startEditing, cancelEditing, editing } = useDashboard()
      startEditing()
      expect(editing.value).toBe(true)

      cancelEditing()
      expect(editing.value).toBe(false)
    })

    it('clears localLayout', () => {
      const { startEditing, cancelEditing, localLayout } = useDashboard()
      startEditing()
      expect(localLayout.value.length).toBeGreaterThan(0)

      cancelEditing()
      expect(localLayout.value).toEqual([])
    })
  })

  describe('addWidget', () => {
    it('appends a widget to localLayout', () => {
      const { startEditing, addWidget, localLayout } = useDashboard()
      startEditing()
      const initialLen = localLayout.value.length

      addWidget({ id: 'new-1', type: 'review-queue', size: 'md' })

      expect(localLayout.value).toHaveLength(initialLen + 1)
      expect(localLayout.value[localLayout.value.length - 1]).toEqual({
        id: 'new-1',
        type: 'review-queue',
        size: 'md',
      })
    })
  })

  describe('removeWidget', () => {
    it('removes widget at given index from localLayout', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref([
          { id: 'a', type: 'stat-keys', size: 'sm' },
          { id: 'b', type: 'stat-coverage', size: 'sm' },
          { id: 'c', type: 'projects', size: 'wide' },
        ] as WidgetConfig[]),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, removeWidget, localLayout } = useDashboard()
      startEditing()
      expect(localLayout.value).toHaveLength(3)

      removeWidget(1)

      expect(localLayout.value).toHaveLength(2)
      expect(localLayout.value.map(w => w.id)).toEqual(['a', 'c'])
    })

    it('removes first widget when index is 0', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref([
          { id: 'a', type: 'stat-keys', size: 'sm' },
          { id: 'b', type: 'stat-coverage', size: 'sm' },
        ] as WidgetConfig[]),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, removeWidget, localLayout } = useDashboard()
      startEditing()

      removeWidget(0)

      expect(localLayout.value).toHaveLength(1)
      expect(localLayout.value[0].id).toBe('b')
    })
  })

  describe('resizeWidget', () => {
    it('updates the size of the widget at given index', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref([
          { id: 'a', type: 'stat-keys', size: 'sm' },
        ] as WidgetConfig[]),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, resizeWidget, localLayout } = useDashboard()
      startEditing()

      resizeWidget(0, 'lg')
      expect(localLayout.value[0].size).toBe('lg')
    })
  })

  describe('updateWidgetConfig', () => {
    it('merges patch into widget at given index', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref([
          { id: 'a', type: 'stat-keys', size: 'sm' },
        ] as WidgetConfig[]),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, updateWidgetConfig, localLayout } = useDashboard()
      startEditing()

      updateWidgetConfig(0, { title: 'Custom Title', dataSource: { type: 'project', projectId: 3 } })

      expect(localLayout.value[0].title).toBe('Custom Title')
      expect(localLayout.value[0].dataSource).toEqual({ type: 'project', projectId: 3 })
      // Original properties preserved
      expect(localLayout.value[0].id).toBe('a')
    })

    it('does nothing when index is out of bounds', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref([
          { id: 'a', type: 'stat-keys', size: 'sm' },
        ] as WidgetConfig[]),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, updateWidgetConfig, localLayout } = useDashboard()
      startEditing()

      // Index 5 is out of bounds for a 1-item array
      updateWidgetConfig(5, { title: 'Ghost' })

      expect(localLayout.value[0].title).toBeUndefined()
    })

    it('does nothing when index is negative', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref([{ id: 'a', type: 'stat-keys', size: 'sm' }] as WidgetConfig[]),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, updateWidgetConfig, localLayout } = useDashboard()
      startEditing()

      updateWidgetConfig(-1, { title: 'Ghost' })
      expect(localLayout.value[0].title).toBeUndefined()
    })
  })

  describe('drag-drop state management', () => {
    it('draggingIndex starts null', () => {
      const { draggingIndex } = useDashboard()
      expect(draggingIndex.value).toBeNull()
    })

    it('onDragStart sets draggingIndex', () => {
      const { onDragStart, draggingIndex } = useDashboard()
      onDragStart(2)
      expect(draggingIndex.value).toBe(2)
    })

    it('onDragEnd resets draggingIndex to null', () => {
      const { onDragStart, onDragEnd, draggingIndex } = useDashboard()
      onDragStart(2)
      onDragEnd()
      expect(draggingIndex.value).toBeNull()
    })

    it('onDragOver reorders localLayout and updates draggingIndex', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref([
          { id: 'a', type: 'stat-keys', size: 'sm' },
          { id: 'b', type: 'stat-coverage', size: 'sm' },
          { id: 'c', type: 'projects', size: 'wide' },
        ] as WidgetConfig[]),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, onDragStart, onDragOver, localLayout, draggingIndex } = useDashboard()
      startEditing()

      // Start dragging index 0 (widget 'a')
      onDragStart(0)
      // Drag over index 2 (widget 'c')
      const mockEvent = { preventDefault: vi.fn() } as any
      onDragOver(mockEvent, 2)

      // 'a' should now be at index 2, and draggingIndex should be 2
      expect(localLayout.value.map(w => w.id)).toEqual(['b', 'c', 'a'])
      expect(draggingIndex.value).toBe(2)
    })

    it('onDragOver does nothing when draggingIndex equals target index', () => {
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref([
          { id: 'a', type: 'stat-keys', size: 'sm' },
          { id: 'b', type: 'stat-coverage', size: 'sm' },
        ] as WidgetConfig[]),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, onDragStart, onDragOver, localLayout } = useDashboard()
      startEditing()

      onDragStart(1)
      const mockEvent = { preventDefault: vi.fn() } as any
      onDragOver(mockEvent, 1) // same index

      expect(localLayout.value.map(w => w.id)).toEqual(['a', 'b'])
    })
  })

  describe('saveLayout', () => {
    it('calls $fetch POST to /api/dashboard/layout with localLayout', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValue(undefined)
      const refreshFn = vi.fn()
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(null),
        pending: ref(false),
        refresh: refreshFn,
      } as any)

      const { startEditing, saveLayout, localLayout } = useDashboard()
      startEditing()

      await saveLayout()

      expect(globalThis.$fetch).toHaveBeenCalledWith(
        '/api/dashboard/layout',
        expect.objectContaining({ method: 'POST', body: localLayout.value }),
      )
    })

    it('sets editing to false after save', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValue(undefined)
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(null),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)

      const { startEditing, saveLayout, editing } = useDashboard()
      startEditing()
      expect(editing.value).toBe(true)

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

      const { startEditing, saveLayout, saving } = useDashboard()
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

      const { startEditing, saveLayout } = useDashboard()
      startEditing()
      await saveLayout()

      expect(refreshFn).toHaveBeenCalledOnce()
    })
  })
})

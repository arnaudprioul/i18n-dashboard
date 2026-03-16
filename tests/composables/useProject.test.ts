import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

vi.mock('~/services/project.service', () => ({
  projectService: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue({}),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('~/services/scan.service', () => ({
  scanService: {
    scan: vi.fn().mockResolvedValue({ keysFound: 10, keysAdded: 2, scannedFiles: 5, langsAdded: 0 }),
    sync: vi.fn().mockResolvedValue({ added: 5, updated: 3, total: 8 }),
  },
}))

import { useProject, canScanProject, canSyncProject } from '~/composables/useProject'
import { projectService } from '~/services/project.service'
import { scanService } from '~/services/scan.service'

const mockProject = {
  id: 1,
  name: 'Test Project',
  root_path: '/test/path',
  locales_path: 'locales',
  key_separator: '.',
  color: '#3b82f6',
  is_system: false,
  git_repo: null,
}

const mockSystemProject = { ...mockProject, id: 2, is_system: true, root_path: '__DASHBOARD_UI__' }

describe('canScanProject (standalone function)', () => {
  it('returns true when root_path is set and not __DASHBOARD_UI__', () => {
    expect(canScanProject({ ...mockProject, root_path: '/some/path', git_repo: null })).toBe(true)
  })

  it('returns false for __DASHBOARD_UI__ root_path without git_repo', () => {
    expect(canScanProject({ ...mockProject, root_path: '__DASHBOARD_UI__', git_repo: null })).toBe(false)
  })

  it('returns true when git_repo.url is set even if root_path is __DASHBOARD_UI__', () => {
    expect(canScanProject({
      ...mockProject,
      root_path: '__DASHBOARD_UI__',
      git_repo: { url: 'https://github.com/user/repo' },
    })).toBe(true)
  })

  it('returns false when root_path is empty and no git_repo', () => {
    expect(canScanProject({ ...mockProject, root_path: '', git_repo: null })).toBe(false)
  })
})

describe('canSyncProject (standalone function)', () => {
  it('returns true when root_path is set and not __DASHBOARD_UI__', () => {
    expect(canSyncProject({ ...mockProject, root_path: '/path', git_repo: null })).toBe(true)
  })

  it('returns false for __DASHBOARD_UI__ without git_repo', () => {
    expect(canSyncProject({ ...mockProject, root_path: '__DASHBOARD_UI__', git_repo: null })).toBe(false)
  })

  it('returns true when git_repo.url is set', () => {
    expect(canSyncProject({
      ...mockProject,
      root_path: '__DASHBOARD_UI__',
      git_repo: { url: 'https://github.com/repo' },
    })).toBe(true)
  })
})

describe('useProject', () => {
  beforeEach(() => {
    vi.mocked(projectService.getAll).mockReset()
    vi.mocked(projectService.create).mockReset()
    vi.mocked(projectService.update).mockReset()
    vi.mocked(projectService.remove).mockReset()
    vi.mocked(scanService.scan).mockReset()
    vi.mocked(scanService.sync).mockReset()

    vi.mocked(projectService.getAll).mockResolvedValue([])
    vi.mocked(projectService.remove).mockResolvedValue(undefined)
    vi.mocked(scanService.scan).mockResolvedValue({ keysFound: 10, keysAdded: 2, scannedFiles: 5, langsAdded: 0 } as any)
    vi.mocked(scanService.sync).mockResolvedValue({ added: 5, updated: 3, total: 8 } as any)

    vi.mocked(globalThis.useAuth).mockReturnValue({
      currentUser: ref(null),
      fetchMe: vi.fn(),
      getRoleForProject: vi.fn(() => null),
    } as any)

    vi.mocked(globalThis.useRoute).mockReturnValue({ params: {}, query: {} } as any)
    vi.mocked(globalThis.useRouter).mockReturnValue({ push: vi.fn(), replace: vi.fn() } as any)

    vi.mocked(globalThis.useAsyncData).mockReturnValue({
      data: ref([]),
      pending: ref(false),
      refresh: vi.fn(),
    } as any)
  })

  describe('visibleProjects', () => {
    it('returns all projects when user is super_admin', () => {
      const projects = [mockProject, { ...mockProject, id: 2 }]
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(projects),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)
      vi.mocked(globalThis.useAuth).mockReturnValue({
        currentUser: ref({ id: 1, is_super_admin: true, roles: [] }),
        fetchMe: vi.fn(),
        getRoleForProject: vi.fn(() => 'super_admin'),
      } as any)

      const { visibleProjects } = useProject()
      expect(visibleProjects.value).toHaveLength(2)
    })

    it('filters projects by user roles when not super_admin', () => {
      const projects = [mockProject, { ...mockProject, id: 2, name: 'Other' }]
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(projects),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)
      vi.mocked(globalThis.useAuth).mockReturnValue({
        currentUser: ref({
          id: 1,
          is_super_admin: false,
          roles: [{ role: 'admin', project_id: 1 }], // only access to project 1
        }),
        fetchMe: vi.fn(),
        getRoleForProject: vi.fn(),
      } as any)

      const { visibleProjects } = useProject()
      expect(visibleProjects.value).toHaveLength(1)
      expect(visibleProjects.value[0].id).toBe(1)
    })

    it('returns no projects when user has no roles', () => {
      const projects = [mockProject]
      vi.mocked(globalThis.useAsyncData).mockReturnValue({
        data: ref(projects),
        pending: ref(false),
        refresh: vi.fn(),
      } as any)
      vi.mocked(globalThis.useAuth).mockReturnValue({
        currentUser: ref({ id: 1, is_super_admin: false, roles: [] }),
        fetchMe: vi.fn(),
        getRoleForProject: vi.fn(),
      } as any)

      const { visibleProjects } = useProject()
      expect(visibleProjects.value).toHaveLength(0)
    })
  })

  describe('createProject', () => {
    it('calls projectService.create with payload', async () => {
      vi.mocked(projectService.create).mockResolvedValue(mockProject as any)
      const mockToast = vi.mocked(globalThis.useToast)()

      const { createProject } = useProject()
      const result = await createProject({
        name: 'New Project',
        root_path: '/new',
        locales_path: 'locales',
        key_separator: '.',
        color: '#000',
      })

      expect(projectService.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Project' }))
      expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
      expect(result).toEqual(mockProject)
    })

    it('throws on failure', async () => {
      vi.mocked(projectService.create).mockRejectedValue(new Error('Path not found'))

      const { createProject } = useProject()
      await expect(createProject({
        name: 'Bad Project',
        root_path: '/nonexistent',
        locales_path: 'locales',
        key_separator: '.',
        color: '#000',
      })).rejects.toThrow('Path not found')
    })
  })

  describe('updateProject', () => {
    it('calls projectService.update and shows success toast', async () => {
      vi.mocked(projectService.update).mockResolvedValue(mockProject as any)
      const mockToast = vi.mocked(globalThis.useToast)()

      const { updateProject } = useProject()
      const result = await updateProject(1, { name: 'Updated Name' })

      expect(projectService.update).toHaveBeenCalledWith(1, { name: 'Updated Name' })
      expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
      expect(result).toBe(true)
    })

    it('returns false on failure', async () => {
      vi.mocked(projectService.update).mockRejectedValue(new Error('Update failed'))

      const { updateProject } = useProject()
      const result = await updateProject(1, { name: 'Bad' })

      expect(result).toBe(false)
    })
  })

  describe('deleteProject', () => {
    it('calls projectService.remove and navigates to /projects', async () => {
      const mockRouter = vi.mocked(globalThis.useRouter)()
      const mockToast = vi.mocked(globalThis.useToast)()

      const { deleteProject } = useProject()
      const result = await deleteProject(1)

      expect(projectService.remove).toHaveBeenCalledWith(1)
      expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
      expect(mockRouter.push).toHaveBeenCalledWith('/projects')
      expect(result).toBe(true)
    })

    it('returns false on failure', async () => {
      vi.mocked(projectService.remove).mockRejectedValue(new Error('Cannot delete'))

      const { deleteProject } = useProject()
      const result = await deleteProject(99)

      expect(result).toBe(false)
    })
  })

  describe('scanProject', () => {
    it('calls scanService.scan with project id', async () => {
      const mockToast = vi.mocked(globalThis.useToast)()

      const { scanProject } = useProject()
      await scanProject({ id: 1, name: 'MyProject' })

      expect(scanService.scan).toHaveBeenCalledWith(1)
      expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
    })

    it('sets scanning to project id during operation and null after', async () => {
      let resolveScan!: (v: any) => void
      vi.mocked(scanService.scan).mockReturnValue(
        new Promise(resolve => { resolveScan = resolve }),
      )

      const { scanProject, scanning } = useProject()
      expect(scanning.value).toBeNull()

      const scanPromise = scanProject({ id: 3, name: 'Project 3' })
      // scanning is set synchronously before await
      expect(scanning.value).toBe(3)

      resolveScan({ keysFound: 0, keysAdded: 0, scannedFiles: 0, langsAdded: 0 })
      await scanPromise
      expect(scanning.value).toBeNull()
    })

    it('calls refreshNuxtData after scan', async () => {
      const { scanProject } = useProject()
      await scanProject({ id: 1, name: 'P' })

      expect(globalThis.refreshNuxtData).toHaveBeenCalledWith('project-stats')
    })
  })

  describe('syncProject', () => {
    it('calls scanService.sync with project id', async () => {
      const mockToast = vi.mocked(globalThis.useToast)()

      const { syncProject } = useProject()
      await syncProject({ id: 1, name: 'MyProject' })

      expect(scanService.sync).toHaveBeenCalledWith(1)
      expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({ color: 'success' }))
    })

    it('sets syncing to project id during operation and null after', async () => {
      let resolveSync!: (v: any) => void
      vi.mocked(scanService.sync).mockReturnValue(
        new Promise(resolve => { resolveSync = resolve }),
      )

      const { syncProject, syncing } = useProject()
      expect(syncing.value).toBeNull()

      const syncPromise = syncProject({ id: 2, name: 'Project 2' })
      expect(syncing.value).toBe(2)

      resolveSync({ added: 0, updated: 0, total: 0 })
      await syncPromise
      expect(syncing.value).toBeNull()
    })

    it('calls refreshNuxtData after sync', async () => {
      const { syncProject } = useProject()
      await syncProject({ id: 1, name: 'P' })

      expect(globalThis.refreshNuxtData).toHaveBeenCalledWith('project-stats')
    })
  })
})

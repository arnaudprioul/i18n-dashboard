import { projectService } from '../services/project.service'
import { scanService } from '../services/scan.service'
import type { IProject, IProjectPayload } from '../interfaces/project.interface'

export function canScanProject(project: IProject): boolean {
  if (project.root_path && project.root_path !== '__DASHBOARD_UI__') return true
  return !!project.git_repo?.url
}

export function canSyncProject(project: IProject): boolean {
  if (project.root_path && project.root_path !== '__DASHBOARD_UI__') return true
  return !!project.git_repo?.url
}

/**
 * Shared reactive project list — NOT route-dependent.
 * Composables (useStats, useProjectLanguages, etc.) that need the project list
 * should call useProject(); only pages that need the current project from URL
 * should read `currentProject`.
 */
export function useProject() {
  const { currentUser } = useAuth()

  const { data: projectsData, pending, refresh: fetchProjects } = useAsyncData<IProject[]>(
    'all-projects',
    () => projectService.getAll(),
    { default: () => [], server: false },
  )

  const projects = computed(() => (projectsData.value ?? []) as IProject[])

  // Not route-dependent — safe to watch from anywhere (including layout onMount)
  const systemProject = computed(() => projects.value.find(p => p.is_system) ?? null)

  // Route-dependent: only returns a value when inside a /projects/[id]/* page
  const route = useRoute()
  const currentProject = computed((): IProject | null => {
    const paramId = route.params.id
    if (!paramId) return null
    const id = Number(Array.isArray(paramId) ? paramId[0] : paramId)
    return projects.value.find(p => p.id === id) ?? null
  })

  const visibleProjects = computed(() => {
    if (currentUser.value?.is_super_admin) return projects.value
    const userProjectIds = new Set(
      (currentUser.value?.roles ?? [])
        .filter((r: any) => r.project_id !== null)
        .map((r: any) => r.project_id),
    )
    return projects.value.filter((p: any) => userProjectIds.has(p.id))
  })

  // ── Mutations ───────────────────────────────────────────────────────────────

  const toast = useToast()
  const { t } = useT()
  const router = useRouter()

  const saving = ref(false)
  const createProject = async (payload: IProjectPayload): Promise<any> => {
    saving.value = true
    try {
      const project = await projectService.create(payload)
      toast.add({ title: t('projects.created', 'Project added'), color: 'success' })
      await fetchProjects()
      return project
    }
    catch (e) {
      throw e
    }
    finally {
      saving.value = false
    }
  }

  const updateProject = async (id: number, payload: Partial<IProjectPayload>): Promise<boolean> => {
    saving.value = true
    try {
      await projectService.update(id, payload)
      toast.add({ title: t('projects.updated', 'Project updated'), color: 'success' })
      await fetchProjects()
      return true
    }
    catch {
      return false
    }
    finally {
      saving.value = false
    }
  }

  const deleting = ref(false)
  const deleteProject = async (id: number): Promise<boolean> => {
    deleting.value = true
    try {
      await projectService.remove(id)
      toast.add({ title: t('projects.deleted', 'Project deleted'), color: 'success' })
      await fetchProjects()
      router.push('/projects')
      return true
    }
    catch {
      return false
    }
    finally {
      deleting.value = false
    }
  }

  // ── Scan / Sync ─────────────────────────────────────────────────────────────

  const scanning = ref<number | null>(null)
  const scanProject = async (project: { id: number; name: string }): Promise<void> => {
    scanning.value = project.id
    try {
      const result = await scanService.scan(project.id)
      const langMsg = result.langsAdded > 0 ? ` · ${result.langsAdded} ${t('scan.langs_added', 'language(s) added')}` : ''
      toast.add({
        title: `${t('scan.toast_title', 'Scan')} — ${project.name}`,
        description: `${result.keysFound} ${t('scan.keys_found', 'keys found')} · ${result.scannedFiles} ${t('scan.files_scanned', 'files scanned')} · ${result.keysAdded} ${t('scan.keys_added', 'new keys')}${langMsg}`,
        color: 'success',
      })
      await fetchProjects()
      refreshNuxtData('project-stats')
    }
    catch {}
    finally {
      scanning.value = null
    }
  }

  const syncing = ref<number | null>(null)
  const syncProject = async (project: { id: number; name: string }): Promise<void> => {
    syncing.value = project.id
    try {
      const result = await scanService.sync(project.id)
      toast.add({
        title: `${t('sync.toast_title', 'Sync')} — ${project.name}`,
        description: `${result.added} ${t('sync.added', 'added')} · ${result.updated} ${t('sync.updated', 'updated')} · ${result.total} ${t('sync.total', 'total')}`,
        color: 'success',
      })
      await fetchProjects()
      refreshNuxtData('project-stats')
    }
    catch {}
    finally {
      syncing.value = null
    }
  }

  // ── Project helpers ──────────────────────────────────────────────────────────

  const checkProjectName = async (name: string, excludeId?: number): Promise<{ available: boolean }> => {
    return projectService.checkName(name, excludeId)
  }

  const detectProject = async (body: any) => {
    return projectService.detect(body)
  }

  // ── Scan with custom options (for ScanModal) ─────────────────────────────────

  const scanWithOptions = async (body: Parameters<typeof scanService.scanWithOptions>[0]) => {
    return scanService.scanWithOptions(body)
  }

  // ── Snapshot import ──────────────────────────────────────────────────────────

  const importSnapshot = async (data: { snapshot: any; project_id: number; mode: string }) => {
    return projectService.importSnapshot(data)
  }

  return {
    currentProject,
    projects,
    visibleProjects,
    systemProject,
    fetchProjects,
    pending,
    saving,
    createProject,
    updateProject,
    deleting,
    deleteProject,
    scanning,
    scanProject,
    syncing,
    syncProject,
    checkProjectName,
    detectProject,
    scanWithOptions,
    importSnapshot,
  }
}

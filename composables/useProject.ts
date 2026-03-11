import { projectService } from '~/services/project.service'
import { scanService } from '~/services/scan.service'
import type { ProjectPayload } from '~/interfaces/project.interface'

export interface Project {
  id: number
  name: string
  root_path: string
  source_url?: string
  locales_path: string
  key_separator: string
  color: string
  description?: string
  key_count?: number
  language_count?: number
  is_system?: boolean
}

export function canScanProject(project: Project): boolean {
  return !!project.root_path && project.root_path !== '__DASHBOARD_UI__'
}

export function canSyncProject(project: Project): boolean {
  return (!!project.root_path && project.root_path !== '__DASHBOARD_UI__') || !!project.source_url
}

/**
 * Shared reactive project list — NOT route-dependent.
 * Composables (useStats, useProjectLanguages, etc.) that need the project list
 * should call useProject(); only pages that need the current project from URL
 * should read `currentProject`.
 */
export function useProject() {
  const { currentUser } = useAuth()

  const { data: projectsData, pending, refresh: fetchProjects } = useAsyncData<Project[]>(
    'all-projects',
    () => projectService.getAll(),
    { default: () => [] },
  )

  const projects = computed(() => (projectsData.value ?? []) as Project[])

  // Not route-dependent — safe to watch from anywhere (including layout onMount)
  const systemProject = computed(() => projects.value.find(p => p.is_system) ?? null)

  // Route-dependent: only returns a value when inside a /projects/[id]/* page
  const route = useRoute()
  const currentProject = computed((): Project | null => {
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
  const router = useRouter()

  const saving = ref(false)
  async function createProject(payload: ProjectPayload): Promise<any> {
    saving.value = true
    try {
      const project = await projectService.create(payload)
      toast.add({ title: 'Projet ajouté', color: 'success' })
      await fetchProjects()
      return project
    }
    catch {
      return null
    }
    finally {
      saving.value = false
    }
  }

  async function updateProject(id: number, payload: Partial<ProjectPayload>): Promise<boolean> {
    saving.value = true
    try {
      await projectService.update(id, payload)
      toast.add({ title: 'Projet modifié', color: 'success' })
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
  async function deleteProject(id: number): Promise<boolean> {
    deleting.value = true
    try {
      await projectService.remove(id)
      toast.add({ title: 'Projet supprimé', color: 'success' })
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
  async function scanProject(project: { id: number; name: string }): Promise<void> {
    scanning.value = project.id
    try {
      const result = await scanService.scan(project.id)
      const langMsg = result.langsAdded > 0 ? ` · ${result.langsAdded} langue(s) ajoutée(s)` : ''
      toast.add({
        title: `Scan — ${project.name}`,
        description: `${result.keysFound} clés dans ${result.scannedFiles} fichiers · ${result.keysAdded} nouvelles${langMsg}`,
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
  async function syncProject(project: { id: number; name: string }): Promise<void> {
    syncing.value = project.id
    try {
      const result = await scanService.sync(project.id)
      toast.add({
        title: `Sync — ${project.name}`,
        description: `${result.added} ajoutées · ${result.updated} mises à jour · ${result.total} total`,
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
  }
}

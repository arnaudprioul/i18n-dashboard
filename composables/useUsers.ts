import { userService } from '../services/user.service'
import type { CreateUserPayload, RoleEntry } from '../interfaces/user.interface'

export function useUsers(scope: 'project' | 'global' = 'project') {
  const toast = useToast()
  const { t } = useT()
  const { currentUser } = useAuth()
  const { currentProject } = useProject()

  const usersQuery = computed(() =>
    scope === 'global' ? {} : { project_id: currentProject.value?.id },
  )

  const data = ref<any[]>([])
  const pending = ref(false)

  async function refresh() {
    pending.value = true
    try {
      data.value = await userService.getUsers(usersQuery.value)
    }
    catch {
      data.value = []
    }
    finally {
      pending.value = false
    }
  }

  onMounted(refresh)
  watch(usersQuery, (q) => {
    if (scope === 'global' || q.project_id) refresh()
  })

  const users = computed(() => data.value ?? [])

  // ── Mutations ──────────────────────────────────────────────────────────────

  const saving = ref(false)
  async function createUser(payload: CreateUserPayload): Promise<string | null> {
    saving.value = true
    try {
      const result = await userService.create(payload)
      toast.add({
        title: t('users.created', 'User created'),
        description: `${t('users.invitation_sent', 'Invitation sent to')} ${payload.email}`,
        color: 'success',
      })
      await refresh()
      return result.tempPassword
    } catch {
      return null
    } finally {
      saving.value = false
    }
  }

  const rolesSaving = ref(false)
  async function updateRoles(userId: number, roles: RoleEntry[]): Promise<boolean> {
    rolesSaving.value = true
    try {
      await userService.updateRoles(userId, roles)
      toast.add({ title: t('users.access_updated', 'Access updated'), color: 'success' })
      await refresh()
      return true
    } catch {
      return false
    } finally {
      rolesSaving.value = false
    }
  }

  async function toggleActive(user: { id: number; is_active: boolean }): Promise<void> {
    try {
      await userService.update(user.id, {
        is_active: !user.is_active,
        project_id: scope === 'project' ? currentProject.value?.id : undefined,
      })
      toast.add({
        title: user.is_active ? t('users.deactivated', 'User deactivated') : t('users.reactivated', 'User reactivated'),
        color: 'success',
      })
      await refresh()
    } catch {}
  }

  const deleting = ref(false)
  async function deleteUser(userId: number): Promise<boolean> {
    deleting.value = true
    try {
      const projectId = scope === 'global' || currentUser.value?.is_super_admin
        ? undefined
        : currentProject.value?.id
      await userService.remove(userId, projectId)
      toast.add({ title: t('users.deleted', 'User deleted'), color: 'success' })
      await refresh()
      return true
    } catch {
      return false
    } finally {
      deleting.value = false
    }
  }

  return {
    users,
    pending,
    refresh,
    saving,
    createUser,
    rolesSaving,
    updateRoles,
    toggleActive,
    deleting,
    deleteUser,
  }
}

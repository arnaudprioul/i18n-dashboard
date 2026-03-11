import { profileService } from '../services/profile.service'
import { authService } from '../services/auth.service'
import { userService } from '../services/user.service'

export function useProfile(userId?: MaybeRefOrGetter<number | string>) {
  const toast = useToast()
  const { fetchMe } = useAuth()

  // ── Profile data ─────────────────────────────────────────────────────────
  // Load the target user's profile (or own profile if no userId provided)

  const targetId = computed(() => userId ? toValue(userId) : null)

  const { data: profile, pending, refresh } = useAsyncData(
    () => targetId.value ? `user-profile-${targetId.value}` : 'user-profile',
    () => targetId.value
      ? profileService.getUserProfile(targetId.value)
      : profileService.getProfile(),
    { watch: [targetId] },
  )

  // ── Own account editing (current logged-in user) ─────────────────────────

  const editSaving = ref(false)
  const editError = ref('')

  async function updateProfile(name: string, email: string): Promise<boolean> {
    editError.value = ''
    editSaving.value = true
    try {
      await authService.updateMe({ name, email })
      await Promise.all([refresh(), fetchMe()])
      toast.add({ title: 'Compte mis à jour', color: 'success' })
      return true
    }
    catch (e: any) {
      editError.value = e.message
      return false
    }
    finally {
      editSaving.value = false
    }
  }

  // ── Role management (admin managing another user's access) ───────────────

  const rolesSaving = ref(false)

  async function saveRoles(roles: Array<{ project_id: number | null; role: string | null }>): Promise<boolean> {
    if (!targetId.value) return false
    rolesSaving.value = true
    try {
      await userService.updateRoles(Number(targetId.value), roles)
      toast.add({ title: 'Accès mis à jour', color: 'success' })
      await refresh()
      return true
    }
    catch {
      return false
    }
    finally {
      rolesSaving.value = false
    }
  }

  return {
    profile,
    pending,
    refresh,
    editSaving,
    editError,
    updateProfile,
    rolesSaving,
    saveRoles,
  }
}

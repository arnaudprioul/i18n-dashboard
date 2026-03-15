import { profileService } from '../services/profile.service'
import { authService } from '../services/auth.service'
import { userService } from '../services/user.service'
import type { ProfilePeriod } from '../server/interfaces/profile.interface'

export function useProfile(userId?: MaybeRefOrGetter<number | string>) {
  const toast = useToast()
  const { t } = useT()
  const { fetchMe } = useAuth()

  // ── Profile data ─────────────────────────────────────────────────────────
  const targetId = computed(() => userId ? toValue(userId) : null)
  const period = ref<ProfilePeriod>('all')

  const { data: profile, pending, refresh } = useAsyncData(
    () => targetId.value ? `user-profile-${targetId.value}-${period.value}` : `user-profile-${period.value}`,
    () => targetId.value
      ? profileService.getUserProfile(targetId.value, period.value)
      : profileService.getProfile(period.value),
    { watch: [targetId, period] },
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
      toast.add({ title: t('profile.updated', 'Account updated'), color: 'success' })
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
      toast.add({ title: t('profile.access_updated', 'Access updated'), color: 'success' })
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
    period,
    pending,
    refresh,
    editSaving,
    editError,
    updateProfile,
    rolesSaving,
    saveRoles,
  }
}

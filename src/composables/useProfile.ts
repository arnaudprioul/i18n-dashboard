import { profileService } from '../services/profile.service'
import { authService } from '../services/auth.service'
import { userService } from '../services/user.service'
import type { ProfilePeriod } from '../interfaces/profile.interface'

export function useProfile(userId?: MaybeRefOrGetter<number | string>) {
  const toast = useToast()
  const { t } = useT()
  const { fetchMe } = useAuth()

  // ── Profile data ─────────────────────────────────────────────────────────
  const targetId = computed(() => userId ? toValue(userId) : null)
  const period = ref<ProfilePeriod>('all')

  const profile = ref<any>(null)
  const pending = ref(false)

  const refresh = async () => {
    pending.value = true
    try {
      profile.value = targetId.value
        ? await profileService.getUserProfile(targetId.value, period.value)
        : await profileService.getProfile(period.value)
    }
    catch {
      profile.value = null
    }
    finally {
      pending.value = false
    }
  }

  onMounted(refresh)
  watch([targetId, period], refresh)

  // ── Own account editing (current logged-in user) ─────────────────────────

  const editSaving = ref(false)
  const editError = ref('')

  const updateProfile = async (name: string, email: string): Promise<boolean> => {
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

  const saveRoles = async (roles: Array<{ project_id: number | null; role: string | null }>): Promise<boolean> => {
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

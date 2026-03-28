import { settingsService } from '../services/settings.service'
import type { ISettingsPayload } from '../interfaces/settings.interface'

export function useSettings() {
  const toast = useToast()
  const { t } = useT()

  const data = ref<Record<string, string>>({})
  const pending = ref(false)

  const refresh = async () => {
    pending.value = true
    try {
      data.value = await settingsService.getSettings()
    }
    catch {
      data.value = {}
    }
    finally {
      pending.value = false
    }
  }

  onMounted(refresh)

  const settings = computed(() => data.value ?? {})

  const saving = ref(false)
  const saveSettings = async (payload: ISettingsPayload): Promise<void> => {
    saving.value = true
    try {
      await settingsService.saveSettings(payload)
      toast.add({ title: t('settings.saved', 'Settings saved'), color: 'success' })
      await refresh()
    } catch (e: any) {
      toast.add({ title: t('common.error', 'Error'), description: e.message, color: 'error' })
    } finally {
      saving.value = false
    }
  }

  const getPasswordPolicy = async () => {
    return settingsService.getPasswordPolicy()
  }

  return { settings, pending, refresh, saving, saveSettings, getPasswordPolicy }
}

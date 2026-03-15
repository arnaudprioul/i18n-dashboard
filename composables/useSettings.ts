import { settingsService } from '../services/settings.service'
import type { SettingsPayload } from '../interfaces/settings.interface'

export function useSettings() {
  const toast = useToast()
  const { t } = useT()

  const { data, pending, refresh } = useAsyncData(
    'settings',
    () => settingsService.getSettings(),
    { default: () => ({} as Record<string, string>) },
  )

  const settings = computed(() => data.value ?? {})

  const saving = ref(false)
  async function saveSettings(payload: SettingsPayload): Promise<void> {
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

  return { settings, pending, refresh, saving, saveSettings }
}

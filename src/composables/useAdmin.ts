import { adminService } from '../services/admin.service'
import type { ISmtpPayload, ILogQuery } from '../services/admin.service'

export function useAdmin() {
  const toast = useToast()
  const { t } = useT()

  // ── SMTP ────────────────────────────────────────────────────────────────────

  const smtpPending = ref(false)
  const smtpSaving = ref(false)
  const smtpTesting = ref(false)
  const smtpTestError = ref('')

  async function loadSmtp() {
    smtpPending.value = true
    try {
      return await adminService.getSmtp()
    }
    catch { return null }
    finally { smtpPending.value = false }
  }

  async function saveSmtp(data: ISmtpPayload): Promise<boolean> {
    smtpSaving.value = true
    try {
      await adminService.saveSmtp(data)
      toast.add({ title: t('smtp.saved', 'SMTP configuration saved'), color: 'success' })
      return true
    }
    catch (e: any) {
      toast.add({ title: t('common.error', 'Error'), description: e?.message, color: 'error' })
      return false
    }
    finally { smtpSaving.value = false }
  }

  async function testSmtp(to: string): Promise<{ success: boolean; error: string }> {
    smtpTesting.value = true
    smtpTestError.value = ''
    try {
      await adminService.testSmtp(to)
      toast.add({ title: t('smtp.test_sent', 'Test email sent'), description: to, color: 'success' })
      return { success: true, error: '' }
    }
    catch (e: any) {
      const error = e?.message || 'Unknown error'
      smtpTestError.value = error
      return { success: false, error }
    }
    finally { smtpTesting.value = false }
  }

  // ── Logs ────────────────────────────────────────────────────────────────────

  const logsPending = ref(false)
  const logsPurging = ref(false)

  async function getLogs(params: ILogQuery) {
    logsPending.value = true
    try {
      return await adminService.getLogs(params)
    }
    catch { return null }
    finally { logsPending.value = false }
  }

  async function purgeLogs(): Promise<{ deleted: number } | null> {
    logsPurging.value = true
    try {
      const result = await adminService.purgeLogs()
      toast.add({
        title: t('logs.purged_toast', 'Logs purged'),
        description: `${result.deleted} ${t('logs.entries_deleted', 'entries deleted')}`,
        color: 'success',
      })
      return result
    }
    catch { return null }
    finally { logsPurging.value = false }
  }

  // ── Customization ───────────────────────────────────────────────────────────

  const customizationSaving = ref(false)

  async function loadCustomization() {
    try {
      return await adminService.getCustomization()
    }
    catch { return null }
  }

  async function saveCustomization(data: Parameters<typeof adminService.saveCustomization>[0]): Promise<boolean> {
    customizationSaving.value = true
    try {
      await adminService.saveCustomization(data)
      toast.add({ title: t('customization.saved', 'Customization saved'), color: 'success' })
      return true
    }
    catch {
      toast.add({ title: t('common.error', 'An error occurred'), color: 'error' })
      return false
    }
    finally { customizationSaving.value = false }
  }

  return {
    // SMTP
    smtpPending,
    smtpSaving,
    smtpTesting,
    smtpTestError,
    loadSmtp,
    saveSmtp,
    testSmtp,
    // Logs
    logsPending,
    logsPurging,
    getLogs,
    purgeLogs,
    // Customization
    customizationSaving,
    loadCustomization,
    saveCustomization,
  }
}

import { keyService } from '../services/key.service'
import { translationService } from '../services/translation.service'
import { scanService } from '../services/scan.service'
import type { KeysQuery, KeysResponse } from '../services/key.service'

export function useKeys(options: {
  queryParams?: Ref<KeysQuery>
  id?: Ref<string | string[]>
} = {}) {
  const toast = useToast()
  const { t } = useT()
  const router = useRouter()
  const route = useRoute()

  // ── List mode ─────────────────────────────────────────────────────────────

  const data = ref<KeysResponse | null>(null)
  const listPending = ref(false)

  async function refresh() {
    if (!options.queryParams?.value.project_id) return
    listPending.value = true
    try {
      data.value = await keyService.getKeys(options.queryParams.value)
    }
    catch {}
    finally {
      listPending.value = false
    }
  }

  if (options.queryParams) {
    watch(options.queryParams, refresh, { deep: true, immediate: true })
  }

  const addingKey = ref(false)
  async function createKey(projectId: number, key: string, description?: string): Promise<boolean> {
    addingKey.value = true
    try {
      await keyService.createKey({ project_id: projectId, key, description })
      toast.add({ title: t('keys.created', 'Key created'), color: 'success' })
      await refresh()
      refreshNuxtData('project-stats')
      return true
    }
    catch {
      return false
    }
    finally {
      addingKey.value = false
    }
  }

  const scanning = ref(false)
  async function scan(projectId: number): Promise<void> {
    scanning.value = true
    try {
      const result = await scanService.scan(projectId)
      const langMsg = result.langsAdded > 0 ? ` · ${result.langsAdded} ${t('scan.langs_added', 'language(s) added')}` : ''
      toast.add({
        title: t('scan.toast_title', 'Scan'),
        description: `${result.keysFound} ${t('scan.keys_found', 'keys found')} · ${result.keysAdded} ${t('scan.keys_added', 'new keys')}${langMsg}`,
        color: 'success',
      })
      await refresh()
    }
    catch {}
    finally {
      scanning.value = false
    }
  }

  const syncing = ref(false)
  async function sync(projectId: number): Promise<void> {
    syncing.value = true
    try {
      const result = await scanService.sync(projectId)
      toast.add({
        title: t('sync.toast_title', 'Sync'),
        description: `${result.added} ${t('sync.added', 'added')} · ${result.updated} ${t('sync.updated', 'updated')}`,
        color: 'success',
      })
      await refresh()
    }
    catch {}
    finally {
      syncing.value = false
    }
  }

  const batchTranslating = ref(false)
  async function batchTranslate(projectId: number, targetLang: string): Promise<void> {
    batchTranslating.value = true
    try {
      const result = await translationService.batchTranslate(projectId, targetLang)
      toast.add({
        title: t('keys.translate_done', 'Auto-translate complete'),
        description: `${result.translated} ${t('keys.translated', 'translated')} · ${result.skipped} ${t('keys.skipped', 'skipped')} · ${result.errors} ${t('common.errors', 'errors')}`,
        color: 'success',
      })
      await refresh()
    }
    catch {}
    finally {
      batchTranslating.value = false
    }
  }

  // ── Detail mode ───────────────────────────────────────────────────────────

  const keyId = computed(() => {
    if (!options.id) return null
    const v = options.id.value
    return Array.isArray(v) ? v[0] : v
  })

  const keyData = ref<Awaited<ReturnType<typeof keyService.getKey>> | null>(null)
  const detailPending = ref(false)

  async function detailRefresh() {
    const id = keyId.value
    if (!id) { keyData.value = null; return }
    detailPending.value = true
    try {
      keyData.value = await keyService.getKey(id)
    }
    catch {
      keyData.value = null
    }
    finally {
      detailPending.value = false
    }
  }

  onMounted(detailRefresh)
  watch(keyId, (id) => { if (id) detailRefresh() })

  const savingLang = ref<string | null>(null)
  async function saveTranslation(langCode: string, value: string): Promise<void> {
    if (!keyData.value) return
    savingLang.value = langCode
    try {
      await translationService.save({ key_id: keyData.value.id, language_code: langCode, value })
      await detailRefresh()
    }
    catch {}
    finally {
      savingLang.value = null
    }
  }

  const settingStatus = ref<string | null>(null)
  async function setStatus(langCode: string, status: string): Promise<void> {
    if (!keyData.value) return
    settingStatus.value = `${langCode}:${status}`
    try {
      await translationService.setStatus({ key_id: keyData.value.id, language_code: langCode, status })
      await detailRefresh()
    }
    catch {}
    finally {
      settingStatus.value = null
    }
  }

  async function restoreVersion(langCode: string, value: string): Promise<void> {
    if (!keyData.value) return
    try {
      await translationService.save({ key_id: keyData.value.id, language_code: langCode, value })
      await detailRefresh()
      toast.add({ title: t('keys.version_restored', 'Version restored'), color: 'success' })
    }
    catch {}
  }

  async function autoTranslate(langCode: string, text: string, sourceLang: string): Promise<string | null> {
    try {
      const result = await translationService.translateText(text, sourceLang, langCode)
      return result.text
    }
    catch {
      return null
    }
  }

  const savingDescription = ref(false)
  async function updateDescription(description: string | null): Promise<void> {
    if (!keyData.value) return
    savingDescription.value = true
    try {
      await keyService.updateKey(keyData.value.id, { description })
      await detailRefresh()
      toast.add({ title: t('keys.description_updated', 'Description updated'), color: 'success' })
    }
    catch {}
    finally {
      savingDescription.value = false
    }
  }

  const deleting = ref(false)
  async function deleteKey(): Promise<void> {
    if (!keyData.value) return
    deleting.value = true
    try {
      await keyService.deleteKey(keyData.value.id)
      toast.add({ title: t('keys.deleted', 'Key deleted'), color: 'success' })
      const projectId = route.params.id
      router.push(projectId ? `/projects/${projectId}/translations` : '/projects')
    }
    catch {
      deleting.value = false
    }
  }

  // ── Shared ────────────────────────────────────────────────────────────────

  const pending = computed(() => listPending.value || detailPending.value)

  return {
    // List
    data,
    addingKey,
    createKey,
    scanning,
    scan,
    syncing,
    sync,
    batchTranslating,
    batchTranslate,
    // Detail
    keyData,
    savingLang,
    saveTranslation,
    settingStatus,
    setStatus,
    restoreVersion,
    autoTranslate,
    savingDescription,
    updateDescription,
    deleting,
    deleteKey,
    // Shared
    pending,
    refresh: options.id ? detailRefresh : refresh,
  }
}

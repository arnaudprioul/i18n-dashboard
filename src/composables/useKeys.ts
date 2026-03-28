import { keyService } from '../services/key.service'
import { translationService } from '../services/translation.service'
import { scanService } from '../services/scan.service'
import type { IKeysQuery, IKeysResponse } from '../interfaces/key.interface'

export function useKeys(options: {
  queryParams?: Ref<IKeysQuery>
  id?: Ref<string | string[]>
} = {}) {
  const toast = useToast()
  const { t } = useT()
  const router = useRouter()
  const route = useRoute()

  // ── List mode ─────────────────────────────────────────────────────────────

  const data = ref<IKeysResponse | null>(null)
  const listPending = ref(false)

  const refresh = async () => {
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
  const createKey = async (projectId: number, key: string, description?: string): Promise<boolean> => {
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
  const scan = async (projectId: number): Promise<void> => {
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
  const sync = async (projectId: number): Promise<void> => {
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
  const batchTranslate = async (projectId: number, targetLang: string): Promise<void> => {
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

  const detailRefresh = async () => {
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
  const saveTranslation = async (langCode: string, value: string): Promise<void> => {
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
  const setStatus = async (langCode: string, status: string): Promise<void> => {
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

  const restoreVersion = async (langCode: string, value: string): Promise<void> => {
    if (!keyData.value) return
    try {
      await translationService.save({ key_id: keyData.value.id, language_code: langCode, value })
      await detailRefresh()
      toast.add({ title: t('keys.version_restored', 'Version restored'), color: 'success' })
    }
    catch {}
  }

  const autoTranslate = async (langCode: string, text: string, sourceLang: string): Promise<string | null> => {
    try {
      const result = await translationService.translateText(text, sourceLang, langCode)
      return result.text
    }
    catch {
      return null
    }
  }

  const savingDescription = ref(false)
  const updateDescription = async (description: string | null): Promise<void> => {
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
  const deleteKey = async (): Promise<void> => {
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

  // ── Row-level operations (for TranslationRow component) ───────────────────
  // These accept explicit IDs instead of relying on the current keyData ref.

  const saveTranslationById = async (keyId: number, langCode: string, value: string): Promise<void> => {
    await translationService.save({ key_id: keyId, language_code: langCode, value })
  }

  const setTranslationStatusById = async (keyId: number, langCode: string, status: string): Promise<void> => {
    await translationService.setStatus({ key_id: keyId, language_code: langCode, status })
  }

  const autoTranslateById = async (keyId: number, langCode: string, text: string, sourceLang: string): Promise<void> => {
    const result = await translationService.translateText(text, sourceLang, langCode)
    await translationService.save({ key_id: keyId, language_code: langCode, value: result.text })
  }

  const updateDescriptionById = async (keyId: number, description: string | null): Promise<void> => {
    await keyService.updateKey(keyId, { description })
  }

  const deleteKeyById = async (keyId: number): Promise<void> => {
    await keyService.deleteKey(keyId)
  }

  // ── Search (for pickers) ──────────────────────────────────────────────────

  const searchKeys = async (projectId: number, search?: string, limit = 50) => {
    const res = await keyService.getKeys({ project_id: projectId, search: search || undefined, limit, page: 1 })
    return res.data
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
    // Row-level
    saveTranslationById,
    setTranslationStatusById,
    autoTranslateById,
    updateDescriptionById,
    deleteKeyById,
    // Search
    searchKeys,
    // Shared
    pending,
    refresh: options.id ? detailRefresh : refresh,
  }
}

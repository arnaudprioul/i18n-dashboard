import { keyService } from '../services/key.service'
import { translationService } from '../services/translation.service'
import { scanService } from '../services/scan.service'
import type { KeysQuery, KeysResponse } from '../services/key.service'

export function useKeys(options: {
  queryParams?: Ref<KeysQuery>
  id?: Ref<string | string[]>
} = {}) {
  const toast = useToast()
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
      toast.add({ title: 'Clé créée', color: 'success' })
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
      const langMsg = result.langsAdded > 0 ? ` · ${result.langsAdded} langue(s) ajoutée(s)` : ''
      toast.add({
        title: 'Scan terminé',
        description: `${result.keysFound} clés trouvées · ${result.keysAdded} nouvelles${langMsg}`,
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
        title: 'Sync terminée',
        description: `${result.added} ajoutées · ${result.updated} mises à jour`,
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
        title: 'Traduction automatique terminée',
        description: `${result.translated} traduites · ${result.skipped} ignorées · ${result.errors} erreurs`,
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

  const { data: keyData, pending: detailPending, refresh: detailRefresh } = useAsyncData(
    `key-${keyId.value ?? 'none'}`,
    () => keyId.value ? keyService.getKey(keyId.value) : Promise.resolve(null),
    { watch: [keyId] },
  )

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
      toast.add({ title: 'Version restaurée', color: 'success' })
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
      toast.add({ title: 'Description mise à jour', color: 'success' })
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
      toast.add({ title: 'Clé supprimée', color: 'success' })
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

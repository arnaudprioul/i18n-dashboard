import { keyService } from '../services/key.service'
import { translationService } from '../services/translation.service'
import { TRANSLATION_STATUS } from '~/enums/translation.enum'
import type { IReviewItem } from '../interfaces/review.interface'

export function useReview() {
  const toast = useToast()
  const { t } = useT()
  const { currentProject } = useProject()

  const data = ref<any>(null)
  const pending = ref(false)

  async function refresh() {
    if (!currentProject.value?.id) return
    pending.value = true
    try {
      data.value = await keyService.getKeys({
        project_id: currentProject.value.id,
        status: TRANSLATION_STATUS.DRAFT,
        limit: 200,
      })
    } catch {} finally {
      pending.value = false
    }
  }

  watch(() => currentProject.value?.id, () => {
    refresh()
  }, { immediate: true })

  const reviewItems = computed<IReviewItem[]>(() => {
    const keys = data.value?.data ?? []
    const result: IReviewItem[] = []
    for (const k of keys) {
      for (const [lang, tr] of Object.entries(k.translations as Record<string, any>)) {
        if (tr?.status === TRANSLATION_STATUS.DRAFT && tr?.value) {
          result.push({ id: tr.id, key: k.key, key_description: k.description, language_code: lang, value: tr.value })
        }
      }
    }
    return result
  })

  const processingId = ref<number | null>(null)
  const processingAction = ref('')

  async function setStatus(item: IReviewItem, status: TRANSLATION_STATUS): Promise<void> {
    processingId.value = item.id
    processingAction.value = status
    try {
      await translationService.bulkStatus([item.id], status)
      await refresh()
      refreshNuxtData('project-stats')
    } catch {} finally {
      processingId.value = null
      processingAction.value = ''
    }
  }

  const approvingAll = ref(false)
  async function markAllReviewed(): Promise<void> {
    approvingAll.value = true
    try {
      const ids = reviewItems.value.map(i => i.id)
      await translationService.bulkStatus(ids, TRANSLATION_STATUS.REVIEWED)
      const n = ids.length
      toast.add({
        title: t('review.marked_reviewed', 'Marked as reviewed'),
        description: `${n} ${t('review.translations_reviewed', 'translation(s) marked as reviewed')}`,
        color: 'success',
      })
      await refresh()
      refreshNuxtData('project-stats')
    } catch {} finally {
      approvingAll.value = false
    }
  }

  return {
    reviewItems,
    pending,
    refresh,
    processingId,
    processingAction,
    setStatus,
    approvingAll,
    markAllReviewed,
  }
}

import { keyService } from '../services/key.service'
import { translationService } from '../services/translation.service'
import { TRANSLATION_STATUS } from '../enums/translation.enum'
import type { IReviewItem } from '../interfaces/review.interface'

export function useReview(options: { projectId?: Ref<number | undefined> } = {}) {
  const toast = useToast()
  const { t } = useT()
  const { currentProject } = useProject()

  const resolvedProjectId = computed(() =>
    options.projectId?.value ?? currentProject.value?.id,
  )

  const data = ref<any>(null)
  const reviewedData = ref<any>(null)
  const pending = ref(false)

  async function refresh() {
    if (!resolvedProjectId.value) return
    pending.value = true
    try {
      const [draftResult, reviewedResult] = await Promise.all([
        keyService.getKeys({
          project_id: resolvedProjectId.value,
          status: TRANSLATION_STATUS.DRAFT,
          limit: 200,
        }),
        keyService.getKeys({
          project_id: resolvedProjectId.value,
          status: TRANSLATION_STATUS.REVIEWED,
          limit: 200,
        }),
      ])
      data.value = draftResult
      reviewedData.value = reviewedResult
    } catch {} finally {
      pending.value = false
    }
  }

  watch(resolvedProjectId, () => {
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

  const reviewedItems = computed<IReviewItem[]>(() => {
    const keys = reviewedData.value?.data ?? []
    const result: IReviewItem[] = []
    for (const k of keys) {
      for (const [lang, tr] of Object.entries(k.translations as Record<string, any>)) {
        if (tr?.status === TRANSLATION_STATUS.REVIEWED && tr?.value) {
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

  const approvingAllReviewed = ref(false)
  async function approveAllReviewed(): Promise<void> {
    approvingAllReviewed.value = true
    try {
      const ids = reviewedItems.value.map(i => i.id)
      await translationService.bulkStatus(ids, TRANSLATION_STATUS.APPROVED)
      const n = ids.length
      toast.add({
        title: t('review.approved_toast', 'Approved'),
        description: `${n} ${t('review.translations_approved', 'translation(s) approved')}`,
        color: 'success',
      })
      await refresh()
      refreshNuxtData('project-stats')
    } catch {} finally {
      approvingAllReviewed.value = false
    }
  }

  return {
    reviewItems,
    reviewedItems,
    pending,
    refresh,
    processingId,
    processingAction,
    setStatus,
    approvingAll,
    markAllReviewed,
    approvingAllReviewed,
    approveAllReviewed,
  }
}

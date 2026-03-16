<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ t('review.title', 'Review queue') }}</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
          {{ reviewItems.length }} {{ t('review.pending_count', 'translation') }}{{ reviewItems.length > 1 ? t('review.pending_count_plural', 's') : '' }} {{ t('review.pending_label', 'pending review') }}
        </p>
      </div>
      <UButton
        v-if="reviewItems.length > 0"
        icon="i-heroicons-check-circle"
        :loading="approvingAll"
        @click="approveAll"
      >
        {{ t('review.mark_all_reviewed', 'Mark all as reviewed') }} ({{ reviewItems.length }})
      </UButton>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-3">
      <USkeleton v-for="i in 5" :key="i" class="h-20" />
    </div>

    <!-- Empty -->
    <div v-else-if="!reviewItems.length" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 py-16 text-center">
      <UIcon name="i-heroicons-check-badge" class="text-5xl text-green-400 mb-3" />
      <p class="text-gray-600 dark:text-gray-400 font-medium">{{ t('review.empty_title', 'No translations pending') }}</p>
      <p class="text-gray-400 text-sm mt-1">{{ t('review.empty_hint', 'All reviewed translations have already been approved.') }}</p>
    </div>

    <!-- Review list -->
    <div v-else class="space-y-3">
      <div
        v-for="item in reviewItems"
        :key="item.id"
        class="bg-white dark:bg-gray-900 rounded-xl border border-blue-200 dark:border-blue-800/60 overflow-hidden"
      >
        <div class="flex items-start gap-4 p-4">
          <!-- Status badge -->
          <div class="shrink-0 mt-0.5">
            <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700">
              <span class="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
              {{ t('status.draft', 'Draft') }}
            </span>
          </div>

          <!-- Key info -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-mono font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded">
                {{ item.key }}
              </span>
              <UBadge size="xs" variant="outline" color="neutral">{{ item.language_code.toUpperCase() }}</UBadge>
            </div>
            <p v-if="item.key_description" class="text-xs text-gray-400 mb-2">{{ item.key_description }}</p>
            <p class="text-sm text-gray-700 dark:text-gray-300 leading-snug">{{ item.value }}</p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 shrink-0">
            <UTooltip :text="t('review.reject', 'Reject')">
              <UButton
                icon="i-heroicons-x-mark"
                color="error"
                variant="ghost"
                size="sm"
                :loading="processingId === item.id && processingAction === TRANSLATION_STATUS.REJECTED"
                @click="setStatus(item, TRANSLATION_STATUS.REJECTED)"
              />
            </UTooltip>
            <UButton
              icon="i-heroicons-check"
              color="success"
              size="sm"
              :loading="processingId === item.id && processingAction === TRANSLATION_STATUS.REVIEWED"
              @click="setStatus(item, TRANSLATION_STATUS.REVIEWED)"
            >
              {{ t('review.mark_reviewed', 'Mark as reviewed') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TRANSLATION_STATUS } from '~/server/enums/translation.enum'

const { currentProject } = useProject()
const { canApprove } = useAuth()
const { t } = useT()

const hasAccess = computed(() =>
  currentProject.value ? canApprove(currentProject.value.id) : false,
)
watch(hasAccess, (ok) => { if (import.meta.client && !ok) navigateTo('/') }, { immediate: true })

const {
  reviewItems,
  pending,
  processingId,
  processingAction,
  setStatus,
  approvingAll,
  markAllReviewed: approveAll,
} = useReview()
</script>

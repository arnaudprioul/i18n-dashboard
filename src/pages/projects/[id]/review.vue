<template>
  <div class="p-6">
    <!-- Draft section -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1
          data-cy="review-title"
          class="text-2xl font-bold text-gray-900 dark:text-white"
        >
          {{ t('review.title', 'Review queue') }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
          {{ reviewItems.length }} {{ t('review.pending_label', 'pending review') }}
        </p>
      </div>
      <UButton
        v-if="reviewItems.length > 0"
        icon="i-heroicons-check-circle"
        :loading="approvingAll"
        @click="markAllReviewed"
      >
        {{ t('review.mark_all_reviewed', 'Mark all as reviewed') }} ({{ reviewItems.length }})
      </UButton>
    </div>

    <!-- Loading -->
    <div
      v-if="pending"
      class="space-y-3"
    >
      <USkeleton
        v-for="i in 5"
        :key="i"
        class="h-20"
      />
    </div>

    <template v-else>
      <!-- Empty state (both queues empty) -->
      <div
        v-if="!reviewItems.length && !reviewedItems.length"
        data-cy="review-empty-state"
        class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 py-16 text-center"
      >
        <UIcon
          name="i-heroicons-check-badge"
          class="text-5xl text-green-400 mb-3"
        />
        <p class="text-gray-600 dark:text-gray-400 font-medium">
          {{ t('review.empty_title', 'No translations pending') }}
        </p>
        <p class="text-gray-400 text-sm mt-1">
          {{ t('review.empty_hint', 'All reviewed translations have already been approved.') }}
        </p>
      </div>

      <!-- Draft items (need review) -->
      <div
        v-if="reviewItems.length"
        class="space-y-3 mb-8"
      >
        <div
          v-for="item in reviewItems"
          :key="item.id"
          :data-cy="'review-item-' + item.id"
          class="bg-white dark:bg-gray-900 rounded-xl border border-blue-200 dark:border-blue-800/60 overflow-hidden"
        >
          <div class="flex items-start gap-4 p-4">
            <div class="shrink-0 mt-0.5">
              <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700">
                <span class="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                {{ t('status.draft', 'Draft') }}
              </span>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-mono font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded">
                  {{ item.key }}
                </span>
                <UBadge
                  size="xs"
                  variant="outline"
                  color="neutral"
                >
                  {{ item.language_code.toUpperCase() }}
                </UBadge>
              </div>
              <p
                v-if="item.key_description"
                class="text-xs text-gray-400 mb-2"
              >
                {{ item.key_description }}
              </p>
              <p class="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                {{ item.value }}
              </p>
            </div>
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
                data-cy="mark-reviewed-btn"
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

      <!-- Reviewed items (awaiting approval) -->
      <div v-if="reviewedItems.length">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-gray-700 dark:text-gray-300">
            {{ t('review.awaiting_approval', 'Awaiting approval') }}
            <span class="ml-1 text-sm font-normal text-gray-400">({{ reviewedItems.length }})</span>
          </h2>
          <UButton
            icon="i-heroicons-shield-check"
            color="primary"
            size="sm"
            :loading="approvingAllReviewed"
            @click="approveAllReviewed"
          >
            {{ t('review.approve_all', 'Approve all') }} ({{ reviewedItems.length }})
          </UButton>
        </div>

        <div class="space-y-3">
          <div
            v-for="item in reviewedItems"
            :key="item.id"
            class="bg-white dark:bg-gray-900 rounded-xl border border-blue-300 dark:border-blue-700/60 overflow-hidden"
          >
            <div class="flex items-start gap-4 p-4">
              <div class="shrink-0 mt-0.5">
                <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {{ t('status.reviewed', 'Reviewed') }}
                </span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-mono font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded">
                    {{ item.key }}
                  </span>
                  <UBadge
                    size="xs"
                    variant="outline"
                    color="neutral"
                  >
                    {{ item.language_code.toUpperCase() }}
                  </UBadge>
                </div>
                <p
                  v-if="item.key_description"
                  class="text-xs text-gray-400 mb-2"
                >
                  {{ item.key_description }}
                </p>
                <p class="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                  {{ item.value }}
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <UTooltip :text="t('review.back_to_draft', 'Back to draft')">
                  <UButton
                    icon="i-heroicons-arrow-uturn-left"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    :loading="processingId === item.id && processingAction === TRANSLATION_STATUS.DRAFT"
                    @click="setStatus(item, TRANSLATION_STATUS.DRAFT)"
                  />
                </UTooltip>
                <UButton
                  icon="i-heroicons-shield-check"
                  color="primary"
                  size="sm"
                  :loading="processingId === item.id && processingAction === TRANSLATION_STATUS.APPROVED"
                  @click="setStatus(item, TRANSLATION_STATUS.APPROVED)"
                >
                  {{ t('review.approve', 'Approve') }}
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { TRANSLATION_STATUS } from '../../../enums/translation.enum'

const { currentProject } = useProject()
const { canApprove, currentUser } = useAuth()
const { t } = useT()

const hasAccess = computed((): boolean | null => {
  if (currentProject.value === null || currentUser.value === null) return null
  return canApprove(currentProject.value.id)
})
watch(hasAccess, (ok) => {
  if (import.meta.client && ok === false) {
    navigateTo('/')
  }
}, { immediate: true })

const {
  reviewItems,
  reviewedItems,
  pending,
  processingId,
  processingAction,
  setStatus,
  approvingAll,
  markAllReviewed,
  approvingAllReviewed,
  approveAllReviewed,
} = useReview()
</script>

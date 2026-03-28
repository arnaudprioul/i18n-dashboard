<template>
  <u-modal
    :open="true"
    :title="t('history.modal_title', 'Translation History')"
    @update:open="$emit('close')"
  >
    <template #body>
      <div
        v-if="pending"
        class="space-y-3"
      >
        <u-skeleton
          v-for="i in 3"
          :key="i"
          class="h-16"
        />
      </div>

      <div
        v-else-if="!history?.length"
        class="text-center py-8"
      >
        <u-icon
          name="i-heroicons-clock"
          class="text-4xl text-gray-300 dark:text-gray-600 mb-2"
        />
        <p class="text-gray-400">
          {{ t('history.no_history', 'No history available') }}
        </p>
      </div>

      <div
        v-else
        class="space-y-3 max-h-96 overflow-y-auto"
      >
        <div
          v-for="entry in history"
          :key="entry.id"
          class="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
        >
          <div class="flex items-center justify-between mb-2">
            <u-badge
              :color="entry.changed_by === 'google-translate' ? 'info' : entry.changed_by === 'sync' ? 'warning' : 'success'"
              size="xs"
            >
              {{ entry.changed_by === 'google-translate'
                ? t('history.source_google', 'Google Translate')
                : entry.changed_by === 'sync'
                  ? t('history.source_sync', 'File Sync')
                  : t('history.source_manual', 'Manual') }}
            </u-badge>
            <span class="text-xs text-gray-400">{{ formatDate(entry.changed_at) }}</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <p class="text-xs text-gray-400 mb-1">
                {{ t('history.before', 'Before') }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400 bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 min-h-8">
                {{ entry.old_value || '—' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-400 mb-1">
                {{ t('history.after', 'After') }}
              </p>
              <p class="text-sm text-gray-800 dark:text-gray-200 bg-green-50 dark:bg-green-900/20 rounded px-2 py-1 min-h-8">
                {{ entry.new_value || '—' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <u-button
        color="neutral"
        variant="outline"
        @click="$emit('close')"
      >
        {{ t('common.close', 'Close') }}
      </u-button>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import type { ITranslationHistoryModalProps, ITranslationHistoryModalEmits } from '../../interfaces/translation.interface'

const props = defineProps<ITranslationHistoryModalProps>()

defineEmits<ITranslationHistoryModalEmits>()

const { t } = useT()

const { data: history, pending } = await useFetch(
  () => props.translationId ? `/api/history/${props.translationId}` : null,
)

function formatDate(date: string) {
  return new Date(date).toLocaleString()
}
</script>

<template>
  <div class="flex gap-2">
    <u-input
      :model-value="modelValue"
      class="flex-1 font-mono text-sm"
      :placeholder="placeholder || '/path/to/project'"
      @update:model-value="$emit('update:modelValue', $event)"
    />
    <u-button
      icon="i-heroicons-folder-open"
      color="neutral"
      variant="outline"
      @click="openBrowser"
    />
  </div>

  <u-modal
    v-model:open="open"
    :title="t('pathpicker.title', 'Select a folder')"
    :ui="{ width: 'sm:max-w-xl' }"
  >
    <template #body>
      <div class="space-y-3">
        <!-- Breadcrumbs + home -->
        <div class="flex items-center gap-1 flex-wrap min-h-6">
          <u-button
            icon="i-heroicons-home"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="browse(data?.home ?? '')"
          />
          <template
            v-for="(crumb, i) in data?.breadcrumbs"
            :key="crumb.path"
          >
            <u-icon
              name="i-heroicons-chevron-right"
              class="text-gray-400 text-xs shrink-0"
            />
            <button
              class="text-xs px-1.5 py-0.5 rounded transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 font-mono"
              :class="i === (data?.breadcrumbs.length ?? 0) - 1
                ? 'text-gray-900 dark:text-white font-semibold'
                : 'text-gray-500 dark:text-gray-400'"
              @click="browse(crumb.path)"
            >
              {{ crumb.name }}
            </button>
          </template>
        </div>

        <!-- Directory list -->
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <!-- Up -->
          <button
            v-if="data?.parent"
            class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 transition-colors"
            @click="browse(data.parent)"
          >
            <u-icon
              name="i-heroicons-arrow-up"
              class="text-gray-400 shrink-0"
            />
            <span class="font-mono">../</span>
          </button>

          <!-- Loading -->
          <div
            v-if="loading"
            class="py-8 text-center"
          >
            <u-icon
              name="i-heroicons-arrow-path"
              class="animate-spin text-gray-400 text-lg"
            />
          </div>

          <!-- Empty -->
          <div
            v-else-if="!data?.entries.length"
            class="py-8 text-center text-sm text-gray-400"
          >
            {{ t('pathpicker.empty', 'No subfolder') }}
          </div>

          <!-- Entries -->
          <div
            v-else
            class="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800"
          >
            <button
              v-for="entry in data.entries"
              :key="entry.path"
              class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group"
              @click="browse(entry.path)"
            >
              <u-icon
                name="i-heroicons-folder"
                class="text-amber-400 shrink-0"
              />
              <span class="font-mono text-gray-700 dark:text-gray-300 flex-1 truncate">{{ entry.name }}</span>
              <u-icon
                name="i-heroicons-chevron-right"
                class="text-gray-300 dark:text-gray-600 shrink-0 group-hover:text-gray-400 transition-colors"
              />
            </button>
          </div>
        </div>

        <!-- Current selection -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
          <u-icon
            name="i-heroicons-map-pin"
            class="text-primary-500 shrink-0 text-sm"
          />
          <code class="text-xs font-mono text-gray-700 dark:text-gray-300 flex-1 truncate">{{ data?.current ?? '…' }}</code>
        </div>

        <p
          v-if="browseError"
          class="text-xs text-red-500"
        >
          {{ browseError }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <u-button
          color="neutral"
          variant="ghost"
          @click="open = false"
        >
          {{ t('common.cancel', 'Cancel') }}
        </u-button>
        <u-button
          icon="i-heroicons-check"
          :disabled="!data?.current"
          @click="select"
        >
          {{ t('pathpicker.select', 'Select this folder') }}
        </u-button>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
const { t } = useT()

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const loading = ref(false)
const browseError = ref('')
const data = ref<{
  current: string
  parent: string | null
  home: string
  breadcrumbs: { name: string; path: string }[]
  entries: { name: string; path: string }[]
} | null>(null)

async function openBrowser() {
  open.value = true
  // Start from modelValue if set, otherwise let the server default to home
  await browse(props.modelValue || '')
}

async function browse(path: string) {
  loading.value = true
  browseError.value = ''
  try {
    data.value = await $fetch('/api/fs/browse', {
      query: path ? { path } : {},
    })
  } catch (e: any) {
    browseError.value = e?.data?.message ?? 'Cannot browse this path'
  } finally {
    loading.value = false
  }
}

function select() {
  if (data.value?.current) {
    emit('update:modelValue', data.value.current)
  }
  open.value = false
}
</script>

<template>
  <u-tooltip :text="t('key.link_key_tooltip', 'Link a key (@:key) with optional modifier')">
    <u-button
      icon="i-heroicons-link"
      size="xs"
      color="neutral"
      variant="soft"
      class="shrink-0"
      @click="openModal"
    />
  </u-tooltip>

  <u-modal
    v-model:open="open"
    :title="t('key.link_key_title', 'Link a key')"
    :ui="{ width: 'sm:max-w-lg' }"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Modifier selector -->
        <div class="flex gap-1.5 flex-wrap">
          <button
            v-for="mod in modifiers"
            :key="mod.value"
            class="px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors"
            :class="selectedModifier === mod.value
              ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-600'
              : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300'"
            @click="selectedModifier = mod.value"
          >
            {{ mod.syntax }}
          </button>
        </div>

        <!-- Search -->
        <u-input
          ref="searchInput"
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          :placeholder="t('key.search_placeholder', 'Search for a key...')"
          class="w-full"
          @input="onSearch"
        />

        <!-- Key list -->
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div
            v-if="loading"
            class="py-8 text-center"
          >
            <u-icon
              name="i-heroicons-arrow-path"
              class="animate-spin text-gray-400 text-lg"
            />
          </div>
          <div
            v-else-if="!keys.length"
            class="py-8 text-center text-sm text-gray-400"
          >
            {{ t('key.none_found', 'No key found') }}
          </div>
          <div
            v-else
            class="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800"
          >
            <button
              v-for="key in keys"
              :key="key.id"
              class="w-full text-left px-3 py-2.5 flex items-center justify-between gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 group"
              @click="selectKey(key.key)"
            >
              <span class="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">{{ key.key }}</span>
              <code class="text-xs text-violet-500 dark:text-violet-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {{ previewSyntax }}{{ key.key }}
              </code>
            </button>
          </div>
        </div>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
const { t } = useT()

const props = defineProps<{
  projectId?: number
}>()

const emit = defineEmits<{
  select: [value: string]
}>()

const open = ref(false)
const search = ref('')
const loading = ref(false)
const keys = ref<Array<{ id: number; key: string }>>([])
const selectedModifier = ref<string>('')
const searchInput = ref()

const modifiers = computed(() => [
  { value: '', syntax: '@:key' },
  { value: 'lower', syntax: '@.lower:key' },
  { value: 'upper', syntax: '@.upper:key' },
  { value: 'capitalize', syntax: '@.capitalize:key' },
])

const previewSyntax = computed(() =>
  selectedModifier.value ? `@.${selectedModifier.value}:` : '@:',
)

function openModal() {
  open.value = true
  search.value = ''
  selectedModifier.value = ''
  fetchKeys()
  nextTick(() => searchInput.value?.inputRef?.focus())
}

let searchTimeout: ReturnType<typeof setTimeout>
function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(fetchKeys, 200)
}

async function fetchKeys() {
  if (!props.projectId) return
  loading.value = true
  try {
    const res = await $fetch<{ data: Array<{ id: number; key: string }> }>('/api/keys', {
      query: {
        project_id: props.projectId,
        search: search.value || undefined,
        limit: 50,
        page: 1,
      },
    })
    keys.value = res.data
  } catch {
    keys.value = []
  } finally {
    loading.value = false
  }
}

function selectKey(key: string) {
  emit('select', `${previewSyntax.value}${key}`)
  open.value = false
}
</script>

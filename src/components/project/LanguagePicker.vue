<template>
  <div class="space-y-3">
    <!-- Search -->
    <u-input
      v-model="search"
      :placeholder="t('onboarding.languages_search', 'Search for a language...')"
      icon="i-heroicons-magnifying-glass"
      class="w-full"
    />

    <!-- List -->
    <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div class="max-h-48 overflow-y-auto">
        <button
          v-for="lang in filteredList"
          :key="lang.code"
          class="w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          :class="isSelected(lang.code) ? 'opacity-40 cursor-default' : 'text-gray-700 dark:text-gray-300'"
          :disabled="isSelected(lang.code)"
          @click="add(lang)"
        >
          <span class="font-mono text-xs text-gray-400 w-14 shrink-0">{{ lang.code }}</span>
          <span class="flex-1">{{ lang.nativeName }}</span>
          <span class="text-xs text-gray-400 shrink-0">{{ lang.name }}</span>
          <u-icon
            v-if="isSelected(lang.code)"
            name="i-heroicons-check"
            class="text-primary-500 shrink-0"
          />
        </button>
        <div
          v-if="!filteredList.length"
          class="px-3 py-4 text-sm text-center text-gray-400"
        >
          {{ t('languages.none_found', 'No language found') }}
        </div>
      </div>

      <!-- Custom BCP-47 -->
      <div
        v-if="search && isValidBcp47(search) && !filteredList.find(l => l.code.toLowerCase() === search.toLowerCase())"
        class="border-t border-gray-200 dark:border-gray-700"
      >
        <button
          class="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-amber-50 dark:hover:bg-amber-900/20 text-gray-500 dark:text-gray-400 transition-colors"
          @click="addCustom(search)"
        >
          <u-icon
            name="i-heroicons-plus-circle"
            class="shrink-0 text-amber-500"
          />
          <span class="flex-1">{{ t('languages.use_code', 'Use code') }} <code class="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{{ search }}</code></span>
          <u-badge
            size="xs"
            color="warning"
            variant="soft"
          >
            BCP 47
          </u-badge>
        </button>
      </div>
    </div>

    <!-- Selected languages -->
    <div
      v-if="modelValue.length"
      class="space-y-1.5"
    >
      <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
        {{ t('languages.selected', 'Selected languages') }}
      </p>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="lang in modelValue"
          :key="lang.code"
          class="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg px-2 py-1"
        >
          <span class="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">{{ lang.code }}</span>
          <u-badge
            v-if="lang.is_default"
            size="xs"
            color="primary"
            variant="soft"
            class="cursor-pointer"
            @click="setDefault(lang.code)"
          >
            {{ t('languages.default_badge', 'Default') }}
          </u-badge>
          <button
            v-else
            class="text-xs text-gray-400 hover:text-primary-500 transition-colors"
            :title="t('languages.set_as_default', 'Set as default')"
            @click="setDefault(lang.code)"
          >
            <u-icon
              name="i-heroicons-star"
              class="text-xs"
            />
          </button>
          <button
            class="text-gray-300 hover:text-red-500 transition-colors"
            @click="remove(lang.code)"
          >
            <u-icon
              name="i-heroicons-x-mark"
              class="text-xs"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LANGUAGES } from '../consts/languages.const'

const { t } = useT()

const props = defineProps<{
  modelValue: Array<{ code: string; name: string; is_default: boolean }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Array<{ code: string; name: string; is_default: boolean }>]
}>()

const search = ref('')

const filteredList = computed(() => {
  const q = search.value.toLowerCase()
  const list = q
    ? LANGUAGES.filter(l =>
        l.code.toLowerCase().includes(q)
        || l.name.toLowerCase().includes(q)
        || l.nativeName.toLowerCase().includes(q),
      )
    : LANGUAGES
  return list
})

function isSelected(code: string) {
  return props.modelValue.some(l => l.code === code)
}

function isValidBcp47(code: string): boolean {
  return /^[a-z]{2,8}(-[A-Za-z0-9]{1,8})*$/i.test(code) && code.length >= 2
}

function add(lang: { code: string; name: string; nativeName: string }) {
  if (isSelected(lang.code)) return
  const isFirst = props.modelValue.length === 0
  emit('update:modelValue', [...props.modelValue, { code: lang.code, name: lang.name, is_default: isFirst }])
  search.value = ''
}

function addCustom(code: string) {
  const normalized = code.trim()
  if (isSelected(normalized)) return
  const isFirst = props.modelValue.length === 0
  emit('update:modelValue', [...props.modelValue, { code: normalized, name: normalized, is_default: isFirst }])
  search.value = ''
}

function remove(code: string) {
  const updated = props.modelValue.filter(l => l.code !== code)
  // If we removed the default, set the first one as default
  if (updated.length && !updated.some(l => l.is_default)) {
    updated[0].is_default = true
  }
  emit('update:modelValue', updated)
}

function setDefault(code: string) {
  emit('update:modelValue', props.modelValue.map(l => ({ ...l, is_default: l.code === code })))
}
</script>

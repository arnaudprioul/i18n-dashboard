<template>
  <u-card v-if="snippet">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <u-icon
            class="text-green-500"
            name="i-heroicons-code-bracket"
          />
          <h2 class="font-semibold text-gray-900 dark:text-white">
            {{ t('formats.snippet_title', 'Integration snippet') }}
          </h2>
        </div>
        <u-button
          :label="copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy')"
          :color="copied ? 'success' : 'neutral'"
          :icon="copied ? 'i-heroicons-check' : 'i-heroicons-clipboard'"
          size="xs"
          variant="ghost"
          @click="copy"
        />
      </div>
    </template>

    <div class="text-xs text-gray-500 dark:text-gray-400 mb-3">
      {{ t('formats.snippet_hint', 'Paste this into your') }}
      <code class="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">i18n.ts</code>
      {{ t('formats.snippet_hint2', 'to use all configured formats and modifiers.') }}
    </div>

    <div class="relative">
      <pre class="text-xs font-mono bg-gray-950 dark:bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto leading-relaxed"><code>{{ snippet }}</code></pre>
    </div>
  </u-card>
</template>

<script lang="ts" setup>
  export interface IFormatSnippetProps {
    snippet: string
  }

  const props = defineProps<IFormatSnippetProps>()

  const { t } = useT()
  const copied = ref(false)

  const copy = async () => {
    await navigator.clipboard.writeText(props.snippet)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
</script>

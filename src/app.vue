<script setup lang="ts">
/**
 * Theme application: update appConfig.ui.colors so the @nuxt/ui colors plugin
 * regenerates --ui-color-primary-* / --ui-color-neutral-* CSS variables.
 * The plugin (node_modules/@nuxt/ui/dist/runtime/plugins/colors.js) is reactive —
 * any change to appConfig.ui.colors triggers an automatic style tag update.
 *
 * useFetch is SSR-compatible, so the correct color is applied before the page
 * reaches the browser (no flash of the default colour).
 */
const { theme } = useModuleConfig()
const appConfig = useAppConfig()

watch(
  theme,
  (t) => {
    if (t?.primary) appConfig.ui.colors.primary = t.primary
    if (t?.neutral) appConfig.ui.colors.neutral = t.neutral
  },
  { immediate: true },
)
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator
      color="var(--color-primary-500)"
      :height="3"
      :throttle="100"
    />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

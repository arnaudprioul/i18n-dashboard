<script setup lang="ts">
const { theme } = useModuleConfig()

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

const themeStyle = computed(() => {
  const color = theme.value?.primary
  if (!color) return ''
  const vars = SHADES.map(s => `--color-primary-${s}: var(--color-${color}-${s})`).join('; ')
  return `:root { ${vars} }`
})

useHead({
  style: computed(() =>
    themeStyle.value ? [{ id: 'module-theme', innerHTML: themeStyle.value }] : [],
  ),
})

const loadingColor = computed(() =>
  theme.value?.primary
    ? `var(--color-${theme.value.primary}-500)`
    : 'rgb(var(--ui-primary))',
)
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator
      :color="loadingColor"
      :height="3"
      :throttle="100"
    />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

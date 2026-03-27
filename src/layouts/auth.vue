<template>
  <div
      class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
    <Transition name="auth-overlay">
      <div
          v-if="isLoading"
          class="fixed inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-gray-950/60 backdrop-blur-sm"
      >
        <u-icon
            class="text-4xl text-primary-500 animate-spin"
            name="i-heroicons-arrow-path"
        />
      </div>
    </Transition>
    <slot/>
  </div>
</template>

<script lang="ts" setup>
  const { isLoading } = useLoadingIndicator()
</script>

<style scoped>
.auth-overlay-enter-active,
.auth-overlay-leave-active {
  transition: opacity 0.15s ease;
}

.auth-overlay-enter-from,
.auth-overlay-leave-to {
  opacity: 0;
}
</style>

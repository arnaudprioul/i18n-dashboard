<template>
  <UApp>
    <NuxtLoadingIndicator
      color="rgb(var(--ui-primary))"
      :height="3"
      :throttle="100"
    />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

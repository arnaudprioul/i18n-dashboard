<template>
  <div class="p-6">
    <DashboardProjectWidgetGrid :project-id="projectId" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const projectId = computed(() => Number(route.params.id))
</script>

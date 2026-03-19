<script lang="ts" setup>
import type { TWidgetSize } from '~/types/dashboard.type'

const props = defineProps<{
  size: TWidgetSize
  editing: boolean
}>()

const { t } = useT()
const { visibleProjects, pending } = useProject()
const router = useRouter()

const maxItems = computed(() => {
  if (props.size === 'lg') return 6
  if (props.size === 'wide') return 4
  return 3
})

const displayedProjects = computed(() => visibleProjects.value.slice(0, maxItems.value))

function navigate(id: number) {
  if (props.editing) return
  router.push(`/projects/${id}`)
}
</script>

<template>
  <UCard class="h-full overflow-hidden">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-heroicons-rectangle-stack"
          class="text-gray-400"
        />
        <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{{ t('nav.projects', 'Projects') }}</span>
        <UBadge
          v-if="visibleProjects.length"
          :label="String(visibleProjects.length)"
          color="neutral"
          variant="soft"
          size="xs"
          class="ml-auto"
        />
      </div>
    </template>

    <div
      v-if="pending"
      class="space-y-2"
    >
      <USkeleton
        v-for="i in 3"
        :key="i"
        class="h-10 w-full"
      />
    </div>

    <div
      v-else-if="!displayedProjects.length"
      class="flex flex-col items-center justify-center h-full py-6 text-center"
    >
      <UIcon
        name="i-heroicons-folder-open"
        class="text-3xl text-gray-300 dark:text-gray-600 mb-2"
      />
      <p class="text-sm text-gray-400">
        {{ t('projects.none', 'No project') }}
      </p>
    </div>

    <div
      v-else
      class="overflow-y-auto"
      :class="size === 'wide' ? 'grid grid-cols-2 gap-2' : 'space-y-2'"
    >
      <button
        v-for="project in displayedProjects"
        :key="project.id"
        class="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
        :class="{ 'cursor-default': editing }"
        @click="navigate(project.id)"
      >
        <div
          class="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
          :class="`bg-${project.color || 'primary'}-100 dark:bg-${project.color || 'primary'}-900/30`"
        >
          <UIcon
            name="i-heroicons-folder"
            class="text-sm"
            :class="`text-${project.color || 'primary'}-600`"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ project.name }}
          </p>
          <p class="text-xs text-gray-400">
            {{ project.key_count ?? 0 }} {{ t('translations.keys_count', 'keys') }} · {{ project.language_count ?? 0 }} {{ t('translations.langs_count', 'languages') }}
          </p>
        </div>
      </button>
    </div>
  </UCard>
</template>

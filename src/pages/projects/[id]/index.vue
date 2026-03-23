<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('dashboard.title', 'Dashboard') }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
          {{ currentProject?.name }} · {{ currentProject?.root_path }}
        </p>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard
        v-for="stat in topStats"
        :key="stat.label"
      >
        <div class="flex items-center gap-3">
          <div
            class="p-2 rounded-lg"
            :class="stat.bg"
          >
            <UIcon
              :name="stat.icon"
              class="text-xl"
              :class="stat.color"
            />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ stat.label }}
            </p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              <span v-if="pending">—</span>
              <span v-else>{{ stat.value }}</span>
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Coverage -->
      <UCard class="lg:col-span-2">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-gray-900 dark:text-white">
              {{ t('dashboard.coverage_by_language', 'Coverage by language') }}
            </h2>
            <UButton
              :to="`/projects/${projectId}/translations`"
              variant="ghost"
              size="xs"
              trailing-icon="i-heroicons-arrow-right"
              color="neutral"
            >
              {{ t('dashboard.see_all', 'See all') }}
            </UButton>
          </div>
        </template>
        <div
          v-if="pending"
          class="space-y-4"
        >
          <USkeleton
            v-for="i in 3"
            :key="i"
            class="h-14"
          />
        </div>
        <div
          v-else-if="!stats?.languages?.length"
          class="text-center py-10"
        >
          <UIcon
            name="i-heroicons-flag"
            class="text-4xl text-gray-300 mb-2"
          />
          <p class="text-gray-400 text-sm">
            {{ t('languages.none', 'No language configured') }}
          </p>
          <UButton
            :to="`/projects/${projectId}/languages`"
            size="sm"
            class="mt-3"
          >
            {{ t('languages.add', 'Add a language') }}
          </UButton>
        </div>
        <div
          v-else
          class="space-y-4"
        >
          <div
            v-for="lang in stats.languages"
            :key="lang.code"
          >
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2">
                <span class="font-medium text-sm text-gray-800 dark:text-gray-200">{{ findLanguage(lang.code)?.nativeName || lang.name }}</span>
                <UBadge
                  size="xs"
                  variant="outline"
                  color="neutral"
                >
                  {{ lang.code }}
                </UBadge>
                <UBadge
                  v-if="lang.is_default"
                  size="xs"
                  color="primary"
                >
                  {{ t('languages.default_badge', 'Default') }}
                </UBadge>
              </div>
              <span
                class="text-sm font-semibold"
                :class="lang.coverage >= 80 ? 'text-green-600' : lang.coverage >= 50 ? 'text-yellow-600' : 'text-red-500'"
              >
                {{ lang.coverage }}%
              </span>
            </div>
            <div class="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
              <div
                class="bg-green-500 transition-all duration-500"
                :style="{ width: `${pct(lang.approved, lang.total)}%` }"
              />
              <div
                class="bg-blue-400 transition-all duration-500"
                :style="{ width: `${pct(lang.reviewed, lang.total)}%` }"
              />
              <div
                class="bg-yellow-400 transition-all duration-500"
                :style="{ width: `${pct(lang.draft, lang.total)}%` }"
              />
            </div>
            <div class="flex gap-4 mt-1 text-xs text-gray-400">
              <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />{{ t('status.approved', 'Approved') }} ({{ lang.approved }})</span>
              <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />{{ t('status.reviewed', 'Reviewed') }} ({{ lang.reviewed }})</span>
              <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" />{{ t('status.draft', 'Draft') }} ({{ lang.draft }})</span>
              <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 inline-block" />{{ t('status.missing', 'Missing') }} ({{ lang.missing }})</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Activity -->
      <UCard>
        <template #header>
          <h2 class="font-semibold text-gray-900 dark:text-white">
            {{ t('dashboard.recent_activity', 'Recent activity') }}
          </h2>
        </template>
        <div
          v-if="pending"
          class="space-y-3"
        >
          <USkeleton
            v-for="i in 5"
            :key="i"
            class="h-10"
          />
        </div>
        <div
          v-else-if="!stats?.recentActivity?.length"
          class="text-center py-8"
        >
          <UIcon
            name="i-heroicons-clock"
            class="text-4xl text-gray-300 mb-2"
          />
          <p class="text-gray-400 text-sm">
            {{ t('dashboard.no_activity', 'No recent activity') }}
          </p>
        </div>
        <div
          v-else
          class="space-y-1 overflow-y-auto max-h-72"
        >
          <div
            v-for="activity in stats.recentActivity"
            :key="activity.id"
            class="flex gap-2 items-start p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <UIcon
              :name="activity.changed_by === 'google-translate' ? 'i-heroicons-sparkles' : activity.changed_by === 'sync' ? 'i-heroicons-arrow-path' : 'i-heroicons-pencil'"
              class="text-sm mt-0.5 shrink-0"
              :class="activity.changed_by === 'google-translate' ? 'text-yellow-500' : activity.changed_by === 'sync' ? 'text-blue-500' : 'text-gray-400'"
            />
            <div class="min-w-0 flex-1">
              <p class="text-xs font-mono font-medium text-gray-700 dark:text-gray-300 truncate">
                {{ activity.key }}
              </p>
              <p class="text-xs text-gray-400">
                {{ activity.language_code }} · {{ formatRelative(activity.changed_at) }}
              </p>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Code snippet card (shown when advanced features are enabled) -->
    <UCard v-if="currentProject && (currentProject.enable_number_formats || currentProject.enable_datetime_formats || currentProject.enable_modifiers)">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-heroicons-code-bracket-square"
              class="text-purple-500"
            />
            <h2 class="font-semibold text-gray-900 dark:text-white">
              {{ t('dashboard.generated_config', 'Generated vue-i18n configuration') }}
            </h2>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-heroicons-clipboard"
            @click="copySnippet"
          >
            {{ t('dashboard.copy', 'Copy') }}
          </UButton>
        </div>
      </template>
      <div
        v-if="snippetPending"
        class="space-y-2"
      >
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-3/4" />
        <USkeleton class="h-4 w-5/6" />
      </div>
      <div v-else-if="snippetData?.snippet">
        <pre class="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-auto max-h-64">{{ snippetData.snippet }}</pre>
      </div>
      <div
        v-else
        class="text-sm text-gray-400 italic"
      >
        {{ t('dashboard.no_config_generated', 'No configuration generated for this project.') }}
      </div>
    </UCard>

    <!-- Quick actions -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <UButton
        block
        variant="outline"
        color="neutral"
        icon="i-heroicons-plus-circle"
        :to="`/projects/${projectId}/translations`"
      >
        {{ t('dashboard.new_key', 'New key') }}
      </UButton>
      <UButton
        block
        variant="outline"
        color="neutral"
        icon="i-heroicons-flag"
        :to="`/projects/${projectId}/languages`"
      >
        {{ t('nav.languages', 'Languages') }}
      </UButton>
      <UButton
        block
        variant="outline"
        color="neutral"
        icon="i-heroicons-exclamation-triangle"
        :to="`/projects/${projectId}/translations?status=unused`"
      >
        {{ t('nav.unused', 'Unused') }}
        <UBadge
          v-if="stats?.unusedKeys"
          size="xs"
          color="warning"
          class="ml-1"
        >
          {{ stats.unusedKeys }}
        </UBadge>
      </UButton>
      <UButton
        block
        variant="outline"
        color="neutral"
        icon="i-heroicons-rectangle-stack"
        to="/projects"
      >
        {{ t('nav.projects', 'Projects') }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const projectId = computed(() => route.params.id)
const { currentProject } = useProject()
const { findLanguage } = useLanguages()
const { stats, pending } = useStats()
const toast = useToast()
const { t } = useT()

const { data: snippetData, pending: snippetPending } = useFetch<any>('/api/formats/snippet', {
  query: computed(() => ({ project_id: projectId.value })),
  default: () => null,
})

async function copySnippet() {
  if (!snippetData.value?.snippet) return
  await navigator.clipboard.writeText(snippetData.value.snippet)
  toast.add({ title: t('common.copied', 'Copied!'), color: 'success' })
}

const topStats = computed(() => {
  const s = stats.value as any
  if (!s) return []
  const totalT = (s.languages as any[]).reduce((sum: number, l: any) => sum + l.translated, 0)
  const totalP = (s.languages as any[]).reduce((sum: number, l: any) => sum + l.total, 0)
  const cov = totalP > 0 ? Math.round((totalT / totalP) * 100) : 0
  return [
    { label: t('dashboard.total_keys', 'total keys'), value: s.totalKeys, icon: 'i-heroicons-key', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('dashboard.languages', 'Languages'), value: s.languages.length, icon: 'i-heroicons-flag', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: t('dashboard.coverage', 'coverage'), value: `${cov}%`, icon: 'i-heroicons-check-badge', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: t('dashboard.unused_keys', 'unused keys'), value: s.unusedKeys, icon: 'i-heroicons-exclamation-triangle', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ]
})

function pct(v: number, t: number) { return t > 0 ? Math.min(100, Math.round((v / t) * 100)) : 0 }

function formatRelative(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return t('common.just_now', 'just now')
  if (min < 60) return `${t('common.ago', 'ago')} ${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${t('common.ago', 'ago')} ${h}h`
  return `${t('common.ago', 'ago')} ${Math.floor(h / 24)}d`
}
</script>

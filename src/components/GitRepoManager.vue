<template>
  <div class="space-y-2">
    <div class="grid grid-cols-2 gap-2">
      <UFormField :label="t('projects.git_repo_url_label', 'Repository URL')" class="col-span-2">
        <UInput v-model="local.url" class="w-full" placeholder="https://github.com/org/repo.git" @input="emitCurrent" />
      </UFormField>
      <UFormField :label="t('projects.git_repo_branch_label', 'Branch')" class="col-span-2">
        <UInput v-model="local.branch" class="w-full" placeholder="main" @input="emitCurrent" />
      </UFormField>
    </div>
    <UFormField :label="t('projects.git_token_label', 'Access token (optional)')">
      <UInput v-model="local.token" type="password" class="w-full" :placeholder="t('projects.git_token_placeholder', 'ghp_...')" @input="emitCurrent" />
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import type { IGitRepo } from '~/interfaces/project.interface'

const { t } = useT()

const props = defineProps<{
  modelValue: IGitRepo | null | undefined
}>()

const emit = defineEmits<{
  'update:modelValue': [value: IGitRepo | null]
}>()

const local = reactive<IGitRepo>({ url: '', branch: '', token: '' })

watch(() => props.modelValue, (val) => {
  local.url = val?.url ?? ''
  local.branch = val?.branch ?? ''
  local.token = val?.token ?? ''
}, { immediate: true })

function emitCurrent() {
  emit('update:modelValue', local.url.trim() ? { ...local } : null)
}
</script>

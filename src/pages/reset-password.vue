<template>
  <span
    v-if="isMounted"
    data-cy="reset-password-mounted"
    class="sr-only"
  />
  <UCard class="w-full max-w-md">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shrink-0">
          <UIcon
            name="i-heroicons-language"
            class="text-white text-lg"
          />
        </div>
        <div>
          <h1 class="text-lg font-bold text-gray-900 dark:text-white">
            i18n Dashboard
          </h1>
          <p class="text-xs text-gray-400">
            {{ t('reset_password.title', 'New password') }}
          </p>
        </div>
      </div>
    </template>

    <div
      v-if="!token"
      class="space-y-4"
    >
      <p class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
        <UIcon
          name="i-heroicons-exclamation-circle"
          class="inline mr-1"
        />
        {{ t('reset_password.invalid_link', 'Invalid link. Please make a new reset request.') }}
      </p>
      <NuxtLink
        to="/forgot-password"
        class="block text-center text-sm text-primary-600 hover:underline mt-2"
      >
        {{ t('reset_password.request_new_link', 'Request a new link') }}
      </NuxtLink>
    </div>

    <div
      v-else-if="success"
      class="space-y-4"
    >
      <p class="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
        <UIcon
          name="i-heroicons-check-circle"
          class="inline mr-1"
        />
        {{ t('reset_password.success', 'Password changed successfully.') }}
      </p>
      <NuxtLink
        to="/login"
        class="block text-center text-sm text-primary-600 hover:underline mt-2"
      >
        {{ t('reset_password.login', 'Sign in') }}
      </NuxtLink>
    </div>

    <form
      v-else
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <UFormField
        :label="t('reset_password.label_new_password', 'New password')"
        :hint="t('reset_password.hint_min_length', 'Minimum 8 characters')"
        required
      >
        <UInput
          v-model="form.password"
          type="password"
          placeholder="••••••••"
          class="w-full"
          autocomplete="new-password"
          autofocus
        />
      </UFormField>

      <UFormField
        :label="t('reset_password.label_confirm', 'Confirm password')"
        required
      >
        <UInput
          v-model="form.confirm"
          type="password"
          placeholder="••••••••"
          class="w-full"
          autocomplete="new-password"
        />
      </UFormField>

      <p
        v-if="error"
        class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
      >
        <UIcon
          name="i-heroicons-exclamation-circle"
          class="inline mr-1"
        />
        {{ error }}
      </p>

      <UButton
        type="submit"
        block
        :loading="loading"
        class="mt-2"
      >
        {{ t('reset_password.submit', 'Change password') }}
      </UButton>
    </form>
  </UCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useT()
const route = useRoute()
const token = computed(() => route.query.token as string | undefined)

const form = ref({ password: '', confirm: '' })
const loading = ref(false)
const error = ref('')
const success = ref(false)

const isMounted = ref(false)
onMounted(() => { isMounted.value = true })

async function handleSubmit() {
  if (!form.value.password || !form.value.confirm) return
  if (form.value.password !== form.value.confirm) {
    error.value = t('reset_password.error_mismatch', 'Passwords do not match')
    return
  }
  if (form.value.password.length < 8) {
    error.value = t('reset_password.error_too_short', 'Password must be at least 8 characters')
    return
  }
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        password: form.value.password,
        confirm_password: form.value.confirm,
      },
    })
    success.value = true
  } catch (e: any) {
    error.value = e.data?.message || t('reset_password.error_fallback', 'An error occurred')
  } finally {
    loading.value = false
  }
}
</script>

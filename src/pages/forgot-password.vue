<template>
  <span
    v-if="isMounted"
    data-cy="forgot-password-mounted"
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
            {{ t('forgot_password.title', 'Forgot password') }}
          </p>
        </div>
      </div>
    </template>

    <div
      v-if="sent"
      class="space-y-4"
    >
      <p class="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
        <UIcon
          name="i-heroicons-check-circle"
          class="inline mr-1"
        />
        {{ t('forgot_password.success', 'If this email is associated with an account, a reset link has been sent to you.') }}
      </p>
      <NuxtLink
        to="/login"
        class="block text-center text-sm text-primary-600 hover:underline mt-2"
      >
        {{ t('forgot_password.back_to_login', 'Back to login') }}
      </NuxtLink>
    </div>

    <form
      v-else
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <p class="text-sm text-gray-500">
        {{ t('forgot_password.description', "Enter your email address and we'll send you a link to reset your password.") }}
      </p>

      <UFormField
        label="Email"
        required
      >
        <UInput
          v-model="email"
          type="email"
          placeholder="admin@example.com"
          class="w-full"
          autocomplete="email"
          autofocus
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
        {{ t('forgot_password.submit', 'Send link') }}
      </UButton>

      <NuxtLink
        to="/login"
        class="block text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-2"
      >
        {{ t('forgot_password.back_to_login', 'Back to login') }}
      </NuxtLink>
    </form>
  </UCard>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useT()

const email = ref('')
const loading = ref(false)
const error = ref('')
const sent = ref(false)

const isMounted = ref(false)
onMounted(() => { isMounted.value = true })

async function handleSubmit() {
  if (!email.value) return
  loading.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value },
    })
    sent.value = true
  } catch (e: any) {
    error.value = e.data?.message || t('forgot_password.error_fallback', 'An error occurred')
  } finally {
    loading.value = false
  }
}
</script>

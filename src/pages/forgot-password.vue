<template>
  <span
    v-if="isMounted"
    data-cy="forgot-password-mounted"
    class="sr-only"
  />
  <u-card class="w-full max-w-md">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shrink-0">
          <u-icon
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
        <u-icon
          name="i-heroicons-check-circle"
          class="inline mr-1"
        />
        {{ t('forgot_password.success', 'If this email is associated with an account, a reset link has been sent to you.') }}
      </p>
      <nuxt-link
        to="/login"
        class="block text-center text-sm text-primary-600 hover:underline mt-2"
      >
        {{ t('forgot_password.back_to_login', 'Back to login') }}
      </nuxt-link>
    </div>

    <form
      v-else
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <p class="text-sm text-gray-500">
        {{ t('forgot_password.description', "Enter your email address and we'll send you a link to reset your password.") }}
      </p>

      <u-form-field
        label="Email"
        required
      >
        <u-input
          v-model="email"
          type="email"
          placeholder="admin@example.com"
          class="w-full"
          autocomplete="email"
          autofocus
        />
      </u-form-field>

      <p
        v-if="error"
        class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
      >
        <u-icon
          name="i-heroicons-exclamation-circle"
          class="inline mr-1"
        />
        {{ error }}
      </p>

      <u-button
        type="submit"
        block
        :loading="loading"
        class="mt-2"
      >
        {{ t('forgot_password.submit', 'Send link') }}
      </u-button>

      <nuxt-link
        to="/login"
        class="block text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-2"
      >
        {{ t('forgot_password.back_to_login', 'Back to login') }}
      </nuxt-link>
    </form>
  </u-card>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { t } = useT()
const { forgotPassword } = useAuth()

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
    await forgotPassword(email.value)
    sent.value = true
  } catch (e: any) {
    error.value = e.message || t('forgot_password.error_fallback', 'An error occurred')
  } finally {
    loading.value = false
  }
}
</script>

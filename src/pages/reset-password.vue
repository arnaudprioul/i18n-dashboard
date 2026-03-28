<template>
  <span
      v-if="isMounted"
      class="sr-only"
      data-cy="reset-password-mounted"
  />
  <u-card class="w-full max-w-md">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shrink-0">
          <u-icon
              class="text-white text-lg"
              name="i-heroicons-language"
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
        <u-icon
            class="inline mr-1"
            name="i-heroicons-exclamation-circle"
        />
        {{ t('reset_password.invalid_link', 'Invalid link. Please make a new reset request.') }}
      </p>
      <nuxt-link
          class="block text-center text-sm text-primary-600 hover:underline mt-2"
          to="/forgot-password"
      >
        {{ t('reset_password.request_new_link', 'Request a new link') }}
      </nuxt-link>
    </div>

    <div
        v-else-if="success"
        class="space-y-4"
    >
      <p class="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
        <u-icon
            class="inline mr-1"
            name="i-heroicons-check-circle"
        />
        {{ t('reset_password.success', 'Password changed successfully.') }}
      </p>
      <nuxt-link
          class="block text-center text-sm text-primary-600 hover:underline mt-2"
          to="/login"
      >
        {{ t('reset_password.login', 'Sign in') }}
      </nuxt-link>
    </div>

    <form
        v-else
        class="space-y-4"
        @submit.prevent="handleSubmit"
    >
      <u-form-field
          :hint="t('reset_password.hint_min_length', 'Minimum 8 characters')"
          :label="t('reset_password.label_new_password', 'New password')"
          required
      >
        <u-input
            v-model="form.password"
            autocomplete="new-password"
            autofocus
            class="w-full"
            placeholder="••••••••"
            type="password"
        />
      </u-form-field>

      <u-form-field
          :label="t('reset_password.label_confirm', 'Confirm password')"
          required
      >
        <u-input
            v-model="form.confirm"
            autocomplete="new-password"
            class="w-full"
            placeholder="••••••••"
            type="password"
        />
      </u-form-field>

      <p
          v-if="error"
          class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
      >
        <u-icon
            class="inline mr-1"
            name="i-heroicons-exclamation-circle"
        />
        {{ error }}
      </p>

      <u-button
          :loading="loading"
          block
          class="mt-2"
          type="submit"
      >
        {{ t('reset_password.submit', 'Change password') }}
      </u-button>
    </form>
  </u-card>
</template>

<script lang="ts" setup>
  definePageMeta({ layout: 'auth' })

  const { t } = useT()
  const { resetPassword } = useAuth()
  const route = useRoute()
  const token = computed(() => route.query.token as string | undefined)

  const form = ref({ password: '', confirm: '' })
  const loading = ref(false)
  const error = ref('')
  const success = ref(false)

  const isMounted = ref(false)
  onMounted(() => {
    isMounted.value = true
  })

  async function handleSubmit () {
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
      await resetPassword(token.value!, form.value.password, form.value.confirm)
      success.value = true
    } catch (e: any) {
      error.value = e.message || t('reset_password.error_fallback', 'An error occurred')
    } finally {
      loading.value = false
    }
  }
</script>

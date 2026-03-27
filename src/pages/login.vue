<template>
  <span
      v-if="isMounted"
      class="sr-only"
      data-cy="login-mounted"
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
          <h1
              class="text-lg font-bold text-gray-900 dark:text-white"
              data-cy="login-title"
          >
            i18n Dashboard
          </h1>
          <p class="text-xs text-gray-400">
            {{ t('login.title', 'Log in') }}
          </p>
        </div>
      </div>
    </template>

    <form
        class="space-y-4"
        @submit.prevent="handleLogin"
    >
      <u-form-field
          :label="t('login.email', 'Email')"
          required
      >
        <u-input
            v-model="form.email"
            autocomplete="email"
            autofocus
            class="w-full"
            data-cy="login-email"
            placeholder="admin@example.com"
            type="email"
        />
      </u-form-field>

      <u-form-field
          :label="t('login.password', 'Password')"
          required
      >
        <u-input
            v-model="form.password"
            autocomplete="current-password"
            class="w-full"
            data-cy="login-password"
            placeholder="••••••••"
            type="password"
        />
      </u-form-field>

      <p
          v-if="error"
          class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2"
          data-cy="login-error"
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
          data-cy="login-submit"
          type="submit"
      >
        {{ t('login.submit', 'Sign in') }}
      </u-button>

      <nuxt-link
          class="block text-center text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-2"
          data-cy="forgot-password-link"
          to="/forgot-password"
      >
        {{ t('login.forgot_password', 'Forgot password?') }}
      </nuxt-link>
    </form>
  </u-card>
</template>

<script lang="ts" setup>
  definePageMeta({ layout: 'auth' })

  const router = useRouter()
  const { login } = useAuth()
  const { t } = useT()

  const form = ref({ email: '', password: '' })
  const loading = ref(false)
  const error = ref('')

  // Hydration sentinel — only rendered after onMounted() fires (Vue fully hydrated).
  // Cypress tests wait for [data-cy="login-mounted"] before interacting with the form.
  const isMounted = ref(false)
  onMounted(() => {
    isMounted.value = true
  })

  async function handleLogin () {
    if (!form.value.email || !form.value.password) return
    loading.value = true
    error.value = ''
    try {
      await login(form.value.email, form.value.password)
      await clearNuxtData('auth-status')
      await router.push('/')
    } catch (e: any) {
      error.value = e.data?.message || t('login.error', 'Invalid credentials')
    } finally {
      loading.value = false
    }
  }
</script>

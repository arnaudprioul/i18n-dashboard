<template>
  <span
    v-if="isMounted"
    data-cy="login-mounted"
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
          <h1
            data-cy="login-title"
            class="text-lg font-bold text-gray-900 dark:text-white"
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
      <UFormField
        :label="t('login.email', 'Email')"
        required
      >
        <UInput
          v-model="form.email"
          type="email"
          placeholder="admin@example.com"
          class="w-full"
          autocomplete="email"
          autofocus
          data-cy="login-email"
        />
      </UFormField>

      <UFormField
        :label="t('login.password', 'Password')"
        required
      >
        <UInput
          v-model="form.password"
          type="password"
          placeholder="••••••••"
          class="w-full"
          autocomplete="current-password"
          data-cy="login-password"
        />
      </UFormField>

      <p
        v-if="error"
        data-cy="login-error"
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
        data-cy="login-submit"
      >
        {{ t('login.submit', 'Sign in') }}
      </UButton>
    </form>
  </UCard>
</template>

<script setup lang="ts">
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
onMounted(() => { isMounted.value = true })

async function handleLogin() {
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

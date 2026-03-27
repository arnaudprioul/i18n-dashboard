<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('security.title', 'Security') }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        {{ t('security.description', 'Password policy and security settings') }}
      </p>
    </div>

    <div class="max-w-2xl space-y-6">
      <!-- Password policy -->
      <u-card>
        <template #header>
          <div class="flex items-center gap-2">
            <u-icon
                class="text-primary-500"
                name="i-heroicons-lock-closed"
            />
            <h2 class="font-semibold text-gray-900 dark:text-white">
              {{ t('security.password_policy_title', 'Password policy') }}
            </h2>
          </div>
        </template>

        <div
            v-if="pending"
            class="space-y-4"
        >
          <u-skeleton
              v-for="i in 4"
              :key="i"
              class="h-8 w-full rounded-lg"
          />
        </div>

        <div
            v-else
            class="space-y-5"
        >
          <u-form-field
              :hint="t('security.min_length_hint', 'Minimum number of characters required')"
              :label="t('security.min_length_label', 'Minimum length')"
          >
            <u-input
                v-model.number="form.password_min_length"
                :max="128"
                :min="4"
                class="w-32"
                type="number"
            />
          </u-form-field>

          <div class="space-y-3">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('security.complexity_title', 'Required complexity') }}
            </p>
            <UCheckbox
                v-model="form.password_require_uppercase"
                :label="t('security.require_uppercase', 'At least one uppercase letter (A–Z)')"
            />
            <UCheckbox
                v-model="form.password_require_number"
                :label="t('security.require_number', 'At least one digit (0–9)')"
            />
            <UCheckbox
                v-model="form.password_require_special"
                :label="t('security.require_special', 'At least one special character (!@#$...)')"
            />
          </div>

          <!-- Preview -->
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p class="font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ t('security.current_rules', 'Current rules:') }}
            </p>
            <p>• {{ t('security.rule_min_length_pre', 'Minimum') }} {{ form.password_min_length }} {{
                form.password_min_length > 1 ? t('security.rule_characters', 'characters') : t('security.rule_character', 'character')
              }}</p>
            <p v-if="form.password_require_uppercase">
              • {{ t('security.rule_uppercase', 'At least one uppercase letter') }}
            </p>
            <p v-if="form.password_require_number">
              • {{ t('security.rule_number', 'At least one digit') }}
            </p>
            <p v-if="form.password_require_special">
              • {{ t('security.rule_special', 'At least one special character') }}
            </p>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <u-button
                :loading="saving"
                icon="i-heroicons-check"
                @click="save"
            >
              {{ t('security.save', 'Save') }}
            </u-button>
          </div>
        </template>
      </u-card>

      <!-- Infra settings (read-only) -->
      <u-card>
        <template #header>
          <div class="flex items-center gap-2">
            <u-icon
                class="text-gray-400"
                name="i-heroicons-server"
            />
            <h2 class="font-semibold text-gray-900 dark:text-white">
              {{ t('security.infra_title', 'Infrastructure settings') }}
            </h2>
          </div>
        </template>

        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {{
            t('security.infra_description', 'These values are configured via environment variables and require a restart.')
          }}
        </p>

        <div class="space-y-3 text-sm">
          <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-600 dark:text-gray-400">{{ t('security.bcrypt_rounds', 'Bcrypt rounds') }}</span>
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">BCRYPT_ROUNDS</code>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-600 dark:text-gray-400">{{
                t('security.session_duration', 'Session duration')
              }}</span>
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">SESSION_TTL_MINUTES</code>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
            <span class="text-gray-600 dark:text-gray-400">{{
                t('security.refresh_token_duration', 'Refresh token duration')
              }}</span>
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">REFRESH_TOKEN_TTL_DAYS</code>
          </div>
          <div class="flex justify-between items-center py-2">
            <span class="text-gray-600 dark:text-gray-400">{{
                t('security.reset_link_expiry', 'Reset link expiry')
              }}</span>
            <code class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs">RESET_TOKEN_TTL_HOURS</code>
          </div>
        </div>
      </u-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
  const { t } = useT()
  const toast = useToast()

  const pending = ref(true)
  const saving = ref(false)

  const form = ref({
    password_min_length: 8,
    password_require_uppercase: false,
    password_require_number: false,
    password_require_special: false,
  })

  onMounted(async () => {
    try {
      const policy = await $fetch<{
        minLength: number
        requireUppercase: boolean
        requireNumber: boolean
        requireSpecial: boolean
      }>('/api/settings/password-policy')
      form.value = {
        password_min_length: policy.minLength,
        password_require_uppercase: policy.requireUppercase,
        password_require_number: policy.requireNumber,
        password_require_special: policy.requireSpecial,
      }
    } finally {
      pending.value = false
    }
  })

  async function save () {
    saving.value = true
    try {
      await $fetch('/api/settings', {
        method: 'POST',
        body: {
          password_min_length: String(form.value.password_min_length),
          password_require_uppercase: String(form.value.password_require_uppercase),
          password_require_number: String(form.value.password_require_number),
          password_require_special: String(form.value.password_require_special),
        },
      })
      toast.add({ title: t('security.saved', 'Settings saved'), color: 'success' })
    } catch (e: any) {
      toast.add({ title: 'Erreur', description: e.data?.message || e.message, color: 'error' })
    } finally {
      saving.value = false
    }
  }
</script>

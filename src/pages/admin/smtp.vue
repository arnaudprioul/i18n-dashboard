<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('smtp.title', 'SMTP configuration') }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm">
        {{ t('smtp.description', 'Configure email sending for invitations and password resets') }}
      </p>
    </div>

    <div class="max-w-2xl space-y-6">
      <!-- Status banner when not configured -->
      <u-alert
        v-if="!pending && !form.host"
        :title="t('smtp.not_configured', 'SMTP not configured — emails will not be sent')"
        color="warning"
        icon="i-heroicons-exclamation-triangle"
      />

      <!-- SMTP form -->
      <u-card>
        <template #header>
          <div class="flex items-center gap-2">
            <u-icon
              class="text-primary-500"
              name="i-heroicons-envelope"
            />
            <h2 class="font-semibold text-gray-900 dark:text-white">
              {{ t('smtp.title', 'SMTP configuration') }}
            </h2>
          </div>
        </template>

        <div
          v-if="pending"
          class="space-y-4"
        >
          <u-skeleton
            v-for="i in 6"
            :key="i"
            class="h-10"
          />
        </div>

        <div
          v-else
          class="space-y-4"
        >
          <!-- Provider presets -->
          <u-form-field :label="t('smtp.provider_label', 'Quick setup')">
            <div class="flex flex-wrap gap-2">
              <u-button
                v-for="p in providers"
                :key="p.id"
                :color="selectedProvider === p.id ? 'primary' : 'neutral'"
                :variant="selectedProvider === p.id ? 'solid' : 'outline'"
                size="xs"
                @click="applyPreset(p)"
              >
                {{ p.label }}
              </u-button>
            </div>
          </u-form-field>

          <!-- Gmail-specific hint -->
          <div
            v-if="selectedProvider === 'gmail'"
            class="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 text-sm"
          >
            <div class="flex gap-2 mb-2">
              <u-icon
                class="text-blue-500 shrink-0 mt-0.5"
                name="i-heroicons-information-circle"
              />
              <p class="font-semibold text-blue-800 dark:text-blue-200">
                {{ t('smtp.gmail_hint_title', 'Gmail requires an App Password') }}
              </p>
            </div>
            <ol class="ml-6 space-y-1 text-blue-700 dark:text-blue-300 list-decimal">
              <li>
                {{ t('smtp.gmail_step1', 'Click this link:') }}
                <a
                  class="underline font-medium"
                  href="https://myaccount.google.com/apppasswords"
                  rel="noopener"
                  target="_blank"
                >myaccount.google.com/apppasswords</a>
              </li>
              <li>
                {{
                  t('smtp.gmail_step2', 'If the page shows "The setting you are looking for is not available" → you must first enable 2-Step Verification on your Google account')
                }}
              </li>
              <li>{{ t('smtp.gmail_step3', 'Type a name (e.g. "i18n-dashboard") and click Create') }}</li>
              <li>{{ t('smtp.gmail_step4', 'Copy the 16-character code shown (e.g. abcd efgh ijkl mnop)') }}</li>
              <li>
                {{
                  t('smtp.gmail_step5', 'Paste it in the Password field below — use your Gmail address as Username')
                }}
              </li>
            </ol>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <u-form-field
              :label="t('smtp.host_label', 'SMTP host')"
              class="col-span-2 sm:col-span-1"
            >
              <u-input
                v-model="form.host"
                class="w-full"
                placeholder="smtp.example.com"
              />
            </u-form-field>
            <u-form-field :label="t('smtp.port_label', 'Port')">
              <u-input
                v-model="form.port"
                class="w-full"
                placeholder="587"
                type="number"
              />
            </u-form-field>
          </div>

          <u-form-field :label="t('smtp.secure_label', 'Secure connection (SSL/TLS on port 465)')">
            <u-switch v-model="form.secure" />
            <template #hint>
              <span class="text-xs text-gray-400">
                {{ t('smtp.secure_hint', 'Keep off for port 587 (STARTTLS). Enable only for port 465.') }}
              </span>
            </template>
          </u-form-field>

          <u-form-field :label="t('smtp.user_label', 'Username')">
            <u-input
              v-model="form.user"
              class="w-full"
              placeholder="user@example.com"
            />
          </u-form-field>

          <u-form-field :label="t('smtp.pass_label', 'Password')">
            <u-input
              v-model="form.pass"
              :placeholder="hasPassword ? '••••••••' : ''"
              class="w-full"
              type="password"
            />
            <template #hint>
              <span
                v-if="hasPassword"
                class="text-xs text-gray-400"
              >
                {{ t('smtp.pass_set_hint', 'Password is set — leave blank to keep current') }}
              </span>
            </template>
          </u-form-field>

          <u-form-field :label="t('smtp.from_label', 'From address')">
            <u-input
              v-model="form.from"
              class="w-full"
              placeholder="noreply@example.com"
            />
          </u-form-field>

          <u-form-field
            :hint="t('smtp.dashboard_url_hint', 'Used for links in emails')"
            :label="t('smtp.dashboard_url_label', 'Dashboard URL')"
          >
            <u-input
              v-model="form.dashboardUrl"
              class="w-full"
              placeholder="http://localhost:3333"
            />
          </u-form-field>

          <div class="flex justify-end gap-3 pt-2">
            <u-button
              :loading="saving"
              @click="save"
            >
              {{ t('common.save', 'Save') }}
            </u-button>
          </div>
        </div>
      </u-card>

      <!-- Test email card -->
      <u-card>
        <template #header>
          <div class="flex items-center gap-2">
            <u-icon
              class="text-gray-400"
              name="i-heroicons-paper-airplane"
            />
            <h2 class="font-semibold text-gray-900 dark:text-white">
              {{ t('smtp.test', 'Test') }}
            </h2>
          </div>
        </template>

        <!-- Test error -->
        <u-alert
          v-if="testError"
          :description="testError"
          :title="t('smtp.test_failed', 'Send failed')"
          class="mb-4"
          color="error"
          icon="i-heroicons-x-circle"
        />

        <div class="flex items-end gap-3">
          <u-form-field
            :label="t('smtp.test_email_label', 'Send test email to')"
            class="flex-1"
          >
            <u-input
              v-model="testEmail"
              class="w-full"
              placeholder="you@example.com"
              type="email"
            />
          </u-form-field>
          <u-button
            :disabled="!form.host || !testEmail"
            :loading="testing"
            icon="i-heroicons-paper-airplane"
            @click="sendTest"
          >
            {{ t('smtp.test', 'Test') }}
          </u-button>
        </div>
      </u-card>

      <!-- JSON config hint -->
      <u-card>
        <template #header>
          <div class="flex items-center gap-2">
            <u-icon
              class="text-gray-400"
              name="i-heroicons-document-text"
            />
            <h2 class="font-semibold text-gray-900 dark:text-white">
              {{ t('smtp.config_file_title', 'Local config file') }}
            </h2>
          </div>
        </template>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {{
            t('smtp.config_file_hint', 'For local deployments, you can configure SMTP in a JSON file at your project root. Values are seeded into the database on first start.')
          }}
        </p>
        <pre class="text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">{{ configFileExample }}</pre>
      </u-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
  const { currentUser } = useAuth()
  const { t } = useT()
  const { loadSmtp, saveSmtp, testSmtp, smtpPending: pending, smtpSaving: saving, smtpTesting: testing, smtpTestError: testError } = useAdmin()

  watch(() => currentUser.value?.is_super_admin, (ok) => {
    if (import.meta.client && ok === false) navigateTo('/')
  }, { immediate: true })

  interface Provider {
    id: string
    label: string
    host: string
    port: string
    secure: boolean
  }

  const providers: Provider[] = [
    { id: 'gmail', label: 'Gmail', host: 'smtp.gmail.com', port: '587', secure: false },
    { id: 'outlook', label: 'Outlook / Microsoft 365', host: 'smtp.office365.com', port: '587', secure: false },
    { id: 'sendgrid', label: 'SendGrid', host: 'smtp.sendgrid.net', port: '587', secure: false },
    { id: 'mailgun', label: 'Mailgun', host: 'smtp.mailgun.org', port: '587', secure: false },
    { id: 'ses', label: 'Amazon SES', host: 'email-smtp.us-east-1.amazonaws.com', port: '587', secure: false },
    { id: 'custom', label: t('smtp.provider_custom', 'Custom'), host: '', port: '587', secure: false },
  ]

  const selectedProvider = ref<string | null>(null)

  const applyPreset = (p: Provider) => {
    selectedProvider.value = p.id
    if (p.id === 'custom') return
    form.value.host = p.host
    form.value.port = p.port
    form.value.secure = p.secure
  }

  const form = ref({
    host: '',
    port: '587',
    secure: false,
    user: '',
    pass: '',
    from: '',
    dashboardUrl: '',
  })
  const hasPassword = ref(false)
  const testEmail = ref(currentUser.value?.email || '')

  const configFileExample = `// i18n-dashboard.config.json
{
  "database": {
    "client": "better-sqlite3",
    "connection": "./i18n-dashboard.db"
  },
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "user": "you@gmail.com",
    "pass": "xxxx xxxx xxxx xxxx",
    "from": "you@gmail.com"
  },
  "app": {
    "url": "http://localhost:3333"
  }
}`

  const load = async () => {
    const data = await loadSmtp()
    if (!data) return
    form.value.host = data.host || ''
    form.value.port = data.port || '587'
    form.value.secure = data.secure === 'true' || data.secure === true
    form.value.user = data.user || ''
    form.value.from = data.from || ''
    form.value.dashboardUrl = data.dashboardUrl || ''
    hasPassword.value = data.hasPassword || false
    if (data.host) {
      const match = providers.find(p => p.host === data.host)
      selectedProvider.value = match?.id || 'custom'
    }
  }

  const save = async () => {
    const ok = await saveSmtp({
      host: form.value.host,
      port: form.value.port,
      secure: form.value.secure,
      user: form.value.user,
      pass: form.value.pass,
      from: form.value.from,
      dashboardUrl: form.value.dashboardUrl,
    })
    if (ok) {
      form.value.pass = ''
      await load()
    }
  }

  const sendTest = async () => {
    await testSmtp(testEmail.value)
  }

  onMounted(load)
</script>

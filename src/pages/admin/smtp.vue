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
      <UAlert
        v-if="!pending && !form.host"
        icon="i-heroicons-exclamation-triangle"
        color="warning"
        :title="t('smtp.not_configured', 'SMTP not configured — emails will not be sent')"
      />

      <!-- SMTP form -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
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
          <USkeleton
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
          <UFormField :label="t('smtp.provider_label', 'Quick setup')">
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="p in providers"
                :key="p.id"
                size="xs"
                :variant="selectedProvider === p.id ? 'solid' : 'outline'"
                :color="selectedProvider === p.id ? 'primary' : 'neutral'"
                @click="applyPreset(p)"
              >
                {{ p.label }}
              </UButton>
            </div>
          </UFormField>

          <!-- Gmail-specific hint -->
          <div
            v-if="selectedProvider === 'gmail'"
            class="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 text-sm"
          >
            <div class="flex gap-2 mb-2">
              <UIcon
                name="i-heroicons-information-circle"
                class="text-blue-500 shrink-0 mt-0.5"
              />
              <p class="font-semibold text-blue-800 dark:text-blue-200">
                {{ t('smtp.gmail_hint_title', 'Gmail requires an App Password') }}
              </p>
            </div>
            <ol class="ml-6 space-y-1 text-blue-700 dark:text-blue-300 list-decimal">
              <li>
                {{ t('smtp.gmail_step1', 'Click this link:') }}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener"
                  class="underline font-medium"
                >myaccount.google.com/apppasswords</a>
              </li>
              <li>{{ t('smtp.gmail_step2', 'If the page shows "The setting you are looking for is not available" → you must first enable 2-Step Verification on your Google account') }}</li>
              <li>{{ t('smtp.gmail_step3', 'Type a name (e.g. "i18n-dashboard") and click Create') }}</li>
              <li>{{ t('smtp.gmail_step4', 'Copy the 16-character code shown (e.g. abcd efgh ijkl mnop)') }}</li>
              <li>{{ t('smtp.gmail_step5', 'Paste it in the Password field below — use your Gmail address as Username') }}</li>
            </ol>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField
              :label="t('smtp.host_label', 'SMTP host')"
              class="col-span-2 sm:col-span-1"
            >
              <UInput
                v-model="form.host"
                placeholder="smtp.example.com"
                class="w-full"
              />
            </UFormField>
            <UFormField :label="t('smtp.port_label', 'Port')">
              <UInput
                v-model="form.port"
                type="number"
                placeholder="587"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField :label="t('smtp.secure_label', 'Secure connection (SSL/TLS on port 465)')">
            <UToggle v-model="form.secure" />
            <template #hint>
              <span class="text-xs text-gray-400">
                {{ t('smtp.secure_hint', 'Keep off for port 587 (STARTTLS). Enable only for port 465.') }}
              </span>
            </template>
          </UFormField>

          <UFormField :label="t('smtp.user_label', 'Username')">
            <UInput
              v-model="form.user"
              placeholder="user@example.com"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="t('smtp.pass_label', 'Password')">
            <UInput
              v-model="form.pass"
              type="password"
              :placeholder="hasPassword ? '••••••••' : ''"
              class="w-full"
            />
            <template #hint>
              <span
                v-if="hasPassword"
                class="text-xs text-gray-400"
              >
                {{ t('smtp.pass_set_hint', 'Password is set — leave blank to keep current') }}
              </span>
            </template>
          </UFormField>

          <UFormField :label="t('smtp.from_label', 'From address')">
            <UInput
              v-model="form.from"
              placeholder="noreply@example.com"
              class="w-full"
            />
          </UFormField>

          <UFormField
            :label="t('smtp.dashboard_url_label', 'Dashboard URL')"
            :hint="t('smtp.dashboard_url_hint', 'Used for links in emails')"
          >
            <UInput
              v-model="form.dashboardUrl"
              placeholder="http://localhost:3333"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-3 pt-2">
            <UButton
              :loading="saving"
              @click="save"
            >
              {{ t('common.save', 'Save') }}
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Test email card -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              class="text-gray-400"
              name="i-heroicons-paper-airplane"
            />
            <h2 class="font-semibold text-gray-900 dark:text-white">
              {{ t('smtp.test', 'Test') }}
            </h2>
          </div>
        </template>

        <!-- Test error -->
        <UAlert
          v-if="testError"
          icon="i-heroicons-x-circle"
          color="error"
          :title="t('smtp.test_failed', 'Send failed')"
          :description="testError"
          class="mb-4"
        />

        <div class="flex items-end gap-3">
          <UFormField
            :label="t('smtp.test_email_label', 'Send test email to')"
            class="flex-1"
          >
            <UInput
              v-model="testEmail"
              type="email"
              placeholder="you@example.com"
              class="w-full"
            />
          </UFormField>
          <UButton
            icon="i-heroicons-paper-airplane"
            :loading="testing"
            :disabled="!form.host || !testEmail"
            @click="sendTest"
          >
            {{ t('smtp.test', 'Test') }}
          </UButton>
        </div>
      </UCard>

      <!-- JSON config hint -->
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              class="text-gray-400"
              name="i-heroicons-document-text"
            />
            <h2 class="font-semibold text-gray-900 dark:text-white">
              {{ t('smtp.config_file_title', 'Local config file') }}
            </h2>
          </div>
        </template>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
          {{ t('smtp.config_file_hint', 'For local deployments, you can configure SMTP in a JSON file at your project root. Values are seeded into the database on first start.') }}
        </p>
        <pre class="text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">{{ configFileExample }}</pre>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const { currentUser } = useAuth()
const { t } = useT()
const toast = useToast()

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

function applyPreset(p: Provider) {
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
const pending = ref(true)
const saving = ref(false)
const testing = ref(false)
const testEmail = ref(currentUser.value?.email || '')
const testError = ref('')

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

async function load() {
  pending.value = true
  try {
    const data = await $fetch<any>('/api/admin/smtp')
    form.value.host = data.host || ''
    form.value.port = data.port || '587'
    form.value.secure = data.secure === 'true' || data.secure === true
    form.value.user = data.user || ''
    form.value.from = data.from || ''
    form.value.dashboardUrl = data.dashboardUrl || ''
    hasPassword.value = data.hasPassword || false
    // Detect provider from host
    if (data.host) {
      const match = providers.find(p => p.host === data.host)
      selectedProvider.value = match?.id || 'custom'
    }
  }
  catch {}
  finally { pending.value = false }
}

async function save() {
  saving.value = true
  try {
    await $fetch('/api/admin/smtp', {
      method: 'POST',
      body: {
        host: form.value.host,
        port: form.value.port,
        secure: form.value.secure,
        user: form.value.user,
        pass: form.value.pass,
        from: form.value.from,
        dashboardUrl: form.value.dashboardUrl,
      },
    })
    toast.add({ title: t('smtp.saved', 'SMTP configuration saved'), color: 'success' })
    form.value.pass = ''
    await load()
  }
  catch (e: any) {
    toast.add({ title: t('common.error', 'Error'), description: e?.data?.message || e?.message, color: 'error' })
  }
  finally { saving.value = false }
}

async function sendTest() {
  testing.value = true
  testError.value = ''
  try {
    await $fetch('/api/admin/smtp-test', { method: 'POST', body: { to: testEmail.value } })
    toast.add({ title: t('smtp.test_sent', 'Test email sent'), description: testEmail.value, color: 'success' })
  }
  catch (e: any) {
    testError.value = e?.data?.message || e?.message || 'Unknown error'
  }
  finally { testing.value = false }
}

onMounted(load)
</script>

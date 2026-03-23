// https://nuxt.com/docs/api/configuration/nuxt-config

// Warn at build/start time if SESSION_SECRET is still the insecure default.
// A weak, publicly known secret allows anyone to forge session tokens.
const DEFAULT_SECRET = 'i18n-dashboard-default-secret-change-me-in-production!!'
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === DEFAULT_SECRET) {
  console.warn(
    '\n⚠️  [i18n-dashboard] SESSION_SECRET is not set or is using the default value.\n' +
    '   Set a strong random secret in your environment:\n' +
    '   SESSION_SECRET=$(openssl rand -hex 32)\n',
  )
}

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  srcDir: 'src',
  serverDir: 'src/server',

  modules: ['@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  ui: {
    colorMode: true,
  },

  runtimeConfig: {
    // Database configuration (overridable via env vars or i18n-dashboard.config)
    dbClient: process.env.I18N_DB_CLIENT || 'better-sqlite3',
    dbConnection: process.env.I18N_DB_CONNECTION || './i18n-dashboard.db',
    dbHost: process.env.I18N_DB_HOST || 'localhost',
    dbPort: process.env.I18N_DB_PORT || '5432',
    dbUser: process.env.I18N_DB_USER || '',
    dbPassword: process.env.I18N_DB_PASSWORD || '',
    dbName: process.env.I18N_DB_NAME || 'i18n_dashboard',
    googleTranslateApiKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
    // Only set when the CLI passes I18N_PROJECT_ROOT explicitly (not defaulted)
    projectRoot: process.env.I18N_PROJECT_ROOT || '',
    localesPath: process.env.I18N_LOCALES_PATH || 'src/locales',
    // Auth — set SESSION_SECRET to a strong random value in production
    sessionSecret: process.env.SESSION_SECRET || DEFAULT_SECRET,
    // Security — tunable without code changes
    bcryptRounds: process.env.BCRYPT_ROUNDS || '12',
    sessionTtlMinutes: process.env.SESSION_TTL_MINUTES || '15',
    refreshTokenTtlDays: process.env.REFRESH_TOKEN_TTL_DAYS || '7',
    resetTokenTtlHours: process.env.RESET_TOKEN_TTL_HOURS || '1',
    // Email (SMTP) — optional
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT || '587',
    smtpSecure: process.env.SMTP_SECURE || 'false',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || 'noreply@i18n-dashboard.local',
    dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3333',

    // Public runtime config
    public: {
      apiPath: process.env.I18N_API_PATH || '/locale/[lang].json',
      keySeparator: process.env.I18N_KEY_SEPARATOR || '.',
      localesPath: process.env.I18N_LOCALES_PATH || 'src/locales',
      dashboardPort: process.env.I18N_PORT || '3333',
    },
  },

  nitro: {
    watchOptions: {
      ignored: ['**/i18n-dashboard.db.json'],
    },
    serverAssets: [
      {
        baseName: 'locales',
        dir: './src/assets/locales',
      },
    ],
    experimental: { tasks: true },
    scheduledTasks: {
      '0 * * * *': ['purge-logs'],
    },
    // ── Security headers ─────────────────────────────────────────────────────
    // Applied to every response from the Nitro server.
    routeRules: {
      '/**': {
        headers: {
          // Prevent the dashboard from being embedded in iframes (clickjacking)
          'X-Frame-Options': 'DENY',
          // Stop browsers from MIME-sniffing away from the declared content-type
          'X-Content-Type-Options': 'nosniff',
          // Disable legacy XSS auditor (modern browsers use CSP instead)
          'X-XSS-Protection': '0',
          // Remove the server fingerprint
          'Server': '',
          // Don't leak the referrer when navigating to external sites
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          // Restrict powerful browser features
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        },
      },
    },
  },

  typescript: {
    strict: false,
  },

  devServer: {
    port: parseInt(process.env.I18N_PORT || '3333'),
  },
})

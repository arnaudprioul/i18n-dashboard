// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

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
    // Auth
    sessionSecret: process.env.SESSION_SECRET || 'i18n-dashboard-default-secret-change-me-in-production!!',
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
        dir: './assets/locales',
      },
    ],
  },

  typescript: {
    strict: false,
  },

  devServer: {
    port: parseInt(process.env.I18N_PORT || '3333'),
  },
})

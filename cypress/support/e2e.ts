import './commands'

// ── Hardcoded test credentials (used by cy.login() and the setup call below) ─
export const TEST_EMAIL    = 'admin@ci.test'
export const TEST_PASSWORD = 'Admin@ci2024'

// ── Bootstrap the test environment once before the entire suite ──────────────
// 1. Create the admin user (no-op if already done — setup returns 403)
// 2. Login to obtain a session cookie for the subsequent onboarding call
// 3. Mark onboarding as complete (idempotent — sets onboarding_completed=true)
//    Without this, auth.global.ts redirects every page to /onboarding.
before(() => {
  cy.request({
    method: 'POST', url: '/api/setup',
    body: { name: 'CI Admin', email: TEST_EMAIL, password: TEST_PASSWORD },
    failOnStatusCode: false,
  })
  cy.request({
    method: 'POST', url: '/api/auth/login',
    body: { email: TEST_EMAIL, password: TEST_PASSWORD },
    failOnStatusCode: false,
  })
  cy.request({
    method: 'POST', url: '/api/onboarding',
    body: { languages: [{ code: 'en', name: 'English' }], defaultLanguage: 'en' },
    failOnStatusCode: false,
  })
})

beforeEach(() => {
  // Silence uncaught exceptions from the app (e.g. navigation errors)
  cy.on('uncaught:exception', () => false)

  // The ui-i18n plugin calls GET /api/ui-locale?lang=* on every page load.
  // Mock it to prevent hydration re-renders that can clear form inputs mid-test.
  cy.intercept('GET', '/api/ui-locale*', { body: {} }).as('uiLocale')
})

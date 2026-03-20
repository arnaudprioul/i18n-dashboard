/**
 * Onboarding wizard — regression tests.
 *
 * Strategy:
 *  - beforeEach() logs in directly via cy.request() on each test — this avoids
 *    the cy.session() restoration behaviour that prevents the browser load event
 *    from firing on the first cy.visit() of the spec.
 *  - beforeEach() resets onboarding_completed=false via the settings API
 *    and mocks auth/me + db-config + config so page hydration completes fast.
 *  - after() restores onboarding_completed=true so subsequent specs work normally.
 *
 * What is NOT tested here (requires a no-user DB state):
 *  - Admin creation form (step 1) — only visible when hasUsers=false.
 *    The CI admin always exists, so step 1 shows the "account exists" banner.
 */

import { TEST_EMAIL, TEST_PASSWORD } from '../../support/e2e'

describe('Onboarding — wizard', () => {
  before(() => {
    // Pre-compile the onboarding page bundle on the Nuxt dev server.
    // Nuxt (Vite) lazily compiles page modules on first access. After a file
    // change, the first cy.visit('/onboarding') can exceed the 60s
    // pageLoadTimeout while the server recompiles. This warm-up request
    // triggers compilation upfront (server-side only, no browser load event).
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: TEST_EMAIL, password: TEST_PASSWORD },
      failOnStatusCode: false,
    })
    cy.request({ method: 'POST', url: '/api/settings', body: { onboarding_completed: 'false' } })
    cy.request({ url: '/onboarding', failOnStatusCode: false, timeout: 120000 })
  })

  // Restore state once the whole spec is done
  after(() => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: TEST_EMAIL, password: TEST_PASSWORD },
      failOnStatusCode: false,
    })
    cy.request({ method: 'POST', url: '/api/settings', body: { onboarding_completed: 'true' } })
  })

  beforeEach(() => {
    // Direct login via cy.request() — avoids cy.session() restoration hang on
    // the first cy.visit() that occurs with testIsolation enabled.
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: TEST_EMAIL, password: TEST_PASSWORD },
      failOnStatusCode: false,
    })
    // Reset onboarding flag so the server-side middleware allows /onboarding
    cy.request({ method: 'POST', url: '/api/settings', body: { onboarding_completed: 'false' } })

    // Mock client-side auth calls so page hydration does not hang
    cy.fixture('auth').then((auth) => {
      cy.intercept('GET', '/api/auth/me', { body: auth.me }).as('authMe')
    })
    cy.intercept('GET', '/api/db-config', {
      body: { type: 'sqlite', connection: './i18n-dashboard.db', fileExists: true },
    }).as('getDbConfig')
    cy.intercept('GET', '/api/config', {
      body: { uiLanguages: ['en'], defaultUiLanguage: 'en' },
    }).as('getConfig')

    // Mock write-side calls to prevent real DB mutations during UI tests
    cy.intercept('POST', '/api/db-config', { statusCode: 200, body: { success: true } }).as('postDbConfig')
    cy.intercept('POST', '/api/onboarding', { statusCode: 200, body: { success: true } }).as('postOnboarding')
    cy.intercept('POST', '/api/projects', { statusCode: 201, body: { id: 99, name: 'Test Project' } }).as('postProject')
  })

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Visits /onboarding and waits for Vue to finish its async component setup
   * (all top-level awaits in <script setup> resolved + onMounted fired).
   * Without this wait, clicks land on SSR-rendered DOM before event listeners
   * are attached and the Vue reactivity is connected.
   */
  function visitOnboarding() {
    cy.visit('/onboarding')
    cy.get('[data-cy="onboarding-mounted"]').should('exist')
  }

  /** Navigate from step 0 to step 1 (click Next on DB step). */
  function goToStep1() {
    cy.get('[data-cy="onboarding-next"]').click()
    cy.get('[data-cy="onboarding-admin-done"]').should('be.visible')
  }

  /** Navigate from step 0 to step 2 (language picker). */
  function goToStep2() {
    goToStep1()
    cy.get('[data-cy="onboarding-next"]').click()
    cy.get('[data-cy="onboarding-lang-search"]').should('be.visible')
  }

  /** Navigate from step 0 to step 3 (project form). */
  function goToStep3() {
    goToStep2()
    cy.get('[data-cy="onboarding-next"]').click()
    cy.wait('@postOnboarding')
    cy.get('[data-cy="onboarding-project-name"]').should('be.visible')
  }

  // ── Step 0: Database ───────────────────────────────────────────────────────

  it('should display the database step on initial load', () => {
    visitOnboarding()
    cy.get('[data-cy="onboarding-step-indicator"]').should('be.visible')
    cy.get('[data-cy="onboarding-db-type-select"]').should('be.visible')
    cy.get('[data-cy="onboarding-db-test"]').should('be.visible')
    cy.get('[data-cy="onboarding-next"]').should('be.visible')
  })

  it('should show "File found" badge for the default SQLite path', () => {
    visitOnboarding()
    cy.get('[data-cy="onboarding-sqlite-file-found"]').should('be.visible')
  })

  it('should show the DB connected badge after a successful connection test', () => {
    visitOnboarding()
    cy.get('[data-cy="onboarding-db-test"]').click()
    cy.wait('@postDbConfig')
    cy.get('[data-cy="onboarding-db-connected"]').should('be.visible')
  })

  it('should show a DB error message when the connection test fails', () => {
    cy.intercept('POST', '/api/db-config', {
      statusCode: 500,
      body: { message: 'Connection refused' },
    }).as('postDbConfigFail')

    visitOnboarding()
    cy.get('[data-cy="onboarding-db-test"]').click()
    cy.wait('@postDbConfigFail')
    cy.get('[data-cy="onboarding-db-error"]')
      .should('be.visible')
      .and('contain', 'Connection refused')
  })

  // ── Step 1: Admin account ──────────────────────────────────────────────────

  it('should advance to step 1 when clicking Next from step 0', () => {
    visitOnboarding()
    cy.get('[data-cy="onboarding-next"]').click()
    // CI env always has an existing admin — confirmation banner is shown
    cy.get('[data-cy="onboarding-admin-done"]').should('be.visible')
  })

  it('should show the Previous button in step 1 and navigate back to step 0', () => {
    visitOnboarding()
    goToStep1()
    cy.get('[data-cy="onboarding-prev"]').should('be.visible').click()
    cy.get('[data-cy="onboarding-db-type-select"]').should('be.visible')
    cy.get('[data-cy="onboarding-prev"]').should('not.exist')
  })

  // ── Step 2: UI Languages ───────────────────────────────────────────────────

  it('should show the language picker in step 2', () => {
    visitOnboarding()
    goToStep2()
    cy.get('[data-cy="onboarding-lang-search"]').should('be.visible')
    cy.get('[data-cy="onboarding-lang-list"]').should('be.visible')
    cy.get('[data-cy="onboarding-lang-list"] button').should('have.length.greaterThan', 0)
  })

  it('should filter the language list when typing in the search box', () => {
    visitOnboarding()
    goToStep2()
    cy.get('[data-cy="onboarding-lang-search"]').should('be.enabled').type('French')
    cy.get('[data-cy="onboarding-lang-list"] button').should('have.length.greaterThan', 0)
    cy.get('[data-cy="onboarding-lang-list"] button').each(($btn) => {
      cy.wrap($btn).invoke('text').should('match', /french/i)
    })
  })

  it('should mark a language as selected when clicking it', () => {
    visitOnboarding()
    goToStep2()
    cy.get('[data-cy="onboarding-lang-search"]').type('French')
    cy.get('[data-cy="onboarding-lang-list"] button').first().click()
    // selected item gets the bg-primary-50 highlight class
    cy.get('[data-cy="onboarding-lang-list"] button').first().should('have.class', 'bg-primary-50')
  })

  // ── Step 3: First project ──────────────────────────────────────────────────

  it('should show the project creation form in step 3', () => {
    visitOnboarding()
    goToStep3()
    cy.get('[data-cy="onboarding-project-name"]').should('be.visible')
    cy.get('[data-cy="onboarding-project-path"]').should('be.visible')
    cy.get('[data-cy="onboarding-project-locales"]').should('be.visible')
    cy.get('[data-cy="onboarding-skip-project"]').should('be.visible')
    cy.get('[data-cy="onboarding-finish"]').should('be.visible')
  })

  it('should show a validation error when submitting without name or path', () => {
    visitOnboarding()
    goToStep3()
    cy.get('[data-cy="onboarding-finish"]').click()
    cy.get('[data-cy="onboarding-project-error"]').should('be.visible')
  })

  it('should allow skipping project creation and reach the done screen', () => {
    visitOnboarding()
    goToStep3()
    cy.get('[data-cy="onboarding-skip-project"]').click()
    cy.get('[data-cy="onboarding-done-title"]').should('be.visible')
  })

  it('should create a project and advance to the done screen', () => {
    visitOnboarding()
    goToStep3()
    cy.get('[data-cy="onboarding-project-name"]').should('be.enabled').type('My App')
    cy.get('[data-cy="onboarding-project-path"]').should('be.enabled').type('/path/to/my-app')
    cy.get('[data-cy="onboarding-finish"]').click()
    cy.wait('@postProject')
    cy.get('[data-cy="onboarding-done-title"]').should('be.visible')
  })

  // ── Step 4: Done ───────────────────────────────────────────────────────────

  it('should display the done screen with the go-to-dashboard button', () => {
    visitOnboarding()
    goToStep3()
    cy.get('[data-cy="onboarding-skip-project"]').click()
    cy.get('[data-cy="onboarding-done-title"]').should('be.visible')
    cy.get('[data-cy="onboarding-go-dashboard"]').should('be.visible')
    cy.get('[data-cy="onboarding-prev"]').should('not.exist')
  })

  // ── Redirect guard ─────────────────────────────────────────────────────────

  describe('redirect guard', () => {
    beforeEach(() => {
      // Override: mark onboarding as complete for this sub-suite
      cy.request({ method: 'POST', url: '/api/settings', body: { onboarding_completed: 'true' } })
    })

    it('should redirect to / when onboarding is already completed', () => {
      cy.mockAllApis()
      cy.visit('/onboarding', { failOnStatusCode: false })
      cy.url().should('not.include', '/onboarding')
      cy.url().should('eq', Cypress.config('baseUrl') + '/')
    })
  })
})

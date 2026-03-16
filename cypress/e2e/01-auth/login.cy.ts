/**
 * Auth tests — login page.
 * The ui-i18n plugin fires GET /api/ui-locale* on every page load.
 * It is mocked globally in support/e2e.ts to prevent hydration re-renders
 * that could clear form inputs mid-test.
 */
describe('Auth — Login page', () => {
  // Pre-mock every API that can fire when visiting /login:
  // - auth/status : Nuxt middleware (skips /login, but hydration may still call it)
  // - auth/me     : called by BaseService on any 401 response (session-refresh flow)
  // - auth/logout : called by BaseService._handleAuthFailure when refresh fails
  beforeEach(() => {
    cy.intercept('GET', '/api/auth/status', {
      body: { isLoggedIn: false, hasUsers: true, onboardingCompleted: true },
    }).as('authStatus')
    cy.intercept('GET', '/api/auth/me', {
      statusCode: 401,
      body: { message: 'Unauthorized' },
    }).as('authMe')
    cy.intercept('POST', '/api/auth/logout', { statusCode: 200, body: {} }).as('logout')
  })

  it('should display the login form', () => {
    cy.visit('/login')
    cy.get('[data-cy="login-title"]').should('be.visible')
    cy.get('[data-cy="login-email"]').should('be.visible')
    cy.get('[data-cy="login-password"]').should('be.visible')
    cy.get('[data-cy="login-submit"]').should('be.visible')
  })

  it('should show an error on failed login', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' },
    }).as('loginFail')

    cy.visit('/login')
    // .should('be.enabled') ensures the input is interactive (DOM stable after hydration)
    cy.get('[data-cy="login-email"]').should('be.enabled').type('wrong@example.com')
    cy.get('[data-cy="login-password"]').should('be.enabled').type('wrongpassword')
    cy.get('[data-cy="login-submit"]').click()
    cy.wait('@loginFail')
    cy.get('[data-cy="login-error"]').should('be.visible').and('contain', 'Invalid credentials')
  })

  it('should log in and redirect to / on success', () => {
    cy.fixture('auth').then((auth) => {
      cy.intercept('GET', '/api/auth/status', { body: auth.status }).as('authStatus')
      cy.intercept('GET', '/api/auth/me', { body: auth.me }).as('authMe')
      cy.intercept('POST', '/api/auth/login', { body: auth.me }).as('loginOk')
    })
    cy.fixture('projects').then((projects) => {
      cy.intercept('GET', '/api/projects', { body: projects }).as('getProjects')
    })
    cy.fixture('stats').then((stats) => {
      cy.intercept('GET', '/api/stats*', { body: stats }).as('getStats')
    })
    cy.fixture('languages').then((languages) => {
      cy.intercept('GET', '/api/languages*', { body: languages }).as('getLanguages')
    })
    cy.fixture('settings').then((settings) => {
      cy.intercept('GET', '/api/settings', { body: settings }).as('getSettings')
    })

    cy.visit('/login')
    cy.get('[data-cy="login-email"]').should('be.enabled').type('admin@example.com')
    cy.get('[data-cy="login-password"]').should('be.enabled').type('admin')
    cy.get('[data-cy="login-submit"]').click()
    cy.wait('@loginOk')
    cy.url().should('eq', Cypress.config('baseUrl') + '/')
  })

  it('should redirect unauthenticated users from / to /login', () => {
    // The SSR middleware runs server-side — Cypress intercepts do not apply here.
    // This test relies on the real server returning isLoggedIn: false.
    cy.visit('/', { failOnStatusCode: false })
    cy.url().should('include', '/login')
  })
})

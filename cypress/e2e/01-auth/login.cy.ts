/**
 * Auth tests — login page does NOT need a real session.
 * The global middleware skips /login entirely.
 */
describe('Auth — Login page', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => false)
  })

  it('should display the login form', () => {
    cy.intercept('GET', '/api/auth/status', {
      body: { isLoggedIn: false, hasUsers: true, onboardingCompleted: true },
    }).as('authStatus')

    cy.visit('/login')
    cy.contains('i18n Dashboard').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('should show an error on failed login', () => {
    cy.intercept('GET', '/api/auth/status', {
      body: { isLoggedIn: false, hasUsers: true, onboardingCompleted: true },
    }).as('authStatus')
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { message: 'Invalid credentials' },
    }).as('loginFail')

    cy.visit('/login')
    cy.get('input[type="email"]').type('wrong@example.com')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()
    cy.wait('@loginFail')
    cy.contains('Invalid credentials').should('be.visible')
  })

  it('should log in and redirect to / on success', () => {
    cy.fixture('auth').then((auth) => {
      cy.intercept('GET', '/api/auth/status', { body: auth.status }).as('authStatus')
      cy.intercept('POST', '/api/auth/login', { body: auth.me }).as('loginOk')
      cy.intercept('GET', '/api/auth/me', { body: auth.me }).as('authMe')
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
    cy.get('input[type="email"]').type('admin@example.com')
    cy.get('input[type="password"]').type('admin')
    cy.get('button[type="submit"]').click()
    cy.wait('@loginOk')
    cy.url().should('eq', Cypress.config('baseUrl') + '/')
  })

  it('should redirect unauthenticated users from / to /login', () => {
    // No session → SSR middleware returns isLoggedIn: false → redirect to /login
    // This test relies on the real server returning the correct status
    cy.visit('/', { failOnStatusCode: false })
    cy.url().should('include', '/login')
  })
})

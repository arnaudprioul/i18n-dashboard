describe('Login page', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => false)
  })

  it('should display the login form', () => {
    cy.intercept('GET', '/api/auth/status', {
      body: { isLoggedIn: false, hasUsers: true, onboardingCompleted: true },
    }).as('authStatus')

    cy.visit('/login')
    cy.contains('i18n Dashboard').should('be.visible')
    cy.contains('Log in').should('be.visible')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.contains('Sign in').should('be.visible')
  })

  it('should log in successfully and redirect to /', () => {
    cy.intercept('GET', '/api/auth/status', {
      body: { isLoggedIn: false, hasUsers: true, onboardingCompleted: true },
    }).as('authStatusBefore')

    cy.fixture('auth').then((auth) => {
      cy.intercept('POST', '/api/auth/login', { body: auth.me }).as('loginRequest')
      cy.intercept('GET', '/api/auth/me', { body: auth.me }).as('authMe')
      cy.intercept('GET', '/api/auth/status', {
        body: auth.status,
      }).as('authStatusAfter')
    })

    cy.fixture('projects').then((projects) => {
      cy.intercept('GET', '/api/projects', { body: projects }).as('getProjects')
    })
    cy.fixture('stats').then((stats) => {
      cy.intercept('GET', '/api/stats*', { body: stats }).as('getStats')
    })
    cy.fixture('languages').then((langs) => {
      cy.intercept('GET', '/api/languages*', { body: langs }).as('getLangs')
    })
    cy.fixture('settings').then((settings) => {
      cy.intercept('GET', '/api/settings', { body: settings }).as('getSettings')
    })

    cy.visit('/login')
    cy.get('input[type="email"]').type('admin@example.com')
    cy.get('input[type="password"]').type('password123')
    cy.contains('button', 'Sign in').click()

    cy.wait('@loginRequest')
    cy.url().should('eq', Cypress.config('baseUrl') + '/')
  })

  it('should show an error message on failed login', () => {
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
    cy.contains('button', 'Sign in').click()

    cy.wait('@loginFail')
    cy.contains('Invalid credentials').should('be.visible')
  })

  it('should redirect unauthenticated users from / to /login', () => {
    cy.intercept('GET', '/api/auth/status', {
      body: { isLoggedIn: false, hasUsers: true, onboardingCompleted: true },
    }).as('authStatus')

    cy.visit('/')
    cy.url().should('include', '/login')
  })
})

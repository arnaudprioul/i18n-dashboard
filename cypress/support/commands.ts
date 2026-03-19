import { TEST_EMAIL, TEST_PASSWORD } from './e2e'

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>
      mockAllApis(projectId?: number): Chainable<void>
    }
  }
}

/**
 * Establishes a real server session via cy.request().
 * Credentials are hardcoded to the test admin created in e2e.ts before().
 * The session is cached across tests in the same spec file via cy.session().
 */
Cypress.Commands.add('login', () => {
  cy.session(
    'admin-session',
    () => {
      cy.request({
        method:           'POST',
        url:              '/api/auth/login',
        body:             { email: TEST_EMAIL, password: TEST_PASSWORD },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status, `Login failed for ${TEST_EMAIL} — is the server running?`).to.eq(200)
      })
    },
    {
      validate() {
        cy.request({ url: '/api/auth/status', failOnStatusCode: false })
          .its('body.isLoggedIn')
          .should('eq', true)
      },
    },
  )
})

/**
 * Intercepts all client-side data API calls with fixture data.
 * Auth intercepts (status/me) are included so client-side checks stay mocked.
 * Write operations (POST/PUT/DELETE) are mocked to prevent DB changes.
 */
Cypress.Commands.add('mockAllApis', (_projectId = 1) => {
  cy.fixture('auth').then((auth) => {
    cy.intercept('GET', '/api/auth/status', { body: auth.status }).as('authStatus')
    cy.intercept('GET', '/api/auth/me', { body: auth.me }).as('authMe')
  })

  cy.fixture('projects').then((projects) => {
    cy.intercept('GET', '/api/projects', { body: projects }).as('getProjects')
    cy.intercept('GET', '/api/projects/check-name*', { body: { available: true } }).as('checkProjectName')
    cy.intercept('POST', '/api/projects/detect', {
      body: { name: '', localesPath: 'src/locales', languages: [] },
    }).as('detectProject')
    cy.intercept('POST', '/api/projects', { statusCode: 201, body: { id: 99, name: 'New Project' } }).as('postProject')
    cy.intercept('PUT', '/api/projects/*', { statusCode: 200, body: {} }).as('putProject')
    cy.intercept('DELETE', '/api/projects/*', { statusCode: 200, body: {} }).as('deleteProject')
  })

  cy.fixture('languages').then((languages) => {
    cy.intercept('GET', '/api/languages*', { body: languages }).as('getLanguages')
    cy.intercept('POST', '/api/languages', {
      statusCode: 201,
      body: { id: 99, code: 'es', name: 'Spanish', is_default: false },
    }).as('postLanguage')
    cy.intercept('PUT', '/api/languages/*', { statusCode: 200, body: {} }).as('putLanguage')
    cy.intercept('DELETE', '/api/languages/*', { statusCode: 200, body: {} }).as('deleteLanguage')
  })

  cy.fixture('stats').then((stats) => {
    cy.intercept('GET', '/api/stats*', { body: stats }).as('getStats')
  })

  cy.fixture('keys').then((keys) => {
    cy.intercept('GET', '/api/keys*', { body: keys }).as('getKeys')
    cy.intercept('POST', '/api/keys', {
      statusCode: 201,
      body: { id: 99, key: 'test.new_key', description: '' },
    }).as('postKey')
    cy.intercept('PATCH', '/api/keys/*', { statusCode: 200, body: {} }).as('patchKey')
    cy.intercept('DELETE', '/api/keys/*', { statusCode: 200, body: {} }).as('deleteKey')
  })

  cy.fixture('key-detail').then((keyDetail) => {
    cy.intercept('GET', '/api/keys/*', { body: keyDetail }).as('getKeyDetail')
  })

  cy.fixture('users').then((users) => {
    cy.intercept('GET', '/api/users*', { body: users }).as('getUsers')
    cy.intercept('POST', '/api/users', {
      statusCode: 201,
      body: { id: 10, email: 'new@example.com', name: 'New User' },
    }).as('postUser')
    cy.intercept('PUT', '/api/users/*/roles', { statusCode: 200, body: {} }).as('putUserRoles')
    cy.intercept('PUT', '/api/users/*', { statusCode: 200, body: {} }).as('putUser')
    cy.intercept('DELETE', '/api/users/*', { statusCode: 200, body: {} }).as('deleteUser')
  })

  cy.fixture('profile').then((profile) => {
    cy.intercept('GET', '/api/users/*/profile*', { body: profile }).as('getUserProfile')
    cy.intercept('GET', '/api/profile*', { body: profile }).as('getProfile')
  })

  cy.fixture('settings').then((settings) => {
    cy.intercept('GET', '/api/settings', { body: settings }).as('getSettings')
    cy.intercept('POST', '/api/settings', { statusCode: 200, body: settings }).as('postSettings')
  })

  cy.intercept('POST', '/api/translations', { statusCode: 200, body: {} }).as('postTranslation')
  cy.intercept('POST', '/api/translations/status', { statusCode: 200, body: {} }).as('postTranslationStatus')
  cy.intercept('POST', '/api/translations/bulk-status', { statusCode: 200, body: {} }).as('postBulkStatus')
  cy.intercept('POST', '/api/scan', { statusCode: 200, body: { keysFound: 0, keysAdded: 0, langsAdded: 0 } }).as('postScan')
  cy.intercept('POST', '/api/sync', { statusCode: 200, body: { added: 0, updated: 0 } }).as('postSync')
})

export {}

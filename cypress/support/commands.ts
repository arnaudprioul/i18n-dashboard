declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>
      mockAllApis(projectId?: number): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', () => {
  cy.fixture('auth').then((auth) => {
    cy.intercept('GET', '/api/auth/status', { body: auth.status }).as('authStatus')
    cy.intercept('GET', '/api/auth/me', { body: auth.me }).as('authMe')
  })
})

Cypress.Commands.add('mockAllApis', (projectId = 1) => {
  cy.fixture('auth').then((auth) => {
    cy.intercept('GET', '/api/auth/status', { body: auth.status }).as('authStatus')
    cy.intercept('GET', '/api/auth/me', { body: auth.me }).as('authMe')
  })
  cy.fixture('projects').then((projects) => {
    cy.intercept('GET', '/api/projects', { body: projects }).as('getProjects')
    cy.intercept('GET', '/api/projects/check-name*', { body: { available: true } }).as('checkProjectName')
  })
  cy.fixture('languages').then((languages) => {
    cy.intercept('GET', `/api/languages?project_id=${projectId}`, { body: languages }).as('getLanguages')
    cy.intercept('GET', '/api/languages*', { body: languages }).as('getLanguagesWild')
  })
  cy.fixture('stats').then((stats) => {
    cy.intercept('GET', `/api/stats?project_id=${projectId}`, { body: stats }).as('getStats')
    cy.intercept('GET', '/api/stats*', { body: stats }).as('getStatsWild')
  })
  cy.fixture('keys').then((keys) => {
    cy.intercept('GET', '/api/keys*', { body: keys }).as('getKeys')
  })
  cy.fixture('users').then((users) => {
    cy.intercept('GET', '/api/users', { body: users }).as('getUsers')
    cy.intercept('GET', '/api/users?*', { body: users }).as('getUsersWild')
  })
  cy.fixture('settings').then((settings) => {
    cy.intercept('GET', '/api/settings', { body: settings }).as('getSettings')
  })
})

export {}

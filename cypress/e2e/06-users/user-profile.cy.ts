import { TEST_EMAIL, TEST_PASSWORD } from '../../support/e2e'

describe('User profile', () => {
  before(() => {
    // Pre-compile the user profile page bundle — both SSR and browser chunks.
    // cy.request() only compiles SSR-side code; cy.visit() is required to also
    // compile the browser JS chunks which can take > 60s under server load.
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: TEST_EMAIL, password: TEST_PASSWORD },
      failOnStatusCode: false,
    })
    cy.mockAllApis()
    cy.visit('/users/2/profile', { timeout: 120000 })
  })

  beforeEach(() => {
    // Direct login via cy.request() — avoids cy.session() restoration delay
    // that can push the first cy.visit() over the 60s pageLoadTimeout.
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: TEST_EMAIL, password: TEST_PASSWORD },
      failOnStatusCode: false,
    })
    cy.mockAllApis()
    cy.visit('/users/2/profile')
    // useProfile has server:false → client-side fetch → interceptable
    cy.wait('@getUserProfile')
  })

  it('should display the user name in the header', () => {
    cy.get('[data-cy="profile-username"]').should('be.visible')
  })

  it('should display the user email', () => {
    cy.get('[data-cy="profile-email"]').should('be.visible')
  })

  it('should show a "Member since" date', () => {
    cy.get('[data-cy="profile-member-since"]').should('be.visible')
  })

  it('should display total translations stat card with value 128', () => {
    cy.get('[data-cy="profile-stat-translations"]').should('contain', '128')
  })

  it('should display a period selector', () => {
    cy.get('[data-cy="profile-period-select"]').should('be.visible')
  })

  it('should show the Projects & Roles section', () => {
    cy.get('[data-cy="profile-projects-roles"]').should('be.visible')
  })

  it('should display the recent activity section', () => {
    cy.get('[data-cy="profile-recent-activity"]').should('be.visible')
  })

  it('should show recent translation history entries', () => {
    cy.contains('home.title').should('be.visible')
    cy.contains('Bienvenue').should('be.visible')
  })
})

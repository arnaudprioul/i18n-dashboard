import { TEST_EMAIL, TEST_PASSWORD } from '../../support/e2e'

describe('Dashboard', () => {
  before(() => {
    cy.request({ method: 'POST', url: '/api/auth/login', body: { email: TEST_EMAIL, password: TEST_PASSWORD }, failOnStatusCode: false })
    cy.mockAllApis()
    cy.visit('/', { timeout: 300000 })
  })

  beforeEach(() => {
    cy.request({ method: 'POST', url: '/api/auth/login', body: { email: TEST_EMAIL, password: TEST_PASSWORD }, failOnStatusCode: false })
    cy.mockAllApis()
    cy.visit('/')
    // Wait for the primary data call that proves the page has finished loading
    cy.wait('@getProjects')
  })

  it('should load and show the project name in the sidebar', () => {
    cy.contains('My App').should('be.visible')
  })

  it('should show the navigation sidebar', () => {
    cy.get('body').should('be.visible')
    cy.contains('Projects').should('exist')
  })
})

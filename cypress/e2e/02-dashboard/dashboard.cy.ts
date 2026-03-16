describe('Dashboard', () => {
  beforeEach(() => {
    cy.login()
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

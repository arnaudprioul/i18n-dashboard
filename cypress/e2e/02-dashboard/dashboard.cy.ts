describe('Dashboard', () => {
  beforeEach(() => {
    cy.login()
    cy.mockAllApis()
    cy.visit('/')
  })

  it('should load and show the project name in the sidebar', () => {
    cy.wait('@getProjects')
    cy.contains('My App').should('be.visible')
  })

  it('should show the navigation sidebar', () => {
    cy.get('body').should('be.visible')
    // Sidebar navigation links exist
    cy.contains('Projects').should('exist')
  })
})

describe('Projects list', () => {
  beforeEach(() => {
    cy.login()
    cy.mockAllApis()
    cy.visit('/projects')
    cy.wait('@getProjects')
  })

  it('should display the projects page heading', () => {
    cy.contains('Projects').should('be.visible')
  })

  it('should list the projects from the fixture', () => {
    cy.contains('My App').should('be.visible')
    cy.contains('Admin Panel').should('be.visible')
    cy.contains('Dashboard UI').should('be.visible')
  })

  it('should show key counts for a project', () => {
    cy.contains('Translation keys').should('be.visible')
  })

  it('should have an "Add a project" button', () => {
    cy.contains('Add a project').should('be.visible')
  })

  it('should open the add project modal on click', () => {
    cy.contains('Add a project').first().click()
    // Modal step 1 shows "Source" step label
    cy.contains('Source').should('be.visible')
  })

  it('should close the add modal on Cancel', () => {
    cy.contains('Add a project').first().click()
    cy.contains('Source').should('be.visible')
    cy.contains('Cancel').click()
    cy.contains('Source').should('not.exist')
  })

  it('should open a delete confirmation modal for a non-system project', () => {
    // Click the ellipsis dropdown of "My App"
    cy.contains('.bg-white, [class*="rounded-xl"]', 'My App').within(() => {
      cy.get('button').last().click({ force: true })
    })
    cy.contains('Delete').click()
    cy.contains('Delete project').should('be.visible')
    cy.contains('This action is irreversible').should('be.visible')
  })

  it('should cancel the delete confirmation', () => {
    cy.contains('.bg-white, [class*="rounded-xl"]', 'My App').within(() => {
      cy.get('button').last().click({ force: true })
    })
    cy.contains('Delete').click()
    cy.contains('Delete project').should('be.visible')
    cy.contains('Cancel').click()
    cy.contains('Delete project').should('not.exist')
  })

  it('should have an Open button to navigate to a project', () => {
    cy.contains('Open').should('be.visible')
  })
})

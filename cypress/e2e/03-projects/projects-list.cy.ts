describe('Projects list', () => {
  beforeEach(() => {
    cy.mockAllApis()
    cy.visit('/projects')
  })

  it('should display the projects page heading', () => {
    cy.contains('Projects').should('be.visible')
  })

  it('should list 3 projects from the fixture', () => {
    cy.contains('My App').should('be.visible')
    cy.contains('Admin Panel').should('be.visible')
    cy.contains('Dashboard UI').should('be.visible')
  })

  it('should show project descriptions', () => {
    cy.contains('Main application').should('be.visible')
    cy.contains('Back-office panel').should('be.visible')
  })

  it('should show key and language counts for a project', () => {
    // My App has 42 keys and 3 languages
    cy.contains('42').should('be.visible')
    cy.contains('Translation keys').should('be.visible')
  })

  it('should have an "Add a project" button', () => {
    cy.contains('Add a project').should('be.visible')
  })

  it('should open the add project modal when clicking "Add a project"', () => {
    cy.intercept('POST', '/api/projects/detect', {
      body: { name: '', localesPath: '', languages: [] },
    }).as('detectProject')

    cy.contains('Add a project').click()
    cy.contains('Add a project').should('be.visible')
    // Modal step 1 is shown
    cy.contains('Source').should('be.visible')
  })

  it('should close the add project modal when clicking Cancel', () => {
    cy.contains('Add a project').click()
    cy.contains('Cancel').click()
    // Modal should be gone — "Source" step label disappears
    cy.contains('Source').should('not.exist')
  })

  it('should show edit action in project dropdown menu', () => {
    // Click the ellipsis button of "My App" (first non-system project card)
    cy.contains('My App')
      .closest('.bg-white, .dark\\:bg-gray-900')
      .find('button')
      .last()
      .click({ force: true })

    cy.contains('Edit').should('be.visible')
  })

  it('should show delete action only for non-system projects', () => {
    // "My App" (is_system: false) should show delete in its dropdown
    cy.contains('My App')
      .closest('.bg-white, .dark\\:bg-gray-900')
      .find('button')
      .last()
      .click({ force: true })

    cy.contains('Delete').should('be.visible')
  })

  it('should open the delete confirmation modal when clicking Delete', () => {
    cy.contains('My App')
      .closest('.bg-white, .dark\\:bg-gray-900')
      .find('button')
      .last()
      .click({ force: true })

    cy.contains('Delete').click()

    // Confirm modal appears
    cy.contains('Delete project').should('be.visible')
    cy.contains('This action is irreversible').should('be.visible')
  })

  it('should close the delete confirmation modal when clicking Cancel', () => {
    cy.contains('My App')
      .closest('.bg-white, .dark\\:bg-gray-900')
      .find('button')
      .last()
      .click({ force: true })

    cy.contains('Delete').click()
    cy.contains('Delete project').should('be.visible')

    // Cancel the deletion
    cy.contains('Cancel').click()
    cy.contains('Delete project').should('not.exist')
  })

  it('should have an Open button to navigate to a project', () => {
    cy.contains('My App')
      .closest('.bg-white, .dark\\:bg-gray-900')
      .contains('Open')
      .should('be.visible')
  })
})

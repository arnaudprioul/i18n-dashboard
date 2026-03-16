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
    cy.get('[data-cy="project-name-1"]').should('be.visible')
    cy.get('[data-cy="project-name-2"]').should('be.visible')
    cy.get('[data-cy="project-name-99"]').should('be.visible')
  })

  it('should show key counts for a project', () => {
    cy.get('[data-cy="project-keys-stat-1"]').should('be.visible')
  })

  it('should have an "Add a project" button', () => {
    cy.get('[data-cy="projects-add-btn"]').should('be.visible')
  })

  it('should open the add project modal on click', () => {
    cy.get('[data-cy="projects-add-btn"]').click()
    cy.get('[data-cy="project-step-source"]').should('be.visible')
  })

  it('should close the add modal on Cancel', () => {
    cy.get('[data-cy="projects-add-btn"]').click()
    cy.get('[data-cy="project-step-source"]').should('be.visible')
    cy.get('[data-cy="modal-cancel-btn"]').click()
    cy.get('[data-cy="project-step-source"]').should('not.exist')
  })

  it('should open a delete confirmation modal for a non-system project', () => {
    cy.get('[data-cy="project-menu-btn-1"]').click({ force: true })
    cy.contains('Delete').click()
    cy.get('[data-cy="project-delete-modal"]').should('be.visible')
    cy.get('[data-cy="delete-irreversible-text"]').should('be.visible')
  })

  it('should cancel the delete confirmation', () => {
    cy.get('[data-cy="project-menu-btn-1"]').click({ force: true })
    cy.contains('Delete').click()
    cy.get('[data-cy="project-delete-modal"]').should('be.visible')
    cy.contains('Cancel').click()
    cy.contains('Delete project').should('not.exist')
  })

  it('should have an Open button to navigate to a project', () => {
    cy.get('[data-cy="project-open-btn-1"]').should('be.visible')
  })
})

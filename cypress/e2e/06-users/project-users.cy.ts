describe('Project users', () => {
  beforeEach(() => {
    cy.login()
    cy.mockAllApis()
    cy.visit('/projects/1/users')
    // useUsers('project') uses useAsyncData (SSR) — rendered server-side from real DB.
    // Wait for projects to confirm the layout has loaded.
    cy.wait('@getProjects')
  })

  it('should display the users page heading', () => {
    cy.get('[data-cy="project-users-title"]').should('be.visible')
  })

  it('should show a subtitle mentioning the project', () => {
    cy.contains('Members of project').should('be.visible')
    cy.contains('My App').should('be.visible')
  })

  it('should have an "Add a user" button', () => {
    cy.get('[data-cy="users-add-btn"]').should('be.visible')
  })

  it('should open the add user modal in "select" mode when clicking "Add a user"', () => {
    cy.get('[data-cy="users-add-btn"]').click()
    cy.get('[data-cy="user-search-input"]').should('be.visible')
  })

  it('should show "Create a new user" button in the select mode modal', () => {
    cy.get('[data-cy="users-add-btn"]').click()
    cy.get('[data-cy="create-new-user-btn"]').should('be.visible')
  })

  it('should switch to create mode when clicking "Create a new user"', () => {
    cy.get('[data-cy="users-add-btn"]').click()
    cy.get('[data-cy="create-new-user-btn"]').click()
    cy.get('[data-cy="user-form-name"]').should('be.visible')
    cy.get('[data-cy="user-form-email"]').should('be.visible')
  })

  it('should show a Back button in create mode', () => {
    cy.get('[data-cy="users-add-btn"]').click()
    cy.get('[data-cy="create-new-user-btn"]').click()
    cy.get('[data-cy="add-user-back-btn"]').should('be.visible')
  })

  it('should close the modal when clicking Cancel', () => {
    cy.get('[data-cy="users-add-btn"]').click()
    cy.get('[data-cy="user-search-input"]').should('be.visible')
    cy.get('[data-cy="add-user-cancel-btn"]').click()
    cy.get('[data-cy="user-search-input"]').should('not.exist')
  })
})

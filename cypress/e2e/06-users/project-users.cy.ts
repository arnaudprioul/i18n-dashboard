describe('Project users', () => {
  beforeEach(() => {
    cy.login()
    cy.mockAllApis()
    cy.visit('/projects/1/users')
    // useUsers('project') uses useAsyncData (SSR) — initial render comes from real DB.
    // Do NOT wait for @getUsers here; assert on rendered UI structure instead.
  })

  it('should display the users page heading', () => {
    cy.contains('h1', 'Users').should('be.visible')
  })

  it('should show a subtitle mentioning the project', () => {
    cy.contains('Members of project').should('be.visible')
    cy.contains('My App').should('be.visible')
  })

  it('should have an "Add a user" button', () => {
    cy.contains('Add a user').should('be.visible')
  })

  it('should open the add user modal in "select" mode when clicking "Add a user"', () => {
    cy.contains('Add a user').click()
    cy.contains('Add a user to the project').should('be.visible')
    cy.get('input[placeholder*="Search"]').should('be.visible')
  })

  it('should show "Create a new user" button in the select mode modal', () => {
    cy.contains('Add a user').click()
    cy.contains('Create a new user').should('be.visible')
  })

  it('should switch to create mode when clicking "Create a new user"', () => {
    cy.contains('Add a user').click()
    cy.contains('Create a new user').click()
    cy.contains('Name').should('be.visible')
    cy.contains('Email').should('be.visible')
  })

  it('should show a Back button in create mode', () => {
    cy.contains('Add a user').click()
    cy.contains('Create a new user').click()
    cy.contains('Back').should('be.visible')
  })

  it('should close the modal when clicking Cancel', () => {
    cy.contains('Add a user').click()
    cy.contains('Add a user to the project').should('be.visible')
    cy.contains('Cancel').click()
    cy.contains('Add a user to the project').should('not.exist')
  })
})

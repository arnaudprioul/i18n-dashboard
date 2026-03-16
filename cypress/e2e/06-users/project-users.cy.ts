describe('Project users', () => {
  beforeEach(() => {
    cy.mockAllApis()
    cy.fixture('project-users').then((projectUsers) => {
      cy.intercept('GET', '/api/projects/1/users*', { body: projectUsers }).as('getProjectUsers')
    })
    cy.fixture('users').then((users) => {
      // Available users: exclude project members
      cy.intercept('GET', '/api/users?exclude_project_id=1*', { body: [users[0]] }).as('getAvailableUsers')
    })
    cy.visit('/projects/1/users')
  })

  it('should display the users section heading', () => {
    cy.contains('Users').should('be.visible')
  })

  it('should show the current project name', () => {
    cy.contains('My App').should('be.visible')
  })

  it('should list the 2 project members from the fixture', () => {
    // project-users fixture has Jane Translator and Bob Moderator
    cy.contains('Jane Translator').should('be.visible')
    cy.contains('Bob Moderator').should('be.visible')
  })

  it('should display user emails', () => {
    cy.contains('jane@example.com').should('be.visible')
    cy.contains('bob@example.com').should('be.visible')
  })

  it('should show role badges for project members', () => {
    cy.contains('Translator').should('be.visible')
    cy.contains('Moderator').should('be.visible')
  })

  it('should have an "Add a user" button', () => {
    cy.contains('Add a user').should('be.visible')
  })

  it('should open the add user modal in "select" mode when clicking "Add a user"', () => {
    cy.fixture('users').then((users) => {
      cy.intercept('GET', '/api/users*', { body: [users[0]] }).as('getAvailableUsersForModal')
    })

    cy.contains('Add a user').click()

    // Modal in select mode shows a search input and user list
    cy.contains('Add a user to the project').should('be.visible')
    cy.get('input[placeholder*="Search"]').should('be.visible')
  })

  it('should show "Add to project" button in the select mode modal', () => {
    cy.contains('Add a user').click()
    cy.contains('Add to project').should('be.visible')
  })

  it('should show "Create a new user" option in the modal', () => {
    cy.contains('Add a user').click()
    cy.contains('Create a new user').should('be.visible')
  })

  it('should switch to create mode when clicking "Create a new user"', () => {
    cy.contains('Add a user').click()
    cy.contains('Create a new user').click()
    cy.contains('Full name').should('be.visible')
    cy.contains('Email').should('be.visible')
  })

  it('should close the modal when clicking Cancel', () => {
    cy.contains('Add a user').click()
    cy.contains('Add a user to the project').should('be.visible')
    cy.contains('Cancel').click()
    cy.contains('Add a user to the project').should('not.exist')
  })

  it('should have a dropdown menu for each project user', () => {
    cy.get('button').filter(':has([class*="ellipsis"])').should('have.length.at.least', 1)
  })

  it('should show "Edit role" option in user dropdown', () => {
    cy.get('button').filter(':has([class*="ellipsis"])').first().click({ force: true })
    cy.contains('Edit role').should('be.visible')
  })
})

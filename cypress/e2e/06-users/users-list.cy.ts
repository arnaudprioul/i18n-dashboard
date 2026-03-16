describe('Users list', () => {
  beforeEach(() => {
    cy.mockAllApis()
    cy.visit('/users')
  })

  it('should display the users page heading', () => {
    cy.contains('All users').should('be.visible')
  })

  it('should list the 3 users from the fixture', () => {
    cy.contains('Admin User').should('be.visible')
    cy.contains('Jane Translator').should('be.visible')
    cy.contains('Bob Moderator').should('be.visible')
  })

  it('should display user email addresses', () => {
    cy.contains('admin@example.com').should('be.visible')
    cy.contains('jane@example.com').should('be.visible')
    cy.contains('bob@example.com').should('be.visible')
  })

  it('should display a "Super Admin" badge for the admin user', () => {
    cy.contains('Super Admin').should('be.visible')
  })

  it('should show role badges for users with roles', () => {
    // Jane has translator role, Bob has moderator role
    cy.contains('Translator').should('be.visible')
    cy.contains('Moderator').should('be.visible')
  })

  it('should show project name alongside role', () => {
    cy.contains('My App').should('be.visible')
  })

  it('should have an "Add a user" button', () => {
    cy.contains('Add a user').should('be.visible')
  })

  it('should open the add user modal when clicking "Add a user"', () => {
    cy.contains('Add a user').click()
    cy.contains('Add a user').should('be.visible')
    cy.contains('Full name').should('be.visible')
    cy.contains('Email').should('be.visible')
  })

  it('should navigate to user profile when clicking on a user row', () => {
    cy.fixture('profile').then((profile) => {
      cy.intercept('GET', '/api/users/2/profile*', { body: profile }).as('getProfile')
    })

    cy.contains('Jane Translator').click()
    cy.url().should('include', '/users/2/profile')
  })

  it('should display last login info for users', () => {
    // Bob has last_login_at: null → "Never logged in"
    cy.contains('Never logged in').should('be.visible')
  })

  it('should display dropdown menu for each user', () => {
    cy.get('button').filter(':has([class*="ellipsis"])').should('have.length.at.least', 1)
  })
})

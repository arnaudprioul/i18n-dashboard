describe('Users list', () => {
  beforeEach(() => {
    cy.login()
    cy.mockAllApis()
    cy.visit('/users')
    cy.wait('@getUsers')
  })

  it('should display the users page heading', () => {
    cy.get('[data-cy="all-users-title"]').should('be.visible')
  })

  it('should list all users from the fixture', () => {
    cy.contains('Admin User').should('be.visible')
    cy.contains('Jane Translator').should('be.visible')
    cy.contains('Bob Moderator').should('be.visible')
  })

  it('should display user email addresses', () => {
    cy.contains('admin@example.com').should('be.visible')
    cy.contains('jane@example.com').should('be.visible')
    cy.contains('bob@example.com').should('be.visible')
  })

  it('should have an "Add a user" button', () => {
    cy.get('[data-cy="global-users-add-btn"]').should('be.visible')
  })

  it('should open the add user modal when clicking "Add a user"', () => {
    cy.get('[data-cy="global-users-add-btn"]').click()
    cy.contains('Add a user').should('be.visible')
  })

  it('should navigate to user profile when clicking on a user row', () => {
    cy.get('[data-cy="user-row-2"]').click()
    cy.url().should('include', '/users/2/profile')
  })
})

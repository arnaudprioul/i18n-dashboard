describe('User profile', () => {
  beforeEach(() => {
    cy.mockAllApis()
    cy.fixture('profile').then((profile) => {
      cy.intercept('GET', '/api/users/2/profile*', { body: profile }).as('getProfile')
      cy.intercept('GET', '/api/users/2/profile', { body: profile }).as('getProfileExact')
    })
    cy.visit('/users/2/profile')
  })

  it('should display the user name in the header', () => {
    cy.contains('Jane Translator').should('be.visible')
  })

  it('should display the user email', () => {
    cy.contains('jane@example.com').should('be.visible')
  })

  it('should show member since date', () => {
    cy.contains('Member since').should('be.visible')
  })

  it('should display stats activity section', () => {
    cy.contains('Activity').should('be.visible')
  })

  it('should display total translations stat card', () => {
    cy.contains('Total translations').should('be.visible')
    // profile fixture stats.total: 128
    cy.contains('128').should('be.visible')
  })

  it('should display a period selector', () => {
    cy.contains('Since account creation').should('be.visible')
  })

  it('should show the Projects & Roles section', () => {
    cy.contains('Projects & Roles').should('be.visible')
  })

  it('should display the user role in the project', () => {
    cy.contains('My App').should('be.visible')
    cy.contains('Translator').should('be.visible')
  })

  it('should show the Languages section', () => {
    cy.contains('Languages').should('be.visible')
  })

  it('should display the recent activity section', () => {
    cy.contains('Recent activity').should('be.visible')
  })

  it('should show recent translation history entries', () => {
    // profile fixture recentTranslations: home.title changed "Bonjour" → "Bienvenue"
    cy.contains('home.title').should('be.visible')
    cy.contains('Bienvenue').should('be.visible')
  })

  it('should show old and new values in recent activity', () => {
    cy.contains('Bonjour').should('be.visible')
  })

  it('should have a Manage access button for authorized viewers', () => {
    // Admin user (is_super_admin: true) sees the manage button
    cy.contains('Manage access').should('be.visible')
  })
})

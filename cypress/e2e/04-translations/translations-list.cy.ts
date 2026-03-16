describe('Translations list', () => {
  beforeEach(() => {
    cy.login()
    cy.mockAllApis()
    cy.visit('/projects/1/translations')
    cy.wait('@getLanguages')
    cy.wait('@getKeys')
  })

  it('should display the translations page heading', () => {
    cy.contains('h1', 'Translations').should('be.visible')
  })

  it('should have a search input', () => {
    cy.get('input[placeholder*="Search for a key"]').should('be.visible')
  })

  it('should display status filter pills', () => {
    cy.contains('All').should('be.visible')
    cy.contains('Missing').should('be.visible')
    cy.contains('Draft').should('be.visible')
    cy.contains('Reviewed').should('be.visible')
    cy.contains('Approved').should('be.visible')
  })

  it('should list translation keys from fixture', () => {
    cy.contains('home.title').should('be.visible')
    cy.contains('home.subtitle').should('be.visible')
    cy.contains('nav.home').should('be.visible')
    cy.contains('nav.about').should('be.visible')
  })

  it('should have a "New key" button', () => {
    cy.contains('New key').should('be.visible')
  })

  it('should open the add key modal when clicking "New key"', () => {
    cy.contains('New key').click()
    cy.contains('New translation key').should('be.visible')
  })

  it('should close the add key modal when clicking Cancel', () => {
    cy.contains('New key').click()
    cy.contains('New translation key').should('be.visible')
    cy.contains('Cancel').click()
    cy.contains('New translation key').should('not.exist')
  })

  it('should navigate to key detail when clicking a key row', () => {
    cy.intercept('GET', '/api/keys/1', { fixture: 'key-detail' }).as('getKeyDetailNav')
    cy.contains('home.title').click()
    cy.url().should('include', '/projects/1/translations/1')
  })

  it('should display the Unused pill for unused keys', () => {
    // nav.about has is_unused: true in the fixture
    cy.contains('nav.about').should('be.visible')
    cy.contains('Unused').should('be.visible')
  })
})

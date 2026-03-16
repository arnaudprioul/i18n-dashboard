describe('Translations list', () => {
  beforeEach(() => {
    cy.login()
    cy.mockAllApis()
    cy.visit('/projects/1/translations')
    cy.wait('@getLanguages')
    cy.wait('@getKeys')
  })

  it('should display the translations page heading', () => {
    cy.get('[data-cy="translations-title"]').should('be.visible')
  })

  it('should have a search input', () => {
    cy.get('[data-cy="translations-search"]').should('be.visible')
  })

  it('should display status filter pills', () => {
    cy.get('[data-cy="filter-all"]').should('be.visible')
    cy.get('[data-cy="filter-missing"]').should('be.visible')
    cy.get('[data-cy="filter-draft"]').should('be.visible')
    cy.get('[data-cy="filter-reviewed"]').should('be.visible')
    cy.get('[data-cy="filter-approved"]').should('be.visible')
  })

  it('should list translation keys from fixture', () => {
    cy.contains('home.title').should('be.visible')
    cy.contains('home.subtitle').should('be.visible')
    cy.contains('nav.home').should('be.visible')
    cy.contains('nav.about').should('be.visible')
  })

  it('should have a "New key" button', () => {
    cy.get('[data-cy="new-key-btn"]').should('be.visible')
  })

  it('should open the add key modal when clicking "New key"', () => {
    cy.get('[data-cy="new-key-btn"]').click()
    cy.get('[data-cy="add-key-modal"]').should('be.visible')
  })

  it('should close the add key modal when clicking Cancel', () => {
    cy.get('[data-cy="new-key-btn"]').click()
    cy.get('[data-cy="add-key-modal"]').should('be.visible')
    cy.get('[data-cy="add-key-cancel-btn"]').click()
    cy.get('[data-cy="add-key-modal"]').should('not.exist')
  })

  it('should navigate to key detail when clicking a key row', () => {
    cy.intercept('GET', '/api/keys/1', { fixture: 'key-detail' }).as('getKeyDetailNav')
    cy.contains('home.title').click()
    cy.url().should('include', '/projects/1/translations/1')
  })

  it('should display the Unused pill for unused keys', () => {
    cy.contains('nav.about').should('be.visible')
    cy.contains('Unused').should('be.visible')
  })
})

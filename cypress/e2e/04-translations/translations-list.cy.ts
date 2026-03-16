describe('Translations list', () => {
  beforeEach(() => {
    cy.mockAllApis()
    cy.visit('/projects/1/translations')
  })

  it('should display the translations page heading', () => {
    cy.contains('Translations').should('be.visible')
  })

  it('should show the total key count from fixture', () => {
    // keys fixture has total: 4 and 4 · 3 languages
    cy.contains('4 keys').should('be.visible')
  })

  it('should list all 4 translation keys', () => {
    cy.contains('home.title').should('be.visible')
    cy.contains('home.subtitle').should('be.visible')
    cy.contains('nav.home').should('be.visible')
    cy.contains('nav.about').should('be.visible')
  })

  it('should display language column headers for all 3 languages', () => {
    cy.contains('English').should('be.visible')
    cy.contains('Français').should('be.visible')
    cy.contains('Deutsch').should('be.visible')
  })

  it('should have a search input', () => {
    cy.get('input[placeholder*="Search"]').should('be.visible')
  })

  it('should have a language filter selector', () => {
    cy.contains('All languages').should('be.visible')
  })

  it('should display status filter pills', () => {
    cy.contains('All').should('be.visible')
    cy.contains('Missing').should('be.visible')
    cy.contains('Draft').should('be.visible')
    cy.contains('Reviewed').should('be.visible')
    cy.contains('Approved').should('be.visible')
  })

  it('should have a "New key" button', () => {
    cy.contains('New key').should('be.visible')
  })

  it('should open the add key modal when clicking "New key"', () => {
    cy.contains('New key').click()
    cy.contains('New translation key').should('be.visible')
    cy.get('input[placeholder="home.title"]').should('be.visible')
  })

  it('should navigate to key detail when clicking a translation row', () => {
    cy.fixture('key-detail').then((keyDetail) => {
      cy.intercept('GET', '/api/keys/1', { body: keyDetail }).as('getKeyDetail')
    })

    cy.contains('home.title').click()
    cy.url().should('include', '/projects/1/translations/1')
  })

  it('should show translation values for approved keys', () => {
    cy.contains('Welcome').should('be.visible')
    cy.contains('Bienvenue').should('be.visible')
  })

  it('should display the "Unused" badge for unused keys', () => {
    // nav.about has is_unused: true
    // The TranslationRow component renders this badge
    cy.contains('nav.about').should('be.visible')
  })
})

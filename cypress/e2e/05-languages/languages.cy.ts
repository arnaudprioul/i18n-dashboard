describe('Languages', () => {
  beforeEach(() => {
    cy.login()
    cy.mockAllApis()
    cy.visit('/projects/1/languages')
    cy.wait('@getLanguages')
  })

  it('should display the languages page heading', () => {
    cy.contains('h1', 'Languages').should('be.visible')
  })

  it('should list the 3 languages from the fixture', () => {
    cy.contains('English').should('be.visible')
    cy.contains('Français').should('be.visible')
    cy.contains('Deutsch').should('be.visible')
  })

  it('should display language codes', () => {
    cy.contains('en').should('be.visible')
    cy.contains('fr').should('be.visible')
    cy.contains('de').should('be.visible')
  })

  it('should display a "Default" badge for the default language', () => {
    // English (en) has is_default: true in the fixture
    cy.contains('Default').should('be.visible')
  })

  it('should show coverage percentages', () => {
    cy.contains('100%').should('be.visible')
  })

  it('should have an "Add a language" button', () => {
    cy.contains('Add a language').should('be.visible')
  })

  it('should open the add language modal with a search input', () => {
    cy.contains('Add a language').click()
    cy.contains('Add a language').should('be.visible')
    cy.get('input[placeholder*="Search"]').should('be.visible')
  })

  it('should close the add language modal when clicking Cancel', () => {
    cy.contains('Add a language').click()
    cy.contains('Cancel').click()
    cy.get('input[placeholder*="Search"]').should('not.exist')
  })
})

describe('Languages', () => {
  beforeEach(() => {
    cy.login()
    cy.mockAllApis()
    cy.visit('/projects/1/languages')
    cy.wait('@getLanguages')
  })

  it('should display the languages page heading', () => {
    cy.get('[data-cy="languages-title"]').should('be.visible')
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
    cy.get('[data-cy="lang-default-badge-en"]').should('be.visible')
  })

  it('should show coverage percentages', () => {
    cy.get('[data-cy="lang-coverage-en"]').should('be.visible')
  })

  it('should have an "Add a language" button', () => {
    cy.get('[data-cy="languages-add-btn"]').should('be.visible')
  })

  it('should open the add language modal with a search input', () => {
    cy.get('[data-cy="languages-add-btn"]').click()
    cy.contains('Add a language').should('be.visible')
    cy.get('[data-cy="lang-search-input"]').should('be.visible')
  })

  it('should close the add language modal when clicking Cancel', () => {
    cy.get('[data-cy="languages-add-btn"]').click()
    cy.get('[data-cy="add-language-cancel-btn"]').click()
    cy.get('[data-cy="lang-search-input"]').should('not.exist')
  })
})

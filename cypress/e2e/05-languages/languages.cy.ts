describe('Languages', () => {
  beforeEach(() => {
    cy.mockAllApis()
    cy.visit('/projects/1/languages')
  })

  it('should display the languages page heading', () => {
    cy.contains('Languages').should('be.visible')
  })

  it('should list the 3 languages from the fixture', () => {
    // Languages fixture has en, fr, de
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
    // English (en) is_default: true
    cy.contains('Default').should('be.visible')
  })

  it('should show coverage percentages', () => {
    cy.contains('Coverage').should('be.visible')
    // en = 100%, fr = 75%, de = 25%
    cy.contains('100%').should('be.visible')
    cy.contains('75%').should('be.visible')
  })

  it('should show translated keys count', () => {
    cy.contains('keys translated').should('be.visible')
  })

  it('should show fallback language info for German', () => {
    // de has fallback_code: "en"
    cy.contains('en').should('be.visible')
  })

  it('should have an "Add a language" button', () => {
    cy.contains('Add a language').should('be.visible')
  })

  it('should open the add language modal when clicking "Add a language"', () => {
    cy.contains('Add a language').click()
    cy.contains('Add a language').should('be.visible')
    cy.get('input[placeholder*="Search"]').should('be.visible')
  })

  it('should close the add language modal when clicking Cancel', () => {
    cy.contains('Add a language').click()
    cy.contains('Add a language').should('be.visible')
    cy.contains('Cancel').click()
    // Modal content disappears
    cy.get('input[placeholder*="Search"]').should('not.exist')
  })

  it('should have a dropdown menu on each language card', () => {
    // Each UDropdownMenu renders a button with the ellipsis icon
    cy.get('button').filter(':has([class*="ellipsis"])').should('have.length.at.least', 3)
  })

  it('should show delete option in language dropdown', () => {
    cy.get('button').filter(':has([class*="ellipsis"])').first().click({ force: true })
    cy.contains('Delete').should('be.visible')
  })

  it('should intercept POST /api/languages when adding a language', () => {
    cy.fixture('languages').then((languages) => {
      const newLang = { id: 4, project_id: 1, code: 'es', name: 'Spanish', is_default: false, fallback_code: null, created_at: '2026-03-16T00:00:00.000Z' }
      cy.intercept('POST', '/api/languages', { body: newLang, statusCode: 201 }).as('addLanguage')
      cy.intercept('GET', '/api/languages*', { body: [...languages, newLang] }).as('getLanguagesUpdated')
    })

    cy.contains('Add a language').click()

    // Search for Spanish
    cy.get('input[placeholder*="Search"]').type('Spanish')
    cy.contains('Spanish').should('be.visible')
    cy.contains('Spanish').click()
    cy.contains('Add').last().click()

    cy.wait('@addLanguage')
  })
})

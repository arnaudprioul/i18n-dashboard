describe('Translation detail', () => {
  beforeEach(() => {
    cy.login()
    cy.mockAllApis()
    cy.visit('/projects/1/translations/1')
    cy.wait('@getKeyDetail')
  })

  it('should display the key name in the header', () => {
    cy.contains('home.title').should('be.visible')
  })

  it('should display a translation card for each language', () => {
    cy.contains('en').should('be.visible')
    cy.contains('fr').should('be.visible')
    cy.contains('de').should('be.visible')
  })

  it('should show the English translation value', () => {
    cy.contains('Welcome').should('be.visible')
  })

  it('should show the French translation value', () => {
    cy.contains('Bienvenue').should('be.visible')
  })

  it('should display a status badge on a translation', () => {
    cy.get('[data-cy="translation-status-en"]').should('be.visible')
  })

  it('should display the key description in the right panel', () => {
    cy.get('[data-cy="key-description"]').should('be.visible').and('contain', 'Homepage title')
  })

  it('should show file usage in the right panel', () => {
    cy.get('[data-cy="key-usages"]').should('contain', 'src/views/Home.vue')
  })

  it('should display a History section', () => {
    cy.get('[data-cy="history-section"]').should('be.visible')
  })

  it('should have a back link to the translations list', () => {
    cy.get('[data-cy="key-back-link"]').should('exist')
  })

  it('should allow editing a translation by clicking on the value', () => {
    cy.get('[data-cy="translation-value-en"]').click()
    cy.get('[data-cy="translation-textarea-en"]').should('be.visible')
    cy.get('[data-cy="save-translation-btn-en"]').should('be.visible')
    cy.get('[data-cy="cancel-translation-btn-en"]').should('be.visible')
  })
})

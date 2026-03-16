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
    cy.contains('Approved').should('be.visible')
  })

  it('should display the key description in the right panel', () => {
    cy.contains('Homepage title').should('be.visible')
  })

  it('should show file usage in the right panel', () => {
    cy.contains('src/views/Home.vue').should('be.visible')
  })

  it('should display a History section', () => {
    cy.contains('History').should('be.visible')
  })

  it('should have a back link to the translations list', () => {
    cy.get('a[href="/projects/1/translations"]').should('exist')
  })

  it('should allow editing a translation by clicking on the value', () => {
    cy.contains('Welcome').click()
    cy.get('textarea').should('be.visible')
    cy.contains('Save').should('be.visible')
    cy.contains('Cancel').should('be.visible')
  })
})

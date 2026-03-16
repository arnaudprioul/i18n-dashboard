describe('Translation detail', () => {
  beforeEach(() => {
    cy.mockAllApis()
    cy.fixture('key-detail').then((keyDetail) => {
      cy.intercept('GET', '/api/keys/1', { body: keyDetail }).as('getKeyDetail')
      cy.intercept('GET', '/api/keys/1*', { body: keyDetail }).as('getKeyDetailWild')
    })
    cy.visit('/projects/1/translations/1')
  })

  it('should display the key name in the header', () => {
    cy.contains('home.title').should('be.visible')
  })

  it('should show the language coverage count', () => {
    // en and fr have values, de does not → 2 / 3 languages
    cy.contains('2 / 3').should('be.visible')
    cy.contains('languages').should('be.visible')
  })

  it('should display a card for each language', () => {
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

  it('should show the German card as empty (draft)', () => {
    cy.contains('Click to add...').should('be.visible')
  })

  it('should display status badges for translations', () => {
    cy.contains('Approved').should('be.visible')
  })

  it('should display the key description in the right panel', () => {
    cy.contains('Homepage title').should('be.visible')
  })

  it('should show file usage in the right panel', () => {
    cy.contains('src/views/Home.vue').should('be.visible')
  })

  it('should display the history toggle for the English translation', () => {
    // en has 1 history entry in key-detail fixture
    cy.contains('History').should('be.visible')
    cy.contains('· 1').should('be.visible')
  })

  it('should expand history when clicking the toggle', () => {
    cy.contains('History').click()
    // History entry: changed from "Hi" to "Welcome" by "Admin User"
    cy.contains('Welcome').should('be.visible')
    cy.contains('Admin User').should('be.visible')
  })

  it('should have a back button to return to translations list', () => {
    cy.get('a[href="/projects/1/translations"]').should('exist')
  })

  it('should allow editing a translation by clicking on the value', () => {
    cy.contains('Welcome').click()
    cy.get('textarea').should('be.visible')
    cy.contains('Save').should('be.visible')
    cy.contains('Cancel').should('be.visible')
  })
})

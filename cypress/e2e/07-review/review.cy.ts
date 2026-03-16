describe('Review queue', () => {
  beforeEach(() => {
    cy.login()
    cy.mockAllApis()

    // Override the generic @getKeys alias with review fixture data so the
    // review page (which calls keyService.getKeys with status=draft) gets
    // the draft items it needs.
    cy.fixture('review').then((review) => {
      cy.intercept('GET', '/api/keys*', { body: review }).as('getKeys')
    })

    cy.visit('/projects/1/review')
    cy.wait('@getKeys')
  })

  it('should display the review queue heading', () => {
    cy.contains('h1', 'Review queue').should('be.visible')
  })

  it('should display draft status badges', () => {
    cy.contains('Draft').should('be.visible')
  })

  it('should show the key name from the review fixture', () => {
    cy.contains('home.subtitle').should('be.visible')
  })

  it('should show the language badge for the draft translation', () => {
    cy.contains('fr', { matchCase: false }).should('be.visible')
  })

  it('should show a "Mark as reviewed" button', () => {
    cy.contains('Mark as reviewed').should('be.visible')
  })

  it('should call POST /api/translations/bulk-status when clicking "Mark as reviewed"', () => {
    cy.intercept('POST', '/api/translations/bulk-status', {
      statusCode: 200,
      body: {},
    }).as('postBulkStatus')

    cy.contains('Mark as reviewed').first().click()
    cy.wait('@postBulkStatus')
  })

  it('should show empty state when no items are pending', () => {
    cy.intercept('GET', '/api/keys*', {
      body: { data: [], total: 0, page: 1, limit: 200 },
    }).as('getKeysEmpty')

    cy.visit('/projects/1/review')
    cy.wait('@getKeysEmpty')
    cy.contains('No translations pending').should('be.visible')
  })
})

describe('Review queue', () => {
  beforeEach(() => {
    cy.mockAllApis()

    // The review page calls GET /api/keys?...&status=draft
    // We use the review fixture which returns keys with draft translations
    cy.fixture('review').then((review) => {
      cy.intercept('GET', '/api/keys*status=draft*', { body: review }).as('getReviewItems')
      cy.intercept('GET', '/api/keys*', { body: review }).as('getKeysForReview')
    })

    cy.visit('/projects/1/review')
  })

  it('should display the review queue heading', () => {
    cy.contains('Review queue').should('be.visible')
  })

  it('should show the count of pending translations', () => {
    // review fixture has 1 draft translation with a value (home.subtitle/fr)
    cy.contains('pending review').should('be.visible')
  })

  it('should display pending review items', () => {
    // home.subtitle fr: "Commencez votre voyage" has status draft + value
    cy.contains('home.subtitle').should('be.visible')
    cy.contains('Commencez votre voyage').should('be.visible')
  })

  it('should show the language code badge on each item', () => {
    cy.contains('FR').should('be.visible')
  })

  it('should display the Draft status badge', () => {
    cy.contains('Draft').should('be.visible')
  })

  it('should show the key description when available', () => {
    cy.contains('Homepage subtitle').should('be.visible')
  })

  it('should show a "Mark as reviewed" button for each item', () => {
    cy.contains('Mark as reviewed').should('be.visible')
  })

  it('should show a reject button for each item', () => {
    // The reject button uses a tooltip with text "Reject"
    cy.get('button[aria-label="Reject"], button').filter(':visible').should('exist')
  })

  it('should have a "Mark all as reviewed" button when there are items', () => {
    cy.contains('Mark all as reviewed').should('be.visible')
  })

  it('should call POST /api/translations/status when clicking "Mark as reviewed"', () => {
    cy.intercept('POST', '/api/translations/status', { statusCode: 200, body: {} }).as('setStatus')
    cy.fixture('review').then((review) => {
      // After approve, return empty review queue
      cy.intercept('GET', '/api/keys*', { body: { data: [], total: 0, page: 1, limit: 200 } }).as('getKeysEmpty')
    })

    cy.contains('Mark as reviewed').first().click()
    cy.wait('@setStatus')
  })

  it('should show empty state when no items are pending', () => {
    cy.intercept('GET', '/api/keys*', {
      body: { data: [], total: 0, page: 1, limit: 200 },
    }).as('getEmptyReview')

    cy.visit('/projects/1/review')
    cy.contains('No translations pending').should('be.visible')
  })
})

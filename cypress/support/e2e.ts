import './commands'

beforeEach(() => {
  // Silence uncaught exceptions from app (e.g. navigation errors)
  cy.on('uncaught:exception', () => false)

  // The ui-i18n plugin calls GET /api/ui-locale?lang=* on every page load
  // (both server and client). If not mocked it fails during hydration and
  // triggers a re-render that can clear inputs mid-test.
  cy.intercept('GET', '/api/ui-locale*', { body: {} }).as('uiLocale')
})

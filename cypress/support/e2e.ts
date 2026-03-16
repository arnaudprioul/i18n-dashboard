import './commands'

beforeEach(() => {
  // Silence uncaught exceptions from app (e.g. navigation errors)
  cy.on('uncaught:exception', () => false)
})

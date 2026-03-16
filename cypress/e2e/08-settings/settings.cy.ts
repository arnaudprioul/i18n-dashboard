describe('Settings', () => {
  beforeEach(() => {
    cy.login()
    cy.mockAllApis()
    cy.visit('/projects/1/settings')
    cy.wait('@getSettings')
  })

  it('should display the settings page heading', () => {
    cy.get('[data-cy="settings-title"]').should('be.visible')
  })

  it('should display the vue-i18n Scanner section', () => {
    cy.contains('vue-i18n Scanner').should('be.visible')
  })

  it('should show the scan_exclude input', () => {
    cy.get('[data-cy="settings-scan-exclude"]').should('exist')
  })

  it('should have a Save button', () => {
    cy.get('[data-cy="settings-save-btn"]').should('be.visible')
  })

  it('should call POST /api/settings when clicking Save', () => {
    cy.intercept('POST', '/api/settings', { statusCode: 200, body: {} }).as('saveSettings')
    cy.get('[data-cy="settings-save-btn"]').click()
    cy.wait('@saveSettings')
  })

  it('should display the Export translations section', () => {
    cy.contains('Export').should('be.visible')
  })

  it('should show an "Export all" button', () => {
    cy.get('[data-cy="settings-export-all-btn"]').should('be.visible')
  })

  it('should show per-language export buttons', () => {
    cy.wait('@getLanguages')
    cy.get('[data-cy="export-lang-btn-en"]').should('be.visible')
    cy.get('[data-cy="export-lang-btn-fr"]').should('be.visible')
    cy.get('[data-cy="export-lang-btn-de"]').should('be.visible')
  })
})

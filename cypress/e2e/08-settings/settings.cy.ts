describe('Settings', () => {
  beforeEach(() => {
    cy.login()
    cy.mockAllApis()
    cy.visit('/projects/1/settings')
    cy.wait('@getSettings')
  })

  it('should display the settings page heading', () => {
    cy.contains('h1', 'Settings').should('be.visible')
  })

  it('should display the vue-i18n Scanner section', () => {
    cy.contains('vue-i18n Scanner').should('be.visible')
  })

  it('should show the scan_exclude input', () => {
    // Input has placeholder "node_modules,dist,.nuxt,.output"
    cy.get('input[placeholder*="node_modules"]').should('exist')
  })

  it('should have a Save button', () => {
    cy.contains('Save').should('be.visible')
  })

  it('should call POST /api/settings when clicking Save', () => {
    cy.intercept('POST', '/api/settings', { statusCode: 200, body: {} }).as('saveSettings')
    cy.contains('Save').click()
    cy.wait('@saveSettings')
  })

  it('should display the Export translations section', () => {
    cy.contains('Export').should('be.visible')
  })

  it('should show an "Export all" button', () => {
    cy.contains('Export all').should('be.visible')
  })

  it('should show per-language export buttons', () => {
    cy.wait('@getLanguages')
    cy.contains('en.json').should('be.visible')
    cy.contains('fr.json').should('be.visible')
    cy.contains('de.json').should('be.visible')
  })
})

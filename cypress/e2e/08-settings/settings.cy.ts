describe('Settings', () => {
  beforeEach(() => {
    cy.mockAllApis()
    cy.intercept('GET', '/api/projects/1*', {
      body: {
        id: 1,
        name: 'My App',
        root_path: '/home/user/my-app',
        locales_path: 'src/locales',
        key_separator: '.',
        color: 'primary',
        description: 'Main application',
        is_system: false,
        key_count: 42,
        language_count: 3,
        git_repo: null,
        created_at: '2026-01-01T00:00:00.000Z',
      },
    }).as('getProject')
    cy.visit('/projects/1/settings')
  })

  it('should display the settings page heading', () => {
    cy.contains('Settings').should('be.visible')
  })

  it('should display the settings page subtitle', () => {
    cy.contains('Global dashboard configuration').should('be.visible')
  })

  it('should show the current project settings section', () => {
    cy.contains('Current project').should('be.visible')
  })

  it('should show the project name in the form', () => {
    cy.get('input[placeholder*="My project"]').should('have.value', 'My App')
  })

  it('should display the Scanner settings section', () => {
    cy.contains('vue-i18n Scanner').should('be.visible')
  })

  it('should show the scan_exclude field with the correct fixture value', () => {
    // settings fixture: scan_exclude = "node_modules,dist,.nuxt"
    cy.get('input[placeholder*="node_modules"]').should('have.value', 'node_modules,dist,.nuxt')
  })

  it('should display the Google Translate section', () => {
    cy.contains('Google Translate').should('be.visible')
  })

  it('should show the Google Translate API key field', () => {
    cy.contains('Google Translate API Key').should('be.visible')
  })

  it('should display the API Endpoints section', () => {
    cy.contains('API Endpoints').should('be.visible')
  })

  it('should show locale endpoint example', () => {
    cy.contains('/locale/en.json').should('be.visible')
  })

  it('should have a Save button', () => {
    cy.contains('Save').should('be.visible')
  })

  it('should call POST /api/settings when clicking Save', () => {
    cy.intercept('POST', '/api/settings', { statusCode: 200, body: {} }).as('saveSettings')
    cy.intercept('PUT', '/api/projects/1', { statusCode: 200, body: {} }).as('saveProject')

    cy.contains('Save').click()
    cy.wait('@saveSettings')
  })

  it('should display detected scanner functions', () => {
    cy.contains('$t()').should('be.visible')
    cy.contains('$tc()').should('be.visible')
  })

  it('should show export section when a project is selected', () => {
    cy.contains('Export translations').should('be.visible')
  })

  it('should show per-language export buttons', () => {
    cy.contains('en.json').should('be.visible')
    cy.contains('fr.json').should('be.visible')
    cy.contains('de.json').should('be.visible')
  })

  it('should show the Project snapshot section', () => {
    cy.contains('Project snapshot').should('be.visible')
    cy.contains('Export snapshot').should('be.visible')
    cy.contains('Import snapshot').should('be.visible')
  })

  it('should show the Advanced features section', () => {
    cy.contains('Advanced features').should('be.visible')
    cy.contains('Number formats').should('be.visible')
    cy.contains('Date formats').should('be.visible')
    cy.contains('Custom modifiers').should('be.visible')
  })
})

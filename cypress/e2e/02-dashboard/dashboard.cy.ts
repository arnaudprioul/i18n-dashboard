describe('Dashboard', () => {
  beforeEach(() => {
    cy.mockAllApis()
    cy.visit('/')
  })

  it('should display stats cards with key counts', () => {
    // The dashboard renders DashboardWidgetGrid which uses stats data
    // total_keys: 4, translated_keys: 3, approved_keys: 2
    cy.contains('4').should('be.visible')
  })

  it('should display language coverage information', () => {
    // Stats fixture has 3 languages: en (100%), fr (75%), de (25%)
    cy.contains('English').should('be.visible')
  })

  it('should show the current project name in the sidebar', () => {
    // projects fixture: first project is "My App"
    cy.contains('My App').should('be.visible')
  })

  it('should display the project switcher in the sidebar', () => {
    cy.contains('Projects').should('be.visible')
  })

  it('should show language progress bars', () => {
    // Language badges/names from stats fixture
    cy.contains('Français').should('be.visible')
  })
})

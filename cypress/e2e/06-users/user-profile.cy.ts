describe('User profile', () => {
  beforeEach(() => {
    cy.login()
    cy.mockAllApis()
    cy.visit('/users/2/profile')
    // useProfile has server: false → client-side fetch → interceptable
    cy.wait('@getUserProfile')
  })

  it('should display the user name in the header', () => {
    cy.contains('Jane Translator').should('be.visible')
  })

  it('should display the user email', () => {
    cy.contains('jane@example.com').should('be.visible')
  })

  it('should show a "Member since" date', () => {
    cy.contains('Member since').should('be.visible')
  })

  it('should display total translations stat card with value 128', () => {
    cy.contains('128').should('be.visible')
  })

  it('should display a period selector', () => {
    cy.contains('Since account creation').should('be.visible')
  })

  it('should show the Projects & Roles section', () => {
    cy.contains('Projects & Roles').should('be.visible')
  })

  it('should display the recent activity section', () => {
    cy.contains('Recent activity').should('be.visible')
  })

  it('should show recent translation history entries', () => {
    // profile fixture recentTranslations: home.title changed "Bonjour" → "Bienvenue"
    cy.contains('home.title').should('be.visible')
    cy.contains('Bienvenue').should('be.visible')
  })
})

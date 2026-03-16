describe('User profile', () => {
  beforeEach(() => {
    cy.login()
    cy.mockAllApis()
    cy.visit('/users/2/profile')
    // useProfile has server:false → client-side fetch → interceptable
    cy.wait('@getUserProfile')
  })

  it('should display the user name in the header', () => {
    cy.get('[data-cy="profile-username"]').should('be.visible')
  })

  it('should display the user email', () => {
    cy.get('[data-cy="profile-email"]').should('be.visible')
  })

  it('should show a "Member since" date', () => {
    cy.get('[data-cy="profile-member-since"]').should('be.visible')
  })

  it('should display total translations stat card with value 128', () => {
    cy.get('[data-cy="profile-stat-translations"]').should('contain', '128')
  })

  it('should display a period selector', () => {
    cy.get('[data-cy="profile-period-select"]').should('be.visible')
  })

  it('should show the Projects & Roles section', () => {
    cy.get('[data-cy="profile-projects-roles"]').should('be.visible')
  })

  it('should display the recent activity section', () => {
    cy.get('[data-cy="profile-recent-activity"]').should('be.visible')
  })

  it('should show recent translation history entries', () => {
    cy.contains('home.title').should('be.visible')
    cy.contains('Bienvenue').should('be.visible')
  })
})

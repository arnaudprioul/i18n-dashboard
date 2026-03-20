import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3333',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    video: false,
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 120000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    experimentalRunAllSpecs: true,
    // Credentials for cy.login() — override in cypress.env.json
    env: {
      ADMIN_EMAIL: 'admin@example.com',
      ADMIN_PASSWORD: 'admin',
    },
  },
})

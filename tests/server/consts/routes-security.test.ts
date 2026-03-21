// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { PUBLIC_ROUTES, SETUP_ONLY_ROUTES } from '~/consts/commons.const'

// ── Route configuration security ─────────────────────────────────────────────
// These tests act as a tripwire: if someone accidentally adds a sensitive
// endpoint back to PUBLIC_ROUTES (accessible without authentication), the
// test will fail immediately on the next CI run.

describe('PUBLIC_ROUTES — must not expose sensitive endpoints', () => {
  it('does NOT include /api/db-config (can reconfigure & reset the database)', () => {
    expect(PUBLIC_ROUTES).not.toContain('/api/db-config')
  })

  it('does NOT include any project management endpoint', () => {
    const sensitivePatterns = ['/api/projects', '/api/keys', '/api/translations', '/api/users', '/api/settings']
    for (const pattern of sensitivePatterns) {
      const leak = PUBLIC_ROUTES.find(r => r.startsWith(pattern))
      expect(leak, `${pattern} must not be in PUBLIC_ROUTES`).toBeUndefined()
    }
  })

  it('only exposes the minimum required auth and setup endpoints', () => {
    const expected = [
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/me',
      '/api/auth/refresh',
      '/api/auth/status',
      '/api/auth/forgot-password',
      '/api/auth/reset-password',
      '/api/setup',
      '/api/ui-locale',
      '/api/config',
    ]
    // Every public route must be in the expected whitelist
    for (const route of PUBLIC_ROUTES) {
      expect(expected, `Unexpected public route: ${route}`).toContain(route)
    }
  })
})

describe('SETUP_ONLY_ROUTES — dangerous endpoints gated behind onboarding check', () => {
  it('contains /api/db-config', () => {
    expect(SETUP_ONLY_ROUTES).toContain('/api/db-config')
  })

  it('is distinct from PUBLIC_ROUTES (setup-only routes are NOT freely public)', () => {
    for (const route of SETUP_ONLY_ROUTES) {
      expect(PUBLIC_ROUTES, `${route} must not also be in PUBLIC_ROUTES`).not.toContain(route)
    }
  })
})

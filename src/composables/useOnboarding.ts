import { onboardingService } from '../services/onboarding.service'
import type { IDbConfigPayload } from '../services/onboarding.service'

export function useOnboarding() {
  // ── DB config ───────────────────────────────────────────────────────────────

  async function getDbConfig(checkPath?: string) {
    return onboardingService.getDbConfig(checkPath)
  }

  async function saveDbConfig(data: IDbConfigPayload) {
    return onboardingService.saveDbConfig(data)
  }

  // ── Setup (first admin) ─────────────────────────────────────────────────────

  async function setup(data: { name: string; email: string; password: string }) {
    return onboardingService.setup(data)
  }

  // ── Languages ───────────────────────────────────────────────────────────────

  async function saveLanguages(languages: Array<{ code: string; name: string }>, defaultLanguage: string) {
    return onboardingService.saveLanguages({ languages, defaultLanguage })
  }

  // ── Initial data ────────────────────────────────────────────────────────────

  async function getAuthStatus() {
    return onboardingService.getAuthStatus()
  }

  async function getConfig() {
    return onboardingService.getConfig()
  }

  return {
    getDbConfig,
    saveDbConfig,
    setup,
    saveLanguages,
    getAuthStatus,
    getConfig,
  }
}

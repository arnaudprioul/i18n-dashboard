import { onboardingService } from '../services/onboarding.service'
import type { IDbConfigPayload } from '../services/onboarding.service'

export function useOnboarding() {
  // ── DB config ───────────────────────────────────────────────────────────────

  const getDbConfig = async (checkPath?: string) => {
    return onboardingService.getDbConfig(checkPath)
  }

  const saveDbConfig = async (data: IDbConfigPayload) => {
    return onboardingService.saveDbConfig(data)
  }

  // ── Setup (first admin) ─────────────────────────────────────────────────────

  const setup = async (data: { name: string; email: string; password: string }) => {
    return onboardingService.setup(data)
  }

  // ── Languages ───────────────────────────────────────────────────────────────

  const saveLanguages = async (languages: Array<{ code: string; name: string }>, defaultLanguage: string) => {
    return onboardingService.saveLanguages({ languages, defaultLanguage })
  }

  // ── Initial data ────────────────────────────────────────────────────────────

  const getAuthStatus = async () => {
    return onboardingService.getAuthStatus()
  }

  const getConfig = async () => {
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

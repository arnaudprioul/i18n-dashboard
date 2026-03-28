// Dashboard UI i18n composable
// Uses the "Dashboard UI" system project translations for the interface language.

import { languageService } from '../services/language.service'
import { localeService } from '../services/locale.service'

const _uiTranslations = ref<Record<string, string>>({})
const _uiLang = ref('en')

export function useT() {
  const translations = _uiTranslations
  const lang = _uiLang

  const loadTranslations = async (language: string)=>  {
    try {
      const data = await localeService.getUiLocale(language)
      translations.value = data
      lang.value = language
    } catch {
      // If the endpoint fails, keep whatever we have
    }
  }

  const t = (key: string, fallback?: string): string => {
    return translations.value[key] ?? fallback ?? key
  }

  const setLang = async (language: string) => {
    await loadTranslations(language)
    const cookie = useCookie('ui-lang', { maxAge: 60 * 60 * 24 * 365 })
    cookie.value = language
  }

  const getLangs = async (currentProjectId: string | number) => {
    return languageService.getLanguages(Number(currentProjectId))
  }

  return { t, lang, loadTranslations, setLang, getLangs }
}

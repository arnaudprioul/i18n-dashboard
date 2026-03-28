import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

vi.mock('~/services/language.service', () => ({
  languageService: {
    getLanguages: vi.fn().mockResolvedValue([]),
  },
}))

// useT uses module-level refs (_uiTranslations, _uiLang)
// We need to import the real useT (not the global stub) and also reset module state between tests
// Since the global stub is set in setup.ts, we must work around it for these tests.
// We unstub useT for this test file and import the real module.

import { useT } from '~/composables/useT'
import { languageService } from '~/services/language.service'

// The real useT uses $fetch (globally stubbed) and useCookie (globally stubbed)
// We need to ensure the module-level refs are reset between tests.
// We do this by calling loadTranslations with empty data to reset state.

describe('useT (real composable, not global stub)', () => {
  beforeEach(async () => {
    vi.mocked(languageService.getLanguages).mockReset()
    vi.mocked(globalThis.$fetch as any).mockReset()
    vi.mocked(globalThis.useCookie as any).mockReturnValue(ref(''))

    // Reset module-level translation state by loading empty translations
    vi.mocked(globalThis.$fetch as any).mockResolvedValue({})
    const { loadTranslations } = useT()
    await loadTranslations('en')
  })

  describe('t()', () => {
    it('returns the key itself when no translations loaded and no fallback', () => {
      const { t } = useT()
      expect(t('some.missing.key')).toBe('some.missing.key')
    })

    it('returns fallback when key not found and fallback provided', () => {
      const { t } = useT()
      expect(t('some.missing.key', 'Default text')).toBe('Default text')
    })

    it('returns translation value when key exists in loaded translations', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValue({
        'greeting': 'Hello World',
        'nav.home': 'Home',
      })

      const { loadTranslations, t } = useT()
      await loadTranslations('en')

      expect(t('greeting')).toBe('Hello World')
      expect(t('nav.home')).toBe('Home')
    })

    it('prefers translation over fallback when key exists', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValue({
        'settings.title': 'Settings',
      })

      const { loadTranslations, t } = useT()
      await loadTranslations('en')

      expect(t('settings.title', 'Fallback')).toBe('Settings')
    })
  })

  describe('loadTranslations', () => {
    it('calls $fetch with correct URL', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValue({})

      const { loadTranslations } = useT()
      await loadTranslations('fr')

      expect(globalThis.$fetch).toHaveBeenCalledWith('/api/ui-locale', expect.objectContaining({ query: { lang: 'fr' } }))
    })

    it('updates translations and lang on success', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValue({
        'hello': 'Bonjour',
      })

      const { loadTranslations, t, lang } = useT()
      await loadTranslations('fr')

      expect(lang.value).toBe('fr')
      expect(t('hello')).toBe('Bonjour')
    })

    it('keeps existing translations on error (does not clear them)', async () => {
      // Load some initial translations
      vi.mocked(globalThis.$fetch as any).mockResolvedValue({ 'key1': 'value1' })
      const { loadTranslations, t } = useT()
      await loadTranslations('en')
      expect(t('key1')).toBe('value1')

      // Now fail to load new translations
      vi.mocked(globalThis.$fetch as any).mockRejectedValue(new Error('Network error'))
      await loadTranslations('fr')

      // Previous translations should still be available
      expect(t('key1')).toBe('value1')
    })

    it('does not update lang on error', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValue({ 'x': 'y' })
      const { loadTranslations, lang } = useT()
      await loadTranslations('en')
      expect(lang.value).toBe('en')

      vi.mocked(globalThis.$fetch as any).mockRejectedValue(new Error('fail'))
      await loadTranslations('de')
      expect(lang.value).toBe('en')
    })
  })

  describe('getLangs', () => {
    it('calls languageService.getLanguages with numeric project id', async () => {
      const mockLangs = [{ id: 1, code: 'en', name: 'English', is_default: true, project_id: 1 }]
      vi.mocked(languageService.getLanguages).mockResolvedValue(mockLangs)

      const { getLangs } = useT()
      const result = await getLangs('3')

      expect(languageService.getLanguages).toHaveBeenCalledWith(3)
      expect(result).toEqual(mockLangs)
    })

    it('accepts numeric project id directly', async () => {
      vi.mocked(languageService.getLanguages).mockResolvedValue([])

      const { getLangs } = useT()
      await getLangs(5)

      expect(languageService.getLanguages).toHaveBeenCalledWith(5)
    })
  })

  describe('setLang', () => {
    it('calls loadTranslations and sets cookie value', async () => {
      const cookieRef = ref('')
      vi.mocked(globalThis.useCookie as any).mockReturnValue(cookieRef)
      vi.mocked(globalThis.$fetch as any).mockResolvedValue({ 'key': 'val' })

      const { setLang, lang } = useT()
      await setLang('fr')

      expect(globalThis.$fetch).toHaveBeenCalledWith('/api/ui-locale', expect.objectContaining({ query: { lang: 'fr' } }))
      expect(lang.value).toBe('fr')
      expect(cookieRef.value).toBe('fr')
    })

    it('creates cookie with correct name', async () => {
      vi.mocked(globalThis.$fetch as any).mockResolvedValue({})
      const cookieRef = ref('')
      vi.mocked(globalThis.useCookie as any).mockReturnValue(cookieRef)

      const { setLang } = useT()
      await setLang('de')

      expect(globalThis.useCookie).toHaveBeenCalledWith('ui-lang', expect.objectContaining({ maxAge: expect.any(Number) }))
    })
  })
})

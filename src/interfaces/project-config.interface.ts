export interface IDashboardConfig {
	uiLanguages?: string[]        // e.g. ["fr", "en", "es"]
	defaultUiLanguage?: string    // e.g. "fr"
	project?: {
		name?: string
		localesPath?: string
		keySeparator?: string
	}
}

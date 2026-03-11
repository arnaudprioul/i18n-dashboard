export interface DashboardConfig {
	uiLanguages?: string[]        // e.g. ["fr", "en", "es"]
	defaultUiLanguage?: string    // e.g. "fr"
	project?: {
		name?: string
		localesPath?: string
		keySeparator?: string
	}
}

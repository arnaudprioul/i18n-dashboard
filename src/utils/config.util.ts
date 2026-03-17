import { resolve } from 'path'
import { existsSync } from 'fs'

export async function loadUserConfig() {
	const configPath = resolve(process.cwd(), 'i18n-dashboard.config.js')
	const configPathMjs = resolve(process.cwd(), 'i18n-dashboard.config.mjs')

	if (existsSync(configPath)) {
		try {
			const mod = await import(configPath)

			return mod.default || mod
		} catch (e) {
			console.warn('Warning: Could not load i18n-dashboard.config.js:', e.message)
		}
	} else if (existsSync(configPathMjs)) {
		try {
			const mod = await import(configPathMjs)

			return mod.default || mod
		} catch (e) {
			console.warn('Warning: Could not load i18n-dashboard.config.mjs:', e.message)
		}
	}

	return {}
}

export function buildEnv(config) {
	const env = { ...process.env }

	if (config.port) env.I18N_PORT = String(config.port)
	if (config.keySeparator) env.I18N_KEY_SEPARATOR = config.keySeparator
	if (config.localesPath) env.I18N_LOCALES_PATH = config.localesPath
	if (config.apiPath) env.I18N_API_PATH = config.apiPath

	// Project root: explicit config > process.cwd()
	env.I18N_PROJECT_ROOT = config.projectRoot
		? resolve(config.projectRoot)
		: process.cwd()

	if (config.database) {
		if (config.database.client) env.I18N_DB_CLIENT = config.database.client
		if (config.database.connection) {
			if (typeof config.database.connection === 'string') {
				env.I18N_DB_CONNECTION = config.database.connection
			} else {
				if (config.database.connection.host) env.I18N_DB_HOST = config.database.connection.host
				if (config.database.connection.port) env.I18N_DB_PORT = String(config.database.connection.port)
				if (config.database.connection.user) env.I18N_DB_USER = config.database.connection.user
				if (config.database.connection.password) env.I18N_DB_PASSWORD = config.database.connection.password
				if (config.database.connection.database) env.I18N_DB_NAME = config.database.connection.database
			}
		}
	}

	if (config.googleTranslate?.apiKey) env.GOOGLE_TRANSLATE_API_KEY = config.googleTranslate.apiKey

	return env
}

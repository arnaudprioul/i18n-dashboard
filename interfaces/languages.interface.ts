export interface Language {
	code: string
	name: string
	nativeName: string
}

export interface LanguageItem {
	id: number
	code: string
	name: string
	is_default: boolean
	fallback_code: string | null
	project_id: number
	project_name?: string
	project_color?: string
}

export interface CreateLanguagePayload {
	project_id: number
	code: string
	name: string
	is_default?: boolean
}

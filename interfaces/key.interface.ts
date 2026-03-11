export interface KeysQuery {
	project_id?: number
	search?: string
	lang?: string
	status?: string
	page?: number
	limit?: number
}

export interface KeyItem {
	id: number
	key: string
	description?: string
	is_unused: boolean
	translations: Record<string, TranslationItem>
	usages: UsageItem[]
}

export interface TranslationItem {
	id: number
	value: string
	status: string
	language_code: string
	key_id: number
}

export interface UsageItem {
	file_path: string
	line_number: number
	detected_function: string
}

export interface KeysResponse {
	data: KeyItem[]
	total: number
	page: number
	limit: number
	languages: any[]
}

export interface IKeysQuery {
	project_id?: number
	search?: string
	lang?: string
	status?: string
	page?: number
	limit?: number
}

export interface IKeyItem {
	id: number
	key: string
	description?: string
	is_unused: boolean
	translations: Record<string, ITranslationItem>
	usages: IUsageItem[]
}

export interface ITranslationItem {
	id: number
	value: string
	status: string
	language_code: string
	key_id: number
}

export interface IUsageItem {
	file_path: string
	line_number: number
	detected_function: string
}

export interface IKeysResponse {
	data: IKeyItem[]
	total: number
	page: number
	limit: number
	languages: any[]
}

export interface ITranslationRowKey {
	id: number
	key: string
	description?: string
	is_unused?: boolean
	translations: Record<string, { id: number; value: string; language_code: string; status?: string } | undefined>
	usages?: IUsageItem[]
}

export interface ITranslationRowProps {
	translationKey: ITranslationRowKey
	languages: Array<{ code: string; name: string }>
	gridStyle: Record<string, string>
	projectId?: number
}

export interface ILinkedKeyPickerProps {
	projectId?: number
}

export interface ITranslationRowEmits {
	updated: []
}

export interface ILinkedKeyPickerEmits {
	select: [value: string]
}

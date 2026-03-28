export interface ILanguage {
	code: string
	name: string
	nativeName: string
}

export interface ILanguageItem {
	id: number
	code: string
	name: string
	is_default: boolean
	fallback_code: string | null
	project_id: number
	project_name?: string
	project_color?: string
}

export interface ICreateLanguagePayload {
	project_id: number
	code: string
	name: string
	is_default?: boolean
}

export interface ILanguagePickerItem {
	code: string
	name: string
	is_default: boolean
}

export interface ILanguagePickerProps {
	modelValue: ILanguagePickerItem[]
}

export interface ILanguagePickerEmits {
	'update:modelValue': [value: ILanguagePickerItem[]]
}

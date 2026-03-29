export interface ITranslationHistoryModalProps {
	translationId: number | null
}

export interface ITranslationHistoryModalEmits {
	close: []
}

export interface IPluralEditorProps {
	modelValue: string
}

export interface IPluralEditorEmits {
	'update:modelValue': [value: string]
}

export interface ISaveTranslationPayload {
	key_id: number
	language_code: string
	value: string
}

export interface ISetStatusPayload {
	key_id: number
	language_code: string
	status: string
}

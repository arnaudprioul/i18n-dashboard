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

export interface SaveTranslationPayload {
	key_id: number
	language_code: string
	value: string
}

export interface SetStatusPayload {
	key_id: number
	language_code: string
	status: string
}

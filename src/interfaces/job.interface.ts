export interface IJobStatus {
	id: string
	status: 'running' | 'done' | 'error'
	languageCode: string
	languageName: string
	total: number
	done: number
	errors: number
	percent: number
}

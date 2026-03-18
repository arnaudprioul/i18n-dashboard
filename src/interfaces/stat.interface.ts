export interface ILangStat {
	id: number
	code: string
	name: string
	is_default: boolean
	total: number
	translated: number
	missing: number
	draft: number
	reviewed: number
	approved: number
	coverage: number
}

export interface IStatsResponse {
	totalKeys: number
	unusedKeys: number
	languages: ILangStat[]
	recentActivity: IActivityItem[]
}

export interface IActivityItem {
	id: number
	old_value: string | null
	new_value: string
	changed_by: string
	changed_at: string
	key: string
	language_code: string
}

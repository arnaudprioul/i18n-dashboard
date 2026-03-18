export interface IUserItem {
	id: number
	name: string
	email: string
	is_active: boolean
	is_super_admin?: boolean
	last_login_at?: string | null
	role?: string
	roles?: Array<{ role: string; project_id: number | null; project_name?: string }>
}

export interface ICreateUserPayload {
	name: string
	email: string
	role: string
	project_id?: number
	project_ids?: number[]
	global_access?: boolean
}

export interface IRoleEntry {
	project_id: number | null
	role: string | null
}

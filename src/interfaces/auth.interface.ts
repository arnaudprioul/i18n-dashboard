export interface IAuthUser {
  id: number
  email: string
  name: string
  is_super_admin: boolean
  is_active: boolean
  roles: Array<{ role: string; project_id: number | null; project_name?: string }>
}

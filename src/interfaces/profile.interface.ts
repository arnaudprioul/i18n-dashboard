export type ProfilePeriod = '1d' | '7d' | '30d' | '365d' | 'all'

export interface IProfileStats {
  total: number
  periodCount: number
  period: ProfilePeriod
}

export interface IProfileRole {
  role: string
  project_id: number | null
  project_name: string | null
  project_color: string | null
}

export interface IProfileLanguage {
  id: number
  code: string
  name: string
  project_id: number
  project_name: string
}

export interface IProfileRecentTranslation {
  id: number
  key: string
  key_id: number
  project_id?: number
  language_code: string
  new_value: string
  old_value: string | null
  changed_at: string
  project_name: string
  project_color: string
}

export interface IUserProfile {
  user: {
    id: number
    name: string
    email: string
    is_super_admin: boolean
    last_login_at: string | null
    created_at: string
  }
  roles: IProfileRole[]
  stats: IProfileStats
  languages: IProfileLanguage[]
  recentTranslations: IProfileRecentTranslation[]
}

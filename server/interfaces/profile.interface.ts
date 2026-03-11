export interface ProfileStats {
  total: number
  thisWeek: number
  thisMonth: number
}

export interface ProfileRole {
  role: string
  project_id: number | null
  project_name: string | null
  project_color: string | null
}

export interface ProfileLanguage {
  id: number
  code: string
  name: string
  project_id: number
  project_name: string
}

export interface ProfileRecentTranslation {
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

export interface UserProfile {
  user: {
    id: number
    name: string
    email: string
    is_super_admin: boolean
    last_login_at: string | null
    created_at: string
  }
  roles: ProfileRole[]
  stats: ProfileStats
  languages: ProfileLanguage[]
  recentTranslations: ProfileRecentTranslation[]
}

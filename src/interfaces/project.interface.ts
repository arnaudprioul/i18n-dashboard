export interface IGitRepo {
  url: string
  branch?: string
  token?: string
}

export interface IProjectPayload {
  name: string
  root_path?: string
  locales_path: string
  key_separator: string
  color?: string
  description?: string
  git_repo?: IGitRepo | null
}

export interface IProject {
  id: number
  name: string
  root_path: string
  source_url?: string
  locales_path: string
  key_separator: string
  color: string
  description?: string
  key_count?: number
  language_count?: number
  is_system?: boolean
  git_repo?: { name?: string; url: string; branch?: string; token?: string } | null
}

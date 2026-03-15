export interface GitRepo {
  url: string
  branch?: string
  token?: string
}

export interface ProjectPayload {
  name: string
  root_path?: string
  locales_path: string
  key_separator: string
  color?: string
  description?: string
  git_repo?: GitRepo | null
}

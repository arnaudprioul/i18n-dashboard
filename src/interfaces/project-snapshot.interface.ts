export interface ISnapshotKey {
  key: string
  description?: string | null
  translations: Record<string, { value: string; status?: string } | string>
}

export interface ISnapshotLanguage {
  code: string
  name: string
  is_default?: boolean
  fallback_code?: string | null
}

export interface IProjectSnapshot {
  version: number
  project: {
    name: string
    locales_path: string
    key_separator: string
    color?: string | null
    description?: string | null
    source_url?: string | null
  }
  languages: ISnapshotLanguage[]
  keys: ISnapshotKey[]
}

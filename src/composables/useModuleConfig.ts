import type { IBrandingConfig, IThemeConfig, ICustomWidgetDef } from '../interfaces/project-config.interface'

interface IAppConfigResponse {
  branding: IBrandingConfig | null
  theme: IThemeConfig | null
  widgets: { custom?: ICustomWidgetDef[] } | null
}

let _moduleConfig: ReturnType<typeof _createModuleConfig> | null = null

function _createModuleConfig() {
  const { data, refresh } = useFetch<IAppConfigResponse>('/api/app-config', {
    key: 'module-config',
    default: () => ({ branding: null, theme: null, widgets: null }),
  })

  const branding = computed(() => data.value?.branding ?? null)
  const theme = computed(() => data.value?.theme ?? null)
  const customWidgets = computed<ICustomWidgetDef[]>(() => data.value?.widgets?.custom ?? [])

  return { branding, theme, customWidgets, refresh }
}

export function useModuleConfig() {
  if (!_moduleConfig) {
    _moduleConfig = _createModuleConfig()
  }
  return _moduleConfig
}

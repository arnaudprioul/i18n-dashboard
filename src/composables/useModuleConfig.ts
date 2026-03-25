import type { IBrandingConfig, IThemeConfig, ICustomWidgetDef } from '../interfaces/project-config.interface'

interface IAppConfigResponse {
  branding: IBrandingConfig | null
  theme: IThemeConfig | null
  widgets: { custom?: ICustomWidgetDef[] } | null
}

/**
 * Fetches branding / theme / custom-widget config from the server.
 * useFetch deduplicates by key — all callers share the same cached response.
 */
export function useModuleConfig() {
  const { data, refresh } = useFetch<IAppConfigResponse>('/api/app-config', {
    key: 'module-config',
    default: () => ({ branding: null, theme: null, widgets: null }),
  })

  const branding = computed(() => data.value?.branding ?? null)
  const theme = computed(() => data.value?.theme ?? null)
  const customWidgets = computed<ICustomWidgetDef[]>(() => data.value?.widgets?.custom ?? [])

  return { branding, theme, customWidgets, refresh }
}

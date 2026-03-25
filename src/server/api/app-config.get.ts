import { getDb } from '../db/index'
import { readProjectConfig } from '../utils/project-config.util'
import type { IBrandingConfig, IThemeConfig, ICustomWidgetDef } from '../../interfaces/project-config.interface'

// This endpoint is intentionally public: branding and theme are needed before login
// (login page styling, loading indicator colour). Widget *metadata* (type/label/icon/sizes)
// is safe to expose publicly — widget URLs are only rendered inside the authenticated dashboard.

export default defineEventHandler(async () => {
  // ── Read DB settings (base values) ─────────────────────────────────────────
  const db = getDb()
  const rows = await db('settings')
    .whereIn('key', ['branding_name', 'branding_subtitle', 'branding_logo_url', 'theme_primary', 'theme_neutral', 'custom_widgets'])
    .select('key', 'value')

  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value || ''

  const dbBranding: IBrandingConfig = {
    name: map.branding_name || undefined,
    subtitle: map.branding_subtitle || undefined,
    logoUrl: map.branding_logo_url || undefined,
  }
  const dbTheme: IThemeConfig = {
    primary: map.theme_primary || undefined,
    neutral: map.theme_neutral || undefined,
  }
  let dbWidgets: ICustomWidgetDef[] = []
  if (map.custom_widgets) {
    try {
      const parsed = JSON.parse(map.custom_widgets)
      dbWidgets = Array.isArray(parsed) ? parsed : []
    }
    catch {
      // DB value is corrupted — degrade gracefully
      dbWidgets = []
    }
  }

  // ── Merge with config file (file takes priority) ────────────────────────────
  const fileConfig = readProjectConfig()

  const branding: IBrandingConfig = { ...dbBranding, ...fileConfig.branding }
  const theme: IThemeConfig = { ...dbTheme, ...fileConfig.theme }
  const customWidgets: ICustomWidgetDef[] = fileConfig.widgets?.custom ?? dbWidgets

  const hasBranding = Object.values(branding).some(Boolean)
  const hasTheme = Object.values(theme).some(Boolean)

  return {
    branding: hasBranding ? branding : null,
    theme: hasTheme ? theme : null,
    widgets: customWidgets.length ? { custom: customWidgets } : null,
  }
})

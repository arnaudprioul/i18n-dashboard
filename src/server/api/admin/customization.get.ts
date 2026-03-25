import { getDb } from '../../db/index'
import { readProjectConfig } from '../../utils/project-config.util'

const DB_KEYS = [
  'branding_name',
  'branding_subtitle',
  'branding_logo_url',
  'theme_primary',
  'theme_neutral',
  'custom_widgets',
] as const

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.is_super_admin) throw createError({ statusCode: 403, message: 'Forbidden' })

  const db = getDb()
  const rows = await db('settings').whereIn('key', [...DB_KEYS]).select('key', 'value')
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value || ''

  let customWidgets: unknown[] = []
  if (map.custom_widgets) {
    try {
      const parsed = JSON.parse(map.custom_widgets)
      customWidgets = Array.isArray(parsed) ? parsed : []
    }
    catch {
      // DB value is corrupted — return empty array rather than crashing
      customWidgets = []
    }
  }

  // Indicate whether a config file is active (its values override DB)
  const fileConfig = readProjectConfig()
  const hasConfigFile = !!(fileConfig.branding || fileConfig.theme || fileConfig.widgets)

  return {
    hasConfigFile,
    branding: {
      name: map.branding_name || '',
      subtitle: map.branding_subtitle || '',
      logoUrl: map.branding_logo_url || '',
    },
    theme: {
      primary: map.theme_primary || '',
      neutral: map.theme_neutral || '',
    },
    customWidgets,
  }
})

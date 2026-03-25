import { getDb } from '../../db/index'
import type { IBrandingConfig, IThemeConfig, ICustomWidgetDef } from '../../../interfaces/project-config.interface'

interface ICustomizationBody {
  branding?: IBrandingConfig
  theme?: IThemeConfig
  customWidgets?: ICustomWidgetDef[]
}

async function upsert(db: ReturnType<typeof getDb>, key: string, value: string) {
  const existing = await db('settings').where({ key }).first()
  if (existing) {
    await db('settings').where({ key }).update({ value, updated_at: db.fn.now() })
  }
  else {
    await db('settings').insert({ key, value })
  }
}

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.is_super_admin) throw createError({ statusCode: 403, message: 'Forbidden' })

  const body = await readBody<ICustomizationBody>(event)
  const db = getDb()

  if (body.branding !== undefined) {
    await upsert(db, 'branding_name', body.branding.name ?? '')
    await upsert(db, 'branding_subtitle', body.branding.subtitle ?? '')
    await upsert(db, 'branding_logo_url', body.branding.logoUrl ?? '')
  }

  if (body.theme !== undefined) {
    await upsert(db, 'theme_primary', body.theme.primary ?? '')
    await upsert(db, 'theme_neutral', body.theme.neutral ?? '')
  }

  if (body.customWidgets !== undefined) {
    await upsert(db, 'custom_widgets', JSON.stringify(body.customWidgets))
  }

  return { ok: true }
})

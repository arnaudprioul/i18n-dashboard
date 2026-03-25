import { getDb } from '../../db/index'
import type { IBrandingConfig, IThemeConfig, ICustomWidgetDef } from '../../../interfaces/project-config.interface'
import {
  validateBranding,
  validateTheme,
  validateCustomWidgets,
} from '../../utils/customization-validation.util'

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
  if (!body || typeof body !== 'object')
    throw createError({ statusCode: 400, message: 'Invalid request body' })

  // ── Validate inputs before touching the DB ────────────────────────────────

  if (body.branding !== undefined) {
    const err = validateBranding(body.branding)
    if (err) throw createError({ statusCode: 422, message: err })
  }

  if (body.theme !== undefined) {
    const err = validateTheme(body.theme)
    if (err) throw createError({ statusCode: 422, message: err })
  }

  if (body.customWidgets !== undefined) {
    const err = validateCustomWidgets(body.customWidgets)
    if (err) throw createError({ statusCode: 422, message: err })
  }

  // ── Persist ───────────────────────────────────────────────────────────────

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

import { requireAuth } from '../../utils/auth.util'
import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const { project_id, widgets } = body

  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })

  const db = getDb()
  const settingKey = `dashboard_project_layout_${user.id}_${project_id}`
  const value = JSON.stringify(widgets)

  await db('settings')
    .insert({ key: settingKey, value, updated_at: db.fn.now() })
    .onConflict('key')
    .merge()

  return { ok: true }
})

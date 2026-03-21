import { requireAuth } from '../../../utils/auth.util'
import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const db = getDb()

  const settingKey = `dashboard_layout_${user.id}`
  const value = JSON.stringify(body)

  await db('settings')
    .insert({ key: settingKey, value, updated_at: db.fn.now() })
    .onConflict('key')
    .merge()

  return { ok: true }
})

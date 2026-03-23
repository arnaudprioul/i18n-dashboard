import { requireAuth } from '../../utils/auth.util'
import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const db = getDb()

  const settingKey = `dashboard_layout_${user.id}`
  const row = await db('settings').where({ key: settingKey }).first()

  if (!row || !row.value) return null

  try {
    return JSON.parse(row.value)
  } catch {
    return null
  }
})

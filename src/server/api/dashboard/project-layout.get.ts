import { requireAuth } from '../../utils/auth.util'
import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const projectId = Number(query.project_id)

  if (!projectId) throw createError({ statusCode: 400, message: 'project_id is required' })

  const db = getDb()
  const settingKey = `dashboard_project_layout_${user.id}_${projectId}`
  const row = await db('settings').where({ key: settingKey }).first()

  if (!row || !row.value) return null

  try {
    return JSON.parse(row.value)
  } catch {
    return null
  }
})

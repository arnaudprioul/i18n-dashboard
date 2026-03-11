import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const { project_id } = getQuery(event)
  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })
  const db = getDb()
  const rows = await db('project_number_formats')
    .where({ project_id: Number(project_id) })
    .orderBy('locale').orderBy('name')
  return rows.map((r: any) => ({ ...r, options: JSON.parse(r.options || '{}') }))
})

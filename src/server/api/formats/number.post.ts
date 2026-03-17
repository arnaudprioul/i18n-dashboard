import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project_id, locale, name, options } = body
  if (!project_id || !locale || !name) throw createError({ statusCode: 400, message: 'project_id, locale and name are required' })
  const db = getDb()
  const [id] = await db('project_number_formats').insert({
    project_id: Number(project_id),
    locale,
    name,
    options: JSON.stringify(options || {}),
  })
  const row = await db('project_number_formats').where({ id }).first()
  return { ...row, options: JSON.parse(row.options || '{}') }
})

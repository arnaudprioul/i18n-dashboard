import { getDb } from '../../../db/index'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { locale, name, options } = body
  const db = getDb()
  await db('project_datetime_formats').where({ id }).update({
    locale,
    name,
    options: JSON.stringify(options || {}),
  })
  const row = await db('project_datetime_formats').where({ id }).first()
  return { ...row, options: JSON.parse(row.options || '{}') }
})

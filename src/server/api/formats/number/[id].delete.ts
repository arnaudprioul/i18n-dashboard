import { getDb } from '../../../db/index'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const db = getDb()
  await db('project_number_formats').where({ id }).delete()
  return { ok: true }
})

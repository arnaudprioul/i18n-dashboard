import { getDb } from '../../../db/index'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { name, body: fnBody } = body
  const db = getDb()
  await db('project_modifiers').where({ id }).update({ name, body: fnBody })
  return db('project_modifiers').where({ id }).first()
})

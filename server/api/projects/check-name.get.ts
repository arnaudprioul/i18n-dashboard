import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const name = String(query.name ?? '').trim()
  const excludeId = query.exclude_id ? Number(query.exclude_id) : null

  if (!name) return { available: true }

  const db = getDb()
  let q = db('projects').whereRaw('LOWER(name) = LOWER(?)', [name])
  if (excludeId) q = q.andWhereNot({ id: excludeId })

  const existing = await q.first()
  return { available: !existing }
})

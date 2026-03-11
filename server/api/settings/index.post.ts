import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = getDb()

  for (const [key, value] of Object.entries(body)) {
    const existing = await db('settings').where({ key }).first()
    if (existing) {
      await db('settings').where({ key }).update({ value: String(value), updated_at: db.fn.now() })
    } else {
      await db('settings').insert({ key, value: String(value) })
    }
  }

  const settings = await db('settings').select('*')
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value
  return map
})

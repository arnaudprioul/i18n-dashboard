import { getDb } from '../../db/index'

export default defineEventHandler(async () => {
  const db = getDb()
  const settings = await db('settings').select('*')
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value
  return map
})

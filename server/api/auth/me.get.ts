import { getSession, getUserProfile } from '../../utils/auth.util'
import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  const userId = (session.data as any).userId
  if (!userId) return null

  const profile = await getUserProfile(userId)
  return profile
})

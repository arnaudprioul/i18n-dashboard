import { getSession, clearRefreshToken } from '../../utils/auth.util'

export default defineEventHandler(async (event) => {
  const session = await getSession(event)
  const userId = (session.data as any).userId as number | undefined

  await clearRefreshToken(event, userId)
  await session.clear()

  return { success: true }
})

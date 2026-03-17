import { verifyAndRotateRefreshToken, getUserProfile } from '../../utils/auth.util'

export default defineEventHandler(async (event) => {
  const userId = await verifyAndRotateRefreshToken(event)

  const user = await getUserProfile(userId)
  if (!user || !user.is_active) {
    throw createError({ statusCode: 401, message: 'Compte désactivé' })
  }

  return user
})

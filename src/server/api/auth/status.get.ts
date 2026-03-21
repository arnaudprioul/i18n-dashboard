import { getDb } from '../../db/index'
import { getSession } from '../../../utils/auth.util'

export default defineEventHandler(async (event) => {
  const db = getDb()
  const count = await db('users').count('* as count').first()
  const hasUsers = Number((count as any)?.count || 0) > 0

  const session = await getSession(event)
  const isLoggedIn = !!(session.data as any).userId

  const onboardingSetting = await db('settings').where({ key: 'onboarding_completed' }).first()
  const onboardingCompleted = onboardingSetting?.value === 'true'

  return { hasUsers, isLoggedIn, onboardingCompleted }
})

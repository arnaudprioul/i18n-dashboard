import { getDb } from '../../db/index'
import { getSession } from '../../utils/auth.util'

export default defineEventHandler(async (event) => {
  try {
    const db = getDb()
    const count = await db('users').count('* as count').first()
    const hasUsers = Number((count as any)?.count || 0) > 0

    const session = await getSession(event)
    const isLoggedIn = !!(session.data as any).userId

    const onboardingSetting = await db('settings').where({ key: 'onboarding_completed' }).first()
    const onboardingCompleted = onboardingSetting?.value === 'true'

    return { hasUsers, isLoggedIn, onboardingCompleted }
  } catch {
    // DB not ready yet (no tables, connection refused, etc.) — treat as fresh install
    return { hasUsers: false, isLoggedIn: false, onboardingCompleted: false }
  }
})

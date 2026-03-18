import { useSession } from 'h3'

import { getDb } from '../db/index'
import { sessionConfig } from '~/server/utils/auth.util'
import { PUBLIC_ROUTES, SETUP_ONLY_ROUTES } from '../../consts/commons.const'

export default defineEventHandler(async (event) => {
	const path = event.path || ''

	// Only protect API routes
	if (!path.startsWith('/api/')) return

	// Allow fully public endpoints (no auth ever required)
	if (PUBLIC_ROUTES.includes(path)) return

	// Setup-only routes: allowed without auth ONLY while no user exists yet
	// (i.e. onboarding is not yet complete). Once any user is created they
	// require a valid super_admin session.
	if (SETUP_ONLY_ROUTES.includes(path)) {
		const db = getDb()
		const userCount = await db('users').count('* as count').first()
		const count = Number((userCount as any)?.count ?? 0)
		if (count === 0) return // still in onboarding — allow through
		// Onboarding complete: fall through to normal session check below
	}

	// Check session
	const session = await useSession(event, sessionConfig())
	const userId = (session.data as any).userId

	if (!userId) {
		throw createError({ statusCode: 401, message: 'Non authentifié' })
	}

	// Attach user to context for downstream handlers
	const db = getDb()
	const user = await db('users').where({ id: userId, is_active: true }).first()
	if (!user) {
		throw createError({ statusCode: 401, message: 'Session invalide' })
	}

	// Extra guard for setup-only routes: require super_admin once users exist
	if (SETUP_ONLY_ROUTES.includes(path) && !user.is_super_admin) {
		throw createError({ statusCode: 403, message: 'Accès réservé au super administrateur' })
	}

	event.context.user = user
})

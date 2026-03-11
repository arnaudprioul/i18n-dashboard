import { useSession } from 'h3'

import { getDb } from '../db/index'
import { sessionConfig } from '../utils/auth.util'
import { PUBLIC_ROUTES } from '../consts/commons.const'

export default defineEventHandler(async (event) => {
	const path = event.path || ''

	// Only protect API routes
	if (!path.startsWith('/api/')) return

	// Allow public endpoints
	if (PUBLIC_ROUTES.includes(path)) return

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

	event.context.user = user
})

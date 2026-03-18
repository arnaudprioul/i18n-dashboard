export const PUBLIC_ROUTES = [
	'/api/auth/login',
	'/api/auth/logout',
	'/api/auth/me',
	'/api/auth/refresh',
	'/api/auth/status',
	'/api/setup',
	'/api/ui-locale',
	'/api/config',
	// '/api/db-config' is intentionally NOT public — it can reconfigure and
	// reset the entire database. It is accessible only during the onboarding
	// wizard (before any user exists) via the auth middleware's setup-mode
	// bypass, and requires super_admin authentication at all other times.
]

// Routes accessible without authentication only while onboarding is incomplete
// (no users in the database yet). Once a super admin exists, these routes
// require a valid session.
export const SETUP_ONLY_ROUTES = [
	'/api/db-config',
]

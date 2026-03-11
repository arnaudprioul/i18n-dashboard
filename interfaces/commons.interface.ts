import type { Method } from '../types/commons.type'

export interface RequestConfig {
	query?: Record<string, any>
	body?: any
	headers?: Record<string, string>
	/** Ne pas afficher de toast en cas d'erreur (défaut: false) */
	skipErrorToast?: boolean
	/** Désactiver la déduplication pour cet appel (défaut: false) */
	skipDedup?: boolean
}

export interface RequestContext {
	method: Method
	path: string
	config: RequestConfig
}

export interface ServiceHooks {
	beforeRequest?: (ctx: RequestContext) => Promise<void> | void
	afterRequest?: (ctx: RequestContext, response: any) => Promise<void> | void
	onError?: (ctx: RequestContext, error: any) => Promise<void> | void
}

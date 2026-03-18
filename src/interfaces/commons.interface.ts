import type { TMethod } from '../types/commons.type'

export interface IRequestConfig {
	query?: Record<string, any>
	body?: any
	headers?: Record<string, string>
	/** Ne pas afficher de toast en cas d'erreur (défaut: false) */
	skipErrorToast?: boolean
	/** Désactiver la déduplication pour cet appel (défaut: false) */
	skipDedup?: boolean
}

export interface IRequestContext {
	method: TMethod
	path: string
	config: IRequestConfig
}

export interface IServiceHooks {
	beforeRequest?: (ctx: IRequestContext) => Promise<void> | void
	afterRequest?: (ctx: IRequestContext, response: any) => Promise<void> | void
	onError?: (ctx: IRequestContext, error: any) => Promise<void> | void
}

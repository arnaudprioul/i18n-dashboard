import type { IRequestConfig, IRequestContext, IServiceHooks } from '../interfaces/commons.interface'
import type { TMethod } from '../types/commons.type'
import { METHODS } from '../enums/commons.enum'

// Deduplication registry shared across all service instances
const _inFlight = new Map<string, Promise<any>>()

// Refresh lock — prevents concurrent refresh attempts
let _refreshing: Promise<boolean> | null = null

export abstract class SBase {
  // Per-instance active request counter → drives `loading`
  private _activeCount = 0
  readonly loading = ref(false)

  // Override in subclass to add lifecycle hooks
  protected hooks: IServiceHooks = {}

  // ── Internal helpers ────────────────────────────────────────────────────────

  private _setLoading(delta: 1 | -1) {
    this._activeCount = Math.max(0, this._activeCount + delta)
    this.loading.value = this._activeCount > 0
  }

  private _dedupKey(method: TMethod, path: string, query?: Record<string, any>): string {
    const q = query ? `:${JSON.stringify(query)}` : ''
    return `${method}:${path}${q}`
  }

  private async _doFetch<T>(method: TMethod, path: string, config: IRequestConfig): Promise<T> {
    return $fetch<T>(path, {
      method,
      query: config.query,
      body: config.body,
      headers: config.headers,
    })
  }

  private async _tryRefresh(): Promise<boolean> {
    if (_refreshing) return _refreshing
    _refreshing = $fetch('/api/auth/refresh', { method: 'POST' })
      .then(() => true)
      .catch(() => false)
      .finally(() => { _refreshing = null })
    return _refreshing
  }

  private async _handleAuthFailure(): Promise<void> {
    try { await $fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    try {
      await useNuxtApp().runWithContext(() => {
        let currentPath: string | undefined
        try { currentPath = useRoute()?.path } catch {}
        // Only redirect if we know we're on a protected route.
        // If the path is unknown/empty, do NOT redirect — safer than a spurious /login.
        const publicPaths = ['/login', '/onboarding', '/forgot-password', '/reset-password']
        const isKnownProtected = currentPath && !publicPaths.some(p => currentPath!.startsWith(p))
        if (isKnownProtected) {
          return navigateTo('/login', { replace: true })
        }
      })
    } catch {}
  }

  // ── Core request ────────────────────────────────────────────────────────────

  private async _request<T>(method: TMethod, path: string, config: IRequestConfig = {}): Promise<T> {
    const dedupKey = config.skipDedup ? null : this._dedupKey(method, path, config.query)

    // Return existing in-flight promise for the same key
    if (dedupKey && _inFlight.has(dedupKey)) {
      return _inFlight.get(dedupKey) as Promise<T>
    }

    const ctx: IRequestContext = { method, path, config }

    const execute = async (): Promise<T> => {
      this._setLoading(1)
      try {
        await this.hooks.beforeRequest?.(ctx)

        let response: T
        try {
          response = await this._doFetch<T>(method, path, config)
        }
        catch (error: any) {
          const status = error?.status ?? error?.statusCode
          if (status === 401) {
            const sessionStillValid = await this._tryRefresh()
            if (sessionStillValid) {
              // Retry once after successful session re-validation
              response = await this._doFetch<T>(method, path, config)
            }
            else {
              await this._handleAuthFailure()
              throw new Error('Session expirée. Veuillez vous reconnecter.')
            }
          }
          else {
            throw error
          }
        }

        await this.hooks.afterRequest?.(ctx, response!)
        return response!
      }
      catch (error: any) {
        await this.hooks.onError?.(ctx, error)

        const message = error?.data?.message ?? error?.message ?? 'Une erreur est survenue'
        if (!config.skipErrorToast) {
          try { useToast().add({ title: 'Erreur', description: message, color: 'error' }) }
          catch {}
        }
        throw new Error(message)
      }
      finally {
        this._setLoading(-1)
        if (dedupKey) _inFlight.delete(dedupKey)
      }
    }

    const promise = execute()
    if (dedupKey) _inFlight.set(dedupKey, promise)
    return promise
  }

  // ── Public HTTP methods ─────────────────────────────────────────────────────

  protected get<T = void>(path: string, config?: IRequestConfig): Promise<T> {
    return this._request<T>(METHODS.GET, path, config)
  }

  protected post<T = void>(path: string, config?: IRequestConfig): Promise<T> {
    return this._request<T>(METHODS.POST, path, config)
  }

  protected put<T = void>(path: string, config?: IRequestConfig): Promise<T> {
    return this._request<T>(METHODS.PUT, path, config)
  }

  protected patch<T = void>(path: string, config?: IRequestConfig): Promise<T> {
    return this._request<T>(METHODS.PATCH, path, config)
  }

  protected delete<T = void>(path: string, config?: IRequestConfig): Promise<T> {
    return this._request<T>(METHODS.DELETE, path, config)
  }
}

// Mock for Nuxt virtual module '#imports' used in server/utils files
export * from 'vue'

export const useRuntimeConfig = () => ({
  sessionSecret: 'test-secret-key-32-chars-minimum!!',
  public: {},
})

export const createError = ({ statusCode, message }: { statusCode: number; message: string }) => {
  const e = new Error(message) as any
  e.statusCode = statusCode
  return e
}

// ── H3 event handler utilities ────────────────────────────────────────────────
// defineEventHandler: just return the inner function so tests can call it directly
export const defineEventHandler = (fn: Function) => fn
export const readBody = (event: any) => Promise.resolve(event?._body ?? {})
export const getQuery = (event: any) => event?._query ?? {}
export const getHeader = (event: any, name: string) => event?._headers?.[name] ?? ''
export const getRouterParam = (event: any, name: string) => event?._params?.[name] ?? ''
export const setHeader = () => {}
export const getRequestURL = (event: any) => ({ pathname: event?._path ?? '' })

export const useSession = () => ({
  data: {},
  update: async () => {},
  clear: async () => {},
})

export const navigateTo = () => {}
export const $fetch = () => Promise.resolve(null)
export const refreshNuxtData = () => {}
export const useNuxtApp = () => ({ runWithContext: (fn: any) => fn() })

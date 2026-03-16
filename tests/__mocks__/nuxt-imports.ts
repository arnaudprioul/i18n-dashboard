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

export const useSession = () => ({
  data: {},
  update: async () => {},
  clear: async () => {},
})

export const navigateTo = () => {}
export const $fetch = () => Promise.resolve(null)
export const refreshNuxtData = () => {}
export const useNuxtApp = () => ({ runWithContext: (fn: any) => fn() })

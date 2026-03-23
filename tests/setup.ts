import { vi, beforeEach } from 'vitest'
import * as vue from 'vue'

// ── Vue reactivity globals (simulates Nuxt auto-imports in happy-dom) ─────────
const {
  ref, computed, reactive, watch, watchEffect, watchPostEffect,
  onMounted, onUnmounted, onBeforeMount, onBeforeUnmount,
  nextTick, toValue, toRef, toRefs, shallowRef, readonly,
  defineComponent, markRaw,
} = vue

Object.assign(globalThis, {
  ref, computed, reactive, watch, watchEffect, watchPostEffect,
  onMounted, onUnmounted, onBeforeMount, onBeforeUnmount,
  nextTick, toValue, toRef, toRefs, shallowRef, readonly,
  defineComponent, markRaw,
})

// ── Nuxt UI ───────────────────────────────────────────────────────────────────
const _mockToast = { add: vi.fn(), remove: vi.fn() }
vi.stubGlobal('useToast', vi.fn(() => _mockToast))

// ── H3 server handler utilities (Nuxt auto-imports used in server/ handlers) ──
// defineEventHandler: return the inner function directly so tests can call it
vi.stubGlobal('defineEventHandler', (fn: Function) => fn)
vi.stubGlobal('readBody', (event: any) => Promise.resolve(event?._body ?? {}))
vi.stubGlobal('getQuery', (event: any) => event?._query ?? {})
vi.stubGlobal('getHeader', (event: any, name: string) => event?._headers?.[name] ?? '')
vi.stubGlobal('getRouterParam', (event: any, name: string) => event?._params?.[name] ?? '')
vi.stubGlobal('setHeader', () => {})
vi.stubGlobal('getRequestURL', (event: any) => ({ pathname: event?._path ?? '' }))

// ── Nuxt fetch / navigation ───────────────────────────────────────────────────
vi.stubGlobal('$fetch', vi.fn())
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('refreshNuxtData', vi.fn())

// ── Nuxt app ──────────────────────────────────────────────────────────────────
vi.stubGlobal('useNuxtApp', vi.fn(() => ({ runWithContext: (fn: any) => fn() })))
vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({ sessionSecret: 'test-secret-key-32-chars-minimum!!' })))
vi.stubGlobal('createError', ({ statusCode, message }: any) => {
  const e = new Error(message) as any
  e.statusCode = statusCode
  return e
})

// ── Nuxt router / route ───────────────────────────────────────────────────────
vi.stubGlobal('useRoute', vi.fn(() => ({ path: '/dashboard', params: {}, query: {} })))
vi.stubGlobal('useRouter', vi.fn(() => ({ push: vi.fn(), replace: vi.fn() })))
vi.stubGlobal('useCookie', vi.fn(() => ref('')))

// ── Nuxt data fetching ────────────────────────────────────────────────────────
vi.stubGlobal('useAsyncData', vi.fn((_key: string, _fetcher: Function) => {
  const data = ref(null)
  const pending = ref(false)
  const refresh = vi.fn()
  return { data, pending, refresh }
}))

// ── Custom composables used as singletons ─────────────────────────────────────
// These are used bare inside other composables — stub them with sensible defaults
vi.stubGlobal('useT', vi.fn(() => ({ t: (key: string, fallback?: string) => fallback ?? key })))
vi.stubGlobal('useAuth', vi.fn(() => ({ currentUser: ref(null), fetchMe: vi.fn(), getRoleForProject: vi.fn(() => null) })))
vi.stubGlobal('useProject', vi.fn(() => ({
  currentProject: ref(null),
  projects: ref([]),
  visibleProjects: computed(() => []),
  fetchProjects: vi.fn(),
})))

// ── Reset mocks between tests ─────────────────────────────────────────────────
beforeEach(() => {
  vi.mocked(globalThis.$fetch as any).mockReset()
  vi.mocked(globalThis.navigateTo as any).mockReset()
  vi.mocked(globalThis.refreshNuxtData as any).mockReset()
  _mockToast.add.mockReset()
  _mockToast.remove.mockReset()
})

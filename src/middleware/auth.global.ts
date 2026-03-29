import { onboardingService } from '../services/onboarding.service'

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip on SSR — auth checks run client-side only so Cypress intercepts apply.
  // onboardingService.getAuthStatus() is truly awaitable (unlike useFetch in route middleware).
  if (import.meta.server) return

  const publicPages = ['/login', '/forgot-password', '/reset-password']

  // Skip the status fetch when navigating between public pages — no auth check needed
  // and avoids a blank-screen flash caused by out-in page transitions waiting on the fetch.
  if (publicPages.includes(to.path) && from && publicPages.includes(from.path)) {
    return
  }

  let status: {
    isLoggedIn: boolean
    hasUsers: boolean
    onboardingCompleted: boolean
  } | null = null

  try {
    status = await onboardingService.getAuthStatus()
  }
  catch {
    // Fetch failed — treat as DB unavailable, redirect to onboarding
    if (to.path !== '/onboarding') return navigateTo('/onboarding')
    return
  }

  // Aucun utilisateur en base → onboarding (création du compte)
  if (!status || !status.hasUsers) {
    if (to.path !== '/onboarding') return navigateTo('/onboarding')
    return
  }

  // Onboarding non terminé → redirect (sauf si déjà sur /onboarding)
  if (!status.onboardingCompleted && to.path !== '/onboarding') {
    return navigateTo('/onboarding')
  }

  // Onboarding terminé → ne pas rester sur /onboarding
  if (status.onboardingCompleted && to.path === '/onboarding') {
    return navigateTo('/')
  }

  // Non connecté → login (sauf si déjà sur /login ou pages publiques)
  if (!status.isLoggedIn) {
    if (!publicPages.includes(to.path)) return navigateTo('/login')
    return
  }

  // Connecté → ne pas rester sur le login
  if (to.path === '/login') return navigateTo('/')
})

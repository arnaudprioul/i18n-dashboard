export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on SSR — auth checks run client-side only so Cypress intercepts apply.
  // useFetch does not properly block in client-side route middleware (it resolves
  // immediately with data = null). Use $fetch which is truly awaitable.
  if (import.meta.server) return

  let status: {
    isLoggedIn: boolean
    hasUsers: boolean
    onboardingCompleted: boolean
  } | null = null

  try {
    status = await $fetch('/api/auth/status')
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
  const publicPages = ['/login', '/forgot-password', '/reset-password']
  if (!status.isLoggedIn) {
    if (!publicPages.includes(to.path)) return navigateTo('/login')
    return
  }

  // Connecté → ne pas rester sur le login
  if (to.path === '/login') return navigateTo('/')
})

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const { data: status } = await useFetch('/api/auth/status', { key: 'auth-status' })

  if (!status.value) return

  // Aucun utilisateur en base → onboarding (création du compte)
  if (!status.value.hasUsers) {
    if (to.path !== '/onboarding') return navigateTo('/onboarding')
    return
  }

  // Non connecté → login
  if (!status.value.isLoggedIn) return navigateTo('/login')

  // Onboarding non terminé → redirect (sauf si déjà sur /onboarding)
  if (!status.value.onboardingCompleted && to.path !== '/onboarding') {
    return navigateTo('/onboarding')
  }

  // Onboarding terminé → ne pas rester sur /onboarding
  if (status.value.onboardingCompleted && to.path === '/onboarding') {
    return navigateTo('/')
  }
})

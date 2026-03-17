// Loads Dashboard UI translations on app startup (runs on both server and client)
export default defineNuxtPlugin(async () => {
  const { loadTranslations } = useT()
  const cookie = useCookie('ui-lang', { default: () => 'en' })
  await loadTranslations(cookie.value)
})

import { initDb } from '../db/index'

export default defineNitroPlugin(async () => {
  await initDb()
  console.log('[i18n-dashboard] Database initialized')
})
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

// Returns the current database configuration (read-only, no secrets)
// ?checkPath=... can be used to check if a specific SQLite file path exists
export default defineEventHandler((event) => {
  const query = getQuery(event)
  if (query.checkPath) {
    const p = String(query.checkPath)
    const resolved = p.startsWith('.') ? resolve(process.cwd(), p) : p
    return { fileExists: existsSync(resolved) }
  }
  const config = useRuntimeConfig()

  // Check for override file
  const overridePath = resolve(process.cwd(), 'i18n-dashboard.db.json')
  let override: Record<string, string> | null = null
  if (existsSync(overridePath)) {
    try { override = JSON.parse(readFileSync(overridePath, 'utf-8')) } catch { /* ignore */ }
  }

  const client = (override?.dbClient || config.dbClient as string) || 'better-sqlite3'

  if (client === 'better-sqlite3' || client === 'sqlite3') {
    const connection = (override?.dbConnection || config.dbConnection as string) || './i18n-dashboard.db'
    const resolvedPath = connection.startsWith('.') ? resolve(process.cwd(), connection) : connection
    return {
      client,
      type: 'sqlite',
      connection,
      fileExists: existsSync(resolvedPath),
    }
  }

  return {
    client,
    type: client === 'pg' || client === 'postgresql' ? 'postgresql' : 'mysql',
    host: (override?.dbHost || config.dbHost as string) || 'localhost',
    port: (override?.dbPort || config.dbPort as string) || (client === 'mysql2' || client === 'mysql' ? '3306' : '5432'),
    database: (override?.dbName || config.dbName as string) || 'i18n_dashboard',
    user: (override?.dbUser || config.dbUser as string) || '',
    // never expose password
  }
})

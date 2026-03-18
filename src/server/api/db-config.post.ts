import knex from 'knex'
import { existsSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { resetDb, saveDbOverride, buildConnectionFromParams } from '../db/index'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { type, connection, host, port, user, password, database, createFile, testOnly } = body

  // ── Create SQLite file only ──────────────────────────────────────────────────
  if (createFile && type === 'sqlite') {
    const filePath = connection || './i18n-dashboard.db'
    const resolvedPath = filePath.startsWith('.') ? resolve(process.cwd(), filePath) : filePath
    if (!existsSync(resolvedPath)) {
      mkdirSync(dirname(resolvedPath), { recursive: true })
      writeFileSync(resolvedPath, '')
    }
    return { success: true, fileExists: true }
  }

  // ── Build knex config from form values ──────────────────────────────────────
  const dbClient = type === 'sqlite'
    ? 'better-sqlite3'
    : type === 'postgresql' ? 'pg' : 'mysql2'

  const knexConfig = buildConnectionFromParams({
    dbClient,
    dbConnection: type === 'sqlite' ? connection : undefined,
    dbHost: host,
    dbPort: String(port || ''),
    dbUser: user,
    dbPassword: password,
    dbName: database,
  })

  // ── Test connection ──────────────────────────────────────────────────────────
  const testDb = knex(knexConfig)
  try {
    if (dbClient === 'better-sqlite3') {
      testDb.raw('SELECT 1').toString() // synchronous check — knex will throw if path is invalid
      await testDb.raw('SELECT 1')
    } else {
      await testDb.raw('SELECT 1')
    }
  } catch (e: any) {
    await testDb.destroy().catch(() => {})
    // Log the full error server-side only — never expose DB host, port,
    // credentials hints, or driver internals to the client.
    console.error('[i18n-dashboard] DB connection test failed:', e.message)
    throw createError({ statusCode: 400, message: 'Database connection failed. Please check your settings.' })
  }
  await testDb.destroy()

  // ── Test only — stop here, don't persist or reset ────────────────────────────
  if (testOnly) {
    return { success: true }
  }

  // ── Save override ────────────────────────────────────────────────────────────
  const override: Record<string, string> = { dbClient }
  if (type === 'sqlite') {
    override.dbConnection = connection || './i18n-dashboard.db'
  } else {
    override.dbHost = host || 'localhost'
    override.dbPort = String(port || (type === 'mysql' ? '3306' : '5432'))
    override.dbUser = user || ''
    override.dbPassword = password || ''
    override.dbName = database || ''
  }
  saveDbOverride(override)

  // ── Reset DB with new config ─────────────────────────────────────────────────
  await resetDb(knexConfig)

  return { success: true }
})

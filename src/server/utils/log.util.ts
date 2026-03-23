import { getDb } from '../db/index'

export async function writeLog(
  level: 'error' | 'warn' | 'info',
  context: string,
  message: string,
  details?: Record<string, any>,
): Promise<void> {
  try {
    const db = getDb()
    await db('system_logs').insert({
      level,
      context,
      message,
      details: details ? JSON.stringify(details) : null,
    })
  }
  catch (e: any) {
    console.error('[log.util] Failed to write system log:', e?.message)
  }
}

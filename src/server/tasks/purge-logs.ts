import { getDb } from '../db/index'

export default defineTask({
  meta: {
    name: 'purge-logs',
    description: 'Purge old system logs based on retention settings',
  },
  async run() {
    const db = getDb()

    const [intervalSetting, retentionSetting, lastPurgeSetting] = await Promise.all([
      db('settings').where({ key: 'log_purge_interval_hours' }).first(),
      db('settings').where({ key: 'log_retention_days' }).first(),
      db('settings').where({ key: 'log_last_purge_at' }).first(),
    ])

    const intervalHours = Number(intervalSetting?.value || 24)
    const retentionDays = Number(retentionSetting?.value || 7)
    const lastPurgeAt = lastPurgeSetting?.value ? new Date(lastPurgeSetting.value) : null

    const now = new Date()
    if (lastPurgeAt) {
      const hoursSince = (now.getTime() - lastPurgeAt.getTime()) / (1000 * 60 * 60)
      if (hoursSince < intervalHours) {
        return { result: 'skipped', reason: `Next purge in ${Math.ceil(intervalHours - hoursSince)}h` }
      }
    }

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - retentionDays)

    const deleted = await db('system_logs').where('created_at', '<', cutoff.toISOString()).delete()

    if (lastPurgeSetting) {
      await db('settings').where({ key: 'log_last_purge_at' }).update({ value: now.toISOString(), updated_at: db.fn.now() })
    }
    else {
      await db('settings').insert({ key: 'log_last_purge_at', value: now.toISOString() })
    }

    console.log(`[purge-logs] Purged ${deleted} log entries older than ${retentionDays} days`)
    return { result: 'ok', deleted }
  },
})

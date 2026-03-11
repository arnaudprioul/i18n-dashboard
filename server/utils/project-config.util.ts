import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { useRuntimeConfig } from '#imports'

import type { DashboardConfig } from '../interfaces/project-config.interface'

let _cachedConfig: DashboardConfig | null = null

export function readProjectConfig(): DashboardConfig {
  if (_cachedConfig) return _cachedConfig

  const config = useRuntimeConfig()
  const projectRoot = (config.projectRoot as string || '').trim() || process.cwd()

  const candidates = [
    resolve(projectRoot, 'i18n-dashboard.config.json'),
    resolve(projectRoot, 'i18n-dashboard.config.js'),
    resolve(process.cwd(), 'i18n-dashboard.config.json'),
    resolve(process.cwd(), 'i18n-dashboard.config.js'),
  ]

  for (const filePath of candidates) {
    if (existsSync(filePath)) {
      try {
        const raw = readFileSync(filePath, 'utf-8')
        _cachedConfig = JSON.parse(raw)
        console.log(`[i18n-dashboard] Config file loaded: ${filePath}`)
        return _cachedConfig!
      } catch (e) {
        console.warn(`[i18n-dashboard] Failed to parse config file: ${filePath}`, e)
      }
    }
  }

  _cachedConfig = {}
  return _cachedConfig
}

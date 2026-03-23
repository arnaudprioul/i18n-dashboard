import { readProjectConfig } from '../utils/project-config.util'

export default defineEventHandler(() => {
  const config = readProjectConfig()
  return {
    uiLanguages: config.uiLanguages || null,
    defaultUiLanguage: config.defaultUiLanguage || null,
    project: config.project || null,
  }
})

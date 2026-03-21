import { getDb } from '../db/index'
import { autoTranslateUtil } from '../../utils/auto-translate.util'

// Saves onboarding configuration: UI languages for Dashboard UI project
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { languages, defaultLanguage } = body // languages: Array<{ code, name }>

  const db = getDb()
  const systemProject = await db('projects').where({ is_system: true }).first()

  const langsToTranslate: string[] = []

  if (systemProject && languages?.length) {
    const existingLangs = await db('languages').where({ project_id: systemProject.id }).select('code')
    const existingCodes = existingLangs.map((l: any) => l.code)

    for (const lang of languages) {
      if (!existingCodes.includes(lang.code)) {
        await db('languages').insert({
          project_id: systemProject.id,
          code: lang.code,
          name: lang.name,
          is_default: lang.code === defaultLanguage,
        })
        // Queue translation for non-English new languages
        if (lang.code !== 'en') {
          langsToTranslate.push(lang.code)
        }
      } else {
        await db('languages')
          .where({ project_id: systemProject.id, code: lang.code })
          .update({ is_default: lang.code === defaultLanguage })
      }
    }
  }

  // Mark onboarding as completed (upsert to handle missing row)
  const existing = await db('settings').where({ key: 'onboarding_completed' }).first()
  if (existing) {
    await db('settings').where({ key: 'onboarding_completed' }).update({ value: 'true' })
  } else {
    await db('settings').insert({ key: 'onboarding_completed', value: 'true' })
  }

  // Fire-and-forget: translate UI strings for each new non-EN language
  if (langsToTranslate.length) {
    setImmediate(async () => {
      for (const code of langsToTranslate) {
        await autoTranslateUtil(db, code)
      }
    })
  }

  return { success: true }
})

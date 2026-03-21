import { getDb } from '../../db/index'
import { autoTranslateUtil } from '../../../utils/auto-translate.util'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project_id, code, name, is_default, fallback_code } = body

  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })
  if (!code || !name) throw createError({ statusCode: 400, message: 'code and name are required' })

  const db = getDb()

  if (is_default) {
    await db('languages').where({ project_id: Number(project_id) }).update({ is_default: false })
  }

  const existing = await db('languages').where({ project_id: Number(project_id), code }).first()
  if (existing) {
    await db('languages').where({ id: existing.id }).update({
      name,
      is_default: is_default || false,
      fallback_code: fallback_code ?? existing.fallback_code,
    })
    return db('languages').where({ id: existing.id }).first()
  }

  const [id] = await db('languages').insert({
    project_id: Number(project_id),
    code,
    name,
    is_default: is_default || false,
    fallback_code: fallback_code || null,
  })

  // If this is the system project and the language isn't English, auto-translate UI strings
  const project = await db('projects').where({ id: Number(project_id) }).first()
  if (project?.is_system && code !== 'en') {
    setImmediate(() => autoTranslateUtil(db, code))
  }

  return db('languages').where({ id }).first()
})

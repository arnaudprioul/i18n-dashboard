import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project_id, numberFormats = [], datetimeFormats = [], modifiers = [] } = body

  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })

  const db = getDb()
  const project = await db('projects').where({ id: Number(project_id) }).first()
  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })

  let addedNumber = 0
  let addedDatetime = 0
  let addedModifiers = 0

  for (const { locale, name, options } of numberFormats) {
    const exists = await db('project_number_formats')
      .where({ project_id: Number(project_id), locale, name })
      .first()
    if (!exists) {
      await db('project_number_formats').insert({
        project_id: Number(project_id),
        locale,
        name,
        options: JSON.stringify(options || {}),
      })
      addedNumber++
    }
  }

  for (const { locale, name, options } of datetimeFormats) {
    const exists = await db('project_datetime_formats')
      .where({ project_id: Number(project_id), locale, name })
      .first()
    if (!exists) {
      await db('project_datetime_formats').insert({
        project_id: Number(project_id),
        locale,
        name,
        options: JSON.stringify(options || {}),
      })
      addedDatetime++
    }
  }

  for (const { name, body } of modifiers) {
    const exists = await db('project_modifiers')
      .where({ project_id: Number(project_id), name })
      .first()
    if (!exists) {
      await db('project_modifiers').insert({
        project_id: Number(project_id),
        name,
        body,
      })
      addedModifiers++
    }
  }

  return {
    added: {
      numberFormats: addedNumber,
      datetimeFormats: addedDatetime,
      modifiers: addedModifiers,
    },
  }
})

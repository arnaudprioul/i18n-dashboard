import { resolve } from 'path'
import { getDb } from '../../db/index'
import { detectFormats } from '../../utils/scanner.util'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { project_id, root_path: bodyRootPath } = body

  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })

  const db = getDb()
  const project = await db('projects').where({ id: Number(project_id) }).first()
  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })

  const rootPath = bodyRootPath || project.root_path
  if (!rootPath) throw createError({ statusCode: 400, message: 'No root path provided' })

  const detected = detectFormats({ projectRoot: resolve(rootPath) })

  const [existingNumber, existingDatetime, existingModifiers] = await Promise.all([
    db('project_number_formats').where({ project_id: Number(project_id) }).select('locale', 'name'),
    db('project_datetime_formats').where({ project_id: Number(project_id) }).select('locale', 'name'),
    db('project_modifiers').where({ project_id: Number(project_id) }).select('name'),
  ])

  const existingNumberSet = new Set(existingNumber.map((r: any) => `${r.locale}::${r.name}`))
  const existingDatetimeSet = new Set(existingDatetime.map((r: any) => `${r.locale}::${r.name}`))
  const existingModifiersSet = new Set(existingModifiers.map((r: any) => r.name))

  const toImport = {
    numberFormats: [] as Array<{ locale: string; name: string; options: Record<string, any> }>,
    datetimeFormats: [] as Array<{ locale: string; name: string; options: Record<string, any> }>,
    modifiers: [] as Array<{ name: string; body: string }>,
  }
  const alreadyExisting = {
    numberFormats: [] as Array<{ locale: string; name: string }>,
    datetimeFormats: [] as Array<{ locale: string; name: string }>,
    modifiers: [] as Array<{ name: string }>,
  }

  for (const [locale, formats] of Object.entries(detected.numberFormats)) {
    for (const [name, options] of Object.entries(formats)) {
      if (existingNumberSet.has(`${locale}::${name}`)) {
        alreadyExisting.numberFormats.push({ locale, name })
      } else {
        toImport.numberFormats.push({ locale, name, options })
      }
    }
  }

  for (const [locale, formats] of Object.entries(detected.datetimeFormats)) {
    for (const [name, options] of Object.entries(formats)) {
      if (existingDatetimeSet.has(`${locale}::${name}`)) {
        alreadyExisting.datetimeFormats.push({ locale, name })
      } else {
        toImport.datetimeFormats.push({ locale, name, options })
      }
    }
  }

  for (const [name, body] of Object.entries(detected.modifiers)) {
    if (existingModifiersSet.has(name)) {
      alreadyExisting.modifiers.push({ name })
    } else {
      toImport.modifiers.push({ name, body })
    }
  }

  return {
    sourceFile: detected.sourceFile,
    toImport,
    alreadyExisting,
  }
})

import { getDb } from '../../db/index'
import { existsSync } from 'fs'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)
  const { name, root_path, source_url, locales_path, key_separator, color, description, enable_number_formats, enable_datetime_formats, enable_modifiers, git_url, git_token, git_branch } = body

  const db = getDb()
  const project = await db('projects').where({ id }).first()
  if (!project) throw createError({ statusCode: 404, message: 'Project not found' })
  if (project.is_system) throw createError({ statusCode: 403, message: 'La configuration du projet système ne peut pas être modifiée' })

  const updates: Record<string, any> = {}
  if (name !== undefined) updates.name = name.trim()
  if (locales_path !== undefined) updates.locales_path = locales_path
  if (key_separator !== undefined) updates.key_separator = key_separator
  if (color !== undefined) updates.color = color
  if (description !== undefined) updates.description = description
  if (source_url !== undefined) updates.source_url = source_url?.trim() || null
  if (enable_number_formats !== undefined) updates.enable_number_formats = enable_number_formats
  if (enable_datetime_formats !== undefined) updates.enable_datetime_formats = enable_datetime_formats
  if (enable_modifiers !== undefined) updates.enable_modifiers = enable_modifiers
  if (git_url !== undefined) updates.git_url = git_url?.trim() || null
  if (git_token !== undefined) updates.git_token = git_token?.trim() || null
  if (git_branch !== undefined) updates.git_branch = git_branch?.trim() || null

  if (root_path !== undefined) {
    if (root_path.trim() === '') {
      updates.root_path = ''
    } else {
      const absolutePath = resolve(root_path)
      if (!existsSync(absolutePath)) {
        throw createError({ statusCode: 400, message: `Path does not exist: ${absolutePath}` })
      }
      updates.root_path = absolutePath
    }
  }

  await db('projects').where({ id }).update(updates)
  return db('projects').where({ id }).first()
})

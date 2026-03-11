import { getDb } from '../../db/index'
import { existsSync } from 'fs'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, root_path, source_url, locales_path, key_separator, color, description } = body

  if (!name?.trim()) throw createError({ statusCode: 400, message: 'name is required' })
  if (!root_path?.trim() && !source_url?.trim()) {
    throw createError({ statusCode: 400, message: 'root_path or source_url is required' })
  }

  let absolutePath = ''
  if (root_path?.trim()) {
    absolutePath = resolve(root_path)
    if (!existsSync(absolutePath)) {
      throw createError({ statusCode: 400, message: `Path does not exist: ${absolutePath}` })
    }
  }

  const db = getDb()
  const [id] = await db('projects').insert({
    name: name.trim(),
    root_path: absolutePath,
    source_url: source_url?.trim() || null,
    locales_path: locales_path || 'src/locales',
    key_separator: key_separator || '.',
    color: color || 'primary',
    description: description || null,
  })

  return db('projects').where({ id }).first()
})

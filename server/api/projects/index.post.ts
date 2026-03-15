import { getDb } from '../../db/index'
import { existsSync } from 'fs'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, root_path, locales_path, key_separator, color, description, git_repo } = body

  if (!name?.trim()) throw createError({ statusCode: 400, message: 'name is required' })

  const db = getDb()
  const existing = await db('projects').whereRaw('LOWER(name) = LOWER(?)', [name.trim()]).first()
  if (existing) throw createError({ statusCode: 409, message: 'project_name_taken' })

  let absolutePath = ''
  if (root_path?.trim()) {
    absolutePath = resolve(root_path)
    if (!existsSync(absolutePath)) {
      throw createError({ statusCode: 400, message: `Path does not exist: ${absolutePath}` })
    }
  }
  let gitRepoJson: string | null = null
  if (git_repo?.url?.trim()) {
    const clean: Record<string, string> = { url: git_repo.url.trim() }
    if (git_repo.branch?.trim()) clean.branch = git_repo.branch.trim()
    if (git_repo.token?.trim()) clean.token = git_repo.token.trim()
    gitRepoJson = JSON.stringify(clean)
  }

  const [id] = await db('projects').insert({
    name: name.trim(),
    root_path: absolutePath || '',
    locales_path: locales_path || 'src/locales',
    key_separator: key_separator || '.',
    color: color || 'primary',
    description: description || null,
    git_repos: gitRepoJson,
  })

  return db('projects').where({ id }).first()
})

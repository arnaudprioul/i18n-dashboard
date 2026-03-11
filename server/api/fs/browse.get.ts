import { readdirSync, statSync, existsSync } from 'fs'
import { resolve, join, dirname, sep } from 'path'
import { homedir } from 'os'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawPath = query.path && String(query.path).trim() ? String(query.path).trim() : homedir()

  const absolutePath = resolve(rawPath)

  if (!existsSync(absolutePath)) {
    throw createError({ statusCode: 404, message: `Path not found: ${absolutePath}` })
  }

  const stat = statSync(absolutePath)
  if (!stat.isDirectory()) {
    throw createError({ statusCode: 400, message: 'Path is not a directory' })
  }

  let entries: { name: string; path: string }[] = []
  try {
    entries = readdirSync(absolutePath, { withFileTypes: true })
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(e => ({ name: e.name, path: join(absolutePath, e.name) }))
  } catch {
    entries = []
  }

  // Build breadcrumbs from path segments
  const parts = absolutePath.split(sep).filter(Boolean)
  const breadcrumbs = parts.map((part, i) => ({
    name: part || sep,
    path: sep + parts.slice(0, i + 1).join(sep),
  }))
  // Add root on unix
  if (absolutePath.startsWith(sep)) {
    breadcrumbs.unshift({ name: sep, path: sep })
  }

  const parent = absolutePath !== sep ? dirname(absolutePath) : null

  return {
    current: absolutePath,
    parent,
    home: homedir(),
    breadcrumbs,
    entries,
  }
})

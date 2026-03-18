import { readdirSync, statSync, existsSync } from 'fs'
import { resolve, join, dirname, sep } from 'path'
import { homedir } from 'os'

// Allowed root anchors — browsing is limited to the user's home directory and
// any filesystem root. This prevents authenticated users from enumerating
// arbitrary paths outside their working area (e.g. /etc, /proc, /var/...).
function isAllowedPath(absolutePath: string): boolean {
  const home = homedir()
  // Allow: anything under home, filesystem roots (/  or C:\), and /tmp
  const allowedRoots = [home, sep, resolve('/tmp')]
  return allowedRoots.some(root => absolutePath === root || absolutePath.startsWith(root + sep))
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const rawPath = query.path && String(query.path).trim() ? String(query.path).trim() : homedir()

  const absolutePath = resolve(rawPath)

  if (!isAllowedPath(absolutePath)) {
    throw createError({ statusCode: 403, message: 'Access to this path is not allowed.' })
  }

  if (!existsSync(absolutePath)) {
    throw createError({ statusCode: 404, message: 'Path not found.' })
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

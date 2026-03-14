import { getDb } from '../../db/index'

export default defineEventHandler(async () => {
  const db = getDb()
  const projects = await db('projects').select('*').orderBy('created_at', 'asc')

  // For each project, add language count + key count
  const withStats = await Promise.all(projects.map(async (p: any) => {
    const keyCount = await db('translation_keys').where({ project_id: p.id }).count('* as count').first()
    const langCount = await db('languages').where({ project_id: p.id }).count('* as count').first()
    return {
      ...p,
      git_repos: p.git_repos ? JSON.parse(p.git_repos) : [],
      key_count: Number((keyCount as any)?.count || 0),
      language_count: Number((langCount as any)?.count || 0),
    }
  }))

  return withStats
})

import { getDb } from '../../db/index'
import { createJob, runTranslationJob } from '../../utils/translation-job.util'

export default defineEventHandler(async (event) => {
  const { project_id, language_code, language_name } = await readBody(event)

  if (!project_id || !language_code) {
    throw createError({ statusCode: 400, message: 'project_id and language_code are required' })
  }

  const db = getDb()
  const job = createJob(Number(project_id), language_code, language_name || language_code)

  // Fire-and-forget — client polls for progress
  setImmediate(() => runTranslationJob(db, job))

  return { jobId: job.id, total: job.total }
})

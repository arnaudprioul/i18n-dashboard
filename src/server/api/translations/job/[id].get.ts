import { getJob } from '~/utils/translation-job.util'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id') || ''
  const job = getJob(id)

  if (!job) {
    throw createError({ statusCode: 404, message: 'Job not found' })
  }

  const percent = job.total > 0 ? Math.round((job.done / job.total) * 100) : 0

  return {
    id: job.id,
    status: job.status,
    languageCode: job.languageCode,
    languageName: job.languageName,
    total: job.total,
    done: job.done,
    errors: job.errors,
    percent,
  }
})

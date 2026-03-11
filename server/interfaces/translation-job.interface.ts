import type { JobStatus } from '../consts/translation-job.const'

export interface TranslationJob {
  id: string
  status: JobStatus
  projectId: number
  languageCode: string
  languageName: string
  total: number
  done: number
  errors: number
  startedAt: number
}

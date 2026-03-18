import type { JOB_STATUS } from '../enums/translation-job.enum'

export interface ITranslationJob {
  id: string
  status: JOB_STATUS
  projectId: number
  languageCode: string
  languageName: string
  total: number
  done: number
  errors: number
  startedAt: number
}

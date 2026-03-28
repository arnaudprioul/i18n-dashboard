import { SBase } from './base.service'

export interface IDbConfigResult {
  type: string
  connection?: string
  host?: string
  port?: string
  user?: string
  database?: string
  fileExists?: boolean
}

export interface IDbConfigPayload {
  type: string
  connection?: string
  host?: string
  port?: string
  user?: string
  password?: string
  database?: string
  testOnly?: boolean
  createFile?: boolean
}

export interface IAuthStatusResult {
  hasUsers: boolean
}

class SOnboarding extends SBase {
  async getDbConfig(checkPath?: string): Promise<IDbConfigResult> {
    return this.get<IDbConfigResult>('/api/db-config', {
      query: checkPath ? { checkPath } : {},
      skipErrorToast: true,
    })
  }

  async saveDbConfig(data: IDbConfigPayload): Promise<void> {
    return this.post('/api/db-config', { body: data, skipDedup: true, skipErrorToast: true })
  }

  async setup(data: { name: string; email: string; password: string }): Promise<void> {
    return this.post('/api/setup', { body: data, skipDedup: true, skipErrorToast: true })
  }

  async saveLanguages(data: { languages: Array<{ code: string; name: string }>; defaultLanguage: string }): Promise<void> {
    return this.post('/api/onboarding', { body: data, skipDedup: true })
  }

  async getAuthStatus(): Promise<IAuthStatusResult> {
    return this.get<IAuthStatusResult>('/api/auth/status', { skipErrorToast: true })
  }

  async getConfig(): Promise<any> {
    return this.get<any>('/api/config')
  }
}

export const onboardingService = new SOnboarding()

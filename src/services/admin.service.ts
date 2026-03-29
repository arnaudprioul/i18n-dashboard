import { SBase } from './base.service'

export interface ISmtpConfig {
  host: string
  port: string
  secure: boolean | string
  user: string
  from: string
  dashboardUrl: string
  hasPassword: boolean
}

export interface ISmtpPayload {
  host: string
  port: string
  secure: boolean
  user: string
  pass: string
  from: string
  dashboardUrl: string
}

export interface ILogQuery {
  page?: number
  limit?: number
  level?: string
  context?: string
}

export interface ILogEntry {
  id: number
  level: string
  context: string
  message: string
  details?: string
  created_at: string
}

export interface ILogResponse {
  data: ILogEntry[]
  total: number
}

export interface ICustomizationData {
  hasConfigFile?: boolean
  branding?: { name?: string; subtitle?: string; logoUrl?: string }
  theme?: { primary?: string; neutral?: string }
  customWidgets?: any[]
}

export interface ICustomizationPayload {
  branding: { name: string; subtitle: string; logoUrl: string }
  theme: { primary: string; neutral: string }
  customWidgets: any[]
}

class SAdmin extends SBase {
  async getSmtp(): Promise<ISmtpConfig> {
    return this.get<ISmtpConfig>('/api/admin/smtp')
  }

  async saveSmtp(data: ISmtpPayload): Promise<void> {
    return this.post('/api/admin/smtp', { body: data, skipDedup: true })
  }

  async testSmtp(to: string): Promise<void> {
    return this.post('/api/admin/smtp-test', { body: { to }, skipDedup: true })
  }

  async getLogs(params: ILogQuery): Promise<ILogResponse> {
    return this.get<ILogResponse>('/api/admin/logs', { query: params })
  }

  async purgeLogs(): Promise<{ deleted: number }> {
    return this.delete<{ deleted: number }>('/api/admin/logs', { skipDedup: true })
  }

  async getCustomization(): Promise<ICustomizationData> {
    return this.get<ICustomizationData>('/api/admin/customization')
  }

  async saveCustomization(data: ICustomizationPayload): Promise<void> {
    return this.post('/api/admin/customization', { body: data, skipDedup: true })
  }
}

export const adminService = new SAdmin()

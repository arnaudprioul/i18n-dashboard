import { getDb } from '../db'

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireNumber: boolean
  requireSpecial: boolean
}

export async function getPasswordPolicy(): Promise<PasswordPolicy> {
  const db = getDb()
  const rows = await db('settings')
    .whereIn('key', [
      'password_min_length',
      'password_require_uppercase',
      'password_require_number',
      'password_require_special',
    ])
    .select('key', 'value')

  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value

  return {
    minLength: Math.max(1, parseInt(map.password_min_length || '8')),
    requireUppercase: map.password_require_uppercase === 'true',
    requireNumber: map.password_require_number === 'true',
    requireSpecial: map.password_require_special === 'true',
  }
}

export function validatePassword(password: string, policy: PasswordPolicy): { valid: boolean; message?: string } {
  if (password.length < policy.minLength) {
    return { valid: false, message: `Le mot de passe doit contenir au moins ${policy.minLength} caractère${policy.minLength > 1 ? 's' : ''}` }
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule' }
  }
  if (policy.requireNumber && !/[0-9]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' }
  }
  if (policy.requireSpecial && !/[^a-zA-Z0-9]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins un caractère spécial' }
  }
  return { valid: true }
}

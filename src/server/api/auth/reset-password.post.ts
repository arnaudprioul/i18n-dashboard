import bcrypt from 'bcryptjs'
import { createHash } from 'node:crypto'
import { getDb } from '../../db/index'
import { getPasswordPolicy, validatePassword } from '../../utils/password.util'
import { useRuntimeConfig } from 'nitropack/runtime'

export default defineEventHandler(async (event) => {
  const { token, password, confirm_password } = await readBody(event)

  if (!token || !password || !confirm_password) {
    throw createError({ statusCode: 400, message: 'Token, mot de passe et confirmation requis' })
  }
  if (password !== confirm_password) {
    throw createError({ statusCode: 400, message: 'Les mots de passe ne correspondent pas' })
  }

  const policy = await getPasswordPolicy()
  const validation = validatePassword(password, policy)
  if (!validation.valid) {
    throw createError({ statusCode: 400, message: validation.message! })
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const db = getDb()

  const row = await db('password_reset_tokens')
    .where({ token_hash: tokenHash })
    .where('expires_at', '>', new Date())
    .first()

  if (!row) {
    throw createError({ statusCode: 400, message: 'Lien invalide ou expiré' })
  }

  const config = useRuntimeConfig()
  const hash = await bcrypt.hash(password, Number(config.bcryptRounds) || 12)
  await db('users').where({ id: row.user_id }).update({ password_hash: hash })
  await db('password_reset_tokens').where({ id: row.id }).delete()

  return { success: true }
})

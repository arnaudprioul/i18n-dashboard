import bcrypt from 'bcryptjs'
import { getDb } from '../db/index'
import { getSession, createRefreshToken } from '../utils/auth.util'
import { getPasswordPolicy, validatePassword } from '../utils/password.util'
import { useRuntimeConfig } from 'nitropack/runtime'

export default defineEventHandler(async (event) => {
  const db = getDb()

  // Only allowed when no users exist yet
  const count = await db('users').count('* as count').first()
  if (Number((count as any)?.count || 0) > 0) {
    throw createError({ statusCode: 403, message: 'Le setup a déjà été effectué' })
  }

  const { name, email, password } = await readBody(event)

  if (!name || !email || !password) {
    throw createError({ statusCode: 400, message: 'Nom, email et mot de passe requis' })
  }

  const policy = await getPasswordPolicy()
  const validation = validatePassword(password, policy)
  if (!validation.valid) {
    throw createError({ statusCode: 400, message: validation.message! })
  }

  const config = useRuntimeConfig()
  const hash = await bcrypt.hash(password, Number(config.bcryptRounds) || 12)
  const [id] = await db('users').insert({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password_hash: hash,
    is_super_admin: true,
    is_active: true,
  })

  // Auto-login: session (15 min) + refresh token (7 days)
  const session = await getSession(event)
  await session.update({ userId: id })
  await createRefreshToken(event, id)

  console.log(`[i18n-dashboard] Super admin créé : ${email}`)

  return { success: true, id }
})

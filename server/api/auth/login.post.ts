import bcrypt from 'bcryptjs'
import { getDb } from '../../db/index'
import { getSession } from '../../utils/auth.util'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Email et mot de passe requis' })
  }

  const db = getDb()
  const user = await db('users').where({ email: email.toLowerCase().trim(), is_active: true }).first()

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw createError({ statusCode: 401, message: 'Email ou mot de passe incorrect' })
  }

  // Update last login
  await db('users').where({ id: user.id }).update({ last_login_at: db.fn.now() })

  // Set session
  const session = await getSession(event)
  await session.update({ userId: user.id })

  const { password_hash, ...safeUser } = user
  return safeUser
})

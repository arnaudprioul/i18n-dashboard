import bcrypt from 'bcryptjs'
import { getDb } from '../../db/index'
import { requireAuth } from '../../utils/auth.util'
import { getPasswordPolicy, validatePassword } from '../../utils/password.util'
import { useRuntimeConfig } from 'nitropack/runtime'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { current_password, new_password } = await readBody(event)

  if (!current_password || !new_password) {
    throw createError({ statusCode: 400, message: 'Mot de passe actuel et nouveau requis' })
  }

  const policy = await getPasswordPolicy()
  const validation = validatePassword(new_password, policy)
  if (!validation.valid) {
    throw createError({ statusCode: 400, message: validation.message! })
  }

  const db = getDb()
  const fullUser = await db('users').where({ id: user.id }).first()

  if (!(await bcrypt.compare(current_password, fullUser.password_hash))) {
    throw createError({ statusCode: 401, message: 'Mot de passe actuel incorrect' })
  }

  const config = useRuntimeConfig()
  const hash = await bcrypt.hash(new_password, Number(config.bcryptRounds) || 12)
  await db('users').where({ id: user.id }).update({ password_hash: hash })

  return { success: true }
})

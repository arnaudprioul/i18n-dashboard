import bcrypt from 'bcryptjs'
import { getDb } from '../../db/index'
import { requireAuth } from '~/server/utils/auth.util'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { current_password, new_password } = await readBody(event)

  if (!current_password || !new_password) {
    throw createError({ statusCode: 400, message: 'Mot de passe actuel et nouveau requis' })
  }
  if (new_password.length < 8) {
    throw createError({ statusCode: 400, message: 'Le mot de passe doit contenir au moins 8 caractères' })
  }

  const db = getDb()
  const fullUser = await db('users').where({ id: user.id }).first()

  if (!(await bcrypt.compare(current_password, fullUser.password_hash))) {
    throw createError({ statusCode: 401, message: 'Mot de passe actuel incorrect' })
  }

  const hash = await bcrypt.hash(new_password, 12)
  await db('users').where({ id: user.id }).update({ password_hash: hash })

  return { success: true }
})

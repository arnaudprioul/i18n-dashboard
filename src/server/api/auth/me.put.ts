import { getDb } from '../../db/index'
import { getUserProfile } from '../../../utils/auth.util'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  const { name, email } = await readBody(event)

  if (!name?.trim() && !email?.trim()) {
    throw createError({ statusCode: 400, message: 'At least one field (name or email) is required' })
  }

  const db = getDb()
  const updates: Record<string, string> = {}

  if (name?.trim()) {
    updates.name = name.trim()
  }

  if (email?.trim()) {
    const normalized = email.trim().toLowerCase()
    const existing = await db('users').where({ email: normalized }).whereNot({ id: user.id }).first()
    if (existing) {
      throw createError({ statusCode: 409, message: 'This email is already in use' })
    }
    updates.email = normalized
  }

  await db('users').where({ id: user.id }).update(updates)

  return getUserProfile(user.id)
})

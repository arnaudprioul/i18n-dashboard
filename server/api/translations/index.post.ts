import { getDb } from '../../db/index'
import { TRANSLATION_STATUS } from '../../enums/translation.enum'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { key_id, language_code, value, status } = body

  if (!key_id || !language_code) {
    throw createError({ statusCode: 400, message: 'key_id and language_code are required' })
  }

  const db = getDb()

  const key = await db('translation_keys').where({ id: Number(key_id) }).first()
  if (!key) throw createError({ statusCode: 404, message: 'Translation key not found' })

  const lang = await db('languages').where({ code: language_code }).first()
  if (!lang) throw createError({ statusCode: 404, message: 'Language not found' })

  const existing = await db('translations').where({ key_id: Number(key_id), language_code }).first()

  if (existing) {
    const oldValue = existing.value
    const updates: Record<string, any> = { updated_at: db.fn.now() }

    if (value !== undefined) updates.value = value
    if (status !== undefined) updates.status = status
    // Editing a value resets status to draft unless explicitly set
    if (value !== undefined && value !== oldValue && status === undefined) {
      updates.status = TRANSLATION_STATUS.DRAFT
    }

    if (oldValue !== value && value !== undefined) {
      await db('translation_history').insert({
        translation_id: existing.id,
        old_value: oldValue,
        new_value: value,
        changed_by: 'user',
      })
    }

    await db('translations').where({ id: existing.id }).update(updates)
    return db('translations').where({ id: existing.id }).first()
  }

  // Create new translation
  const [id] = await db('translations').insert({
    key_id: Number(key_id),
    language_code,
    value,
    status: status || TRANSLATION_STATUS.DRAFT,
  })

  await db('translation_history').insert({
    translation_id: id,
    old_value: null,
    new_value: value,
    changed_by: 'user',
  })

  return db('translations').where({ id }).first()
})

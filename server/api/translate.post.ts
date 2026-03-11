import { translate } from '@vitalets/google-translate-api'
import { getDb } from '../db/index'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { text, from, to, key_id, language_code } = body

  if (!text || !to) {
    throw createError({ statusCode: 400, message: 'text and to are required' })
  }

  try {
    const result = await translate(text, { from: from || 'auto', to })
    const translatedText = result.text

    // If key_id and language_code provided, save the translation
    if (key_id && language_code) {
      const db = getDb()
      const existing = await db('translations').where({ key_id: Number(key_id), language_code }).first()

      if (existing) {
        if (existing.value !== translatedText) {
          await db('translation_history').insert({
            translation_id: existing.id,
            old_value: existing.value,
            new_value: translatedText,
            changed_by: 'google-translate',
          })
          await db('translations')
            .where({ id: existing.id })
            .update({ value: translatedText, updated_at: db.fn.now() })
        }
      } else {
        const [id] = await db('translations').insert({
          key_id: Number(key_id),
          language_code,
          value: translatedText,
        })
        await db('translation_history').insert({
          translation_id: id,
          old_value: null,
          new_value: translatedText,
          changed_by: 'google-translate',
        })
      }
    }

    return { text: translatedText }
  } catch (err: any) {
    throw createError({ statusCode: 500, message: `Translation failed: ${err.message}` })
  }
})

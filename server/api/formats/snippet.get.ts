import { getDb } from '../../db/index'

export default defineEventHandler(async (event) => {
  const { project_id } = getQuery(event)
  if (!project_id) throw createError({ statusCode: 400, message: 'project_id is required' })
  const db = getDb()
  const pid = Number(project_id)

  const [numRows, dtRows, modRows, languages] = await Promise.all([
    db('project_number_formats').where({ project_id: pid }).orderBy('locale').orderBy('name'),
    db('project_datetime_formats').where({ project_id: pid }).orderBy('locale').orderBy('name'),
    db('project_modifiers').where({ project_id: pid }).orderBy('name'),
    db('languages').where({ project_id: pid }).orderBy('is_default', 'desc').orderBy('code'),
  ])

  // Build numberFormats object
  const numberFormats: Record<string, Record<string, any>> = {}
  for (const row of numRows) {
    if (!numberFormats[row.locale]) numberFormats[row.locale] = {}
    numberFormats[row.locale][row.name] = JSON.parse(row.options || '{}')
  }

  // Build datetimeFormats object
  const datetimeFormats: Record<string, Record<string, any>> = {}
  for (const row of dtRows) {
    if (!datetimeFormats[row.locale]) datetimeFormats[row.locale] = {}
    datetimeFormats[row.locale][row.name] = JSON.parse(row.options || '{}')
  }

  // Build modifiers
  const modifiers: Record<string, string> = {}
  for (const row of modRows) {
    modifiers[row.name] = row.body
  }

  const defaultLang = languages.find((l: any) => l.is_default)?.code || languages[0]?.code || 'en'

  // Generate snippet
  const lines: string[] = []
  lines.push(`import { createI18n } from 'vue-i18n'`)
  lines.push(``)

  if (Object.keys(numberFormats).length) {
    lines.push(`const numberFormats = ${JSON.stringify(numberFormats, null, 2)}`)
    lines.push(``)
  }

  if (Object.keys(datetimeFormats).length) {
    lines.push(`const datetimeFormats = ${JSON.stringify(datetimeFormats, null, 2)}`)
    lines.push(``)
  }

  lines.push(`const i18n = createI18n({`)
  lines.push(`  locale: '${defaultLang}',`)
  lines.push(`  legacy: false,`)

  if (Object.keys(numberFormats).length) {
    lines.push(`  numberFormats,`)
  }
  if (Object.keys(datetimeFormats).length) {
    lines.push(`  datetimeFormats,`)
  }

  if (Object.keys(modifiers).length) {
    lines.push(`  modifiers: {`)
    for (const [name, body] of Object.entries(modifiers)) {
      lines.push(`    ${name}: ${body},`)
    }
    lines.push(`  },`)
  }

  lines.push(`  messages: {`)
  for (const lang of languages) {
    lines.push(`    ${lang.code}: await fetch('[your-dashboard-url]/locale/${lang.code}.json').then(r => r.json()),`)
  }
  lines.push(`  },`)
  lines.push(`})`)
  lines.push(``)
  lines.push(`export default i18n`)

  return {
    snippet: lines.join('\n'),
    numberFormats,
    datetimeFormats,
    modifiers,
  }
})

import { getDb } from '../../db/index'
import { unflattenObject } from '../../../utils/lang-api.util'
import type { Knex } from 'knex'

/**
 * Normalise une URL en gardant uniquement origin (scheme + host + port).
 */
function normalizeOrigin(url: string): string {
  try {
    return new URL(url).origin.toLowerCase()
  } catch {
    return url.toLowerCase().replace(/\/$/, '')
  }
}

/**
 * Remonte d'un niveau dans un tag BCP 47.
 * fr-CA → fr | zh-Hant-TW → zh-Hant | fr → null
 */
function parentBcp47(code: string): string | null {
  const parts = code.split('-')
  if (parts.length <= 1) return null
  parts.pop()
  return parts.join('-')
}

/**
 * Construit la chaîne de fallback pour `requestedCode` dans un projet.
 * Résolution :
 *   1. Si la langue existe dans le projet → l'ajoute à la chaîne
 *      puis suit son fallback_code explicite (ou auto BCP 47 si absent)
 *   2. Si la langue n'existe PAS → remonte le tag BCP 47 (fr-CA → fr)
 *      jusqu'à trouver une langue configurée dans le projet
 * La chaîne est ordonnée du plus spécifique au moins spécifique.
 */
async function buildFallbackChain(
  db: Knex,
  projectId: number,
  requestedCode: string,
): Promise<string[]> {
  const chain: string[] = []
  const visited = new Set<string>()
  let current: string | null = requestedCode

  while (current && !visited.has(current) && chain.length < 10) {
    visited.add(current)
    const langRow = await db('languages')
      .where({ project_id: projectId, code: current })
      .first()

    if (!langRow) {
      // Langue non configurée dans ce projet → tenter le parent BCP 47
      current = parentBcp47(current)
      continue
    }

    chain.push(current)

    if (langRow.fallback_code) {
      // Fallback explicitement configuré
      current = langRow.fallback_code
    } else {
      // Auto-fallback BCP 47 : fr-CA → fr → null
      current = parentBcp47(current)
    }
  }

  return chain
}

/**
 * Charge toutes les traductions non-nulles d'une locale donnée dans un projet.
 */
async function loadTranslations(
  db: Knex,
  projectId: number,
  langCode: string,
): Promise<Record<string, string>> {
  // Only serve the `approved_value` — the value frozen at last approval.
  // Translations that have never been approved (approved_value IS NULL) are
  // intentionally excluded so that drafts/reviews never leak to end-users.
  const rows = await db('translations as t')
    .join('translation_keys as k', 't.key_id', 'k.id')
    .where('t.language_code', langCode)
    .where('k.project_id', projectId)
    .whereNotNull('t.approved_value')
    .where('t.approved_value', '!=', '')
    .select('k.key', 't.approved_value as value')

  const flat: Record<string, string> = {}
  for (const row of rows) flat[row.key] = row.value
  return flat
}

export default defineEventHandler(async (event) => {
  // Extract lang from the URL - handles /locale/fr-CA.json
  const url = event.path || getRequestURL(event).pathname
  const match = url.match(/\/locale\/([^/]+)\.json/)
  const lang = match ? match[1] : getRouterParam(event, 'lang')

  if (!lang) {
    throw createError({ statusCode: 400, message: 'Language code is required' })
  }

  const db = getDb()
  const query = getQuery(event)

  let projectId: number | null = query.project_id ? Number(query.project_id) : null

  if (!projectId) {
    // 1. Match by project_name query param
    if (query.project_name) {
      const p = await db('projects').where({ name: query.project_name.toString() }).first()
      if (p) projectId = p.id
    }

    // 2. Match by request Origin / Referer against project source_url (supports multiple URLs, one per line)
    if (!projectId) {
      const requestOrigin = getHeader(event, 'origin') || getHeader(event, 'referer') || ''
      if (requestOrigin) {
        const normalizedRequest = normalizeOrigin(requestOrigin)
        const projectsWithUrl = await db('projects')
          .whereNotNull('source_url')
          .where('source_url', '!=', '')
          .select('id', 'source_url')

        for (const p of projectsWithUrl) {
          const urls = p.source_url.split(/[\n,]+/).map((u: string) => u.trim()).filter(Boolean)
          if (urls.some((u: string) => normalizeOrigin(u) === normalizedRequest)) {
            projectId = p.id
            break
          }
        }
      }
    }

    // 3. Fallback: first non-system project
    if (!projectId) {
      const firstProject = await db('projects')
        .where({ is_system: false })
        .orderBy('id', 'asc')
        .first()
      if (firstProject) projectId = firstProject.id
    }
  }

  if (!projectId) {
    throw createError({ statusCode: 404, message: 'No project found' })
  }

  // ── Fallback chain resolution ─────────────────────────────────────────────
  const chain = await buildFallbackChain(db, projectId, lang)

  if (chain.length === 0) {
    throw createError({
      statusCode: 404,
      message: `Language '${lang}' not found in this project and no BCP 47 fallback available`,
    })
  }

  const project = await db('projects').where({ id: projectId }).first()
  const separator = project?.key_separator || '.'

  // Merge translations: du moins spécifique au plus spécifique
  // chain[0] = fr-CA (priorité max), chain[last] = fr ou en (priorité min)
  // On charge du dernier au premier et on écrase — ainsi fr-CA prime sur fr
  const flat: Record<string, string> = {}
  for (const code of [...chain].reverse()) {
    const translations = await loadTranslations(db, projectId, code)
    Object.assign(flat, translations)
  }

  const nested = unflattenObject(flat, separator)

  setHeader(event, 'Content-Type', 'application/json')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Access-Control-Allow-Origin', '*')

  // Expose la chaîne résolue dans les headers pour debug
  setHeader(event, 'X-I18n-Fallback-Chain', chain.join(' → '))

  return nested
})

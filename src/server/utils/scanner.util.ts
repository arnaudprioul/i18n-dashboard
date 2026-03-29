import { readdirSync, readFileSync, statSync, existsSync } from 'fs'
import { resolve, extname, relative, basename } from 'path'

import type { IDetectedFormats, IDetectedLanguage, IKeyUsage, IScanResult } from '../../interfaces/scanner.interface'
import { AVAILABLE_LOCALES_PATTERN, LOCALE_ARRAY_PATTERN, LOCALE_SINGLE_PATTERN } from '../../consts/scanner.const'
import { LANGUAGES } from '../../consts/languages.const'

// ── Format detection helpers ───────────────────────────────────────────────

/**
 * Extract a balanced braces block from content starting at fromIndex.
 * Handles string literals, line/block comments.
 */
function extractBracedBlock(content: string, fromIndex: number): string | null {
  let depth = 0
  let startIdx = -1
  let i = fromIndex

  while (i < content.length) {
    const ch = content[i]

    if (ch === '`') {
      i++
      while (i < content.length) {
        if (content[i] === '\\') { i += 2; continue }
        if (content[i] === '$' && content[i + 1] === '{') {
          i += 2
          let d = 1
          while (i < content.length && d > 0) {
            if (content[i] === '{') d++
            else if (content[i] === '}') d--
            i++
          }
          continue
        }
        if (content[i] === '`') break
        i++
      }
      i++
      continue
    }

    if (ch === '"' || ch === "'") {
      const q = ch; i++
      while (i < content.length) {
        if (content[i] === '\\') { i += 2; continue }
        if (content[i] === q) break
        i++
      }
      i++; continue
    }

    if (ch === '/' && content[i + 1] === '/') {
      while (i < content.length && content[i] !== '\n') i++
      continue
    }

    if (ch === '/' && content[i + 1] === '*') {
      i += 2
      while (i < content.length && !(content[i] === '*' && content[i + 1] === '/')) i++
      i += 2; continue
    }

    if (ch === '{') {
      if (depth === 0) startIdx = i
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0 && startIdx >= 0) return content.slice(startIdx, i + 1)
    }

    i++
  }
  return null
}

/**
 * Normalize a JS object literal string to valid JSON.
 */
function tryParseAsJson(raw: string): Record<string, any> | null {
  try {
    const s = raw
      .replace(/\/\/[^\n]*/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/([{,]\s*)\n?\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1\n"$2":')
      .replace(/'([^'\\]*)'/g, '"$1"')
      .replace(/,(\s*[}\]])/g, '$1')
    return JSON.parse(s)
  } catch {
    return null
  }
}

function extractFormatObject(
  content: string,
  key: string,
): Record<string, Record<string, Record<string, any>>> {
  const pattern = new RegExp(`\\b${key}\\s*[=:]\\s*`, 'g')
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content)) !== null) {
    const afterKey = match.index + match[0].length
    const braceStart = content.indexOf('{', afterKey)
    if (braceStart < 0 || braceStart - afterKey > 5) continue

    const block = extractBracedBlock(content, braceStart)
    if (!block) continue

    const parsed = tryParseAsJson(block)
    if (!parsed) continue

    const result: Record<string, Record<string, Record<string, any>>> = {}
    let valid = true
    for (const [locale, formats] of Object.entries(parsed)) {
      if (typeof formats !== 'object' || formats === null || Array.isArray(formats)) { valid = false; break }
      result[locale] = {}
      for (const [name, options] of Object.entries(formats as any)) {
        if (typeof options !== 'object' || options === null || Array.isArray(options)) { valid = false; break }
        result[locale][name] = options as Record<string, any>
      }
      if (!valid) break
    }

    if (valid && Object.keys(result).length > 0) return result
  }
  return {}
}

function extractModifiersContent(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  const pattern = /\bmodifiers\s*[=:]\s*/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content)) !== null) {
    const afterKey = match.index + match[0].length
    const braceStart = content.indexOf('{', afterKey)
    if (braceStart < 0 || braceStart - afterKey > 5) continue

    const block = extractBracedBlock(content, braceStart)
    if (!block) continue

    const inner = block.slice(1, -1)
    let pos = 0

    while (pos < inner.length) {
      while (pos < inner.length && /[\s,]/.test(inner[pos])) pos++
      if (pos >= inner.length) break

      const keyMatch = /^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/.exec(inner.slice(pos))
      if (!keyMatch) break

      const key = keyMatch[1]
      pos += keyMatch[0].length
      while (pos < inner.length && /\s/.test(inner[pos])) pos++

      let depth = 0
      const valueStart = pos
      let inStr = false; let strCh = ''

      while (pos < inner.length) {
        const ch = inner[pos]
        if (inStr) {
          if (ch === '\\') { pos += 2; continue }
          if (ch === strCh) inStr = false
          pos++; continue
        }
        if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strCh = ch; pos++; continue }
        if (ch === '{' || ch === '(' || ch === '[') { depth++; pos++; continue }
        if (ch === '}' || ch === ')' || ch === ']') {
          if (depth === 0) break
          depth--; pos++; continue
        }
        if (ch === ',' && depth === 0) break
        pos++
      }

      const value = inner.slice(valueStart, pos).trim()
      if (value) result[key] = value
      if (pos < inner.length && inner[pos] === ',') pos++
    }

    if (Object.keys(result).length > 0) return result
  }
  return result
}

/**
 * Scan i18n config files in the project root for numberFormats, datetimeFormats and modifiers.
 */
export function detectFormats(options: { projectRoot: string }): IDetectedFormats {
  const { projectRoot } = options

  const configFileNames = [
    'i18n.js', 'i18n.ts', 'i18n.mjs', 'i18n.mts',
    'i18n/index.js', 'i18n/index.ts',
    'nuxt.config.js', 'nuxt.config.ts', 'nuxt.config.mjs',
    'vite.config.js', 'vite.config.ts',
    'src/i18n.js', 'src/i18n.ts', 'src/i18n/index.js', 'src/i18n/index.ts',
    'src/plugins/i18n.js', 'src/plugins/i18n.ts',
  ]

  for (const relPath of configFileNames) {
    const absPath = resolve(projectRoot, relPath)
    if (!existsSync(absPath)) continue

    let content: string
    try { content = readFileSync(absPath, 'utf-8') } catch { continue }

    const numberFormats = extractFormatObject(content, 'numberFormats')
    const datetimeFormats = extractFormatObject(content, 'datetimeFormats')
    const modifiers = extractModifiersContent(content)

    if (Object.keys(numberFormats).length || Object.keys(datetimeFormats).length || Object.keys(modifiers).length) {
      return { numberFormats, datetimeFormats, modifiers, sourceFile: relPath }
    }
  }

  return { numberFormats: {}, datetimeFormats: {}, modifiers: {}, sourceFile: null }
}

// ── End format detection ───────────────────────────────────────────────────

function langName(code: string): string {
  return LANGUAGES[code.toLowerCase()] || code.toUpperCase()
}

function extractCodesFromArray(str: string): string[] {
  return [...str.matchAll(/['"`]([a-z]{2}(?:-[a-z]{2,4})?)[`'"]/gi)].map((m) => m[1].toLowerCase())
}

/**
 * Detect languages from:
 * 1. JSON files in the locales directory
 * 2. i18n config files in the project (i18n.js, i18n.ts, nuxt.config.ts, etc.)
 */
export function detectLanguages(options: {
  projectRoot: string
  localesPath: string
}): IDetectedLanguage[] {
  const { projectRoot, localesPath } = options
  const found = new Map<string, IDetectedLanguage>()

  // ── 1. Locale JSON files ──────────────────────────────────────────────
  const absLocalesPath = resolve(projectRoot, localesPath)
  if (existsSync(absLocalesPath)) {
    try {
      const files = readdirSync(absLocalesPath)
      for (const file of files) {
        if (extname(file) !== '.json') continue
        const code = basename(file, '.json').toLowerCase()
        if (/^[a-z]{2}(-[a-z]{2,4})?$/.test(code)) {
          found.set(code, { code, name: langName(code), source: 'locales-dir' })
        }
      }
    } catch { /* ignore */ }
  }

  // ── 2. Scan config files for locale declarations ───────────────────────
  const configFileNames = [
    'i18n.js', 'i18n.ts', 'i18n.mjs', 'i18n.mts',
    'i18n/index.js', 'i18n/index.ts',
    'nuxt.config.js', 'nuxt.config.ts', 'nuxt.config.mjs',
    'vite.config.js', 'vite.config.ts',
    'vue.config.js', 'vue.config.ts',
    'src/i18n.js', 'src/i18n.ts', 'src/i18n/index.js', 'src/i18n/index.ts',
    'src/plugins/i18n.js', 'src/plugins/i18n.ts',
  ]

  for (const relPath of configFileNames) {
    const absPath = resolve(projectRoot, relPath)
    if (!existsSync(absPath)) continue

    let content: string
    try { content = readFileSync(absPath, 'utf-8') } catch { continue }

    // locales: ['fr', 'en']
    for (const match of content.matchAll(LOCALE_ARRAY_PATTERN)) {
      for (const code of extractCodesFromArray(match[1])) {
        if (!found.has(code)) found.set(code, { code, name: langName(code), source: 'config-file' })
      }
    }

    // locales: [{ code: 'fr' }, ...]
    const objPattern = /locales\s*:\s*\[[\s\S]*?code\s*:\s*['"]([a-z]{2}(?:-[a-z]{2,4})?)['"]/gi
    for (const match of content.matchAll(objPattern)) {
      const code = match[1].toLowerCase()
      if (!found.has(code)) found.set(code, { code, name: langName(code), source: 'config-file' })
    }

    // availableLocales: ['fr', 'en']
    for (const match of content.matchAll(AVAILABLE_LOCALES_PATTERN)) {
      for (const code of extractCodesFromArray(match[1])) {
        if (!found.has(code)) found.set(code, { code, name: langName(code), source: 'config-file' })
      }
    }

    // locale: 'fr', defaultLocale: 'fr', fallbackLocale: 'en'
    for (const match of content.matchAll(LOCALE_SINGLE_PATTERN)) {
      const code = match[1].toLowerCase()
      if (!found.has(code)) found.set(code, { code, name: langName(code), source: 'config-file' })
    }
  }

  return [...found.values()]
}

// All vue-i18n function call patterns
const PATTERNS: Array<{ regex: RegExp; fn: string }> = [
  // Template: $t('key'), $t("key"), $t(`key`)
  { regex: /\$t\s*\(\s*['"`]([^'"`\n]+)['"`]/g, fn: '$t' },
  // Template: $tc('key'), $te('key'), $tm('key')
  { regex: /\$tc\s*\(\s*['"`]([^'"`\n]+)['"`]/g, fn: '$tc' },
  { regex: /\$te\s*\(\s*['"`]([^'"`\n]+)['"`]/g, fn: '$te' },
  { regex: /\$tm\s*\(\s*['"`]([^'"`\n]+)['"`]/g, fn: '$tm' },
  // i18n.t(), i18n.global.t()
  { regex: /i18n(?:\.global)?\.t\s*\(\s*['"`]([^'"`\n]+)['"`]/g, fn: 'i18n.t' },
  { regex: /i18n(?:\.global)?\.tc\s*\(\s*['"`]([^'"`\n]+)['"`]/g, fn: 'i18n.tc' },
  // <i18n-t keypath="key"> component
  { regex: /keypath\s*=\s*['"]([^'"]+)['"]/g, fn: 'i18n-t' },
  // v-t directive: v-t="'key'" or v-t='"key"'
  { regex: /v-t\s*=\s*"'([^']+)'"/g, fn: 'v-t' },
  { regex: /v-t\s*=\s*'"([^"]+)"'/g, fn: 'v-t' },
  { regex: /v-t\s*=\s*'([^']+)'/g, fn: 'v-t' },
]

// Pattern to detect any i18n composable in a file — to allow t() scanning
const USE_I18N_PATTERN = /use(?:I18n|Locale|Trans(?:lations?)?)\s*\(/
// Pattern for t() only when an i18n composable is present
const T_FUNCTION_PATTERN = /(?<![.$\w])t\s*\(\s*['"`]([^'"`\n]+)['"`]/g
const TC_FUNCTION_PATTERN = /(?<![.$\w])tc\s*\(\s*['"`]([^'"`\n]+)['"`]/g
const TE_FUNCTION_PATTERN = /(?<![.$\w])te\s*\(\s*['"`]([^'"`\n]+)['"`]/g
const TM_FUNCTION_PATTERN = /(?<![.$\w])tm\s*\(\s*['"`]([^'"`\n]+)['"`]/g

// Pattern for t(variable) calls — argument is not a string literal
const T_VARIABLE_PATTERN = /(?<![.$\w])t\s*\(\s*(?!['"`])([a-zA-Z_$][a-zA-Z0-9_$.?]*)/g

// i18n key heuristic: at least 2 dot-separated segments, alphanumeric/camelCase only
// Rejects URLs, paths, CSS selectors, version strings, etc.
const I18N_KEY_HEURISTIC = /^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*){1,}$/

// Strings to exclude even if they match the heuristic (common false-positives)
const EXCLUDE_PATTERNS = [
  /^https?:\/\//,       // URLs
  /\//,                  // Paths
  /\s/,                  // Whitespace
  /^\d/,                 // Starts with a digit
  /@/,                   // Emails
]

function looksLikeI18nKey(value: string): boolean {
  if (!I18N_KEY_HEURISTIC.test(value)) return false
  if (EXCLUDE_PATTERNS.some(p => p.test(value))) return false
  return true
}

/**
 * When a file contains t(variable) calls, scan ALL string literals in the file
 * and return those that match the i18n key heuristic.
 * This handles: variable assignments, ternaries, arrays, objects, prop defaults, etc.
 */
function extractVariableKeyStrings(content: string, filePath: string): IKeyUsage[] {
  const usages: IKeyUsage[] = []

  // Only run if the file has at least one t(variable) call
  T_VARIABLE_PATTERN.lastIndex = 0
  if (!T_VARIABLE_PATTERN.test(content)) return usages

  // Collect all string literals in the file
  const stringLiteralPattern = /['"`]([^'"`\n\\]{2,100})['"`]/g
  let match: RegExpExecArray | null
  while ((match = stringLiteralPattern.exec(content)) !== null) {
    const value = match[1].trim()
    if (looksLikeI18nKey(value)) {
      const lineNumber = content.slice(0, match.index).split('\n').length
      usages.push({ key: value, filePath, lineNumber, detectedFunction: 't(variable)' })
    }
  }

  return usages
}

/**
 * Parse an <i18n> custom block from a .vue SFC and extract all keys
 */
function extractI18nBlock(content: string, filePath: string): IKeyUsage[] {
  const usages: IKeyUsage[] = []
  const i18nBlockRegex = /<i18n(?:\s[^>]*)?>[\s\S]*?<\/i18n>/g
  const blockMatch = i18nBlockRegex.exec(content)

  if (!blockMatch) return usages

  const block = blockMatch[0]
  // Get the line number of the block
  const linesBefore = content.slice(0, blockMatch.index).split('\n').length

  try {
    // Extract JSON content between tags
    const jsonMatch = block.match(/<i18n(?:\s[^>]*)?>[\s\S]*?(\{[\s\S]+\})\s*<\/i18n>/)
    if (!jsonMatch) return usages

    const json = JSON.parse(jsonMatch[1])

    // Keys may be nested under locale codes: { "en": { "key": "val" } }
    // or directly: { "key": "val" }
    // Detect by checking if top-level values are objects (locale-keyed)
    const firstVal = Object.values(json)[0]
    const messages = (firstVal && typeof firstVal === 'object' && !Array.isArray(firstVal))
      ? firstVal as Record<string, any>
      : json

    function extractKeys(obj: Record<string, any>, prefix = ''): void {
      for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}.${k}` : k
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          extractKeys(v, key)
        } else {
          usages.push({ key, filePath, lineNumber: linesBefore, detectedFunction: 'i18n-block' })
        }
      }
    }

    extractKeys(messages)
  } catch {
    // Ignore parse errors on malformed blocks
  }

  return usages
}

/**
 * Extract all vue-i18n key usages from a single file
 */
function scanFile(filePath: string, content: string): IKeyUsage[] {
  const usages: IKeyUsage[] = []
  const lines = content.split('\n')
  const hasUseI18n = USE_I18N_PATTERN.test(content)

  function getLineNumber(index: number): number {
    return content.slice(0, index).split('\n').length
  }

  // Apply all standard patterns
  for (const { regex, fn } of PATTERNS) {
    regex.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = regex.exec(content)) !== null) {
      const key = match[1].trim()
      if (key && !key.includes('${') && !key.includes('`')) {
        usages.push({
          key,
          filePath,
          lineNumber: getLineNumber(match.index),
          detectedFunction: fn,
        })
      }
    }
  }

  // t(), tc(), te(), tm() — only if useI18n is used in the file
  if (hasUseI18n) {
    const scriptPatterns = [
      { regex: T_FUNCTION_PATTERN, fn: 't' },
      { regex: TC_FUNCTION_PATTERN, fn: 'tc' },
      { regex: TE_FUNCTION_PATTERN, fn: 'te' },
      { regex: TM_FUNCTION_PATTERN, fn: 'tm' },
    ]
    for (const { regex, fn } of scriptPatterns) {
      regex.lastIndex = 0
      let match: RegExpExecArray | null
      while ((match = regex.exec(content)) !== null) {
        const key = match[1].trim()
        if (key && !key.includes('${') && !key.includes('`')) {
          usages.push({
            key,
            filePath,
            lineNumber: getLineNumber(match.index),
            detectedFunction: fn,
          })
        }
      }
    }
  }

  // <i18n> blocks in .vue files
  if (filePath.endsWith('.vue')) {
    usages.push(...extractI18nBlock(content, filePath))
  }

  // String literals that look like i18n keys, found in files with t(variable) calls
  if (hasUseI18n) {
    usages.push(...extractVariableKeyStrings(content, filePath))
  }

  return usages
}

/**
 * Collect all scannable files recursively
 */
function collectFiles(dir: string, excludeDirs: string[], extensions: string[]): string[] {
  const files: string[] = []

  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return files
  }

  for (const entry of entries) {
    const fullPath = resolve(dir, entry)

    // Skip excluded directories
    if (excludeDirs.some((ex) => entry === ex || fullPath.includes(`/${ex}/`))) continue

    try {
      const stat = statSync(fullPath)
      if (stat.isDirectory()) {
        files.push(...collectFiles(fullPath, excludeDirs, extensions))
      } else if (extensions.includes(extname(entry))) {
        files.push(fullPath)
      }
    } catch {
      // Skip unreadable files
    }
  }

  return files
}

/**
 * Main scanner — scans the project for vue-i18n key usages
 */
export function scanProject(options: {
  projectRoot: string
  excludeDirs?: string[]
  extensions?: string[]
}): IScanResult {
  const {
    projectRoot,
    excludeDirs = ['node_modules', 'dist', '.nuxt', '.output', '.git', 'coverage'],
    extensions = ['.vue', '.ts', '.js', '.mts', '.mjs'],
  } = options

  const usages: IKeyUsage[] = []
  const errors: string[] = []

  const files = collectFiles(projectRoot, excludeDirs, extensions)

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf-8')
      const relPath = relative(projectRoot, filePath)
      const fileUsages = scanFile(relPath, content)
      usages.push(...fileUsages)
    } catch (e: any) {
      errors.push(`${filePath}: ${e.message}`)
    }
  }

  // Deduplicate by key+file+line
  const seen = new Set<string>()
  const deduped = usages.filter((u) => {
    const sig = `${u.key}||${u.filePath}||${u.lineNumber}||${u.detectedFunction}`
    if (seen.has(sig)) return false
    seen.add(sig)
    return true
  })

  return {
    usages: deduped,
    scannedFiles: files.map((f) => relative(projectRoot, f)),
    errors,
  }
}

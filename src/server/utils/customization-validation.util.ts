import type { IBrandingConfig, IThemeConfig, ICustomWidgetDef } from '../../interfaces/project-config.interface'

// ── Allowed colour sets ─────────────────────────────────────────────────────

export const ALLOWED_PRIMARY_COLORS = new Set([
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
])

export const ALLOWED_NEUTRAL_COLORS = new Set(['slate', 'gray', 'zinc', 'neutral', 'stone'])

// ── Helpers ─────────────────────────────────────────────────────────────────

// Only http / https URLs are accepted — blocks javascript:, data:, file:, vbscript:, etc.
const SAFE_URL_RE = /^https?:\/\/.+/i

export function isSafeUrl(url: string | undefined): boolean {
  if (!url) return true
  return SAFE_URL_RE.test(url) && url.length <= 2048
}

// Widget type must be kebab-case identifiers (e.g. "my-widget", "metrics")
const WIDGET_TYPE_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/

// ── Validators ──────────────────────────────────────────────────────────────

export function validateBranding(branding: IBrandingConfig): string | null {
  if (branding.name !== undefined && branding.name.length > 100)
    return 'branding.name must be 100 characters or fewer'
  if (branding.subtitle !== undefined && branding.subtitle.length > 200)
    return 'branding.subtitle must be 200 characters or fewer'
  if (branding.logoUrl && !isSafeUrl(branding.logoUrl))
    return 'branding.logoUrl must be a valid http/https URL (max 2048 chars)'
  return null
}

export function validateTheme(theme: IThemeConfig): string | null {
  if (theme.primary && !ALLOWED_PRIMARY_COLORS.has(theme.primary))
    return `theme.primary "${theme.primary}" is not a valid Tailwind color name`
  if (theme.neutral && !ALLOWED_NEUTRAL_COLORS.has(theme.neutral))
    return `theme.neutral "${theme.neutral}" is not a valid Tailwind neutral color`
  return null
}

export function validateCustomWidgets(widgets: ICustomWidgetDef[]): string | null {
  if (!Array.isArray(widgets))
    return 'widgets.custom must be an array'
  if (widgets.length > 20)
    return 'Maximum 20 custom widgets allowed'

  const seenTypes = new Set<string>()

  for (const w of widgets) {
    if (!w.type || !WIDGET_TYPE_RE.test(w.type))
      return `Widget type "${w.type}" must match pattern [a-z0-9-] (e.g. "my-widget")`
    if (w.type.length > 64)
      return `Widget type "${w.type}" exceeds 64 characters`
    if (seenTypes.has(w.type))
      return `Duplicate widget type: "${w.type}"`
    seenTypes.add(w.type)

    if (!w.label || typeof w.label !== 'string' || w.label.length > 100)
      return `Widget "${w.type}": label must be 1–100 characters`
    if (w.description !== undefined && w.description.length > 300)
      return `Widget "${w.type}": description exceeds 300 characters`
    if (w.icon !== undefined && w.icon.length > 100)
      return `Widget "${w.type}": icon name exceeds 100 characters`

    if (!w.config || w.config.kind !== 'iframe')
      return `Widget "${w.type}": only "iframe" kind is supported`
    if (!w.config.url || !isSafeUrl(w.config.url))
      return `Widget "${w.type}": URL must be a valid http/https URL (max 2048 chars)`
  }

  return null
}

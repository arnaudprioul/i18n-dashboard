// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  validateBranding,
  validateTheme,
  validateCustomWidgets,
  isSafeUrl,
  ALLOWED_PRIMARY_COLORS,
  ALLOWED_NEUTRAL_COLORS,
} from '~/server/utils/customization-validation.util'

// ── isSafeUrl ───────────────────────────────────────────────────────────────

describe('isSafeUrl', () => {
  it('accepts http URLs', () => {
    expect(isSafeUrl('http://example.com/embed')).toBe(true)
  })

  it('accepts https URLs', () => {
    expect(isSafeUrl('https://metrics.example.com/dashboard')).toBe(true)
  })

  it('accepts undefined (optional field)', () => {
    expect(isSafeUrl(undefined)).toBe(true)
  })

  it('rejects javascript: protocol', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false)
  })

  it('rejects data: URIs', () => {
    expect(isSafeUrl('data:image/svg+xml,<svg><script>alert(1)</script></svg>')).toBe(false)
  })

  it('rejects file: protocol', () => {
    expect(isSafeUrl('file:///etc/passwd')).toBe(false)
  })

  it('rejects vbscript: protocol', () => {
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false)
  })

  it('rejects URLs exceeding 2048 chars', () => {
    expect(isSafeUrl('https://example.com/' + 'a'.repeat(2040))).toBe(false)
  })

  it('rejects bare strings with no protocol', () => {
    expect(isSafeUrl('example.com')).toBe(false)
  })
})

// ── validateBranding ────────────────────────────────────────────────────────

describe('validateBranding', () => {
  it('accepts valid branding', () => {
    expect(validateBranding({ name: 'My App', subtitle: 'v2', logoUrl: 'https://cdn.example.com/logo.png' })).toBeNull()
  })

  it('accepts empty branding (all optional)', () => {
    expect(validateBranding({})).toBeNull()
  })

  it('rejects name longer than 100 chars', () => {
    expect(validateBranding({ name: 'a'.repeat(101) })).toMatch(/name/)
  })

  it('rejects subtitle longer than 200 chars', () => {
    expect(validateBranding({ subtitle: 'a'.repeat(201) })).toMatch(/subtitle/)
  })

  it('rejects javascript: logo URL', () => {
    expect(validateBranding({ logoUrl: 'javascript:alert(1)' })).toMatch(/logoUrl/)
  })

  it('rejects data: logo URL', () => {
    expect(validateBranding({ logoUrl: 'data:image/svg+xml,<svg/>' })).toMatch(/logoUrl/)
  })

  it('accepts https logo URL', () => {
    expect(validateBranding({ logoUrl: 'https://example.com/logo.png' })).toBeNull()
  })
})

// ── validateTheme ───────────────────────────────────────────────────────────

describe('validateTheme', () => {
  it('accepts valid primary colors', () => {
    for (const color of ALLOWED_PRIMARY_COLORS) {
      expect(validateTheme({ primary: color })).toBeNull()
    }
  })

  it('accepts valid neutral colors', () => {
    for (const color of ALLOWED_NEUTRAL_COLORS) {
      expect(validateTheme({ neutral: color })).toBeNull()
    }
  })

  it('accepts empty theme (defaults)', () => {
    expect(validateTheme({})).toBeNull()
  })

  it('rejects unknown primary color', () => {
    expect(validateTheme({ primary: 'magenta' })).toMatch(/primary/)
  })

  it('rejects CSS injection attempt in primary', () => {
    expect(validateTheme({ primary: 'red; background:url(evil)' })).toMatch(/primary/)
  })

  it('rejects unknown neutral color', () => {
    expect(validateTheme({ neutral: 'charcoal' })).toMatch(/neutral/)
  })

  it('rejects empty string as primary (not in allowed set)', () => {
    // empty string is falsy → no validation → passes (same as "not set")
    expect(validateTheme({ primary: '' })).toBeNull()
  })
})

// ── validateCustomWidgets ───────────────────────────────────────────────────

describe('validateCustomWidgets', () => {
  const validWidget = {
    type: 'my-metrics',
    label: 'My Metrics',
    description: 'Shows metrics',
    icon: 'i-heroicons-chart-bar',
    sizes: ['md', 'wide'],
    defaultSize: 'md',
    config: { kind: 'iframe' as const, url: 'https://example.com/embed' },
  }

  it('accepts a valid widget definition', () => {
    expect(validateCustomWidgets([validWidget])).toBeNull()
  })

  it('accepts an empty array', () => {
    expect(validateCustomWidgets([])).toBeNull()
  })

  it('rejects more than 20 widgets', () => {
    const widgets = Array.from({ length: 21 }, (_, i) => ({
      ...validWidget,
      type: `widget-${i}`,
    }))
    expect(validateCustomWidgets(widgets)).toMatch(/20/)
  })

  it('rejects widget type with uppercase letters', () => {
    expect(validateCustomWidgets([{ ...validWidget, type: 'MyWidget' }])).toMatch(/type/)
  })

  it('rejects widget type with spaces', () => {
    expect(validateCustomWidgets([{ ...validWidget, type: 'my widget' }])).toMatch(/type/)
  })

  it('rejects widget type with special characters', () => {
    expect(validateCustomWidgets([{ ...validWidget, type: 'widget<script>' }])).toMatch(/type/)
  })

  it('rejects widget type starting with a hyphen', () => {
    expect(validateCustomWidgets([{ ...validWidget, type: '-bad' }])).toMatch(/type/)
  })

  it('rejects widget type exceeding 64 characters', () => {
    expect(validateCustomWidgets([{ ...validWidget, type: 'a'.repeat(65) }])).toMatch(/type/)
  })

  it('rejects duplicate widget types', () => {
    expect(validateCustomWidgets([validWidget, { ...validWidget }])).toMatch(/Duplicate/)
  })

  it('rejects label longer than 100 chars', () => {
    expect(validateCustomWidgets([{ ...validWidget, label: 'a'.repeat(101) }])).toMatch(/label/)
  })

  it('rejects description longer than 300 chars', () => {
    expect(validateCustomWidgets([{ ...validWidget, description: 'a'.repeat(301) }])).toMatch(/description/)
  })

  it('rejects non-iframe config kind', () => {
    expect(validateCustomWidgets([{ ...validWidget, config: { kind: 'api' as any, url: 'https://example.com' } }])).toMatch(/iframe/)
  })

  it('rejects javascript: iframe URL', () => {
    expect(validateCustomWidgets([{ ...validWidget, config: { kind: 'iframe', url: 'javascript:alert(1)' } }])).toMatch(/URL/)
  })

  it('rejects data: iframe URL', () => {
    expect(validateCustomWidgets([{ ...validWidget, config: { kind: 'iframe', url: 'data:text/html,<script>alert(1)</script>' } }])).toMatch(/URL/)
  })

  it('rejects empty iframe URL', () => {
    expect(validateCustomWidgets([{ ...validWidget, config: { kind: 'iframe', url: '' } }])).toMatch(/URL/)
  })

  it('rejects non-array input', () => {
    expect(validateCustomWidgets('not-an-array' as any)).toMatch(/array/)
  })
})

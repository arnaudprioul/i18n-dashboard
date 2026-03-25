export interface IBrandingConfig {
  name?: string        // App name shown in sidebar (default: "i18n Dashboard")
  subtitle?: string    // Subtitle below name (default: "vue-i18n manager")
  logoUrl?: string     // URL or base64 data URI for the logo image
}

export interface IThemeConfig {
  primary?: string     // Tailwind color name: 'blue' | 'violet' | 'green' | 'red' | 'orange' | 'teal' | 'cyan' | 'indigo' | 'purple' | 'pink' | 'rose' | 'sky' | 'emerald' | 'amber' | 'lime' | 'fuchsia' | 'yellow'
  neutral?: string     // Tailwind neutral: 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone'
}

export interface ICustomWidgetDef {
  type: string                  // Unique identifier (e.g. "my-metric")
  label: string                 // Display label in widget picker
  description?: string          // Short description
  icon?: string                 // Heroicons name (e.g. "i-heroicons-chart-bar")
  sizes: string[]               // Allowed sizes: sm | md | lg | wide | xl
  defaultSize: string           // Default size when added
  config: IIframeWidgetConfig
}

export interface IIframeWidgetConfig {
  kind: 'iframe'
  url: string                   // URL to embed in an iframe
}

export interface IDashboardConfig {
  uiLanguages?: string[]        // e.g. ["fr", "en", "es"]
  defaultUiLanguage?: string    // e.g. "fr"
  project?: {
    name?: string
    localesPath?: string
    keySeparator?: string
  }
  branding?: IBrandingConfig
  theme?: IThemeConfig
  widgets?: {
    custom?: ICustomWidgetDef[]
  }
}

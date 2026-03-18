export const LOCALE_ARRAY_PATTERN = /locales\s*:\s*\[([^\]]+)\]/g
export const LOCALE_OBJECT_ARRAY_PATTERN = /locales\s*:\s*\[[\s\S]*?code\s*:\s*['"]([a-z]{2}(?:-[a-z]{2,4})?)['"]/gi
export const AVAILABLE_LOCALES_PATTERN = /availableLocales\s*:\s*\[([^\]]+)\]/g
export const LOCALE_SINGLE_PATTERN = /(?:locale|defaultLocale|fallbackLocale)\s*:\s*['"]([a-z]{2}(?:-[a-z]{2,4})?)['"]/g

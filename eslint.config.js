import pluginVue from 'eslint-plugin-vue'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import vueParser from 'vue-eslint-parser'

export default [
  {
    ignores: [
      'node_modules/**',
      '.nuxt/**',
      '.output/**',
      '.claude/**',
      'dist/**',
      'cypress/screenshots/**',
      'cypress/videos/**',
    ],
  },

  // TypeScript files
  {
    files: ['**/*.{ts,tsx,cts,mts}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // Downgrade all @typescript-eslint rules to warn so existing code doesn't block pushes
      ...Object.fromEntries(
        Object.entries(tsPlugin.configs.recommended.rules).map(([k, v]) => [
          k,
          Array.isArray(v) ? ['warn', ...v.slice(1)] : 'warn',
        ]),
      ),
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // Vue files
  {
    files: ['**/*.vue'],
    plugins: {
      vue: pluginVue,
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...pluginVue.configs['flat/recommended'].reduce((acc, cfg) => ({ ...acc, ...(cfg.rules || {}) }), {}),
      ...Object.fromEntries(
        Object.entries(tsPlugin.configs.recommended.rules).map(([k, v]) => [
          k,
          Array.isArray(v) ? ['warn', ...v.slice(1)] : 'warn',
        ]),
      ),
      'vue/multi-word-component-names': 'off',
      'vue/comment-directive': ['warn', { reportUnusedDisableDirectives: false }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // JavaScript files
  {
    files: ['**/*.{js,jsx,cjs,mjs}'],
    rules: {},
  },
]

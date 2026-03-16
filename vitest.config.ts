import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${resolve(__dirname)}/`,
      '@/': `${resolve(__dirname)}/`,
      '#imports': resolve(__dirname, 'tests/__mocks__/nuxt-imports.ts'),
      '#app': resolve(__dirname, 'tests/__mocks__/nuxt-imports.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    environmentMatchGlobs: [
      ['tests/server/**', 'node'],
    ],
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'composables/**',
        'services/**',
        'server/utils/**',
        'utils/**',
      ],
      exclude: [
        '**/*.d.ts',
        'tests/**',
        'node_modules/**',
        '.nuxt/**',
        '.output/**',
      ],
    },
  },
})

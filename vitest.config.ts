import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${resolve(__dirname)}/src/`,
      '@/': `${resolve(__dirname)}/src/`,
      '#imports': resolve(__dirname, 'tests/__mocks__/nuxt-imports.ts'),
      '#app': resolve(__dirname, 'tests/__mocks__/nuxt-imports.ts'),
      '#server/': `${resolve(__dirname)}/src/server/`,
      // kept for backwards compat with any remaining #server/ usage
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
        'src/composables/**',
        'src/services/**',
        'src/utils/**',
        'src/utils/**',
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

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
  ],
  test: {
    // 使用多项目配置：单元测试使用 happy-dom，集成测试使用 node
    projects: [
      // 单元测试项目（组件、Store 等）
      {
        test: {
          environment: 'happy-dom',
          globals: true,
          setupFiles: ['./tests/setup.ts'],
          include: [
            'src/**/*.{test,spec}.{js,ts}',
            'tests/unit/**/*.{test,spec}.{js,ts}'
          ],
          exclude: ['node_modules', 'dist'],
          testTimeout: 10000,
        },
      },
      // 集成测试项目（API 调用后端）
      {
        test: {
          environment: 'node',
          globals: true,
          include: [
            'tests/vitest/**/*.{test,spec}.{js,ts}'
          ],
          exclude: ['node_modules', 'dist'],
          env: {
            VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
            VITE_CLIENT_ID: process.env.VITE_CLIENT_ID || '02bb9cfe8d7844ecae8dbe62b1ba971a',
            TEST_USERNAME: process.env.TEST_USERNAME || 'superadmin',
            TEST_PASSWORD: process.env.TEST_PASSWORD || 'password',
            TEST_TENANT_CODE: process.env.TEST_TENANT_CODE || 'default',
          },
          testTimeout: 30000,
          hookTimeout: 30000,
        },
      }
    ],

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mock/**',
        'dist/',
        'public/',
        'static/',
      ],
    },

    // 别名配置
    alias: {
      '@': resolve(__dirname, 'src'),
      '@static': resolve(__dirname, 'static')
    },

    // 监听模式配置
    watch: true,

    // UI 界面
    ui: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@static': resolve(__dirname, 'static')
    }
  },
  define: {
    global: 'globalThis',
  }
})

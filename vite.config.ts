import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import VueDevTools from 'vite-plugin-vue-devtools'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [
      vue(),
      // Vue DevTools - 开发调试工具
      VueDevTools(),
      // UnoCSS - 原子化 CSS 引擎
      UnoCSS(),
    ],
    define: {
      // 全局变量 polyfill
      global: 'globalThis',
      // process polyfill (用于某些第三方库)
      'process.env': '{}',
      // 构建时间
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@static': resolve(__dirname, 'static')
      }
    },
    server: {
      port: 4000,
      host: true, // 监听所有地址，包括 localhost、127.0.0.1 和局域网 IP
      open: false,
      // 代理配置 - 统一代理所有 /api 和 /videos 开头的请求
      proxy: {
        // 后端 API 代理
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          // 不重写路径，保持 /api 前缀
          rewrite: (path) => path
        },
        // 本地视频 API 代理
        '/videos': {
          target: env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          // 不重写路径，保持 /videos 前缀
          rewrite: (path) => path
        }
      }
    },
    publicDir: 'public', // 指定公共静态资源目录
    build: {
      outDir: 'dist',
      assetsDir: 'static',
      sourcemap: false,
      // 限制 chunk 大小警告
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // 分包策略
          manualChunks: {
            'element-plus': ['element-plus'],
            'echarts': ['echarts', 'vue-echarts'],
            'vue-vendor': ['vue', 'vue-router', 'pinia']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['element-plus', 'vue-echarts', 'data-view-vue3'],
      entries: ['index.html'], // 只扫描 index.html，排除 playwright-report
      exclude: ['playwright-report']
    },
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: ['./tests/setup.ts'],
      include: ['tests/vitest/**/*.{test,spec}.{js,ts}'],
      reporter: ['verbose'],
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src'),
          '@static': resolve(__dirname, 'static')
        }
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html']
      }
    }
  };
})

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
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
      // UnoCSS - 原子化 CSS 引擎
      UnoCSS(),
    ],
    define: {
      // Global polyfills for webpack compatibility
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV || mode),
      'process.env.BASE_API': JSON.stringify(env.VITE_API_BASE_URL || ''),
      global: 'globalThis',
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@static': resolve(__dirname, 'static')
      }
    },
    server: {
      port: 4000,
      host: 'localhost',
      open: false,
      // 代理配置
      proxy: {
        // 代理所有 /api 开头的请求到后端服务器
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          // 不重写路径，保持 /api 前缀
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
    include: ['element-plus', 'vue-echarts', 'data-view-vue3']
  }
};
})

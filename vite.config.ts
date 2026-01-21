import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    // Global polyfills for webpack compatibility
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.BASE_API': JSON.stringify(process.env.BASE_API || ''),
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@static': resolve(__dirname, 'static')
    }
  },
  server: {
    port: 8080,
    host: 'localhost',
    open: false,
    // 代理配置 - 如需要可以添加
    proxy: {
      // '/api': {
      //   target: 'http://localhost:3000',
      //   changeOrigin: true,
      //   rewrite: (path) => path.replace(/^\/api/, '')
      // }
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
})

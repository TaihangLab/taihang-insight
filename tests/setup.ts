/**
 * Vitest 测试环境设置文件
 * 为单元测试提供全局配置和 mock
 */

// Mock localStorage
const localStorageMock = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
  clear: () => {}
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock window.location
Object.defineProperty(globalThis, 'location', {
  value: {
    hash: '',
    hostname: 'localhost',
    pathname: '/',
    port: '4000',
    protocol: 'http:',
    search: ''
  },
  writable: true
})

// Mock console 方法以减少测试输出噪音
global.console = {
  ...console,
  // 在测试中保留 error 和 warn，但可以过滤某些日志
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
}

/**
 * Vitest Node 环境测试设置
 * 为 Node.js 环境提供浏览器 API mock
 */

// Mock localStorage for Node environment (实际存储数据，以支持认证测试)
const localStorageStore = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => localStorageStore.get(key) || null,
  setItem: (key: string, value: string) => { localStorageStore.set(key, value) },
  removeItem: (key: string) => { localStorageStore.delete(key) },
  clear: () => { localStorageStore.clear() }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
  clear: () => {}
}

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
  configurable: true
})

// Mock history state
let historyState = null

// Mock history
const historyMock = {
  state: historyState,
  length: 1,
  scrollRestoration: 'auto' as const,
  pushState: function(_state: any, _title: string, _url: string) { historyState = _state },
  replaceState: function(_state: any, _title: string, _url: string) { historyState = _state },
  go: (_delta: number) => {},
  back: () => {},
  forward: () => {}
}

Object.defineProperty(globalThis, 'history', {
  value: historyMock,
  writable: true,
  configurable: true
})

// Mock window
const windowMock = {
  location: {
    assign: () => {},
    reload: () => {},
    replace: () => {},
    get hash() { return '' },
    set hash(_value: string) {},
    get hostname() { return 'localhost' },
    get pathname() { return '/' },
    get port() { return '4000' },
    get protocol() { return 'http:' },
    get search() { return '' },
    get state() { return historyState },
    get origin() { return 'http://localhost:4000' }
  },
  history: historyMock,
  get innerHeight() { return 1080 },
  get innerWidth() { return 1920 },
  addEventListener: () => {},
  removeEventListener: () => {}
}

Object.defineProperty(globalThis, 'window', {
  value: windowMock,
  writable: true,
  configurable: true
})

// Mock location directly
Object.defineProperty(globalThis, 'location', windowMock.location)

// Mock import.meta.env
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        MODE: 'test',
        BASE_URL: '/',
        DEV: false,
        PROD: false,
        SSR: false
      }
    }
  },
  writable: true,
  configurable: true
})

// Mock document
Object.defineProperty(globalThis, 'document', {
  value: {
    title: '',
    getElementsByTagName: () => [],
    createElement: () => ({}),
    querySelector: () => null,
    querySelectorAll: () => []
  },
  writable: true,
  configurable: true
})

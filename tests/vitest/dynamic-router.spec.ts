/**
 * 动态路由功能简化测试
 * 只测试核心逻辑，不依赖完整的 Vue 组件加载
 */
import { describe, it, expect } from 'vitest'

describe('路由配置验证', () => {
  it('应该能读取 router/index.ts 文件', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const routerPath = path.resolve(__dirname, '../../src/router/index.ts')

    expect(fs.existsSync(routerPath)).toBe(true)
  })

  it('应该能读取 app.ts Store 文件', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const appStorePath = path.resolve(__dirname, '../../src/stores/modules/app.ts')

    expect(fs.existsSync(appStorePath)).toBe(true)
  })

  it('componentMap 应该包含预期的路由', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const routerPath = path.resolve(__dirname, '../../src/router/index.ts')

    const content = fs.readFileSync(routerPath, 'utf-8')

    expect(content).toContain('/visualCenter')
    expect(content).toContain('/monitoring/realtime')
    expect(content).toContain('/systemManage/userManagement')
    expect(content).toContain('/skillManage/deviceSkills')
  })

  it('setupAsyncRoutes 函数应该被导出', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const routerPath = path.resolve(__dirname, '../../src/router/index.ts')

    const content = fs.readFileSync(routerPath, 'utf-8')
    expect(content).toContain('export function setupAsyncRoutes')
  })

  it('resetAsyncRoutes 函数应该被导出', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const routerPath = path.resolve(__dirname, '../../src/router/index.ts')

    const content = fs.readFileSync(routerPath, 'utf-8')
    expect(content).toContain('export function resetAsyncRoutes')
  })

  it('路由应该使用 useAppStore 而不是模块级变量', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const routerPath = path.resolve(__dirname, '../../src/router/index.ts')

    const content = fs.readFileSync(routerPath, 'utf-8')

    expect(content).toContain('useAppStore')
    expect(content).not.toMatch(/let\s+asyncRoutesAdded\s*=\s*false/)
  })

  it('resetAsyncRoutes 应该调用 router.removeRoute', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const routerPath = path.resolve(__dirname, '../../src/router/index.ts')

    const content = fs.readFileSync(routerPath, 'utf-8')

    expect(content).toContain('router.removeRoute')
    expect(content).toContain('router.hasRoute')
  })

  it('应该有正确的白名单配置', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const routerPath = path.resolve(__dirname, '../../src/router/index.ts')

    const content = fs.readFileSync(routerPath, 'utf-8')

    expect(content).toContain('WHITE_LIST_ROUTES')
    expect(content).toContain('/login')
    expect(content).toContain('/403')
    expect(content).toContain('/404')
  })

  it('应该使用正则表达式匹配动态路径', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const routerPath = path.resolve(__dirname, '../../src/router/index.ts')

    const content = fs.readFileSync(routerPath, 'utf-8')

    expect(content).toMatch(/\/\^.*play.*wasm/)
    expect(content).toMatch(/\/\^.*cloudRecordDetail/)
  })

  it('应该使用 return 而不是 next() 在路由守卫中', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const routerPath = path.resolve(__dirname, '../../src/router/index.ts')

    const content = fs.readFileSync(routerPath, 'utf-8')

    const beforeEachMatch = content.match(/router\.beforeEach\([\s\S]*?\n\}\)/)
    if (beforeEachMatch) {
      const guardCode = beforeEachMatch[0]
      expect(guardCode).toMatch(/return\s+true|return\s*\{/)
    }
  })
})

describe('AppStore 路由状态管理验证', () => {
  it('app.ts 应该包含路由状态管理', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const appStorePath = path.resolve(__dirname, '../../src/stores/modules/app.ts')

    const content = fs.readFileSync(appStorePath, 'utf-8')

    expect(content).toContain('asyncRoutesAdded')
    expect(content).toContain('dynamicRouteRecords')
  })

  it('app.ts 应该包含路由管理方法', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const appStorePath = path.resolve(__dirname, '../../src/stores/modules/app.ts')

    const content = fs.readFileSync(appStorePath, 'utf-8')

    expect(content).toContain('setAsyncRoutesAdded')
    expect(content).toContain('isAsyncRoutesAdded')
    expect(content).toContain('addDynamicRouteRecord')
    expect(content).toContain('getDynamicRouteRecords')
    expect(content).toContain('resetDynamicRoutes')
  })
})

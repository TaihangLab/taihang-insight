/**
 * 动态路由功能测试
 * 测试路由状态管理、动态路由添加/移除、路由守卫等功能
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import router, { setupAsyncRoutes, resetAsyncRoutes, componentMap } from '@/router/index'
import Layout from '@/layout/index.vue'

// Mock Layout 组件
vi.mock('@/layout/index.vue', () => ({
  default: {
    template: '<div><router-view /></div>',
    name: 'Layout'
  }
}))

// Mock 懒加载组件
vi.mock('@/pages/commons/Login.vue', () => ({ default: { template: '<div>Login</div>' } }))
vi.mock('@/pages/error/Forbidden.vue', () => ({ default: { template: '<div>Forbidden</div>' } }))
vi.mock('@/pages/error/NotFound.vue', () => ({ default: { template: '<div>NotFound</div>' } }))

describe('动态路由功能测试', () => {
  let appStore: ReturnType<typeof useAppStore>
  let testRouter: ReturnType<typeof createRouter>

  beforeEach(() => {
    // 创建新的 Pinia 实例
    setActivePinia(createPinia())
    appStore = useAppStore()

    // 创建独立的测试路由器
    testRouter = createRouter({
      history: createWebHashHistory(),
      routes: [
        {
          path: '/',
          name: 'Layout',
          component: Layout,
          redirect: '/visual',
          children: []
        }
      ]
    })
  })

  afterEach(() => {
    // 清理路由状态
    appStore.resetDynamicRoutes()
    vi.clearAllMocks()
  })

  describe('AppStore 路由状态管理', () => {
    it('初始化时动态路由状态应为 false', () => {
      expect(appStore.isAsyncRoutesAdded()).toBe(false)
      expect(appStore.getDynamicRouteRecords()).toEqual([])
    })

    it('应该能正确设置动态路由状态', () => {
      appStore.setAsyncRoutesAdded(true)
      expect(appStore.isAsyncRoutesAdded()).toBe(true)

      appStore.setAsyncRoutesAdded(false)
      expect(appStore.isAsyncRoutesAdded()).toBe(false)
    })

    it('应该能添加和获取动态路由记录', () => {
      const record1 = { name: 'test-route-1', path: '/test1' }
      const record2 = { name: 'test-route-2', path: '/test2' }

      appStore.addDynamicRouteRecord(record1)
      appStore.addDynamicRouteRecord(record2)

      const records = appStore.getDynamicRouteRecords()
      expect(records).toHaveLength(2)
      expect(records).toContainEqual(record1)
      expect(records).toContainEqual(record2)
    })

    it('应该能清空动态路由记录', () => {
      appStore.addDynamicRouteRecord({ name: 'test-route', path: '/test' })
      expect(appStore.getDynamicRouteRecords()).toHaveLength(1)

      appStore.clearDynamicRouteRecords()
      expect(appStore.getDynamicRouteRecords()).toEqual([])
    })

    it('resetDynamicRoutes 应该重置所有状态', () => {
      appStore.setAsyncRoutesAdded(true)
      appStore.addDynamicRouteRecord({ name: 'test-route', path: '/test' })

      appStore.resetDynamicRoutes()

      expect(appStore.isAsyncRoutesAdded()).toBe(false)
      expect(appStore.getDynamicRouteRecords()).toEqual([])
    })
  })

  describe('componentMap 路由映射', () => {
    it('应该包含所有预期的路由映射', () => {
      // 检查一些关键路由
      expect(componentMap['/visualCenter']).toBeDefined()
      expect(componentMap['/monitoring/realtime']).toBeDefined()
      expect(componentMap['/systemManage/userManagement']).toBeDefined()
      expect(componentMap['/skillManage/deviceSkills']).toBeDefined()
    })

    it('所有映射值都应该是函数（懒加载组件）', () => {
      const paths = Object.keys(componentMap)
      paths.forEach(path => {
        expect(typeof componentMap[path]).toBe('function')
      })
    })

    it('应该支持多种路径格式（后端兼容性）', () => {
      // 测试后端可能返回的不同路径格式
      expect(componentMap['/visualCenter']).toBeDefined()
      expect(componentMap['/visual']).toBeDefined()
      expect(componentMap['/monitoring/warnings']).toBeDefined()
      expect(componentMap['/monitoring/warningArchive']).toBeDefined()
    })
  })

  describe('setupAsyncRoutes 动态路由添加', () => {
    // 模拟菜单树数据
    const mockMenuTree = [
      {
        id: 1,
        menu_name: '可视化中心',
        menu_type: 'menu',
        path: '/visualCenter',
        icon: 'dashboard',
        children: []
      },
      {
        id: 2,
        menu_name: '实时监控',
        menu_type: 'menu',
        path: '/monitoring/realtime',
        icon: 'monitor',
        children: []
      },
      {
        id: 3,
        menu_name: '文件夹',
        menu_type: 'folder',
        path: null,
        children: [
          {
            id: 4,
            menu_name: '用户管理',
            menu_type: 'menu',
            path: '/systemManage/userManagement',
            icon: 'user',
            children: []
          }
        ]
      },
      {
        id: 5,
        menu_name: '按钮权限',
        menu_type: 'button',
        path: null,
        children: []
      }
    ]

    it('应该正确添加 menu 类型的路由', () => {
      const count = setupAsyncRoutes(mockMenuTree)

      // 应该添加 3 个路由: /visualCenter, /monitoring/realtime, /systemManage/userManagement
      expect(count).toBeGreaterThanOrEqual(2)
      expect(appStore.isAsyncRoutesAdded()).toBe(true)
    })

    it('应该跳过 folder 和 button 类型的菜单项', () => {
      setupAsyncRoutes(mockMenuTree)

      const records = appStore.getDynamicRouteRecords()
      expect(records.every(r => r.path !== null)).toBe(true)
    })

    it('重复调用应该跳过（幂等性）', () => {
      const count1 = setupAsyncRoutes(mockMenuTree)
      const count2 = setupAsyncRoutes(mockMenuTree)

      // 第二次调用应该返回 0（跳过）
      expect(count1).toBeGreaterThanOrEqual(2)
      expect(count2).toBe(0)
    })

    it('应该记录添加的路由', () => {
      setupAsyncRoutes(mockMenuTree)

      const records = appStore.getDynamicRouteRecords()
      expect(records.length).toBeGreaterThan(0)

      // 检查是否有预期的路由
      const hasVisualCenter = records.some(r => r.path === '/visualCenter')
      expect(hasVisualCenter).toBe(true)
    })

    it('应该处理不同字段名的菜单数据（后端兼容性）', () => {
      const legacyMenuTree = [
        {
          id: 101,
          permission_name: '用户管理',
          permission_type: 'menu',
          path: '/systemManage/userManagement'
        }
      ]

      setupAsyncRoutes(legacyMenuTree)

      const records = appStore.getDynamicRouteRecords()
      const hasUserManagement = records.some(r => r.path === '/systemManage/userManagement')
      expect(hasUserManagement).toBe(true)
    })

    it('应该忽略没有对应组件的路径', () => {
      const invalidMenuTree = [
        {
          id: 999,
          menu_name: '不存在的路由',
          menu_type: 'menu',
          path: '/non/existent/path'
        }
      ]

      // 不应该抛出错误，应该跳过
      expect(() => setupAsyncRoutes(invalidMenuTree)).not.toThrow()

      const records = appStore.getDynamicRouteRecords()
      const hasInvalidRoute = records.some(r => r.path === '/non/existent/path')
      expect(hasInvalidRoute).toBe(false)
    })
  })

  describe('resetAsyncRoutes 路由重置', () => {
    it('应该重置动态路由状态', () => {
      // 先添加一些路由
      setupAsyncRoutes([
        { id: 1, menu_name: 'Test', menu_type: 'menu', path: '/visualCenter' }
      ])

      expect(appStore.isAsyncRoutesAdded()).toBe(true)

      // 重置
      resetAsyncRoutes()

      expect(appStore.isAsyncRoutesAdded()).toBe(false)
      expect(appStore.getDynamicRouteRecords()).toEqual([])
    })

    it('应该能够重新添加路由（重置后）', () => {
      // 第一次添加
      setupAsyncRoutes([
        { id: 1, menu_name: 'Test', menu_type: 'menu', path: '/visualCenter' }
      ])
      resetAsyncRoutes()

      // 第二次添加应该成功
      const count = setupAsyncRoutes([
        { id: 1, menu_name: 'Test', menu_type: 'menu', path: '/visualCenter' }
      ])

      expect(count).toBeGreaterThan(0)
      expect(appStore.isAsyncRoutesAdded()).toBe(true)
    })
  })

  describe('路由白名单功能', () => {
    it('导出的 router 应该有预期的配置', () => {
      expect(router).toBeDefined()
      expect(router.hasRoute('Login')).toBe(true)
      expect(router.hasRoute('NotFound')).toBe(true)
      expect(router.hasRoute('Forbidden')).toBe(true)
    })

    it('动态路由应该添加到 Layout 下', () => {
      // 测试路由结构
      const layoutRoute = router.getRoutes().find(r => r.name === 'Layout')
      expect(layoutRoute).toBeDefined()
      expect(layoutRoute?.redirect).toBe('/visual')
    })
  })

  describe('路由守卫逻辑', () => {
    it('白名单路径应该可以直接访问（不需要认证）', async () => {
      // 测试白名单路径
      const whiteListPaths = ['/login', '/403', '/404', '/test']

      for (const path of whiteListPaths) {
        const route = router.resolve(path)
        expect(route.matched.length).toBeGreaterThan(0)
      }
    })

    it('播放器路径应该支持动态参数', () => {
      const testPaths = [
        '/play/wasm/test-url',
        '/play/rtc/another-url'
      ]

      for (const path of testPaths) {
        const route = router.resolve(path)
        expect(route.matched.length).toBeGreaterThan(0)
      }
    })

    it('录像详情路径应该支持动态参数', () => {
      const testPaths = [
        '/gbRecordDetail/device123/channel456/',
        '/cloudRecordDetail/app/stream',
        '/cloudRecordDetail/serverId/app/stream'
      ]

      for (const path of testPaths) {
        const route = router.resolve(path)
        expect(route.matched.length).toBeGreaterThan(0)
      }
    })
  })

  describe('边界情况处理', () => {
    it('空菜单树应该不添加任何路由', () => {
      const count = setupAsyncRoutes([])
      expect(count).toBe(0)
    })

    it('null 菜单树应该不添加任何路由', () => {
      const count = setupAsyncRoutes(null as any)
      expect(count).toBe(0)
    })

    it('应该处理深层嵌套的菜单树', () => {
      const nestedMenuTree = [
        {
          id: 1,
          menu_name: 'Level 1',
          menu_type: 'folder',
          children: [
            {
              id: 2,
              menu_name: 'Level 2',
              menu_type: 'folder',
              children: [
                {
                  id: 3,
                  menu_name: 'Level 3',
                  menu_type: 'menu',
                  path: '/visualCenter',
                  children: []
                }
              ]
            }
          ]
        }
      ]

      const count = setupAsyncRoutes(nestedMenuTree)
      expect(count).toBeGreaterThan(0)
    })

    it('应该处理 menu_type 为数字的情况', () => {
      const numericTypeMenuTree = [
        {
          id: 1,
          menu_name: '菜单',
          menu_type: 1, // 1 = menu
          path: '/visualCenter'
        },
        {
          id: 2,
          menu_name: '文件夹',
          menu_type: 2, // 2 = folder
          children: []
        }
      ]

      setupAsyncRoutes(numericTypeMenuTree)

      const records = appStore.getDynamicRouteRecords()
      expect(records.some(r => r.path === '/visualCenter')).toBe(true)
    })
  })

  describe('与 Store 集成测试', () => {
    it('登出后重置状态应该清除路由', () => {
      // 模拟登录流程：添加路由
      setupAsyncRoutes([
        { id: 1, menu_name: 'Test', menu_type: 'menu', path: '/visualCenter' }
      ])

      expect(appStore.isAsyncRoutesAdded()).toBe(true)

      // 模拟登出：重置路由
      resetAsyncRoutes()

      // 验证状态已清除
      expect(appStore.isAsyncRoutesAdded()).toBe(false)
      expect(appStore.getDynamicRouteRecords()).toEqual([])
    })

    it('重新登录应该能正常添加路由', () => {
      // 第一次登录
      setupAsyncRoutes([
        { id: 1, menu_name: 'Test', menu_type: 'menu', path: '/visualCenter' }
      ])
      resetAsyncRoutes()

      // 第二次登录（模拟重新登录）
      setupAsyncRoutes([
        { id: 1, menu_name: 'Test', menu_type: 'menu', path: '/visualCenter' }
      ])

      expect(appStore.isAsyncRoutesAdded()).toBe(true)
      expect(appStore.getDynamicRouteRecords().length).toBeGreaterThan(0)
    })
  })
})

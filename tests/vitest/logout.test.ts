/**
 * 退出登录功能测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  }),
  useRoute: () => ({
    path: '/test'
  })
}))

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn()
  }
}))

// Mock router functions
vi.mock('@/router', () => ({
  resetAsyncRoutes: vi.fn()
}))

import { logout, isLoggedIn } from '@/stores/modules/auth'
import { useUserInfoStore } from '@/stores/modules/userInfo'
import { usePermissionsStore } from '@/stores/modules/permissions'
import { useMenusStore } from '@/stores/modules/menus'
import { useAppStore } from '@/stores/modules/app'

describe('退出登录功能', () => {
  beforeEach(() => {
    // 创建新的 Pinia 实例
    const pinia = createPinia()
    setActivePinia(pinia)

    // 模拟已登录状态
    localStorage.setItem('Admin-Token', 'test-token-123')
    localStorage.setItem('taihang-user-info', JSON.stringify({ name: 'Test User' }))
    localStorage.setItem('taihang-permissions', JSON.stringify(['perm1', 'perm2']))
    localStorage.setItem('taihang-menus', JSON.stringify([{ id: 1, name: 'Menu1' }]))
    localStorage.setItem('taihang-app', JSON.stringify({ dynamicRoutesLoaded: true }))
    localStorage.setItem('selectedTenant', 'tenant-001')
  })

  afterEach(() => {
    // 清理 localStorage
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('isLoggedIn()', () => {
    it('有 token 时返回 true', () => {
      localStorage.setItem('Admin-Token', 'test-token')
      expect(isLoggedIn()).toBe(true)
    })

    it('没有 token 时返回 false', () => {
      localStorage.removeItem('Admin-Token')
      expect(isLoggedIn()).toBe(false)
    })
  })

  describe('logout()', () => {
    it('应该清除 Admin-Token', async () => {
      // 确保开始时有 token
      expect(localStorage.getItem('Admin-Token')).toBe('test-token-123')

      // 执行退出登录
      await logout()

      // 验证 token 已清除
      expect(localStorage.getItem('Admin-Token')).toBeNull()
    })

    it('应该清除用户信息', async () => {
      const userInfoStore = useUserInfoStore()
      userInfoStore.setUserInfo({
        id: 1,
        username: 'testuser',
        user_name: 'testuser',
        nick_name: 'Test User',
        tenant_id: 'tenant-001'
      } as any)

      await logout()

      // userInfo 是 UserInfo | null，清除后为 null
      expect(userInfoStore.userInfo).toBeNull()
    })

    it('应该清除权限', async () => {
      const permissionsStore = usePermissionsStore()
      permissionsStore.setPermissions(['perm1', 'perm2'])

      await logout()

      expect(permissionsStore.permissions).toEqual([])
    })

    it('应该清除菜单', async () => {
      const menusStore = useMenusStore()
      menusStore.setMenuTree([{ id: 1, name: 'Menu1' }])

      await logout()

      expect(menusStore.menuTree).toEqual([])
    })

    it('应该清除用户偏好数据', async () => {
      localStorage.setItem('selectedTenant', 'tenant-001')
      localStorage.setItem('nick_name', 'Test User')

      await logout()

      expect(localStorage.getItem('selectedTenant')).toBeNull()
      expect(localStorage.getItem('nick_name')).toBeNull()
    })

    it('应该清除所有认证相关的 localStorage 数据', async () => {
      // 验证 Admin-Token 被直接清除
      localStorage.setItem('Admin-Token', 'test-token')
      expect(localStorage.getItem('Admin-Token')).toBe('test-token')

      // 验证用户偏好数据被清除
      localStorage.setItem('selectedTenant', 'tenant-001')
      localStorage.setItem('nick_name', 'Test User')
      expect(localStorage.getItem('selectedTenant')).toBe('tenant-001')
      expect(localStorage.getItem('nick_name')).toBe('Test User')

      await logout()

      // Admin-Token 直接被清除
      expect(localStorage.getItem('Admin-Token')).toBeNull()

      // 用户偏好数据被清除
      expect(localStorage.getItem('selectedTenant')).toBeNull()
      expect(localStorage.getItem('nick_name')).toBeNull()

      // Store 相关数据通过 pinia-plugin-persistedstate 清除
      // 验证各 store 的 clear 方法被调用
      const userInfoStore = useUserInfoStore()
      const permissionsStore = usePermissionsStore()
      const menusStore = useMenusStore()
      const appStore = useAppStore()

      // Store 数据已被清除
      expect(userInfoStore.userInfo).toBeNull()
      expect(permissionsStore.permissions).toEqual([])
      expect(menusStore.menuTree).toEqual([])
      expect(appStore.asyncRoutesAdded).toBe(false)
    })

    it('应该重置动态路由标记', async () => {
      const appStore = useAppStore()
      appStore.setAsyncRoutesAdded(true)
      expect(appStore.asyncRoutesAdded).toBe(true)

      await logout()

      expect(appStore.asyncRoutesAdded).toBe(false)
    })

    it('完整的退出登录流程', async () => {
      // 1. 初始化各 store 数据
      const userInfoStore = useUserInfoStore()
      const permissionsStore = usePermissionsStore()
      const menusStore = useMenusStore()
      const appStore = useAppStore()

      userInfoStore.setUserInfo({
        id: 1,
        username: 'testuser',
        user_name: 'testuser',
        nick_name: 'Test User'
      } as any)
      permissionsStore.setPermissions(['read', 'write'])
      menusStore.setMenuTree([{ id: 1, name: 'Home' }])
      appStore.setAsyncRoutesAdded(true)

      // 2. 设置用户偏好数据（这些会被直接清除）
      localStorage.setItem('selectedTenant', 'tenant-001')
      localStorage.setItem('nick_name', 'Test User')

      // 3. 验证登录前状态
      expect(isLoggedIn()).toBe(true)
      expect(userInfoStore.userInfo).toMatchObject({
        id: 1,
        username: 'testuser',
        user_name: 'testuser',
        nick_name: 'Test User'
      })
      expect(permissionsStore.permissions).toEqual(['read', 'write'])
      expect(menusStore.menuTree).toEqual([{ id: 1, name: 'Home' }])
      expect(appStore.asyncRoutesAdded).toBe(true)
      expect(localStorage.getItem('selectedTenant')).toBe('tenant-001')
      expect(localStorage.getItem('nick_name')).toBe('Test User')

      // 4. 执行退出登录
      await logout()

      // 5. 验证退出后状态 - Store 数据已清除
      expect(isLoggedIn()).toBe(false)
      expect(userInfoStore.userInfo).toBeNull()
      expect(permissionsStore.permissions).toEqual([])
      expect(menusStore.menuTree).toEqual([])
      expect(appStore.asyncRoutesAdded).toBe(false)

      // 6. 验证用户偏好数据已清除（直接通过 storage.clearUserData 清除）
      expect(localStorage.getItem('Admin-Token')).toBeNull()
      expect(localStorage.getItem('selectedTenant')).toBeNull()
      expect(localStorage.getItem('nick_name')).toBeNull()
    })
  })
})

/**
 * 单元测试辅助函数
 * 提供 Vue Test Utils 通用配置和工具函数
 * @see .claude/rules/testing-guide.md
 */

import { enableAutoUnmount, mount, VueWrapper } from '@vue/test-utils'

/**
 * 设置自动清理
 * 在每个测试后自动卸载组件，避免内存泄漏
 *
 * @example
 * ```ts
 * describe('MyComponent', () => {
 *   setupAutoUnmount(afterEach)
 *
 *   it('should work', () => {
 *     const wrapper = mount(Component)
 *     // 测试结束后自动清理
 *   })
 * })
 * ```
 */
export function setupAutoUnmount(afterEachHook: (fn: () => void) => void) {
  enableAutoUnmount(afterEachHook)
}

/**
 * 等待所有 Promise 解析
 * 用于处理异步操作后的状态更新
 *
 * @example
 * ```ts
 * await flushPromises()
 * expect(wrapper.text()).toContain('加载完成')
 * ```
 */
export async function flushPromises(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * 等待下一个 Vue tick
 */
export async function nextTick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * 等待条件满足
 * 超时后抛出错误
 *
 * @example
 * ```ts
 * await waitFor(() => {
 *   expect(wrapper.find('.loaded').exists()).toBe(true)
 * }, 5000)
 * ```
 */
export async function waitFor(
  condition: () => void,
  timeout = 5000
): Promise<void> {
  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const checkCondition = () => {
      try {
        condition()
        resolve()
      } catch {
        if (Date.now() - startTime >= timeout) {
          reject(new Error(`条件在 ${timeout}ms 内未满足`))
        } else {
          setTimeout(checkCondition, 10)
        }
      }
    }
    checkCondition()
  })
}

/**
 * Mock Pinia Store 工厂函数
 *
 * @example
 * ```ts
 * const mockUserStore = createMockStore('user', {
 *   userInfo: { name: 'Test' },
 *   setUserInfo: vi.fn()
 * })
 * ```
 */
export function createMockStore<T extends Record<string, any>>(
  id: string,
  state: T
): T & { $id: string } {
  return {
    ...state,
    $id: id,
  }
}

/**
 * 创建带有 Pinia 的测试包装器
 */
export function mountWithPinia(component: any, options: any = {}) {
  const { createPinia, setActivePinia } = require('pinia')
  const pinia = createPinia()
  setActivePinia(pinia)

  return mount(component, {
    global: {
      plugins: [pinia],
      ...options.global,
    },
    ...options,
  })
}

/**
 * 触发 DOM 事件
 * 比 trigger 更真实的模拟用户交互
 */
export function triggerEvent(
  wrapper: VueWrapper,
  eventName: string,
  eventData?: any
): Promise<void> {
  const element = wrapper.element
  const event = new Event(eventName, { bubbles: true, cancelable: true })

  if (eventData) {
    Object.assign(event, eventData)
  }

  element.dispatchEvent(event)
  return wrapper.vm.$nextTick()
}

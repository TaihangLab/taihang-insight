/**
 * 全局路由守卫：登录态检查 + 动态路由生成
 *
 * 白名单：/login、/register、/play/wasm/*、/play/rtc/*
 * 有 token 但无用户信息：拉取 GetInfo + GenerateRoutes
 * 无 token：跳转 /login?redirect=...
 */
import router from './index'
import store from '@/store'
import { getToken } from '@/utils/auth'

const WHITE_LIST = ['/login', '/register']
const PUBLIC_PREFIX = ['/play/wasm', '/play/rtc', '/test']

function isWhite (path) {
  if (!path) return false
  if (WHITE_LIST.indexOf(path) !== -1) return true
  return PUBLIC_PREFIX.some(prefix => path.startsWith(prefix))
}

router.beforeEach(async (to, from, next) => {
  const token = getToken()

  if (token) {
    if (to.path === '/login') {
      next({ path: '/' })
      return
    }
    const hasRoles = store.state.user && store.state.user.roles && store.state.user.roles.length > 0
    if (hasRoles) {
      next()
      return
    }
    try {
      await store.dispatch('GetInfo')
      await store.dispatch('GenerateRoutes')
      next({ ...to, replace: true })
    } catch (e) {
      console.error('[permission] 加载用户信息失败', e)
      await store.dispatch('ResetLocal')
      next(`/login?redirect=${encodeURIComponent(to.fullPath || to.path)}`)
    }
    return
  }

  if (isWhite(to.path)) {
    next()
    return
  }
  next(`/login?redirect=${encodeURIComponent(to.fullPath || to.path)}`)
})

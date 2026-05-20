/**
 * 全局路由守卫：登录态检查 + 动态路由生成
 *
 * 白名单：/login、/register、/play/wasm/*、/play/rtc/*
 * 有 token 但无用户信息：拉取 GetInfo + GenerateRoutes
 * 无 token：跳转 /login?redirect=...
 *
 * 注意：不能用 roles.length 判断「是否已拉取用户信息」——无角色绑定的租户用户
 * getInfo 会返回 roles=[]，若用 roles 作门槛会陷入 GetInfo/getRouters 死循环。
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

/** 是否已成功加载过当前登录用户（以 userInfo 为准，而非 roles） */
function hasUserProfile (store) {
  const info = store.state.user && store.state.user.userInfo
  return !!(info && (info.userId || info.userName))
}

router.beforeEach(async (to, from, next) => {
  const token = getToken()

  if (token) {
    if (to.path === '/login') {
      next({ path: '/' })
      return
    }
    if (hasUserProfile(store)) {
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

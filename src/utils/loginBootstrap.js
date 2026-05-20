/**
 * 登录/注册页初始化数据缓存（验证码 + 租户列表）
 * 用于首屏立即展示租户下拉，后台再静默刷新。
 */
import { getLoginBootstrap, getCaptcha } from '@/api/auth'
import { getLoginTenantList } from '@/api/tenant'

const CACHE_KEY = 'login_bootstrap_v1'
const TTL_MS = 5 * 60 * 1000

let inflightPromise = null

function isBootstrapNotFound (err) {
  const status = err && err.response && err.response.status
  return status === 404
}

function mergeLegacyBootstrap (captchaData, tenantData) {
  const c = captchaData || {}
  const t = tenantData || {}
  return {
    captchaEnabled: !!c.captchaEnabled,
    uuid: c.uuid || '',
    img: c.img || '',
    tenantEnabled: !!t.tenantEnabled,
    voList: Array.isArray(t.voList) ? t.voList : []
  }
}

/** 旧版后端无 bootstrap 时，并行请求 code + tenant/list */
async function fetchLegacyBootstrap () {
  const [cRes, tRes] = await Promise.all([
    getCaptcha(),
    getLoginTenantList()
  ])
  return mergeLegacyBootstrap(
    (cRes && cRes.data) ? cRes.data : {},
    (tRes && tRes.data) ? tRes.data : {}
  )
}

export function readLoginBootstrapCache () {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !parsed.ts || !parsed.data) return null
    if (Date.now() - parsed.ts > TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }
    return parsed.data
  } catch (e) {
    return null
  }
}

export function writeLoginBootstrapCache (data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
  } catch (e) {
    /* quota / private mode */
  }
}

async function fetchLoginBootstrapData () {
  try {
    const res = await getLoginBootstrap()
    return (res && res.data) ? res.data : {}
  } catch (err) {
    if (isBootstrapNotFound(err)) {
      return fetchLegacyBootstrap()
    }
    throw err
  }
}

/**
 * 路由预取：进入 /login、/register 前发起请求，组件 created 时往往已命中缓存或 in-flight。
 */
export function prefetchLoginBootstrap () {
  const cached = readLoginBootstrapCache()
  if (cached) {
    return Promise.resolve(cached)
  }
  if (inflightPromise) {
    return inflightPromise
  }
  inflightPromise = fetchLoginBootstrapData()
    .then((data) => {
      if (data) writeLoginBootstrapCache(data)
      return data
    })
    .catch(() => null)
    .finally(() => {
      inflightPromise = null
    })
  return inflightPromise
}

/** 刷新验证码（登录失败或点击验证码图） */
export function refreshLoginBootstrap () {
  return fetchLoginBootstrapData()
}

/**
 * 解析租户默认选中（按 domain 匹配 host，否则取第一项）
 */
export function resolveDefaultTenantId (list) {
  const host = (typeof window !== 'undefined' && window.location && window.location.host) || ''
  const matched = list.find((t) => t.domain && host.indexOf(t.domain) >= 0)
  if (matched) return matched.tenantId
  if (list.length > 0) return list[0].tenantId
  return '000000'
}

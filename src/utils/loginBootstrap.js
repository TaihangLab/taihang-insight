/**
 * 登录/注册页验证码初始化缓存
 */
import { getLoginBootstrap, getCaptcha } from '@/api/auth'

const CACHE_KEY = 'login_bootstrap_v1'
const TTL_MS = 5 * 60 * 1000

let inflightPromise = null

function isBootstrapNotFound (err) {
  const status = err && err.response && err.response.status
  return status === 404
}

async function fetchLegacyCaptcha () {
  const cRes = await getCaptcha()
  const c = (cRes && cRes.data) ? cRes.data : {}
  return {
    captchaEnabled: !!c.captchaEnabled,
    uuid: c.uuid || '',
    img: c.img || ''
  }
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
    /* ignore */
  }
}

export function clearLoginBootstrapCache () {
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch (e) {
    /* ignore */
  }
  inflightPromise = null
}

async function fetchLoginBootstrapData () {
  try {
    const res = await getLoginBootstrap()
    return (res && res.data) ? res.data : {}
  } catch (err) {
    if (isBootstrapNotFound(err)) {
      return fetchLegacyCaptcha()
    }
    throw err
  }
}

export function prefetchLoginBootstrap () {
  if (inflightPromise) {
    return inflightPromise
  }
  const cached = readLoginBootstrapCache()
  inflightPromise = fetchLoginBootstrapData()
    .then((data) => {
      if (data) writeLoginBootstrapCache(data)
      return data
    })
    .catch((err) => {
      if (cached) return cached
      return null
    })
    .finally(() => {
      inflightPromise = null
    })
  return inflightPromise
}

export function refreshLoginBootstrap () {
  return fetchLoginBootstrapData()
}

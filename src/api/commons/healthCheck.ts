/**
 * 后端服务健康检查
 * 用于检测后端服务是否可用以及前后端版本兼容性
 */

import { authAxios } from '@/api/commons'

/**
 * 前端版本信息
 */
export const FRONTEND_VERSION = {
  version: '1.0.0',
  apiVersion: 'v1',
  buildTime: (import.meta.env.VITE_BUILD_TIME as string) || 'development',
  compatibleApiVersions: ['v1'] // 支持的 API 版本列表
}

/**
 * 后端健康状态响应
 */
export interface BackendHealthResponse {
  status: 'healthy' | 'degraded' | 'down'
  version?: string
  apiVersion?: string
  timestamp?: string
  services?: {
    database: 'up' | 'down'
    redis?: 'up' | 'down'
    [key: string]: 'up' | 'down' | undefined
  }
}

/**
 * 兼容性检查结果
 */
export interface CompatibilityResult {
  isCompatible: boolean
  backendVersion?: string
  backendApiVersion?: string
  issues: string[]
}

/**
 * 健康检查 API 类
 */
class HealthCheckAPI {
  private healthCheckCache: { result: BackendHealthResponse | null; timestamp: number } = {
    result: null,
    timestamp: 0
  }

  private readonly CACHE_TTL = 30000 // 30秒缓存

  /**
   * 检查后端服务健康状态
   * @param forceRefresh 强制刷新缓存
   */
  async checkHealth(forceRefresh = false): Promise<BackendHealthResponse | null> {
    const now = Date.now()

    // 检查缓存
    if (!forceRefresh && this.healthCheckCache.result && (now - this.healthCheckCache.timestamp) < this.CACHE_TTL) {
      return this.healthCheckCache.result
    }

    try {
      // 直接调用项目实际的健康检查端点
      const response = await authAxios.get('/api/v1/server/system/health', { timeout: 3000 }) as BackendHealthResponse
      this.healthCheckCache = { result: response, timestamp: now }
      return response
    } catch {
      // 健康检查端点失败，尝试调用一个简单的接口来检测后端是否运行
      try {
        await authAxios.get('/api/v1/info', { timeout: 3000 })
        // info 接口可用，说明后端在运行
        const fallbackResult: BackendHealthResponse = {
          status: 'healthy',
          apiVersion: 'v1',
          timestamp: new Date().toISOString()
        }
        this.healthCheckCache = { result: fallbackResult, timestamp: now }
        return fallbackResult
      } catch {
        // 后端完全不可用
        this.healthCheckCache = { result: null, timestamp: now }
        return null
      }
    }
  }

  /**
   * 检查前后端兼容性
   */
  async checkCompatibility(): Promise<CompatibilityResult> {
    const issues: string[] = []
    const health = await this.checkHealth()

    if (!health) {
      return {
        isCompatible: false,
        issues: ['无法连接到后端服务，请检查网络连接或后端服务状态']
      }
    }

    // 检查 API 版本兼容性
    const backendApiVersion = health.apiVersion
    if (backendApiVersion) {
      if (!FRONTEND_VERSION.compatibleApiVersions.includes(backendApiVersion)) {
        issues.push(`API 版本不兼容：前端支持 ${FRONTEND_VERSION.compatibleApiVersions.join(', ')}，后端为 ${backendApiVersion}`)
      }
    }

    // 检查服务状态
    if (health.status === 'down') {
      issues.push('后端服务状态异常：服务离线')
    } else if (health.status === 'degraded') {
      issues.push('后端服务状态警告：部分服务不可用')
    }

    // 检查依赖服务
    if (health.services) {
      if (health.services.database === 'down') {
        issues.push('数据库服务不可用')
      }
      if (health.services.redis === 'down') {
        issues.push('Redis 服务不可用')
      }
    }

    return {
      isCompatible: issues.length === 0,
      backendVersion: health.version,
      backendApiVersion: health.apiVersion,
      issues
    }
  }

  /**
   * 获取详细的版本信息
   */
  getVersionInfo() {
    return {
      frontend: FRONTEND_VERSION,
      backend: this.healthCheckCache.result
    }
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.healthCheckCache = { result: null, timestamp: 0 }
  }
}

// 导出单例实例
const healthCheckAPI = new HealthCheckAPI()
export default healthCheckAPI

/**
 * 在应用启动时执行健康检查
 * 返回检查结果，可用于显示警告或提示
 */
export async function performStartupHealthCheck(): Promise<{
  healthy: boolean
  compatibility: CompatibilityResult
  health: BackendHealthResponse | null
}> {
  console.log('🔍 [HealthCheck] 开始后端服务健康检查...')

  const health = await healthCheckAPI.checkHealth(true)
  const compatibility = await healthCheckAPI.checkCompatibility()

  if (!health) {
    console.warn('⚠️ [HealthCheck] 无法连接到后端服务')
    return { healthy: false, compatibility, health: null }
  }

  if (compatibility.isCompatible) {
    console.log('✅ [HealthCheck] 后端服务健康，版本兼容')
    console.log('   后端 API 版本:', compatibility.backendApiVersion)
    console.log('   前端 API 版本:', FRONTEND_VERSION.apiVersion)
  } else {
    console.warn('⚠️ [HealthCheck] 发现兼容性问题:')
    compatibility.issues.forEach((issue: string) => console.warn('   -', issue))
  }

  return {
    healthy: health.status !== 'down',
    compatibility,
    health
  }
}

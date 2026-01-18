/**
 * 缓存服务基类
 * 提供通用的缓存操作方法
 */

class CacheService {
  constructor(cacheManager, namespace) {
    this.cacheManager = cacheManager;
    this.namespace = namespace;
  }

  /**
   * 获取缓存
   */
  get(key) {
    return this.cacheManager.get(key, this.namespace);
  }

  /**
   * 设置缓存
   */
  set(key, value, ttl) {
    this.cacheManager.set(key, value, ttl, this.namespace);
  }

  /**
   * 删除缓存
   */
  delete(key) {
    this.cacheManager.delete(key, this.namespace);
  }

  /**
   * 检查缓存是否存在
   */
  has(key) {
    return this.cacheManager.has(key, this.namespace);
  }

  /**
   * 批量删除缓存（支持通配符）
   */
  deleteByPattern(pattern) {
    this.cacheManager.deleteByPattern(pattern, this.namespace);
  }

  /**
   * 清空当前命名空间下的所有缓存
   */
  clear() {
    this.deleteByPattern('*');
  }
}

export default CacheService;
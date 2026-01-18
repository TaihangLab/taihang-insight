/**
 * 无操作缓存管理器
 * 这是一个空操作的缓存管理器，用于完全禁用缓存功能
 * 所有操作都不会执行任何实际的缓存行为
 */

class NoOpCacheManager {
  /**
   * 获取缓存项 - 总是返回 null
   * @param {string} key - 缓存键
   * @returns {null} 总是返回 null
   */
  get(key) {
    return null;
  }

  /**
   * 设置缓存项 - 什么都不做
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 缓存时间（毫秒）
   */
  set(key, value, ttl) {
    // 什么都不做
  }

  /**
   * 删除缓存项 - 什么都不做
   * @param {string} key - 缓存键
   */
  delete(key) {
    // 什么都不做
  }

  /**
   * 清空所有缓存 - 什么都不做
   */
  clear() {
    // 什么都不做
  }

  /**
   * 检查缓存是否存在 - 总是返回 false
   * @param {string} key - 缓存键
   * @returns {boolean} 总是返回 false
   */
  has(key) {
    return false;
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 返回空统计信息
   */
  getStats() {
    return {
      memoryCacheSize: 0,
      sessionStorageKeysCount: 0,
      prefix: 'noop'
    };
  }
}

// 创建全局单例实例
const noopCacheManager = new NoOpCacheManager();

export default noopCacheManager;

// 导出类构造函数，以便在需要时创建独立实例
export { NoOpCacheManager };
/**
 * SessionStorage包装类
 * 提供统一的持久化存储接口
 */

class SessionStorage {
  constructor(options = {}) {
    this.prefix = options.prefix || 'cache_';
  }

  /**
   * 获取缓存值
   */
  get(key) {
    try {
      const item = window.sessionStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        return parsedItem;
      }
    } catch (error) {
      console.warn('从sessionStorage获取缓存失败:', error);
    }
    return null;
  }

  /**
   * 设置缓存值
   */
  set(key, value) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('存储到sessionStorage失败:', error);
      throw error;
    }
  }

  /**
   * 删除缓存项
   */
  delete(key) {
    try {
      window.sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('从sessionStorage删除缓存失败:', error);
      return false;
    }
  }

  /**
   * 清空所有缓存
   */
  clear() {
    try {
      window.sessionStorage.clear();
    } catch (error) {
      console.warn('清空sessionStorage失败:', error);
    }
  }

  /**
   * 清空指定前缀的缓存
   */
  clearByPrefix(prefix) {
    try {
      const keysToRemove = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => window.sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('清空sessionStorage指定前缀缓存失败:', error);
    }
  }

  /**
   * 清理过期的缓存项
   */
  cleanupExpired() {
    try {
      const keysToRemove = [];
      const now = Date.now();
      
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          try {
            const item = JSON.parse(window.sessionStorage.getItem(key));
            if (item && now >= item.expiry) {
              keysToRemove.push(key);
            }
          } catch (parseError) {
            // 如果解析失败，也删除该项
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => window.sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('清理sessionStorage过期项失败:', error);
    }
  }

  /**
   * 根据模式删除缓存项
   */
  deleteByPattern(pattern) {
    try {
      const keysToRemove = [];
      
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key && pattern.test(key)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => window.sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('根据模式删除sessionStorage缓存失败:', error);
    }
  }

  /**
   * 获取指定前缀的键数量
   */
  getKeysCountByPrefix(prefix) {
    try {
      let count = 0;
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key && key.startsWith(prefix)) {
          count++;
        }
      }
      return count;
    } catch (error) {
      console.warn('获取sessionStorage键数量失败:', error);
      return 0;
    }
  }

  /**
   * 获取指定前缀的键
   */
  getKeysByPrefix(prefix) {
    const keys = [];
    try {
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key);
        }
      }
    } catch (error) {
      console.warn('获取sessionStorage键失败:', error);
    }
    return keys;
  }
}

export default SessionStorage;
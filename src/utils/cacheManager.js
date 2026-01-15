/**
 * 通用缓存管理器
 * 结合内存缓存和sessionStorage，用于优化API调用性能
 */

class CacheManager {
  constructor(options = {}) {
    // 默认配置
    this.options = {
      // 默认缓存时间（毫秒），默认10分钟
      defaultTTL: options.defaultTTL || 10 * 60 * 1000,
      // 内存缓存最大条目数
      maxMemoryEntries: options.maxMemoryEntries || 100,
      // 是否启用sessionStorage
      enableSessionStorage: options.enableSessionStorage !== false,
      // 缓存键前缀
      prefix: options.prefix || 'cache_'
    };

    // 内存缓存存储
    this.memoryCache = new Map();
    
    // 记录内存缓存大小
    this.memorySize = 0;
  }

  /**
   * 生成缓存键
   */
  generateKey(key) {
    return `${this.options.prefix}${key}`;
  }

  /**
   * 获取缓存项
   * @param {string} key - 缓存键
   * @returns {any} 缓存值，如果过期或不存在则返回null
   */
  get(key) {
    const cacheKey = this.generateKey(key);
    
    // 首先尝试从内存缓存获取
    if (this.memoryCache.has(cacheKey)) {
      const cachedItem = this.memoryCache.get(cacheKey);
      
      // 检查是否过期
      if (Date.now() < cachedItem.expiry) {
        return cachedItem.value;
      } else {
        // 过期则删除
        this.memoryCache.delete(cacheKey);
        this.memorySize--;
      }
    }

    // 如果启用了sessionStorage，则尝试从sessionStorage获取
    if (this.options.enableSessionStorage) {
      try {
        const storedValue = sessionStorage.getItem(cacheKey);
        if (storedValue) {
          const parsedItem = JSON.parse(storedValue);
          
          // 检查是否过期
          if (Date.now() < parsedItem.expiry) {
            // 将有效的缓存项放回内存缓存
            this.set(key, parsedItem.value, parsedItem.ttl);
            return parsedItem.value;
          } else {
            // 过期则删除
            sessionStorage.removeItem(cacheKey);
          }
        }
      } catch (error) {
        console.warn('从sessionStorage获取缓存失败:', error);
      }
    }

    return null;
  }

  /**
   * 设置缓存项
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 缓存时间（毫秒），如果不提供则使用默认值
   */
  set(key, value, ttl) {
    const cacheKey = this.generateKey(key);
    const expiryTime = Date.now() + (ttl || this.options.defaultTTL);
    const itemTTL = ttl || this.options.defaultTTL;

    // 准备缓存项
    const cacheItem = {
      value,
      expiry: expiryTime,
      ttl: itemTTL
    };

    // 存储到内存缓存
    this.memoryCache.set(cacheKey, cacheItem);
    this.memorySize++;

    // 如果超过最大内存条目数，删除最旧的条目
    if (this.memorySize > this.options.maxMemoryEntries) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
        this.memorySize--;
      }
    }

    // 如果启用了sessionStorage，则也存储到sessionStorage
    if (this.options.enableSessionStorage) {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheItem));
      } catch (error) {
        console.warn('存储到sessionStorage失败:', error);
        // 如果sessionStorage满了，尝试清理过期项
        this.cleanupExpiredSessionStorage();
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheItem));
        } catch (retryError) {
          console.error('再次尝试存储到sessionStorage失败:', retryError);
        }
      }
    }
  }

  /**
   * 删除缓存项
   * @param {string} key - 缓存键
   */
  delete(key) {
    const cacheKey = this.generateKey(key);

    // 从内存缓存删除
    if (this.memoryCache.has(cacheKey)) {
      this.memoryCache.delete(cacheKey);
      this.memorySize--;
    }

    // 从sessionStorage删除
    if (this.options.enableSessionStorage) {
      try {
        sessionStorage.removeItem(cacheKey);
      } catch (error) {
        console.warn('从sessionStorage删除缓存失败:', error);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clear() {
    // 清空内存缓存
    this.memoryCache.clear();
    this.memorySize = 0;

    // 清空sessionStorage中的缓存项
    if (this.options.enableSessionStorage) {
      try {
        // 只删除带有我们前缀的缓存项
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(this.options.prefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
      } catch (error) {
        console.warn('清空sessionStorage缓存失败:', error);
      }
    }
  }

  /**
   * 检查缓存是否存在且未过期
   * @param {string} key - 缓存键
   * @returns {boolean} 是否存在有效缓存
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * 清理sessionStorage中的过期项
   */
  cleanupExpiredSessionStorage() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.options.prefix)) {
          try {
            const item = JSON.parse(sessionStorage.getItem(key));
            if (item && Date.now() >= item.expiry) {
              keysToRemove.push(key);
            }
          } catch (parseError) {
            // 如果解析失败，也删除该项
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('清理sessionStorage过期项失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      memoryCacheSize: this.memorySize,
      sessionStorageKeysCount: this.getSessionStorageKeysCount(),
      prefix: this.options.prefix
    };
  }

  /**
   * 获取sessionStorage中缓存键的数量
   */
  getSessionStorageKeysCount() {
    if (!this.options.enableSessionStorage) {
      return 0;
    }

    try {
      let count = 0;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(this.options.prefix)) {
          count++;
        }
      }
      return count;
    } catch (error) {
      console.warn('获取sessionStorage键数量失败:', error);
      return 0;
    }
  }
}

// 创建全局单例实例
const globalCacheManager = new CacheManager();

export default globalCacheManager;

// 导出类构造函数，以便在需要时创建独立实例
export { CacheManager };
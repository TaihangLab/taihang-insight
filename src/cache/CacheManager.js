/**
 * 通用缓存管理器
 * 结合内存缓存和多种存储方式，用于优化API调用性能
 * 支持自动清理过期缓存，可配置多种缓存策略
 */

import cacheConfig from './cacheConfig';
import MemoryStorage from './storages/MemoryStorage';
import SessionStorage from './storages/SessionStorage';
import LocalStorage from './storages/LocalStorage';
import LRUCacheStrategy from './strategies/LRUCacheStrategy';

class CacheManager {
  constructor(options = {}) {
    // 合并配置
    this.options = {
      ...cacheConfig.default,
      ...options
    };

    // 初始化存储
    this.memoryStorage = new MemoryStorage({
      maxSize: this.options.maxMemoryEntries
    });
    
    this.sessionStorage = this.options.enableSessionStorage 
      ? new SessionStorage({ prefix: this.options.prefix }) 
      : null;
      
    this.localStorage = this.options.enableLocalStorage 
      ? new LocalStorage({ prefix: this.options.prefix }) 
      : null;

    // 初始化缓存策略
    this.cacheStrategy = new LRUCacheStrategy();

    // 启动定期清理过期缓存的任务（每分钟检查一次）
    this.startCleanupTask();
  }

  /**
   * 启动定期清理任务
   * 自动清理内存和存储中的过期缓存项
   */
  startCleanupTask() {
    setInterval(() => {
      this.cleanupExpired();
    }, 60000); // 每分钟执行一次清理
  }

  /**
   * 生成缓存键
   */
  generateKey(key, namespace = '') {
    const prefix = namespace ? `${this.options.prefix}${namespace}_` : this.options.prefix;
    return `${prefix}${key}`;
  }

  /**
   * 获取缓存项
   * @param {string} key - 缓存键
   * @param {string} namespace - 命名空间
   * @returns {any} 缓存值，如果过期或不存在则返回null
   */
  get(key, namespace = '') {
    const cacheKey = this.generateKey(key, namespace);

    // 首先尝试从内存缓存获取
    let cachedItem = this.memoryStorage.get(cacheKey);
    if (cachedItem !== null) {
      // 检查是否过期
      if (Date.now() < cachedItem.expiry) {
        // 更新访问时间（LRU策略）
        this.cacheStrategy.access(cacheKey);
        return cachedItem.value;
      } else {
        // 过期则删除
        this.memoryStorage.delete(cacheKey);
      }
    }

    // 如果启用了持久化存储，则尝试从持久化存储获取
    if (this.sessionStorage) {
      cachedItem = this.sessionStorage.get(cacheKey);
      if (cachedItem !== null) {
        // 检查是否过期
        if (Date.now() < cachedItem.expiry) {
          // 将有效的缓存项放回内存缓存
          this.set(key, cachedItem.value, cachedItem.ttl, namespace);
          return cachedItem.value;
        } else {
          // 过期则删除
          this.sessionStorage.delete(cacheKey);
        }
      }
    }

    if (this.localStorage) {
      cachedItem = this.localStorage.get(cacheKey);
      if (cachedItem !== null) {
        // 检查是否过期
        if (Date.now() < cachedItem.expiry) {
          // 将有效的缓存项放回内存缓存
          this.set(key, cachedItem.value, cachedItem.ttl, namespace);
          return cachedItem.value;
        } else {
          // 过期则删除
          this.localStorage.delete(cacheKey);
        }
      }
    }

    return null;
  }

  /**
   * 设置缓存项
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 缓存时间（毫秒），如果不提供则使用默认值
   * @param {string} namespace - 命名空间
   */
  set(key, value, ttl, namespace = '') {
    const cacheKey = this.generateKey(key, namespace);
    const expiryTime = Date.now() + (ttl || this.options.defaultTTL);
    const itemTTL = ttl || this.options.defaultTTL;

    // 准备缓存项
    const cacheItem = {
      value,
      expiry: expiryTime,
      ttl: itemTTL
    };

    // 存储到内存缓存
    this.memoryStorage.set(cacheKey, cacheItem);

    // 如果超过了内存限制，执行LRU淘汰
    if (this.memoryStorage.size() > this.options.maxMemoryEntries) {
      const lruKey = this.cacheStrategy.getLeastRecentlyUsed();
      if (lruKey) {
        this.memoryStorage.delete(lruKey);
      }
    }

    // 更新访问时间
    this.cacheStrategy.access(cacheKey);

    // 如果启用了持久化存储，则也存储到持久化存储
    if (this.sessionStorage) {
      try {
        this.sessionStorage.set(cacheKey, cacheItem);
      } catch (error) {
        console.warn('存储到sessionStorage失败:', error);
        // 如果sessionStorage满了，尝试清理过期项
        this.cleanupExpiredSessionStorage();
        try {
          this.sessionStorage.set(cacheKey, cacheItem);
        } catch (retryError) {
          console.error('再次尝试存储到sessionStorage失败:', retryError);
        }
      }
    }

    if (this.localStorage) {
      try {
        this.localStorage.set(cacheKey, cacheItem);
      } catch (error) {
        console.warn('存储到localStorage失败:', error);
        // 如果localStorage满了，尝试清理过期项
        this.cleanupExpiredLocalStorage();
        try {
          this.localStorage.set(cacheKey, cacheItem);
        } catch (retryError) {
          console.error('再次尝试存储到localStorage失败:', retryError);
        }
      }
    }
  }

  /**
   * 删除缓存项
   * @param {string} key - 缓存键
   * @param {string} namespace - 命名空间
   */
  delete(key, namespace = '') {
    const cacheKey = this.generateKey(key, namespace);

    // 从内存缓存删除
    this.memoryStorage.delete(cacheKey);

    // 从持久化存储删除
    if (this.sessionStorage) {
      this.sessionStorage.delete(cacheKey);
    }

    if (this.localStorage) {
      this.localStorage.delete(cacheKey);
    }

    // 从缓存策略中移除
    this.cacheStrategy.remove(cacheKey);
  }

  /**
   * 批量删除缓存项（支持通配符）
   * @param {string} pattern - 匹配模式，支持*通配符
   * @param {string} namespace - 命名空间
   */
  deleteByPattern(pattern, namespace = '') {
    const regexPattern = this._convertToRegExp(pattern, namespace);
    
    // 从内存存储删除匹配的项
    this.memoryStorage.deleteByPattern(regexPattern);
    
    // 从持久化存储删除匹配的项
    if (this.sessionStorage) {
      this.sessionStorage.deleteByPattern(regexPattern);
    }
    
    if (this.localStorage) {
      this.localStorage.deleteByPattern(regexPattern);
    }
  }

  /**
   * 将通配符模式转换为正则表达式
   */
  _convertToRegExp(pattern, namespace) {
    const prefix = namespace ? `${this.options.prefix}${namespace}_` : this.options.prefix;
    // 转义特殊正则字符
    let escapedPattern = prefix + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    // 将*替换为.* 
    escapedPattern = escapedPattern.replace(/\*/g, '.*');
    return new RegExp(`^${escapedPattern}$`);
  }

  /**
   * 清空所有缓存
   */
  clear() {
    // 清空内存缓存
    this.memoryStorage.clear();

    // 清空持久化存储中的缓存项
    if (this.sessionStorage) {
      this.sessionStorage.clearByPrefix(this.options.prefix);
    }

    if (this.localStorage) {
      this.localStorage.clearByPrefix(this.options.prefix);
    }

    // 清空缓存策略
    this.cacheStrategy.clear();
  }

  /**
   * 检查缓存是否存在且未过期
   * @param {string} key - 缓存键
   * @param {string} namespace - 命名空间
   * @returns {boolean} 是否存在有效缓存
   */
  has(key, namespace = '') {
    return this.get(key, namespace) !== null;
  }

  /**
   * 清理内存和持久化存储中的过期项
   */
  cleanupExpired() {
    // 清理内存缓存中的过期项
    this.memoryStorage.cleanupExpired();

    // 清理持久化存储中的过期项
    if (this.sessionStorage) {
      this.cleanupExpiredSessionStorage();
    }

    if (this.localStorage) {
      this.cleanupExpiredLocalStorage();
    }
  }

  /**
   * 清理sessionStorage中的过期项
   */
  cleanupExpiredSessionStorage() {
    if (!this.sessionStorage) return;
    
    try {
      this.sessionStorage.cleanupExpired();
    } catch (error) {
      console.warn('清理sessionStorage过期项失败:', error);
    }
  }

  /**
   * 清理localStorage中的过期项
   */
  cleanupExpiredLocalStorage() {
    if (!this.localStorage) return;
    
    try {
      this.localStorage.cleanupExpired();
    } catch (error) {
      console.warn('清理localStorage过期项失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      memoryCacheSize: this.memoryStorage.size(),
      sessionStorageKeysCount: this.sessionStorage ? this.sessionStorage.getKeysCountByPrefix(this.options.prefix) : 0,
      localStorageKeysCount: this.localStorage ? this.localStorage.getKeysCountByPrefix(this.options.prefix) : 0,
      prefix: this.options.prefix
    };
  }

  /**
   * 获取命名空间下的所有缓存键
   */
  getKeysByNamespace(namespace) {
    const prefix = namespace ? `${this.options.prefix}${namespace}_` : this.options.prefix;
    const keys = [];
    
    // 从内存存储获取
    keys.push(...this.memoryStorage.getKeysByPrefix(prefix));
    
    // 从持久化存储获取
    if (this.sessionStorage) {
      keys.push(...this.sessionStorage.getKeysByPrefix(prefix));
    }
    
    if (this.localStorage) {
      keys.push(...this.localStorage.getKeysByPrefix(prefix));
    }
    
    // 去重
    return [...new Set(keys)];
  }
}

export default CacheManager;
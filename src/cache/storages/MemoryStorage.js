/**
 * 内存存储类
 * 使用Map对象实现内存缓存
 */

class MemoryStorage {
  constructor(options = {}) {
    this.storage = new Map();
    this.maxSize = options.maxSize || 100;
  }

  /**
   * 获取缓存值
   */
  get(key) {
    return this.storage.get(key) || null;
  }

  /**
   * 设置缓存值
   */
  set(key, value) {
    // 如果超过最大容量，删除最老的项
    if (this.storage.size >= this.maxSize) {
      const firstKey = this.storage.keys().next().value;
      this.storage.delete(firstKey);
    }
    
    this.storage.set(key, value);
  }

  /**
   * 删除缓存项
   */
  delete(key) {
    return this.storage.delete(key);
  }

  /**
   * 检查是否存在键
   */
  has(key) {
    return this.storage.has(key);
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.storage.clear();
  }

  /**
   * 获取缓存大小
   */
  size() {
    return this.storage.size;
  }

  /**
   * 清理过期的缓存项
   */
  cleanupExpired() {
    const now = Date.now();
    for (const [key, value] of this.storage) {
      if (now >= value.expiry) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * 根据模式删除缓存项
   */
  deleteByPattern(pattern) {
    for (const key of this.storage.keys()) {
      if (pattern.test(key)) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * 获取指定前缀的键
   */
  getKeysByPrefix(prefix) {
    const keys = [];
    for (const key of this.storage.keys()) {
      if (key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }
}

export default MemoryStorage;
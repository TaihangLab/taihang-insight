/**
 * LRU (Least Recently Used) 缓存策略
 * 用于管理缓存项的访问顺序，实现最少使用项的淘汰
 */

class LRUCacheStrategy {
  constructor() {
    this.cache = new Map(); // 存储键和访问时间的映射
    this.accessOrder = []; // 记录访问顺序
  }

  /**
   * 记录键的访问
   */
  access(key) {
    const now = Date.now();
    this.cache.set(key, now);
    
    // 从访问顺序数组中移除该键（如果存在）
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    
    // 将键添加到访问顺序数组末尾
    this.accessOrder.push(key);
  }

  /**
   * 获取最少最近使用的键
   */
  getLeastRecentlyUsed() {
    if (this.accessOrder.length === 0) {
      return null;
    }
    
    // 返回访问顺序数组的第一个元素（最久未访问的）
    return this.accessOrder[0];
  }

  /**
   * 从策略中移除键
   */
  remove(key) {
    this.cache.delete(key);
    
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * 清空策略
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * 获取缓存大小
   */
  size() {
    return this.cache.size;
  }
}

export default LRUCacheStrategy;
/**
 * 缓存管理主入口
 * 统一管理项目中的所有缓存操作
 */

import CacheManager from './CacheManager';
import cacheConfig from './cacheConfig';

// 创建全局缓存实例
const globalCache = new CacheManager(cacheConfig);

// 导出缓存管理器类和实例
export {
  CacheManager,
  globalCache
};

// 也可以直接导出实例供全局使用
export default globalCache;
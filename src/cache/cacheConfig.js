/**
 * 缓存配置文件
 * 定义缓存的全局配置
 */

const cacheConfig = {
  // 默认配置
  default: {
    // 默认缓存时间（毫秒），默认10分钟
    defaultTTL: 10 * 60 * 1000,
    // 内存缓存最大条目数
    maxMemoryEntries: 100,
    // 是否启用sessionStorage
    enableSessionStorage: true,
    // 是否启用localStorage
    enableLocalStorage: true,
    // 缓存键前缀
    prefix: 'taihang_cache_',
    // 是否启用压缩（对于大对象）
    enableCompression: false
  },
  
  // 特定缓存配置
  tenants: {
    defaultTTL: 30 * 60 * 1000, // 30分钟
    maxMemoryEntries: 50
  },
  
  roles: {
    defaultTTL: 15 * 60 * 1000, // 15分钟
    maxMemoryEntries: 100
  },
  
  users: {
    defaultTTL: 10 * 60 * 1000, // 10分钟
    maxMemoryEntries: 200
  },
  
  permissions: {
    defaultTTL: 20 * 60 * 1000, // 20分钟
    maxMemoryEntries: 100
  },
  
  departments: {
    defaultTTL: 15 * 60 * 1000, // 15分钟
    maxMemoryEntries: 100
  }
};

export default cacheConfig;
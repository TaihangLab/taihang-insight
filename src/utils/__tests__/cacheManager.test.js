import CacheManager from '../cacheManager';

describe('CacheManager', () => {
  let cacheManager;

  beforeEach(() => {
    // 创建一个新的缓存管理器实例，避免测试间相互影响
    cacheManager = new CacheManager({ 
      defaultTTL: 1000, // 1秒过期时间用于测试
      maxMemoryEntries: 10,
      enableSessionStorage: false // 禁用sessionStorage以简化测试
    });
    
    // 清空内存缓存
    cacheManager.clear();
  });

  afterEach(() => {
    // 清理sessionStorage（如果有写入的话）
    if (window.sessionStorage) {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(cacheManager.options.prefix)) {
          sessionStorage.removeItem(key);
        }
      }
    }
  });

  describe('基本功能', () => {
    test('应该能够设置和获取缓存项', () => {
      const key = 'testKey';
      const value = 'testValue';
      
      cacheManager.set(key, value);
      const retrievedValue = cacheManager.get(key);
      
      expect(retrievedValue).toBe(value);
    });

    test('当缓存项不存在时应该返回null', () => {
      const nonExistentKey = 'nonExistentKey';
      const result = cacheManager.get(nonExistentKey);
      
      expect(result).toBeNull();
    });

    test('应该能够删除缓存项', () => {
      const key = 'testKey';
      const value = 'testValue';
      
      cacheManager.set(key, value);
      expect(cacheManager.get(key)).toBe(value);
      
      cacheManager.delete(key);
      expect(cacheManager.get(key)).toBeNull();
    });

    test('应该能够清空所有缓存', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      
      expect(cacheManager.get('key1')).toBe('value1');
      expect(cacheManager.get('key2')).toBe('value2');
      
      cacheManager.clear();
      
      expect(cacheManager.get('key1')).toBeNull();
      expect(cacheManager.get('key2')).toBeNull();
    });
  });

  describe('过期功能', () => {
    test('缓存项应该在指定时间后过期', async () => {
      const key = 'expiringKey';
      const value = 'expiringValue';
      const ttl = 10; // 10毫秒后过期
      
      cacheManager.set(key, value, ttl);
      
      // 立即获取应该能获取到值
      expect(cacheManager.get(key)).toBe(value);
      
      // 等待超过过期时间
      await new Promise(resolve => setTimeout(resolve, 15));
      
      // 应该返回null，因为已过期
      expect(cacheManager.get(key)).toBeNull();
    });

    test('应该能够检查缓存项是否存在且未过期', () => {
      const key = 'checkExpiryKey';
      const value = 'checkExpiryValue';
      
      cacheManager.set(key, value, 1000); // 1秒后过期
      expect(cacheManager.has(key)).toBe(true);
      
      cacheManager.delete(key);
      expect(cacheManager.has(key)).toBe(false);
    });
  });

  describe('内存限制', () => {
    test('当超过最大内存条目数时应该删除最旧的条目', () => {
      const maxEntries = 3;
      cacheManager = new CacheManager({ 
        defaultTTL: 10000, // 10秒过期
        maxMemoryEntries: maxEntries,
        enableSessionStorage: false
      });
      
      // 添加超过最大限制的条目
      for (let i = 0; i < maxEntries + 2; i++) {
        cacheManager.set(`key${i}`, `value${i}`);
      }
      
      // 检查内存大小是否符合限制
      const stats = cacheManager.getStats();
      expect(stats.memoryCacheSize).toBeLessThanOrEqual(maxEntries);
      
      // 最早的条目应该已被删除
      expect(cacheManager.get('key0')).toBeNull();
      expect(cacheManager.get('key1')).toBeNull();
      // 最新的条目应该还在
      expect(cacheManager.get(`key${maxEntries + 1}`)).toBe(`value${maxEntries + 1}`);
    });
  });

  describe('SessionStorage集成', () => {
    test('当启用SessionStorage时应该同时存储到内存和SessionStorage', () => {
      // 创建一个启用sessionStorage的缓存管理器
      const sessionStorageEnabledCache = new CacheManager({
        defaultTTL: 1000,
        maxMemoryEntries: 10,
        enableSessionStorage: true
      });
      
      const key = 'sessionStorageKey';
      const value = { test: 'data', number: 123 };
      
      sessionStorageEnabledCache.set(key, value);
      
      // 检查是否存储到了sessionStorage
      const storedInSession = sessionStorage.getItem(sessionStorageEnabledCache.generateKey(key));
      expect(storedInSession).not.toBeNull();
      
      // 解析并验证数据
      const parsedData = JSON.parse(storedInSession);
      expect(parsedData.value).toEqual(value);
      expect(typeof parsedData.expiry).toBe('number');
      
      // 验证也能从内存中获取
      expect(sessionStorageEnabledCache.get(key)).toEqual(value);
      
      // 清理
      sessionStorageEnabledCache.clear();
    });

    test('从sessionStorage恢复过期项应该返回null', async () => {
      const sessionStorageEnabledCache = new CacheManager({
        defaultTTL: 10, // 10毫秒后过期
        maxMemoryEntries: 10,
        enableSessionStorage: true
      });
      
      const key = 'expiredSessionKey';
      const value = 'expiredSessionValue';
      
      sessionStorageEnabledCache.set(key, value);
      
      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 15));
      
      // 清空内存缓存以强制从sessionStorage读取
      sessionStorageEnabledCache.memoryCache.clear();
      sessionStorageEnabledCache.memorySize = 0;
      
      // 尝试获取应该返回null，因为已过期
      expect(sessionStorageEnabledCache.get(key)).toBeNull();
      
      // 清理
      sessionStorageEnabledCache.clear();
    });
  });

  describe('统计功能', () => {
    test('应该正确返回缓存统计信息', () => {
      cacheManager.set('statKey1', 'statValue1');
      cacheManager.set('statKey2', 'statValue2');
      
      const stats = cacheManager.getStats();
      
      expect(stats).toHaveProperty('memoryCacheSize');
      expect(stats.memoryCacheSize).toBe(2);
      expect(stats).toHaveProperty('sessionStorageKeysCount');
      expect(stats).toHaveProperty('prefix');
    });
  });

  describe('清理过期项', () => {
    test('应该能够清理内存中的过期项', async () => {
      cacheManager.set('expiringKey1', 'value1', 5); // 5毫秒后过期
      cacheManager.set('expiringKey2', 'value2', 5); // 5毫秒后过期
      cacheManager.set('longLivedKey', 'value3', 1000); // 1秒后过期
      
      expect(cacheManager.get('expiringKey1')).toBe('value1');
      expect(cacheManager.get('expiringKey2')).toBe('value2');
      expect(cacheManager.get('longLivedKey')).toBe('value3');
      
      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // 手动清理过期项
      cacheManager.cleanupExpired();
      
      // 过期项应该已被清理
      expect(cacheManager.get('expiringKey1')).toBeNull();
      expect(cacheManager.get('expiringKey2')).toBeNull();
      
      // 长效项应该仍然存在
      expect(cacheManager.get('longLivedKey')).toBe('value3');
    });
  });
});
import CacheManager from '@/utils/cacheManager';
import RBACService from '@/components/service/RBACService';

describe('Cache Integration Tests', () => {
  let cacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager({ 
      defaultTTL: 1000, // 1秒过期时间用于测试
      maxMemoryEntries: 10,
      enableSessionStorage: true // 启用sessionStorage进行集成测试
    });
    
    // 清空缓存
    cacheManager.clear();
  });

  afterEach(() => {
    // 清理sessionStorage
    if (window.sessionStorage) {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(cacheManager.options.prefix)) {
          sessionStorage.removeItem(key);
        }
      }
    }
  });

  test('完整的缓存流程：设置、获取、过期、清理', async () => {
    const key = 'integration-test-key';
    const value = { 
      data: 'test-data', 
      timestamp: Date.now(),
      nested: { 
        obj: [1, 2, 3] 
      } 
    };
    
    // 1. 设置缓存
    cacheManager.set(key, value, 50); // 50ms后过期
    
    // 2. 验证可以从内存获取
    let retrievedValue = cacheManager.get(key);
    expect(retrievedValue).toEqual(value);
    
    // 3. 验证可以从sessionStorage获取（模拟页面刷新）
    // 清空内存缓存
    cacheManager.memoryCache.clear();
    cacheManager.memorySize = 0;
    
    // 现在应该从sessionStorage恢复到内存
    retrievedValue = cacheManager.get(key);
    expect(retrievedValue).toEqual(value);
    
    // 4. 验证过期功能
    await new Promise(resolve => setTimeout(resolve, 60)); // 等待过期
    
    // 清空内存缓存以强制检查sessionStorage
    cacheManager.memoryCache.clear();
    cacheManager.memorySize = 0;
    
    // 现在应该返回null，因为已过期
    retrievedValue = cacheManager.get(key);
    expect(retrievedValue).toBeNull();
    
    // 验证sessionStorage也被清理
    const sessionStorageKey = cacheManager.generateKey(key);
    const storedValue = sessionStorage.getItem(sessionStorageKey);
    expect(storedValue).toBeNull();
  });

  test('RBACService与CacheManager的集成', async () => {
    // 检查RBACService是否正确使用了缓存
    expect(RBACService.cacheManager).toBeDefined();
    expect(RBACService.cacheManager instanceof CacheManager).toBe(true);
    
    // 验证RBACService的缓存方法可用
    expect(typeof RBACService.clearCache).toBe('function');
    expect(typeof RBACService.getCacheStats).toBe('function');
  });

  test('缓存统计功能集成', () => {
    // 添加一些缓存项
    cacheManager.set('stat-test-1', 'value1');
    cacheManager.set('stat-test-2', 'value2');
    cacheManager.set('stat-test-3', 'value3');
    
    const stats = cacheManager.getStats();
    
    // 验证内存统计
    expect(stats.memoryCacheSize).toBe(3);
    
    // 验证sessionStorage统计（如果启用）
    if (cacheManager.options.enableSessionStorage) {
      expect(stats.sessionStorageKeysCount).toBeGreaterThanOrEqual(3);
    }
    
    expect(stats.prefix).toBe(cacheManager.options.prefix);
  });

  test('缓存清理功能集成', async () => {
    // 设置多个具有不同过期时间的缓存项
    cacheManager.set('short-lived', 'value1', 10); // 10ms后过期
    cacheManager.set('medium-lived', 'value2', 100); // 100ms后过期
    cacheManager.set('long-lived', 'value3', 1000); // 1秒后过期
    
    // 验证所有项都存在
    expect(cacheManager.get('short-lived')).toBe('value1');
    expect(cacheManager.get('medium-lived')).toBe('value2');
    expect(cacheManager.get('long-lived')).toBe('value3');
    
    // 等待短生命周期的项过期
    await new Promise(resolve => setTimeout(resolve, 15));
    
    // 执行清理
    cacheManager.cleanupExpired();
    
    // 验证已过期的项被清理
    expect(cacheManager.get('short-lived')).toBeNull();
    
    // 验证未过期的项仍然存在
    expect(cacheManager.get('medium-lived')).toBe('value2');
    expect(cacheManager.get('long-lived')).toBe('value3');
    
    // 等待medium-lived过期
    await new Promise(resolve => setTimeout(resolve, 90));
    
    // 再次清理
    cacheManager.cleanupExpired();
    
    // 验证medium-lived现在也过期了
    expect(cacheManager.get('medium-lived')).toBeNull();
    expect(cacheManager.get('long-lived')).toBe('value3');
  });

  test('内存限制和LRU淘汰策略', () => {
    const maxEntries = 5;
    const testCache = new CacheManager({
      defaultTTL: 10000, // 10秒过期
      maxMemoryEntries: maxEntries,
      enableSessionStorage: false
    });
    
    // 添加超过限制的项
    for (let i = 0; i < maxEntries + 2; i++) {
      testCache.set(`key-${i}`, `value-${i}`);
    }
    
    // 验证内存大小不超过限制
    const stats = testCache.getStats();
    expect(stats.memoryCacheSize).toBeLessThanOrEqual(maxEntries);
    
    // 验证最新的项仍然存在
    expect(testCache.get(`key-${maxEntries + 1}`)).toBe(`value-${maxEntries + 1}`);
    expect(testCache.get(`key-${maxEntries}`)).toBe(`value-${maxEntries}`);
    
    // 验证最早的项可能已被删除（取决于具体实现）
    // 由于我们使用Map的迭代顺序，最早添加的项可能已被删除
  });

  test('缓存键生成和命名空间隔离', () => {
    const customPrefixCache = new CacheManager({
      defaultTTL: 1000,
      maxMemoryEntries: 10,
      prefix: 'custom_prefix_'
    });
    
    const key = 'test-key';
    const value = 'test-value';
    
    // 使用自定义前缀设置值
    customPrefixCache.set(key, value);
    
    // 验证使用了正确的前缀
    const generatedKey = customPrefixCache.generateKey(key);
    expect(generatedKey).toBe('custom_prefix_test-key');
    
    // 验证可以正确获取值
    expect(customPrefixCache.get(key)).toBe(value);
    
    // 验证与其他缓存实例隔离
    const anotherCache = new CacheManager({
      defaultTTL: 1000,
      maxMemoryEntries: 10,
      prefix: 'another_prefix_'
    });
    
    // 另一个缓存不应该有相同的键
    expect(anotherCache.get(key)).toBeNull();
    
    // 清理
    customPrefixCache.clear();
    anotherCache.clear();
  });
});
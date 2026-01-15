/**
 * 缓存功能测试文件
 * 用于验证缓存管理器的功能和性能提升
 */

import cacheManager from './cacheManager';
import RBACService from '@/components/service/RBACService';

// 测试缓存基本功能
async function testBasicCacheFunctionality() {
  console.log('🧪 开始测试缓存基本功能...');
  
  // 测试设置和获取
  const testKey = 'test_key';
  const testValue = { id: 1, name: 'Test Data', timestamp: Date.now() };
  
  // 设置缓存
  cacheManager.set(testKey, testValue, 5000); // 5秒过期
  
  // 获取缓存
  const retrievedValue = cacheManager.get(testKey);
  console.log('✅ 设置和获取测试:', JSON.stringify(retrievedValue) === JSON.stringify(testValue));
  
  // 测试过期
  cacheManager.set('expiring_key', 'will expire', 100); // 100ms过期
  setTimeout(() => {
    const expiredValue = cacheManager.get('expiring_key');
    console.log('✅ 过期测试:', expiredValue === null);
  }, 150);
  
  // 测试删除
  cacheManager.delete(testKey);
  const deletedValue = cacheManager.get(testKey);
  console.log('✅ 删除测试:', deletedValue === null);
  
  // 测试统计信息
  const stats = cacheManager.getStats();
  console.log('📊 缓存统计:', stats);
}

// 测试RBAC服务缓存功能
async function testRBACServiceCache() {
  console.log('\n🧪 开始测试RBAC服务缓存功能...');
  
  try {
    // 第一次调用 - 从服务器获取
    console.log('🔍 第一次获取租户列表...');
    const startTime1 = Date.now();
    const result1 = await RBACService.getTenants({ page: 1, size: 10 });
    const endTime1 = Date.now();
    console.log(`⏱️  第一次调用耗时: ${endTime1 - startTime1}ms`);
    
    // 第二次调用 - 从缓存获取
    console.log('🔍 第二次获取租户列表（应该从缓存获取）...');
    const startTime2 = Date.now();
    const result2 = await RBACService.getTenants({ page: 1, size: 10 });
    const endTime2 = Date.now();
    console.log(`⏱️  第二次调用耗时: ${endTime2 - startTime2}ms`);
    
    // 验证两次结果相同
    console.log('✅ 结果一致性测试:', JSON.stringify(result1) === JSON.stringify(result2));
    
    // 验证第二次调用更快（理论上应该快很多）
    console.log('⚡ 性能提升测试:', (endTime1 - startTime1) > (endTime2 - startTime2));
    
    // 测试清除缓存后重新获取
    console.log('🔄 清除缓存后重新获取...');
    RBACService.clearCache();
    const startTime3 = Date.now();
    const result3 = await RBACService.getTenants({ page: 1, size: 10 });
    const endTime3 = Date.now();
    console.log(`⏱️  清除缓存后调用耗时: ${endTime3 - startTime3}ms`);
    
    // 验证清除缓存后结果仍然一致
    console.log('✅ 清除缓存后结果一致性测试:', JSON.stringify(result1) === JSON.stringify(result3));
    
    // 检查缓存统计
    const stats = RBACService.getCacheStats();
    console.log('📊 RBAC服务缓存统计:', stats);
    
  } catch (error) {
    console.error('❌ RBAC服务缓存测试失败:', error);
  }
}

// 运行测试
async function runAllTests() {
  console.log('🚀 开始运行缓存功能测试...\n');
  
  await testBasicCacheFunctionality();
  await testRBACServiceCache();
  
  console.log('\n✅ 所有测试完成！');
}

// 导出测试函数供其他模块使用
export { 
  testBasicCacheFunctionality, 
  testRBACServiceCache, 
  runAllTests 
};

// 如果直接运行此文件，则执行测试
if (typeof window !== 'undefined' && window.location && window.location.pathname.includes('cacheTest')) {
  runAllTests();
}

export default {
  testBasicCacheFunctionality,
  testRBACServiceCache,
  runAllTests
};
/**
 * 缓存功能验证文件
 * 用于验证缓存管理器在各种场景下的功能是否正常
 */

import cacheManager from './cacheManager';
import RBACService from '@/components/service/RBACService';

// 验证缓存基本功能
async function validateBasicCacheFunctionality() {
  console.log('🧪 开始验证缓存基本功能...');

  try {
    // 测试设置和获取
    const testKey = 'validation_test_key';
    const testValue = { id: 1, name: 'Validation Test Data', timestamp: Date.now() };

    // 设置缓存
    cacheManager.set(testKey, testValue, 5000); // 5秒过期

    // 获取缓存
    const retrievedValue = cacheManager.get(testKey);
    const getValueSuccess = JSON.stringify(retrievedValue) === JSON.stringify(testValue);
    console.log('✅ 设置和获取验证:', getValueSuccess);

    if (!getValueSuccess) {
      console.error('❌ 设置和获取验证失败');
      return false;
    }

    // 测试删除
    cacheManager.delete(testKey);
    const deletedValue = cacheManager.get(testKey);
    const deleteSuccess = deletedValue === null;
    console.log('✅ 删除验证:', deleteSuccess);

    if (!deleteSuccess) {
      console.error('❌ 删除验证失败');
      return false;
    }

    // 测试统计信息
    const stats = cacheManager.getStats();
    console.log('📊 缓存统计:', stats);

    console.log('✅ 缓存基本功能验证通过\n');
    return true;
  } catch (error) {
    console.error('❌ 缓存基本功能验证失败:', error);
    return false;
  }
}

// 验证RBAC服务缓存功能
async function validateRBACServiceCache() {
  console.log('🧪 开始验证RBAC服务缓存功能...');

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
    const resultsMatch = JSON.stringify(result1) === JSON.stringify(result2);
    console.log('✅ 结果一致性验证:', resultsMatch);

    if (!resultsMatch) {
      console.error('❌ 结果一致性验证失败');
      return false;
    }

    // 验证第二次调用更快（理论上应该快很多）
    const performanceImproved = (endTime1 - startTime1) >= (endTime2 - startTime2);
    console.log('⚡ 性能提升验证:', performanceImproved);

    if (!performanceImproved) {
      console.warn('⚠️  性能提升验证未通过，这可能是由于网络很快或第一次调用已缓存');
    }

    // 测试清除缓存后重新获取
    console.log('🔄 清除缓存后重新获取...');
    RBACService.clearCache();
    const startTime3 = Date.now();
    const result3 = await RBACService.getTenants({ page: 1, size: 10 });
    const endTime3 = Date.now();
    console.log(`⏱️  清除缓存后调用耗时: ${endTime3 - startTime3}ms`);

    // 验证清除缓存后结果仍然一致
    const resultsMatchAfterClear = JSON.stringify(result1) === JSON.stringify(result3);
    console.log('✅ 清除缓存后结果一致性验证:', resultsMatchAfterClear);

    if (!resultsMatchAfterClear) {
      console.error('❌ 清除缓存后结果一致性验证失败');
      return false;
    }

    // 检查缓存统计
    const stats = RBACService.getCacheStats();
    console.log('📊 RBAC服务缓存统计:', stats);

    console.log('✅ RBAC服务缓存功能验证通过\n');
    return true;
  } catch (error) {
    console.error('❌ RBAC服务缓存验证失败:', error);
    return false;
  }
}

// 验证登出时缓存清理功能
async function validateLogoutCacheClear() {
  console.log('🧪 开始验证登出时缓存清理功能...');

  try {
    // 先获取一些数据以填充缓存
    await RBACService.getTenants({ page: 1, size: 5 });
    await RBACService.getRoles({ page: 1, size: 5 });

    // 检查当前缓存状态
    const statsBeforeClear = RBACService.getCacheStats();
    console.log('📊 登出前缓存统计:', statsBeforeClear);

    // 模拟登出操作（调用clearCache）
    RBACService.clearCache();

    // 检查登出后缓存状态
    const statsAfterClear = RBACService.getCacheStats();
    console.log('📊 登出后缓存统计:', statsAfterClear);

    // 验证缓存是否被清空
    const cacheCleared = statsAfterClear.memoryCacheSize === 0 && statsAfterClear.sessionStorageKeysCount === 0;
    console.log('✅ 登出缓存清理验证:', cacheCleared);

    if (!cacheCleared) {
      console.error('❌ 登出缓存清理验证失败');
      return false;
    }

    console.log('✅ 登出时缓存清理功能验证通过\n');
    return true;
  } catch (error) {
    console.error('❌ 登出时缓存清理验证失败:', error);
    return false;
  }
}

// 运行所有验证
async function runAllValidations() {
  console.log('🚀 开始运行缓存功能验证...\n');

  const results = [];

  results.push(await validateBasicCacheFunctionality());
  results.push(await validateRBACServiceCache());
  results.push(await validateLogoutCacheClear());

  const allPassed = results.every(result => result === true);
  
  if (allPassed) {
    console.log('🎉 所有缓存功能验证通过！');
  } else {
    console.log('❌ 部分缓存功能验证未通过');
  }

  return allPassed;
}

// 导出验证函数供其他模块使用
export {
  validateBasicCacheFunctionality,
  validateRBACServiceCache,
  validateLogoutCacheClear,
  runAllValidations
};

export default {
  validateBasicCacheFunctionality,
  validateRBACServiceCache,
  validateLogoutCacheClear,
  runAllValidations
};
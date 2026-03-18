# RBAC 集成测试 - 测试数据管理指南

## ⚠️ 重要原则

**验证修改可以，但是不能不改回去！**

所有集成测试必须遵守以下原则：
1. **测试数据必须使用唯一标识**（如时间戳）
2. **测试结束后必须清理所有创建的数据**
3. **如果测试失败，必须手动清理后端数据**

## 测试数据标识规范

### ✅ 正确做法

```typescript
// 使用时间戳生成唯一标识
const TEST_PREFIX = 'TEST_INTEGRATION';
const TEST_PERM_CODE = `${TEST_PREFIX}_${Date.now().toString(16).toUpperCase()}`;

// 创建测试数据时使用
const createData = {
  permission_name: `集成测试权限 ${TEST_PERM_CODE}`,  // 唯一名称
  permission_code: `TEST:${TEST_PERM_CODE}`,          // 唯一编码
};
```

### ❌ 错误做法

```typescript
// ❌ 使用固定 ID（可能覆盖真实数据）
parent_id: 0,  // 0 可能是真实后端数据的 ID

// ❌ 使用固定名称（可能与真实数据冲突）
permission_name: 'Updated Permission 0',
permission_code: 'common',  // 这看起来像是真实的权限码！
```

## 清理机制

### 1. 自动清理（afterAll）

```typescript
afterAll(async () => {
  if (createdPermissionId) {
    try {
      await PermissionService.deletePermissionNode(createdPermissionId, true);
      console.log('✓ 清理测试数据完成，ID:', createdPermissionId);
      createdPermissionId = null;
    } catch (error) {
      console.error('✗ 清理测试数据失败！请手动删除测试数据，ID:', createdPermissionId);
      console.error('  删除命令参考: DELETE FROM permissions WHERE id =', createdPermissionId);
      throw error;  // 让测试失败，提醒开发者手动清理
    }
  }
});
```

### 2. 手动清理（测试失败时）

如果集成测试失败或被中断，请手动执行以下 SQL：

```sql
-- 查找测试数据
SELECT * FROM permissions
WHERE permission_code LIKE 'TEST:%'
   OR permission_name LIKE '%集成测试%'
   OR permission_name LIKE '%TEST_%';

-- 删除测试数据
DELETE FROM permissions
WHERE permission_code LIKE 'TEST:%'
   OR permission_name LIKE '%集成测试%'
   OR permission_name LIKE '%TEST_%';
```

## 单元测试 vs 集成测试

### 单元测试（Mock 数据）

- 使用 Mock 数据，不应该调用真实后端
- Mock 数据必须使用清晰的测试标识
- **示例**：`TEST_MOCK_Folder_001`（不是 `Updated Permission 0`）

### 集成测试（真实后端）

- 直接调用真实后端 API
- 必须创建和清理测试数据
- 测试标识必须唯一（时间戳）

## 检查清单

在提交集成测试代码前，请检查：

- [ ] 测试数据使用唯一标识（时间戳或随机数）
- [ ] `afterAll` 中有清理逻辑
- [ ] 清理失败时抛出错误（提醒开发者手动清理）
- [ ] Mock 数据不使用真实后端的 ID（如 0）
- [ ] Mock 数据使用清晰的测试前缀（如 `TEST_MOCK_`）

## 已知问题

### 问题：ID 为 0 的权限节点被修改

**原因**：集成测试使用了 `parent_id: 0`，这是真实后端存在的权限节点。

**解决方案**：
1. 先创建一个测试用的父节点
2. 使用新创建的父节点 ID，而不是 0

```typescript
// ✅ 正确做法：先创建父节点
const parentResponse = await PermissionService.createPermissionNode({
  permission_name: `TEST_PARENT_${Date.now()}`,
  permission_code: `TEST:PARENT:${Date.now()}`,
  permission_type: 'folder',
  parent_id: null,
});

const childResponse = await PermissionService.createPermissionNode({
  permission_name: `TEST_CHILD_${Date.now()}`,
  permission_code: `TEST:CHILD:${Date.now()}`,
  permission_type: 'menu',
  parent_id: parentResponse.id,  // 使用测试父节点
});

// 清理时先删除子节点，再删除父节点
await PermissionService.deletePermissionNode(childResponse.id, true);
await PermissionService.deletePermissionNode(parentResponse.id, true);
```

## 参考文档

- [测试开发规范](../../.claude/rules/testing-guide.md)
- [Vitest 配置](../../vitest.config.ts)

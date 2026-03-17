# 测试用永久 Token 说明

## Token 来源

Token 来自后端文档：`/smart_engine/docs/rbac/账号.md`

这些 Token 是**永久有效**的，可以在测试和开发中直接使用。

## Token 列表

### 1. 超管账号 Token

**Token:** 
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOiJzeXNfdXNlcjp0aF8wIiwicm5TdHIiOiIzYzVkNTJkNGQ1Y2QzMTc5NTNmNWY5ZDRiNDg1YWJmNCIsImNsaWVudGlkIjoiMDJiYjljZmU4ZDc4NDRlY2FlOGRiZTYyYjFiYTk3MWEiLCJ0ZW5hbnRJZCI6IjAiLCJ1c2VySWQiOiJ0aF8wIiwidXNlck5hbWUiOiJzdXBlcmFkbWluIiwiZGVwdElkIjowLCJkZXB0TmFtZSI6IkRlcHQtMCIsImRlcHRDYXRlZ29yeSI6IiIsInJvbGVzIjpbIlJPTEVfQUxMIl0sInBlcm1pc3Npb25zIjpbXX0.TPsywlO7heqb9dsdvBG7r_5jKpTkGvPJiqwSYtsgVCA
```

**账号信息:**
- 用户名：`superadmin`
- 密码：`password`
- 租户 ID：`0`
- 角色：`ROLE_ALL`（所有权限）
- 权限：拥有系统所有权限

**适用场景:**
- 需要管理员权限的测试
- 系统管理功能测试
- 权限配置测试

### 2. 普通用户 Token

**Token:** 
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOiJzeXNfdXNlcjoxOTgyNzE0MTA5NjgwNDk2NjQxIiwicm5TdHIiOiJ0TVo1YjBUZnFvdlVBVkNvcHVqUWdOM0xpRTBRcnQ3MSIsImNsaWVudGlkIjoiMDJiYjljZmU4ZDc4NDRlY2FlOGRiZTYyYjFiYTk3MWEiLCJ0ZW5hbnRJZCI6IjAwMDAwMCIsInVzZXJJZCI6MTk4MjcxNDEwOTY4MDQ5NjY0MSwidXNlck5hbWUiOiJ6dHNNYW5hZ2VyIiwiZGVwdElkIjoxOTgyNzEzNjYzNDE5MTMzOTUzLCJkZXB0TmFtZSI6IiIsImRlcHRDYXRlZ29yeSI6IiJ9.3sVts7xt7-kbKZQ-1z37qqjuwGlAlBm8ugnUvs6CHfE
```

**账号信息:**
- 用户名：`ztsManager`
- 密码：`password`
- 租户 ID：`000000`

**适用场景:**
- 普通用户权限测试
- 权限限制测试
- 业务功能测试

## 在测试中使用

### Playwright E2E 测试

```typescript
import { test, expect } from '@playwright/test';

test.describe('使用永久 Token 的测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置超管 Token
    await page.addInitScript(() => {
      localStorage.setItem(
        'Admin-Token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      );
    });
  });

  test('访问系统管理页面', async ({ page }) => {
    await page.goto('/#/systemManage/userManagement');
    // ... 测试代码
  });
});
```

### 单元测试

```typescript
import { TEST_TOKENS } from '@/../tests/test-tokens';

// 在测试前设置 Token
localStorage.setItem('Admin-Token', TEST_TOKENS.ADMIN);

// 执行需要认证的测试
```

### 手动测试

在浏览器控制台中执行：

```javascript
// 设置超管 Token
localStorage.setItem('Admin-Token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
location.reload();

// 设置普通用户 Token
localStorage.setItem('Admin-Token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...');
location.reload();
```

## 注意事项

1. **Token 有效期**: 这些 Token 是永久有效的，但如果后端重置了密钥或修改了配置，可能需要更新 Token

2. **权限范围**: 
   - 超管 Token 拥有所有权限，适合测试管理功能
   - 普通用户 Token 权限有限，适合测试权限控制

3. **数据安全**: 
   - 这些 Token 只应用于测试环境
   - 不要在生产环境中使用
   - 不要提交到版本控制系统（已添加到 .gitignore）

4. **Token 刷新**: 如果 Token 失效，请联系后端团队获取新的 Token

## 相关文件

- `tests/test-tokens.ts` - Token 配置文件
- `tests/e2e/token-based-tests.spec.ts` - 使用 Token 的 E2E 测试示例
- `/smart_engine/docs/rbac/账号.md` - Token 来源文档

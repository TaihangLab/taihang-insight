# 系统管理页面单元测试覆盖计划

> 根据后端权限菜单文档，为每个系统管理页面创建完整的单元测试覆盖

## 测试覆盖原则

### 页面级测试（整体用例）
每个页面一个完整测试文件，覆盖：
- ✅ 页面初始化
- ✅ 数据加载和错误处理
- ✅ 搜索/筛选功能
- ✅ 分页逻辑

### 组件级测试（操作覆盖）
每个子组件独立测试：
- ✅ 列表组件（展示、排序、选择）
- ✅ 搜索栏（输入验证、搜索执行）
- ✅ 编辑对话框（表单验证、提交）
- ✅ 删除确认对话框
- ✅ 表格操作按钮

### CRUD 操作测试
- ✅ **Create**: 新增操作
- ✅ **Read**: 查询/详情查看
- ✅ **Update**: 编辑操作
- ✅ **Delete**: 删除操作（单个/批量）

## 测试文件结构

```
tests/unit/pages/system/
├── roleManagement.spec.ts           # 角色管理页面主测试
├── tenantManagement.spec.ts         # 租户管理页面主测试
├── departmentManagement.spec.ts      # 部门管理页面主测试
├── positionManagement.spec.ts       # 岗位管理页面主测试
├── permissionManagement.spec.ts      # 权限管理页面主测试
├── applicationSettings.spec.ts       # 应用设置页面主测试
└── components/
    ├── role/
    │   ├── RoleList.spec.ts
    │   ├── RoleTable.spec.ts
    │   ├── RoleEditDialog.spec.ts
    │   ├── RoleSearchBar.spec.ts
    │   └── RoleTableActions.spec.ts
    ├── tenant/
    │   ├── TenantList.spec.ts
    │   ├── TenantTable.spec.ts
    │   ├── TenantEditForm.spec.ts
    │   ├── TenantSearchBar.spec.ts
    │   └── TenantTableActions.spec.ts
    ├── department/
    │   ├── DepartmentList.spec.ts
    │   ├── DepartmentTreeTable.spec.ts
    │   ├── DepartmentEditDialog.spec.ts
    │   ├── DepartmentSearchBar.spec.ts
    │   └── DepartmentTableActions.spec.ts
    ├── position/
    │   ├── PositionList.spec.ts
    │   ├── PositionTable.spec.ts
    │   ├── PositionEditDialog.spec.ts
    │   ├── PositionSearchBar.spec.ts
    │   ├── ExportDialog.spec.ts
    │   └── PositionTableActions.spec.ts
    └── permission/
        ├── PermissionTreePanel.spec.ts
        ├── PermissionTreeTable.spec.ts
        ├── PermissionEditDialog.spec.ts
        ├── PermissionTreeToolbar.spec.ts
        └── PermissionTableActions.spec.ts
```

## 测试模板

### 页面主测试模板

```typescript
/**
 * [页面名称]页面单元测试
 *
 * 测试原则：
 * - 只测试核心逻辑，不测试 Vue 组件渲染
 * - 组件交互由 E2E 测试覆盖
 * - @see .claude/rules/testing-guide.md
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('[页面名称]页面 - 核心逻辑测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('页面初始化', () => {
    it('应该正确初始化搜索条件');
    it('应该正确初始化分页参数');
  });

  describe('搜索逻辑', () => {
    it('应该正确构建搜索参数');
    it('应该正确处理空搜索条件');
    it('应该正确处理重置操作');
  });

  describe('分页逻辑', () => {
    it('应该正确计算 skip 值');
    it('应该正确处理页码变化');
    it('应该正确处理每页数量变化');
  });

  describe('数据加载', () => {
    it('加载成功时应该正确更新数据');
    it('加载失败时应该正确处理错误');
  });

  describe('CRUD 操作', () => {
    it('新增操作应该正确构建请求参数');
    it('编辑操作应该正确构建请求参数');
    it('删除操作应该正确构建请求URL');
    it('批量删除应该正确处理选中项');
  });

  describe('表单验证', () => {
    it('应该正确验证必填字段');
    it('应该正确验证字段格式');
    it('应该正确显示验证错误');
  });
});
```

## 测试优先级

### P0 - 核心页面（已有部分测试）
1. ✅ 用户管理 (userManagement) - 已有测试，需增强
2. 🔲 角色管理 (roleManagement) - 新建
3. 🔲 租户管理 (tenantManagement) - 新建

### P1 - 重要页面
4. 🔲 部门管理 (departmentManagement) - 新建
5. 🔲 权限管理 (permissionManagement) - 新建
6. 🔲 岗位管理 (positionManagement) - 新建

### P2 - 辅助页面
7. 🔲 应用设置 (applicationSettings) - 新建
8. 🔲 知识库 (knowledgeBase) - 新建

## 测试数据

使用测试数据工厂模式，定义在 `tests/unit/fixtures/` 目录：

```typescript
// tests/unit/fixtures/systemData.ts
export const testUsers = [
  { id: 1000000000000001, user_name: 'admin', ... },
  { id: 1000000000000002, user_name: 'user1', ... },
];

export const testRoles = [
  { id: 1, role_name: '管理员', role_code: 'admin', ... },
  { id: 2, role_name: '操作员', role_code: 'operator', ... },
];
```

## Mock 服务

使用 `vi.mock` 模拟 API 调用：

```typescript
vi.mock('@/api/system/userService', () => ({
  default: {
    getUsers: vi.fn(() => Promise.resolve({ data: [], total: 0 })),
    createUser: vi.fn(() => Promise.resolve({ data: testUsers[0] })),
    updateUser: vi.fn(() => Promise.resolve({ data: testUsers[0] })),
    deleteUser: vi.fn(() => Promise.resolve()),
  },
}));
```

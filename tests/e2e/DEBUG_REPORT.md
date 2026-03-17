# 租户管理 E2E 测试失败问题分析报告

## 🔍 问题总结

经过深入调试，发现了以下问题链：

### 1. 主要问题：认证失败导致无法登录

**现象**：
- E2E 测试中表格一直显示 0 行
- 导航到租户管理页面后被重定向回登录页
- URL 显示：`/login?redirect=/systemManage/tenantManagement`

**根本原因**：
1. **前端登录 API 端点路径错误**：
   - 前端代码：`/api/v1/login`
   - 后端实际端点：`/api/v1/auth/login`

2. **后端认证豁免路径配置错误**：
   - `app/core/auth_center.py` 中的 `public_paths` 只包含 `/api/v1/login`
   - 实际登录端点是 `/api/v1/auth/login`，不在豁免列表中
   - 导致登录端点需要 Authorization 头，造成 401 错误

### 2. 次要问题：前后端字段格式

**发现**：
- 前端已完全使用 snake_case 字段（如 `tenant_name`, `company_name`）
- 后端返回的也是 snake_case 格式
- **字段映射没有问题**

## ✅ 已修复的问题

### 1. 前端登录 API 端点路径
**文件**：`src/api/auth/authAPI.ts`
```typescript
// 修改前
async login(params: LoginRequest): Promise<LoginResponse> {
  return unAuthAxios.post("/api/v1/login", params);
}

// 修改后
async login(params: LoginRequest): Promise<LoginResponse> {
  return unAuthAxios.post("/api/v1/auth/login", params);
}
```

### 2. 后端认证豁免路径
**文件**：`/Users/ray/IdeaProjects/taihang/smart_engine/app/core/auth_center.py`
```python
# 修改前
public_paths = [
    "/health",
    "/docs",
    "/openapi.json",
    "/api/v1/login",
]

# 修改后
public_paths = [
    "/health",
    "/docs",
    "/openapi.json",
    "/api/v1/login",
    "/api/v1/auth/login",  # 添加实际的登录端点路径
]
```

## 🔄 需要执行的操作

### 1. 重启后端服务
后端服务器需要重启以加载认证豁免路径的修改：

```bash
# 停止当前的后端服务
# 然后重新启动
cd /Users/ray/IdeaProjects/taihang/smart_engine
# 重启后端服务
```

### 2. 运行 E2E 测试
后端重启后，运行 E2E 测试验证修复：

```bash
cd /Users/ray/IdeaProjects/taihang/taihang-insight
npx playwright test tests/e2e/tenant-management.spec.ts
```

## 📝 调试文件说明

创建的调试测试文件可以删除：

- `tests/e2e/debug-*.spec.ts` - 各种调试测试文件
- `tests/e2e/simple-debug.spec.ts`
- `tests/e2e/bypass-devtools.spec.ts`
- `tests/e2e/fixed-debug.spec.ts`
- `tests/e2e/verify-create.spec.ts`
- `tests/e2e/whitescreen-debug.spec.ts`

保留的有用文件：
- `tests/e2e/tenant-management.spec.ts` - 主要的租户管理 E2E 测试
- `tests/e2e/pages/LoginPage.ts` - 登录页面对象
- `tests/e2e/pages/TenantManagementPage.ts` - 租户管理页面对象

## 🎯 字段映射结论

**重要结论**：前后端字段映射没有问题！

- 前端代码已全部使用 snake_case 格式
- 后端返回的也是 snake_case 格式
- TenantTable.vue 使用 `prop="tenant_name"` 等正确绑定
- **不需要修改字段映射代码**

## 📊 问题时间线

1. 测试失败 → 表格显示 0 行
2. 检查前端代码 → 字段绑定正确（snake_case）
3. 检查 API 响应 → 后端返回 snake_case 格式（正确）
4. 发现登录未成功 → 被重定向到登录页
5. 检查登录 API → 端点路径不匹配
6. 修复前端登录端点路径
7. 发现登录仍 401 → 后端认证中间件配置错误
8. 修复后端认证豁免路径
9. 需要重启后端服务验证

## 🔧 代码修改汇总

### 前端修改
1. `src/api/auth/authAPI.ts` - 修复登录端点路径

### 后端修改
1. `app/core/auth_center.py` - 添加 `/api/v1/auth/login` 到认证豁免路径

---

**创建时间**：2026-03-17
**状态**：等待后端重启验证

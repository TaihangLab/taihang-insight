# localStorage 统一管理迁移指南

## 概述

项目已将所有分散的 localStorage 操作收敛到 Pinia Store 中，提供统一的类型安全接口。

## 重要变更：用户态同步初始化

**【关键】**用户态数据是强诉求，必须在应用挂载前完成初始化。

### 初始化策略变更

**旧策略（已废弃）**：使用 `queueMicrotask` 后台异步初始化
```javascript
// ❌ 已废弃
app.mount('#app')
queueMicrotask(async () => {
  await userStore.initFromCache()
})
```

**新策略（当前）**：在应用挂载前同步完成初始化
```javascript
// ✅ 当前策略
// 1. 从 localStorage 检查持久化状态
const persistedAuth = localStorage.getItem('taihang-auth')
if (persistedAuth) {
  const authData = JSON.parse(persistedAuth)

  // 2. 如果数据不完整，同步等待恢复完成
  if (authData.token && (!authData.userInfo || !authData.permissions?.length)) {
    await userStore.initFromCache({ force: true })
  }
}

// 3. 挂载应用（此时用户态数据已完整）
app.mount('#app')
```

### 变更原因

1. **用户态是强诉求**：用户信息、权限、菜单等数据必须在页面渲染前完整加载
2. **避免闪烁**：防止因数据延迟加载导致的菜单/权限闪烁
3. **路由守卫依赖**：路由守卫需要完整的用户态数据来判断权限
4. **组件安全访问**：确保组件挂载时可以安全访问用户态数据

### 数据完整性检查

系统会检查以下数据是否完整：
- `token` - 认证令牌
- `userInfo` - 用户基本信息
- `permissions` - 权限列表（必须是非空数组）
- `menuTree` - 菜单树（必须是非空数组）

如果数据不完整，会自动从后端同步恢复。

---

## 新增模块

### 1. `storage.ts` - 存储 API 工具模块

位置：`src/stores/modules/storage.ts`

提供所有 localStorage 键名的集中定义和类型安全的操作接口。

#### StorageKey 枚举

```typescript
export enum StorageKey {
  // 认证相关（自动由 pinia-plugin-persistedstate 管理）
  AUTH = 'taihang-auth',

  // 旧系统兼容
  WVP_TOKEN = 'wvp-token',
  WVP_USER = 'wvp-user',
  ADMIN_TOKEN = 'Admin-Token',
  TOKEN = 'token',

  // 用户偏好设置
  SELECTED_TENANT = 'selectedTenant',
  CURRENT_USER_NAME = 'currentUserName',

  // 临时数据
  EDIT_SKILL_INFO = 'editSkillInfo',
  TEMP_SKILL_INFO = 'tempSkillInfo',

  // 业务数据
  INTELLIGENT_REVIEW_RECORDS = 'intelligentReviewRecords',
  RESTORED_WARNINGS = 'restoredWarnings',
}
```

#### storage 静态接口

```typescript
import { storage } from '@/stores'

// 基础操作
storage.getString(StorageKey.SELECTED_TENANT)
storage.setString(StorageKey.SELECTED_TENANT, 'tenant-1')
storage.getJSON<any>(StorageKey.WVP_USER)
storage.setJSON(StorageKey.WVP_USER, userData)
storage.remove(StorageKey.TEMP_SKILL_INFO)
storage.has(StorageKey.TOKEN)
storage.clear()
storage.removeMultiple(StorageKey.EDIT_SKILL_INFO, StorageKey.TEMP_SKILL_INFO)

// 快捷访问方法
storage.getWvpToken()
storage.setWvpToken('token-xxx')
storage.getCurrentUserName()
storage.setCurrentUserName('张工程师')
// ... 更多快捷方法
```

### 2. `temp.ts` - 临时数据 Store

位置：`src/stores/modules/temp.ts`

用于管理跨页面传递的临时数据。

```typescript
import { useTempStore } from '@/stores'

const tempStore = useTempStore()

// 技能编辑
tempStore.setEditSkillInfo({ name: '技能名称', ... })
const editInfo = tempStore.getEditSkillInfo()
tempStore.clearEditSkillInfo()

// 临时技能
tempStore.setTempSkillInfo({ ... })
const tempInfo = tempStore.getTempSkillInfo()
tempStore.clearTempSkillInfo()

// 清除所有临时数据
tempStore.clearAllTempData()
```

### 3. `review.ts` - 智能复判 Store

位置：`src/stores/modules/review.ts`

用于管理智能复判记录和预警还原记录。

```typescript
import { useReviewStore } from '@/stores'

const reviewStore = useReviewStore()

// 加载数据
reviewStore.loadAll()
reviewStore.loadRecords()
reviewStore.loadRestoredWarnings()

// 操作记录
reviewStore.addRecord({ warningId: 'xxx', operator: '张工程师', ... })
reviewStore.setRecords([...])
reviewStore.clearRecords()

// 操作还原预警
reviewStore.addRestoredWarning({ type: '安全违规', ... })
reviewStore.setRestoredWarningsList([...])
reviewStore.clearRestoredWarnings()

// 清空所有
reviewStore.clearAll()

// 计算属性
reviewStore.recordCount
reviewStore.restoredCount
```

### 4. `user.ts` 扩展

用户 Store 新增旧系统兼容方法：

```typescript
import { useUserStore } from '@/stores'

const userStore = useUserStore()

// 旧系统兼容
userStore.getWvpToken()
userStore.getAdminToken()
userStore.getCurrentUserName()
userStore.setCurrentUserName('李主管')
userStore.getSelectedTenant()
userStore.setSelectedTenant('tenant-1')
```

## 迁移对照表

### 技能编辑相关

| 旧代码 | 新代码 |
|--------|--------|
| `localStorage.getItem('editSkillInfo')` | `useTempStore().getEditSkillInfo()` 或 `storage.getEditSkillInfo()` |
| `localStorage.setItem('editSkillInfo', JSON.stringify(data))` | `useTempStore().setEditSkillInfo(data)` 或 `storage.setEditSkillInfo(data)` |
| `localStorage.removeItem('editSkillInfo')` | `useTempStore().clearEditSkillInfo()` 或 `storage.remove(StorageKey.EDIT_SKILL_INFO)` |
| `localStorage.getItem('tempSkillInfo')` | `useTempStore().getTempSkillInfo()` |
| `localStorage.setItem('tempSkillInfo', JSON.stringify(data))` | `useTempStore().setTempSkillInfo(data)` |

### 用户昵称相关

| 旧代码 | 新代码 |
|--------|--------|
| `localStorage.getItem('currentUserName')` | `useUserStore().getCurrentUserName()` 或 `storage.getCurrentUserName()` |
| `localStorage.setItem('currentUserName', name)` | `useUserStore().setCurrentUserName(name)` 或 `storage.setCurrentUserName(name)` |

### 智能复判记录相关

| 旧代码 | 新代码 |
|--------|--------|
| `JSON.parse(localStorage.getItem('intelligentReviewRecords') || '[]')` | `useReviewStore().records` 或 `storage.getIntelligentReviewRecords()` |
| `localStorage.setItem('intelligentReviewRecords', JSON.stringify(records))` | `useReviewStore().setRecords(records)` 或 `storage.setIntelligentReviewRecords(records)` |
| 手动 unshift 和限制数量 | `useReviewStore().addRecord(record)` |

### 预警还原相关

| 旧代码 | 新代码 |
|--------|--------|
| `JSON.parse(localStorage.getItem('restoredWarnings') || '[]')` | `useReviewStore().restoredWarnings` 或 `storage.getRestoredWarnings()` |
| 手动 push 并添加 restoredAt | `useReviewStore().addRestoredWarning(warning)` |

### 旧系统 Token 相关

| 旧代码 | 新代码 |
|--------|--------|
| `localStorage.getItem('wvp-token')` | `useUserStore().getWvpToken()` 或 `storage.getWvpToken()` |
| `localStorage.setItem('wvp-token', token)` | `storage.setWvpToken(token)` (在 userStore.setToken 中自动同步) |
| `localStorage.getItem('Admin-Token')` | `useUserStore().getAdminToken()` 或 `storage.getAdminToken()` |

### 租户相关

| 旧代码 | 新代码 |
|--------|--------|
| `localStorage.getItem('selectedTenant')` | `useUserStore().getSelectedTenant()` 或 `storage.getSelectedTenant()` |
| `localStorage.setItem('selectedTenant', tenant)` | `useUserStore().setSelectedTenant(tenant)` 或 `storage.setSelectedTenant(tenant)` |

## 迁移步骤

### 第一步：搜索并替换

搜索项目中所有直接使用 `localStorage` 的地方：

```bash
# 搜索 localStorage 的使用
grep -r "localStorage" src/ --exclude-dir=node_modules
```

### 第二步：根据场景选择替换方式

1. **如果是在 Vue 组件中**：
   - 优先使用对应的 Pinia Store (`useUserStore`, `useTempStore`, `useReviewStore`)
   - 这样可以利用响应式特性

2. **如果是在非 Vue 模块中**（如 API、工具函数）：
   - 使用 `storage` 静态接口

3. **如果是在 axios 拦截器中**：
   - 继续使用 `storage` 静态接口（因为此时 Pinia 可能未初始化）

### 第三步：示例迁移

#### 示例 1：获取当前用户昵称

**旧代码**：
```javascript
getCurrentUserName() {
  const savedUserName = localStorage.getItem('currentUserName')
  if (savedUserName) {
    return savedUserName
  } else {
    const randomName = userNames[Math.floor(Math.random() * userNames.length)]
    localStorage.setItem('currentUserName', randomName)
    return randomName
  }
}
```

**新代码**：
```typescript
import { useUserStore } from '@/stores'

function getCurrentUserName(): string {
  const userStore = useUserStore()
  let name = userStore.getCurrentUserName()

  if (!name) {
    const userNames = ['张工程师', '李主管', '王安全员', '赵技术员', '陈操作员']
    name = userNames[Math.floor(Math.random() * userNames.length)]
    userStore.setCurrentUserName(name)
  }

  return name
}
```

#### 示例 2：添加智能复判记录

**旧代码**：
```javascript
let reviewRecords = JSON.parse(localStorage.getItem('intelligentReviewRecords') || '[]')
reviewRecords.unshift(reviewRecord)

if (reviewRecords.length > 1000) {
  reviewRecords = reviewRecords.slice(0, 1000)
}

localStorage.setItem('intelligentReviewRecords', JSON.stringify(reviewRecords))
```

**新代码**：
```typescript
import { useReviewStore } from '@/stores'

const reviewStore = useReviewStore()
reviewStore.addRecord(reviewRecord) // 自动限制数量
```

## 注意事项

1. **不再使用魔数**：所有 localStorage 键名必须使用 `StorageKey` 枚举或 storage 的快捷方法

2. **类型安全**：使用 `storage.getJSON<T>()` 可以获得类型提示

3. **Pinia 持久化**：`user` store 的认证数据由 `pinia-plugin-persistedstate` 自动管理，无需手动操作

4. **向后兼容**：旧的 WVP 系统的 token 仍然会被同步存储，确保兼容性

5. **清理旧代码**：迁移完成后，可以移除 `src/components/service/UserService.ts` 中的旧实现

## 需要迁移的文件列表

基于当前项目扫描，需要迁移的文件包括：

### 组件文件
- `src/components/visionAI/monitoringWarning/realTimeMonitoring.vue`
- `src/components/visionAI/monitoringWarning/warningDetail.vue`
- `src/components/visionAI/monitoringWarning/warningManagement.vue`
- `src/components/visionAI/skillManagement/LlmSkillCreateDialogDetail.vue`
- `src/components/visionAI/skillManagement/LlmSkillCreateDialog.vue`
- `src/components/visionAI/skillManagement/multimodalLlmSkills.vue`
- `src/components/visionAI/monitoringWarning/warningArchives.vue`

### 页面文件
- `src/pages/commons/Login.vue`
- `src/pages/system/components/user/UserAssignmentPage.vue`

### 其他文件
- `src/api/auth/authAPI.ts` (axios 拦截器，继续使用 storage)
- `src/services/config/axios.ts` (axios 拦截器，继续使用 storage)
- `src/api/center/chatAssistant.ts` (使用 storage)
- `src/services/chat.service.ts` (使用 storage)
- `src/components/service/UserService.ts` (可以考虑移除或改为使用 storage)

## 快速参考

```typescript
// 导入
import { storage, StorageKey, useUserStore, useTempStore, useReviewStore } from '@/stores'

// 用户相关
const userStore = useUserStore()
userStore.setCurrentUserName('张工程师')
userStore.getSelectedTenant()
userStore.getWvpToken()

// 临时数据
const tempStore = useTempStore()
tempStore.setEditSkillInfo({ name: '技能A' })

// 复判记录
const reviewStore = useReviewStore()
reviewStore.addRecord({ warningId: 'xxx', operator: '张工程师' })
reviewStore.records // 响应式访问

// 直接使用 storage
storage.setString(StorageKey.SELECTED_TENANT, 'tenant-1')
const tenant = storage.getString(StorageKey.SELECTED_TENANT)
```

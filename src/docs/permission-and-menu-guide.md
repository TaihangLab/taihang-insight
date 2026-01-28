# 动态菜单和权限控制使用指南

## 概述

项目已实现基于后端返回的动态菜单和权限控制系统。主要功能包括：

1. **三个独立认证接口**：用户信息、权限码、菜单树
2. **localStorage 缓存机制**：提升性能，减少网络请求
3. **动态菜单渲染**：根据用户权限动态显示菜单
4. **权限指令**：`v-permission` 控制按钮显示/隐藏

---

## API 接口说明

### 1. 用户基本信息
```
GET /api/v1/auth/info
```

**响应数据**：
```typescript
{
  success: true,
  data: {
    user_id: 1,
    user_name: "admin",
    nick_name: "管理员",
    email: "admin@example.com",
    phone: "13800138000",
    avatar: "",
    tenant_id: 1,
    dept_id: 1,
    status: 0
  }
}
```

### 2. 权限码列表
```
GET /api/v1/auth/permissions
```

**响应数据**：
```typescript
{
  success: true,
  data: {
    permissions: [
      "user:create",
      "user:edit",
      "user:delete",
      "user:view",
      "role:create",
      "role:edit",
      // ...
    ],
    total: 50
  }
}
```

### 3. 菜单树
```
GET /api/v1/auth/menu
```

**响应数据**：
```typescript
{
  success: true,
  data: [
    {
      id: 1,
      parent_id: null,
      menu_name: "系统管理",
      menu_type: "folder",
      menu_code: "system",
      icon: "Setting",
      sort_order: 1,
      status: 0,
      children: [
        {
          id: 11,
          parent_id: 1,
          menu_name: "用户管理",
          menu_type: "menu",
          menu_code: "system:user",
          path: "/systemManage/userManagement",
          component: "@/pages/system/userManagement.vue",
          icon: "User",
          sort_order: 1,
          visible: true,
          status: 0
        }
      ]
    }
  ]
}
```

---

## localStorage 缓存机制

### 缓存键名
- `auth_user_info` - 用户基本信息
- `auth_permissions` - 权限码列表
- `auth_menu` - 菜单树
- `auth_cache_timestamp` - 缓存时间戳
- `token` - 登录令牌

### 缓存过期时间
- 用户信息：30分钟
- 权限码：30分钟
- 菜单树：60分钟

### 使用方式

```typescript
import { useUserStore } from '@/stores/modules/user'

const userStore = useUserStore()

// 登录后批量获取所有认证信息
await userStore.fetchAllAuthInfo(true) // true = 强制刷新

// 单独刷新用户信息
await userStore.fetchUserInfo(true)

// 单独刷新权限码
await userStore.fetchPermissions(true)

// 单独刷新菜单树
await userStore.fetchMenuTree(true)
```

---

## 权限指令使用

### 基本用法

```vue
<template>
  <!-- 单个权限码 -->
  <el-button v-permission="'user:create'">创建用户</el-button>

  <!-- 多个权限码（满足其一即可） -->
  <el-button v-permission="['user:edit', 'user:update']">编辑</el-button>

  <!-- 无权限时不显示按钮 -->
  <el-button v-permission="'user:delete'" type="danger">删除</el-button>
</template>
```

### 在表格操作列中使用

```vue
<template>
  <el-table-column label="操作" width="200">
    <template #default="{ row }">
      <el-button
        size="small"
        v-permission="'user:edit'"
        @click="handleEdit(row)">
        编辑
      </el-button>
      <el-button
        size="small"
        type="danger"
        v-permission="'user:delete'"
        @click="handleDelete(row)">
        删除
      </el-button>
    </template>
  </el-table-column>
</template>
```

### 权限检查

```typescript
import { useUserStore } from '@/stores/modules/user'

const userStore = useUserStore()

// 检查单个权限
if (userStore.hasPermission('user:create')) {
  // 有创建用户权限
}

// 权限列表
console.log(userStore.permissions.value)
```

---

## 动态菜单使用

### 切换到动态菜单

在 `src/layout/index.vue` 中将 `SideMenu` 替换为 `DynamicMenu`：

```vue
<template>
  <div class="layout-container">
    <!-- 旧：静态菜单 -->
    <!-- <SideMenu @collapseChange="handleCollapseChange" /> -->

    <!-- 新：动态菜单 -->
    <DynamicMenu @collapseChange="handleCollapseChange" />

    <el-scrollbar :native="false" wrap-style="flex: 1;">
      <LayoutHeader />
      <router-view />
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import DynamicMenu from '@/components/common/DynamicMenu.vue'
// ...
</script>
```

### 菜单类型说明

后端返回的 `menu_type` 字段：

| 类型 | 说明 | 在菜单中显示 |
|------|------|-------------|
| `folder` | 文件夹（父级菜单） | ✅ 显示 |
| `menu` | 菜单项（对应页面） | ✅ 显示 |
| `button` | 按钮权限 | ❌ 不显示 |

### 菜单字段说明

```typescript
interface MenuItem {
  id: number | string              // 菜单ID
  parent_id?: number | string      // 父菜单ID
  menu_name: string                // 菜单名称
  menu_type: 'folder' | 'menu' | 'button'  // 菜单类型
  menu_code?: string               // 菜单编码
  path?: string                    // 路由路径（menu类型需要）
  component?: string               // 组件路径（menu类型需要）
  icon?: string                    // 图标名称
  sort_order: number               // 排序号
  visible?: boolean                // 是否可见
  status: number                   // 状态（0=启用，1=停用）
  method?: string                  // 请求方法（button类型需要）
  children?: MenuItem[]            // 子菜单
}
```

---

## 图标映射

### Element Plus 图标

后端返回的 `icon` 字段会映射到 Element Plus 图标：

```typescript
// 后端返回
{ icon: "User" }          // 对应 <User />
{ icon: "Setting" }       // 对应 <Setting />
{ icon: "VideoCamera" }   // 对应 <VideoCamera />
```

### 支持的图标

查看 `src/composables/useDynamicMenu.ts` 中的 `iconMap` 对象：

```typescript
const iconMap = {
  // 监控预警
  'monitoring': 'VideoCamera',
  'realtime': 'View',
  'statistics': 'DataAnalysis',
  'warning': 'Warning',
  'review': 'CircleCheck',

  // 设备配置
  'device': 'Cpu',
  'camera': 'VideoCamera',
  'video': 'VideoPlay',

  // ... 更多图标
}
```

---

## 登录流程

### 完整登录示例

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loginForm = ref({
  username: '',
  password: ''
})

const handleLogin = async () => {
  try {
    // 1. 调用登录接口
    const response = await loginAPI(loginForm.value)

    if (response.success) {
      const { token } = response.data

      // 2. 保存 token
      userStore.setToken(token)

      // 3. 批量获取认证信息（用户信息、权限、菜单）
      await userStore.fetchAllAuthInfo(true)

      // 4. 跳转到首页
      router.push('/visualCenter')

      ElMessage.success('登录成功')
    }
  } catch (error) {
    ElMessage.error('登录失败')
  }
}
</script>
```

---

## 应用初始化

### main.ts 中的初始化流程

```typescript
// 1. 创建 Pinia store
const pinia = createPinia()
app.use(pinia)

// 2. 从 localStorage 恢复用户状态
const userStore = useUserStore()
userStore.initFromCache()

// 3. 注册权限指令
import { setupDirectives } from '@/directives'
setupDirectives(app)
```

### initFromCache() 方法

这个方法会在应用启动时自动执行：

1. 恢复 token
2. 恢复用户信息
3. 恢复权限列表
4. 恢复菜单树
5. 设置登录状态

---

## 权限配置示例

### 后端菜单数据示例

```json
[
  {
    "id": 1,
    "parent_id": null,
    "menu_name": "系统管理",
    "menu_type": "folder",
    "icon": "Setting",
    "sort_order": 1,
    "status": 0,
    "children": [
      {
        "id": 11,
        "parent_id": 1,
        "menu_name": "用户管理",
        "menu_type": "menu",
        "menu_code": "system:user",
        "path": "/systemManage/userManagement",
        "component": "@/pages/system/userManagement.vue",
        "icon": "User",
        "sort_order": 1,
        "visible": true,
        "status": 0,
        "children": [
          {
            "id": 111,
            "parent_id": 11,
            "menu_name": "创建用户",
            "menu_type": "button",
            "menu_code": "user:create",
            "method": "POST",
            "sort_order": 1,
            "status": 0
          },
          {
            "id": 112,
            "parent_id": 11,
            "menu_name": "编辑用户",
            "menu_type": "button",
            "menu_code": "user:edit",
            "method": "PUT",
            "sort_order": 2,
            "status": 0
          }
        ]
      }
    ]
  }
]
```

---

## 常见问题

### Q: 菜单不显示？
A: 检查以下几点：
1. 是否已登录？
2. 后端是否返回了菜单数据？
3. 菜单的 `status` 是否为 0（启用）？
4. 菜单的 `visible` 是否为 `true` 或未设置？
5. 打开浏览器控制台查看是否有错误

### Q: 按钮权限不生效？
A: 检查以下几点：
1. 权限码是否正确？（使用 `userStore.permissions.value` 查看）
2. 权限码格式是否正确？（例如：`user:create`）
3. 是否正确使用 `v-permission` 指令？

### Q: 如何清除缓存？
A: 调用 `userStore.logout()` 会自动清除所有缓存。

### Q: 如何强制刷新数据？
A: 在 `fetch*` 方法中传入 `true` 参数：
```typescript
await userStore.fetchAllAuthInfo(true) // 强制刷新
```

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `src/api/auth/index.ts` | 认证服务入口 |
| `src/api/auth/authAPI.ts` | 认证 API 实现 |
| `src/api/auth/types.ts` | 认证类型定义 |
| `src/stores/modules/user.ts` | 用户状态管理 |
| `src/directives/permission.ts` | 权限指令 |
| `src/composables/useDynamicMenu.ts` | 动态菜单 composable |
| `src/components/common/DynamicMenu.vue` | 动态菜单组件 |
| `src/components/common/MenuItem.vue` | 菜单项组件 |

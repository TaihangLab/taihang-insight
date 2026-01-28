# System API 服务使用指南

## 概述

System API 提供所有与系统管理（用户、角色、部门、权限等）相关的 API 调用功能。

## 服务文件

```
src/api/system/
├── base.ts                  # Axios 配置和基础响应处理
├── userService.ts           # 用户管理服务
├── roleService.ts           # 角色管理服务
├── departmentService.ts     # 部门管理服务
├── positionService.ts       # 岗位管理服务
├── tenantService.ts         # 租户管理服务
├── permissionService.ts     # 权限管理服务
└── associationService.ts    # 关联管理服务
```

## Vue 3 组件中使用（`<script setup lang="ts">`）

### 示例 1: 用户列表组件

```vue
<template>
  <div class="user-management">
    <el-table :data="users" v-loading="loading">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="user_name" label="用户名" width="120" />
      <el-table-column prop="nick_name" label="昵称" width="120" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.limit"
      :total="pagination.total"
      @current-change="fetchUsers"
      @size-change="fetchUsers"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import RBACService from '@/api/system/RBACService'
import type { User } from '@/api/system/RBACService'

// 响应式数据
const users = ref<User[]>([])
const loading = ref(false)

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 获取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await RBACService.getUsers({
      page: pagination.page,
      limit: pagination.limit
    })

    if (response.success) {
      users.value = response.data || []
      pagination.total = response.total || 0
    } else {
      ElMessage.error(response.message || '获取用户列表失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 编辑用户
const handleEdit = (row: User) => {
  console.log('编辑用户:', row)
  // TODO: 打开编辑对话框
}

// 删除用户
const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
      type: 'warning'
    })

    const response = await RBACService.deleteUser(row.id)

    if (response.success) {
      ElMessage.success('删除成功')
      await fetchUsers()
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}
</style>
```

### 示例 2: 部门树组件

```vue
<template>
  <div class="department-tree">
    <el-tree
      :data="departmentTree"
      :props="treeProps"
      node-key="id"
      :loading="loading"
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <span>{{ data.dept_name }}</span>
          <span class="node-actions">
            <el-button size="small" text @click.stop="handleAdd(data)">添加</el-button>
            <el-button size="small" text @click.stop="handleEdit(data)">编辑</el-button>
            <el-button size="small" text type="danger" @click.stop="handleDelete(data)">删除</el-button>
          </span>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import RBACService from '@/api/system/RBACService'
import type { Department } from '@/api/system/RBACService'

// 响应式数据
const departmentTree = ref<Department[]>([])
const loading = ref(false)

// 树形结构配置
const treeProps = {
  children: 'children',
  label: 'dept_name'
}

// 获取部门树（带缓存）
const fetchDepartmentTree = async () => {
  loading.value = true
  try {
    const response = await RBACService.getDepartmentTreeWithCache({
      status: 1
    })

    if (response.success) {
      departmentTree.value = response.data || []
    } else {
      ElMessage.error(response.message || '获取部门树失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取部门树失败')
  } finally {
    loading.value = false
  }
}

// 节点点击事件
const handleNodeClick = (data: Department) => {
  console.log('点击部门:', data)
}

// 添加子部门
const handleAdd = (data: Department) => {
  console.log('添加子部门:', data)
}

// 编辑部门
const handleEdit = (data: Department) => {
  console.log('编辑部门:', data)
}

// 删除部门
const handleDelete = async (data: Department) => {
  console.log('删除部门:', data)
}

onMounted(() => {
  fetchDepartmentTree()
})
</script>

<style scoped>
.department-tree {
  padding: 20px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.node-actions {
  display: none;
}

.custom-tree-node:hover .node-actions {
  display: block;
}
</style>
```

### 示例 3: 用户创建表单

```vue
<template>
  <el-dialog
    v-model="visible"
    title="创建用户"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="用户名" prop="user_name">
        <el-input v-model="formData.user_name" placeholder="请输入用户名" />
      </el-form-item>

      <el-form-item label="昵称" prop="nick_name">
        <el-input v-model="formData.nick_name" placeholder="请输入昵称" />
      </el-form-item>

      <el-form-item label="手机号" prop="phone">
        <el-input v-model="formData.phone" placeholder="请输入手机号" />
      </el-form-item>

      <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" placeholder="请输入邮箱" />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password />
      </el-form-item>

      <el-form-item label="所属部门" prop="dept_id">
        <el-cascader
          v-model="formData.dept_id"
          :options="departmentOptions"
          :props="{ value: 'id', label: 'dept_name', children: 'children' }"
          placeholder="请选择部门"
          clearable
        />
      </el-form-item>

      <el-form-item label="角色" prop="role_ids">
        <el-select
          v-model="formData.role_ids"
          multiple
          placeholder="请选择角色"
          style="width: 100%"
        >
          <el-option
            v-for="role in roleOptions"
            :key="role.id"
            :label="role.role_name"
            :value="role.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :label="1">启用</el-radio>
          <el-radio :label="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import RBACService from '@/api/system/RBACService'
import type { CreateUserRequest, Role, Department } from '@/api/system/RBACService'

// 定义 props
interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

// 定义 emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

// 响应式数据
const visible = ref(props.modelValue)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive<CreateUserRequest>({
  user_name: '',
  nick_name: '',
  phone: '',
  email: '',
  password: '',
  dept_id: undefined,
  role_ids: [],
  status: 1
})

// 表单验证规则
const formRules: FormRules = {
  user_name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 部门选项（示例数据）
const departmentOptions = ref<Department[]>([])

// 角色选项
const roleOptions = ref<Role[]>([])

// 关闭对话框
const handleClose = () => {
  visible.value = false
  emit('update:modelValue', false)
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    submitting.value = true

    const response = await RBACService.createUser(formData)

    if (response.success) {
      ElMessage.success('创建成功')
      emit('success')
      handleClose()
    } else {
      ElMessage.error(response.message || '创建失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '创建失败')
  } finally {
    submitting.value = false
  }
}
</script>
```

## API 方法说明

### 用户管理

```typescript
import RBACService from '@/api/system/RBACService'

// 获取用户列表
const users = await RBACService.getUsers({ page: 1, limit: 10 })

// 创建用户
const result = await RBACService.createUser({
  user_name: 'zhangsan',
  password: '123456',
  email: 'zhangsan@example.com'
})

// 更新用户
await RBACService.updateUser(userId, {
  nick_name: '张三'
})

// 删除用户
await RBACService.deleteUser(userId)

// 重置密码
await RBACService.resetUserPassword(userId, 'newPassword')
```

### 角色管理

```typescript
// 获取角色列表
const roles = await RBACService.getRoles({ page: 1, limit: 10 })

// 创建角色
await RBACService.createRole({
  role_name: '管理员',
  description: '系统管理员角色'
})

// 获取角色的权限
const permissions = await RBACService.getRolePermissions(roleId)
```

### 部门管理

```typescript
// 获取部门列表
const departments = await RBACService.getDepartments()

// 获取部门树（带缓存）
const tree = await RBACService.getDepartmentTreeWithCache({
  tenant_id: 1,
  status: 1
})

// 创建部门
await RBACService.createDepartment({
  dept_name: '技术部',
  parent_id: 0
})
```

### 关联管理

```typescript
// 为用户分配角色
await RBACService.assignRoleToUser(userId, roleId)

// 为角色分配权限
await RBACService.assignPermissionToRole(roleId, permissionId)

// 检查用户权限
const hasPermission = await RBACService.checkUserPermission(
  userId,
  '/api/v1/users',
  'GET'
)
```

## 字段命名规范

所有字段统一使用**蛇形命名**（snake_case），与后端保持一致：

```typescript
// ✅ 正确
interface User {
  id: number
  user_name: string      // 蛇形命名
  dept_id: number        // 蛇形命名
  role_ids: number[]     // 蛇形命名
}

// ❌ 错误
interface User {
  id: number
  userName: string       // 驼峰命名（不推荐）
  deptId: number        // 驼峰命名（不推荐）
  roleIds: number[]     // 驼峰命名（不推荐）
}
```

## 错误处理

所有 API 调用都返回 `UnifiedResponse<T>` 格式：

```typescript
interface UnifiedResponse<T> {
  success: boolean    // 是否成功
  code: number        // 响应码
  message: string     // 响应消息
  data: T             // 响应数据
}
```

建议使用 try-catch 进行错误处理：

```typescript
try {
  const response = await RBACService.getUsers()
  if (response.success) {
    // 处理成功响应
    console.log(response.data)
  } else {
    // 处理业务错误
    ElMessage.error(response.message)
  }
} catch (error: any) {
  // 处理网络错误或其他异常
  ElMessage.error(error.message)
}
```

## 环境变量配置

确保 `.env` 文件中配置后端 API 地址：

```bash
VITE_API_BASE_URL=http://localhost:8000
```

Vite 配置（`vite.config.ts`）：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true
    }
  }
}
```

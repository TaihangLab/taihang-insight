<!--
  用户管理页面
  使用 <script setup> + TypeScript
-->
<template>
  <div class="user-management-page">
    <!-- 用户编辑对话框 -->
    <UserEditDialog
      v-model:visible="editDialogVisible"
      :current-user="currentUser"
      :tenant-id="tenantCode"
      @submit="handleUserSubmit"
    />
    <!-- 搜索表单 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryForm" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="queryForm.username"
            placeholder="请输入用户名"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="手机号">
          <el-input
            v-model="queryForm.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="部门">
          <el-input
            v-model="queryForm.department_id"
            placeholder="请输入部门ID"
            clearable
            style="width: 150px"
            type="number"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" :value="Status.ENABLED" />
            <el-option label="停用" :value="Status.DISABLED" />
          </el-select>
        </el-form-item>

        <el-form-item label="性别">
          <el-select
            v-model="queryForm.gender"
            placeholder="请选择性别"
            clearable
            style="width: 120px"
          >
            <el-option label="男" :value="Gender.MALE" />
            <el-option label="女" :value="Gender.FEMALE" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">用户列表</span>
          <div class="card-actions">
            <el-button type="primary" icon="Plus" @click="handleAdd">新增用户</el-button>
            <el-button
              type="danger"
              icon="Delete"
              :disabled="selectedIds.length === 0"
              @click="handleBatchDelete"
            >
              批量删除 ({{ selectedIds.length }})
            </el-button>
          </div>
        </div>
      </template>

      <!-- 用户表格 -->
      <el-table
        v-loading="loading"
        :data="users"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="userName" label="用户名" width="120" />

        <el-table-column prop="userNickname" label="昵称" width="120" />

        <el-table-column prop="phoneNumber" label="手机号" width="140" />

        <el-table-column prop="department" label="部门" width="150" />

        <el-table-column prop="position" label="岗位" width="120" />

        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            <span>{{ row.gender === Gender.MALE ? '男' : '女' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === Status.ENABLED ? 'success' : 'danger'">
              {{ row.status === Status.ENABLED ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间" width="180" />

        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="primary" size="small" @click="handleResetPassword(row)">
              重置密码
            </el-button>
            <el-button link type="warning" size="small" @click="handleAssignRoles(row)">
              分配角色
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 用户管理页面
 * 使用 Composition API + TypeScript
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type {
  UserQueryParams,
  UserQueryForm,
  User
} from '@/types/rbac';
import { Status, Gender } from '@/types/rbac';
import { useUserData } from '@/pages/system/composable/user/useUserData';
import UserEditDialog from './components/user/UserEditDialog.vue';

// ============================================
// Composables
// ============================================

const {
  users,
  loading,
  pagination,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  deleteUsers,
  resetUserPassword
} = useUserData();

// ============================================
// 响应式状态
// ============================================

// 查询表单
const queryForm = reactive<UserQueryForm>({
  username: '',
  phone: '',
  department_id: undefined,
  status: undefined,
  gender: undefined
});

// 选中的行
const selectedIds = ref<number[]>([]);

// 当前租户ID
const tenantCode = ref<number>(1);

// 对话框状态
const editDialogVisible = ref(false);
const currentUser = ref<User | null>(null);

// ============================================
// 方法
// ============================================

/**
 * 构建查询参数
 */
const buildQueryParams = (): UserQueryParams => {
  const params: UserQueryParams = {
    skip: (pagination.value.currentPage - 1) * pagination.value.pageSize,
    limit: pagination.value.pageSize,
    tenant_id: tenantCode.value
  };

  // 添加可选查询条件
  if (queryForm.username) {
    params.username = queryForm.username;
  }
  if (queryForm.phone) {
    params.phone = queryForm.phone;
  }
  if (queryForm.department_id) {
    params.department_id = queryForm.department_id;
  }
  if (queryForm.status !== undefined) {
    params.status = queryForm.status;
  }
  if (queryForm.gender) {
    params.gender = queryForm.gender;
  }

  return params;
};

/**
 * 加载用户列表
 */
const loadUsers = async () => {
  try {
    const params = buildQueryParams();
    await fetchUsers(params);
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(`加载用户列表失败: ${err.message}`);
  }
};

/**
 * 查询处理
 */
const handleSearch = () => {
  pagination.value.currentPage = 1;
  loadUsers();
};

/**
 * 重置处理
 */
const handleReset = () => {
  Object.keys(queryForm).forEach(key => {
    delete queryForm[key as keyof UserQueryForm];
  });
  pagination.value.currentPage = 1;
  loadUsers();
};

/**
 * 页码变化处理
 */
const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page;
  loadUsers();
};

/**
 * 每页条数变化处理
 */
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  pagination.value.currentPage = 1;
  loadUsers();
};

/**
 * 选择变化处理
 */
const handleSelectionChange = (selection: User[]) => {
  selectedIds.value = selection.map(item => item.id);
};

/**
 * 新增用户处理
 */
const handleAdd = () => {
  currentUser.value = null;
  editDialogVisible.value = true;
};

/**
 * 编辑用户处理
 */
const handleEdit = (row: User) => {
  currentUser.value = row;
  editDialogVisible.value = true;
};

/**
 * 用户表单提交处理
 */
const handleUserSubmit = async (formData: any) => {
  try {
    if (currentUser.value) {
      // 编辑用户
      await updateUser(currentUser.value.id, formData);
      ElMessage.success('用户修改成功');
    } else {
      // 新增用户
      await createUser(formData);
      ElMessage.success('用户添加成功');
    }
    editDialogVisible.value = false;
    loadUsers();
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(`保存失败: ${err.message}`);
  }
};

/**
 * 删除用户处理
 */
const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.userName}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    await deleteUser(row.id);
    ElMessage.success('删除成功');
    loadUsers();
  } catch {
    // 用户取消操作
  }
};

/**
 * 批量删除处理
 */
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 个用户吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    await deleteUsers(selectedIds.value);
    ElMessage.success('批量删除成功');
    selectedIds.value = [];
    loadUsers();
  } catch {
    // 用户取消操作
  }
};

/**
 * 重置密码处理
 */
const handleResetPassword = async (row: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置用户 "${row.userName}" 的密码吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    await resetUserPassword(row.id, '123456');
    ElMessage.success('密码重置成功，新密码为：123456');
  } catch {
    // 用户取消操作
  }
};

/**
 * 分配角色处理
 */
const handleAssignRoles = (row: User) => {
  // TODO: 打开角色分配对话框
  ElMessage.info(`为用户 "${row.userName}" 分配角色`);
};

// ============================================
// 生命周期
// ============================================

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>

</style>

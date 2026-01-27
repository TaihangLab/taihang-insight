<!--
  用户管理组件示例
  使用 <script setup> 语法 + TypeScript
-->
<template>
  <div class="user-management">
    <!-- 搜索表单区域 -->
    <div class="search-form">
      <el-form :model="queryForm" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="queryForm.username"
            placeholder="请输入用户名"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="手机号">
          <el-input
            v-model="queryForm.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
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
            style="width: 150px"
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
    </div>

    <!-- 操作按钮区域 -->
    <div class="toolbar">
      <el-button type="primary" icon="Plus" @click="handleAdd">新增用户</el-button>
      <el-button
        type="danger"
        icon="Delete"
        :disabled="selectedIds.length === 0"
        @click="handleBatchDelete"
      >
        批量删除
      </el-button>
    </div>

    <!-- 表格区域 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />

      <el-table-column prop="userName" label="用户名" width="120" />

      <el-table-column prop="userNickname" label="昵称" width="120" />

      <el-table-column prop="phoneNumber" label="手机号" width="140" />

      <el-table-column prop="department" label="部门" width="150" />

      <el-table-column prop="position" label="岗位" width="120" />

      <el-table-column prop="gender" label="性别" width="80">
        <template #default="{ row }: { row: User }">
          <span>{{ row.gender === Gender.MALE ? '男' : '女' }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }: { row: User }">
          <el-tag :type="row.status === Status.ENABLED ? 'success' : 'danger'">
            {{ row.status === Status.ENABLED ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="createTime" label="创建时间" width="180" />

      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }: { row: User }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button link type="primary" size="small" @click="handleResetPassword(row)">
            重置密码
          </el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
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
  </div>
</template>

<script setup lang="ts">
/**
 * 用户管理组件
 * 使用 Composition API + TypeScript
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type {
  UserQueryParams,
  User,
  UserListResponse
} from '@/types/rbac';
import { Status, Gender } from '@/types/rbac';

// ============================================
// 类型定义
// ============================================

/**
 * 查询表单数据类型
 */
interface QueryFormData {
  username?: string;
  phone?: string;
  status?: Status;
  gender?: Gender;
}

// ============================================
// 响应式数据
// ============================================

// 表格数据
const tableData = ref<User[]>([]);
const loading = ref(false);

// 查询表单
const queryForm = reactive<QueryFormData>({
  username: undefined,
  phone: undefined,
  status: undefined,
  gender: undefined
});

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 选中的行
const selectedIds = ref<number[]>([]);

// 当前租户编码
const tenantCode = 'default';

// ============================================
// 方法
// ============================================

/**
 * 构建查询参数
 */
const buildQueryParams = (): UserQueryParams => {
  const params: UserQueryParams = {
    skip: (pagination.currentPage - 1) * pagination.pageSize,
    limit: pagination.pageSize,
    tenant_code: tenantCode
  };

  // 添加可选查询条件
  if (queryForm.username) {
    params.username = queryForm.username;
  }
  if (queryForm.phone) {
    params.phone = queryForm.phone;
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
  loading.value = true;
  try {
    const params = buildQueryParams();

    // TODO: 调用实际 API
    // const response: UserListResponse = await RBACService.getUsers(params);

    // 模拟 API 响应
    const response: UserListResponse = {
      success: true,
      code: 200,
      message: '获取成功',
      data: {
        total: 0,
        items: []
      }
    };

    if (response.success && response.data) {
      tableData.value = response.data.items;
      pagination.total = response.data.total;
    }
  } catch (error) {
    console.error('加载用户列表失败:', error);
    ElMessage.error('加载用户列表失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 处理查询
 */
const handleSearch = () => {
  pagination.currentPage = 1;
  loadUsers();
};

/**
 * 处理重置
 */
const handleReset = () => {
  Object.keys(queryForm).forEach(key => {
    delete queryForm[key as keyof QueryFormData];
  });
  pagination.currentPage = 1;
  loadUsers();
};

/**
 * 处理页码变化
 */
const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  loadUsers();
};

/**
 * 处理每页条数变化
 */
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  loadUsers();
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: User[]) => {
  selectedIds.value = selection.map(item => item.id);
};

/**
 * 处理新增
 */
const handleAdd = () => {
  // TODO: 打开新增对话框
  ElMessage.info('打开新增用户对话框');
};

/**
 * 处理编辑
 */
const handleEdit = (row: User) => {
  // TODO: 打开编辑对话框
  ElMessage.info(`编辑用户: ${row.userName}`);
};

/**
 * 处理删除
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

    // TODO: 调用删除 API
    // await RBACService.deleteUser(row.id);

    ElMessage.success('删除成功');
    loadUsers();
  } catch {
    // 用户取消操作
  }
};

/**
 * 处理批量删除
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

    // TODO: 调用批量删除 API
    // await RBACService.deleteUsers(selectedIds.value);

    ElMessage.success('批量删除成功');
    loadUsers();
  } catch {
    // 用户取消操作
  }
};

/**
 * 处理重置密码
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

    // TODO: 调用重置密码 API
    // await RBACService.resetUserPassword(row.id, '123456');

    ElMessage.success('密码重置成功，新密码为：123456');
  } catch {
    // 用户取消操作
  }
};

// ============================================
// 生命周期
// ============================================

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.toolbar {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

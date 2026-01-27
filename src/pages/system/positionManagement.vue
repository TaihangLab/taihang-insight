<!--
  岗位管理页面
  使用 <script setup> + TypeScript
-->
<template>
  <div class="position-management-page">
    <!-- 搜索表单 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="queryForm" inline>
        <el-form-item label="岗位编号">
          <el-input
            v-model="queryForm.position_code"
            placeholder="请输入岗位编号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="岗位名称">
          <el-input
            v-model="queryForm.position_name"
            placeholder="请输入岗位名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="岗位类别">
          <el-select
            v-model="queryForm.category_code"
            placeholder="请选择岗位类别"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="category in positionCategories"
              :key="category.categoryCode"
              :label="category.categoryName"
              :value="category.categoryCode"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="部门">
          <el-input
            v-model="queryForm.department"
            placeholder="请输入部门"
            clearable
            style="width: 150px"
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
          <span class="card-title">岗位列表</span>
          <div class="card-actions">
            <el-button type="primary" icon="Plus" @click="handleAdd">新增岗位</el-button>
          </div>
        </div>
      </template>

      <!-- 岗位表格 -->
      <el-table
        v-loading="loading"
        :data="positions"
      >
        <el-table-column prop="positionCode" label="岗位编号" width="150" />

        <el-table-column prop="positionName" label="岗位名称" width="150" />

        <el-table-column prop="categoryName" label="岗位类别" width="150" />

        <el-table-column prop="department" label="所属部门" width="180" />

        <el-table-column prop="sortOrder" label="排序" width="100" />

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === Status.ENABLED ? 'success' : 'danger'">
              {{ row.status === Status.ENABLED ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间" width="180" />

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
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
 * 岗位管理页面
 * 使用 Composition API + TypeScript
 */
import { reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { Position } from '@/types/rbac';
import { Status } from '@/types/rbac';
import { usePositionData, type PositionSearchConditions } from '@/pages/system/composable/position/usePositionData';

// ============================================
// Composables
// ============================================

const {
  positions,
  positionCategories,
  loading,
  pagination,
  fetchPositions,
  fetchPositionCategories,
  deletePosition
} = usePositionData();

// ============================================
// 响应式状态
// ============================================

// 查询表单
const queryForm = reactive<PositionSearchConditions>({
  position_code: '',
  position_name: '',
  category_code: undefined,
  department: '',
  status: undefined
});

// ============================================
// 方法
// ============================================

/**
 * 加载岗位列表
 */
const loadPositions = async () => {
  try {
    await fetchPositions(queryForm);
  } catch (error: unknown) {
    const err = error as Error;
    ElMessage.error(`加载岗位列表失败: ${err.message}`);
  }
};

/**
 * 加载岗位类别列表
 */
const loadPositionCategories = async () => {
  try {
    await fetchPositionCategories();
  } catch (error: unknown) {
    const err = error as Error;
    console.error('加载岗位类别失败:', err.message);
  }
};

/**
 * 查询处理
 */
const handleSearch = () => {
  pagination.value.currentPage = 1;
  loadPositions();
};

/**
 * 重置处理
 */
const handleReset = () => {
  queryForm.position_code = '';
  queryForm.position_name = '';
  queryForm.category_code = undefined;
  queryForm.department = '';
  queryForm.status = undefined;
  pagination.value.currentPage = 1;
  loadPositions();
};

/**
 * 页码变化处理
 */
const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page;
  loadPositions();
};

/**
 * 每页条数变化处理
 */
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size;
  pagination.value.currentPage = 1;
  loadPositions();
};

/**
 * 新增岗位处理
 */
const handleAdd = () => {
  // TODO: 打开新增对话框
  ElMessage.info('打开新增岗位对话框');
};

/**
 * 编辑岗位处理
 */
const handleEdit = (row: Position) => {
  // TODO: 打开编辑对话框
  ElMessage.info(`编辑岗位: ${row.positionName}`);
};

/**
 * 删除岗位处理
 */
const handleDelete = async (row: Position) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除岗位 "${row.positionName}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    await deletePosition(row.id);
    ElMessage.success('删除成功');
    loadPositions();
  } catch {
    // 用户取消操作
  }
};

// ============================================
// 生命周期
// ============================================

onMounted(() => {
  loadPositionCategories();
  loadPositions();
});
</script>

<style scoped>
.position-management-page {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  min-height: calc(100vh - 280px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.card-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

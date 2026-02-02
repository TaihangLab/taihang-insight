<!--
  岗位管理页面
  使用 <script setup> + TypeScript
-->
<template>
  <div class="position-management-page">
    <!-- 查询区 -->
    <PositionSearchBar
      v-model="searchConditions"
      @search="handleSearch"
      @reset="handleReset"
      @tenant-change="handleTenantChange"
    />

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
import PositionSearchBar from '@/pages/system/components/position/PositionSearchBar.vue';

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

// 搜索条件
const searchConditions = reactive<PositionSearchConditions>({
  tenant_id: null,
  position_code: '',
  position_name: '',
  category_code: '',
  status: null
});

// ============================================
// 方法
// ============================================

/**
 * 加载岗位列表
 */
const loadPositions = async () => {
  try {
    await fetchPositions(searchConditions);
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
  const currentTenantId = searchConditions.tenant_id;
  Object.assign(searchConditions, {
    tenant_id: currentTenantId,
    position_code: '',
    position_name: '',
    category_code: '',
    status: null
  });
  pagination.value.currentPage = 1;
  loadPositions();
};

/**
 * 租户变更处理
 */
const handleTenantChange = () => {
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

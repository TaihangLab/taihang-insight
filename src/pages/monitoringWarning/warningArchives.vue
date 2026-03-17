<!--
  预警档案页面
  Vue 3 + TypeScript + Composition API
-->
<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue';
import { useWarningArchives } from './composables/useWarningArchives';
import { ALERT_LEVEL_OPTIONS, ALERT_STATUS_OPTIONS } from '@/types/center/archive.d';

// 异步组件
const WarningDetail = defineAsyncComponent(
  () => import('@/components/visionAI/monitoringWarning/warningDetail.vue'),
);

// 使用 composable
const {
  // 状态
  archiveList,
  currentPageArchives,
  archivePagination,
  searchForm,
  currentArchiveId,
  currentArchive,
  alertRecords,
  currentPageRecords,
  selectedAlertRecords,
  recordPagination,
  loading,
  archiveLoading,
  recordsLoading,
  editDialogVisible,
  addArchiveDialogVisible,
  selectAlertDialogVisible,
  detailDialogVisible,
  currentDetail,
  editForm,
  newArchiveForm,
  availableAlerts,
  currentPageAvailableAlerts,
  selectedAvailableAlerts,
  availableAlertsLoading,
  availableAlertsPagination,
  alertFilters,
  deleteConfirmVisible,
  imagePreviewVisible,
  currentPreviewImage,

  // 计算属性
  hasSelectedRecords,
  hasSelectedAvailableAlerts,

  // 方法
  formatTimeDisplay,
  getAlertLevelText,
  getAlertLevelColor,
  selectArchive,
  handleSearch,
  resetSearch,
  openAddArchiveDialog,
  openEditDialog,
  createArchive,
  updateArchive,
  confirmDeleteArchive,
  executeDelete,
  confirmDeleteRecord,
  confirmBatchDeleteRecords,
  toggleRecordSelection,
  toggleSelectAllRecords,
  openSelectAlertDialog,
  getAvailableAlerts,
  toggleAvailableAlertSelection,
  toggleSelectAllAvailableAlerts,
  addSelectedAlertsToArchive,
  viewAlertDetail,
  handleArchivePageChange,
  handleArchiveSizeChange,
  handleRecordPageChange,
  handleRecordSizeChange,
  handleAvailableAlertsPageChange,
  previewImage,
} = useWarningArchives();

// 图片上传相关
const imageUploadRef = ref();
</script>

<template>
  <div class="warning-archives-container" v-loading="loading">
    <!-- 主内容区域 -->
    <div class="content-wrapper">
      <!-- 左侧：档案信息区域 -->
      <div class="detail-section">
        <div class="detail-header">
          <div class="detail-title">档案基本信息</div>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="openAddArchiveDialog">
              添加档案
            </el-button>
          </div>
        </div>

        <!-- 档案列表 -->
        <div class="archives-list">
          <div
            v-for="archive in currentPageArchives"
            :key="archive.id"
            class="archive-item"
            :class="{ active: currentArchiveId === archive.id }"
          >
            <div class="archive-content" @click="selectArchive(archive.id)">
              <div class="archive-name">{{ archive.name }}</div>
              <div class="archive-location">位置: {{ archive.location }}</div>
              <div class="archive-time">创建: {{ formatTimeDisplay(archive.createTime) }}</div>
            </div>
            <div class="archive-actions">
              <el-button
                type="text"
                size="small"
                @click.stop="confirmDeleteArchive"
                class="delete-archive-btn"
                title="删除档案"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>

        <!-- 档案列表分页 -->
        <div class="archives-pagination">
          <el-pagination
            :current-page="archivePagination.currentPage"
            :page-size="archivePagination.pageSize"
            :total="archivePagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, prev, pager, next"
            @size-change="handleArchiveSizeChange"
            @current-change="handleArchivePageChange"
          />
        </div>

        <!-- 当前选中档案详情 -->
        <div class="detail-content" v-if="currentArchive">
          <div class="archive-detail-card">
            <div class="archive-detail-header">
              <div class="archive-title">{{ currentArchive.name }}</div>
            </div>
            <div class="archive-detail-body">
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">所属位置：</span>
                  <span class="value">{{ currentArchive.location }}</span>
                </div>
                <div class="info-item">
                  <span class="label">时间范围：</span>
                  <span class="value">{{ currentArchive.timeRange }}</span>
                </div>
                <div class="info-item">
                  <span class="label">创建时间：</span>
                  <span class="value">{{ formatTimeDisplay(currentArchive.createTime) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">档案描述：</span>
                  <span class="value">{{ currentArchive.description || '-' }}</span>
                </div>
              </div>
            </div>
            <div class="archive-detail-footer">
              <el-button type="primary" class="edit-archive-btn" @click="openEditDialog">
                编辑档案
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：预警记录表格区域 -->
      <div class="table-container-wrapper">
        <!-- 表格标题和操作按钮 -->
        <div class="table-header">
          <div class="table-title">预警列表 - {{ currentArchive?.name || '未选择档案' }}</div>
          <div class="table-actions">
            <el-button
              type="danger"
              size="small"
              class="batch-delete-btn"
              @click="confirmBatchDeleteRecords"
              :disabled="!hasSelectedRecords"
            >
              批量删除
            </el-button>
            <el-button type="primary" size="small" class="add-btn" @click="openSelectAlertDialog">
              添加预警
            </el-button>
          </div>
        </div>

        <!-- 表格卡片 -->
        <div class="table-section">
          <el-table
            :data="currentPageRecords"
            @selection-change="toggleSelectAllRecords"
            style="width: 100%"
            v-loading="recordsLoading"
          >
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column label="序号" prop="id" width="80" align="center" />
            <el-table-column label="预警名称" prop="name" min-width="120" align="center" />
            <el-table-column label="预警图片" width="100" align="center">
              <template #default="{ row }">
                <div class="preview-image-cell" v-if="row.imageUrl">
                  <el-image
                    :src="row.imageUrl"
                    fit="cover"
                    class="preview-thumbnail"
                    :preview-src-list="[row.imageUrl]"
                    :preview-teleported="true"
                  />
                </div>
                <span v-else class="no-image">无图片</span>
              </template>
            </el-table-column>
            <el-table-column label="设备名称" prop="deviceName" min-width="150" align="center" />
            <el-table-column label="预警时间" prop="alertTime" min-width="180" align="center" />
            <el-table-column label="预警等级" width="100" align="center">
              <template #default="{ row }">
                <span
                  class="level-tag"
                  :style="{ backgroundColor: getAlertLevelColor(row.alertLevel) }"
                >
                  {{ row.alertLevelText }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <div class="operation-buttons">
                  <el-button type="text" size="small" @click="viewAlertDetail(row)">
                    详情
                  </el-button>
                  <el-button type="text" size="small" @click="confirmDeleteRecord(row.id)">
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 预警记录分页 -->
        <div class="pagination-section">
          <el-pagination
            :current-page="recordPagination.currentPage"
            :page-size="recordPagination.pageSize"
            :total="recordPagination.total"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleRecordSizeChange"
            @current-change="handleRecordPageChange"
          />
        </div>
      </div>
    </div>

    <!-- 新增档案对话框 -->
    <el-dialog
      v-model="addArchiveDialogVisible"
      title="新增档案"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="newArchiveForm" label-width="100px">
        <el-form-item label="档案名称" required>
          <el-input v-model="newArchiveForm.name" placeholder="请输入档案名称" />
        </el-form-item>
        <el-form-item label="所属位置" required>
          <el-input v-model="newArchiveForm.location" placeholder="请输入位置" />
        </el-form-item>
        <el-form-item label="时间范围" required>
          <el-date-picker
            v-model="newArchiveForm.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="档案描述">
          <el-input
            v-model="newArchiveForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入档案描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addArchiveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createArchive">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑档案对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑档案"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="档案名称" required>
          <el-input v-model="editForm.name" placeholder="请输入档案名称" />
        </el-form-item>
        <el-form-item label="所属位置" required>
          <el-input v-model="editForm.location" placeholder="请输入位置" />
        </el-form-item>
        <el-form-item label="时间范围" required>
          <el-date-picker
            v-model="editForm.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="档案描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入档案描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateArchive">确定</el-button>
      </template>
    </el-dialog>

    <!-- 选择可用预警对话框 -->
    <el-dialog
      v-model="selectAlertDialogVisible"
      title="添加预警到档案"
      width="80%"
      top="5vh"
    >
      <!-- 筛选条件 -->
      <div class="alert-filters">
        <el-form :model="alertFilters" inline>
          <el-form-item label="预警等级">
            <el-select v-model="alertFilters.alertLevel" placeholder="全部" clearable>
              <el-option
                v-for="option in ALERT_LEVEL_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="预警状态">
            <el-select v-model="alertFilters.status" placeholder="全部" clearable>
              <el-option
                v-for="option in ALERT_STATUS_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getAvailableAlerts">查询</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 可用预警列表 -->
      <el-table
        :data="currentPageAvailableAlerts"
        @selection-change="toggleSelectAllAvailableAlerts"
        style="width: 100%"
        v-loading="availableAlertsLoading"
        max-height="400"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="预警名称" prop="alertName" min-width="120" />
        <el-table-column label="设备名称" prop="cameraName" min-width="120" />
        <el-table-column label="预警时间" prop="alertTime" min-width="180" />
        <el-table-column label="预警等级" width="100" align="center">
          <template #default="{ row }">
            <span
              class="level-tag"
              :style="{ backgroundColor: getAlertLevelColor(row.alertLevel) }"
            >
              {{ row.alertLevelText }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          :current-page="availableAlertsPagination.currentPage"
          :page-size="availableAlertsPagination.pageSize"
          :total="availableAlertsPagination.total"
          layout="total, prev, pager, next"
          @current-change="handleAvailableAlertsPageChange"
        />
      </div>

      <template #footer>
        <el-button @click="selectAlertDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="addSelectedAlertsToArchive"
          :disabled="!hasSelectedAvailableAlerts"
        >
          添加选中 ({{ selectedAvailableAlerts.length }})
        </el-button>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteConfirmVisible"
      title="确认删除"
      width="400px"
    >
      <span>确定要删除吗？删除后将无法恢复。</span>
      <template #footer>
        <el-button @click="deleteConfirmVisible = false">取消</el-button>
        <el-button type="danger" @click="executeDelete">确定删除</el-button>
      </template>
    </el-dialog>

    <!-- 预警详情对话框 -->
    <WarningDetail
      v-model:visible="detailDialogVisible"
      :warning="currentDetail"
      source="warningArchives"
    />

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="imagePreviewVisible && currentPreviewImage"
      :url-list="[currentPreviewImage]"
      @close="imagePreviewVisible = false"
    />
  </div>
</template>

<style scoped>
.warning-archives-container {
  height: 100%;
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%);
  padding: 12px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

/* 左侧档案信息区域 */
.detail-section {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
}

.detail-header {
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.detail-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.archives-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.archive-item {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.archive-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.archive-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.archive-content {
  flex: 1;
}

.archive-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.archive-location,
.archive-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.archive-actions {
  display: flex;
  gap: 4px;
}

.delete-archive-btn {
  color: #f56c6c;
}

.delete-archive-btn:hover {
  color: #f56c6c;
}

.archives-pagination {
  background: #fff;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.detail-content {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.archive-detail-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.archive-detail-header {
  margin-bottom: 12px;
}

.archive-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.archive-detail-body {
  flex: 1;
}

.info-grid {
  display: grid;
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: flex-start;
}

.info-item .label {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
  width: 80px;
}

.info-item .value {
  font-size: 12px;
  color: #303133;
  word-break: break-all;
}

.archive-detail-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

/* 右侧表格区域 */
.table-container-wrapper {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  min-width: 0;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.table-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-image-cell {
  display: flex;
  justify-content: center;
}

.preview-thumbnail {
  width: 60px;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
}

.no-image {
  color: #c0c4cc;
  font-size: 12px;
}

.level-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
}

.operation-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.pagination-section {
  padding-top: 12px;
  display: flex;
  justify-content: center;
}

/* 筛选条件 */
.alert-filters {
  margin-bottom: 16px;
}
</style>

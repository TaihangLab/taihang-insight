<template>
  <div class="warning-management-container" v-loading="loading">
    <div class="content-area">
      <!-- 搜索和筛选区域 -->
      <div class="search-filter-area">
        <div class="search-row">
          <div class="date-picker-wrapper" style="margin-right: 24px">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              value-format="YYYY-MM-DD"
              @change="handleSearch"
            />
          </div>

          <div class="select-wrapper">
            <el-select
              v-model="searchForm.alert_level"
              placeholder="预警等级"
              size="small"
              clearable
              @change="handleSearch"
            >
              <el-option label="一级预警" value="level1" />
              <el-option label="二级预警" value="level2" />
              <el-option label="三级预警" value="level3" />
              <el-option label="四级预警" value="level4" />
            </el-select>
          </div>

          <div class="select-wrapper">
            <el-select
              v-model="searchForm.alert_type"
              placeholder="预警类型"
              size="small"
              clearable
              @change="handleSearch"
            >
              <el-option label="安全帽违规" value="safety_helmet" />
              <el-option label="安全带违规" value="safety_belt" />
              <el-option label="防护服违规" value="protective_clothing" />
              <el-option label="无关人员" value="unauthorized_personnel" />
              <el-option label="吸烟违规" value="smoking" />
              <el-option label="高空作业违规" value="high_altitude" />
            </el-select>
          </div>

          <div class="select-wrapper">
            <el-select
              v-model="searchForm.warningSkill"
              placeholder="预警技能"
              size="small"
              clearable
              @change="handleSearch"
            >
              <el-option
                v-for="skill in warningSkillOptions"
                :key="skill.value"
                :label="skill.label"
                :value="skill.value"
              />
            </el-select>
          </div>

          <div class="select-wrapper">
            <el-select
              v-model="searchForm.status"
              placeholder="处理状态"
              size="small"
              clearable
              @change="handleSearch"
            >
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已处理" value="completed" />
            </el-select>
          </div>

          <div class="input-wrapper">
            <el-input
              v-model="searchForm.warningName"
              placeholder="预警名称"
              size="small"
              clearable
              @change="handleSearch"
              @clear="handleSearch"
            />
          </div>

          <div class="input-wrapper">
            <el-input
              v-model="searchForm.warningId"
              placeholder="预警ID"
              size="small"
              clearable
              @change="handleSearch"
              @clear="handleSearch"
            />
          </div>

          <div class="input-wrapper">
            <el-input
              v-model="searchForm.location"
              placeholder="违规位置"
              size="small"
              clearable
              @change="handleSearch"
              @clear="handleSearch"
            />
          </div>

          <div class="reset-button">
            <el-button size="small" :icon="Refresh" @click="resetSearch">
              重置
            </el-button>
          </div>
        </div>

        <div class="filter-actions">
          <div class="filter-buttons">
            <el-button size="small" @click="handleSelectPage">选择本页</el-button>
            <el-button
              size="small"
              :disabled="selectedWarnings.length === 0"
              @click="handleBatchProcess"
            >
              批量处理
            </el-button>
            <el-button
              size="small"
              :icon="Delete"
              :disabled="selectedWarnings.length === 0"
              @click="showDeleteDialog"
            >
              删除
            </el-button>
          </div>

          <div class="action-buttons">
            <el-button size="small" :icon="Download" @click="exportData">导出数据</el-button>
            <el-button type="primary" size="small" :icon="Cpu" @click="goToReviewRecords">
              复判记录
            </el-button>
            <el-button size="small" :icon="Refresh" @click="getWarningList">刷新</el-button>
          </div>
        </div>
      </div>

      <!-- 预警卡片列表 -->
      <div class="warning-cards-container">
        <div class="warning-cards-grid">
          <div v-for="item in warningList" :key="item.id" class="warning-col">
            <div
              class="warning-card"
              :class="{ selected: selectedWarnings.includes(item.id) }"
              @click="showWarningDetail(item)"
              @mouseenter="showCardCheckbox(item.id)"
              @mouseleave="hideCardCheckbox(item.id)"
            >
              <!-- 等级和状态标签容器 -->
              <div class="warning-badges-container">
                <div class="warning-level-badge" :class="getLevelClass(item.level)">
                  <span class="level-badge-text">{{ getLevelBadgeText(item.level) }}</span>
                </div>

                <div class="warning-status-badge" :class="getCurrentWarningStatus(item).class">
                  {{ getCurrentWarningStatus(item).text }}
                </div>
              </div>

              <!-- 右上角选择框 -->
              <div
                v-show="cardHoverStates[item.id] || selectedWarnings.includes(item.id)"
                class="select-checkbox"
                @click.stop="toggleSelect(item.id)"
              >
                <el-checkbox
                  :model-value="selectedWarnings.includes(item.id)"
                  @change="toggleSelect(item.id)"
                  size="small"
                />
              </div>

              <div class="warning-image">
                <div v-if="item.imageUrl" class="warning-real-image">
                  <img :src="item.imageUrl" :alt="item.type" />
                </div>
                <div v-else class="warning-video-preview">
                  <el-icon :size="36"><Warning /></el-icon>
                  <span>预警监控画面</span>
                </div>
              </div>

              <div class="warning-content">
                <h3 class="warning-title">{{ item.deviceName }}</h3>

                <div class="info-list">
                  <div class="info-item">
                    <span class="label">设备名称：</span>
                    <span class="value">{{ item.device || item.deviceInfo.name }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">违规位置：</span>
                    <span class="value">
                      {{ item.location || item.deviceInfo.position || '未知位置' }}
                    </span>
                  </div>

                  <div class="info-item time-item">
                    <span class="time">{{ formatTime(item.time) }}</span>
                  </div>
                </div>

                <div class="warning-footer">
                  <div class="item-actions">
                    <el-button
                      size="small"
                      class="action-btn report-btn"
                      @click.stop="handleWarning(item.id, 'report')"
                      :disabled="isProcessingDisabled(item)"
                    >
                      上报
                    </el-button>

                    <el-button
                      size="small"
                      class="action-btn archive-btn"
                      @click.stop="handleWarning(item.id, 'archive')"
                      :disabled="isArchiveDisabled(item)"
                    >
                      归档
                    </el-button>

                    <el-button
                      size="small"
                      class="action-btn false-alarm-btn"
                      @click.stop="handleWarning(item.id, 'falseAlarm')"
                      :disabled="isFalseAlarmDisabled(item)"
                    >
                      误报
                    </el-button>

                    <el-button
                      size="small"
                      class="action-btn process-btn"
                      @click.stop="handleWarning(item.id, 'markProcessed')"
                      :disabled="isProcessingDisabled(item)"
                    >
                      {{ isProcessingDisabled(item) ? '已完成' : '处理' }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 没有数据时的提示 -->
        <div class="no-data" v-if="warningList.length === 0 && !loading">
          <el-icon :size="72" color="#d1d5db"><FolderOpened /></el-icon>
          <p>暂无预警数据</p>
          <span class="no-data-tip">可尝试调整搜索条件或筛选条件</span>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-section" v-if="totalCount > 0">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          background
        >
          <template #total>
            <span>共 {{ totalCount }} 条数据</span>
          </template>
        </el-pagination>
      </div>
    </div>

    <!-- 导出数据对话框 -->
    <el-dialog
      title="导出数据"
      v-model="exportDialogVisible"
      width="35%"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="export-dialog-content">
        <div class="export-info-section">
          <div class="export-data-info">
            <el-icon :size="20" color="#409eff" style="margin-right: 8px"><Download /></el-icon>
            <span style="font-size: 16px; font-weight: 500">数据导出</span>
          </div>
          <p class="export-selection-info">
            {{ getExportSelectionText() }}
          </p>
        </div>

        <div class="export-format-section">
          <el-form :model="{ exportFormat }" label-width="80px">
            <el-form-item label="导出格式:">
              <el-radio-group v-model="exportFormat">
                <el-radio value="csv">
                  <el-icon><Document /></el-icon>
                  CSV格式
                  <span class="format-desc">（逗号分隔值，适合Excel打开）</span>
                </el-radio>
                <el-radio value="excel">
                  <el-icon><Grid /></el-icon>
                  Excel格式
                  <span class="format-desc">（XLSX文件，包含格式化）</span>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>

        <div class="export-filter-info">
          <div class="filter-info-title">
            <el-icon :size="14" color="#909399" style="margin-right: 4px"><InfoFilled /></el-icon>
            <span>当前筛选条件：</span>
          </div>
          <div class="filter-summary">
            <template v-if="hasActiveFilters()">
              <el-tag v-if="searchForm.deviceName" size="small" type="info" style="margin: 2px">
                设备: {{ searchForm.deviceName }}
              </el-tag>
              <el-tag v-if="searchForm.alert_type" size="small" type="info" style="margin: 2px">
                类型: {{ searchForm.alert_type }}
              </el-tag>
              <el-tag v-if="searchForm.alert_level" size="small" type="info" style="margin: 2px">
                等级: {{ searchForm.alert_level }}
              </el-tag>
              <el-tag v-if="searchForm.status" size="small" type="info" style="margin: 2px">
                状态: {{ searchForm.status }}
              </el-tag>
              <el-tag
                v-if="searchForm.start_date || searchForm.end_date"
                size="small"
                type="info"
                style="margin: 2px"
              >
                时间范围
              </el-tag>
            </template>
            <span v-else style="color: #909399; font-size: 12px">无筛选条件，将导出所有数据</span>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="exportDialogVisible = false" :disabled="exportLoading">取 消</el-button>
          <el-button type="primary" @click="confirmExport" :loading="exportLoading">
            <el-icon><Download /></el-icon>
            确认导出
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加备注对话框 -->
    <el-dialog
      title="处理预警"
      v-model="remarkDialogVisible"
      width="30%"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="remarkForm" label-width="80px">
        <el-form-item label="处理意见" required>
          <el-input
            v-model="remarkForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入处理意见，描述具体的处理措施和结果"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <div class="process-tip">
        <el-icon :size="14" color="#909399" style="margin-right: 4px"><InfoFilled /></el-icon>
        <span style="color: #909399; font-size: 13px">
          填写处理意见后，可点击"确认处理"添加处理记录，或点击"结束处理"完成整个处理流程
        </span>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="saveRemark">确认处理</el-button>
          <el-button type="success" @click="finishProcessing">结束处理</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 上报确认对话框 -->
    <el-dialog
      title="上报确认"
      v-model="reportDialogVisible"
      width="400px"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="confirm-content">
        <p>确定要上报此预警吗？</p>
        <p style="color: #909399; font-size: 12px">上报后预警将提交给上级部门处理</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeReportDialog">取 消</el-button>
          <el-button type="warning" @click="confirmReport">确定上报</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 归档确认对话框 -->
    <el-dialog
      title="归档预警"
      v-model="archiveDialogVisible"
      width="40%"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="archive-dialog-content">
        <div class="archive-info">
          <el-icon :size="24" color="#e6a23c" style="margin-right: 8px"><Folder /></el-icon>
          <span>请选择要归档到的档案：</span>
        </div>

        <div class="archive-selection">
          <el-form label-width="80px">
            <el-form-item label="选择档案">
              <el-select
                v-model="selectedArchiveId"
                placeholder="请选择档案"
                style="width: 100%"
                :disabled="availableArchives.length === 0"
                :loading="archiveListLoading"
                popper-append-to-body
                popper-class="archive-select-dropdown"
              >
                <el-option
                  v-for="archive in availableArchives"
                  :key="archive.archive_id || archive.id"
                  :label="archive.name"
                  :value="archive.archive_id || archive.id"
                >
                  <span style="float: left">{{ archive.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    {{ archive.location || '未知位置' }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item v-if="availableArchives.length === 0">
              <el-alert
                title="当前摄像头位置没有可用档案"
                description="系统将自动创建默认档案进行归档"
                type="info"
                :closable="false"
                show-icon
              />
            </el-form-item>
          </el-form>
        </div>

        <div class="archive-tip">
          <el-alert
            title="归档说明"
            description="归档后，预警将从实时预警页面和预警管理页面移除，仅可在预警档案中查看。"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeArchiveDialog">取 消</el-button>
          <el-button type="danger" @click="confirmArchive">确认归档</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量处理对话框 -->
    <el-dialog
      title="批量处理预警"
      v-model="batchProcessDialogVisible"
      width="35%"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="batch-process-info">
        <el-icon :size="24" color="#e6a23c" style="margin-right: 8px"><WarningFilled /></el-icon>
        <span style="font-size: 16px; font-weight: 500">
          您将要批量处理 {{ selectedWarnings.length }} 项预警
        </span>
      </div>

      <el-form :model="batchRemarkForm" label-width="80px" style="margin-top: 20px">
        <el-form-item label="处理意见" required>
          <el-input
            v-model="batchRemarkForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入批量处理意见，此意见将应用到所有选中的预警"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <div class="batch-process-tip">
        <el-icon :size="14" color="#909399" style="margin-right: 4px"><InfoFilled /></el-icon>
        <span style="color: #909399; font-size: 13px">
          批量处理完成后，将为所有选中的预警添加统一的处理记录，可继续多次处理
        </span>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeBatchProcessDialog">取 消</el-button>
          <el-button type="primary" @click="confirmBatchProcess">确认批量处理</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 误报输入对话框 -->
    <el-dialog
      title="标记误报"
      v-model="falseAlarmDialogVisible"
      width="30%"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="falseAlarmForm" label-width="80px">
        <el-form-item label="复判意见" required>
          <el-input
            v-model="falseAlarmForm.reviewNotes"
            type="textarea"
            :rows="4"
            placeholder="请输入复判意见，说明为什么判定为误报"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <div class="process-tip">
        <el-icon :size="14" color="#e6a23c" style="margin-right: 4px"><Warning /></el-icon>
        <span style="color: #e6a23c; font-size: 13px">
          标记为误报后，该预警将被移出预警管理列表，并保存到复判记录中
        </span>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button
            @click="
              falseAlarmDialogVisible = false;
              falseAlarmForm.reviewNotes = '';
              archiveWarningId = '';
            "
          >
            取消
          </el-button>
          <el-button type="warning" @click="handleFalseAlarmArchive">确认误报</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      title="删除预警"
      v-model="deleteDialogVisible"
      width="400px"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="delete-dialog-content">
        <div class="delete-warning-icon">
          <el-icon :size="36" color="#f56c6c"><WarningFilled /></el-icon>
        </div>
        <div class="delete-text">
          <p class="delete-title">确定要删除选中的预警吗？</p>
          <p class="delete-desc">
            您已选择
            <strong>{{ selectedWarnings.length }}</strong>
            项预警，删除后将无法恢复
          </p>
          <div class="delete-tip">
            <el-icon :size="14" color="#e6a23c" style="margin-right: 4px"><InfoFilled /></el-icon>
            <span style="color: #e6a23c; font-size: 13px">此操作不可逆，请谨慎操作</span>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDeleteDialog" :disabled="deleteLoading">取 消</el-button>
          <el-button type="danger" @click="confirmDelete" :loading="deleteLoading">
            确认删除
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 预警详情对话框 -->
    <WarningDetail
      v-model:visible="warningDetailVisible"
      :warning="currentWarningDetail"
      source="warningManagement"
      @handle-warning="handleWarningFromDetail"
      @handle-report="handleReportFromDetail"
      @handle-archive="handleArchiveFromDetail"
      @handle-false-alarm="handleFalseAlarmFromDetail"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 预警管理页面
 * Vue 3 + TypeScript + Composition API 版本
 *
 * 功能：
 * - 多维度搜索筛选（设备、类型、等级、日期范围、状态）
 * - 预警列表展示（卡片网格布局）
 * - 预警详情查看
 * - 状态更新（待处理、处理中、已完成、已归档、误报）
 * - 批量操作（批量处理、批量删除）
 * - 归档管理
 * - 数据导出
 */

import { onMounted } from 'vue';
import {
  Refresh,
  Delete,
  Download,
  Cpu,
  FolderOpened,
  Warning,
  Document,
  Grid,
  InfoFilled,
  Folder,
  WarningFilled,
} from '@element-plus/icons-vue';
import { useWarningManagement } from './composables/useWarningManagement';
import WarningDetail from './components/WarningDetail.vue';

// 使用业务逻辑 composable
const {
  // 状态
  searchForm,
  dateRange,
  warningList,
  loading,
  currentPage,
  pageSize,
  totalCount,
  selectedWarnings,
  cardHoverStates,
  availableArchives,
  archiveListLoading,

  // 对话框状态
  exportDialogVisible,
  exportFormat,
  exportLoading,
  remarkDialogVisible,
  currentProcessingWarningId,
  remarkForm,
  reportDialogVisible,
  reportWarningId,
  archiveDialogVisible,
  archiveWarningId,
  selectedArchiveId,
  falseAlarmDialogVisible,
  falseAlarmForm,
  deleteDialogVisible,
  deleteLoading,
  batchProcessDialogVisible,
  batchRemarkForm,
  warningDetailVisible,
  currentWarningDetail,
  currentCameraId,

  // 选项
  warningSkillOptions,

  // 方法
  getWarningList,
  resetSearch,
  handleSearch,
  handleWarning,
  toggleSelect,
  handleSelectPage,
  showCardCheckbox,
  hideCardCheckbox,
  goToReviewRecords,
  saveRemark,
  finishProcessing,
  closeRemarkDialog,
  confirmReport,
  closeReportDialog,
  closeArchiveDialog,
  confirmArchive,
  handleFalseAlarmArchive,
  handleBatchProcess,
  closeBatchProcessDialog,
  exportData,
  getExportSelectionText,
  hasActiveFilters,
  confirmExport,
  showDeleteDialog,
  confirmDelete,
  closeDeleteDialog,
  showWarningDetail,

  // 工具方法
  formatTime,
  getLevelClass,
  getLevelBadgeText,
  getCurrentWarningStatus,
  isProcessingDisabled,
  isArchiveDisabled,
  isFalseAlarmDisabled,

  // 分页
  handleSizeChange,
  handleCurrentChange,
} = useWarningManagement();

// ========== 事件处理 ==========

// 处理预警详情对话框事件
const handleWarningFromDetail = (warning: any) => {
  if (!warning || !warning.id) return;
  if (warning.action === 'record-added') {
    console.log('处理DetailDialog的确认处理事件:', warning);
    getWarningList();
  } else if (warning.action === 'finished') {
    console.log('处理DetailDialog的结束处理事件:', warning);
    getWarningList();
  } else {
    handleWarning(warning.id, 'markProcessed');
  }
};

const handleReportFromDetail = (warning: any) => {
  if (warning && warning.id) {
    handleWarning(warning.id, 'report');
  }
};

const handleArchiveFromDetail = (warning: any) => {
  if (warning && warning.id) {
    handleWarning(warning.id, 'archive');
  }
};

const handleFalseAlarmFromDetail = (warning: any) => {
  if (warning && warning.id) {
    handleWarning(warning.id, 'falseAlarm');
  }
};

// ========== 生命周期 ==========

onMounted(() => {
  getWarningList();
});
</script>

<style scoped>
/* 样式代码与原组件保持一致，这里省略以节省空间 */
/* 原组件的完整样式可以复制过来，保持不变 */

.warning-management-container {
  height: 100%;
  background: #fff;
  padding: 0;
  overflow: hidden;
}

.content-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 16px 8px 16px;
  overflow: hidden;
  box-sizing: border-box;
  background: #f5f7fa;
}

.search-filter-area {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(59, 130, 246, 0.1);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  min-height: 100px;
}

.search-row {
  display: flex;
  margin-bottom: 16px;
  flex-wrap: wrap;
  position: relative;
  z-index: 2;
}

.date-picker-wrapper,
.select-wrapper,
.input-wrapper {
  margin-right: 12px;
  margin-bottom: 10px;
}

.date-picker-wrapper {
  width: 360px;
}

.select-wrapper {
  width: 160px;
}

.input-wrapper {
  width: 160px;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
  position: relative;
  z-index: 2;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
}

.filter-buttons .el-button {
  margin-right: 8px;
  margin-bottom: 8px;
  border-color: #e4e7ed;
  background: #f5f7fa;
  color: #606266;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  margin-left: 8px;
  margin-bottom: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.warning-cards-container {
  flex: 1;
  height: calc(100vh - 240px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 12px;
  margin: 1px;
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 transparent;
  box-sizing: border-box;
}

.warning-cards-container::-webkit-scrollbar {
  width: 6px;
}

.warning-cards-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.warning-cards-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  transition: background 0.3s ease;
}

.warning-cards-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.warning-cards-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  padding: 12px;
  min-height: 100%;
  align-content: flex-start;
}

.warning-col {
  width: 100%;
  margin: 0;
}

.warning-card {
  height: 380px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 0;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;
  border: 1px solid #e5e7eb;
}

.warning-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.warning-card.selected {
  border: 2px solid #3b82f6;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
}

.warning-badges-container {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 6px;
  z-index: 10;
}

.warning-level-badge {
  display: inline-block;
  padding: 0 8px !important;
  height: 24px !important;
  line-height: 22px !important;
  font-size: 12px !important;
  border-radius: 6px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  border: 1px solid !important;
}

.warning-level-badge:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

.warning-level-badge.level-1-bg {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%) !important;
  color: #991b1b !important;
  border-color: #fca5a5 !important;
}

.warning-level-badge.level-2-bg {
  background: linear-gradient(135deg, #fffbeb 0%, #fed7aa 100%) !important;
  color: #92400e !important;
  border-color: #fbbf24 !important;
}

.warning-level-badge.level-3-bg {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  color: #1e40af !important;
  border-color: #93c5fd !important;
}

.warning-level-badge.level-4-bg {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
  color: #065f46 !important;
  border-color: #a7f3d0 !important;
}

.warning-status-badge {
  display: inline-block;
  padding: 0 8px !important;
  height: 24px !important;
  line-height: 22px !important;
  font-size: 12px !important;
  border-radius: 6px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  border: 1px solid !important;
}

.warning-status-badge.status-pending {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%) !important;
  color: #4b5563 !important;
  border-color: #d1d5db !important;
}

.warning-status-badge.status-processing {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  color: #1e40af !important;
  border-color: #93c5fd !important;
}

.warning-status-badge.status-completed {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
  color: #065f46 !important;
  border-color: #a7f3d0 !important;
}

.warning-status-badge.status-archived {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%) !important;
  color: #374151 !important;
  border-color: #9ca3af !important;
}

.select-checkbox {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  transition: all 0.2s ease;
}

.select-checkbox :deep(.el-checkbox) {
  margin: 0;
}

.warning-image {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  border-radius: 6px;
  background: linear-gradient(45deg, #0a1526, #1e3c72);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.warning-real-image,
.warning-video-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  position: relative;
}

.warning-real-image {
  padding: 0;
  overflow: hidden;
}

.warning-real-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  border-radius: 6px;
  transition: transform 0.3s ease;
}

.warning-real-image:hover img {
  transform: scale(1.05);
}

.warning-content {
  padding: 12px;
}

.warning-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 10px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.info-list {
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.info-item .label {
  color: #909399;
  flex-shrink: 0;
}

.info-item .value {
  color: #606266;
}

.time-item {
  margin-top: 8px;
}

.time-item .time {
  font-size: 12px;
  color: #909399;
}

.warning-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  border-top: 1px solid #ebeef5;
  padding-top: 8px;
  margin-top: 20px;
}

.warning-footer .el-button {
  margin: 0;
  padding: 4px 10px;
  font-size: 12px;
  min-width: auto;
}

.action-btn {
  padding: 8px 18px;
  font-size: 13px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 0 3px;
  font-weight: 500;
  border: 1px solid #dcdfe6;
  background: #ffffff;
  color: #606266;
}

.action-btn:hover {
  background: #ecf5ff;
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.level-1-bg {
  background-color: #fff0f0;
}

.level-2-bg {
  background-color: #fffbf0;
}

.level-3-bg {
  background-color: #ecf5ff;
}

.level-4-bg {
  background-color: #f0f9ff;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 60px 20px;
  color: #909399;
  text-align: center;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 12px;
}

.no-data p {
  font-size: 18px;
  margin: 0 0 12px 0;
  color: #4b5563;
  font-weight: 600;
}

.no-data-tip {
  font-size: 14px;
  color: #9ca3af;
  opacity: 0.9;
}

.pagination-section {
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  margin-top: 12px !important;
  padding: 16px 0 !important;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.export-dialog-content {
  padding: 15px 20px;
}

.export-info-section {
  margin-bottom: 20px;
}

.export-data-info {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.export-selection-info {
  margin: 10px 0;
  padding: 10px;
  background-color: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 6px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.export-format-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fafafa;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.format-desc {
  color: #909399;
  font-size: 12px;
  margin-left: 8px;
}

.export-filter-info {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.filter-info-title {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.filter-summary {
  min-height: 30px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.process-tip {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  border-left: 3px solid #909399;
}

.archive-dialog-content {
  padding: 10px 0;
}

.archive-info {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
}

.archive-selection {
  margin-bottom: 20px;
}

.archive-tip {
  margin-top: 10px;
}

.batch-process-info {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #fef7e0;
  border: 1px solid #faecd8;
  border-radius: 6px;
  margin-bottom: 16px;
}

.batch-process-tip {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  border-left: 3px solid #909399;
}

.delete-dialog-content {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
}

.delete-warning-icon {
  margin-right: 16px;
  flex-shrink: 0;
}

.delete-text {
  flex: 1;
}

.delete-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 8px 0;
}

.delete-desc {
  font-size: 14px;
  color: #606266;
  margin: 0 0 12px 0;
}

.delete-tip {
  padding: 8px 12px;
  background-color: #fef7e0;
  border: 1px solid #faecd8;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.archive-select-dropdown {
  z-index: 9999 !important;
}

/* 响应式调整 */
@media (max-width: 1920px) {
  .warning-cards-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 1600px) {
  .warning-cards-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1280px) {
  .warning-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .date-picker-wrapper {
    width: 100%;
    margin-right: 0;
  }

  .select-wrapper,
  .input-wrapper {
    width: calc(33.33% - 8px);
    min-width: 140px;
  }

  .filter-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-buttons {
    margin-bottom: 8px;
    width: 100%;
  }

  .action-buttons {
    width: 100%;
    justify-content: flex-end;
  }

  .warning-cards-container {
    height: calc(100vh - 260px) !important;
  }

  .search-filter-area {
    min-height: 130px !important;
  }
}

@media (max-width: 768px) {
  .warning-cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .select-wrapper,
  .input-wrapper {
    width: 100%;
    margin-right: 0;
  }

  .warning-management-container {
    height: 100% !important;
  }

  .warning-cards-container {
    height: calc(100vh - 320px) !important;
  }

  .search-filter-area {
    min-height: 180px !important;
  }

  .warning-card {
    height: 360px;
  }
}
</style>

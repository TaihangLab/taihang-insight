<!--
  审核记录页面
  Vue 3 + TypeScript + Composition API
-->
<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { useReviewRecords } from './composables/useReviewRecords';
import { REVIEW_TYPE_OPTIONS, WARNING_SKILL_OPTIONS } from '@/types/center/review.d';

// 异步组件
const WarningDetail = defineAsyncComponent(
  () => import('@/components/visionAI/monitoringWarning/warningDetail.vue'),
);

// 使用 composable
const {
  statistics,
  topData,
  searchForm,
  reviewList,
  pagination,
  loading,
  selectedRecords,
  cardHoverStates,
  showStatsPanel,
  warningDetailVisible,
  currentWarningDetail,
  filteredData,
  totalRecords,
  currentPageData,
  goBack,
  handleSearch,
  resetSearch,
  handleSelectAll,
  handleSelectPage,
  handleBatchExport,
  handleBatchDelete,
  handleRefresh,
  viewDetail,
  getReviewTypeText,
  getReviewTypeClass,
  toggleStatsPanel,
  toggleSelect,
  formatTimeDisplay,
  showCardCheckbox,
  hideCardCheckbox,
  handleSizeChange,
  handlePageChange,
  handleRestoreReview,
} = useReviewRecords();
</script>

<template>
  <div class="review-records-container" v-loading="loading">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button link @click="goBack" class="back-btn">
          <template #icon>
            <el-icon><i class="el-icon-arrow-left" /></el-icon>
          </template>
          智能复判记录
        </el-button>
      </div>
      <div class="header-right">
        <el-button link @click="toggleStatsPanel">
          <template #icon>
            <el-icon>
              <i :class="showStatsPanel ? 'el-icon-view' : 'el-icon-s-data'" />
            </el-icon>
          </template>
          {{ showStatsPanel ? '隐藏看板' : '显示看板' }}
        </el-button>
      </div>
    </div>

    <!-- 上半部分：数据统计卡片 -->
    <div class="statistics-card" v-if="showStatsPanel">
      <div class="stats-overview">
        <!-- 总体统计 -->
        <div class="overview-item">
          <div class="overview-label">智能复判数量</div>
          <div class="overview-value">{{ statistics.reviewed }}/{{ statistics.total }}</div>
          <div class="overview-subtitle">复判完成数/分析完成数</div>
        </div>

        <!-- 完成率 -->
        <div class="overview-item">
          <div class="overview-label">完成率</div>
          <div class="overview-value percentage-value">{{ statistics.percentage }}%</div>
          <div class="overview-subtitle">总体完成率</div>
        </div>

        <!-- TOP3排行 -->
        <div class="overview-ranking">
          <div class="ranking-header">
            <span class="ranking-title">智能复判数量TOP3</span>
            <div class="ranking-legend">
              <span class="legend-dot completed"></span>
              <span class="legend-text">复判完成数</span>
              <span class="legend-dot total"></span>
              <span class="legend-text">分析完成数</span>
            </div>
          </div>
          <div class="ranking-items">
            <div v-for="(item, index) in topData" :key="item.id" class="ranking-row">
              <div class="ranking-index" :style="{ backgroundColor: item.color }">
                {{ index + 1 }}
              </div>
              <div class="ranking-name">{{ item.name }}</div>
              <div class="ranking-progress">
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    :style="{ width: item.percentage + '%', backgroundColor: item.color }"
                  ></div>
                </div>
                <div class="ranking-stats">
                  <span class="completed-count">{{ item.count }}</span>
                  <span class="separator">/</span>
                  <span class="total-count">{{ item.total }}</span>
                  <span class="percentage-text">{{ item.percentage }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 下半部分：内容卡片 -->
    <div class="content-card">
      <!-- 筛选区域 -->
      <div class="filter-section">
        <div class="filter-tabs">
          <el-button size="small" @click="handleSelectAll">
            {{
              selectedRecords.length === filteredData.length && filteredData.length > 0
                ? '取消全选'
                : '全选'
            }}
          </el-button>
          <el-button size="small" @click="handleSelectPage">选择本页</el-button>
          <el-button
            size="small"
            :disabled="selectedRecords.length === 0"
            @click="handleBatchExport"
          >
            批量导出
          </el-button>
          <el-button
            size="small"
            :disabled="selectedRecords.length === 0"
            @click="handleBatchDelete"
          >
            删除
          </el-button>
        </div>

        <div class="filter-actions">
          <div class="filter-right">
            <el-button link @click="handleRefresh">
              <template #icon>
                <el-icon><i class="el-icon-refresh" /></el-icon>
              </template>
              刷新
            </el-button>
          </div>
        </div>
      </div>

      <!-- 搜索条件 -->
      <div class="search-section">
        <div class="search-row">
          <div class="search-item">
            <label>预警日期：</label>
            <el-date-picker
              v-model="searchForm.startDate"
              type="date"
              placeholder="开始日期"
              size="small"
              value-format="YYYY-MM-DD"
            />
            <span class="date-separator">-</span>
            <el-date-picker
              v-model="searchForm.endDate"
              type="date"
              placeholder="结束日期"
              size="small"
              value-format="YYYY-MM-DD"
            />
          </div>

          <div class="search-item">
            <label>复判类型：</label>
            <el-select v-model="searchForm.reviewType" placeholder="全部" size="small">
              <el-option
                v-for="option in REVIEW_TYPE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>

          <div class="search-item">
            <label>预警技能：</label>
            <el-select v-model="searchForm.warningSkill" placeholder="全部智能技能" size="small">
              <el-option
                v-for="option in WARNING_SKILL_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>

          <div class="search-item">
            <label>违规位置：</label>
            <el-input
              v-model="searchForm.warningLocation"
              placeholder="请输入违规位置"
              size="small"
              @keyup.enter="handleSearch"
            />
          </div>
        </div>

        <div class="search-row">
          <div class="search-item">
            <label>预警名称：</label>
            <el-input
              v-model="searchForm.warningName"
              placeholder="请输入预警名称"
              size="small"
              @keyup.enter="handleSearch"
            />
          </div>

          <div class="search-item">
            <label>预警ID：</label>
            <el-input
              v-model="searchForm.warningId"
              placeholder="请输入预警ID"
              size="small"
              @keyup.enter="handleSearch"
            />
          </div>

          <div class="search-actions">
            <el-button type="primary" size="small" @click="handleSearch">查询</el-button>
            <el-button size="small" @click="resetSearch">重置</el-button>
          </div>
        </div>
      </div>

      <!-- 复判记录列表 -->
      <div class="records-section">
        <div class="records-grid" v-if="currentPageData.length > 0">
          <div
            v-for="item in currentPageData"
            :key="item.id"
            class="record-card"
            :class="{ selected: selectedRecords.includes(item.id) }"
            @click="viewDetail(item)"
            @mouseenter="showCardCheckbox(item.id)"
            @mouseleave="hideCardCheckbox(item.id)"
          >
            <!-- 选择框 -->
            <div
              v-show="cardHoverStates[item.id] || selectedRecords.includes(item.id)"
              class="select-checkbox"
              @click="toggleSelect(item.id, $event)"
            >
              <el-checkbox
                :model-value="selectedRecords.includes(item.id)"
                @change="toggleSelect(item.id)"
                size="small"
              />
            </div>

            <div class="card-image">
              <img :src="item.image" :alt="item.title" />
            </div>

            <div class="card-content">
              <div class="card-title">{{ item.title }}</div>
              <div class="card-info">
                <div class="info-item">
                  <span class="label">设备名称：</span>
                  <span class="value">{{ item.cameraName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">违规位置：</span>
                  <span class="value">{{ item.location }}</span>
                </div>
                <div class="info-item time-item">
                  <span class="time">{{ formatTimeDisplay(item.startTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无数据提示 -->
        <div class="no-data" v-else>
          <el-icon><i class="el-icon-folder-opened" /></el-icon>
          <p>暂无复判记录数据</p>
          <span class="no-data-tip">请尝试调整筛选条件或联系管理员</span>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
          :current-page="pagination.currentPage"
          :page-sizes="[12, 18, 24, 30]"
          :page-size="pagination.pageSize"
          :total="totalRecords"
          layout="total, sizes, prev, pager, next, jumper"
          class="pagination-controls"
        />
      </div>

      <div style="height: 10px"></div>
    </div>

    <!-- 预警详情对话框 -->
    <WarningDetail
      v-model:visible="warningDetailVisible"
      :warning="currentWarningDetail"
      source="reviewRecords"
      @restore-review="handleRestoreReview"
    />
  </div>
</template>

<style scoped>
.review-records-container {
  height: 100%;
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%);
  padding: 12px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 页面头部 - 科技感样式 */
.page-header {
  background: #fff;
  padding: 12px 24px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.back-btn {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.back-btn:hover {
  color: #409eff;
}

/* 上半部分：数据统计卡片 - 科技感样式 */
.statistics-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
  margin-bottom: 12px;
  width: 100%;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.stats-overview {
  display: flex;
  align-items: stretch;
  padding: 12px 24px;
  gap: 24px;
  min-height: 60px;
}

/* 总体统计项 */
.overview-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 180px;
  padding: 0 20px;
  border-right: 1px solid #f0f0f0;
}

.overview-item:last-child {
  border-right: none;
}

.overview-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
  font-weight: 400;
}

.overview-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 2px;
  line-height: 1.2;
}

.overview-value.percentage-value {
  color: #409eff;
}

.overview-subtitle {
  font-size: 11px;
  color: #c0c4cc;
  line-height: 1.2;
}

/* TOP3排行区域 */
.overview-ranking {
  flex: 1;
  min-width: 0;
  padding-left: 20px;
}

.ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ranking-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.ranking-legend {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-dot.completed {
  background-color: #409eff;
}

.legend-dot.total {
  background-color: #dcdfe6;
}

.legend-text {
  font-size: 12px;
  color: #909399;
}

.ranking-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ranking-index {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
}

.ranking-name {
  flex: 1;
  font-size: 13px;
  color: #606266;
  min-width: 120px;
}

.ranking-progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.progress-track {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.ranking-stats {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  flex-shrink: 0;
}

.completed-count {
  font-weight: 500;
  color: #409eff;
}

.separator {
  color: #c0c4cc;
}

.total-count {
  color: #909399;
}

.percentage-text {
  font-weight: 500;
  color: #67c23a;
}

/* 下半部分：内容卡片 */
.content-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* 筛选区域 */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-actions {
  display: flex;
  align-items: center;
}

.filter-right {
  display: flex;
  align-items: center;
}

/* 搜索区域 */
.search-section {
  margin-bottom: 16px;
}

.search-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-row:last-child {
  margin-bottom: 0;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-item label {
  white-space: nowrap;
  font-size: 13px;
  color: #606266;
}

.date-separator {
  color: #909399;
}

.search-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* 记录列表区域 */
.records-section {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
}

.records-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.record-card {
  position: relative;
  background: #fff;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.record-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #409eff;
}

.record-card.selected {
  border-color: #409eff;
  background: #f0f7ff;
}

.select-checkbox {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  background: #fff;
  border-radius: 4px;
  padding: 4px;
}

.card-image {
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: #f5f5f5;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  padding: 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item {
  font-size: 12px;
  display: flex;
  align-items: center;
}

.info-item .label {
  color: #909399;
  flex-shrink: 0;
}

.info-item .value {
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-item.time-item {
  justify-content: center;
  margin-top: 8px;
}

.time {
  color: #409eff;
  font-size: 12px;
}

/* 无数据提示 */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
}

.no-data .el-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.no-data p {
  font-size: 16px;
  margin: 0 0 8px 0;
}

.no-data-tip {
  font-size: 13px;
  color: #c0c4cc;
}

/* 分页区域 */
.pagination-section {
  display: flex;
  justify-content: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.pagination-controls {
  display: flex;
  justify-content: center;
}
</style>

/**
 * 审核记录页面业务逻辑
 * Vue 3 Composable
 */

import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import centerAPI from '@/api/center';
import type {
  ReviewRecord,
  ReviewRecordQueryParams,
} from '@/types/center.d';
import type {
  ReviewRecordItem,
  ReviewRecordSearchForm,
  ReviewStatistics,
  TopRankingItem,
  ReviewType,
} from '@/types/center/review.d';

/**
 * 审核记录页面 Composable
 */
export function useReviewRecords() {
  const router = useRouter();

  // ========== 状态 ==========

  // 统计数据
  const statistics = ref<ReviewStatistics>({
    reviewed: 302,
    total: 325,
    percentage: 92.92,
  });

  // TOP3排行数据
  const topData = ref<TopRankingItem[]>([
    {
      id: 'bf21b82aa7...',
      name: 'bf21b82aa7...',
      count: 626,
      total: 6210,
      percentage: 99.94,
      color: '#409EFF',
    },
    {
      id: 'helmet_detection',
      name: '戴帽识别',
      count: 3972,
      total: 3972,
      percentage: 100.0,
      color: '#67C23A',
    },
    {
      id: 'person_crossing',
      name: '人员穿越线...',
      count: 164,
      total: 175,
      percentage: 93.71,
      color: '#E6A23C',
    },
  ]);

  // 搜索条件
  const searchForm = reactive<ReviewRecordSearchForm>({
    startDate: '',
    endDate: '',
    reviewType: '',
    warningSkill: '',
    warningLocation: '',
    warningName: '',
    warningId: '',
  });

  // 实际执行的搜索条件（点击查询按钮后更新）
  const activeSearchForm = reactive<ReviewRecordSearchForm>({
    startDate: '',
    endDate: '',
    reviewType: '',
    warningSkill: '',
    warningLocation: '',
    warningName: '',
    warningId: '',
  });

  // 复判记录列表
  const reviewList = ref<ReviewRecordItem[]>([]);

  // 分页
  const pagination = reactive({
    currentPage: 1,
    pageSize: 12,
    total: 0,
  });

  // 加载状态
  const loading = ref(false);

  // 选中的记录
  const selectedRecords = ref<string[]>([]);

  // 卡片悬停状态管理
  const cardHoverStates = ref<Record<string, boolean>>({});

  // 统计面板显示状态
  const showStatsPanel = ref(true);

  // 预警详情对话框
  const warningDetailVisible = ref(false);
  const currentWarningDetail = ref<ReviewRecordItem | null>(null);

  // ========== 计算属性 ==========

  /**
   * 筛选后的数据
   */
  const filteredData = computed(() => {
    let result = reviewList.value;

    // 按日期范围筛选
    if (activeSearchForm.startDate) {
      const startDate = new Date(activeSearchForm.startDate);
      result = result.filter((item) => {
        const itemDate = new Date(item.startTime);
        return itemDate >= startDate;
      });
    }

    if (activeSearchForm.endDate) {
      const endDate = new Date(activeSearchForm.endDate);
      endDate.setHours(23, 59, 59); // 包含当天的所有时间
      result = result.filter((item) => {
        const itemDate = new Date(item.startTime);
        return itemDate <= endDate;
      });
    }

    // 按复判类型筛选
    if (activeSearchForm.reviewType) {
      result = result.filter((item) => item.reviewType === activeSearchForm.reviewType);
    }

    // 按位置筛选
    if (activeSearchForm.warningLocation) {
      result = result.filter((item) =>
        item.location.toLowerCase().includes(activeSearchForm.warningLocation.toLowerCase()),
      );
    }

    // 按预警名称筛选
    if (activeSearchForm.warningName) {
      result = result.filter((item) =>
        item.title.toLowerCase().includes(activeSearchForm.warningName.toLowerCase()),
      );
    }

    // 按预警ID筛选
    if (activeSearchForm.warningId) {
      result = result.filter((item) => item.id.includes(activeSearchForm.warningId));
    }

    return result;
  });

  /**
   * 总记录数
   */
  const totalRecords = computed(() => filteredData.value.length);

  /**
   * 当前页数据
   */
  const currentPageData = computed(() => {
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredData.value.slice(start, end);
  });

  // ========== 方法 ==========

  /**
   * 返回上一页
   */
  const goBack = () => {
    router.go(-1);
  };

  /**
   * 获取复判记录列表
   */
  const getReviewList = async () => {
    loading.value = true;
    try {
      const apiParams: ReviewRecordQueryParams = {
        page: 1,
        limit: 1000, // 获取所有记录
        start_time: activeSearchForm.startDate || undefined,
        end_time: activeSearchForm.endDate || undefined,
      };

      const records = await centerAPI.reviewRecord.getReviewRecords(apiParams);

      if (Array.isArray(records)) {
        // 转换API数据格式为前端需要的格式
        reviewList.value = records.map((record: ReviewRecord) => ({
          id: record.id.toString(),
          title: `复判记录 #${record.id}`,
          image: `./images/5.jpg`, // 默认图片，实际项目中从API获取
          cameraName: '未知摄像头', // 需要从 alert 数据获取
          location: '未知位置', // 需要从 alert 数据获取
          startTime: record.created_at
            ? new Date(record.created_at)
                .toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                .replace(/\//g, '-')
            : '未知时间',
          duration: '2秒', // 默认值
          reviewType: record.review_result === 'correct' ? 'auto' : 'manual',
          reviewNotes: record.review_notes,
          reviewerName: record.reviewer_name,
          alertId: record.alert_id,
        }));
      } else {
        reviewList.value = [];
      }

      // 清空悬停状态
      cardHoverStates.value = {};
    } catch (error) {
      console.error('获取复判记录异常:', error);
      ElMessage.error('获取复判记录失败: ' + (error instanceof Error ? error.message : '网络错误'));
    } finally {
      loading.value = false;
    }
  };

  /**
   * 搜索
   */
  const handleSearch = () => {
    // 将搜索条件复制到活跃搜索条件，触发计算属性更新
    Object.assign(activeSearchForm, searchForm);

    pagination.currentPage = 1;
    selectedRecords.value = [];

    const totalCount = reviewList.value.length;
    const filteredCount = totalRecords.value;

    if (filteredCount === totalCount) {
      ElMessage.success('显示全部记录');
    } else if (filteredCount === 0) {
      ElMessage.warning('未找到匹配的记录，请调整搜索条件');
    } else {
      ElMessage.success(`找到 ${filteredCount} 条匹配记录，共 ${totalCount} 条`);
    }
  };

  /**
   * 重置搜索
   */
  const resetSearch = () => {
    Object.assign(searchForm, {
      startDate: '',
      endDate: '',
      reviewType: '',
      warningSkill: '',
      warningLocation: '',
      warningName: '',
      warningId: '',
    });
    Object.assign(activeSearchForm, {
      startDate: '',
      endDate: '',
      reviewType: '',
      warningSkill: '',
      warningLocation: '',
      warningName: '',
      warningId: '',
    });
    pagination.currentPage = 1;
    selectedRecords.value = [];
    cardHoverStates.value = {};
    ElMessage.info('搜索条件已重置');
  };

  /**
   * 全选/取消全选
   */
  const handleSelectAll = () => {
    if (selectedRecords.value.length === filteredData.value.length) {
      selectedRecords.value = [];
      ElMessage.info('已取消全选');
    } else {
      selectedRecords.value = filteredData.value.map((item) => item.id);
      ElMessage.success(`已选择 ${selectedRecords.value.length} 项记录`);
    }
  };

  /**
   * 选择本页
   */
  const handleSelectPage = () => {
    const currentPageIds = currentPageData.value.map((item) => item.id);

    if (currentPageIds.every((id) => selectedRecords.value.includes(id))) {
      selectedRecords.value = selectedRecords.value.filter((id) => !currentPageIds.includes(id));
      ElMessage.info('已取消选择本页');
    } else {
      const otherSelectedIds = selectedRecords.value.filter((id) => !currentPageIds.includes(id));
      selectedRecords.value = [...otherSelectedIds, ...currentPageIds];
      ElMessage.success(`已选择本页 ${currentPageIds.length} 项记录`);
    }
  };

  /**
   * 批量导出
   */
  const handleBatchExport = () => {
    if (selectedRecords.value.length === 0) {
      ElMessage.warning('请先选择要导出的记录');
      return;
    }

    try {
      const exportData = filteredData.value
        .filter((item) => selectedRecords.value.includes(item.id))
        .map((item) => ({
          预警名称: item.title,
          违规位置: item.cameraName,
          开始时间: item.startTime,
          复判类型: getReviewTypeText(item.reviewType),
        }));

      // 导出为CSV
      exportToCSV(
        exportData,
        `复判记录_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`,
      );
      ElMessage.success(`已导出 ${exportData.length} 条记录`);
    } catch (error) {
      console.error('导出失败:', error);
      ElMessage.error('导出失败，请稍后重试');
    }
  };

  /**
   * 导出为CSV
   */
  const exportToCSV = (data: Record<string, any>[], filename: string) => {
    if (data.length === 0) return;

    const firstRow = data[0];
    if (!firstRow) return;

    const headers = Object.keys(firstRow);
    const csvContent = [
      headers.join(','),
      ...data.map((row) => headers.map((header) => `"${row[header] || ''}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * 批量删除
   */
  const handleBatchDelete = async () => {
    if (selectedRecords.value.length === 0) {
      ElMessage.warning('请先选择要删除的记录');
      return;
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${selectedRecords.value.length} 项记录吗？删除后将无法恢复。`,
        '删除确认',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
        },
      );

      loading.value = true;

      // 调用API删除记录
      for (const id of selectedRecords.value) {
        await centerAPI.reviewRecord.deleteReviewRecord(parseInt(id));
      }

      // 从列表中移除选中项
      reviewList.value = reviewList.value.filter((item) => !selectedRecords.value.includes(item.id));

      // 如果当前页没有数据了，回到上一页
      if (currentPageData.value.length === 0 && pagination.currentPage > 1) {
        pagination.currentPage--;
      }

      // 清除选中状态
      selectedRecords.value = [];

      ElMessage.success(`已成功删除 ${selectedRecords.value.length} 项记录`);
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除失败:', error);
        ElMessage.error('删除失败，请稍后重试');
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * 刷新数据
   */
  const handleRefresh = async () => {
    await getReviewList();
    ElMessage.success('数据已刷新');
  };

  /**
   * 查看详情
   */
  const viewDetail = (item: ReviewRecordItem) => {
    console.log('查看详情:', item);
    currentWarningDetail.value = item;
    warningDetailVisible.value = true;
  };

  /**
   * 获取复判类型文本
   */
  const getReviewTypeText = (type: ReviewType) => {
    const typeMap: Record<ReviewType, string> = {
      auto: '多模态大模型复判',
      manual: '人工审核',
    };
    return typeMap[type] || '未知';
  };

  /**
   * 获取复判类型样式类
   */
  const getReviewTypeClass = (type: ReviewType) => {
    const classMap: Record<ReviewType, string> = {
      auto: 'review-type-auto',
      manual: 'review-type-manual',
    };
    return classMap[type] || '';
  };

  /**
   * 切换统计面板显示状态
   */
  const toggleStatsPanel = () => {
    showStatsPanel.value = !showStatsPanel.value;
  };

  /**
   * 切换选择状态
   */
  const toggleSelect = (id: string, event?: Event) => {
    if (event) {
      event.stopPropagation();
    }

    const index = selectedRecords.value.indexOf(id);
    if (index === -1) {
      selectedRecords.value.push(id);
    } else {
      selectedRecords.value.splice(index, 1);
    }
  };

  /**
   * 格式化时间显示
   */
  const formatTimeDisplay = (timeString: string): string => {
    try {
      if (
        typeof timeString === 'string' &&
        timeString.includes('年') &&
        timeString.includes('月') &&
        timeString.includes('日')
      ) {
        return timeString;
      }

      const date = new Date(timeString);

      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', timeString);
        return timeString;
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('Time formatting error:', error, timeString);
      return timeString || '';
    }
  };

  /**
   * 显示卡片选择框
   */
  const showCardCheckbox = (recordId: string) => {
    cardHoverStates.value[recordId] = true;
  };

  /**
   * 隐藏卡片选择框
   */
  const hideCardCheckbox = (recordId: string) => {
    cardHoverStates.value[recordId] = false;
  };

  /**
   * 分页大小变化
   */
  const handleSizeChange = (val: number) => {
    pagination.pageSize = val;
    pagination.currentPage = 1;
  };

  /**
   * 当前页变化
   */
  const handlePageChange = (val: number) => {
    pagination.currentPage = val;
  };

  /**
   * 处理还原复判事件
   */
  const handleRestoreReview = async (restoredWarning: ReviewRecordItem) => {
    try {
      console.log('还原复判的预警数据:', restoredWarning);

      // 从复判记录列表中移除该项
      reviewList.value = reviewList.value.filter((item) => item.id !== restoredWarning.id);

      // 如果当前页没有数据了，回到上一页
      if (currentPageData.value.length === 0 && pagination.currentPage > 1) {
        pagination.currentPage--;
      }

      // 清除选中状态
      selectedRecords.value = selectedRecords.value.filter((id) => id !== restoredWarning.id);

      ElMessage.success(`预警"${restoredWarning.title}"已成功还原到预警管理页面`);

      // 使用 localStorage 来模拟跨页面通信
      const restoredWarnings = JSON.parse(localStorage.getItem('restoredWarnings') || '[]');
      restoredWarnings.push({
        ...restoredWarning,
        restoredAt: new Date().toISOString(),
        restoredFrom: 'reviewRecords',
      });
      localStorage.setItem('restoredWarnings', JSON.stringify(restoredWarnings));
    } catch (error) {
      console.error('还原复判失败:', error);
      ElMessage.error('还原复判失败，请稍后重试');
    }
  };

  // ========== 生命周期 ==========

  onMounted(() => {
    getReviewList();
  });

  // ========== 返回 ==========

  return {
    // 状态
    statistics,
    topData,
    searchForm,
    activeSearchForm,
    reviewList,
    pagination,
    loading,
    selectedRecords,
    cardHoverStates,
    showStatsPanel,
    warningDetailVisible,
    currentWarningDetail,

    // 计算属性
    filteredData,
    totalRecords,
    currentPageData,

    // 方法
    goBack,
    getReviewList,
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
  };
}

/**
 * 预警档案页面业务逻辑
 * Vue 3 Composable
 */

import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import type {
  ArchiveListItem,
  ArchiveSearchForm,
  ArchiveDetailInfo,
  ArchiveAlertRecord,
  AvailableAlertItem,
  AvailableAlertFilters,
  ArchiveForm,
  DeleteType,
} from '@/types/center/archive.d';
import type { WarningItem } from '@/types/center/alert';
import centerAPI from '@/api/center';
import type { AlertArchive, Alert, AlertRecord, ArchiveQueryParams, AlertRecordQueryParams } from '@/types/center.d';

/**
 * 预警档案页面 Composable
 */
export function useWarningArchives() {
  // ========== 状态 ==========

  // 档案列表
  const archiveList = ref<ArchiveListItem[]>([]);
  const filteredArchiveList = computed(() => archiveList.value);

  // 档案列表分页
  const archivePagination = reactive({
    currentPage: 1,
    pageSize: 20,
    total: 0,
  });

  // 档案搜索条件
  const searchForm = reactive<ArchiveSearchForm>({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
  });

  // 当前选中的档案
  const currentArchiveId = ref<number | null>(null);
  const currentArchive = ref<ArchiveDetailInfo | null>(null);

  // 档案中的预警记录列表
  const alertRecords = ref<ArchiveAlertRecord[]>([]);
  const selectedAlertRecords = ref<number[]>([]);

  // 预警记录分页
  const recordPagination = reactive({
    currentPage: 1,
    pageSize: 20,
    total: 0,
  });

  // 加载状态
  const loading = ref(false);
  const archiveLoading = ref(false);
  const recordsLoading = ref(false);

  // 对话框状态
  const editDialogVisible = ref(false);
  const addArchiveDialogVisible = ref(false);
  const selectAlertDialogVisible = ref(false);
  const detailDialogVisible = ref(false);
  const currentDetail = ref<WarningItem | null>(null);

  // 编辑/新增表单
  const editForm = reactive<ArchiveForm>({
    name: '',
    location: '',
    timeRange: ['', ''],
    description: '',
    imageFile: null,
  });

  const newArchiveForm = reactive<ArchiveForm>({
    name: '',
    location: '',
    timeRange: ['', ''],
    description: '',
    imageFile: null,
  });

  // 可用预警（添加到档案）
  const availableAlerts = ref<AvailableAlertItem[]>([]);
  const selectedAvailableAlerts = ref<number[]>([]);
  const availableAlertsLoading = ref(false);
  const availableAlertsPagination = reactive({
    currentPage: 1,
    pageSize: 20,
    total: 0,
  });

  // 可用预警筛选条件
  const alertFilters = reactive<AvailableAlertFilters>({
    alertLevel: '',
    alertType: '',
    cameraName: '',
    status: '3', // 默认只显示已处理状态
    startTime: '',
    endTime: '',
    skillName: '',
    location: '',
    alertId: '',
  });

  // 删除确认
  const deleteConfirmVisible = ref(false);
  const deleteType = ref<DeleteType | null>(null);
  const deleteId = ref<number | null>(null);
  const deleteIds = ref<number[]>([]);

  // 图片上传
  const imagePreviewVisible = ref(false);
  const currentPreviewImage = ref<string | null>(null);

  // ========== 计算属性 ==========

  /**
   * 当前页的档案列表
   */
  const currentPageArchives = computed(() => {
    const start = (archivePagination.currentPage - 1) * archivePagination.pageSize;
    const end = start + archivePagination.pageSize;
    return filteredArchiveList.value.slice(start, end);
  });

  /**
   * 当前页的预警记录
   */
  const currentPageRecords = computed(() => {
    const start = (recordPagination.currentPage - 1) * recordPagination.pageSize;
    const end = start + recordPagination.pageSize;
    return alertRecords.value.slice(start, end);
  });

  /**
   * 当前页的可用预警
   */
  const currentPageAvailableAlerts = computed(() => {
    const start = (availableAlertsPagination.currentPage - 1) * availableAlertsPagination.pageSize;
    const end = start + availableAlertsPagination.pageSize;
    return availableAlerts.value.slice(start, end);
  });

  /**
   * 是否有选中的预警记录
   */
  const hasSelectedRecords = computed(() => selectedAlertRecords.value.length > 0);

  /**
   * 是否有选中的可用预警
   */
  const hasSelectedAvailableAlerts = computed(() => selectedAvailableAlerts.value.length > 0);

  // ========== 方法 ==========

  /**
   * 格式化时间显示
   */
  const formatTimeDisplay = (timeString: string): string => {
    try {
      const date = new Date(timeString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch {
      return timeString || '';
    }
  };

  /**
   * 获取预警等级文本
   */
  const getAlertLevelText = (level: number): string => {
    const levelMap: Record<number, string> = {
      1: '一级预警',
      2: '二级预警',
      3: '三级预警',
      4: '四级预警',
    };
    return levelMap[level] || '未知';
  };

  /**
   * 获取预警等级颜色
   */
  const getAlertLevelColor = (level: number): string => {
    const colorMap: Record<number, string> = {
      1: '#ff4d4f',
      2: '#faad14',
      3: '#fadb14',
      4: '#52c41a',
    };
    return colorMap[level] || '#d9d9d9';
  };

  /**
   * 获取档案列表
   */
  const getArchiveList = async () => {
    loading.value = true;
    try {
      const params: ArchiveQueryParams = {
        page: archivePagination.currentPage,
        limit: 1000, // 获取全部记录，前端分页
      };

      if (searchForm.name) {
        params.name = searchForm.name;
      }
      if (searchForm.location) {
        params.location = searchForm.location;
      }
      if (searchForm.startDate) {
        params.start_date = searchForm.startDate;
      }
      if (searchForm.endDate) {
        params.end_date = searchForm.endDate;
      }

      const response = await centerAPI.archive.getArchiveList(params);

      // 转换为前端格式
      archiveList.value = response.data.map((archive: AlertArchive) => ({
        id: archive.id,
        name: archive.name,
        location: archive.location,
        timeRange: `${formatTimeDisplay(archive.start_time)} ~ ${formatTimeDisplay(archive.end_time)}`,
        createTime: archive.created_at ? formatTimeDisplay(archive.created_at) : '',
        description: archive.description,
        alertCount: archive.alert_count || 0,
        image: '', // 需要从后端获取
        isSelected: archive.id === currentArchiveId.value,
      }));

      archivePagination.total = archiveList.value.length;

      // 如果有选中的档案且列表为空，清除选中状态
      if (currentArchiveId.value && archiveList.value.length === 0) {
        currentArchiveId.value = null;
        currentArchive.value = null;
        alertRecords.value = [];
      }
    } catch (error) {
      console.error('获取档案列表失败:', error);
      ElMessage.error('获取档案列表失败: ' + (error instanceof Error ? error.message : '网络错误'));
    } finally {
      loading.value = false;
    }
  };

  /**
   * 选择档案
   */
  const selectArchive = async (archiveId: number) => {
    currentArchiveId.value = archiveId;

    // 更新列表选中状态
    archiveList.value.forEach(item => {
      item.isSelected = item.id === archiveId;
    });

    // 加载档案详情
    await loadArchiveDetail(archiveId);

    // 加载档案中的预警记录
    await loadArchiveAlerts(archiveId);
  };

  /**
   * 加载档案详情
   */
  const loadArchiveDetail = async (archiveId: number) => {
    archiveLoading.value = true;
    try {
      const archive = await centerAPI.archive.getArchiveDetail(archiveId);

      currentArchive.value = {
        id: archive.id,
        name: archive.name,
        location: archive.location,
        timeRange: `${formatTimeDisplay(archive.start_time)} ~ ${formatTimeDisplay(archive.end_time)}`,
        createTime: archive.created_at ? formatTimeDisplay(archive.created_at) : '',
        description: archive.description,
        image: '', // 需要从后端获取
        start_time: archive.start_time,
        end_time: archive.end_time,
      };
    } catch (error) {
      console.error('获取档案详情失败:', error);
      ElMessage.error('获取档案详情失败');
    } finally {
      archiveLoading.value = false;
    }
  };

  /**
   * 加载档案中的预警记录
   */
  const loadArchiveAlerts = async (archiveId: number) => {
    recordsLoading.value = true;
    try {
      const params: AlertRecordQueryParams = {
        page: recordPagination.currentPage,
        limit: 1000, // 获取全部记录，前端分页
      };

      const response = await centerAPI.archive.getArchiveAlerts(archiveId, params);

      // 转换为前端格式
      alertRecords.value = response.data.map((record: AlertRecord) => ({
        id: record.id || 0,
        alertId: record.archive_id || 0,
        name: record.name,
        deviceName: record.device_name,
        imageUrl: record.violation_image_url || null,
        videoUrl: record.violation_video_url,
        alertTime: record.alert_time ? formatTimeDisplay(record.alert_time) : '',
        alertLevel: record.alert_level || 4,
        alertLevelText: getAlertLevelText(record.alert_level || 4),
        alertType: record.alert_type || '',
        location: record.location || '',
        skillName: '', // AlertRecord doesn't have skill_name
        description: record.description || '',
        isSelected: false,
      }));

      recordPagination.total = alertRecords.value.length;
      selectedAlertRecords.value = [];
    } catch (error) {
      console.error('获取预警记录失败:', error);
      ElMessage.error('获取预警记录失败');
    } finally {
      recordsLoading.value = false;
    }
  };

  /**
   * 搜索档案
   */
  const handleSearch = () => {
    archivePagination.currentPage = 1;
    getArchiveList();
  };

  /**
   * 重置搜索
   */
  const resetSearch = () => {
    searchForm.name = '';
    searchForm.location = '';
    searchForm.startDate = '';
    searchForm.endDate = '';
    archivePagination.currentPage = 1;
    getArchiveList();
  };

  /**
   * 打开新增档案对话框
   */
  const openAddArchiveDialog = () => {
    newArchiveForm.name = '';
    newArchiveForm.location = '';
    newArchiveForm.timeRange = ['', ''];
    newArchiveForm.description = '';
    newArchiveForm.imageFile = null;
    addArchiveDialogVisible.value = true;
  };

  /**
   * 打开编辑档案对话框
   */
  const openEditDialog = () => {
    if (!currentArchive.value) {
      ElMessage.warning('请先选择要编辑的档案');
      return;
    }

    editForm.name = currentArchive.value.name;
    editForm.location = currentArchive.value.location;
    editForm.timeRange = [currentArchive.value.start_time, currentArchive.value.end_time];
    editForm.description = currentArchive.value.description || '';
    editForm.imageFile = null;
    editDialogVisible.value = true;
  };

  /**
   * 创建档案
   */
  const createArchive = async () => {
    if (!editForm.name || !editForm.location || !editForm.timeRange[0] || !editForm.timeRange[1]) {
      ElMessage.warning('请填写完整的档案信息');
      return;
    }

    try {
      const createData = {
        name: editForm.name,
        location: editForm.location,
        start_time: editForm.timeRange[0],
        end_time: editForm.timeRange[1],
        description: editForm.description,
      };

      await centerAPI.archive.createArchive(createData);

      // 如果有图片，上传图片
      if (editForm.imageFile) {
        // 需要先获取创建后的档案ID，这里简化处理
        // 实际应该从返回值中获取
      }

      ElMessage.success('创建档案成功');
      addArchiveDialogVisible.value = false;
      await getArchiveList();
    } catch (error) {
      console.error('创建档案失败:', error);
      ElMessage.error('创建档案失败: ' + (error instanceof Error ? error.message : '网络错误'));
    }
  };

  /**
   * 更新档案
   */
  const updateArchive = async () => {
    if (!currentArchive.value) {
      return;
    }

    try {
      const updateData = {
        name: editForm.name,
        location: editForm.location,
        start_time: editForm.timeRange[0],
        end_time: editForm.timeRange[1],
        description: editForm.description,
      };

      await centerAPI.archive.updateArchive(currentArchive.value.id, updateData);

      ElMessage.success('更新档案成功');
      editDialogVisible.value = false;
      await getArchiveList();
      await loadArchiveDetail(currentArchive.value.id);
    } catch (error) {
      console.error('更新档案失败:', error);
      ElMessage.error('更新档案失败: ' + (error instanceof Error ? error.message : '网络错误'));
    }
  };

  /**
   * 确认删除档案
   */
  const confirmDeleteArchive = () => {
    if (!currentArchive.value) {
      return;
    }
    deleteType.value = 'archive';
    deleteId.value = currentArchive.value.id;
    deleteConfirmVisible.value = true;
  };

  /**
   * 执行删除
   */
  const executeDelete = async () => {
    if (deleteId.value === null) {
      return;
    }

    try {
      if (deleteType.value === 'archive') {
        await centerAPI.archive.deleteArchive(deleteId.value);
        ElMessage.success('删除档案成功');

        // 清除选中状态
        currentArchiveId.value = null;
        currentArchive.value = null;
        alertRecords.value = [];

        await getArchiveList();
      } else if (deleteType.value === 'single') {
        if (currentArchive.value) {
          await centerAPI.archive.deleteAlertRecord(deleteId.value, currentArchive.value.id);
          ElMessage.success('删除记录成功');
          await loadArchiveAlerts(currentArchive.value.id);
        }
      } else if (deleteType.value === 'batch') {
        if (currentArchive.value && deleteIds.value.length > 0) {
          await centerAPI.archive.batchDeleteAlertRecords(deleteIds.value);
          ElMessage.success(`批量删除 ${deleteIds.value.length} 条记录成功`);
          selectedAlertRecords.value = [];
          await loadArchiveAlerts(currentArchive.value.id);
        }
      }
    } catch (error) {
      console.error('删除失败:', error);
      ElMessage.error('删除失败: ' + (error instanceof Error ? error.message : '网络错误'));
    } finally {
      deleteConfirmVisible.value = false;
      deleteId.value = null;
      deleteIds.value = [];
    }
  };

  /**
   * 确认删除单条记录
   */
  const confirmDeleteRecord = (recordId: number) => {
    deleteType.value = 'single';
    deleteId.value = recordId;
    deleteConfirmVisible.value = true;
  };

  /**
   * 确认批量删除记录
   */
  const confirmBatchDeleteRecords = () => {
    if (selectedAlertRecords.value.length === 0) {
      ElMessage.warning('请先选择要删除的记录');
      return;
    }
    deleteType.value = 'batch';
    deleteIds.value = [...selectedAlertRecords.value];
    deleteConfirmVisible.value = true;
  };

  /**
   * 切换记录选中状态
   */
  const toggleRecordSelection = (recordId: number) => {
    const index = selectedAlertRecords.value.indexOf(recordId);
    if (index === -1) {
      selectedAlertRecords.value.push(recordId);
    } else {
      selectedAlertRecords.value.splice(index, 1);
    }

    // 更新记录的选中状态
    const record = alertRecords.value.find(r => r.id === recordId);
    if (record) {
      record.isSelected = selectedAlertRecords.value.includes(recordId);
    }
  };

  /**
   * 全选/取消全选当前页记录
   */
  const toggleSelectAllRecords = () => {
    const currentPageIds = currentPageRecords.value.map(r => r.id);

    if (currentPageIds.every(id => selectedAlertRecords.value.includes(id))) {
      // 取消全选
      selectedAlertRecords.value = selectedAlertRecords.value.filter(id => !currentPageIds.includes(id));
      currentPageRecords.value.forEach(r => r.isSelected = false);
    } else {
      // 全选
      currentPageIds.forEach(id => {
        if (!selectedAlertRecords.value.includes(id)) {
          selectedAlertRecords.value.push(id);
        }
      });
      currentPageRecords.value.forEach(r => r.isSelected = true);
    }
  };

  /**
   * 打开添加预警对话框
   */
  const openSelectAlertDialog = () => {
    if (!currentArchive.value) {
      ElMessage.warning('请先选择档案');
      return;
    }
    selectedAvailableAlerts.value = [];
    selectAlertDialogVisible.value = true;
    getAvailableAlerts();
  };

  /**
   * 获取可用预警列表
   */
  const getAvailableAlerts = async () => {
    availableAlertsLoading.value = true;
    try {
      const params: AlertRecordQueryParams = {
        page: availableAlertsPagination.currentPage,
        limit: 1000,
      };

      // 添加筛选条件
      if (alertFilters.alertLevel) {
        (params as any).alert_level = parseInt(alertFilters.alertLevel);
      }
      if (alertFilters.alertType) {
        (params as any).alert_type = alertFilters.alertType;
      }
      if (alertFilters.cameraName) {
        (params as any).device_name = alertFilters.cameraName;
      }
      if (alertFilters.status) {
        (params as any).status = parseInt(alertFilters.status);
      }
      if (alertFilters.startTime) {
        (params as any).start_time = alertFilters.startTime;
      }
      if (alertFilters.endTime) {
        (params as any).end_time = alertFilters.endTime;
      }
      if (alertFilters.skillName) {
        (params as any).skill_name = alertFilters.skillName;
      }
      if (alertFilters.location) {
        (params as any).location = alertFilters.location;
      }
      if (alertFilters.alertId) {
        (params as any).alert_id = parseInt(alertFilters.alertId);
      }

      const response = await centerAPI.archive.getAvailableAlerts(params);

      // 转换为前端格式
      availableAlerts.value = response.data.map((alert: Alert) => ({
        alertId: alert.id,
        alertName: alert.name,
        cameraName: alert.camera_name || '',
        alertTime: alert.alert_time ? formatTimeDisplay(alert.alert_time) : '',
        alertLevel: alert.alert_level,
        alertLevelText: getAlertLevelText(alert.alert_level),
        alertType: alert.alert_type || '',
        location: alert.location || '',
        skillName: '', // Alert doesn't have skill_name_zh in current type
        imageUrl: alert.violation_image_url || null,
        isSelected: false,
      }));

      availableAlertsPagination.total = availableAlerts.value.length;
    } catch (error) {
      console.error('获取可用预警失败:', error);
      ElMessage.error('获取可用预警失败');
    } finally {
      availableAlertsLoading.value = false;
    }
  };

  /**
   * 切换可用预警选中状态
   */
  const toggleAvailableAlertSelection = (alertId: number) => {
    const index = selectedAvailableAlerts.value.indexOf(alertId);
    if (index === -1) {
      selectedAvailableAlerts.value.push(alertId);
    } else {
      selectedAvailableAlerts.value.splice(index, 1);
    }

    // 更新预警的选中状态
    const alert = availableAlerts.value.find(a => a.alertId === alertId);
    if (alert) {
      alert.isSelected = selectedAvailableAlerts.value.includes(alertId);
    }
  };

  /**
   * 全选/取消全选当前页可用预警
   */
  const toggleSelectAllAvailableAlerts = () => {
    const currentPageIds = currentPageAvailableAlerts.value.map(a => a.alertId);

    if (currentPageIds.every(id => selectedAvailableAlerts.value.includes(id))) {
      // 取消全选
      selectedAvailableAlerts.value = selectedAvailableAlerts.value.filter(id => !currentPageIds.includes(id));
      currentPageAvailableAlerts.value.forEach(a => a.isSelected = false);
    } else {
      // 全选
      currentPageIds.forEach(id => {
        if (!selectedAvailableAlerts.value.includes(id)) {
          selectedAvailableAlerts.value.push(id);
        }
      });
      currentPageAvailableAlerts.value.forEach(a => a.isSelected = true);
    }
  };

  /**
   * 添加选中的预警到档案
   */
  const addSelectedAlertsToArchive = async () => {
    if (!currentArchive.value || selectedAvailableAlerts.value.length === 0) {
      return;
    }

    try {
      await centerAPI.archive.linkAlertsToArchive(
        currentArchive.value.id,
        selectedAvailableAlerts.value,
        '从可用预警列表添加',
      );

      ElMessage.success(`成功添加 ${selectedAvailableAlerts.value.length} 条预警到档案`);
      selectAlertDialogVisible.value = false;
      selectedAvailableAlerts.value = [];
      await loadArchiveAlerts(currentArchive.value.id);
    } catch (error) {
      console.error('添加预警失败:', error);
      ElMessage.error('添加预警失败: ' + (error instanceof Error ? error.message : '网络错误'));
    }
  };

  /**
   * 查看预警详情
   */
  const viewAlertDetail = (record: ArchiveAlertRecord) => {
    // TODO: 实现查看详情逻辑
    console.log('查看详情:', record);
    detailDialogVisible.value = true;
  };

  /**
   * 档案列表分页变化
   */
  const handleArchivePageChange = (page: number) => {
    archivePagination.currentPage = page;
  };

  /**
   * 档案列表每页数量变化
   */
  const handleArchiveSizeChange = (size: number) => {
    archivePagination.pageSize = size;
    archivePagination.currentPage = 1;
  };

  /**
   * 预警记录分页变化
   */
  const handleRecordPageChange = (page: number) => {
    recordPagination.currentPage = page;
  };

  /**
   * 预警记录每页数量变化
   */
  const handleRecordSizeChange = (size: number) => {
    recordPagination.pageSize = size;
    recordPagination.currentPage = 1;
  };

  /**
   * 可用预警分页变化
   */
  const handleAvailableAlertsPageChange = (page: number) => {
    availableAlertsPagination.currentPage = page;
    getAvailableAlerts();
  };

  /**
   * 上传档案图片
   */
  const uploadArchiveImage = async (file: File) => {
    if (!currentArchive.value) {
      ElMessage.warning('请先选择档案');
      return;
    }

    try {
      await centerAPI.archive.uploadArchiveImage(currentArchive.value.id, file);
      ElMessage.success('上传图片成功');
      await loadArchiveDetail(currentArchive.value.id);
    } catch (error) {
      console.error('上传图片失败:', error);
      ElMessage.error('上传图片失败');
    }
  };

  /**
   * 上传记录图片
   */
  const uploadRecordImage = async (recordId: number, file: File) => {
    try {
      await centerAPI.archive.uploadRecordImage(recordId, file);
      ElMessage.success('上传图片成功');
      if (currentArchive.value) {
        await loadArchiveAlerts(currentArchive.value.id);
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      ElMessage.error('上传图片失败');
    }
  };

  /**
   * 预览图片
   */
  const previewImage = (imageUrl: string) => {
    currentPreviewImage.value = imageUrl;
    imagePreviewVisible.value = true;
  };

  // ========== 生命周期 ==========

  onMounted(() => {
    getArchiveList();
  });

  // ========== 返回 ==========

  return {
    // 状态
    archiveList,
    filteredArchiveList,
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
    deleteType,
    imagePreviewVisible,
    currentPreviewImage,

    // 计算属性
    hasSelectedRecords,
    hasSelectedAvailableAlerts,

    // 方法
    formatTimeDisplay,
    getAlertLevelText,
    getAlertLevelColor,
    getArchiveList,
    selectArchive,
    loadArchiveDetail,
    loadArchiveAlerts,
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
    uploadArchiveImage,
    uploadRecordImage,
    previewImage,
  };
}

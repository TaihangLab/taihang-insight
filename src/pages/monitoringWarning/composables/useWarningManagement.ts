/**
 * 预警管理业务逻辑 Composable
 * 处理预警列表的数据获取、搜索、筛选、处理等操作
 */

import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import centerAPI from '@/api/center';
import type {
  WarningSearchForm,
  WarningItem,
  ApiAlertData,
  OperationHistory,
  ArchiveItem,
  AlertStatus,
  AlertStatusString,
  ExportFormat,
} from '@/types/center/alert';

export function useWarningManagement() {
  const router = useRouter();

  // ========== 响应式状态 ==========

  // 搜索表单
  const searchForm = reactive<WarningSearchForm>({
    device_name: '',
    start_date: '',
    end_date: '',
    alert_type: '',
    alert_level: '',
    warningSkill: '',
    warningName: '',
    warningId: '',
    status: '',
    location: '',
  });

  // 日期范围（用于日期选择器）
  const dateRange = ref<[string, string] | null>(null);

  // 数据列表
  const warningList = ref<WarningItem[]>([]);
  const loading = ref(false);

  // 分页
  const currentPage = ref(1);
  const pageSize = ref(20);
  const totalCount = ref(0);

  // 选择状态
  const selectedWarnings = ref<string[]>([]);
  const cardHoverStates = reactive<Record<string, boolean>>({});

  // 档案列表
  const availableArchives = ref<ArchiveItem[]>([]);
  const archiveListLoading = ref(false);

  // ========== 计算属性 ==========

  // 默认档案
  const defaultArchive = computed(() => {
    return availableArchives.value.find((archive) => archive.isDefault);
  });

  // ========== 监听器 ==========

  // 监听日期范围变化
  watch(dateRange, (newVal) => {
    if (newVal) {
      searchForm.start_date = newVal[0];
      searchForm.end_date = newVal[1];
    }
  });

  // ========== 数据获取方法 ==========

  /**
   * 获取预警列表
   */
  const getWarningList = async () => {
    loading.value = true;
    try {
      // 构建API请求参数
      const apiParams: Record<string, any> = {
        page: currentPage.value,
        limit: pageSize.value,
        start_date: searchForm.start_date,
        end_date: searchForm.end_date,
        alert_level: searchForm.alert_level,
        alert_type: searchForm.alert_type,
        alert_name: searchForm.warningName,
        alert_id: searchForm.warningId,
        device_name: searchForm.device_name,
        status: searchForm.status,
      };

      // 过滤空值参数
      Object.keys(apiParams).forEach((key) => {
        if (apiParams[key] === '' || apiParams[key] == null) {
          delete apiParams[key];
        }
      });

      console.log('获取预警列表 - 请求参数:', apiParams);

      // 调用API - 响应拦截器会返回 { data, total, page, limit, pages }
      const apiResponse = await centerAPI.alert.getRealTimeAlerts(apiParams) as any;
      console.log('获取预警列表 - API响应:', apiResponse);

      // 响应拦截器已将数据提取为 { data, total, page, limit, pages } 格式
      if (apiResponse && apiResponse.data) {
        // 转换数据格式 - Alert[] -> ApiAlertData[]
        // 由于后端返回的 Alert 类型字段有限，我们需要将其转换为 ApiAlertData 格式
        const apiData: ApiAlertData[] = (apiResponse.data || []).map((item: any) => ({
          alert_id: item.id || item.alert_id || 0,
          alert_time: item.alert_time || item.created_at || new Date().toISOString(),
          alert_type: item.alert_type || '',
          alert_level: item.alert_level || 1,
          alert_name: item.name || item.alert_name || '',
          alert_description: item.description || item.alert_description || '',
          location: item.location || '',
          camera_id: item.camera_id || 0,
          camera_name: item.camera_name || item.device_name || '',
          task_id: item.task_id || 0,
          minio_frame_url: item.violation_image_url || item.minio_frame_url || null,
          minio_video_url: item.violation_video_url || item.minio_video_url || null,
          status: item.status || 1,
          processed_at: item.processed_at,
          processed_by: item.processed_by,
          processing_notes: item.processing_notes || item.notes || '',
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        }));

        warningList.value = transformApiDataToPageData(apiData);

        // 更新分页信息
        totalCount.value = apiResponse.total || apiData.length || 0;
        currentPage.value = apiResponse.page || 1;
        pageSize.value = apiResponse.limit || pageSize.value;

        console.log('预警列表转换完成:', warningList.value.length, '条数据，总数:', totalCount.value);
      } else {
        console.error('获取预警列表失败:', apiResponse);
        ElMessage.error('获取预警列表失败');
        warningList.value = [];
        totalCount.value = 0;
      }

      // 清空选择和悬停状态
      selectedWarnings.value = [];
      Object.keys(cardHoverStates).forEach((key) => delete cardHoverStates[key]);
    } catch (error: any) {
      console.error('获取预警列表异常:', error);
      ElMessage.error('获取预警列表失败：' + (error.message || '网络错误'));
      warningList.value = [];
      totalCount.value = 0;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 转换API数据为页面数据格式
   */
  const transformApiDataToPageData = (apiData: ApiAlertData[]): WarningItem[] => {
    if (!Array.isArray(apiData)) {
      console.warn('API数据格式不正确，期望数组:', apiData);
      return [];
    }

    return apiData.map((item) => {
      // 预警等级映射
      const levelMap: Record<number, string> = {
        1: '一级预警',
        2: '二级预警',
        3: '三级预警',
        4: '四级预警',
      };

      // 状态映射
      const statusMap: Record<AlertStatus, AlertStatusString> = {
        1: 'pending',
        2: 'processing',
        3: 'completed',
        4: 'archived',
        5: 'falseAlarm',
      };

      // 处理操作历史
      const operationHistory: OperationHistory[] = [];
      if (item.process?.steps && Array.isArray(item.process.steps)) {
        item.process.steps.forEach((step) => {
          operationHistory.push({
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: step.step || '预警产生',
            time: step.time || item.alert_time,
            description: step.desc || item.alert_description,
            operationType: step.step === '预警产生' ? 'create' : 'process',
            operator: step.operator || '系统',
          });
        });
      }

      // 添加基础记录
      if (operationHistory.length === 0) {
        operationHistory.push({
          id: Date.now() + Math.random(),
          status: 'completed',
          statusText: '预警产生',
          time: item.alert_time || item.created_at,
          description: item.alert_description || '系统检测到异常情况',
          operationType: 'create',
          operator: '系统',
        });
      }

      // 根据状态添加相应记录
      if (item.status === 1 || item.status === undefined || item.status === null) {
        operationHistory.push({
          id: Date.now() + Math.random() + 1,
          status: 'active',
          statusText: '待处理',
          time: item.created_at || item.alert_time,
          description: '预警已产生，等待处理人员确认并开始处理',
          operationType: 'pending',
          operator: '',
        });
      } else if (item.status === 2) {
        operationHistory.push({
          id: Date.now() + Math.random() + 1,
          status: 'active',
          statusText: '处理中',
          time: item.created_at || item.alert_time,
          description: '预警正在处理中',
          operationType: 'processing',
          operator: '处理人员',
        });
      } else if (item.status === 3) {
        operationHistory.push({
          id: Date.now() + Math.random() + 1,
          status: 'completed',
          statusText: '已处理',
          time: item.created_at || item.alert_time,
          description: '预警处理已完成',
          operationType: 'completed',
          operator: '处理人员',
        });
      } else if (item.status === 4) {
        operationHistory.push({
          id: Date.now() + Math.random() + 1,
          status: 'completed',
          statusText: '已归档',
          time: item.created_at || item.alert_time,
          description: '预警已归档',
          operationType: 'archive',
          operator: '管理员',
        });
      } else if (item.status === 5) {
        operationHistory.push({
          id: Date.now() + Math.random() + 1,
          status: 'completed',
          statusText: '误报',
          time: item.created_at || item.alert_time,
          description: '预警已标记为误报',
          operationType: 'falseAlarm',
          operator: '管理员',
        });
      }

      return {
        id: String(item.alert_id || Date.now()),
        deviceName: item.alert_name || '未知预警',
        imageUrl: item.minio_frame_url || null,
        value: 1,
        unit: '件',
        level: levelMap[item.alert_level] || '未知等级',
        time: formatApiTime(item.alert_time || item.created_at),
        status: statusMap[item.status] || 'pending',
        cameraId: String(item.camera_id || 'unknown'),
        deviceInfo: {
          name: item.camera_name || '未知摄像头',
          position: item.location || '未知位置',
        },
        device: item.camera_name || '未知摄像头',
        type: item.alert_type || item.alert_name || '未知类型',
        location: item.location || '未知位置',
        locationId: `loc_${item.camera_id || 'unknown'}`,
        description: item.alert_description || '未知描述',
        skill: item.alert_type || 'unknown_skill',
        remark: item.processing_notes || '',
        operationHistory,
        _apiData: item,
      };
    });
  };

  /**
   * 格式化API时间
   */
  const formatApiTime = (timeString: string): string => {
    if (!timeString) return new Date().toLocaleString();

    try {
      if (timeString.includes('T')) {
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
      }
      return timeString;
    } catch (error) {
      console.warn('时间格式转换失败:', timeString, error);
      return timeString || new Date().toLocaleString();
    }
  };

  /**
   * 加载可用档案列表
   */
  const loadAvailableArchives = async () => {
    try {
      archiveListLoading.value = true;

      const response = await centerAPI.archive.getArchiveList({
        page: 1,
        limit: 100,
        status: 1,
      });

      console.log('预警管理 - 获取档案列表响应:', response);

      if (Array.isArray(response)) {
        availableArchives.value = response;
        console.log('预警管理 - 加载档案列表成功:', availableArchives.value.length, '个档案');
      } else {
        console.warn('预警管理 - 获取档案列表格式异常:', response);
        availableArchives.value = [];
      }

      if (availableArchives.value.length === 0) {
        console.warn('预警管理 - 当前没有可用档案，请先在预警档案页面创建档案');
      }
    } catch (error) {
      console.error('预警管理 - 加载档案列表失败:', error);
      availableArchives.value = [];
      ElMessage.warning('加载档案列表失败，请检查网络连接或联系管理员');
    } finally {
      archiveListLoading.value = false;
    }
  };

  // ========== 搜索和筛选方法 ==========

  /**
   * 重置搜索
   */
  const resetSearch = () => {
    Object.assign(searchForm, {
      device_name: '',
      start_date: '',
      end_date: '',
      alert_type: '',
      alert_level: '',
      warningSkill: '',
      warningName: '',
      warningId: '',
      status: '',
      location: '',
    });
    dateRange.value = null;
    currentPage.value = 1;
    getWarningList();
  };

  /**
   * 执行搜索
   */
  const handleSearch = () => {
    currentPage.value = 1;
    getWarningList();
  };

  // ========== 预警操作方法 ==========

  /**
   * 处理预警事件
   */
  const handleWarning = async (id: string, action: string) => {
    try {
      loading.value = true;
      console.log('warningManagement处理预警:', id, action);

      const index = warningList.value.findIndex((item) => item.id === id);
      if (index === -1) {
        console.error('未找到预警项:', id);
        return;
      }

      if (action === 'markProcessed') {
        // 处理预警 - 统一处理逻辑
        const warningItem = warningList.value[index];
        if (warningItem) {
          handleWarningFromList(warningItem);
        }
        loading.value = false;
        return;
      } else if (action === 'report') {
        // 上报
        reportWarningId.value = id;
        reportDialogVisible.value = true;
        return;
      } else if (action === 'archive') {
        // 归档
        archiveWarningId.value = id;
        await handleArchiveProcess();
        return;
      } else if (action === 'falseAlarm') {
        // 误报
        archiveWarningId.value = id;
        const warningItem = warningList.value[index];
        if (warningItem) {
          currentCameraId.value = warningItem.cameraId || '';
        }
        falseAlarmDialogVisible.value = true;
        return;
      }

      // 从选中列表移除
      const selectedIndex = selectedWarnings.value.indexOf(id);
      if (selectedIndex !== -1) {
        selectedWarnings.value.splice(selectedIndex, 1);
      }
    } catch (error) {
      console.error('处理失败:', error);
      ElMessage.error('处理预警失败');
    } finally {
      loading.value = false;
    }
  };

  // ========== 对话框状态 ==========

  const exportDialogVisible = ref(false);
  const exportFormat = ref<ExportFormat>('csv' as ExportFormat);
  const exportLoading = ref(false);

  const remarkDialogVisible = ref(false);
  const currentProcessingWarningId = ref('');
  const remarkForm = reactive({ remark: '' });

  const reportDialogVisible = ref(false);
  const reportWarningId = ref('');

  const archiveDialogVisible = ref(false);
  const archiveWarningId = ref('');
  const selectedArchiveId = ref<string | number>('');

  const falseAlarmDialogVisible = ref(false);
  const falseAlarmForm = reactive({ reviewNotes: '' });

  const deleteDialogVisible = ref(false);
  const deleteLoading = ref(false);

  const batchProcessDialogVisible = ref(false);
  const batchRemarkForm = reactive({ remark: '' });

  const warningDetailVisible = ref(false);
  const currentWarningDetail = ref<WarningItem | null>(null);
  const currentCameraId = ref('');

  // ========== 工具方法 ==========

  /**
   * 获取当前时间
   */
  const getCurrentTime = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  /**
   * 获取当前用户名
   */
  const getCurrentUserName = (): string => {
    const savedUserName = localStorage.getItem('currentUserName');
    if (savedUserName) {
      return savedUserName;
    }
    return '系统用户';
  };

  /**
   * 格式化时间显示
   */
  const formatTime = (timeString: string): string => {
    try {
      if (timeString.includes(' ')) {
        const parts = timeString.split(' ');
        const date = parts[0];
        const time = parts[1];
        if (date) {
          const [year, month, day] = date.split('-');
          return `${year}年${month}月${day}日 ${time || ''}`;
        }
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  /**
   * 获取等级样式类名
   */
  const getLevelClass = (level: string): string => {
    const classMap: Record<string, string> = {
      一级预警: 'level-1-bg',
      二级预警: 'level-2-bg',
      三级预警: 'level-3-bg',
      四级预警: 'level-4-bg',
    };
    return classMap[level] || '';
  };

  /**
   * 获取等级标签文本
   */
  const getLevelBadgeText = (level: string): string => {
    const levelMap: Record<string, string> = {
      一级预警: '一级',
      二级预警: '二级',
      三级预警: '三级',
      四级预警: '四级',
    };
    return levelMap[level] || '未知';
  };

  /**
   * 获取当前预警状态
   */
  const getCurrentWarningStatus = (warning: WarningItem) => {
    // 优先使用API返回的status字段
    if (warning._apiData && typeof warning._apiData.status !== 'undefined') {
      const statusMap: Record<AlertStatus, { text: string; class: string }> = {
        1: { text: '待处理', class: 'status-pending' },
        2: { text: '处理中', class: 'status-processing' },
        3: { text: '已处理', class: 'status-completed' },
        4: { text: '已归档', class: 'status-archived' },
        5: { text: '误报', class: 'status-false-alarm' },
      };
      return statusMap[warning._apiData.status] || { text: '未知', class: 'status-pending' };
    }

    // 回退到字符串状态
    if (!warning.operationHistory || warning.operationHistory.length === 0) {
      return { text: '待处理', class: 'status-pending' };
    }

    if (warning.status === 'archived') {
      return { text: '已归档', class: 'status-archived' };
    }
    if (warning.status === 'falseAlarm') {
      return { text: '误报', class: 'status-false-alarm' };
    }
    if (warning.status === 'completed') {
      return { text: '已处理', class: 'status-completed' };
    }

    const hasArchived = warning.operationHistory.some(
      (record) => record.operationType === 'archive' || record.operationType === 'falseAlarm',
    );
    if (hasArchived) {
      return { text: '已归档', class: 'status-archived' };
    }

    const hasCompleted = warning.operationHistory.some(
      (record) => record.operationType === 'completed',
    );
    if (hasCompleted) {
      return { text: '已处理', class: 'status-completed' };
    }

    const hasProcessing = warning.operationHistory.some(
      (record) => record.operationType === 'processing',
    );
    if (hasProcessing) {
      return { text: '处理中', class: 'status-processing' };
    }

    return { text: '待处理', class: 'status-pending' };
  };

  /**
   * 检查处理按钮是否禁用
   */
  const isProcessingDisabled = (warning: WarningItem): boolean => {
    if (!warning.operationHistory || warning.operationHistory.length === 0) {
      return false;
    }

    if (
      warning.status === 'archived' ||
      warning.status === 'falseAlarm' ||
      warning.status === 'completed'
    ) {
      return true;
    }

    const hasArchived = warning.operationHistory.some(
      (record) => record.operationType === 'archive' || record.operationType === 'falseAlarm',
    );
    if (hasArchived) return true;

    const hasCompleted = warning.operationHistory.some(
      (record) => record.operationType === 'completed',
    );
    if (hasCompleted) return true;

    return false;
  };

  /**
   * 检查归档按钮是否禁用
   */
  const isArchiveDisabled = (warning: WarningItem): boolean => {
    if (warning._apiData && typeof warning._apiData.status !== 'undefined') {
      return warning._apiData.status !== 3;
    }

    if (warning.status === 'archived' || warning.status === 'falseAlarm') {
      return true;
    }

    if (!warning.operationHistory || warning.operationHistory.length === 0) {
      return true;
    }

    const hasArchived = warning.operationHistory.some(
      (record) => record.operationType === 'archive' || record.operationType === 'falseAlarm',
    );
    if (hasArchived) return true;

    const hasCompleted = warning.operationHistory.some(
      (record) => record.operationType === 'completed',
    );
    return !hasCompleted;
  };

  /**
   * 检查误报按钮是否禁用
   */
  const isFalseAlarmDisabled = (warning: WarningItem): boolean => {
    if (warning._apiData && warning._apiData.status !== undefined) {
      return warning._apiData.status !== 1;
    }

    if (warning.status) {
      return warning.status !== 'pending';
    }

    return true;
  };

  // ========== 选择和批量操作 ==========

  /**
   * 切换选择状态
   */
  const toggleSelect = (id: string) => {
    const index = selectedWarnings.value.indexOf(id);
    if (index === -1) {
      selectedWarnings.value.push(id);
    } else {
      selectedWarnings.value.splice(index, 1);
    }
  };

  /**
   * 选择本页
   */
  const handleSelectPage = () => {
    const currentPageIds = warningList.value.map((item) => item.id);
    const isCurrentPageFullySelected = currentPageIds.every((id) =>
      selectedWarnings.value.includes(id),
    );

    if (isCurrentPageFullySelected) {
      selectedWarnings.value = selectedWarnings.value.filter((id) => !currentPageIds.includes(id));
      ElMessage.info('已取消选择本页');
    } else {
      const otherSelectedIds = selectedWarnings.value.filter((id) => !currentPageIds.includes(id));
      selectedWarnings.value = [...otherSelectedIds, ...currentPageIds];
      ElMessage.success(`已选择本页 ${currentPageIds.length} 项预警`);
    }
  };

  /**
   * 卡片悬停状态控制
   */
  const showCardCheckbox = (warningId: string) => {
    cardHoverStates[warningId] = true;
  };

  const hideCardCheckbox = (warningId: string) => {
    cardHoverStates[warningId] = false;
  };

  // ========== 路由跳转 ==========

  /**
   * 跳转到复判记录页面
   */
  const goToReviewRecords = () => {
    router.push({ name: 'reviewRecords' }).catch((error) => {
      console.error('路由跳转失败:', error);
      ElMessage.error('页面跳转失败，请稍后重试');
    });
  };

  // ========== 预警技能选项（示例数据）==========
  const warningSkillOptions = ref([
    { label: '安全帽检测', value: 'helmet' },
    { label: '安全带检测', value: 'safety_belt' },
    { label: '防护服检测', value: 'protective_clothing' },
    { label: '人员检测', value: 'person' },
    { label: '烟火检测', value: 'fire_smoke' },
  ]);

  // TODO: 这里还有很多方法需要实现
  // 为了节省空间，先创建基础结构
  // 后续会补充完整实现

  const handleArchiveProcess = async () => {
    try {
      // 获取当前预警信息
      const index = warningList.value.findIndex((item) => item.id === archiveWarningId.value);
      if (index === -1) {
        ElMessage.error('未找到预警信息');
        return;
      }

      const warningInfo = warningList.value[index];
      if (!warningInfo) {
        loading.value = false;
        return;
      }

      // 检查预警状态，只有已处理状态（status=3）才能归档
      if (warningInfo._apiData && warningInfo._apiData.status !== 3) {
        const statusNames: Record<number, string> = {
          1: '待处理',
          2: '处理中',
          3: '已处理',
          4: '已归档',
          5: '误报',
        };
        const currentStatusName = statusNames[warningInfo._apiData.status] || '未知状态';
        ElMessage.warning(`只有已处理状态的预警才能归档，当前状态为：${currentStatusName}`);
        loading.value = false;
        return;
      }

      console.log('📁 开始归档流程，当前档案列表长度:', availableArchives.value.length);

      // 刷新档案列表
      await loadAvailableArchives();

      console.log('📁 刷新后档案列表长度:', availableArchives.value.length);

      // 显示档案选择对话框
      archiveDialogVisible.value = true;
      selectedArchiveId.value = '';

      console.log('📁 显示档案选择对话框，可用档案数:', availableArchives.value.length);

      // 如果没有档案，提示用户
      if (availableArchives.value.length === 0) {
        ElMessage.warning('当前没有可用档案，请先创建档案');
      }
    } catch (error) {
      console.error('❌ 打开归档对话框失败:', error);
      ElMessage.error('打开归档对话框失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleWarningFromList = (warning: WarningItem) => {
    console.log('🖱️ warningManagement点击处理按钮, 预警ID:', warning && warning.id);

    if (warning && warning.id) {
      // 检查当前是否已经在处理中
      const hasProcessingRecord =
        warning.operationHistory &&
        warning.operationHistory.some(
          (record) => record.operationType === 'processing' && record.status === 'active',
        );

      if (hasProcessingRecord) {
        console.log('📝 预警已在处理中，直接打开处理对话框');
        // 如果已经有处理中记录，直接弹出处理意见对话框
        currentProcessingWarningId.value = warning.id;
        remarkDialogVisible.value = true;
      } else {
        console.log('🆕 开始新的处理流程');
        // 如果没有处理中记录，先添加"处理中"状态
        startProcessingWarning(warning);
      }
    } else {
      console.error('❌ 无效的预警数据:', warning);
      ElMessage.error('预警数据无效，无法处理');
    }
  };

  /**
   * 开始处理预警
   */
  const startProcessingWarning = async (warning: WarningItem) => {
    try {
      loading.value = true;

      console.log('🔄 开始处理预警:', warning.id);

      // 1. 先调用后端API更新状态为"处理中"
      const apiAlertId = warning._apiData ? warning._apiData.alert_id : parseInt(warning.id);
      const updateData = {
        status: 2, // 处理中状态
        processing_notes: '开始处理预警',
        processed_by: getCurrentUserName(),
      } as any;

      // 发送真实的API请求
      await centerAPI.alert.updateAlertStatus(apiAlertId, updateData);
      console.log('✅ 后端状态更新成功');

      // 2. 后端更新成功后，更新本地状态
      const index = warningList.value.findIndex((item) => String(item.id) === String(warning.id));
      if (index !== -1) {
        const warningItem = warningList.value[index];
        if (warningItem) {
          // 更新 _apiData.status 字段为处理中
          if (warningItem._apiData) {
            warningItem._apiData.status = 2;
          }

          // 同时更新前端使用的 status 字段
          warningItem.status = 'processing';

          // 确保有操作历史数组
          if (!warningItem.operationHistory) {
            warningItem.operationHistory = [];
          }

          // 更新待处理记录为已完成状态
          if (warningItem.operationHistory) {
            warningItem.operationHistory = warningItem.operationHistory.map(
              (record) => {
                if (record.operationType === 'pending' && record.status === 'active') {
                  return {
                    ...record,
                    status: 'completed',
                    description: '预警已确认，开始处理',
                  };
                }
                return record;
              },
            );
          }

          // 添加处理中记录
          const newRecord: OperationHistory = {
            id: Date.now() + Math.random(),
            status: 'active',
            statusText: '处理中',
            time: getCurrentTime(),
            description: '处理人员正在处理此预警，可添加处理记录',
            operationType: 'processing',
            operator: getCurrentUserName(),
          };

          if (warningItem.operationHistory) {
            warningItem.operationHistory.unshift(newRecord);
          }

          console.log('✅ 开始处理，本地状态已更新为处理中:', warningItem);
        }
      }

      // 3. 弹出处理意见对话框
      currentProcessingWarningId.value = warning.id;
      remarkDialogVisible.value = true;

      ElMessage.success('预警已开始处理');
    } catch (error) {
      console.error('❌ 开始处理预警失败:', error);
      ElMessage.error(
        '开始处理失败: ' +
          (error instanceof Error ? error.message : '未知错误'),
      );
    } finally {
      loading.value = false;
    }
  };

  /**
   * 保存处理备注
   */
  const saveRemark = async () => {
    if (!remarkForm.remark.trim()) {
      ElMessage.warning('请输入处理意见');
      return;
    }

    try {
      loading.value = true;

      const warningId = currentProcessingWarningId.value;
      console.log('🔍 saveRemark - 查找预警ID:', warningId);

      const warning = warningList.value.find((item) => String(item.id) === String(warningId));
      if (!warning) {
        console.error('❌ 未找到预警信息，warningId:', warningId);
        ElMessage.error('未找到预警信息，请刷新页面后重试');
        return;
      }

      console.log('✅ 找到预警信息:', warning.id);

      // 准备API更新数据
      const apiAlertId = warning._apiData ? warning._apiData.alert_id : parseInt(warningId);
      const updateData = {
        status: 2, // 处理中状态
        processing_notes: remarkForm.remark,
        processed_by: getCurrentUserName(),
      } as any;

      console.log('更新预警状态:', apiAlertId, updateData);

      // 调用API更新预警状态
      await centerAPI.alert.updateAlertStatus(apiAlertId, updateData);

      // API调用成功，更新本地数据状态
      const index = warningList.value.findIndex((item) => String(item.id) === String(warningId));
      if (index !== -1) {
        const warningItem = warningList.value[index];
        if (warningItem) {
          // 更新 _apiData.status 字段为处理中
          if (warningItem._apiData) {
            warningItem._apiData.status = 2;
          }

          // 更新字符串状态为处理中
          warningItem.status = 'processing';

          // 确保有操作历史数组
          if (!warningItem.operationHistory) {
            warningItem.operationHistory = [];
          }

          // 添加新的处理中记录
          const newRecord: OperationHistory = {
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '处理中',
            time: getCurrentTime(),
            description: `处理意见：${remarkForm.remark}`,
            operationType: 'processing',
            operator: getCurrentUserName(),
          };

          if (warningItem.operationHistory) {
            warningItem.operationHistory.unshift(newRecord);
          }

          console.log(
            '✅ saveRemark - 本地状态已更新为处理中，_apiData.status:',
            warningItem._apiData?.status,
          );
        }
      }

      ElMessage.success('处理记录已添加');

      // 刷新列表以获取最新数据
      await getWarningList();

      closeRemarkDialog();
    } catch (error) {
      console.error('处理失败:', error);
      ElMessage.error('处理失败：' + (error instanceof Error ? error.message : '网络错误'));
    } finally {
      loading.value = false;
    }
  };

  /**
   * 结束处理预警
   */
  const finishProcessing = async () => {
    try {
      loading.value = true;

      const warningId = currentProcessingWarningId.value;
      console.log('🔍 finishProcessing - 查找预警ID:', warningId);

      const warning = warningList.value.find((item) => String(item.id) === String(warningId));
      if (!warning) {
        console.error('❌ finishProcessing - 未找到预警信息，warningId:', warningId);
        ElMessage.error('未找到预警信息，请刷新页面后重试');
        return;
      }

      console.log('✅ finishProcessing - 找到预警信息:', warning.id);

      // 准备API更新数据
      const apiAlertId = warning._apiData ? warning._apiData.alert_id : parseInt(warningId);
      const updateData = {
        status: 3, // 已处理状态
        processing_notes: remarkForm.remark
          ? `${remarkForm.remark}\n处理已完成`
          : '处理已完成',
        processed_by: getCurrentUserName(),
      } as any;

      console.log('结束处理预警:', apiAlertId, updateData);

      // 调用API更新预警状态
      await centerAPI.alert.updateAlertStatus(apiAlertId, updateData);

      // API调用成功，更新本地数据状态
      const index = warningList.value.findIndex((item) => String(item.id) === String(warningId));
      if (index !== -1) {
        const warningItem = warningList.value[index];
        if (warningItem) {
          // 更新 _apiData.status 字段为已处理
          if (warningItem._apiData) {
            warningItem._apiData.status = 3;
          }

          // 更新字符串状态为已处理
          warningItem.status = 'completed';

          // 确保有操作历史数组
          if (!warningItem.operationHistory) {
            warningItem.operationHistory = [];
          }

          // 添加新的已处理记录
          const newRecord: OperationHistory = {
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '已处理',
            time: getCurrentTime(),
            description: '预警处理已完成，可以进行后续操作',
            operationType: 'completed',
            operator: getCurrentUserName(),
          };

          if (warningItem.operationHistory) {
            warningItem.operationHistory.unshift(newRecord);
          }

          console.log(
            '✅ finishProcessing - 本地状态已更新为已处理，_apiData.status:',
            warningItem._apiData?.status,
          );
        }
      }

      ElMessage.success('处理已完成，现在可以进行归档等操作');

      // 刷新列表以获取最新数据
      await getWarningList();

      closeRemarkDialog();
    } catch (error) {
      console.error('结束处理失败:', error);
      ElMessage.error('结束处理失败：' + (error instanceof Error ? error.message : '网络错误'));
    } finally {
      loading.value = false;
    }
  };

  const closeRemarkDialog = () => {
    remarkDialogVisible.value = false;
    currentProcessingWarningId.value = '';
    remarkForm.remark = '';
  };

  /**
   * 确认上报
   */
  const confirmReport = async () => {
    try {
      const warning = warningList.value.find((item) => item.id === reportWarningId.value);
      if (!warning) {
        ElMessage.error('未找到预警信息');
        return;
      }

      const apiAlertId = warning._apiData ? warning._apiData.alert_id : parseInt(reportWarningId.value);
      const updateData = {
        status: 2, // 保持处理中状态，但添加上报标记
        processing_notes: '预警已上报给上级部门',
        processed_by: getCurrentUserName(),
      } as any;

      await centerAPI.alert.updateAlertStatus(apiAlertId, updateData);
      console.log('✅ 上报API调用成功');

      // 获取当前预警
      const index = warningList.value.findIndex((item) => item.id === reportWarningId.value);
      if (index !== -1) {
        const warningItem = warningList.value[index];
        if (warningItem) {
          // 添加上报记录到操作历史
          if (!warningItem.operationHistory) {
            warningItem.operationHistory = [];
          }

          const newRecord: OperationHistory = {
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '预警上报',
            time: getCurrentTime(),
            description: '预警已上报给上级部门处理，等待上级部门响应',
            operationType: 'report',
            operator: getCurrentUserName(),
          };

          if (warningItem.operationHistory) {
            warningItem.operationHistory.unshift(newRecord);
          }
        }
      }

      ElMessage.success('预警已成功上报');
      closeReportDialog();

      // 刷新列表以获取最新数据
      await getWarningList();
    } catch (error) {
      console.error('上报失败:', error);
      ElMessage.error('上报失败');
    } finally {
      loading.value = false;
    }
  };

  const closeReportDialog = () => {
    reportDialogVisible.value = false;
    reportWarningId.value = '';
  };

  const closeArchiveDialog = () => {
    archiveDialogVisible.value = false;
    archiveWarningId.value = '';
    selectedArchiveId.value = '';
  };

  /**
   * 确认归档
   */
  const confirmArchive = async () => {
    if (!selectedArchiveId.value) {
      ElMessage.warning('请选择要归档到的档案');
      return;
    }

    try {
      loading.value = true;

      const targetArchiveId = selectedArchiveId.value;
      let archiveName = '';

      // 获取选中档案的名称（兼容archive_id和id两种字段名）
      const selectedArchive = availableArchives.value.find(
        (archive) => (archive.archive_id || archive.id) === targetArchiveId,
      );
      archiveName = selectedArchive ? selectedArchive.name : '未知档案';

      console.log('🔍 confirmArchive - 选中的档案ID:', targetArchiveId);
      console.log('🔍 confirmArchive - 找到的档案:', selectedArchive);

      if (!targetArchiveId) {
        ElMessage.error('请选择要归档的档案');
        return;
      }

      // 获取当前预警信息
      const index = warningList.value.findIndex((item) => item.id === archiveWarningId.value);
      if (index === -1) {
        ElMessage.error('未找到预警信息');
        return;
      }

      const warning = warningList.value[index];
      if (!warning) {
        ElMessage.error('未找到预警信息');
        return;
      }

      // 再次检查预警状态，只有已处理状态（status=3）才能归档
      if (warning._apiData && warning._apiData.status !== 3) {
        const statusNames: Record<number, string> = {
          1: '待处理',
          2: '处理中',
          3: '已处理',
          4: '已归档',
          5: '误报',
        };
        const currentStatusName = statusNames[warning._apiData.status] || '未知状态';
        ElMessage.warning(`只有已处理状态的预警才能归档，当前状态为：${currentStatusName}`);
        closeArchiveDialog();
        return;
      }

      const apiAlertId = warning._apiData
        ? warning._apiData.alert_id
        : parseInt(archiveWarningId.value);

      // 1. 先调用updateAlertStatus更新预警状态为已归档
      const updateData = {
        status: 4, // 已归档状态
        processing_notes: `预警已归档到：${archiveName}`,
        processed_by: getCurrentUserName(),
      } as any;

      console.log('📤 更新预警状态为已归档:', apiAlertId, updateData);
      const updateResponse = await centerAPI.alert.updateAlertStatus(apiAlertId, updateData);
      console.log('✅ 预警状态更新成功:', updateResponse);

      // 2. 更新本地的_apiData.status字段
      const warningItem = warningList.value[index];
      if (warningItem) {
        if (warningItem._apiData) {
          warningItem._apiData.status = 4;
        }
        warningItem.status = 'archived';
        warningItem.archiveId = String(targetArchiveId);
        warningItem.archiveTime = new Date().toLocaleString();

        // 3. 添加归档记录到操作历史
        if (!warningItem.operationHistory) {
          warningItem.operationHistory = [];
        }

        const archiveRecord: OperationHistory = {
          id: Date.now() + Math.random(),
          status: 'completed',
          statusText: '预警归档',
          time: getCurrentTime(),
          description: `预警已归档到：${archiveName}，可在预警档案中查看`,
          operationType: 'archive',
          operator: getCurrentUserName(),
          archiveInfo: {
            archiveId: targetArchiveId,
            archiveName: archiveName,
          },
        };

        if (warningItem.operationHistory) {
          warningItem.operationHistory.unshift(archiveRecord);
        }
      }

      console.log('✅ 本地状态已更新为已归档');

      // 4. 调用归档API关联预警到档案
      const response = await centerAPI.archive.linkAlertsToArchive(
        Number(targetArchiveId),
        [apiAlertId],
        `预警管理归档 - 预警类型: ${warning.type || '未知'}`,
      );

      console.log('📤 归档API响应:', response);

      // 5. 延迟移除记录，让用户能看到状态变化
      setTimeout(() => {
        const currentIndex = warningList.value.findIndex(
          (item) => item.id === archiveWarningId.value,
        );
        if (currentIndex !== -1) {
          // 从预警列表中移除已归档的预警
          warningList.value.splice(currentIndex, 1);
        }
      }, 500);

      ElMessage.success('预警已成功归档');
      console.log('✅ 预警管理 - 预警归档成功:', apiAlertId, '档案ID:', targetArchiveId);

      // 关闭对话框
      closeArchiveDialog();

      // 刷新列表以获取最新数据
      await getWarningList();

      // 如果在选中列表中，也移除
      const selectedIndex = selectedWarnings.value.indexOf(archiveWarningId.value);
      if (selectedIndex !== -1) {
        selectedWarnings.value.splice(selectedIndex, 1);
      }
    } catch (error) {
      console.error('❌ 预警管理 - 预警归档异常:', error);
      ElMessage.error('归档失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      loading.value = false;
    }
  };

  /**
   * 处理误报
   */
  const handleFalseAlarmArchive = async () => {
    try {
      if (!falseAlarmForm.reviewNotes.trim()) {
        ElMessage.warning('请输入复判意见');
        return;
      }

      // 获取当前预警信息
      const warningIndex = warningList.value.findIndex(
        (item) => item.id === archiveWarningId.value,
      );
      if (warningIndex === -1) {
        ElMessage.error('未找到预警信息');
        return;
      }

      const warningInfo = warningList.value[warningIndex];
      if (!warningInfo) {
        ElMessage.error('未找到预警信息');
        loading.value = false;
        return;
      }

      // 检查预警状态，只有待处理状态才能标记为误报
      if (warningInfo._apiData && warningInfo._apiData.status !== 1) {
        const statusNames: Record<number, string> = {
          2: '处理中',
          3: '已处理',
          4: '已归档',
          5: '误报',
        };
        const currentStatusName = statusNames[warningInfo._apiData.status] || '未知状态';
        ElMessage.warning(
          `只有待处理状态的预警才能标记为误报，当前状态为：${currentStatusName}`,
        );
        falseAlarmDialogVisible.value = false;
        falseAlarmForm.reviewNotes = '';
        return;
      }

      // 调用后端API标记误报
      const apiAlertId = warningInfo._apiData
        ? warningInfo._apiData.alert_id
        : parseInt(String(archiveWarningId.value));

      await centerAPI.alert.markAlertAsFalseAlarm(
        apiAlertId,
        falseAlarmForm.reviewNotes,
        getCurrentUserName(),
      );

      console.log('✅ 标记误报API响应成功');

      // 添加误报记录到操作历史
      const warningItem = warningList.value[warningIndex];
      if (warningItem) {
        if (!warningItem.operationHistory) {
          warningItem.operationHistory = [];
        }

        const newRecord: OperationHistory = {
          id: Date.now() + Math.random(),
          status: 'completed',
          statusText: '误报处理',
          time: getCurrentTime(),
          description: `预警被标记为误报：${falseAlarmForm.reviewNotes}`,
          operationType: 'falseAlarm',
          operator: getCurrentUserName(),
        };

        if (warningItem.operationHistory) {
          warningItem.operationHistory.unshift(newRecord);
        }
        warningItem.status = 'archived';
        warningItem.isFalseAlarm = true;
        warningItem.archiveTime = new Date().toLocaleString();
      }

      // 如果在选中列表中，也移除
      const selectedIndex = selectedWarnings.value.indexOf(archiveWarningId.value);
      if (selectedIndex !== -1) {
        selectedWarnings.value.splice(selectedIndex, 1);
      }

      ElMessage.success('预警已标记为误报，复判记录已保存');

      // 刷新列表以获取最新数据
      await getWarningList();

      // 关闭对话框并重置表单
      falseAlarmDialogVisible.value = false;
      falseAlarmForm.reviewNotes = '';
      archiveWarningId.value = '';
    } catch (error) {
      console.error('标记误报失败:', error);
      ElMessage.error('标记误报失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      loading.value = false;
    }
  };

  const handleBatchProcess = () => {
    if (selectedWarnings.value.length === 0) {
      ElMessage.warning('请先选择预警项');
      return;
    }
    batchProcessDialogVisible.value = true;
  };

  /**
   * 确认批量处理
   * @deprecated 暂未使用，保留以备后用
   */
  // @ts-expect-error - 暂未使用，保留以备后用
  const _confirmBatchProcess = async () => {
    if (!batchRemarkForm.remark.trim()) {
      ElMessage.warning('请输入批量处理意见');
      return;
    }

    try {
      loading.value = true;

      // 调用API进行批量处理
      const updateData = {
        status: 2, // 处理中状态
        processing_notes: batchRemarkForm.remark,
        processed_by: getCurrentUserName(),
      } as any;

      // 将页面ID转换为数字类型的API ID
      const apiAlertIds = selectedWarnings.value
        .map((id) => {
          const warning = warningList.value.find((item) => item.id === id);
          return warning?._apiData?.alert_id ?? parseInt(String(id));
        })
        .filter((id) => !isNaN(id));

      console.log('批量处理预警:', apiAlertIds, updateData);

      await centerAPI.alert.batchUpdateAlertStatus(apiAlertIds, updateData);

      // API调用成功，更新本地数据（与单个处理逻辑一致）
      for (const id of selectedWarnings.value) {
        const index = warningList.value.findIndex((item) => item.id === id);
        if (index !== -1) {
          const warningItem = warningList.value[index];
          if (warningItem) {
            // 确保有操作历史数组
            if (!warningItem.operationHistory) {
              warningItem.operationHistory = [];
            }

            // 更新待处理记录为已完成状态
            if (warningItem.operationHistory) {
              warningItem.operationHistory = warningItem.operationHistory.map(
                (record) => {
                  if (record.operationType === 'pending' && record.status === 'active') {
                    return {
                      ...record,
                      status: 'completed',
                      description: '预警已确认，开始处理',
                    };
                  }
                  return record;
                },
              );
            }

            // 添加处理中记录
            const processingRecord: OperationHistory = {
              id: Date.now() + Math.random(),
              status: 'active',
              statusText: '处理中',
              time: getCurrentTime(),
              description: `批量处理开始：${batchRemarkForm.remark}`,
              operationType: 'processing',
              operator: getCurrentUserName(),
            };

            if (warningItem.operationHistory) {
              warningItem.operationHistory.unshift(processingRecord);
            }

            // 更新状态为处理中
            warningItem.status = 'processing';
          }
        }
      }

      ElMessage.success(`已为 ${selectedWarnings.value.length} 项预警添加处理记录`);

      // 刷新列表以获取最新数据
      await getWarningList();

      selectedWarnings.value = [];
      closeBatchProcessDialog();
    } catch (error) {
      console.error('批量处理失败:', error);
      ElMessage.error('批量处理失败：' + (error instanceof Error ? error.message : '网络错误'));
    } finally {
      loading.value = false;
    }
  };

  const closeBatchProcessDialog = () => {
    batchProcessDialogVisible.value = false;
    batchRemarkForm.remark = '';
  };

  const exportData = () => {
    exportDialogVisible.value = true;
  };

  const getExportSelectionText = () => {
    const count = selectedWarnings.value.length;
    if (count > 0) {
      return `您已选择 ${count} 条记录进行导出`;
    }
    return '您将导出当前筛选条件下的所有记录';
  };

  const hasActiveFilters = () => {
    return !!(
      searchForm.device_name ||
      searchForm.alert_type ||
      searchForm.alert_level ||
      searchForm.warningSkill ||
      searchForm.warningName ||
      searchForm.warningId ||
      searchForm.status ||
      searchForm.location ||
      searchForm.start_date ||
      searchForm.end_date
    );
  };

  /**
   * 确认导出
   */
  const confirmExport = async () => {
    try {
      // 显示加载状态
      exportLoading.value = true;

      // 准备导出参数
      const exportParams: Record<string, any> = {
        ...searchForm, // 包含所有筛选条件
        format: exportFormat.value,
      };

      // 如果有选中的预警，添加指定的预警ID列表
      if (selectedWarnings.value.length > 0) {
        // 转换为API格式的ID
        const apiAlertIds = selectedWarnings.value
          .map((id) => {
            const warning = warningList.value.find((item) => item.id === id);
            return warning && warning._apiData ? warning._apiData.alert_id : parseInt(String(id));
          })
          .filter((id) => !isNaN(id));

        if (apiAlertIds.length > 0) {
          exportParams.alert_ids = apiAlertIds;
        }
      }

      console.log('📤 导出预警数据，参数:', exportParams);

      // 调用后端导出接口
      const response = await centerAPI.alert.exportAlerts(exportParams);

      if (response && response.data) {
        // 创建下载链接
        const blob = new Blob([response.data], {
          type:
            exportFormat.value === 'excel'
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : 'text/csv;charset=utf-8;',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // 生成文件名
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
        const extension = exportFormat.value === 'excel' ? 'xlsx' : 'csv';
        const selectedInfo =
          selectedWarnings.value.length > 0 ? `_已选择${selectedWarnings.value.length}项` : '';
        link.download = `预警数据导出_${timestamp}${selectedInfo}.${extension}`;

        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        ElMessage.success(`${exportFormat.value.toUpperCase()}文件导出成功`);
      } else {
        throw new Error('导出数据为空');
      }
    } catch (error) {
      console.error('❌ 导出失败:', error);
      const errorMsg =
        (error instanceof Error && error.message) || '导出失败，请稍后重试';
      ElMessage.error(`导出失败: ${errorMsg}`);
    } finally {
      exportLoading.value = false;
      exportDialogVisible.value = false;
    }
  };

  const showDeleteDialog = () => {
    if (selectedWarnings.value.length === 0) {
      ElMessage.warning('请先选择要删除的预警项');
      return;
    }
    deleteDialogVisible.value = true;
  };

  /**
   * 确认删除
   */
  const confirmDelete = async () => {
    if (selectedWarnings.value.length === 0) {
      ElMessage.warning('请先选择要删除的预警项');
      return;
    }

    try {
      deleteLoading.value = true;

      // 将页面ID转换为数字类型的API ID
      const apiAlertIds = selectedWarnings.value
        .map((id) => {
          const warning = warningList.value.find((item) => item.id === id);
          return warning && warning._apiData ? warning._apiData.alert_id : parseInt(String(id));
        })
        .filter((id) => !isNaN(id));

      console.log('批量删除预警:', apiAlertIds);

      // 调用API进行批量删除
      await centerAPI.alert.batchDeleteAlerts(apiAlertIds);

      // API调用成功，从预警列表中移除选中的项
      warningList.value = warningList.value.filter(
        (item) => !selectedWarnings.value.includes(item.id),
      );

      ElMessage.success(`已成功删除 ${selectedWarnings.value.length} 项预警`);

      // 清空选择
      selectedWarnings.value = [];
      closeDeleteDialog();
    } catch (error) {
      console.error('删除失败:', error);
      ElMessage.error('删除失败：' + (error instanceof Error ? error.message : '网络错误'));
    } finally {
      deleteLoading.value = false;
    }
  };

  const closeDeleteDialog = () => {
    deleteDialogVisible.value = false;
    deleteLoading.value = false;
  };

  /**
   * 显示预警详情
   */
  const showWarningDetail = async (item: WarningItem) => {
    try {
      loading.value = true;

      // 获取API预警ID
      const apiAlertId = item._apiData ? item._apiData.alert_id : parseInt(item.id);

      console.log('获取预警详情:', apiAlertId, item);

      // 调用API获取完整的预警详情
      const response = await centerAPI.alert.getAlertDetail(apiAlertId) as any;

      console.log('预警详情API完整响应:', response);
      console.log('预警详情API响应数据:', response.data);

      if (response.data && response.data.alert_id) {
        // 转换API数据为页面数据格式
        const apiDetail = response.data;

        // 创建增强的预警详情对象
        const enhancedDetail = {
          ...item,
          apiData: apiDetail,
          alert_id: apiDetail.alert_id,
          alert_time: apiDetail.alert_time,
          alert_type: apiDetail.alert_type,
          alert_level: apiDetail.alert_level,
          alert_name: apiDetail.alert_name,
          alert_description: apiDetail.alert_description,
          location: apiDetail.location,
          camera_id: apiDetail.camera_id,
          camera_name: apiDetail.camera_name,
          task_id: apiDetail.task_id,
          electronic_fence: apiDetail.electronic_fence,
          result: apiDetail.result,
          minio_frame_url: apiDetail.minio_frame_url,
          minio_video_url: apiDetail.minio_video_url,
          skill_class_id: apiDetail.skill_class_id,
          skill_name_zh: apiDetail.skill_name_zh,
          status: apiDetail.status,
          status_display: apiDetail.status_display,
          processed_at: apiDetail.processed_at,
          processed_by: apiDetail.processed_by,
          processing_notes: apiDetail.processing_notes,
          created_at: apiDetail.created_at,
          updated_at: apiDetail.updated_at,
          process: apiDetail.process,
          imageUrl: apiDetail.minio_frame_url || item.imageUrl,
          description: apiDetail.alert_description || item.description,
        };

        console.log('预警详情API响应:', apiDetail);
        console.log('增强后的预警详情:', enhancedDetail);

        currentWarningDetail.value = enhancedDetail;
      } else {
        console.warn('API返回数据格式不正确，使用原始数据:', response.data);
        currentWarningDetail.value = item;
      }

      warningDetailVisible.value = true;
    } catch (error) {
      console.error('获取预警详情失败:', error);
      ElMessage.error('获取预警详情失败：' + (error instanceof Error ? error.message : '网络错误'));
      // 如果API调用失败，仍然显示基本信息
      currentWarningDetail.value = item;
      warningDetailVisible.value = true;
    } finally {
      loading.value = false;
    }
  };

  // ========== 分页方法 ==========

  const handleSizeChange = (val: number) => {
    pageSize.value = val;
    currentPage.value = 1;
    getWarningList();
  };

  const handleCurrentChange = (val: number) => {
    currentPage.value = val;
    getWarningList();
  };

  return {
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

    // 计算属性
    defaultArchive,

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

    // 档案相关
    loadAvailableArchives,
  };
}

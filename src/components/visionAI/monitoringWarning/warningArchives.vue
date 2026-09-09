<script>
// 导入API服务
import VisionAIService from '../../service/VisionAIService.js'
import {
  getAlertLevelName,
  getAlertStatusName,
  normalizeAlertTimeString,
  toAlertLevelKey,
  toAlertStatusKey
} from './utils/alertFormatting'

// 解构获取archiveAPI和alertAPI（用于拉取预警详情）
const { archiveAPI, alertAPI } = VisionAIService

export default {
  name: "WarningArchives",
  components: {
    WarningDetail: () => import('./warningDetail.vue')
  },
  data() {
    return {
      // 分页配置（用于预警记录）
      pagination: {
        currentPage: 1,
        pageSize: 20,
        total: 0
      },
      // 档案列表分页配置
      archivesPagination: {
        currentPage: 1,
        pageSize: 20,
        total: 0
      },
      archiveSearchKeyword: '',
      recordSearchKeyword: '',
      // 档案基本信息
      archiveInfo: {
        name: '',
        location: '',
        timeRange: '',
        createTime: '',
        description: '',
        image: ''
      },
      // 多个档案列表
      archivesList: [],
      // 当前选中的档案ID
      currentArchiveId: null,
      // 页面数据是否就绪（首屏加载完成前隐藏内容，防止闪烁）
      pageReady: false,
      // 档案切换中（只由最后一次切换请求收尾）
      archiveSwitching: false,
      archiveSwitchRequestId: 0,
      archiveDetailRequestId: 0,
      archiveDetailRequestController: null,
      archiveAlertsRequestId: 0,
      archiveAlertsRequestController: null,
      // 列表相关
      archiveList: [],
      selectedRows: [],
      selectAll: false,
      // 图片预览
      imagePreviewVisible: false,
      currentPreviewImage: null,
      isEditing: false,
      // 已发生预警选择对话框
      selectAlertDialogVisible: false,
      availableAlerts: [],
      selectedAlerts: [],
      availableAlertsLoading: false,
      alertFilterOptionsLoading: false,
      warningSkillOptions: [],
      warningTypeOptions: [],
      availableAlertsPagination: {
        currentPage: 1,
        pageSize: 20,
        total: 0
      },
      // 已发生预警筛选条件
      alertFilters: {
        alert_level: '',
        alert_type: '',
        camera_name: '',
        status: 3, // 默认只显示已处理状态的预警
        start_time: '',
        end_time: '',
        skill_class_id: '',
        location: '',
        alert_id: ''
      },
      // 编辑档案表单
      editForm: {
        name: '',
        location: '',
        timeRange: [],
        createTime: '',
        description: '',
        image: ''
      },
      // 对话框控制
      editDialogVisible: false,
      // 移出档案相关
      deleteConfirmVisible: false,
      deleteConfirmMessage: '',
      deleteType: '', // 'single' 或 'batch' 或 'archive'
      deleteId: null,
      // 删除档案相关
      deleteArchiveConfirmVisible: false,
      deleteArchiveId: null,
      deleteArchiveName: '',
      // 添加档案对话框
      addArchiveDialogVisible: false,
      submittingArchive: false,
      newArchiveForm: {
        name: '',
        location: '',
        timeRange: [],
        description: ''
      },
      warningDetailVisible: false,
      currentAlertId: null
    }
  },
  mounted() {
    this.initData();
  },
  beforeDestroy() {
    this.archiveSwitchRequestId += 1;
    this.archiveDetailRequestId += 1;
    this.archiveAlertsRequestId += 1;
    if (this.archiveDetailRequestController) {
      this.archiveDetailRequestController.abort();
      this.archiveDetailRequestController = null;
    }
    if (this.archiveAlertsRequestController) {
      this.archiveAlertsRequestController.abort();
      this.archiveAlertsRequestController = null;
    }
  },
  methods: {
    normalizeId(id) {
      return (id === null || id === undefined || id === '') ? null : String(id);
    },
    // 显示图片预览
    showImagePreview(row) {
      const imageUrl = this.getAlertImageUrl(row);
      if (imageUrl) {
        this.currentPreviewImage = imageUrl;
        this.imagePreviewVisible = true;
      } else {
        this.$message.warning('该预警暂无图片');
      }
    },
    // 兼容不同接口字段，解析预警图片地址
    getAlertImageUrl(row) {
      if (!row) return '';

      const candidates = [
        row.violationImage,
        row.image,
        row.imageUrl,
        row.minio_frame_url,
        row.violation_image_url,
        row._apiData && row._apiData.minio_frame_url,
        row._apiData && row._apiData.violation_image_url,
        row._apiData && row._apiData.alert_image_url,
        row._apiData && row._apiData.image_url,
        row._apiData && row._apiData.snapshot_url
      ];

      for (const candidate of candidates) {
        const normalizedUrl = this.normalizeMediaUrl(candidate);
        if (normalizedUrl) {
          return normalizedUrl;
        }
      }
      return '';
    },
    // 处理媒体地址，支持相对路径自动拼接 baseUrl
    normalizeMediaUrl(url) {
      if (!url || typeof url !== 'string') {
        return '';
      }

      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        return '';
      }

      if (
        trimmedUrl.startsWith('http://') ||
        trimmedUrl.startsWith('https://') ||
        trimmedUrl.startsWith('data:') ||
        trimmedUrl.startsWith('blob:')
      ) {
        return trimmedUrl;
      }

      const baseUrl = window.baseUrl || '';
      if (trimmedUrl.startsWith('/')) {
        return `${baseUrl}${trimmedUrl}`;
      }

      return trimmedUrl;
    },
    // 预警缩略图显示判断
    shouldShowAlertThumbnail(row) {
      return !!(this.getAlertImageUrl(row) && !row._thumbLoadError);
    },
    // 缩略图加载失败后回退占位图
    handleAlertThumbError(row) {
      if (!row || row._thumbLoadError) {
        return;
      }
      this.$set(row, '_thumbLoadError', true);
    },
    async initData() {
      try {
        // 1. 拉取档案列表
        const list = await this.fetchArchivesList();
        this.archivesList = list;

        if (list.length > 0) {
          // 2. 同步确定选中ID（不触发渲染）
          this.currentArchiveId = list[0].id;
          // 3. 并行加载详情和预警记录
          await Promise.all([
            this.fetchAndApplyArchiveDetail(this.currentArchiveId),
            this.fetchAndApplyArchiveAlerts(this.currentArchiveId)
          ]);
        }
      } catch (error) {
        console.error('初始化数据失败:', error);
        this.$message.error('加载数据失败: ' + (error.message || '未知错误'));
      } finally {
        // 4. 所有数据就绪后才允许渲染
        this.pageReady = true;
      }
    },

    // ---- 档案列表 ----

    parseArchiveListResponse(response) {
      let archiveData = [];
      let paginationData = null;

      if (response.data.code !== undefined) {
        if (response.data.code === 0) {
          archiveData = response.data.data || [];
          paginationData = response.data.pagination;
        } else {
          throw new Error(response.data.msg || '获取档案列表失败');
        }
      } else if (response.data.data) {
        archiveData = response.data.data || [];
        paginationData = response.data.pagination;
      } else if (Array.isArray(response.data)) {
        archiveData = response.data;
      } else {
        archiveData = [response.data];
      }

      const items = archiveData.map(a => ({
        id: this.normalizeId(a.archive_id || a.id),
        archive_id: this.normalizeId(a.archive_id || a.id),
        name: a.name,
        location: a.location,
        timeRange: `${normalizeAlertTimeString(a.start_time)}-${normalizeAlertTimeString(a.end_time)}`,
        createTime: normalizeAlertTimeString(a.created_at),
        description: a.description || '-',
        image: a.image_url || ''
      }));

      return { items, paginationData };
    },

    async fetchArchivesList(params = {}) {
      const queryParams = {
        page: this.archivesPagination.currentPage,
        limit: this.archivesPagination.pageSize,
        keyword: this.archiveSearchKeyword.trim() || undefined,
        ...params
      };
      const response = await archiveAPI.getArchiveList(queryParams);
      const { items, paginationData } = this.parseArchiveListResponse(response);

      if (paginationData) {
        this.archivesPagination.total = paginationData.total || 0;
        this.archivesPagination.currentPage = paginationData.page || 1;
        this.archivesPagination.pageSize = paginationData.limit || 20;
      }

      return items;
    },

    async reloadArchivesList(params = {}) {
      const list = await this.fetchArchivesList(params);
      this.archivesList = list;

      if (list.length > 0) {
        const stillExists = list.some(a => a.id === this.currentArchiveId);
        if (!stillExists) {
          await this.switchToArchive(list[0].id);
        }
      } else {
        this.currentArchiveId = null;
        this.archiveInfo = { name: '', location: '', timeRange: '', createTime: '', description: '', image: '' };
        this.archiveList = [];
        this.pagination.total = 0;
      }
    },

    // ---- 档案详情 ----

    parseArchiveDetailResponse(response) {
      if (response.data.code !== undefined) {
        if (response.data.code === 0) return response.data.data;
        throw new Error(response.data.msg || '获取档案详情失败');
      }
      return response.data;
    },

    async fetchAndApplyArchiveDetail(archiveId) {
      if (!archiveId) return;
      if (this.archiveDetailRequestController) {
        this.archiveDetailRequestController.abort();
      }
      const requestId = ++this.archiveDetailRequestId;
      const controller = typeof AbortController !== 'undefined'
        ? new AbortController()
        : null;
      const normalizedArchiveId = this.normalizeId(archiveId);
      this.archiveDetailRequestController = controller;

      try {
        const response = await archiveAPI.getArchiveDetail(
          archiveId,
          controller ? { signal: controller.signal } : {}
        );
        const d = this.parseArchiveDetailResponse(response);

        if (
          requestId !== this.archiveDetailRequestId ||
          this.currentArchiveId !== normalizedArchiveId
        ) return;

        this.archiveInfo = {
          id: this.normalizeId(d.archive_id || d.id),
          archive_id: this.normalizeId(d.archive_id || d.id),
          name: d.name,
          location: d.location,
          timeRange: `${normalizeAlertTimeString(d.start_time)}-${normalizeAlertTimeString(d.end_time)}`,
          createTime: normalizeAlertTimeString(d.created_at),
          description: d.description || '-',
          image: d.image_url || ''
        };
      } catch (error) {
        const canceled = requestId !== this.archiveDetailRequestId ||
          (controller && controller.signal.aborted) ||
          error.code === 'ERR_CANCELED' ||
          error.__CANCEL__ === true;
        if (canceled) return;
        throw error;
      } finally {
        if (requestId === this.archiveDetailRequestId) {
          this.archiveDetailRequestController = null;
        }
      }
    },

    // ---- 预警记录 ----

    parseArchiveAlertsResponse(response) {
      let alertRecords = [];
      let totalCount = 0;

      if (response.data.code !== undefined) {
        if (response.data.code === 0) {
          const data = response.data.data || {};
          alertRecords = data.items || [];
          totalCount = data.total || 0;
        } else {
          throw new Error(response.data.message || '获取预警记录失败');
        }
      } else if (response.data.data) {
        alertRecords = response.data.data || [];
        totalCount = response.data.pagination ? response.data.pagination.total : alertRecords.length;
      } else if (Array.isArray(response.data)) {
        alertRecords = response.data;
        totalCount = alertRecords.length;
      } else {
        alertRecords = [response.data];
        totalCount = 1;
      }

      return { alertRecords, totalCount };
    },

    async fetchAndApplyArchiveAlerts(archiveId, params = {}) {
      if (!archiveId) return;
      if (this.archiveAlertsRequestController) {
        this.archiveAlertsRequestController.abort();
      }
      const requestId = ++this.archiveAlertsRequestId;
      const controller = typeof AbortController !== 'undefined'
        ? new AbortController()
        : null;
      const normalizedArchiveId = this.normalizeId(archiveId);
      this.archiveAlertsRequestController = controller;

      const limit = Math.min(this.pagination.pageSize, 100);
      const queryParams = {
        page: this.pagination.currentPage,
        limit,
        keyword: this.recordSearchKeyword.trim() || undefined,
        ...params
      };

      try {
        const response = await archiveAPI.getArchiveLinkedAlerts(
          archiveId,
          queryParams,
          controller ? { signal: controller.signal } : {}
        );
        const { alertRecords, totalCount } = this.parseArchiveAlertsResponse(response);

        if (
          requestId !== this.archiveAlertsRequestId ||
          this.currentArchiveId !== normalizedArchiveId
        ) return;

        this.archiveList = alertRecords.map(record => ({
          id: record.alert_id,
          name: record.alert_name,
          deviceName: record.camera_name,
          warningTime: normalizeAlertTimeString(record.alert_time),
          warningLevel: toAlertLevelKey(record.alert_level),
          warningType: record.alert_type || '',
          location: record.location || '',
          description: record.alert_description || '',
          remark: record.processing_notes || '',
          violationImage: record.minio_frame_url || '',
          violationVideo: record.minio_video_url || '',
          status: record.status || 1,
          createTime: normalizeAlertTimeString(record.created_at),
          _apiData: record
        }));
        this.pagination.total = totalCount;
      } catch (error) {
        const canceled = requestId !== this.archiveAlertsRequestId ||
          (controller && controller.signal.aborted) ||
          error.code === 'ERR_CANCELED' ||
          error.__CANCEL__ === true;
        if (canceled) return;
        throw error;
      } finally {
        if (requestId === this.archiveAlertsRequestId) {
          this.archiveAlertsRequestController = null;
        }
      }
    },

    async switchToArchive(archiveId) {
      const nid = this.normalizeId(archiveId);
      if (!nid || this.currentArchiveId === nid) return;

      const switchRequestId = ++this.archiveSwitchRequestId;
      this.archiveSwitching = true;
      try {
        this.currentArchiveId = nid;
        this.pagination.currentPage = 1;
        await Promise.all([
          this.fetchAndApplyArchiveDetail(nid),
          this.fetchAndApplyArchiveAlerts(nid)
        ]);
      } catch (error) {
        if (switchRequestId !== this.archiveSwitchRequestId) return;
        console.error('切换档案失败:', error);
        this.$message.error('切换档案失败: ' + (error.message || '未知错误'));
      } finally {
        if (switchRequestId === this.archiveSwitchRequestId) {
          this.archiveSwitching = false;
        }
      }
    },

    async handleCurrentChange(page) {
      this.pagination.currentPage = page;
      if (this.currentArchiveId) {
        await this.fetchAndApplyArchiveAlerts(this.currentArchiveId);
      }
    },

    async handleSizeChange(size) {
      this.pagination.pageSize = size;
      this.pagination.currentPage = 1;
      if (this.currentArchiveId) {
        await this.fetchAndApplyArchiveAlerts(this.currentArchiveId);
      }
    },

    async handleArchivesCurrentChange(page) {
      this.archivesPagination.currentPage = page;
      await this.reloadArchivesList();
    },

    async handleArchivesSizeChange(size) {
      this.archivesPagination.pageSize = size;
      this.archivesPagination.currentPage = 1;
      await this.reloadArchivesList();
    },
    async handleArchivesSearch() {
      this.archiveSearchKeyword = this.archiveSearchKeyword.trim();
      this.archivesPagination.currentPage = 1;
      await this.reloadArchivesList();
    },
    async handleRecordSearch() {
      this.recordSearchKeyword = this.recordSearchKeyword.trim();
      this.pagination.currentPage = 1;
      if (this.currentArchiveId) {
        await this.fetchAndApplyArchiveAlerts(this.currentArchiveId);
      }
    },
    // 表格选择事件
    handleSelectionChange(selection) {
      this.selectedRows = selection; // 保存完整的选中对象数组
      this.selectAll = selection.length === this.archiveList.length;
    },
    showDetail(record) {
      const alertId = (record._apiData && record._apiData.alert_id) || record.id
      this.currentAlertId = alertId
      this.warningDetailVisible = true
    },

    // 从预警详情组件处理预警
    handleWarningFromDetail(eventData) {
      this.warningDetailVisible = false;
    },
    // 处理单条移出档案
    handleDelete(id) {

      if (!id) {
        this.$message.error('移出档案失败：缺少记录ID');
        return;
      }

      if (!this.currentArchiveId) {
        this.$message.error('移出档案失败：未选择档案');
        return;
      }

      this.deleteType = 'single';
      this.deleteId = id;
      this.deleteConfirmMessage = '确定要将该预警移出当前档案吗？';
      this.deleteConfirmVisible = true;
    },
    // 处理批量移出
    handleBatchDelete() {

      if (this.selectedRows.length === 0) {
        this.$message.warning('请至少选择一条记录');
        return;
      }

      if (!this.currentArchiveId) {
        this.$message.error('批量移出失败：未选择档案');
        return;
      }

      this.deleteType = 'batch';
      this.deleteConfirmMessage = `确定要将选中的 ${this.selectedRows.length} 条预警批量移出当前档案吗？`;
      this.deleteConfirmVisible = true;
    },
    // 确认移出档案 - 调用后端API
    async confirmDelete() {
      try {
        if (this.deleteType === 'single') {
          // 单条移出档案 - 解除档案与预警的关联

          const response = await archiveAPI.unlinkAlertFromArchive(this.currentArchiveId, this.deleteId);

          // 适配API响应格式
          if (response.data.code !== undefined) {
            if (response.data.code === 0) {
              this.$message.success('该预警已移出档案');
            } else {
              throw new Error(response.data.msg || '移出档案失败');
            }
          } else {
            this.$message.success('该预警已移出档案');
          }
        } else {
          const recordIds = [...new Set(this.selectedRows.map(row => row.id))];

          if (recordIds.some(id => !Number.isInteger(Number(id)) || Number(id) <= 0)) {
            console.error('检测到无效的记录ID:', recordIds);
            this.$message.error('选中的记录包含无效ID，请刷新页面后重试');
            return;
          }

          const response = await archiveAPI.unlinkAlertsFromArchive(
            this.currentArchiveId,
            recordIds.map(Number)
          );
          if (response.data && response.data.code !== undefined && response.data.code !== 0) {
            throw new Error(response.data.message || response.data.msg || '批量移出失败');
          }

          const unlinkedCount = response.data && response.data.data
            ? response.data.data.unlinked_count
            : recordIds.length;
          this.$message.success(`已成功将 ${unlinkedCount} 条预警移出档案`);
          this.selectedRows = [];
        }

        await this.fetchAndApplyArchiveAlerts(this.currentArchiveId);
        this.deleteConfirmVisible = false;
      } catch (error) {
        console.error('移出档案操作失败:', error);
        const serverMessage = error.response && error.response.data &&
          (error.response.data.detail || error.response.data.message);
        this.$message.error('移出档案失败: ' + (serverMessage || error.message));
      }
    },
    // 编辑档案
    editArchive() {
      this.isEditing = true;
      this.editForm = { ...this.archiveInfo };

      // 处理时间范围：将字符串格式转换为数组格式
      if (this.editForm.timeRange && typeof this.editForm.timeRange === 'string') {
        // 使用正则表达式精确匹配时间范围格式
        const rangePattern = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})-(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/;
        const match = this.editForm.timeRange.match(rangePattern);

        if (match) {
          this.editForm.timeRange = [match[1], match[2]];
        } else {
          this.editForm.timeRange = [];
        }
      } else {
        this.editForm.timeRange = [];
      }

      this.editDialogVisible = true;
    },
    // 保存编辑 - 调用后端API
    async saveEdit() {
      try {
        // 表单验证
        if (!this.editForm.name || !this.editForm.location) {
          this.$message.warning('请填写必要的信息（档案名称和所属位置必须填写）');
          return;
        }

        // 处理时间范围：将数组格式转换为字符串格式
        let startTime, endTime;
        if (this.editForm.timeRange && Array.isArray(this.editForm.timeRange) && this.editForm.timeRange.length === 2) {
          startTime = this.editForm.timeRange[0];
          endTime = this.editForm.timeRange[1];
        } else {
          // 默认设置为当年完整时间范围
          const currentYear = new Date().getFullYear();
          startTime = `${currentYear}-01-01 00:00:00`;
          endTime = `${currentYear}-12-31 23:59:59`;
        }

        if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
          this.$message.warning('结束时间必须大于开始时间');
          return;
        }

        // 构造后端API需要的数据格式
        const updateData = {
          name: this.editForm.name,
          location: this.editForm.location,
          description: this.editForm.description || '',
          start_time: startTime,
          end_time: endTime,
          image_url: this.editForm.image || '',
          updated_by: '当前用户' // 这里应该从用户信息中获取
        };


        // 调用后端API更新档案
        const response = await archiveAPI.updateArchive(this.currentArchiveId, updateData);

        // 适配新的API响应格式
        let updatedArchive;
        if (response.data.code !== undefined) {
          // 包装格式 {code, msg, data}
          if (response.data.code === 0) {
            updatedArchive = response.data.data;
          } else {
            throw new Error(response.data.msg || '更新档案失败');
          }
        } else {
          // 直接数据格式
          updatedArchive = response.data;
        }

        this.$message.success('档案信息更新成功');

        await this.reloadArchivesList();
        await this.fetchAndApplyArchiveDetail(this.currentArchiveId);

        // 关闭编辑对话框
        this.isEditing = false;
        this.editDialogVisible = false;

      } catch (error) {
        console.error('更新档案失败:', error);
        this.$message.error('更新档案失败: ' + error.message);
      }
    },
    // 取消编辑
    cancelEdit() {
      this.isEditing = false;
      this.editDialogVisible = false;
    },
    // 添加新预警 - 改为从已发生预警列表选择
    addWarning() {
      if (!this.currentArchiveId) {
        this.$message.warning('请先选择一个档案');
        return;
      }

      this.selectAlertDialogVisible = true;
      this.selectedAlerts = [];
      this.resetAlertFilters();
      this.loadAlertFilterOptions();
      this.loadAvailableAlerts();
    },
      // ======================== 已发生预警选择相关方法 ========================

      // 加载与预警管理一致的预警类型、预警技能筛选选项
      async loadAlertFilterOptions() {
        if (this.alertFilterOptionsLoading) return;

        this.alertFilterOptionsLoading = true;
        try {
          const response = await alertAPI.getAlertSkills();
          const body = response && response.data;
          const payload = body && body.data;
          const skills = Array.isArray(payload)
            ? payload
            : ((payload && payload.skills) || []);
          const types = (!Array.isArray(payload) && payload && payload.alert_types) || [];

          this.warningSkillOptions = skills
            .filter(skill => skill && skill.skill_class_id != null)
            .map(skill => {
              const source = (skill.skill_source === 'llm' || skill.skill_source === 'graph')
                ? skill.skill_source
                : 'vision';
              const name = skill.skill_name_zh || `技能#${skill.skill_class_id}`;
              const count = skill.alert_count ? `（${skill.alert_count}）` : '';
              const tag = source === 'llm' ? '[大模型]' : (source === 'graph' ? '[编排]' : '[视觉]');
              return {
                label: `${tag} ${name}${count}`,
                value: `${source}:${skill.skill_class_id}`,
                skillClassId: skill.skill_class_id
              };
            });

          this.warningTypeOptions = types
            .filter(type => type && type.alert_type)
            .map(type => ({
              label: `${type.alert_type}${type.alert_count ? `（${type.alert_count}）` : ''}`,
              value: type.alert_type
            }));
        } catch (error) {
          console.error('加载预警档案筛选选项失败:', error);
        } finally {
          this.alertFilterOptionsLoading = false;
        }
      },

      onAlertSkillSelectVisible(visible) {
        if (visible && this.warningSkillOptions.length === 0) {
          this.loadAlertFilterOptions();
        }
      },

      onAlertTypeSelectVisible(visible) {
        if (visible && this.warningTypeOptions.length === 0) {
          this.loadAlertFilterOptions();
        }
      },

      // 加载可用的预警列表
      async loadAvailableAlerts() {
        try {
          this.availableAlertsLoading = true;

          const params = {
            page: this.availableAlertsPagination.currentPage,
            limit: this.availableAlertsPagination.pageSize,
            // 查询与归档资格分离：五种状态都允许检索和查看详情，
            // 是否能勾选归档由后端返回的 can_archive 决定。
            exclude_archived: false,
            ...this.alertFilters
          };

          // 预警技能下拉值与预警管理保持一致（vision:id / llm:id），接口按技能ID精确筛选
          if (params.skill_class_id !== '' && params.skill_class_id != null) {
            const skillValue = String(params.skill_class_id);
            const skillId = parseInt(skillValue.includes(':') ? skillValue.split(':')[1] : skillValue, 10);
            if (isNaN(skillId)) {
              delete params.skill_class_id;
            } else {
              params.skill_class_id = skillId;
            }
          }

          // 过滤空值
          Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null || params[key] === undefined) {
              delete params[key];
            }
          });


          const response = await archiveAPI.getAvailableAlerts(params);

          if (response.data && response.data.code === 0) {
            this.availableAlerts = response.data.data.items || [];
            this.availableAlertsPagination.total = response.data.data.total || 0;
            this.availableAlertsPagination.currentPage = response.data.data.page || 1;
          } else {
            throw new Error(response.data ? response.data.msg : '获取预警列表失败');
          }
        } catch (error) {
          console.error('加载可用预警列表失败:', error);
          this.$message.error('加载预警列表失败: ' + error.message);
        } finally {
          this.availableAlertsLoading = false;
        }
      },

      // 重置筛选条件
      resetAlertFilters() {
        this.alertFilters = {
          alert_level: '',
          alert_type: '',
          camera_name: '',
          status: 3, // 重置时也默认为已处理状态
          start_time: '',
          end_time: '',
          skill_class_id: '',
          location: '',
          alert_id: ''
        };
        this.availableAlertsPagination.currentPage = 1;
      },

      // 应用筛选条件
      applyAlertFilters() {
        this.availableAlertsPagination.currentPage = 1;
        this.loadAvailableAlerts();
      },

      // 处理预警选择变化
      handleAlertSelectionChange(selection) {
        this.selectedAlerts = selection.filter(this.isAlertArchivable);
      },

      // 只有已处理（状态3）且尚未归档的预警允许加入档案。
      isAlertArchivable(alert) {
        if (!alert) return false;
        if (typeof alert.can_archive === 'boolean') {
          return alert.can_archive;
        }
        return Number(alert.status) === 3 && !alert.is_already_archived;
      },

      // 可用预警分页变化
      handleAvailableAlertsCurrentChange(page) {
        this.availableAlertsPagination.currentPage = page;
        this.loadAvailableAlerts();
      },

      // 可用预警每页条数变化
      handleAvailableAlertsSizeChange(size) {
        this.availableAlertsPagination.pageSize = size;
        this.availableAlertsPagination.currentPage = 1;
        this.loadAvailableAlerts();
      },

      // 确认添加选中的预警到档案
      async confirmAddSelectedAlerts() {
        if (this.selectedAlerts.length === 0) {
          this.$message.warning('请至少选择一个预警');
          return;
        }

        if (this.selectedAlerts.some(alert => !this.isAlertArchivable(alert))) {
          this.$message.warning('只有已处理状态的预警才能归档，请重新选择');
          return;
        }

        if (!this.currentArchiveId) {
          this.$message.error('未选择档案');
          return;
        }

        try {
          this.availableAlertsLoading = true;

          const alertIds = this.selectedAlerts.map(alert => alert.alert_id);
          const linkReason = `批量添加预警到档案：${this.currentArchiveName || ''}`;


          const response = await archiveAPI.linkAlertsToArchive(
            this.currentArchiveId,
            alertIds,
            linkReason
          );

          if (response.data && response.data.code === 0) {
            const result = response.data.data;

            // 显示结果信息
            if (result.success_count > 0) {
              this.$message.success(`成功添加 ${result.success_count} 个预警到档案`);

              await this.fetchAndApplyArchiveAlerts(this.currentArchiveId);
            }

            if (result.failed_count > 0) {
              const failedDetails = result.failed_alerts.map(item =>
                `预警${item.alert_id}: ${item.error}`
              ).join('; ');
              this.$message.warning(`${result.failed_count} 个预警添加失败: ${failedDetails}`);
            }

            // 关闭对话框
            this.selectAlertDialogVisible = false;
            this.selectedAlerts = [];

          } else {
            throw new Error(response.data ? response.data.msg : '关联预警失败');
          }

        } catch (error) {
          console.error('批量添加预警失败:', error);
          const serverMessage = error.response && error.response.data &&
            (error.response.data.detail || error.response.data.message);
          this.$message.error('添加预警失败: ' + (serverMessage || error.message));
        } finally {
          this.availableAlertsLoading = false;
        }
      },

      // 关闭选择预警对话框
      closeSelectAlertDialog() {
        this.selectAlertDialogVisible = false;
        this.selectedAlerts = [];
        this.resetAlertFilters();
      },

      // 转换预警等级显示
      convertAlertLevelDisplay(level) {
        return getAlertLevelName(level);
      },

      // 转换处理状态显示
      convertStatusDisplay(status) {
        return getAlertStatusName(status);
      },

      // 获取状态样式类
      getStatusClass(status) {
        const classMap = {
          1: 'status-pending',
          2: 'status-processing',
          3: 'status-completed',
          4: 'status-archived',
          5: 'status-false-alarm'
        };
        return classMap[status] || 'status-unknown';
      },

      // 获取预警等级样式类
      getAlertLevelClass(level) {
        const classMap = {
          1: 'level1-tag',
          2: 'level2-tag',
          3: 'level3-tag',
          4: 'level4-tag'
        };
        return classMap[level] || 'level1-tag';
      },


      // 预览预警详情 - 在添加预警对话框中查看预警详情
      previewAlert(alert) {
        if (!alert || !alert.alert_id) {
          this.$message.warning('缺少预警ID');
          return;
        }
        this.currentAlertId = alert.alert_id;
        this.warningDetailVisible = true;
      },

      // 将状态码转换为文本状态
      convertStatusToText(status) {
        return toAlertStatusKey(status);
      },

      // 为 availableAlerts 构建基础操作历史
      buildBasicHistoryFromAlert(alert) {
        const history = [];

        // 预警产生记录
        history.push({
          type: 'alert',
          title: '预警产生',
          time: alert.alert_time || new Date().toISOString(),
          content: `检测到 ${alert.alert_type || alert.alert_name || '未知类型'} 预警`,
          operator: '系统自动检测',
          icon: 'warning',
          color: '#faad14'
        });

        // 根据状态添加处理记录
        if (alert.status >= 3) {
          history.push({
            type: 'process',
            title: '预警处理',
            time: alert.resolved_at || alert.processed_at || alert.alert_time,
            content: '预警已处理完成',
            operator: alert.processed_by || '系统',
            icon: 'success',
            color: '#52c41a'
          });
        }

        return history.reverse();
      },
    // 添加新档案
    addNewArchive() {
      this.addArchiveDialogVisible = true;
      this.newArchiveForm = {
        name: '',
        location: '',
        timeRange: [],
        description: '',
        image: ''
      };
    },
     // 提交新档案 - 调用真实API
     async submitNewArchive() {
       if (this.submittingArchive) return;
       try {
         // 表单验证
         if (!this.newArchiveForm.name || !this.newArchiveForm.location) {
           this.$message.warning('请填写必要的信息（档案名称和所属位置必须填写）');
           return;
         }
         this.submittingArchive = true;

         // 处理时间范围
         let startTime, endTime;
         if (this.newArchiveForm.timeRange && this.newArchiveForm.timeRange.length === 2) {
           startTime = this.newArchiveForm.timeRange[0];
           endTime = this.newArchiveForm.timeRange[1];
         } else {
           // 默认设置为当年完整时间范围
           const currentYear = new Date().getFullYear();
           startTime = `${currentYear}-01-01 00:00:00`;
           endTime = `${currentYear}-12-31 23:59:59`;
         }

         if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
           this.$message.warning('结束时间必须大于开始时间');
           return;
         }

         // 构造后端API需要的数据格式
         const archiveData = {
           name: this.newArchiveForm.name,
           location: this.newArchiveForm.location,
           description: this.newArchiveForm.description || '',
           start_time: startTime,
           end_time: endTime,
           created_by: '当前用户' // 这里应该从用户信息中获取
         };


        // 调用后端API创建档案
        const response = await archiveAPI.createArchive(archiveData);

        // 适配新的API响应格式
        let newArchive;
        if (response.data.code !== undefined) {
          // 包装格式 {code, msg, data}
          if (response.data.code === 0) {
            newArchive = response.data.data;
          } else {
            throw new Error(response.data.msg || '创建档案失败');
          }
        } else {
          // 直接数据格式
          newArchive = response.data;
        }

        this.$message.success('档案创建成功');

        this.archivesPagination.currentPage = 1;
        await this.reloadArchivesList();

        if (newArchive && newArchive.archive_id) {
          const nid = this.normalizeId(newArchive.archive_id);
          this.currentArchiveId = nid;
          await Promise.all([
            this.fetchAndApplyArchiveDetail(nid),
            this.fetchAndApplyArchiveAlerts(nid)
          ]);
        }

        // 关闭对话框并重置表单
        this.addArchiveDialogVisible = false;
        this.resetNewArchiveForm();

       } catch (error) {
         console.error('创建档案失败:', error);
         this.$message.error('创建档案失败: ' + error.message);
       } finally {
         this.submittingArchive = false;
       }
     },

     // 重置新档案表单
     resetNewArchiveForm() {
       this.newArchiveForm = {
         name: '',
         location: '',
         timeRange: [],
         description: ''
       };
     },
    // 格式化时间
    formatTime(timeString) {
      try {
        if (!timeString) return timeString;
        timeString = normalizeAlertTimeString(timeString);

        // 检查是否是时间范围格式（包含" HH:mm:ss-"这样的模式）
        const rangePattern = /(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})-(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/;
        const match = timeString.match(rangePattern);

        if (match) {
          // 这是时间范围格式
          const startTime = match[1];
          const endTime = match[2];

          // 格式化开始时间
          const [startDate, startTimeStr] = startTime.split(' ');
          const [startYear, startMonth, startDay] = startDate.split('-');
          const formattedStart = `${startYear}年${startMonth}月${startDay}日 ${startTimeStr}`;

          // 格式化结束时间
          const [endDate, endTimeStr] = endTime.split(' ');
          const [endYear, endMonth, endDay] = endDate.split('-');
          const formattedEnd = `${endYear}年${endMonth}月${endDay}日 ${endTimeStr}`;

          return `${formattedStart} 至 ${formattedEnd}`;
        }

        // 如果是单个完整的时间字符串，格式化为更友好的显示
        if (timeString.includes(' ')) {
          const [date, time] = timeString.split(' ');
          const [year, month, day] = date.split('-');
          return `${year}年${month}月${day}日 ${time}`;
        }

        return timeString;
      } catch (error) {
        return timeString;
      }
    },
    // 删除档案相关方法
    handleDeleteArchive(archiveId, archiveName) {
      this.deleteArchiveId = archiveId;
      this.deleteArchiveName = archiveName;
      this.deleteArchiveConfirmVisible = true;
    },
    // 确认删除档案
    async confirmDeleteArchive() {
      try {
        const response = await archiveAPI.deleteArchive(this.deleteArchiveId);

        // 适配API响应格式
        if (response.data.code !== undefined) {
          if (response.data.code === 0) {
            this.$message.success('档案删除成功');
          } else {
            throw new Error(response.data.msg || '删除档案失败');
          }
        } else {
          this.$message.success('档案删除成功');
        }

        if (this.currentArchiveId === this.normalizeId(this.deleteArchiveId)) {
          this.currentArchiveId = null;
          this.archiveInfo = { name: '', location: '', timeRange: '', createTime: '', description: '', image: '' };
          this.archiveList = [];
        }

        await this.reloadArchivesList();

        // 关闭确认对话框
        this.deleteArchiveConfirmVisible = false;
        this.deleteArchiveId = null;
        this.deleteArchiveName = '';

      } catch (error) {
        console.error('删除档案失败:', error);
        this.$message.error('删除档案失败: ' + error.message);
      }
    }
  }
}
</script>

<template>
  <div class="page-container">
    <!-- 首屏加载完成前不渲染内容，从根本上防止选中态闪烁 -->
    <div v-if="!pageReady" class="page-loading" style="display:flex;align-items:center;justify-content:center;height:300px;">
      <i class="el-icon-loading" style="font-size:28px;color:#3b82f6;"></i>
      <span style="margin-left:8px;color:#6b7280;">加载中...</span>
    </div>

    <div v-else class="content-wrapper">

      <!-- 左侧档案信息区域 -->
      <div class="detail-section">
        <div class="detail-header">
          <div class="detail-title">档案基本信息</div>
          <div class="header-actions">
            <el-button type="primary" size="mini" @click="addNewArchive">添加档案</el-button>
          </div>
        </div>

        <div class="archive-search">
          <el-input
            v-model="archiveSearchKeyword"
            size="small"
            clearable
            placeholder="搜索档案编号、名称、位置或描述"
            aria-label="搜索档案"
            @keyup.enter.native="handleArchivesSearch"
            @clear="handleArchivesSearch"
          >
            <el-button slot="append" icon="el-icon-search" aria-label="搜索" @click="handleArchivesSearch" />
          </el-input>
        </div>

        <!-- 档案列表 -->
        <div class="archives-list">
          <div
            v-for="archive in archivesList"
            :key="archive.id"
            class="archive-item"
            :class="{'active': currentArchiveId === archive.id}"
          >
            <div class="archive-content" @click="switchToArchive(archive.id)">
              <div class="archive-name-row">
                <span class="archive-name">{{ archive.name }}</span>
                <span class="archive-item-id" :title="archive.id">#{{ archive.id }}</span>
              </div>
              <div class="archive-location">位置: {{ archive.location }}</div>
              <div class="archive-time">创建: {{ formatTime(archive.createTime) }}</div>
            </div>
            <div class="archive-actions">
              <el-button
                type="text"
                size="mini"
                @click.stop="handleDeleteArchive(archive.id, archive.name)"
                class="delete-archive-btn"
                title="删除档案">
                <i class="el-icon-delete"></i>
              </el-button>
            </div>
          </div>
          <div v-if="archivesList.length === 0" class="archive-empty">
            {{ archiveSearchKeyword ? '未找到匹配的档案' : '暂无档案' }}
          </div>
        </div>

        <!-- 档案列表分页区域 -->
        <div class="archives-pagination">
          <el-pagination
            :current-page.sync="archivesPagination.currentPage"
            :page-size.sync="archivesPagination.pageSize"
            :total="archivesPagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleArchivesSizeChange"
            @current-change="handleArchivesCurrentChange"
          />
        </div>

        <!-- 当前选中档案详情 -->
        <div class="detail-content">
          <div class="archive-detail-card">
            <div class="archive-detail-header">
              <div class="archive-title">{{ archiveInfo.name }}</div>
            </div>
            <div class="archive-detail-body">
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">档案编号：</span>
                  <span class="value archive-id-value" :title="archiveInfo.id">{{ archiveInfo.id || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">所属位置：</span>
                  <span class="value">{{ archiveInfo.location }}</span>
                </div>
                <div class="info-item">
                  <span class="label">时间范围：</span>
                  <span class="value">{{ formatTime(archiveInfo.timeRange) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">创建时间：</span>
                  <span class="value">{{ formatTime(archiveInfo.createTime) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">档案描述：</span>
                  <span class="value">{{ archiveInfo.description || '-' }}</span>
                </div>
              </div>
            </div>
            <div class="archive-detail-footer">
              <el-button type="primary" class="edit-archive-btn" @click="editArchive">编辑档案</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧表格区域 -->
      <div class="table-container-wrapper">
        <!-- 表格标题和操作按钮 -->
        <div class="table-header">
          <div class="table-title">预警列表 - {{ archiveInfo.name }}</div>
          <div class="table-actions">
            <el-input
              v-model="recordSearchKeyword"
              class="record-search"
              size="small"
              clearable
              placeholder="搜索预警编号、名称、设备等"
              aria-label="搜索档案内预警记录"
              @keyup.enter.native="handleRecordSearch"
              @clear="handleRecordSearch"
            >
              <el-button slot="append" icon="el-icon-search" aria-label="搜索" @click="handleRecordSearch" />
            </el-input>
            <el-button type="danger" size="small" class="batch-delete-btn" @click="handleBatchDelete" :disabled="selectedRows.length === 0">
              批量移出
            </el-button>
            <el-button type="primary" size="small" class="add-btn" @click="addWarning">
              <i class="el-icon-plus"></i> 添加预警
            </el-button>
          </div>
        </div>

        <!-- 表格卡片 -->
        <div class="table-section">
          <el-table
            :data="archiveList"
            :empty-text="recordSearchKeyword ? '未找到匹配的预警记录' : '暂无预警记录'"
            @selection-change="handleSelectionChange"
            style="width: 100%"
          >
            <el-table-column type="selection" width="55" align="center"></el-table-column>
            <el-table-column label="序号" prop="id" width="80" align="center"></el-table-column>
            <el-table-column label="预警名称" prop="name" min-width="120" align="center"></el-table-column>
            <el-table-column label="预警图片" width="100" align="center">
              <template slot-scope="scope">
                <div class="preview-image-cell">
                  <div class="mini-image-preview" @click="showImagePreview(scope.row)">
                    <img
                      v-if="shouldShowAlertThumbnail(scope.row)"
                      :src="getAlertImageUrl(scope.row)"
                      class="mini-preview-image"
                      alt="预警缩略图"
                      @error="handleAlertThumbError(scope.row)"
                    />
                    <div v-else class="mini-blue-box">
                      <i class="el-icon-picture-outline"></i>
                      <span>预警图片</span>
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="设备名称" prop="deviceName" min-width="150" align="center"></el-table-column>
            <el-table-column label="预警时间" prop="warningTime" min-width="180" align="center">
              <template slot-scope="scope">
                {{ formatTime(scope.row.warningTime) }}
              </template>
            </el-table-column>
            <el-table-column label="预警等级" width="100" align="center">
              <template slot-scope="scope">
                <span class="level-tag" :class="{
                  'level1-tag': scope.row.warningLevel === 'level1',
                  'level2-tag': scope.row.warningLevel === 'level2',
                  'level3-tag': scope.row.warningLevel === 'level3',
                  'level4-tag': scope.row.warningLevel === 'level4'
                }">
                  {{
                    scope.row.warningLevel === 'level1' ? '一级预警' :
                    scope.row.warningLevel === 'level2' ? '二级预警' :
                    scope.row.warningLevel === 'level3' ? '三级预警' :
                    scope.row.warningLevel === 'level4' ? '四级预警' :
                    '未知预警' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" align="center">
              <template slot-scope="scope">
                <div class="operation-buttons">
                  <el-button type="text" size="mini" @click="showDetail(scope.row)" class="operation-btn detail-btn">详情</el-button>
                  <el-button type="text" size="mini" @click="handleDelete(scope.row.id)" class="operation-btn delete-btn">移出档案</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页区域 - 改为与 deviceSkills.vue 一致的样式 -->
        <div class="pagination">
          <el-pagination
            :current-page.sync="pagination.currentPage"
            :page-size.sync="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

    </div>

    <!-- 替换原有的预警详情弹框 -->
    <WarningDetail
      :visible.sync="warningDetailVisible"
      :alert-id="currentAlertId"
      @handle-warning="handleWarningFromDetail"
      @handle-report="handleWarningFromDetail"
      @handle-archive="handleWarningFromDetail"
      @handle-false-alarm="handleWarningFromDetail"
    />

    <!-- 图片预览弹框 -->
    <el-dialog title="预警图片预览" :visible.sync="imagePreviewVisible" width="50%" custom-class="image-preview-dialog">
      <div class="image-preview-wrapper">
        <img
          v-if="currentPreviewImage"
          :src="currentPreviewImage"
          alt="预警图片预览"
          class="preview-image"
        />
        <div v-else class="no-image-placeholder">
          <i class="el-icon-picture-outline"></i>
          <p>暂无预警图片</p>
        </div>
      </div>
    </el-dialog>

    <!-- 编辑档案弹框 -->
    <el-dialog title="编辑档案信息" :visible.sync="editDialogVisible" width="30%" :before-close="cancelEdit"
      custom-class="edit-archive-dialog">
      <el-form :model="editForm" label-width="100px" class="edit-form">
        <el-form-item label="档案名称">
          <el-input v-model="editForm.name"></el-input>
        </el-form-item>
        <el-form-item label="所属位置">
          <el-input v-model="editForm.location"></el-input>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="editForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
            format="yyyy-MM-dd HH:mm:ss"
            value-format="yyyy-MM-dd HH:mm:ss">
          </el-date-picker>
          <div class="form-tip">
            <i class="el-icon-info"></i>
            <span>可选项：不填写将自动设置为当年完整时间范围</span>
          </div>
        </el-form-item>
        <el-form-item label="备注描述">
          <el-input type="textarea" v-model="editForm.description" rows="4"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelEdit" class="cancel-btn">取 消</el-button>
        <el-button type="primary" @click="saveEdit" class="confirm-btn">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 选择已发生预警弹框 -->
    <el-dialog
      title="选择预警添加到档案"
      :visible.sync="selectAlertDialogVisible"
      width="85%"
      custom-class="select-alert-dialog"
      :close-on-click-modal="false">

      <!-- 筛选条件 -->
      <div class="alert-filters">
        <el-form :model="alertFilters" inline class="filter-form">
          <el-form-item label="预警等级">
            <el-select v-model="alertFilters.alert_level" placeholder="全部等级" clearable style="width: 120px">
              <el-option label="一级预警" :value="1"></el-option>
              <el-option label="二级预警" :value="2"></el-option>
              <el-option label="三级预警" :value="3"></el-option>
              <el-option label="四级预警" :value="4"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="预警类型">
            <el-select
              v-model="alertFilters.alert_type"
              placeholder="全部类型"
              clearable
              filterable
              :loading="alertFilterOptionsLoading"
              @visible-change="onAlertTypeSelectVisible"
              style="width: 150px">
              <el-option
                v-for="type in warningTypeOptions"
                :key="type.value"
                :label="type.label"
                :value="type.value">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="摄像头名称">
            <el-input v-model="alertFilters.camera_name" placeholder="摄像头名称" clearable style="width: 150px"></el-input>
          </el-form-item>
          <el-form-item label="处理状态">
            <el-select v-model="alertFilters.status" placeholder="请选择状态" clearable style="width: 120px">
              <el-option label="待处理" :value="1"></el-option>
              <el-option label="处理中" :value="2"></el-option>
              <el-option label="已处理" :value="3"></el-option>
              <el-option label="已归档" :value="4"></el-option>
              <el-option label="误报" :value="5"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="预警技能">
            <el-select
              v-model="alertFilters.skill_class_id"
              placeholder="全部技能"
              clearable
              filterable
              :loading="alertFilterOptionsLoading"
              @visible-change="onAlertSkillSelectVisible"
              style="width: 150px">
              <el-option
                v-for="skill in warningSkillOptions"
                :key="skill.value"
                :label="skill.label"
                :value="skill.value">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="位置">
            <el-input v-model="alertFilters.location" placeholder="位置" clearable style="width: 120px"></el-input>
          </el-form-item>
          <el-form-item label="预警ID">
            <el-input
              v-model="alertFilters.alert_id"
              class="alert-id-filter"
              placeholder="输入预警ID"
              clearable
              style="width: 150px"
              type="number">
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyAlertFilters" icon="el-icon-search">筛选</el-button>
            <el-button @click="resetAlertFilters(); loadAvailableAlerts()" icon="el-icon-refresh">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 时间筛选 -->
        <el-form :model="alertFilters" inline class="filter-form time-filter">
          <el-form-item label="预警时间">
            <el-date-picker
              v-model="alertFilters.start_time"
              type="datetime"
              placeholder="开始时间"
              format="yyyy-MM-dd HH:mm:ss"
              value-format="yyyy-MM-dd HH:mm:ss"
              style="width: 180px; margin-right: 10px;">
            </el-date-picker>
            <span style="margin: 0 8px;">至</span>
            <el-date-picker
              v-model="alertFilters.end_time"
              type="datetime"
              placeholder="结束时间"
              format="yyyy-MM-dd HH:mm:ss"
              value-format="yyyy-MM-dd HH:mm:ss"
              style="width: 180px;">
            </el-date-picker>
          </el-form-item>
        </el-form>
      </div>

      <!-- 预警列表表格 -->
      <el-table
        :data="availableAlerts"
        v-loading="availableAlertsLoading"
        @selection-change="handleAlertSelectionChange"
        style="width: 100%; margin-top: 16px;"
        max-height="450">
        <el-table-column
          type="selection"
          width="55"
          align="center"
          :selectable="isAlertArchivable">
        </el-table-column>
        <el-table-column label="预警ID" prop="alert_id" width="80" align="center"></el-table-column>
        <el-table-column label="预警名称" prop="alert_name" min-width="140" align="center" show-overflow-tooltip></el-table-column>
        <el-table-column label="摄像头名称" prop="camera_name" min-width="150" align="center" show-overflow-tooltip></el-table-column>
        <el-table-column label="预警等级" width="100" align="center">
          <template slot-scope="scope">
            <span class="level-tag" :class="getAlertLevelClass(scope.row.alert_level)">
              {{ convertAlertLevelDisplay(scope.row.alert_level) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="预警类型" prop="alert_type" width="100" align="center"></el-table-column>
        <el-table-column label="技能名称" prop="skill_name_zh" min-width="120" align="center" show-overflow-tooltip></el-table-column>
        <el-table-column label="预警时间" prop="alert_time" min-width="160" align="center">
          <template slot-scope="scope">
            {{ formatTime(scope.row.alert_time) }}
          </template>
        </el-table-column>
        <el-table-column label="处理状态" width="100" align="center">
          <template slot-scope="scope">
            <span class="status-tag" :class="getStatusClass(scope.row.status)">
              {{ convertStatusDisplay(scope.row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="位置" prop="location" min-width="120" align="center" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="mini"
              @click="previewAlert(scope.row)"
              title="查看详情">
              <i class="el-icon-view"></i>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="alert-pagination">
        <el-pagination
          :current-page.sync="availableAlertsPagination.currentPage"
          :page-size.sync="availableAlertsPagination.pageSize"
          :total="availableAlertsPagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleAvailableAlertsSizeChange"
          @current-change="handleAvailableAlertsCurrentChange">
        </el-pagination>
      </div>

      <div slot="footer" class="dialog-footer">
        <div class="selected-info">
          <span v-if="selectedAlerts.length > 0">
            已选择 {{ selectedAlerts.length }} 个预警
          </span>
          <span v-else class="no-selection">
            仅“已处理”状态可勾选归档，其他状态可查看详情
          </span>
        </div>
        <div class="dialog-buttons">
          <el-button @click="closeSelectAlertDialog" class="cancel-btn">取 消</el-button>
          <el-button
            type="primary"
            @click="confirmAddSelectedAlerts"
            :disabled="selectedAlerts.length === 0"
            :loading="availableAlertsLoading"
            class="confirm-btn">
            确认添加 ({{ selectedAlerts.length }})
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 移出档案确认对话框 -->
    <el-dialog title="移出档案确认" :visible.sync="deleteConfirmVisible" width="25%" custom-class="delete-confirm-dialog"
      center>
      <div class="confirm-content">
        <p>{{ deleteConfirmMessage }}</p>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="deleteConfirmVisible = false" class="cancel-btn">取 消</el-button>
        <el-button size="small" type="danger" @click="confirmDelete" class="confirm-btn">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 添加档案对话框 -->
    <el-dialog title="添加新档案" :visible.sync="addArchiveDialogVisible" width="30%" custom-class="add-archive-dialog">
      <el-form :model="newArchiveForm" label-width="100px" class="add-form">
        <el-form-item label="档案名称" required>
          <el-input v-model="newArchiveForm.name" placeholder="请输入档案名称"></el-input>
        </el-form-item>
        <el-form-item label="所属位置" required>
          <el-input v-model="newArchiveForm.location" placeholder="请输入所属位置"></el-input>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="newArchiveForm.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
            format="yyyy-MM-dd HH:mm:ss"
            value-format="yyyy-MM-dd HH:mm:ss">
          </el-date-picker>
          <div class="form-tip">
            <i class="el-icon-info"></i>
            <span>可选项：不填写将自动设置为当年完整时间范围</span>
          </div>
        </el-form-item>
        <el-form-item label="备注描述">
          <el-input type="textarea" v-model="newArchiveForm.description" rows="4" placeholder="请输入备注描述"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addArchiveDialogVisible = false" class="cancel-btn">取 消</el-button>
        <el-button type="primary" @click="submitNewArchive" :loading="submittingArchive" :disabled="submittingArchive" class="confirm-btn">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 删除档案确认对话框 -->
    <el-dialog title="删除档案确认" :visible.sync="deleteArchiveConfirmVisible" width="25%" custom-class="delete-confirm-dialog" center>
      <div class="confirm-content">
        <div class="confirm-icon">
          <i class="el-icon-warning" style="color: #f56c6c; font-size: 24px;"></i>
        </div>
        <p>确定要删除档案 "<strong>{{ deleteArchiveName }}</strong>" 吗？</p>
        <p style="color: #909399; font-size: 12px; margin-top: 8px;">删除后该档案将从档案列表中移除，档案内的预警将解除关联并恢复为“已处理”状态，预警记录不会被删除。是否继续？</p>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="deleteArchiveConfirmVisible = false" class="cancel-btn">取 消</el-button>
        <el-button size="small" type="danger" @click="confirmDeleteArchive" class="confirm-btn">确认删除</el-button>
      </div>
    </el-dialog>

    <!-- 预警详情对话框 -->
    <WarningDetail
      :visible.sync="warningDetailVisible"
      :alert-id="currentAlertId"
      @handle-warning="handleWarningFromDetail"
      @handle-report="handleWarningFromDetail"
      @handle-archive="handleWarningFromDetail"
      @handle-false-alarm="handleWarningFromDetail"
    />
  </div>
</template>

<style scoped src="./styles/warningArchives.scoped.css"></style>

<!-- 全局样式修复Element UI时间选择器z-index问题 -->
<style src="./styles/warningArchives.global.css"></style>

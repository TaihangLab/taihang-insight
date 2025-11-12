<script>
// 导入API服务
import VisionAIService from '../../service/VisionAIService.js'

// 解构获取archiveAPI和alertAPI（用于拉取预警详情）
const { archiveAPI, alertAPI } = VisionAIService

export default {
  name: "WarningArchives",
  components: {
    WarningDetail: () => import('./warningDetail.vue')
  },
  data() {
    return {
      // 接口定义
      WarningArchive: {
        id: 0,
        name: '',
        image: '',
        deviceName: '',
        warningTime: '',
        warningLevel: ''
      },
      ArchiveInfo: {
        name: '',
        location: '',
        timeRange: '',
        createTime: '',
        description: '',
        image: ''
      },
      // 预警等级枚举
      WARNING_LEVELS: {
        Red: { label: '一级预警', value: 'red', color: '#ff4d4f' },
        Orange: { label: '二级预警', value: 'orange', color: '#faad14' },
        Yellow: { label: '三级预警', value: 'yellow', color: '#faad14' },
        Blue: { label: '四级预警', value: 'blue', color: '#52c41a' }
      },
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
      // 列表相关
      allArchiveList: [],
      archiveList: [],
      selectedRows: [],
      selectAll: false,
      // 详情弹框
      detailDialogVisible: false,
      currentDetail: null,
      // 图片预览
      imagePreviewVisible: false,
      currentPreviewImage: null,
       // 文件上传相关
       currentRecordId: null, // 当前操作的记录ID
      // 编辑相关
      isEditing: false,
      editingArchive: null,
      // 添加预警对话框
      showAddDialog: false,
      newArchive: {
        name: '',
        deviceName: '',
        warningLevel: '',
        description: ''
      },
      // 已发生预警选择对话框
      selectAlertDialogVisible: false,
      availableAlerts: [],
      selectedAlerts: [],
      availableAlertsLoading: false,
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
        skill_name: '',
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
      // 添加预警表单
      addForm: {
        name: '',
        deviceName: '',
        warningLevel: '',
        warningType: '',
        location: '',
        description: '',
        warningTime: '',
        violationImage: '',
        violationVideo: ''
      },
      // 对话框控制
      editDialogVisible: false,
      addDialogVisible: false,
      // 删除相关
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
      newArchiveForm: {
        name: '',
        location: '',
        timeRange: [],
        description: '',
        image: ''
      },
      // 预警详情相关
      warningDetailVisible: false,
      currentWarning: null
    }
  },
  computed: {
    // 动态上传地址配置
    uploadAction() {
      // 根据当前上传的类型和ID返回对应的上传地址
      const baseUrl = 'http://127.0.0.1:8000'
      
      if (this.addDialogVisible && this.currentRecordId) {
        // 添加预警记录时的图片上传
        return `${baseUrl}/api/v1/alert-archives/alerts/${this.currentRecordId}/upload/image`
      } else if (this.addArchiveDialogVisible && this.currentArchiveId) {
        // 添加档案时的图片上传
        return `${baseUrl}/api/v1/alert-archives/${this.currentArchiveId}/upload/image`
      } else {
        // 临时上传地址（新建时还没有ID）
        return `${baseUrl}/api/v1/alert-archives/upload/temp`
      }
    },
    
    // 视频上传地址
    videoUploadAction() {
      const baseUrl = 'http://127.0.0.1:8000'
      
      if (this.currentRecordId) {
        return `${baseUrl}/api/v1/alert-archives/alerts/${this.currentRecordId}/upload/video`
      } else {
        return `${baseUrl}/api/v1/alert-archives/upload/temp-video`
      }
    },
    
    // 上传请求头
    uploadHeaders() {
      return {
        'Authorization': 'Bearer ' + (localStorage.getItem('token') || ''),
        'Accept': 'application/json'
      }
    }
  },
  
  mounted() {
    this.initData();
  },
  methods: {
    // 获取预览图片URL
    getPreviewImage() {
      // 这里返回一个实际的图片URL，可以是本地资源或远程URL
      return 'https://via.placeholder.com/300x200/ecf5ff/409eff?text=预览图片';
    },
    // 显示图片预览
    showImagePreview(row) {
      const imageUrl = row.violationImage || row.image;
      if (imageUrl) {
        this.currentPreviewImage = imageUrl;
        this.imagePreviewVisible = true;
      } else {
        this.$message.warning('该预警暂无图片');
      }
    },
     // 初始化数据 - 直接使用真实API
     async initData() {
       try {
         // 加载档案列表
         await this.loadArchivesList();
         
         // 如果有档案，加载第一个档案的详情
         if (this.archivesList.length > 0) {
           const firstArchive = this.archivesList[0];
           this.currentArchiveId = firstArchive.archive_id || firstArchive.id;
           
           await Promise.all([
             this.loadArchiveDetail(this.currentArchiveId),
             this.loadArchiveAlerts(this.currentArchiveId)
           ]);
         }
       } catch (error) {
         console.error('初始化数据失败:', error);
         this.$message.error('加载数据失败: ' + error.message);
       }
     },


    // 加载档案列表
    async loadArchivesList(params = {}) {
      try {
        const queryParams = {
          page: this.archivesPagination.currentPage,
          limit: this.archivesPagination.pageSize,
          ...params
        };

        console.log('获取档案列表参数:', queryParams);

        const response = await archiveAPI.getArchiveList(queryParams);
        
        // 适配新的API响应格式：检查是否为包装格式或直接数据格式
        let archiveData;
        let paginationData;
        
        if (response.data.code !== undefined) {
          // 包装格式 {code, msg, data, pagination}
          if (response.data.code === 0) {
            archiveData = response.data.data || [];
            paginationData = response.data.pagination;
          } else {
            throw new Error(response.data.msg || '获取档案列表失败');
          }
        } else if (response.data.data) {
          // 新的包装格式 {data, pagination}
          archiveData = response.data.data || [];
          paginationData = response.data.pagination;
        } else if (Array.isArray(response.data)) {
          // 直接数组格式
          archiveData = response.data;
        } else {
          // 单个对象格式，转为数组
          archiveData = [response.data];
        }
        
        // 更新档案列表数据，转换格式以适配前端显示
        this.archivesList = archiveData.map(archive => ({
          id: archive.archive_id,
          archive_id: archive.archive_id,
          name: archive.name,
          location: archive.location,
          timeRange: `${archive.start_time}-${archive.end_time}`,
          createTime: archive.created_at,
          description: archive.description || '-',
          image: archive.image_url || ''
        }));
        
        // 更新分页信息
        if (paginationData) {
          this.archivesPagination.total = paginationData.total || 0;
          this.archivesPagination.currentPage = paginationData.page || 1;
          this.archivesPagination.pageSize = paginationData.limit || 20;
        }
        
        console.log('档案列表加载成功:', this.archivesList);
        console.log('分页信息:', this.archivesPagination);
      } catch (error) {
        console.error('加载档案列表失败:', error);
        throw error;
      }
    },

    // 加载档案详情
    async loadArchiveDetail(archiveId) {
      try {
        if (!archiveId) return;

        const response = await archiveAPI.getArchiveDetail(archiveId);
        
        // 适配新的API响应格式
        let archiveData;
        if (response.data.code !== undefined) {
          // 包装格式 {code, msg, data}
          if (response.data.code === 0) {
            archiveData = response.data.data;
          } else {
            throw new Error(response.data.msg || '获取档案详情失败');
          }
        } else {
          // 直接数据格式
          archiveData = response.data;
        }
        
        this.archiveInfo = {
          id: archiveData.archive_id,
          archive_id: archiveData.archive_id,
          name: archiveData.name,
          location: archiveData.location,
          timeRange: `${archiveData.start_time}-${archiveData.end_time}`,
          createTime: archiveData.created_at,
          description: archiveData.description || '-',
          image: archiveData.image_url || ''
        };
        
        console.log('档案详情加载成功:', this.archiveInfo);
      } catch (error) {
        console.error('加载档案详情失败:', error);
        throw error;
      }
    },

    // 加载档案下的预警记录 - 真分页
    async loadArchiveAlerts(archiveId, params = {}) {
      try {
        if (!archiveId) return;

        // 使用当前分页配置，但限制在后端允许的范围内
        const limit = Math.min(this.pagination.pageSize, 100); // 不超过后端限制100
        const queryParams = {
          page: this.pagination.currentPage,
          limit: limit,
          ...params
        };

        console.log(`加载第${this.pagination.currentPage}页预警记录，每页${limit}条...`);
        const response = await archiveAPI.getArchiveLinkedAlerts(archiveId, queryParams);
        
        // 适配新的API响应格式
        let alertRecords = [];
        let totalCount = 0;
        let pages = 0;
        
        if (response.data.code !== undefined) {
          // 包装格式 {code, message, data}
          if (response.data.code === 0) {
            const data = response.data.data || {};
            alertRecords = data.items || [];
            totalCount = data.total || 0;
            pages = data.pages || 1;
          } else {
            throw new Error(response.data.message || '获取预警记录失败');
          }
        } else if (response.data.data) {
          // 新的包装格式 {data, pagination}
          alertRecords = response.data.data || [];
          if (response.data.pagination) {
            totalCount = response.data.pagination.total;
            pages = response.data.pagination.pages;
          } else {
            totalCount = alertRecords.length;
            pages = 1;
          }
        } else if (Array.isArray(response.data)) {
          // 直接数组格式
          alertRecords = response.data;
          totalCount = alertRecords.length;
          pages = 1;
        } else {
          // 单个对象格式，转为数组
          alertRecords = [response.data];
          totalCount = 1;
          pages = 1;
        }
        
        // 转换数据格式以适配前端显示，同时保留原始API数据
        this.archiveList = alertRecords.map(record => ({
          id: record.alert_id,
          name: record.alert_name,
          deviceName: record.camera_name,
          warningTime: record.alert_time,
          warningLevel: this.convertAlertLevel(record.alert_level),
          warningType: record.alert_type || '',
          location: record.location || '',
          description: record.alert_description || '',
          remark: record.processing_notes || '',
          violationImage: record.minio_frame_url || '',
          violationVideo: record.minio_video_url || '',
          status: record.status || 1,
          createTime: record.created_at,
          // 保留原始API数据供详情页面构建完整的处理进展使用
          _apiData: record
        }));

        // 更新分页信息
        this.pagination.total = totalCount;
        
        console.log(`预警记录加载成功，第${this.pagination.currentPage}页，共${totalCount}条记录`);
      } catch (error) {
        console.error('加载预警记录失败:', error);
        this.archiveList = [];
        this.pagination.total = 0;
      }
    },

     // 转换预警等级格式（从后端的1-4转换为前端的level1-level4）
     convertAlertLevel(backendLevel) {
       const levelMap = {
         1: 'level1',
         2: 'level2', 
         3: 'level3',
         4: 'level4'
       };
       return levelMap[backendLevel] || 'level1';
     },
    // 生成特定档案的模拟数据
    generateMockDataForArchive(archive) {
      const data = [];
      const devices = [
        'EF两区特检测区10社',
        '降盐水泵废水站',
        '东15风机',
        '齐心爱A20储产',
        'EF两区特检测区10社'
      ];
      
      const warningNames = [
        '安全帽识别',
        '工服识别',
        '安全帽识别',
        '玻璃运输车打卡',
        '烟火检测',
        '安全帽识别',
        '工服识别',
        '安全帽识别',
        '玻璃运输车打卡'
      ];

      const warningTypes = [
        '安全违规',
        '安全违规',
        '安全违规',
        '车辆违规',
        '消防违规',
        '安全违规',
        '安全违规',
        '安全违规',
        '车辆违规'
      ];

      const locations = [
        '厂区A10车间东区',
        '废水处理站入口',
        '东15风机房',
        '储产区域A20',
        'EF两区特检测区'
      ];

      const remarks = [
        '已现场提醒，工人已佩戴安全帽',
        '已督促整改，现已规范穿着',
        '已加强现场监督管理',
        '车辆已完成打卡登记',
        '已清理现场，加强禁烟宣传',
        '',
        '现场已整改完毕',
        '',
        ''
      ];
      
      // 根据档案ID决定生成多少条数据
      const count = archive.id === 1 ? 9 : (archive.id === 2 ? 6 : (archive.id === 3 ? 8 : 5));
      
      for (let i = 1; i <= count; i++) {
        const randomLevel = Math.floor(Math.random() * 4);
        const level = ['level1', 'level2', 'level3', 'level4'][randomLevel];
        let deviceName;
        
        // 根据档案类型选择对应的设备名
        if (archive.id === 1) {
          deviceName = i % 3 === 0 ? '厂区A10车间' : '厂区A10车间区域' + (i % 5 + 1);
        } else if (archive.id === 2) {
          deviceName = '东15风机';
        } else if (archive.id === 3) {
          deviceName = 'EF两区特检测区10社';
        } else {
          deviceName = '降盐水泵废水站';
        }
        
        // 生成时间
        const currentYear = 2024;
        const randomMonth = Math.floor(Math.random() * 6) + 7; // 7-12月，更接近现在
        const randomDay = Math.floor(Math.random() * 28) + 1;
        const randomHour = Math.floor(Math.random() * 24);
        const randomMinute = Math.floor(Math.random() * 60);
        const randomSecond = Math.floor(Math.random() * 60);
        
        const warningTime = `${currentYear}-${randomMonth.toString().padStart(2, '0')}-${randomDay.toString().padStart(2, '0')} ${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}:${randomSecond.toString().padStart(2, '0')}`;
        
        data.push({
          id: i,
          name: warningNames[(i - 1) % warningNames.length] || `预警${i}`,
          image: this.getPreviewImage(),
          deviceName: deviceName,
          warningTime: warningTime,
          warningLevel: i % 4 === 0 ? 'level1' : (i % 4 === 1 ? 'level2' : (i % 4 === 2 ? 'level3' : 'level4')),
          warningType: warningTypes[(i - 1) % warningTypes.length] || '其他违规',
          location: locations[(i - 1) % locations.length] || archive.location,
          remark: remarks[(i - 1) % remarks.length] || '',
          description: this.getDescriptionByType(warningNames[(i - 1) % warningNames.length]),
          violationImage: this.getPreviewImage(),
          violationVideo: ''
        });
      }
      return data;
    },
    // 根据预警类型生成默认描述
    getDescriptionByType(type) {
      const descriptionMap = {
        '安全帽识别': '检测到工作人员未佩戴安全帽，存在严重安全隐患，请立即整改并加强安全教育',
        '工服识别': '发现工作人员未按规定穿着工作服，违反现场作业安全规范，需要立即纠正',
        '玻璃运输车打卡': '玻璃运输车辆未按规定进行打卡登记，违反车辆管理规定，请督促司机规范操作',
        '烟火检测': '检测到禁烟区域有吸烟行为，存在火灾隐患，请立即制止并进行安全教育',
      };
      return descriptionMap[type] || `检测到${type}违规行为，请及时处理并加强现场管理`;
    },
    // 切换到指定档案 - 直接使用API调用
    async switchToArchive(archiveId) {
      try {
        this.currentArchiveId = archiveId;
        
        // 并行加载档案详情和预警记录
        await Promise.all([
          this.loadArchiveDetail(archiveId),
          this.loadArchiveAlerts(archiveId)
        ]);
        
        // 重置分页到第一页
        this.pagination.currentPage = 1;
      } catch (error) {
        console.error('切换档案失败:', error);
        this.$message.error('切换档案失败: ' + error.message);
      }
    },
    // 页码改变 - 重新加载数据
    async handleCurrentChange(page) {
      this.pagination.currentPage = page;
      if (this.currentArchiveId) {
        await this.loadArchiveAlerts(this.currentArchiveId);
      }
    },
    // 每页条数改变 - 重新加载数据
    async handleSizeChange(size) {
      this.pagination.pageSize = size;
      this.pagination.currentPage = 1; // 重置到第一页
      if (this.currentArchiveId) {
        await this.loadArchiveAlerts(this.currentArchiveId);
      }
    },
    // 档案列表分页 - 页码改变
    async handleArchivesCurrentChange(page) {
      this.archivesPagination.currentPage = page;
      await this.loadArchivesList();
    },
    // 档案列表分页 - 每页条数改变
    async handleArchivesSizeChange(size) {
      this.archivesPagination.pageSize = size;
      this.archivesPagination.currentPage = 1; // 重置到第一页
      await this.loadArchivesList();
    },
    // 表格选择事件
    handleSelectionChange(selection) {
      this.selectedRows = selection; // 保存完整的选中对象数组
      this.selectAll = selection.length === this.archiveList.length;
    },
    // 查看详情（对齐warningManagement：拉取详情并构建时间线）
    async showDetail(record) {
      try {
        console.log('warningArchives showDetail - 原始记录数据:', record);

        // 先构建基础对象（立即展示基本信息）
        const baseWarning = {
        id: record.id,
        device: record.deviceName,
          deviceInfo: {
            name: record.deviceName,
            position: record.location || this.archiveInfo.location
          },
        type: record.name,
        time: record.warningTime,
        level: record.warningLevel,
        location: record.location || this.archiveInfo.location,
        remark: record.remark,
          description: record.description || this.getDescriptionByType(record.name),
          imageUrl: record.violationImage || null,
          videoUrl: record.violationVideo || null,
          minio_frame_url: record.violationImage || null,
          minio_video_url: record.violationVideo || null,
          status: 'completed',
          operationHistory: [],
          _apiData: record._apiData || null
        };

        this.currentWarning = baseWarning;
      this.warningDetailVisible = true;

        // 获取详情以还原完整process，与管理页一致
        const apiAlertId = (record._apiData && record._apiData.alert_id) || record.id;
        if (!apiAlertId) return;

        const resp = await alertAPI.getAlertDetail(apiAlertId);
        const apiDetail = resp && resp.data ? resp.data : null;
        if (!apiDetail) return;

        // 优先用process构建时间线，其次用其他字段，最后回退基础构建
        let history = [];
        if (apiDetail.process) {
          history = this.processApiDataHistory(apiDetail);
        } else {
          history = this.buildFromApiData(apiDetail);
        }

        // 更新currentWarning，覆盖operationHistory与_apiData
        this.currentWarning = {
          ...this.currentWarning,
          operationHistory: history,
          _apiData: apiDetail
        };

        console.log('warningArchives showDetail - 详情拉取完成，时间线条数:', history.length);
      } catch (error) {
        console.error('warningArchives showDetail 获取详情失败，使用基础时间线:', error);
        // 回退：如果没有详情，则用本地构建
        this.currentWarning = {
          ...this.currentWarning,
          operationHistory: this.buildOperationHistory(record)
        };
      }
    },
    
    // 为档案预警构建完整的操作历史，参考warningManagement页面的逻辑
    buildOperationHistory(record) {
      console.log('构建操作历史，记录数据:', record);
      
      // 如果记录中有原始API数据且包含process字段，优先使用真实数据
      if (record._apiData && record._apiData.process) {
        console.log('发现API数据中的process字段，使用真实处理进展:', record._apiData.process);
        return this.processApiDataHistory(record._apiData);
      }
      
      // 如果有原始API数据但没有process字段，从其他API字段构建
      if (record._apiData && (record._apiData.processing_notes || record._apiData.processed_by || record._apiData.status)) {
        console.log('从API数据的其他字段构建操作历史');
        return this.buildFromApiData(record._apiData);
      }
      
      // 如果没有API数据，使用档案记录本身的信息构建基本历史
      console.log('使用档案记录构建基本操作历史');
      return this.buildBasicHistory(record);
    },
    
    // 处理API数据中的process字段，与warningManagement页面保持一致
    processApiDataHistory(apiData) {
      const allRecords = [];
      const processData = apiData.process;
      
      // 处理steps数组
      if (processData.steps && Array.isArray(processData.steps)) {
        processData.steps.forEach(step => {
          // 根据步骤状态确定显示状态
          let recordStatus = 'completed';
          if (step.status === 'active' || step.status === 'processing' || step.status === 'in_progress') {
            recordStatus = 'active';
          } else if (step.status === 'pending' || step.status === 'waiting') {
            recordStatus = 'pending';
          }
          
          const record = {
            id: Date.now() + Math.random(),
            status: recordStatus,
            statusText: step.step || step.title || '处理步骤',
            time: this.formatApiTime(step.time || step.timestamp),
            description: step.desc || step.description || '处理描述',
            operationType: step.step === '预警产生' ? 'create' : 'process',
            operator: step.operator || step.handler || '系统'
          };
          allRecords.push(record);
        });
      }
      
      // 处理其他process字段（records, logs, timeline等）
      ['records', 'logs', 'timeline', 'status_updates'].forEach(fieldName => {
        if (processData[fieldName] && Array.isArray(processData[fieldName])) {
          processData[fieldName].forEach((item, index) => {
            // 根据项目状态确定显示状态
            let recordStatus = 'completed';
            if (item.status === 'active' || item.status === 'processing' || item.status === 'in_progress') {
              recordStatus = 'active';
            } else if (item.status === 'pending' || item.status === 'waiting') {
              recordStatus = 'pending';
            }
            
            const record = {
              id: Date.now() + Math.random() + index + 1000,
              status: recordStatus,
              statusText: item.action || item.event || item.step || item.title || fieldName.slice(0, -1),
              time: this.formatApiTime(item.time || item.timestamp),
              description: item.description || item.message || item.detail || item.notes || '',
              operationType: item.type || fieldName.slice(0, -1),
              operator: item.operator || item.user || item.handler || '系统'
            };
            allRecords.push(record);
          });
        }
      });
      
      // 按时间排序（最新的在前面）
      allRecords.sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return timeB - timeA;
      });
      
      console.log('从process字段构建的操作历史:', allRecords);
      return allRecords;
    },
    
    // 从API数据的其他字段构建操作历史
    buildFromApiData(apiData) {
      const history = [];
      
      // 1. 预警产生记录
      history.push({
        id: Date.now() + 1,
        status: 'completed',
        statusText: '预警产生',
        time: this.formatApiTime(apiData.alert_time || apiData.created_at),
        description: `系统检测到${apiData.alert_name || '违规行为'}`,
        operationType: 'create',
        operator: '系统'
      });
      
      // 2. 根据API状态添加相应记录，与warningManagement页面逻辑一致
      if (apiData.status === 2) {
        // 处理中状态
        history.push({
          id: Date.now() + 2,
          status: 'active',
          statusText: '处理中',
          time: this.formatApiTime(apiData.updated_at || apiData.created_at),
          description: '预警正在处理中',
          operationType: 'processing',
          operator: apiData.processed_by || '处理人员'
        });
      } else if (apiData.status === 3) {
        // 已处理状态
        history.push({
          id: Date.now() + 2,
          status: 'completed',
          statusText: '已处理',
          time: this.formatApiTime(apiData.processed_at || apiData.updated_at),
          description: `预警处理已完成${apiData.processing_notes ? '，处理意见：' + apiData.processing_notes : ''}`,
          operationType: 'completed',
          operator: apiData.processed_by || '处理人员'
        });
      } else if (apiData.status === 4) {
        // 已归档状态
        history.push({
          id: Date.now() + 2,
          status: 'completed',
          statusText: '已归档',
          time: this.formatApiTime(apiData.archived_at || apiData.updated_at),
          description: '预警已归档',
          operationType: 'archive',
          operator: apiData.archived_by || '管理员'
        });
      } else if (apiData.status === 5) {
        // 误报状态
        history.push({
          id: Date.now() + 2,
          status: 'completed',
          statusText: '误报',
          time: this.formatApiTime(apiData.processed_at || apiData.updated_at),
          description: '预警已标记为误报',
          operationType: 'falseAlarm',
          operator: apiData.processed_by || '管理员'
        });
      }
      
      // 按时间倒序排列（最新的在前面）
      return history.reverse();
    },
    
    // 构建基本操作历史（当没有API数据时）
    buildBasicHistory(record) {
      const history = [];
      
      // 1. 预警产生记录
      history.push({
        id: Date.now() + 1,
        status: 'completed',
        statusText: '预警产生',
        time: record.warningTime || record.createTime || this.getCurrentTime(),
        description: `系统检测到${record.name}违规行为：${record.description || this.getDescriptionByType(record.name)}`,
        operationType: 'create',
        operator: '系统'
      });
      
      // 2. 处理开始记录
      const processStartTime = this.addSecondsToTime(record.warningTime || record.createTime || this.getCurrentTime(), 120);
      history.push({
        id: Date.now() + 2,
        status: 'completed',
        statusText: '开始处理',
        time: processStartTime,
        description: '预警已确认，处理人员开始进行现场处理',
        operationType: 'processing',
        operator: '处理人员'
      });
      
      // 3. 如果有备注信息，添加处理记录
      if (record.remark && record.remark.trim()) {
        const processRecordTime = this.addSecondsToTime(processStartTime, 300);
        history.push({
          id: Date.now() + 3,
          status: 'completed',
          statusText: '处理记录',
          time: processRecordTime,
          description: `处理意见：${record.remark}`,
          operationType: 'processing',
          operator: '处理人员'
        });
      }
      
      // 4. 处理完成记录
      const completedTime = this.addSecondsToTime(processStartTime, record.remark ? 600 : 300);
      history.push({
        id: Date.now() + 4,
        status: 'completed',
        statusText: '处理完成',
        time: completedTime,
        description: '预警处理已完成，违规行为得到有效控制',
        operationType: 'completed',
        operator: '处理人员'
      });
      
      // 5. 归档记录
      const archiveTime = this.addSecondsToTime(completedTime, 180);
      history.push({
        id: Date.now() + 5,
        status: 'completed',
        statusText: '预警归档',
        time: archiveTime,
        description: `预警已归档到：${this.archiveInfo.name || '当前档案'}，可在预警档案中查看`,
        operationType: 'archive',
        operator: '系统'
      });
      
      // 按时间倒序排列（最新的在前面）
      return history.reverse();
    },
    
    // 格式化API时间，与warningManagement页面保持一致
    formatApiTime(timeString) {
      if (!timeString) return this.getCurrentTime();
      
      try {
        let date;
        if (timeString.includes('T')) {
          // ISO格式: "2025-06-30T17:05:35"
          date = new Date(timeString);
        } else if (timeString.includes(' ')) {
          // 标准格式 YYYY-MM-DD HH:mm:ss
          date = new Date(timeString);
        } else {
          // 其他格式
          date = new Date(timeString);
        }
        
        if (isNaN(date.getTime())) {
          return timeString; // 如果解析失败，返回原字符串
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } catch (error) {
        return timeString || this.getCurrentTime();
      }
    },
    
    // 获取当前时间
    getCurrentTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    
    // 给时间添加指定秒数
    addSecondsToTime(timeString, seconds) {
      try {
        let date;
        if (timeString.includes('T')) {
          date = new Date(timeString);
        } else if (timeString.includes(' ')) {
          date = new Date(timeString);
        } else {
          date = new Date();
        }
        
        if (isNaN(date.getTime())) {
          return timeString;
        }
        
        date.setSeconds(date.getSeconds() + seconds);
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const secs = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${secs}`;
      } catch (error) {
        return timeString;
      }
    },
    
    // 从预警详情组件处理预警
    handleWarningFromDetail(warning) {
      this.$message({
        message: `正在处理 ${warning.device} 的 ${warning.type} 预警`,
        type: 'success'
      });
      this.warningDetailVisible = false;
    },
    // 处理单条删除
    handleDelete(id) {
      console.log('单条删除被触发，ID:', id, '当前档案ID:', this.currentArchiveId);
      
      if (!id) {
        this.$message.error('删除失败：缺少记录ID');
        return;
      }
      
      if (!this.currentArchiveId) {
        this.$message.error('删除失败：未选择档案');
        return;
      }
      
      this.deleteType = 'single';
      this.deleteId = id;
      this.deleteConfirmMessage = '确定要删除该预警记录吗？';
      this.deleteConfirmVisible = true;
    },
    // 处理批量删除
    handleBatchDelete() {
      console.log('批量删除被触发，选中行数:', this.selectedRows.length);
      console.log('选中的行数据:', this.selectedRows);
      
      if (this.selectedRows.length === 0) {
        this.$message.warning('请至少选择一条记录');
        return;
      }

      if (!this.currentArchiveId) {
        this.$message.error('删除失败：未选择档案');
        return;
      }

      this.deleteType = 'batch';
      this.deleteConfirmMessage = `确定要删除选中的 ${this.selectedRows.length} 条记录吗？`;
      this.deleteConfirmVisible = true;
    },
    // 确认删除 - 调用后端API
    async confirmDelete() {
      try {
        if (this.deleteType === 'single') {
          // 单条删除 - 使用增强的deleteAlertRecord方法，支持archive_id参数
          const response = await archiveAPI.deleteAlertRecord(this.deleteId, this.currentArchiveId);
          
          // 适配API响应格式
          if (response.data.code !== undefined) {
            if (response.data.code === 0) {
              this.$message.success('删除成功');
            } else {
              throw new Error(response.data.msg || '删除失败');
            }
          } else {
            this.$message.success('删除成功');
          }
        } else {
          // 批量删除 - 提取ID数组
          const recordIds = this.selectedRows.map(row => row.id);
          
          console.log('选中的行对象:', this.selectedRows);
          console.log('提取的批量删除IDs:', recordIds);
          
          // 验证ID是否有效
          if (recordIds.some(id => id === null || id === undefined)) {
            console.error('检测到无效的记录ID:', recordIds);
            this.$message.error('选中的记录包含无效ID，请刷新页面后重试');
            return;
          }
          
          const response = await archiveAPI.batchDeleteAlertRecords(recordIds);
          
          // 适配API响应格式
          if (response.data.code !== undefined) {
            if (response.data.code === 0) {
              this.$message.success('批量删除成功');
            } else {
              throw new Error(response.data.msg || '批量删除失败');
            }
          } else {
            this.$message.success('批量删除成功');
          }
          
          this.selectedRows = [];
        }
        
        // 重新加载当前页数据
        await this.loadArchiveAlerts(this.currentArchiveId);
        this.deleteConfirmVisible = false;
      } catch (error) {
        console.error('删除操作失败:', error);
        this.$message.error('删除失败: ' + error.message);
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
      
      // 确保编辑时显示原有图片
      if (!this.editForm.image) {
        this.editForm.image = this.getPreviewImage();
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

        console.log('更新档案数据:', updateData);

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

        // 重新加载档案列表和详情以获取最新数据
        await this.loadArchivesList();
        await this.loadArchiveDetail(this.currentArchiveId);

        // 关闭编辑对话框
        this.isEditing = false;
        this.editDialogVisible = false;

        console.log('档案更新成功:', updatedArchive);
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
      this.loadAvailableAlerts();
    },
     // 提交新预警 - 调用真实API
     async submitNewWarning() {
       try {
         // 表单验证
         if (!this.addForm.name || !this.addForm.deviceName || !this.addForm.warningLevel || 
             !this.addForm.warningTime || !this.addForm.warningType || !this.addForm.location) {
           this.$message.warning('请填写必要的信息（预警名称、设备名称、预警等级、预警时间、预警类型、违规位置）');
           return;
         }

         // 检查是否选择了档案
         if (!this.currentArchiveId) {
           this.$message.warning('请先选择一个档案再添加预警记录');
           return;
         }

         // 转换预警等级格式（从前端的level1-level4转换为后端的1-4）
         const convertToBackendLevel = (frontendLevel) => {
           const levelMap = {
             'level1': 1,
             'level2': 2,
             'level3': 3,
             'level4': 4
           };
           return levelMap[frontendLevel] || 1;
         };

         // 构造后端API需要的数据格式
         const recordData = {
           archive_id: this.currentArchiveId,
           name: this.addForm.name,
           device_name: this.addForm.deviceName,
           alert_time: this.addForm.warningTime,
           alert_level: convertToBackendLevel(this.addForm.warningLevel),
           alert_type: this.addForm.warningType || '',
           location: this.addForm.location || '',
           description: this.addForm.description || '',
           remark: '', // 新建时备注为空
           violation_image_url: this.addForm.violationImage || '',
           violation_video_url: this.addForm.violationVideo || '',
           created_by: '当前用户' // 这里应该从用户信息中获取
         };

         console.log('添加预警记录数据:', recordData);

        // 调用后端API添加预警记录
        const response = await archiveAPI.addAlertRecord(recordData);
        
        // 适配新的API响应格式
        let newRecord;
        if (response.data.code !== undefined) {
          // 包装格式 {code, msg, data}
          if (response.data.code === 0) {
            newRecord = response.data.data;
          } else {
            throw new Error(response.data.msg || '添加预警记录失败');
          }
        } else {
          // 直接数据格式
          newRecord = response.data;
        }
        
        this.$message.success('预警记录添加成功');
        
        // 重新加载当前档案的预警记录
        await this.loadArchiveAlerts(this.currentArchiveId);
        
        // 关闭对话框并重置表单
        this.addDialogVisible = false;
        this.resetAddForm();
        
        console.log('预警记录添加成功:', newRecord);
       } catch (error) {
         console.error('添加预警记录失败:', error);
         this.$message.error('添加预警记录失败: ' + error.message);
       }
     },

      // 重置添加预警表单
      resetAddForm() {
        this.addForm = {
          name: '',
          deviceName: '',
          warningLevel: '',
          warningType: '',
          location: '',
          description: '',
          warningTime: '',
          violationImage: '',
          violationVideo: ''
        };
      },

      // ======================== 已发生预警选择相关方法 ========================

      // 加载可用的预警列表
      async loadAvailableAlerts() {
        try {
          this.availableAlertsLoading = true;
          
          const params = {
            page: this.availableAlertsPagination.currentPage,
            limit: this.availableAlertsPagination.pageSize,
            exclude_archived: true,
            ...this.alertFilters
          };

          // 过滤空值
          Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null || params[key] === undefined) {
              delete params[key];
            }
          });

          console.log('加载可用预警列表参数:', params);

          const response = await archiveAPI.getAvailableAlerts(params);
          
          if (response.data && response.data.code === 0) {
            this.availableAlerts = response.data.data.items || [];
            this.availableAlertsPagination.total = response.data.data.total || 0;
            this.availableAlertsPagination.currentPage = response.data.data.page || 1;
            console.log('可用预警列表加载成功:', this.availableAlerts);
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
          skill_name: '',
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
        this.selectedAlerts = selection;
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

        if (!this.currentArchiveId) {
          this.$message.error('未选择档案');
          return;
        }

        try {
          this.availableAlertsLoading = true;
          
          const alertIds = this.selectedAlerts.map(alert => alert.alert_id);
          const linkReason = `批量添加预警到档案：${this.currentArchiveName || ''}`;

          console.log('批量关联预警到档案:', { 
            archiveId: this.currentArchiveId, 
            alertIds, 
            linkReason 
          });

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
              
              // 重新加载当前档案的预警记录
              await this.loadArchiveAlerts(this.currentArchiveId);
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
          this.$message.error('添加预警失败: ' + error.message);
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
        const levelMap = {
          1: '一级预警',
          2: '二级预警',
          3: '三级预警',
          4: '四级预警'
        };
        return levelMap[level] || '未知等级';
      },

      // 转换处理状态显示
      convertStatusDisplay(status) {
        const statusMap = {
          1: '待处理',
          2: '处理中',
          3: '已处理',
          4: '已归档',
          5: '误报'
        };
        return statusMap[status] || '未知状态';
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


      // 预览预警详情
      previewAlert(alert) {
        // 这里可以打开预警详情弹框或跳转到详情页面
        console.log('预览预警详情:', alert);
        this.$message.info(`预警详情：${alert.alert_name} (ID: ${alert.alert_id})`);
        
        // 可以根据需要实现详情弹框或其他预览方式
        // 例如：this.showAlertDetailDialog(alert);
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
       try {
         // 表单验证
         if (!this.newArchiveForm.name || !this.newArchiveForm.location) {
           this.$message.warning('请填写必要的信息（档案名称和所属位置必须填写）');
           return;
         }

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

         // 构造后端API需要的数据格式
         const archiveData = {
           name: this.newArchiveForm.name,
           location: this.newArchiveForm.location,
           description: this.newArchiveForm.description || '',
           start_time: startTime,
           end_time: endTime,
           image_url: this.newArchiveForm.image || '',
           created_by: '当前用户' // 这里应该从用户信息中获取
         };

         console.log('创建档案数据:', archiveData);

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
        
        // 重置档案分页到第一页并重新加载档案列表
        this.archivesPagination.currentPage = 1;
        await this.loadArchivesList();
        
        // 如果创建成功，切换到新创建的档案
        if (newArchive && newArchive.archive_id) {
          this.currentArchiveId = newArchive.archive_id;
          await this.loadArchiveDetail(newArchive.archive_id);
          await this.loadArchiveAlerts(newArchive.archive_id);
        }
        
        // 关闭对话框并重置表单
        this.addArchiveDialogVisible = false;
        this.resetNewArchiveForm();
        
        console.log('档案创建成功:', newArchive);
       } catch (error) {
         console.error('创建档案失败:', error);
         this.$message.error('创建档案失败: ' + error.message);
       }
     },

     // 重置新档案表单
     resetNewArchiveForm() {
       this.newArchiveForm = {
         name: '',
         location: '',
         timeRange: [],
         description: '',
         image: ''
       };
     },
    // 处理上传成功后的逻辑
    handleUploadSuccess(response, file) {
      // 实际项目中应从服务器响应中获取图片URL
      // 这里使用本地文件预览URL作为演示
      const imageUrl = URL.createObjectURL(file.raw);
      
      // 根据上下文设置不同表单的图片
      if (this.editDialogVisible) {
        this.editForm.image = imageUrl;
      } else if (this.addArchiveDialogVisible) {
        this.newArchiveForm.image = imageUrl;
      }
      
      this.$message.success('图片上传成功');
    },
    // 处理上传前的图片校验
    beforeUpload(file) {
      // 检查文件类型
      const isImage = file.type.indexOf('image/') === 0;
      if (!isImage) {
        this.$message.error('只能上传图片文件!');
        return false;
      }
      
      // 检查文件大小，限制为2MB
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        this.$message.error('图片不能超过2MB!');
        return false;
      }
      
      return true;
    },
    // 处理上传错误
    handleUploadError(error) {
      console.error('上传错误', error);
      this.$message.error('图片上传失败，请重试');
    },
    // 处理移除图片
    handleRemove() {
      if (this.editDialogVisible) {
        this.editForm.image = '';
      } else if (this.addArchiveDialogVisible) {
        this.newArchiveForm.image = '';
      }
    },
    // 处理违规截图上传
    beforeImageUpload(file) {
      // 检查文件类型
      const isImage = file.type.indexOf('image/') === 0;
      if (!isImage) {
        this.$message.error('只能上传图片文件!');
        return false;
      }
      
      // 检查文件大小，限制为2MB
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        this.$message.error('图片不能超过2MB!');
        return false;
      }
      
      return true;
    },
    // 处理违规截图上传成功
    handleImageUploadSuccess(response, file) {
      // 实际项目中应从服务器响应中获取图片URL
      // 这里使用本地文件预览URL作为演示
      const imageUrl = URL.createObjectURL(file.raw);
      
      this.addForm.violationImage = imageUrl;
      
      this.$message.success('违规截图上传成功');
    },
    // 处理违规截图移除
    removeImage() {
      this.addForm.violationImage = '';
    },
    // 预览图片
    previewImage(imageUrl) {
      this.currentPreviewImage = imageUrl;
      this.imagePreviewVisible = true;
    },
    // 处理视频片段上传
    beforeVideoUpload(file) {
      // 检查文件类型
      const isVideo = file.type.indexOf('video/') === 0;
      if (!isVideo) {
        this.$message.error('只能上传视频文件!');
        return false;
      }
      
      // 检查文件大小，限制为10MB
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        this.$message.error('视频不能超过10MB!');
        return false;
      }
      
      return true;
    },
    // 处理视频片段上传成功
    handleVideoUploadSuccess(response, file) {
      // 实际项目中应从服务器响应中获取视频URL
      // 这里使用本地文件预览URL作为演示
      const videoUrl = URL.createObjectURL(file.raw);
      
      this.addForm.violationVideo = videoUrl;
      
      this.$message.success('视频片段上传成功');
    },
    // 处理视频片段移除
    removeVideo() {
      this.addForm.violationVideo = '';
    },
    // 格式化时间
    formatTime(timeString) {
      try {
        if (!timeString) return timeString;
        
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
        
        // 如果删除的是当前选中的档案，清空详情
        if (this.currentArchiveId === this.deleteArchiveId) {
          this.currentArchiveId = null;
          this.archiveInfo = {};
          this.archiveList = [];
        }
        
        // 重新加载档案列表
        await this.loadArchivesList();
        
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
    <!-- 内容区域 -->
    <div class="content-wrapper">
 
      <!-- 左侧档案信息区域 -->
      <div class="detail-section">
        <div class="detail-header">
          <div class="detail-title">档案基本信息</div>
          <div class="header-actions">
            <el-button type="primary" size="mini" @click="addNewArchive">添加档案</el-button>
          </div>
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
              <div class="archive-name">{{ archive.name }}</div>
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
            <el-button type="danger" size="small" class="batch-delete-btn" @click="handleBatchDelete" :disabled="selectedRows.length === 0">
              批量删除
            </el-button>
            <el-button type="primary" size="small" class="add-btn" @click="addWarning">
              <i class="el-icon-plus"></i> 添加预警
            </el-button>
          </div>
        </div>
        
        <!-- 表格卡片 -->
        <div class="table-section">
          <el-table :data="archiveList" @selection-change="handleSelectionChange" style="width: 100%">
            <el-table-column type="selection" width="55" align="center"></el-table-column>
            <el-table-column label="序号" prop="id" width="80" align="center"></el-table-column>
            <el-table-column label="预警名称" prop="name" min-width="120" align="center"></el-table-column>
            <el-table-column label="预警图片" width="100" align="center">
              <template slot-scope="scope">
                <div class="preview-image-cell">
                  <div class="mini-image-preview" @click="showImagePreview(scope.row)">
                    <div class="mini-blue-box">
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
            <el-table-column label="操作" width="120" align="center">
              <template slot-scope="scope">
                <div class="operation-buttons">
                  <el-button type="text" size="mini" @click="showDetail(scope.row)" class="operation-btn detail-btn">详情</el-button>
                  <el-button type="text" size="mini" @click="handleDelete(scope.row.id)" class="operation-btn delete-btn">删除</el-button>
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
      :warning="currentWarning"
      source="warningArchives"
      @handle-warning="handleWarningFromDetail"
    />

    <!-- 图片预览弹框 -->
    <el-dialog title="预警图片预览" :visible.sync="imagePreviewVisible" width="50%" custom-class="image-preview-dialog">
      <div class="image-preview-wrapper">
        <div class="preview-blue-box">
          <i class="el-icon-picture-outline"></i>
          <p>预警图片</p>
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
            <el-input v-model="alertFilters.alert_type" placeholder="预警类型" clearable style="width: 150px"></el-input>
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
          <el-form-item label="技能名称">
            <el-input v-model="alertFilters.skill_name" placeholder="技能名称" clearable style="width: 120px"></el-input>
          </el-form-item>
          <el-form-item label="位置">
            <el-input v-model="alertFilters.location" placeholder="位置" clearable style="width: 120px"></el-input>
          </el-form-item>
          <el-form-item label="预警ID">
            <el-input v-model="alertFilters.alert_id" placeholder="输入预警ID" clearable style="width: 150px" type="number"></el-input>
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
        <el-table-column type="selection" width="55" align="center"></el-table-column>
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
            请选择要添加到档案的预警
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

    <!-- 删除确认对话框 -->
    <el-dialog title="删除确认" :visible.sync="deleteConfirmVisible" width="25%" custom-class="delete-confirm-dialog"
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
          <el-input v-model="newArchiveForm.name"></el-input>
        </el-form-item>
        <el-form-item label="所属位置" required>
          <el-input v-model="newArchiveForm.location"></el-input>
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
        <el-button type="primary" @click="submitNewArchive" class="confirm-btn">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 删除档案确认对话框 -->
    <el-dialog title="删除档案确认" :visible.sync="deleteArchiveConfirmVisible" width="25%" custom-class="delete-confirm-dialog" center>
      <div class="confirm-content">
        <div class="confirm-icon">
          <i class="el-icon-warning" style="color: #f56c6c; font-size: 24px;"></i>
        </div>
        <p>确定要删除档案 "<strong>{{ deleteArchiveName }}</strong>" 吗？</p>
        <p style="color: #909399; font-size: 12px; margin-top: 8px;">删除后该档案及其关联的所有预警记录都将被删除，此操作不可恢复！</p>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="deleteArchiveConfirmVisible = false" class="cancel-btn">取 消</el-button>
        <el-button size="small" type="danger" @click="confirmDeleteArchive" class="confirm-btn">确认删除</el-button>
      </div>
    </el-dialog>

    <!-- 预警详情对话框 -->
    <WarningDetail
      :visible.sync="warningDetailVisible"
      :warning="currentWarning"
      source="warningArchives"
      @handle-warning="handleWarningFromDetail"
    />
  </div>
</template>

<style scoped>
.page-container {
  padding: 0;
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%);
  min-height: calc(100vh - 60px);
  position: relative;
}

/* 内容区域 */
.content-wrapper {
  display: flex;
  gap: 16px;
  padding: 16px;
  align-items: flex-start;
  height: calc(100vh - 92px);
}

/* 右侧容器包装器 */
.table-container-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}



/* 表格头部 */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(59, 130, 246, 0.1);
  margin-bottom: 16px;
  position: relative;
  z-index: 2;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e40af;
}

.table-actions {
  display: flex;
  gap: 10px;
}

/* 表格区域 */
.table-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

/* 移除表格竖线条 */
::v-deep .table-section .el-table--border td,
::v-deep .table-section .el-table--border th {
  border-right: none;
}

::v-deep .table-section .el-table::before,
::v-deep .table-section .el-table::after {
  display: none;
}

/* 调整el-table样式 */
::v-deep .table-section .el-table th {
  background: #f5f7fa !important;
  color: #303133 !important;
  font-weight: 500 !important;
  padding: 8px 0;
  text-align: center;
  border-bottom: 1px solid #ebeef5 !important;
}

::v-deep .table-section .el-table--border {
  border: none;
  border-radius: 0;
  overflow: hidden;
}

::v-deep .table-section .el-table td {
  padding: 8px 0;
  text-align: center;
  border-bottom: 1px solid #ebeef5 !important;
}

::v-deep .table-section .el-table__row:hover > td {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.03) 100%) !important;
}

::v-deep .table-section .el-table__row {
  border-bottom: 1px solid #ebeef5;
}

/* 预览图片单元格 */
.preview-image-cell {
  text-align: center;
}

.mini-image-preview {
  width: 80px;
  height: 50px;
  margin: 0 auto;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.2s;
  border: 1px solid #dcdfe6;
}

.mini-image-preview:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.mini-blue-box {
  width: 80px;
  height: 50px;
  background: linear-gradient(135deg, #e6f4ff 0%, #bae7ff 50%, #91d5ff 100%);
  border: 1px solid #d1e9ff;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  cursor: pointer;
  font-size: 10px;
  color: #0066cc;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.mini-blue-box:hover {
  background: linear-gradient(135deg, #d4edff 0%, #a3d5ff 50%, #7cb8e8 100%);
  color: #0052a3;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
}

.mini-blue-box i {
  font-size: 16px;
  margin-bottom: 2px;
}

.mini-blue-box span {
  font-weight: 500;
  white-space: nowrap;
}

/* 预警等级标签 - 科技感样式（参考摄像头页面状态标签） */
.level-tag {
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

.level-tag:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

/* 一级预警 - 危险红色渐变 */
.level1-tag {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%) !important;
  color: #991b1b !important;
  border-color: #fca5a5 !important;
}

/* 二级预警 - 警告橙色渐变 */
.level2-tag {
  background: linear-gradient(135deg, #fffbeb 0%, #fed7aa 100%) !important;
  color: #92400e !important;
  border-color: #fbbf24 !important;
}

/* 三级预警 - 信息蓝色渐变 */
.level3-tag {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  color: #1e40af !important;
  border-color: #93c5fd !important;
}

/* 四级预警 - 成功绿色渐变 */
.level4-tag {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
  color: #065f46 !important;
  border-color: #a7f3d0 !important;
}

/* 确保表格内的预警等级标签优先级足够高 */
.table-section >>> .el-table .level-tag {
  border-radius: 6px !important;
  font-weight: 500 !important;
  font-size: 12px !important;
  padding: 0 8px !important;
  height: 24px !important;
  line-height: 22px !important;
  transition: all 0.3s ease !important;
  border: 1px solid !important;
}

.table-section >>> .el-table .level-tag:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

/* 表格内预警等级标签的具体样式 */
.table-section >>> .el-table .level1-tag {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%) !important;
  color: #991b1b !important;
  border-color: #fca5a5 !important;
}

.table-section >>> .el-table .level2-tag {
  background: linear-gradient(135deg, #fffbeb 0%, #fed7aa 100%) !important;
  color: #92400e !important;
  border-color: #fbbf24 !important;
}

.table-section >>> .el-table .level3-tag {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  color: #1e40af !important;
  border-color: #93c5fd !important;
}

.table-section >>> .el-table .level4-tag {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
  color: #065f46 !important;
  border-color: #a7f3d0 !important;
}

/* 旧样式保留兼容 */
.high-level {
  background-color: #fff0f0;
  color: #f56c6c;
}

.medium-level {
  background-color: #fff8e6;
  color: #e6a23c;
}

.low-level {
  background-color: #e6f7e6;
  color: #67c23a;
}

/* 操作按钮 */
.detail-btn {
  color: #3b82f6;
  margin-right: 10px;
  transition: color 0.3s ease;
}

.detail-btn:hover {
  color: #1e40af;
}

.delete-btn {
  color: #f56c6c;
  transition: color 0.3s ease;
}

.delete-btn:hover {
  color: #dc2626;
}



/* 左侧详情部分 */
.detail-section {
  width: 330px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
  position: relative;
  overflow: hidden;
  height: 100%;
}



.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  position: relative;
  z-index: 2;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e40af;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.edit-btn {
  color: #409eff;
}

/* 档案列表样式 */
.archives-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px;
  min-height: 0;
}

/* 档案分页样式 */
.archives-pagination {
  padding: 10px;
  border-top: 1px solid rgba(59, 130, 246, 0.2);
  background: rgba(255, 255, 255, 0.8);
}

.archives-pagination >>> .el-pagination {
  display: flex;
  justify-content: center;
}

.archives-pagination >>> .el-pagination .el-pager li {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  color: #3b82f6;
  margin: 0 2px;
}

.archives-pagination >>> .el-pagination .el-pager li:hover {
  color: #1d4ed8;
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.05);
}

.archives-pagination >>> .el-pagination .el-pager li.active {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.archives-pagination >>> .el-pagination button {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.archives-pagination >>> .el-pagination button:hover {
  color: #1d4ed8;
  border-color: #3b82f6;
}

.archive-item {
  padding: 0;
  border-radius: 8px;
  margin: 8px 0;
  transition: all 0.3s;
  border: 1px solid rgba(59, 130, 246, 0.2);
  position: relative;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.archive-item:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.03) 100%);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.archive-item.active {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.archive-content {
  flex: 1;
  padding: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.archive-actions {
  padding: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.archive-item:hover .archive-actions {
  opacity: 1;
}

.delete-archive-btn {
  color: #f56c6c !important;
  padding: 4px !important;
  margin: 0 !important;
  font-size: 16px !important;
  border-radius: 4px !important;
  transition: all 0.3s ease !important;
  background: transparent !important;
  border: none !important;
}

.delete-archive-btn:hover {
  background: rgba(245, 108, 108, 0.1) !important;
  color: #dc2626 !important;
  transform: scale(1.1) !important;
}

.archive-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e40af;
}

.archive-location, .archive-time {
  font-size: 12px;
  color: #6b7280;
}

.detail-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 预览图片蓝色框 */
.preview-blue-box {
  width: 100%;
  height: 400px;
  background: linear-gradient(135deg, #e6f4ff 0%, #bae7ff 30%, #91d5ff 70%, #69c0ff 100%);
  border: 2px solid #d1e9ff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #0066cc;
  box-shadow: 
    0 8px 32px rgba(64, 158, 255, 0.2),
    inset 0 2px 16px rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}



.preview-blue-box i {
  font-size: 80px;
  margin-bottom: 20px;
  opacity: 0.8;
  z-index: 1;
  position: relative;
}

.preview-blue-box p {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  z-index: 1;
  position: relative;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

@keyframes shimmer {
  0%, 100% {
    transform: rotate(0deg) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: rotate(180deg) scale(1.1);
    opacity: 0.1;
  }
}

/* 详情蓝色框 */
.detail-image-box {
  height: 200px;
}

/* 信息列表 */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  font-size: 14px;
  line-height: 1.5;
  text-align: left;
}

.info-item .label {
  color: #606266;
  width: 80px;
  flex-shrink: 0;
  text-align: left;
}

.info-item .value {
  color: #333;
  flex: 1;
  text-align: left;
  word-break: break-all;
}

/* 档案操作按钮 */
.action-buttons {
  display: flex;
  justify-content: center;
}

.edit-archive-btn {
  width: 100%;
  border-radius: 4px;
}

/* 弹框样式 - 与 warningManagement.vue 一致 */
.page-container >>> .el-dialog {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.page-container >>> .el-dialog__header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1) !important;
  padding: 16px 20px !important;
}

.page-container >>> .el-dialog__title {
  color: #1f2937 !important;
  font-weight: 600 !important;
}

.page-container >>> .el-dialog__close {
  color: #6b7280 !important;
  transition: color 0.3s ease !important;
}

.page-container >>> .el-dialog__close:hover {
  color: #3b82f6 !important;
}

.page-container >>> .el-dialog__body {
  padding: 20px !important;
  background: #ffffff !important;
}

.page-container >>> .el-dialog__footer {
  padding: 10px 20px 20px;
  text-align: right;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* 上传组件样式优化 */
.page-container >>> .el-upload-dragger {
  border: 2px dashed #d1d5db !important;
  border-radius: 8px !important;
  transition: all 0.3s ease !important;
}

.page-container >>> .el-upload-dragger:hover {
  border-color: #3b82f6 !important;
  background-color: rgba(59, 130, 246, 0.05) !important;
}

.page-container >>> .el-upload-dragger .el-icon-upload {
  color: #3b82f6 !important;
}

.page-container >>> .el-upload__text {
  color: #6b7280 !important;
}

.page-container >>> .el-upload__text em {
  color: #3b82f6 !important;
  font-weight: 500 !important;
}

/* 表格样式优化 - 保持黑色字体 */
.page-container >>> .el-table th {
  background: #f5f7fa !important;
  color: #303133 !important;
  font-weight: 500 !important;
  padding: 8px 0;
  text-align: center;
  border-bottom: 1px solid #ebeef5 !important;
}

.page-container >>> .el-table td {
  padding: 8px 0;
  text-align: center;
  border-bottom: 1px solid #ebeef5 !important;
}

.page-container >>> .el-table__row:hover > td {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.03) 100%) !important;
}

/* 科技感 Radio 样式 */
.page-container >>> .el-radio__input.is-checked .el-radio__inner {
  background-color: #3b82f6 !important;
  border-color: #3b82f6 !important;
}

.page-container >>> .el-radio__inner:hover {
  border-color: #3b82f6 !important;
}

/* 科技感 Checkbox 样式 */
.page-container >>> .el-checkbox__input.is-checked .el-checkbox__inner {
  background-color: #3b82f6 !important;
  border-color: #3b82f6 !important;
}

.page-container >>> .el-checkbox__inner:hover {
  border-color: #3b82f6 !important;
}

/* 科技感 Tag 样式 */
.page-container >>> .el-tag {
  border-radius: 6px !important;
  font-weight: 500 !important;
}

/* 操作按钮样式 */
.operation-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.operation-btn {
  padding: 4px 8px !important;
  font-size: 12px !important;
  line-height: 1.2 !important;
  border-radius: 4px !important;
  min-width: 40px !important;
  height: 24px !important;
  transition: all 0.3s ease !important;
}

.operation-btn.detail-btn {
  color: #3b82f6 !important;
  border: 1px solid #3b82f6 !important;
  background: transparent !important;
}

.operation-btn.detail-btn:hover {
  background: #3b82f6 !important;
  color: white !important;
}

.operation-btn.delete-btn {
  color: #dc2626 !important;
  border: 1px solid #dc2626 !important;
  background: transparent !important;
}

.operation-btn.delete-btn:hover {
  background: #dc2626 !important;
  color: white !important;
}

/* 分页样式 - 与 deviceSkills.vue 完全一致 */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: -20px;
  padding: 20px 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.pagination >>> .el-pagination {
  justify-content: center;
}

.pagination >>> .el-pagination .el-pager li {
  background: white !important;
  border: 1px solid #dcdfe6 !important;
  color: #606266 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
  margin: 0 2px !important;
}

.pagination >>> .el-pagination .el-pager li:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
}

.pagination >>> .el-pagination .el-pager li.active {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%) !important;
  border-color: #3b82f6 !important;
  color: white !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.pagination >>> .el-pagination button {
  background: white !important;
  border: 1px solid #dcdfe6 !important;
  color: #606266 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
  margin: 0 2px !important;
}

.pagination >>> .el-pagination button:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
}

/* 详情弹窗 */
::v-deep .warning-detail-dialog .el-dialog {
  border-radius: 4px;
  overflow: hidden;
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-info {
  background: #f8f8f8;
  padding: 20px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-item {
  display: flex;
  font-size: 14px;
  align-items: center;
}

.detail-item .label {
  width: 100px;
  color: #606266;
  flex-shrink: 0;
}

.detail-item .value {
  flex: 1;
  color: #333;
}

/* 图片预览对话框 */
::v-deep .image-preview-dialog .el-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.image-preview-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  object-fit: contain;
}

.no-image-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  color: #909399;
}

.no-image-placeholder i {
  font-size: 48px;
  margin-bottom: 12px;
  color: #c0c4cc;
}

.no-image-placeholder p {
  margin: 0;
  font-size: 14px;
}

/* 编辑档案弹窗 */
::v-deep .edit-archive-dialog .el-dialog {
  border-radius: 4px;
  overflow: hidden;
}

.edit-form .el-form-item {
  margin-bottom: 20px;
}

.edit-form .el-input__inner {
  height: 36px;
  line-height: 36px;
}

.edit-form .el-textarea__inner {
  min-height: 80px;
}

/* 添加预警弹窗 */
::v-deep .add-warning-dialog .el-dialog {
  border-radius: 4px;
  overflow: hidden;
}

.add-form .el-form-item {
  margin-bottom: 20px;
}

.add-form .el-input__inner {
  height: 36px;
  line-height: 36px;
}

.add-form .el-textarea__inner {
  min-height: 80px;
}

/* 删除确认弹窗 */
::v-deep .delete-confirm-dialog .el-dialog {
  border-radius: 4px;
  overflow: hidden;
  min-width: 320px;
}

::v-deep .delete-confirm-dialog .el-dialog__body {
  padding: 30px 20px;
}

::v-deep .delete-confirm-dialog .el-dialog__footer {
  border-top: 1px solid #ebeef5;
  padding: 10px 20px;
}

.confirm-content {
  text-align: center;
  font-size: 14px;
  color: #606266;
}

.confirm-content .confirm-icon {
  margin-bottom: 16px;
}

.confirm-content p {
  margin: 8px 0;
  line-height: 1.4;
}

.confirm-content strong {
  color: #1f2937;
  font-weight: 600;
}


/* 上传组件样式 */
.upload-container {
  width: 100%;
}

.violation-image-uploader,
.violation-video-uploader {
  width: 100%;
}

.violation-image-uploader .el-upload,
.violation-video-uploader .el-upload {
  width: 100%;
  height: 180px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.upload-dragger {
  width: 100%;
  height: 180px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  padding: 20px;
  box-sizing: border-box;
}

.upload-dragger:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.upload-icon {
  margin-bottom: 12px;
}

.upload-icon i {
  font-size: 48px;
  color: #c0c4cc;
  transition: color 0.3s ease;
}

.upload-dragger:hover .upload-icon i {
  color: #409eff;
}

.upload-title {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  text-align: center;
  line-height: 1.4;
}

.image-preview-container,
.video-preview-container {
  width: 100%;
  height: 180px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background-color: #000;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.uploaded-image,
.uploaded-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.image-overlay,
.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, 
    transparent 0%, 
    transparent 60%, 
    rgba(0, 0, 0, 0.3) 80%, 
    rgba(0, 0, 0, 0.6) 100%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-preview-container:hover .image-overlay,
.video-preview-container:hover .video-overlay {
  opacity: 1;
}

.overlay-actions {
  display: flex;
  gap: 12px;
}

.overlay-actions .el-button {
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 6px;
  color: #606266;
  padding: 8px 12px;
  font-size: 12px;
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
}

.overlay-actions .el-button:hover {
  background-color: #409eff;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
}

.overlay-actions .el-button i {
  margin-right: 4px;
}


/* 表单提示文字样式 */
.form-tip {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 6px;
  font-size: 12px;
  color: #1e40af;
  line-height: 1.4;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
  transition: all 0.3s ease;
}

.form-tip:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.form-tip i {
  font-size: 14px;
  margin-right: 6px;
  color: #10b981;
  flex-shrink: 0;
}

.form-tip span {
  flex: 1;
  font-weight: 500;
}

/* 时间段选择器样式优化 */
::v-deep .el-date-editor--datetimerange {
  width: 100% !important;
}

::v-deep .el-date-editor--datetimerange .el-range-separator {
  width: 30px;
  text-align: center;
  color: #606266;
  font-weight: 500;
}

::v-deep .el-date-editor--datetimerange .el-range-input {
  background-color: transparent;
  border: 0;
  color: #606266;
  font-size: 14px;
  line-height: 28px;
  outline: none;
  display: inline-block;
  width: 39%;
  text-align: center;
}

::v-deep .el-date-editor--datetimerange .el-range__icon {
  font-size: 14px;
  color: #c0c4cc;
  float: left;
  width: 25px;
  margin-left: 7px;
  text-align: center;
}

/* 科技感蓝色按钮样式 - 与 deviceSkills.vue 完全一致 */
.page-container >>> .el-button {
  height: 32px;
  padding: 6px 16px;
  font-size: 14px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  margin-right: 0;
}

.page-container >>> .el-button--primary,
.page-container >>> .add-btn,
.page-container >>> .edit-archive-btn {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 2px 4px rgba(30, 64, 175, 0.3) !important;
  position: relative !important;
  overflow: hidden !important;
  color: white !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
  font-weight: 600 !important;
  letter-spacing: 0.3px !important;
  border-radius: 6px !important;
}



.page-container >>> .el-button--primary:hover,
.page-container >>> .add-btn:hover,
.page-container >>> .edit-archive-btn:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0891b2 100%) !important;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5), 0 4px 8px rgba(30, 64, 175, 0.4) !important;
  transform: translateY(-2px) !important;
}



/* 批量删除按钮改为刷新按钮样式 */
.page-container >>> .batch-delete-btn {
  padding: 7px 10px !important;
  margin-left: 0 !important;
  color: #606266 !important;
  background-color: #fff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
  box-shadow: none !important;
  font-weight: 500 !important;
  letter-spacing: normal !important;
  text-shadow: none !important;
  height: 32px !important;
  position: static !important;
  overflow: visible !important;
}

.page-container >>> .batch-delete-btn:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
  transform: none !important;
}

.page-container >>> .batch-delete-btn::before {
  display: none !important;
}

.page-container >>> .batch-delete-btn:hover::before {
  display: none !important;
}

/* 保持其他危险按钮的红色样式 */
.page-container >>> .el-button--danger:not(.batch-delete-btn) {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4), 0 2px 4px rgba(185, 28, 28, 0.3) !important;
  position: relative !important;
  overflow: hidden !important;
  color: white !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2) !important;
  font-weight: 600 !important;
  letter-spacing: 0.3px !important;
  border-radius: 6px !important;
}



.page-container >>> .el-button--danger:not(.batch-delete-btn):hover {
  background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important;
  box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5), 0 4px 8px rgba(185, 28, 28, 0.4) !important;
  transform: translateY(-2px) !important;
}



.page-container >>> .el-button:not(.el-button--primary):not(.el-button--danger):not(.add-btn):not(.edit-archive-btn):not(.batch-delete-btn) {
  background: #f5f7fa !important;
  border-color: #e4e7ed !important;
  color: #606266 !important;
  border-radius: 6px !important;
}

.page-container >>> .el-button:not(.el-button--primary):not(.el-button--danger):not(.add-btn):not(.edit-archive-btn):not(.batch-delete-btn):hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e3a8a !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2) !important;
  transform: translateY(-1px) !important;
}

/* 弹框按钮统一样式 */
.page-container >>> .el-dialog .el-button--primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%) !important;
  border: none !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3) !important;
  color: white !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
}

.page-container >>> .el-dialog .el-button--primary:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%) !important;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4) !important;
  transform: translateY(-1px) !important;
}

.page-container >>> .el-dialog .el-button--default {
  background: white !important;
  border: 1px solid #d1d5db !important;
  color: #4b5563 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
}

.page-container >>> .el-dialog .el-button--default:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
}

/* 修复时间选择器z-index层级问题 - 确保弹出层显示在弹框上方 */
.page-container >>> .el-date-picker {
  z-index: 9999 !important;
}

.page-container >>> .el-picker-panel {
  z-index: 9999 !important;
}

.page-container >>> .el-date-picker__header {
  z-index: 9999 !important;
}

/* 全局修复Element UI日期时间选择器的z-index */
.el-date-picker.el-popper,
.el-picker-panel {
  z-index: 9999 !important;
}

.el-date-picker .el-picker-panel__content {
  z-index: 9999 !important;
}

/* 确保在弹框中的时间选择器正常显示 */
.add-warning-dialog .el-date-picker,
.edit-archive-dialog .el-date-picker,
.add-archive-dialog .el-date-picker {
  position: relative;
  z-index: 10001 !important;
}



/* 输入框和选择器样式 - 与 deviceSkills.vue 一致 */
.page-container >>> .el-input__inner {
  border: 1px solid #e2e8f0 !important;
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
}

.page-container >>> .el-input__inner:hover {
  border-color: #3b82f6 !important;
}

.page-container >>> .el-input__inner:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
}

.page-container >>> .el-select .el-input__inner {
  border: 1px solid #e2e8f0 !important;
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
}

.page-container >>> .el-select .el-input__inner:hover {
  border-color: #3b82f6 !important;
}

.page-container >>> .el-select .el-input__inner:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
}

.page-container >>> .el-date-editor.el-input {
  border-radius: 6px !important;
}

.page-container >>> .el-date-editor .el-input__inner {
  border: 1px solid #e2e8f0 !important;
  border-radius: 6px !important;
}

.page-container >>> .el-date-editor .el-input__inner:hover {
  border-color: #3b82f6 !important;
}

.page-container >>> .el-date-editor .el-input__inner:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
}

.page-container >>> .el-textarea__inner {
  border: 1px solid #e2e8f0 !important;
  border-radius: 6px !important;
  transition: all 0.3s ease !important;
}

.page-container >>> .el-textarea__inner:hover {
  border-color: #3b82f6 !important;
}

.page-container >>> .el-textarea__inner:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
}


</style>

<!-- 全局样式修复Element UI时间选择器z-index问题 -->
<style>
/* 全局修复Element UI日期时间选择器在弹框中的z-index层级问题 */
body .el-picker-panel {
  z-index: 20000 !important;
}

body .el-date-picker.el-popper {
  z-index: 20000 !important;
}

body .el-time-picker.el-popper {
  z-index: 20000 !important;
}

/* 修复弹框中的时间选择器面板层级 */
.el-dialog + .el-picker-panel,
.el-dialog ~ .el-picker-panel {
  z-index: 20000 !important;
}

/* 确保时间选择器的所有子组件都有足够高的z-index */
.el-picker-panel__body,
.el-picker-panel__content,
.el-date-picker__time-header,
.el-picker-panel__icon-btn {
  z-index: inherit !important;
}

/* 修复可能的时间面板和日期面板层级冲突 */
.el-date-picker.el-popper[x-placement^="bottom"],
.el-date-picker.el-popper[x-placement^="top"] {
  z-index: 20000 !important;
}

/* ==================== 选择预警弹框样式 ==================== */

/* 选择预警弹框样式 */
.select-alert-dialog >>> .el-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.select-alert-dialog >>> .el-dialog__header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  padding: 16px 20px;
}

.select-alert-dialog >>> .el-dialog__title {
  color: #1f2937;
  font-weight: 600;
  font-size: 18px;
}

.select-alert-dialog >>> .el-dialog__body {
  padding: 20px;
  background: #ffffff;
}

/* 筛选条件区域 */
.alert-filters {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-form {
  margin-bottom: 0;
}

.filter-form .el-form-item {
  margin-bottom: 12px;
  margin-right: 16px;
}

.filter-form .el-form-item__label {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.time-filter {
  border-top: 1px solid rgba(59, 130, 246, 0.1);
  padding-top: 16px;
  margin-top: 16px;
}

/* 状态标签样式 */
.status-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

.status-pending {
  background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
  color: #92400e;
  border: 1px solid #fbbf24;
}

.status-processing {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.status-completed {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.status-archived {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #374151;
  border: 1px solid #d1d5db;
}

.status-false-alarm {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  color: #991b1b;
  border: 1px solid #f87171;
}

.status-unknown {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

/* 预警等级标签样式 */
.level-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

.level1-tag {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  color: #991b1b;
  border: 1px solid #f87171;
}

.level2-tag {
  background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
  color: #92400e;
  border: 1px solid #fbbf24;
}

.level3-tag {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.level4-tag {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #065f46;
  border: 1px solid #a7f3d0;
}

/* 分页区域 */
.alert-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  padding: 20px 0;
  border-top: 1px solid #f0f2f5;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
}

/* 弹框底部样式 */
.select-alert-dialog >>> .el-dialog__footer {
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-top: 1px solid rgba(59, 130, 246, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selected-info {
  color: #374151;
  font-size: 14px;
  font-weight: 500;
}

.no-selection {
  color: #9ca3af;
  font-style: italic;
}

.dialog-buttons {
  display: flex;
  gap: 12px;
}

.cancel-btn {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
  padding: 8px 20px;
  border-radius: 6px;
  font-weight: 500;
}

.cancel-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.confirm-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-color: #3b82f6;
  color: white;
  padding: 8px 20px;
  border-radius: 6px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  border-color: #2563eb;
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.confirm-btn:disabled {
  background: #e5e7eb;
  border-color: #d1d5db;
  color: #9ca3af;
  box-shadow: none;
}

/* 表格样式增强 */
.select-alert-dialog >>> .el-table {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #f0f2f5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.select-alert-dialog >>> .el-table th {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #374151;
  font-weight: 600;
  border-bottom: 2px solid #e5e7eb;
  font-size: 13px;
}

.select-alert-dialog >>> .el-table__row:hover > td {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.05) 100%);
}

.select-alert-dialog >>> .el-table__row.current-row > td {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.select-alert-dialog >>> .el-table td {
  border-bottom: 1px solid #f3f4f6;
  font-size: 13px;
}

/* 空状态样式 */
.select-alert-dialog >>> .el-table__empty-block {
  padding: 60px 0;
}

.select-alert-dialog >>> .el-table__empty-text {
  color: #9ca3af;
  font-size: 14px;
}

/* 加载状态样式 */
.select-alert-dialog >>> .el-loading-mask {
  border-radius: 8px;
}
</style>
<script>
import WarningDetail from './warningDetail.vue'
import { alertAPI, archiveAPI } from '@/components/service/VisionAIService.js'

export default {
  name: "WarningManagement",
  components: {
    WarningDetail
  },
  data() {
    return {
      // 定义搜索条件
      searchForm: {
        deviceName: '',
        startDate: '',
        endDate: '',
        warningType: '',
        warningLevel: '',
        warningSkill: '', // 预警技能
        warningName: '', // 预警名称
        warningId: '', // 预警ID
        status: '', // 处理状态
        location: '' // 违规位置
      },
      
      // 预警列表数据
      warningList: [],
      
      // 表格加载状态
      loading: false,
      
      // 选中的预警项
      selectedWarnings: [],
      
      // 预警等级配置
      warningLevelConfig: {
        '一级预警': { color: '#F56C6C', bg: '#FEF0F0' },
        '二级预警': { color: '#E6A23C', bg: '#FDF6EC' },
        '三级预警': { color: '#409EFF', bg: '#ECF5FF' },
        '四级预警': { color: '#67C23A', bg: '#F0F9FF' }
      },
      

      
      // 日期范围
      dateRange: null,
      
      // 目录搜索
      searchDirectory: '',
      
      // 导出数据相关
      exportDialogVisible: false,
      exportFormat: 'csv',
      exportLoading: false,
      
      // 添加备注对话框
      remarkDialogVisible: false,
      currentWarningId: '',
      currentProcessingWarningId: '', // 统一变量名（与realtime页面一致）
      remarkForm: {
        remark: ''
      },
      
      // 上报确认对话框
      reportDialogVisible: false,
      reportWarningId: '',
      
      // 归档确认对话框
      archiveDialogVisible: false,
      archiveWarningId: '',
      
      // 误报对话框
      falseAlarmDialogVisible: false,
      falseAlarmForm: {
        reviewNotes: ''
      },
      
      // 批量处理对话框
      batchProcessDialogVisible: false,
      batchRemarkForm: {
        remark: ''
      },
      
      // 档案管理数据
      availableArchives: [],
      selectedArchiveId: '',
      archiveListLoading: false,
      
      warningDetailVisible: false,
      currentAlertId: null,
      
      // 删除确认对话框
      deleteDialogVisible: false,
      deleteLoading: false,
      
      // 卡片悬停状态管理
      cardHoverStates: {},
      
      // 预警技能选项
      warningSkillOptions: [
        { label: '安全帽检测', value: 'safety_helmet_detection' },
        { label: '工作服检测', value: 'work_clothes_detection' },
        { label: '反光背心检测', value: 'reflective_vest_detection' },
        { label: '安全带检测', value: 'safety_belt_detection' },
        { label: '烟火检测', value: 'smoke_fire_detection' },
        { label: '人员入侵检测', value: 'personnel_intrusion_detection' },
        { label: '高空作业检测', value: 'high_altitude_work_detection' },
        { label: '区域入侵检测', value: 'area_intrusion_detection' }
      ],
      
      // 分页相关
      currentPage: 1,
      pageSize: 12,
      totalCount: 0
    }
  },
  computed: {
  },
  watch: {
    dateRange(newVal) {
      if (newVal) {
        this.searchForm.startDate = newVal[0]
        this.searchForm.endDate = newVal[1]
      }
    }
  },
  mounted() {
    this.getWarningList()
  },
  methods: {
    // 搜索重置
    resetSearch() {
      this.searchForm = {
        deviceName: '',
        startDate: '',
        endDate: '',
        warningType: '',
        warningLevel: '',
        warningSkill: '',
        warningName: '',
        warningId: '',
        status: '',
        location: ''
      }
      this.dateRange = null
      this.currentPage = 1
      this.getWarningList()
    },
    
    // 执行搜索
    handleSearch() {
      this.currentPage = 1
      this.getWarningList()
    },
    
    // 获取预警列表
    async getWarningList() {
      this.loading = true
      try {
        // 构建API请求参数
        const apiParams = {
          page: this.currentPage,
          limit: this.pageSize,
          // 搜索条件映射
          startDate: this.searchForm.startDate,
          endDate: this.searchForm.endDate,
          warningLevel: this.searchForm.warningLevel,
          warningType: this.searchForm.warningType,
          warningSkill: this.searchForm.warningSkill,
          warningName: this.searchForm.warningName,
          warningId: this.searchForm.warningId,
          location: this.searchForm.location,
          statusFilter: this.searchForm.status
        }

        // 过滤空值参数
        Object.keys(apiParams).forEach(key => {
          if (apiParams[key] === '' || apiParams[key] === null || apiParams[key] === undefined) {
            delete apiParams[key]
          }
        })

        console.log('获取预警列表 - 请求参数:', apiParams)

        // 调用API获取数据
        const response = await alertAPI.getRealTimeAlerts(apiParams)
        console.log('获取预警列表 - API响应:', response.data)

        if (response.data && response.data.code === 0) {
          // 转换API数据为页面数据格式
          this.warningList = this.transformApiDataToPageData(response.data.data || [])
          
          // 更新分页信息
          if (response.data.pagination) {
            this.totalCount = response.data.pagination.total || 0
            this.currentPage = response.data.pagination.page || 1
            this.pageSize = response.data.pagination.limit || 12
          } else {
            this.totalCount = response.data.total || 0
          }
          
          console.log('预警列表转换完成:', this.warningList.length, '条数据，总数:', this.totalCount)
        } else {
          console.error('获取预警列表失败:', response.data)
          this.$message.error('获取预警列表失败')
          this.warningList = []
          this.totalCount = 0
        }
        
        // 刷新后清空选择和悬停状态
        this.selectedWarnings = []
        this.cardHoverStates = {}
      } catch (error) {
        console.error('获取预警列表异常:', error)
        this.$message.error('获取预警列表失败：' + (error.message || '网络错误'))
        // 发生错误时清空数据
        this.warningList = []
        this.totalCount = 0
      } finally {
        this.loading = false
      }
    },

    // 转换API数据为页面数据格式
    transformApiDataToPageData(apiData) {
      if (!Array.isArray(apiData)) {
        console.warn('API数据格式不正确，期望数组:', apiData)
        return []
      }

      return apiData.map(item => {
        // 预警等级映射
        const levelMap = {
          1: '一级预警',
          2: '二级预警', 
          3: '三级预警',
          4: '四级预警'
        }

        // 状态映射
        const statusMap = {
          1: 'pending',    // 待处理
          2: 'processing', // 处理中
          3: 'completed',  // 已处理
          4: 'archived',   // 已归档
          5: 'false_alarm'  // 误报
        }

        // 🔧 统一处理操作历史（与realTimeMonitoring保持一致）
        const operationHistory = this.convertProcessHistory(
          item.process,
          item.status,
          this.formatApiTime(item.alert_time),
          item.processed_by,
          this.formatApiTime(item.processed_at)
        );

        return {
          // 基本信息映射
          id: String(item.alert_id || item.id || Date.now()),
          deviceName: item.alert_name || '未知预警',
          imageUrl: item.minio_frame_url || null,
          value: 1,
          unit: '件',
          level: levelMap[item.alert_level] || '未知等级',
          time: this.formatApiTime(item.alert_time || item.created_at),
          status: statusMap[item.status] || 'pending',
          
          // 摄像头信息
          cameraId: String(item.camera_id || 'unknown'),
          deviceInfo: {
            name: item.camera_name || '未知摄像头',
            position: item.location || '未知位置'
          },
          
          // 预警详细信息
          device: item.camera_name || '未知摄像头',
          alertName: item.alert_name || '未知预警',  // 预警名称（如：未佩戴安全带）
          type: item.alert_type || '未知类型',        // 预警类型（如：安全生产预警）
          location: item.location || '未知位置',
          locationId: `loc_${item.camera_id || 'unknown'}`,
          description: item.alert_description || '未知描述',
          skill: item.alert_type || 'unknown_skill',
          
          // 处理信息
          remark: item.processing_notes || '',
          
          // 操作历史
          operationHistory: operationHistory,
          
          // 原始API数据（用于调试和扩展）
          _apiData: item
        }
      })
    },

    // 格式化API时间格式
    formatApiTime(timeString) {
      if (!timeString) return new Date().toLocaleString()
      
      try {
        // 处理ISO格式时间 (2025-06-27T15:15:52)
        if (timeString.includes('T')) {
          const date = new Date(timeString)
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            const seconds = String(date.getSeconds()).padStart(2, '0')
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
          }
        }
        
        // 如果已经是标准格式，直接返回
        return timeString
      } catch (error) {
        console.warn('时间格式转换失败:', timeString, error)
        return timeString || new Date().toLocaleString()
      }
    },

    // 🔧 转换处理历史 - 与realTimeMonitoring保持一致
    // alertTime: 预警产生时间, processedAt: 处理时间
    convertProcessHistory(processData, apiStatus, alertTime, processedBy, processedAt) {
      try {
        const operationHistory = []
        // 使用后端返回的操作人名字，如果没有则使用默认值
        const defaultOperator = processedBy || '系统'
        // 处理时间：优先使用后端返回的处理时间，没有则使用当前时间
        const processTime = processedAt || this.getCurrentTime()

        // 处理API返回的步骤（如果存在）
        if (processData && processData.steps && Array.isArray(processData.steps)) {
          processData.steps.forEach((step, index) => {
            operationHistory.push({
              id: step.id || (Date.now() + index + 100),
              status: 'completed',
              statusText: step.step || '处理中',
              time: this.formatApiTime(step.time),
              description: step.desc || step.description || '',
              operationType: step.step === '预警产生' ? 'pending' : 'processing',
              operator: step.operator || '系统'
            })
          })
        }

        // 根据API状态添加相应的操作记录
        if (apiStatus === 1 || apiStatus === undefined || apiStatus === null) {
          // 待处理状态 - 添加待处理记录
          if (operationHistory.length === 0) {
            operationHistory.push({
              id: Date.now() + Math.random(),
              status: 'active',
              statusText: '待处理',
              time: alertTime || this.getCurrentTime(),
              description: '系统检测到异常情况，等待处理人员确认并开始处理',
              operationType: 'pending',
              operator: '系统'
            })
          }
        } else if (apiStatus === 2) {
          // 🔧 处理中状态 - 不在时间线中显示，通过预警状态标签体现
          // 用户添加的处理意见会作为 processing-action 类型单独显示
        } else if (apiStatus === 3) {
          // 已处理状态 - 使用处理时间
          operationHistory.push({
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '已处理',
            time: processTime,
            description: '预警处理已完成',
            operationType: 'completed',
            operator: defaultOperator
          })
        } else if (apiStatus === 4) {
          // 已归档状态 - 使用处理时间
          operationHistory.push({
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '已归档',
            time: processTime,
            description: '预警已归档',
            operationType: 'archive',
            operator: defaultOperator
          })
        } else if (apiStatus === 5) {
          // 误报状态 - 使用处理时间
          operationHistory.push({
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '误报',
            time: processTime,
            description: '预警已标记为误报',
            operationType: 'false_alarm',
            operator: defaultOperator
          })
        }

        // 统一按时间排序（最新的在最下面，时间正序）
        operationHistory.sort((a, b) => {
          const timeA = new Date(a.time).getTime()
          const timeB = new Date(b.time).getTime()
          if (isNaN(timeA) || isNaN(timeB)) return 0
          return timeA - timeB
        })

        return operationHistory
      } catch (error) {
        console.error('❌ 转换处理历史出错:', error)
        return [{
          id: Date.now() + Math.random(),
          status: 'active',
          statusText: '待处理',
          time: alertTime || this.getCurrentTime(),
          description: '系统检测到异常情况，等待处理人员确认并开始处理',
          operationType: 'pending',
          operator: '系统'
        }]
      }
    },
    
    // 处理预警事件
    async handleWarning(id, action) {
      try {
        this.loading = true
        
        console.log('🎯 warningManagement处理预警:', id, action);
        
        // 更新本地数据状态
        const index = this.warningList.findIndex(item => item.id === id)
        if (index !== -1) {
          if (action === 'markProcessed') {
            // 处理预警 - 统一使用realtime页面的处理逻辑
            this.handleWarningFromList(this.warningList[index])
            this.loading = false // 在弹框前先关闭loading
            return // 等处理意见填写完成后再继续
          } else if (action === 'report') {
            // 上报
            this.reportWarningId = id
            this.reportDialogVisible = true
            return // 不关闭loading，等确认后再关闭
          } else if (action === 'archive') {
            // 归档 - 调用归档流程处理方法
            this.archiveWarningId = id
            await this.handleArchiveProcess()
            return // 不关闭loading，等确认后再关闭
          } else if (action === 'false_alarm') {
            this.archiveWarningId = id
            this.falseAlarmDialogVisible = true
            return // 不关闭loading，等用户输入完成后再关闭
          }
        }
        
        // 如果在选中列表中，移除它
        const selectedIndex = this.selectedWarnings.indexOf(id)
        if (selectedIndex !== -1) {
          this.selectedWarnings.splice(selectedIndex, 1)
        }
      } catch (error) {
        console.error('处理失败:', error)
        this.$message.error('处理预警失败')
      } finally {
        this.loading = false
      }
    },
    
    async loadAvailableArchives() {
      this.archiveListLoading = true
      try {
        const response = await archiveAPI.getArchiveList({
          page: 1,
          limit: 100,
          status: 1
        })

        const resData = response.data
        if (resData && resData.code === 0 && Array.isArray(resData.data)) {
          this.availableArchives = resData.data
        } else if (resData && Array.isArray(resData.archives)) {
          this.availableArchives = resData.archives
        } else if (Array.isArray(resData)) {
          this.availableArchives = resData
        } else {
          this.availableArchives = []
        }
      } catch (error) {
        console.error('加载档案列表失败:', error)
        this.availableArchives = []
        this.$message.warning('加载档案列表失败，请检查网络连接')
      } finally {
        this.archiveListLoading = false
      }
    },

    async handleArchiveProcess() {
      try {
        const index = this.warningList.findIndex(item => item.id === this.archiveWarningId)
        if (index === -1) {
          this.$message.error('未找到预警信息')
          this.loading = false
          return
        }

        const warningInfo = this.warningList[index]

        if (warningInfo._apiData && warningInfo._apiData.status !== 3) {
          const statusNames = { 1: '待处理', 2: '处理中', 3: '已处理', 4: '已归档', 5: '误报' }
          this.$message.warning(`只有已处理状态的预警才能归档，当前状态为：${statusNames[warningInfo._apiData.status] || '未知'}`)
          this.loading = false
          return
        }

        this.selectedArchiveId = null
        this.availableArchives = []

        await this.loadAvailableArchives()

        this.$nextTick(() => {
          this.archiveDialogVisible = true
          if (this.availableArchives.length === 0) {
            this.$message.warning('当前没有可用档案，请先创建档案')
          }
        })
      } catch (error) {
        console.error('打开归档对话框失败:', error)
        this.$message.error('打开归档对话框失败')
      } finally {
        this.loading = false
      }
    },
    
    async confirmArchive() {
      if (!this.selectedArchiveId) {
        this.$message.warning('请选择要归档到的档案')
        return
      }

      try {
        this.loading = true

        const targetArchiveId = this.selectedArchiveId
        const selectedArchive = this.availableArchives.find(a =>
          (a.archive_id || a.id) === targetArchiveId
        )
        const archiveName = selectedArchive ? selectedArchive.name : '未知档案'

        const index = this.warningList.findIndex(item => item.id === this.archiveWarningId)
        if (index === -1) {
          this.$message.error('未找到预警信息')
          return
        }

        const warning = this.warningList[index]

        if (warning._apiData && warning._apiData.status !== 3) {
          const statusNames = { 1: '待处理', 2: '处理中', 3: '已处理', 4: '已归档', 5: '误报' }
          this.$message.warning(`只有已处理状态的预警才能归档，当前状态为：${statusNames[warning._apiData.status] || '未知'}`)
          this.closeArchiveDialog()
          return
        }

        const apiAlertId = warning._apiData ? warning._apiData.alert_id : parseInt(this.archiveWarningId)

        await alertAPI.updateAlertStatus(apiAlertId, {
          status: 4,
          processing_notes: `预警已归档到：${archiveName}`,
          processed_by: this.getCurrentUserName()
        })

        const response = await archiveAPI.linkAlertsToArchive(
          targetArchiveId,
          [apiAlertId],
          `预警管理归档 - 预警类型: ${warning.type || warning.alert_type}`
        )

        if (response.data && response.data.code === 0) {
          if (this.warningList[index]._apiData) {
            this.$set(this.warningList[index]._apiData, 'status', 4)
          }
          this.$set(this.warningList[index], 'status', 'archived')

          if (!this.warningList[index].operationHistory) {
            this.$set(this.warningList[index], 'operationHistory', [])
          }
          this.warningList[index].operationHistory.push({
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '预警归档',
            time: this.getCurrentTime(),
            description: `预警已归档到：${archiveName}，可在预警档案中查看`,
            operationType: 'archive',
            operator: this.getCurrentUserName(),
            archiveInfo: { archiveId: targetArchiveId, archiveName }
          })

          this.$message.success('预警已成功归档')
          this.closeArchiveDialog()
          await this.getWarningList()
        } else {
          this.$message.error((response.data && response.data.message) || '归档失败')
        }

        const selectedIndex = this.selectedWarnings.indexOf(this.archiveWarningId)
        if (selectedIndex !== -1) {
          this.selectedWarnings.splice(selectedIndex, 1)
        }
      } catch (error) {
        console.error('预警归档异常:', error)
        this.$message.error('归档失败: ' + (error.message || '未知错误'))
      } finally {
        this.loading = false
      }
    },
    
    // 获取当前时间
    getCurrentTime() {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    
    // 获取当前用户昵称
    getCurrentUserName() {
      // 从用户登录信息或Vuex store中获取，或从本地存储获取
      const savedUserName = localStorage.getItem('currentUserName')
      
      if (savedUserName) {
        return savedUserName
      } else {
        // 如果没有保存的用户名，返回默认值
        return '系统用户'
      }
    },
    
    
    // 选择当前页
    handleSelectPage() {
      // 获取当前页的所有预警ID
      const currentPageIds = this.warningList.map(item => item.id)
      
      // 检查当前页是否全部已选
      const isCurrentPageFullySelected = currentPageIds.every(id => 
        this.selectedWarnings.includes(id)
      )
      
      if (isCurrentPageFullySelected) {
        // 如果当前页已全选，则取消选择当前页
        this.selectedWarnings = this.selectedWarnings.filter(id => 
          !currentPageIds.includes(id)
        )
        this.$message.info('已取消选择本页')
      } else {
        // 选择当前页所有项，同时保留其他已选项
        const otherSelectedIds = this.selectedWarnings.filter(id => 
          !currentPageIds.includes(id)
        )
        
        this.selectedWarnings = [...otherSelectedIds, ...currentPageIds]
        this.$message.success(`已选择本页 ${currentPageIds.length} 项预警`)
      }
    },
    
    // 批量处理
    async handleBatchProcess() {
      if (this.selectedWarnings.length === 0) {
        this.$message.warning('请先选择预警项')
        return
      }
      
      // 弹出批量处理意见对话框
      this.batchProcessDialogVisible = true
    },
    
    // 确认批量处理
    async confirmBatchProcess() {
      if (!this.batchRemarkForm.remark.trim()) {
        this.$message.warning('请输入批量处理意见')
        return
      }
      
      try {
        this.loading = true
        
        // 调用API进行批量处理
        const updateData = {
          status: 2, // 处理中状态
          processing_notes: this.batchRemarkForm.remark,
          processed_by: this.getCurrentUserName()
        }

        // 将页面ID转换为数字类型的API ID
        const apiAlertIds = this.selectedWarnings.map(id => {
          const warning = this.warningList.find(item => item.id === id)
          return warning && warning._apiData ? warning._apiData.alert_id : parseInt(id)
        }).filter(id => !isNaN(id))

        console.log('批量处理预警:', apiAlertIds, updateData)

        const response = await alertAPI.batchUpdateAlertStatus(apiAlertIds, updateData)
        
        if (response.data && response.data.code === 0) {
          // API调用成功，更新本地数据（与单个处理逻辑一致）
          for (const id of this.selectedWarnings) {
            const index = this.warningList.findIndex(item => item.id === id)
            if (index !== -1) {
              // 确保有操作历史数组
              if (!this.warningList[index].operationHistory) {
                this.$set(this.warningList[index], 'operationHistory', [])
              }
              
              // 更新待处理记录为已完成状态
              this.warningList[index].operationHistory = this.warningList[index].operationHistory.map(record => {
                if (record.operationType === 'pending' && record.status === 'active') {
                  return {
                    ...record,
                    status: 'completed',
                    description: '预警已确认，开始处理'
                  };
                }
                return record;
              });
              
              // 🔧 添加处理意见记录（使用 processing-action 类型）
              const processingRecord = {
                id: Date.now() + Math.random(),
                status: 'completed',
                statusText: '处理记录',
                time: this.getCurrentTime(),
                description: `批量处理：${this.batchRemarkForm.remark}`,
                operationType: 'processing-action',
                operator: this.getCurrentUserName()
              }
              
              this.warningList[index].operationHistory.push(processingRecord)
              
              // 更新状态为处理中
              this.warningList[index].status = 'processing'
            }
          }
          
          this.$message.success(`已为 ${this.selectedWarnings.length} 项预警添加处理记录`)
          
          // 刷新列表以获取最新数据
          await this.getWarningList()
        } else {
          console.error('批量处理API失败:', response.data)
          this.$message.error('批量处理失败：' + (response.data && response.data.msg || '服务器错误'))
        }
        
        this.selectedWarnings = []
        this.closeBatchProcessDialog()
      } catch (error) {
        console.error('批量处理失败:', error)
        this.$message.error('批量处理失败：' + (error.message || '网络错误'))
      } finally {
        this.loading = false
      }
    },
    
    // 关闭批量处理对话框
    closeBatchProcessDialog() {
      this.batchProcessDialogVisible = false
      this.batchRemarkForm = {
        remark: ''
      }
    },
    
    // 导出数据
    exportData() {
      this.exportDialogVisible = true
    },
    
    // 获取导出选择文本
    getExportSelectionText() {
      const count = this.selectedWarnings.length
      if (count > 0) {
        return `您已选择 ${count} 条记录进行导出`
      } else {
        return '您将导出当前筛选条件下的所有记录'
      }
    },

    // 检查是否有激活的筛选条件
    hasActiveFilters() {
      return !!(
        this.searchForm.deviceName ||
        this.searchForm.warningType ||
        this.searchForm.warningLevel ||
        this.searchForm.warningSkill ||
        this.searchForm.warningName ||
        this.searchForm.warningId ||
        this.searchForm.status ||
        this.searchForm.location ||
        this.searchForm.startDate ||
        this.searchForm.endDate
      );
    },
    
    // 确认导出
    async confirmExport() {
      try {
        // 显示加载状态
        this.exportLoading = true
        
        // 准备导出参数
        const exportParams = {
          ...this.searchForm,  // 包含所有筛选条件
          format: this.exportFormat
        };
        
        // 如果有选中的预警，添加指定的预警ID列表
        if (this.selectedWarnings.length > 0) {
          // 转换为API格式的ID
          const apiAlertIds = this.selectedWarnings.map(id => {
            const warning = this.warningList.find(item => item.id === id)
            return warning && warning._apiData ? warning._apiData.alert_id : parseInt(id)
          }).filter(id => !isNaN(id));
          
          if (apiAlertIds.length > 0) {
            exportParams.alert_ids = apiAlertIds;
          }
        }
        
        console.log('📤 导出预警数据，参数:', exportParams);
        
        // 调用后端导出接口
        const response = await alertAPI.exportAlerts(exportParams);
        
        if (response && response.data) {
          // 创建下载链接
          const blob = new Blob([response.data], { 
            type: this.exportFormat === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv;charset=utf-8;' 
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // 生成文件名
          const now = new Date();
          const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
          const extension = this.exportFormat === 'excel' ? 'xlsx' : 'csv';
          const selectedInfo = this.selectedWarnings.length > 0 ? `_已选择${this.selectedWarnings.length}项` : '';
          link.download = `预警数据导出_${timestamp}${selectedInfo}.${extension}`;
          
          // 触发下载
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          this.$message.success(`${this.exportFormat.toUpperCase()}文件导出成功`);
        } else {
          throw new Error('导出数据为空');
        }
        
      } catch (error) {
        console.error('❌ 导出失败:', error);
        const errorMsg = (error.response && error.response.data && error.response.data.message) || error.message || '导出失败，请稍后重试';
        this.$message.error(`导出失败: ${errorMsg}`);
      } finally {
        this.exportLoading = false;
        this.exportDialogVisible = false;
      }
    },
    
    // 导出为CSV
    exportToCSV(data) {
      // CSV 表头
      const headers = Object.keys(data[0])
      
      // 转换数据为CSV行
      const csvRows = [
        headers.join(','), // 表头行
        ...data.map(row => 
          headers.map(header => {
            // 处理包含逗号的字段，用引号包裹
            const field = String(row[header] || '')
            return field.includes(',') ? `"${field}"` : field
          }).join(',')
        )
      ]
      
      // 合并为CSV内容
      const csvContent = csvRows.join('\n')
      
      // 创建Blob
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
      
      // 创建下载链接
      const fileName = `预警数据_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`
      this.downloadFile(blob, fileName)
    },
    
    // 下载文件通用方法
    downloadFile(blob, fileName) {
      // 创建下载链接
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      
      // 模拟点击下载
      document.body.appendChild(link)
      link.click()
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)
      }, 100)
    },
    
    // 选择预警项
    toggleSelect(id) {
      const index = this.selectedWarnings.indexOf(id)
      if (index === -1) {
        this.selectedWarnings.push(id)
      } else {
        this.selectedWarnings.splice(index, 1)
      }
    },
    
    // 获取背景颜色类名
    getLevelClass(level) {
      if (level === '一级预警') return 'level-1-bg'
      if (level === '二级预警') return 'level-2-bg'
      if (level === '三级预警') return 'level-3-bg'
      if (level === '四级预警') return 'level-4-bg'
      return ''
    },
    

    
    // 获取文字颜色类名
    getLevelTextClass(level) {
      if (level === '一级预警') return 'level-1-text'
      if (level === '二级预警') return 'level-2-text'
      if (level === '三级预警') return 'level-3-text'
      if (level === '四级预警') return 'level-4-text'
      return ''
    },
    
    // 保存备注
    async saveRemark() {
      if (!this.remarkForm.remark.trim()) {
        this.$message.warning('请输入处理意见')
        return
      }
      
      try {
        this.loading = true
        
        // 获取当前预警信息（优先使用新的统一变量名）
        const warningId = this.currentProcessingWarningId || this.currentWarningId;
        console.log('🔍 saveRemark - 查找预警ID:', warningId, '类型:', typeof warningId)
        console.log('🔍 saveRemark - warningList长度:', this.warningList.length)
        console.log('🔍 saveRemark - warningList IDs:', this.warningList.map(item => ({ id: item.id, type: typeof item.id })))
        
        // 确保ID类型一致（都转为字符串比较）
        const warning = this.warningList.find(item => String(item.id) === String(warningId))
        if (!warning) {
          console.error('❌ 未找到预警信息，warningId:', warningId, 'warningList:', this.warningList.map(w => w.id))
          this.$message.error('未找到预警信息，请刷新页面后重试')
          return
        }
        
        console.log('✅ 找到预警信息:', warning.id)

        // 准备API更新数据
        const apiAlertId = warning._apiData ? warning._apiData.alert_id : parseInt(warningId)
        const updateData = {
          status: 2, // 处理中状态
          processing_notes: this.remarkForm.remark,
          processed_by: this.getCurrentUserName()
        }

        console.log('更新预警状态:', apiAlertId, updateData)

        // 调用API更新预警状态
        const response = await alertAPI.updateAlertStatus(apiAlertId, updateData)
        
        if (response.data && response.data.code === 0) {
          // API调用成功，更新本地数据状态 - 添加新的处理记录
          const index = this.warningList.findIndex(item => String(item.id) === String(warningId))
          if (index !== -1) {
            // 🔧 关键修复：更新 _apiData.status 字段为处理中
            if (this.warningList[index]._apiData) {
              this.$set(this.warningList[index]._apiData, 'status', 2)
            }
            
            // 更新字符串状态为处理中
            this.$set(this.warningList[index], 'status', 'processing')
            
            // 确保有操作历史数组
            if (!this.warningList[index].operationHistory) {
              this.$set(this.warningList[index], 'operationHistory', [])
            }
            
            // 🔧 添加处理意见记录（使用 processing-action 类型）
            const newRecord = {
              id: Date.now() + Math.random(),
              status: 'completed',
              statusText: '处理记录',
              time: this.getCurrentTime(),
              description: `处理意见：${this.remarkForm.remark}`,
              operationType: 'processing-action',
              operator: this.getCurrentUserName()
            }
            
            this.warningList[index].operationHistory.push(newRecord)
            
            console.log('✅ saveRemark - 本地状态已更新为处理中，_apiData.status:', this.warningList[index]._apiData.status)
          }
          
          this.$message.success('处理记录已添加')
          
          // 刷新列表以获取最新数据
          await this.getWarningList()
        } else {
          console.error('更新预警状态API失败:', response.data)
          this.$message.error('处理失败：' + (response.data && response.data.msg || '服务器错误'))
        }
        
        this.closeRemarkDialog()
      } catch (error) {
        console.error('处理失败:', error)
        this.$message.error('处理失败：' + (error.message || '网络错误'))
      } finally {
        this.loading = false
      }
    },
    
    // 关闭备注对话框
    closeRemarkDialog() {
      this.remarkDialogVisible = false
      this.currentWarningId = ''
      this.currentProcessingWarningId = '' // 同时清空新变量
      this.remarkForm = {
        remark: ''
      }
    },
    
    // 确认上报
    async confirmReport() {
      try {
        // 真实的API调用 - 上报预警
        const warning = this.warningList.find(item => item.id === this.reportWarningId);
        const apiAlertId = warning._apiData ? warning._apiData.alert_id : parseInt(this.reportWarningId);
        const updateData = {
          status: 2, // 保持处理中状态，但添加上报标记
          processing_notes: '预警已上报给上级部门',
          processed_by: this.getCurrentUserName()
        };
        
        const response = await alertAPI.updateAlertStatus(apiAlertId, updateData);
        console.log('✅ 上报API调用成功:', response);
        
        // 获取当前预警
        const index = this.warningList.findIndex(item => item.id === this.reportWarningId)
        if (index !== -1) {
          // 添加上报记录到操作历史
          if (!this.warningList[index].operationHistory) {
            this.$set(this.warningList[index], 'operationHistory', [])
          }
          
          const newRecord = {
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '预警上报',
            time: this.getCurrentTime(),
            description: '预警已上报给上级部门处理，等待上级部门响应',
            operationType: 'report',
            operator: this.getCurrentUserName()
          }
          
          this.warningList[index].operationHistory.push(newRecord)
        }
        
        this.$message.success('预警已成功上报')
        this.closeReportDialog()
        
        // 刷新列表以获取最新数据
        await this.getWarningList()
        // 不改变预警状态，保持预警可继续处理
      } catch (error) {
        console.error('上报失败:', error)
        this.$message.error('上报失败')
      } finally {
        this.loading = false
      }
    },
    
    // 关闭上报对话框
    closeReportDialog() {
      this.reportDialogVisible = false
      this.reportWarningId = ''
    },
    
    closeArchiveDialog() {
      this.archiveDialogVisible = false
      this.archiveWarningId = ''
      this.selectedArchiveId = ''
      this.availableArchives = []
      this.archiveListLoading = false
    },
    
    showWarningDetail(item) {
      const alertId = item._apiData ? item._apiData.alert_id : parseInt(item.id)
      this.currentAlertId = alertId
      this.warningDetailVisible = true
    },
    
    async handleWarningFromDetail(eventData) {
      if (!eventData || !eventData.alert_id) return;
      
      if (eventData.action === 'record-added' || eventData.action === 'finished') {
        await this.getWarningList()
      }
    },
    
    handleReportFromDetail(eventData) {
      if (eventData && eventData.alert_id) {
        this.handleWarning(eventData.alert_id, 'report')
      }
    },
    
    handleArchiveFromDetail(eventData) {
      if (eventData && eventData.alert_id) {
        this.handleWarning(eventData.alert_id, 'archive')
      }
    },
    
    handleFalseAlarmFromDetail(eventData) {
      if (eventData && eventData.alert_id) {
        this.handleWarning(eventData.alert_id, 'false_alarm')
      }
    },
    
    // 获取预警类型文本
    getWarningTypeText(type) {
      const typeMap = {
        '未戴安全帽': '安全防护违规',
        '未穿工作服': '安全防护违规',
        '闲杂人员': '人员管理违规',
        '违规吸烟': '消防安全违规',
        '高空作业未系安全带': '高空作业违规',
        '未穿反光背心': '安全防护违规',
        '安全帽识别': '安全防护违规',
        '工服识别': '安全防护违规',
        '烟火检测': '消防安全违规'
      };
      return typeMap[type] || '其他安全违规';
    },
    
    // 获取预警等级标签文本
    getLevelBadgeText(level) {
      const levelMap = {
        '一级预警': '一级',
        '二级预警': '二级',
        '三级预警': '三级',
        '四级预警': '四级'
      }
      return levelMap[level] || '未知'
    },
    
    // 处理误报事件
    async handleFalseAlarmArchive() {
      try {
        if (!this.falseAlarmForm.reviewNotes.trim()) {
          this.$message.warning('请输入复判意见')
          return
        }
        
        // 获取当前预警信息
        const warningIndex = this.warningList.findIndex(item => item.id === this.archiveWarningId)
        if (warningIndex === -1) {
          this.$message.error('未找到预警信息')
          return
        }
        
        const warningInfo = this.warningList[warningIndex]
        
        // 检查预警状态，只有待处理状态才能标记为误报
        if (warningInfo._apiData && warningInfo._apiData.status !== 1) {
          const statusNames = {
            2: '处理中',
            3: '已处理',
            4: '已归档',
            5: '误报'
          }
          const currentStatusName = statusNames[warningInfo._apiData.status] || '未知状态'
          this.$message.warning(`只有待处理状态的预警才能标记为误报，当前状态为：${currentStatusName}`)
          this.falseAlarmDialogVisible = false
          this.falseAlarmForm.reviewNotes = ''
          return
        }
        
        // 调用后端API标记误报
        const { alertAPI } = await import('../../service/VisionAIService.js')
        const response = await alertAPI.markAlertAsFalseAlarm(
          warningInfo._apiData ? warningInfo._apiData.alert_id : parseInt(this.archiveWarningId),
          this.falseAlarmForm.reviewNotes,
          this.getCurrentUserName()
        )
        
        if (response.data && response.data.code === 0) {
          // 添加误报记录到操作历史
          if (!this.warningList[warningIndex].operationHistory) {
            this.$set(this.warningList[warningIndex], 'operationHistory', [])
          }
          
          const newRecord = {
            id: Date.now() + Math.random(),
            status: 'completed',
            statusText: '误报处理',
            time: this.getCurrentTime(),
            description: `预警被标记为误报：${this.falseAlarmForm.reviewNotes}`,
            operationType: 'false_alarm',
            operator: this.getCurrentUserName()
          }
          
          this.warningList[warningIndex].operationHistory.push(newRecord)
          this.warningList[warningIndex].status = 'false_alarm'
          this.warningList[warningIndex].isFalseAlarm = true
          this.warningList[warningIndex].archiveTime = new Date().toLocaleString()
          
          // 如果在选中列表中，也移除
          const selectedIndex = this.selectedWarnings.indexOf(this.archiveWarningId)
          if (selectedIndex !== -1) {
            this.selectedWarnings.splice(selectedIndex, 1)
          }
          
          this.$message.success('预警已标记为误报，复判记录已保存')
          
          // 刷新列表以获取最新数据
          await this.getWarningList()
        } else {
          this.$message.error((response.data && response.data.msg) || '标记误报失败')
        }
        
        // 关闭对话框并重置表单
        this.falseAlarmDialogVisible = false
        this.falseAlarmForm.reviewNotes = ''
        this.archiveWarningId = ''
        
      } catch (error) {
        console.error('标记误报失败:', error)
        this.$message.error('标记误报失败: ' + (error.message || '未知错误'))
      } finally {
        this.loading = false
      }
    },
    
    // 保存到智能复判记录
    async saveToReviewRecords(warningInfo) {
      try {
        // 创建复判记录数据
        const reviewRecord = {
          id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          originalWarningId: warningInfo.id,
          warningType: warningInfo.type || warningInfo.deviceName,
          deviceName: warningInfo.device || (warningInfo.deviceInfo && warningInfo.deviceInfo.name),
          location: warningInfo.location || (warningInfo.deviceInfo && warningInfo.deviceInfo.position),
          originalTime: warningInfo.time,
          imageUrl: warningInfo.imageUrl,
          level: warningInfo.level,
          description: warningInfo.description,
          reviewResult: 'false_alarm', // 复判结果：误报
          reviewTime: this.getCurrentTime(),
          reviewer: this.getCurrentUserName(),
          reviewReason: '人工标记为误报',
          confidence: 100, // 人工复判置信度100%
          aiReviewResult: null, // AI复判结果（如果有的话）
          aiConfidence: null,
          status: 'completed',
          createTime: this.getCurrentTime()
        }
        
        // 保存到本地存储（实际项目中应该调用API保存到数据库）
        let reviewRecords = JSON.parse(localStorage.getItem('intelligentReviewRecords') || '[]')
        reviewRecords.unshift(reviewRecord)
        
        // 限制记录数量，避免本地存储过大
        if (reviewRecords.length > 1000) {
          reviewRecords = reviewRecords.slice(0, 1000)
        }
        
        localStorage.setItem('intelligentReviewRecords', JSON.stringify(reviewRecords))
        
        // 这里是本地存储操作，不需要额外的API调用
        console.log('📝 智能复判记录已保存到本地存储');
        
        console.log('误报记录已保存到智能复判:', reviewRecord)
        
      } catch (error) {
        console.error('保存到智能复判记录失败:', error)
        throw error
      }
    },
    
    // 获取预警图标
    getWarningIcon(level) {
      const iconMap = {
        '一级预警': 'el-icon-warning',
        '二级预警': 'el-icon-warning-outline',
        '三级预警': 'el-icon-warning-outline',
        '四级预警': 'el-icon-warning-outline'
      };
      return iconMap[level] || 'el-icon-warning';
    },
    
    // 从预警列表处理预警 - 使用统一的处理逻辑（与realtime页面一致）
    handleWarningFromList(warning) {
      console.log('🖱️ warningManagement点击处理按钮, 预警ID:', warning && warning.id, '预警数据:', warning);
      
      if (warning && warning.id) {
        // 🔧 检查当前是否已经在处理中（通过API状态判断）
        const isProcessing = (warning._apiData && warning._apiData.status === 2) || warning.status === 'processing';
        
        if (isProcessing) {
          console.log('📝 预警已在处理中，直接打开处理对话框');
          // 如果已在处理中，直接弹出处理意见对话框
          this.currentProcessingWarningId = warning.id;
          this.remarkDialogVisible = true;
        } else {
          console.log('🆕 开始新的处理流程');
          // 如果不在处理中，开始处理流程
          this.startProcessingWarning(warning);
        }
      } else {
        console.error('❌ 无效的预警数据:', warning);
        this.$message.error('预警数据无效，无法处理');
      }
    },
    
    // 开始处理预警 - 与realtime页面逻辑完全一致
    async startProcessingWarning(warning) {
      try {
        this.loading = true;
        
        console.log('🔄 开始处理预警:', warning.id);
        
        // 1. 先调用后端API更新状态为"处理中"
        const apiAlertId = warning._apiData ? warning._apiData.alert_id : parseInt(warning.id);
        const updateData = {
          status: 2, // 处理中状态
          processing_notes: '开始处理预警',
          processed_by: this.getCurrentUserName()
        };
        
        // 发送真实的API请求
        const response = await alertAPI.updateAlertStatus(apiAlertId, updateData);
        console.log('✅ 后端状态更新成功:', response);
        
        // 2. 后端更新成功后，更新本地状态
        const index = this.warningList.findIndex(item => String(item.id) === String(warning.id));
        if (index !== -1) {
          // 🔧 关键修复：更新 _apiData.status 字段为处理中
          if (this.warningList[index]._apiData) {
            this.$set(this.warningList[index]._apiData, 'status', 2);
          }
          
          // 🔧 同时更新前端使用的 status 字段
          this.$set(this.warningList[index], 'status', 'processing');
          
          // 确保有操作历史数组
          if (!this.warningList[index].operationHistory) {
            this.$set(this.warningList[index], 'operationHistory', []);
          }
          
          // 更新待处理记录为已完成状态
          this.warningList[index].operationHistory = this.warningList[index].operationHistory.map(record => {
            if (record.operationType === 'pending' && record.status === 'active') {
              return {
                ...record,
                status: 'completed',
                description: '预警已确认，开始处理'
              };
            }
            return record;
          });
          
          // 🔧 不再添加"处理中"记录到时间线，只更新状态
          // 用户添加的处理意见会作为 processing-action 类型单独显示
          
          console.log('✅ 开始处理，本地状态已更新为处理中:', this.warningList[index]);
        }
        
        // 3. 弹出处理意见对话框
        this.currentProcessingWarningId = warning.id;
        this.remarkDialogVisible = true;
        
        this.$message.success('预警已开始处理');
        
      } catch (error) {
        console.error('❌ 开始处理预警失败:', error);
        this.$message.error('开始处理失败: ' + (error.message || (error.response && error.response.data && error.response.data.message) || '未知错误'));
      } finally {
        this.loading = false;
      }
    },
    
    // 初始化操作历史 - 与预警详情对话框保持一致
    initOperationHistory(warning) {
      if (!warning) return
      
      // 如果预警有保存的操作历史，则直接返回
      if (warning.operationHistory && Array.isArray(warning.operationHistory) && warning.operationHistory.length > 0) {
        return
      }
      
      // 如果没有操作历史，则创建默认的初始记录
      const operationHistory = []
      
      // 添加预警产生记录（始终存在的初始记录）
      operationHistory.push({
        id: Date.now() + Math.random(),
        status: 'completed',
        statusText: '预警产生',
        time: warning.time || this.getCurrentTime(),
        description: `${warning.type || '系统检测'}：${warning.description || '检测到异常情况，请及时处理'}`,
        operationType: 'create',
        operator: '系统'
      })
      
      // 添加待处理记录（始终显示）
      operationHistory.push({
        id: Date.now() + Math.random() + 1,
        status: 'active',
        statusText: '待处理',
        time: warning.createTime || this.getCurrentTime(),
        description: '预警已产生，等待处理人员确认并开始处理',
        operationType: 'pending',
        operator: ''
      })
      
      // 设置操作历史
      this.$set(warning, 'operationHistory', operationHistory)
    },
    
    // 结束处理 - 与预警详情对话框保持一致
    async finishProcessing() {
      try {
        this.loading = true
        
        // 获取当前预警信息（使用currentProcessingWarningId或currentWarningId）
        const warningId = this.currentProcessingWarningId || this.currentWarningId
        console.log('🔍 finishProcessing - 查找预警ID:', warningId)
        
        // 确保ID类型一致（都转为字符串比较）
        const warning = this.warningList.find(item => String(item.id) === String(warningId))
        if (!warning) {
          console.error('❌ finishProcessing - 未找到预警信息，warningId:', warningId)
          this.$message.error('未找到预警信息，请刷新页面后重试')
          return
        }
        
        console.log('✅ finishProcessing - 找到预警信息:', warning.id)

        // 准备API更新数据
        const apiAlertId = warning._apiData ? warning._apiData.alert_id : parseInt(warningId)
        const updateData = {
          status: 3, // 已处理状态
          processing_notes: this.remarkForm.remark ? `${this.remarkForm.remark}\n处理已完成` : '处理已完成',
          processed_by: this.getCurrentUserName()
        }

        console.log('结束处理预警:', apiAlertId, updateData)

        // 调用API更新预警状态
        const response = await alertAPI.updateAlertStatus(apiAlertId, updateData)
        
        if (response.data && response.data.code === 0) {
          // API调用成功，更新本地数据状态
          const index = this.warningList.findIndex(item => String(item.id) === String(warningId))
          if (index !== -1) {
            // 🔧 关键修复：更新 _apiData.status 字段为已处理
            if (this.warningList[index]._apiData) {
              this.$set(this.warningList[index]._apiData, 'status', 3)
            }
            
            // 更新字符串状态为已处理
            this.$set(this.warningList[index], 'status', 'completed')
            
            // 确保有操作历史数组
            if (!this.warningList[index].operationHistory) {
              this.$set(this.warningList[index], 'operationHistory', [])
            }
            
            // 添加新的已处理记录
            const newRecord = {
              id: Date.now() + Math.random(),
              status: 'completed',
              statusText: '已处理',
              time: this.getCurrentTime(),
              description: '预警处理已完成，可以进行后续操作',
              operationType: 'completed',
              operator: this.getCurrentUserName()
            }
            
            this.warningList[index].operationHistory.push(newRecord)
            
            console.log('✅ finishProcessing - 本地状态已更新为已处理，_apiData.status:', this.warningList[index]._apiData.status)
          }
          
          this.$message.success('处理已完成，现在可以进行归档等操作')
          
          // 刷新列表以获取最新数据
          await this.getWarningList()
        } else {
          console.error('结束处理API失败:', response.data)
          this.$message.error('结束处理失败：' + (response.data && response.data.msg || '服务器错误'))
        }
        
        this.closeRemarkDialog()
      } catch (error) {
        console.error('结束处理失败:', error)
        this.$message.error('结束处理失败：' + (error.message || '网络错误'))
      } finally {
        this.loading = false
      }
    },
    
    // 检查处理按钮是否应该禁用
    isProcessingDisabled(warning) {
      if (!warning.operationHistory || warning.operationHistory.length === 0) {
        return false // 没有历史记录，可以处理
      }
      
      console.log('🔒 检查处理按钮状态:', warning.id, 'status:', warning.status);
      
      // 优先检查API状态
      if (warning.status === 'archived' || warning.status === 'false_alarm' || warning.status === 'completed') {
        console.log('✅ 按API状态禁用按钮:', warning.status);
        return true;
      }
      
      // 如果已归档，禁用处理按钮
      const hasArchived = warning.operationHistory.some(record => 
        record.operationType === 'archive' || record.operationType === 'false_alarm'
      );
      
      if (hasArchived) {
        console.log('✅ 按操作历史禁用按钮: 已归档');
        return true;
      }
      
      // 如果已完成处理，禁用处理按钮
      const hasCompletedProcessing = warning.operationHistory.some(record => 
        record.operationType === 'completed'
      );
      
      if (hasCompletedProcessing) {
        console.log('✅ 按操作历史禁用按钮: 已完成处理');
        return true;
      }
      
      console.log('🔓 按钮可用');
      return false;
    },

    // 检查归档按钮是否应该禁用（只有已处理状态才能归档）
    isArchiveDisabled(warning) {
      console.log('📁 检查归档按钮状态:', warning.id, 'API status:', warning._apiData && warning._apiData.status);
      
      // 优先检查 _apiData 中的原始状态（与后端数据库一致）
      if (warning._apiData && typeof warning._apiData.status !== 'undefined') {
        // 只有状态为3（已处理）时才能归档
        // 状态定义：1-待处理 2-处理中 3-已处理 4-已归档 5-误报
        const isDisabled = warning._apiData.status !== 3
        console.log('📁 归档按钮状态检查 - API status:', warning._apiData.status, 
                    '是否禁用:', isDisabled, 
                    '(只有status=3已处理时启用)')
        return isDisabled
      }
      
      // 如果没有API数据，检查字符串状态（向后兼容）
      if (warning.status === 'archived') {
        console.log('📁 归档按钮禁用: 已归档状态')
        return true
      }
      
      if (warning.status === 'false_alarm') {
        console.log('📁 归档按钮禁用: 误报状态')
        return true
      }
      
      // 检查操作历史
      if (!warning.operationHistory || warning.operationHistory.length === 0) {
        console.log('📁 归档按钮禁用: 无操作历史')
        return true
      }
      
      // 检查是否已归档
      const hasArchived = warning.operationHistory.some(record => 
        record.operationType === 'archive' || record.operationType === 'false_alarm'
      )
      
      if (hasArchived) {
        console.log('📁 归档按钮禁用: 操作历史显示已归档')
        return true
      }
      
      // 检查是否已完成处理
      const hasCompletedProcessing = warning.operationHistory.some(record => 
        record.operationType === 'completed'
      )
      
      if (!hasCompletedProcessing) {
        console.log('📁 归档按钮禁用: 未完成处理')
        return true
      }
      
      console.log('📁 归档按钮启用')
      return false
    },
    
    // 检查误报按钮是否应该禁用（只有待处理状态才能标记为误报）
    isFalseAlarmDisabled(warning) {
      // 检查 _apiData 中的原始状态
      if (warning._apiData && warning._apiData.status !== undefined) {
        // status === 1 表示待处理状态，只有待处理状态才能标记误报
        const isDisabled = warning._apiData.status !== 1;
        console.log('🚫 检查误报按钮状态:', warning.id, 'API status:', warning._apiData.status, 'disabled:', isDisabled);
        return isDisabled;
      }
      
      // 检查字符串状态
      if (warning.status) {
        const isDisabled = warning.status !== 'pending';
        console.log('🚫 检查误报按钮状态:', warning.id, 'status:', warning.status, 'disabled:', isDisabled);
        return isDisabled;
      }
      
      // 默认禁用（安全起见）
      console.log('🚫 误报按钮默认禁用:', warning.id);
      return true;
    },
    
    // 获取当前预警状态
    getCurrentWarningStatus(warning) {
      console.log('🔍 检查预警状态:', warning.id, 'status:', warning.status, 'operationHistory:', warning.operationHistory);
      
      // 优先使用API返回的status字段（与后端alerts表的status字段对应）
      if (warning._apiData && typeof warning._apiData.status !== 'undefined') {
        const statusMap = {
          1: { text: '待处理', class: 'status-pending' },      // PENDING
          2: { text: '处理中', class: 'status-processing' },   // PROCESSING
          3: { text: '已处理', class: 'status-completed' },    // RESOLVED
          4: { text: '已归档', class: 'status-archived' },     // ARCHIVED
          5: { text: '误报', class: 'status-false-alarm' }     // FALSE_ALARM
        };
        const result = statusMap[warning._apiData.status] || { text: '未知', class: 'status-pending' };
        console.log('📊 预警状态显示 - API status:', warning._apiData.status, '显示:', result);
        return result;
      }
      
      if (!warning.operationHistory || warning.operationHistory.length === 0) {
        return {
          text: '待处理',
          class: 'status-pending'
        }
      }
      
      // 如果没有API数据，使用字符串状态字段（向后兼容）
      if (warning.status === 'archived') {
        return {
          text: '已归档',
          class: 'status-archived'
        }
      }
      
      if (warning.status === 'false_alarm') {
        return {
          text: '误报',
          class: 'status-false-alarm'
        }
      }
      
      if (warning.status === 'completed') {
        return {
          text: '已处理',
          class: 'status-completed'
        }
      }
      
      // 检查操作历史中的归档和误报状态
      const hasArchived = warning.operationHistory.some(record => 
        record.operationType === 'archive' || record.operationType === 'false_alarm'
      );
      
      if (hasArchived) {
        return {
          text: '已归档',
          class: 'status-archived'
        }
      }
      
      // 检查是否有已处理状态
      const hasCompletedProcessing = warning.operationHistory.some(record => 
        record.operationType === 'completed'
      );
      
      if (hasCompletedProcessing) {
        return {
          text: '已处理',
          class: 'status-completed'
        }
      }
      
      // 检查是否有处理中状态
      const hasActiveProcessing = warning.operationHistory.some(record => 
        record.operationType === 'processing'
      )
      
      if (hasActiveProcessing) {
        return {
          text: '处理中',
          class: 'status-processing'
        }
      }
      
      // 检查是否已经确认开始处理（待处理状态完成）
      const hasPendingCompleted = warning.operationHistory.some(record => 
        record.operationType === 'pending' && record.status === 'completed'
      )
      
      if (hasPendingCompleted) {
        return {
          text: '处理中',
          class: 'status-processing'
        }
      }
      
      // 默认为待处理
      return {
        text: '待处理',
        class: 'status-pending'
      }
    },
    
    // 格式化时间
    formatTime(timeString) {
      try {
        // 如果是完整的时间字符串，格式化为更友好的显示
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
    
    // 显示删除确认对话框
    showDeleteDialog() {
      if (this.selectedWarnings.length === 0) {
        this.$message.warning('请先选择要删除的预警项')
        return
      }
      this.deleteDialogVisible = true
    },
    
    // 确认删除选中的预警
    async confirmDelete() {
      if (this.selectedWarnings.length === 0) {
        this.$message.warning('请先选择要删除的预警项')
        return
      }
      
      try {
        this.deleteLoading = true
        
        // 将页面ID转换为数字类型的API ID
        const apiAlertIds = this.selectedWarnings.map(id => {
          const warning = this.warningList.find(item => item.id === id)
          return warning && warning._apiData ? warning._apiData.alert_id : parseInt(id)
        }).filter(id => !isNaN(id))

        console.log('批量删除预警:', apiAlertIds)

        // 调用API进行批量删除
        const response = await alertAPI.batchDeleteAlerts(apiAlertIds)
        
        if (response.data && response.data.code === 0) {
          // API调用成功，从预警列表中移除选中的项
          this.warningList = this.warningList.filter(item => 
            !this.selectedWarnings.includes(item.id)
          )
          
          this.$message.success(`已成功删除 ${this.selectedWarnings.length} 项预警`)
        } else {
          console.error('删除预警API失败:', response.data)
          this.$message.error('删除失败：' + (response.data && response.data.msg || '服务器错误'))
        }
        
        // 清空选择
        this.selectedWarnings = []
        this.closeDeleteDialog()
      } catch (error) {
        console.error('删除失败:', error)
        this.$message.error('删除失败：' + (error.message || '网络错误'))
      } finally {
        this.deleteLoading = false
      }
    },
    
    // 关闭删除对话框
    closeDeleteDialog() {
      this.deleteDialogVisible = false
      this.deleteLoading = false
    },
    
    // 跳转到复判记录页面
    goToReviewRecords() {
      try {
        // 使用正确的路由名称跳转
        this.$router.push({
          name: 'reviewRecords'
        }).catch((error) => {
          console.error('路由跳转失败:', error)
          this.$message.error('页面跳转失败，请稍后重试')
        })
      } catch (error) {
        console.error('路由跳转失败:', error)
        this.$message.error('页面跳转失败，请稍后重试')
      }
    },
    
    // 显示卡片选择框
    showCardCheckbox(warningId) {
      this.$set(this.cardHoverStates, warningId, true)
    },
    
    // 隐藏卡片选择框
    hideCardCheckbox(warningId) {
      this.$set(this.cardHoverStates, warningId, false)
    },
    
    // 分页处理
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.getWarningList() // 重新获取数据
    },
    
    handleCurrentChange(val) {
      this.currentPage = val
      this.getWarningList() // 重新获取数据
    }
  }
}
</script>

<template>
  <div class="warning-management-container" v-loading="loading">
    <div class="content-area">
      <!-- 搜索和筛选区域 -->
      <div class="search-filter-area">
        <div class="search-row">
          <div class="date-picker-wrapper" style="margin-right: 24px;">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              value-format="yyyy-MM-dd"
              @change="handleSearch"
            />
          </div>
          

          
          <div class="select-wrapper">
            <el-select 
              v-model="searchForm.warningLevel" 
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
              v-model="searchForm.warningType" 
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
            <el-button 
              size="small" 
              icon="el-icon-refresh-right"
              @click="resetSearch"
            >重置</el-button>
          </div>
        </div>
        
        <div class="filter-actions">
          <div class="filter-buttons">
            <el-button 
              size="small" 
              @click="handleSelectPage"
            >选择本页</el-button>
            <el-button 
              size="small" 
              :disabled="selectedWarnings.length === 0"
              @click="handleBatchProcess"
            >批量处理</el-button>
            <el-button 
              size="small" 
              icon="el-icon-delete"
              :disabled="selectedWarnings.length === 0"
              @click="showDeleteDialog"
            >删除</el-button>
          </div>
          
          <div class="action-buttons">
            <el-button 
              class="export-data-btn"
              size="small" 
              icon="el-icon-download"
              @click="exportData"
            >导出数据</el-button>
            <el-button 
              type="primary"
              class="review-record-btn"
              size="small" 
              icon="el-icon-cpu"
              @click="goToReviewRecords"
            >复判记录</el-button>
            <el-button 
              size="small" 
              icon="el-icon-refresh"
              @click="getWarningList"
            >刷新</el-button>
          </div>
        </div>
      </div>
      
      <!-- 预警卡片列表 -->
      <div class="warning-cards-container">
        <div class="warning-cards-grid">
          <div 
            v-for="item in warningList" 
            :key="item.id" 
            class="warning-col"
          >
            <div 
              class="warning-card" 
              :class="{ 'selected': selectedWarnings.includes(item.id) }"
              @click="showWarningDetail(item)"
              @mouseenter="showCardCheckbox(item.id)"
              @mouseleave="hideCardCheckbox(item.id)"
            >
              <!-- 等级和状态标签容器 -->
              <div class="warning-badges-container">
                <div class="warning-level-badge" :class="getLevelClass(item.level)">
                  <span class="level-badge-text">{{ getLevelBadgeText(item.level) }}</span>
                </div>
                
                <!-- 预警状态标签，与等级标签挨在一起显示 -->
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
                  :value="selectedWarnings.includes(item.id)"
                  @change="toggleSelect(item.id)"
                  size="mini"
                >
                </el-checkbox>
              </div>
              
              <div class="warning-image">
                <div v-if="item.imageUrl" class="warning-real-image">
                  <img :src="item.imageUrl" :alt="item.type" />
                </div>
                <div v-else class="warning-video-preview">
                  <i :class="getWarningIcon(item.level)"></i>
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
                    <span class="value">{{ item.location || item.deviceInfo.position || '未知位置' }}</span>
                  </div>

                  <div class="info-item time-item">
                    <span class="time">{{ formatTime(item.time) }}</span>
                  </div>
                </div>
                
                <div class="warning-footer">
                  <!-- 处理按钮始终可用，允许多次处理 -->
                  <div class="item-actions">
                    <!-- 按钮排列顺序与预警详情对话框保持一致：上报、归档、误报、处理 -->
                    <el-button 
                      size="mini" 
                      class="action-btn report-btn"
                      @click.stop="handleWarning(item.id, 'report')"
                      :disabled="isProcessingDisabled(item)"
                    >
                      上报
                    </el-button>
                    
                    <el-button 
                      size="mini" 
                      class="action-btn archive-btn"
                      @click.stop="handleWarning(item.id, 'archive')"
                      :disabled="isArchiveDisabled(item)"
                    >
                      归档
                    </el-button>
                    
                    <el-button 
                      size="mini" 
                      class="action-btn false-alarm-btn"
                      @click.stop="handleWarning(item.id, 'false_alarm')"
                      :disabled="isFalseAlarmDisabled(item)"
                    >
                      误报
                    </el-button>
                    
                    <el-button 
                      size="mini" 
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
          <i class="el-icon-folder-opened"></i>
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
          :page-sizes="[12, 24, 48, 96]" 
          :page-size="pageSize" 
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper" 
          background>
          <template slot="total">
            <span>共 {{ totalCount }} 条数据</span>
          </template>
        </el-pagination>
      </div>
    </div>
    
    <!-- 导出数据对话框 -->
    <el-dialog
      title="导出数据"
      :visible.sync="exportDialogVisible"
      width="35%"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="export-dialog-content">
        <div class="export-info-section">
          <div class="export-data-info">
            <i class="el-icon-download" style="color: #409EFF; font-size: 20px; margin-right: 8px;"></i>
            <span style="font-size: 16px; font-weight: 500;">数据导出</span>
          </div>
          <p class="export-selection-info">
            {{ getExportSelectionText() }}
          </p>
        </div>
        
        <div class="export-format-section">
          <el-form :model="{ exportFormat }" label-width="80px">
            <el-form-item label="导出格式:">
              <el-radio-group v-model="exportFormat">
                <el-radio label="csv">
                  <i class="el-icon-document"></i>
                  CSV格式
                  <span class="format-desc">（逗号分隔值，适合Excel打开）</span>
                </el-radio>
                <el-radio label="excel">
                  <i class="el-icon-s-grid"></i>
                  Excel格式
                  <span class="format-desc">（XLSX文件，包含格式化）</span>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>
        
        <div class="export-filter-info">
          <div class="filter-info-title">
            <i class="el-icon-info" style="color: #909399; margin-right: 4px;"></i>
            <span>当前筛选条件：</span>
          </div>
          <div class="filter-summary">
            <template v-if="hasActiveFilters()">
              <el-tag 
                v-if="searchForm.deviceName" 
                size="mini" 
                type="info" 
                style="margin: 2px;"
              >设备: {{ searchForm.deviceName }}</el-tag>
              <el-tag 
                v-if="searchForm.warningType" 
                size="mini" 
                type="info" 
                style="margin: 2px;"
              >类型: {{ searchForm.warningType }}</el-tag>
              <el-tag 
                v-if="searchForm.warningLevel" 
                size="mini" 
                type="info" 
                style="margin: 2px;"
              >等级: {{ searchForm.warningLevel }}</el-tag>
              <el-tag 
                v-if="searchForm.status" 
                size="mini" 
                type="info" 
                style="margin: 2px;"
              >状态: {{ searchForm.status }}</el-tag>
              <el-tag 
                v-if="searchForm.startDate || searchForm.endDate" 
                size="mini" 
                type="info" 
                style="margin: 2px;"
              >时间范围</el-tag>
            </template>
            <span v-else style="color: #909399; font-size: 12px;">无筛选条件，将导出所有数据</span>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="exportDialogVisible = false" :disabled="exportLoading">取 消</el-button>
        <el-button type="primary" @click="confirmExport" :loading="exportLoading">
          <i class="el-icon-download"></i>
          确认导出
        </el-button>
      </span>
    </el-dialog>
    
    <!-- 添加备注对话框 -->
    <el-dialog
      title="处理预警"
      :visible.sync="remarkDialogVisible"
      width="30%"
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
        <i class="el-icon-info" style="color: #909399; margin-right: 4px;"></i>
        <span style="color: #909399; font-size: 13px;">填写处理意见后，可点击"确认处理"添加处理记录，或点击"结束处理"完成整个处理流程</span>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="saveRemark">确认处理</el-button>
        <el-button @click="finishProcessing">结束处理</el-button>
      </span>
    </el-dialog>
    
    <!-- 上报确认对话框 -->
    <el-dialog
      title="上报确认"
      :visible.sync="reportDialogVisible"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="confirm-content">
        <p>确定要上报此预警吗？</p>
        <p style="color: #909399; font-size: 12px;">上报后预警将提交给上级部门处理</p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeReportDialog">取 消</el-button>
        <el-button type="primary" @click="confirmReport">确定上报</el-button>
      </span>
    </el-dialog>
    
    <!-- 归档确认对话框 -->
    <el-dialog
      title="归档预警"
      :visible.sync="archiveDialogVisible"
      width="40%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      destroy-on-close
      @close="closeArchiveDialog"
    >
      <div class="archive-dialog-content">
        <div class="archive-info">
          <i class="el-icon-folder" style="color: #E6A23C; font-size: 24px; margin-right: 8px;"></i>
          <span>请选择要归档到的档案：</span>
        </div>
        
        <div class="archive-selection">
          <el-form label-width="80px">
            <el-form-item label="选择档案">
              <el-select 
                v-model="selectedArchiveId" 
                placeholder="请选择档案"
                style="width: 100%"
                :disabled="archiveListLoading || availableArchives.length === 0"
                :loading="archiveListLoading"
                popper-append-to-body
              >
                <el-option
                  v-for="archive in availableArchives"
                  :key="archive.archive_id || archive.id"
                  :label="archive.name"
                  :value="archive.archive_id || archive.id"
                >
                  <span style="float: left">{{ archive.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ archive.location || '' }}</span>
                </el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item v-if="!archiveListLoading && availableArchives.length === 0">
              <el-alert
                title="当前没有可用档案"
                description="请先在预警档案页面创建档案后再进行归档操作"
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
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeArchiveDialog">取 消</el-button>
        <el-button type="primary" @click="confirmArchive" :loading="loading" :disabled="!selectedArchiveId">确认归档</el-button>
      </span>
    </el-dialog>
    
    <!-- 批量处理对话框 -->
    <el-dialog
      title="批量处理预警"
      :visible.sync="batchProcessDialogVisible"
      width="35%"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="batch-process-info">
        <i class="el-icon-warning-outline" style="color: #E6A23C; font-size: 24px; margin-right: 8px;"></i>
        <span style="font-size: 16px; font-weight: 500;">您将要批量处理 {{ selectedWarnings.length }} 项预警</span>
      </div>
      
      <el-form :model="batchRemarkForm" label-width="80px" style="margin-top: 20px;">
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
        <i class="el-icon-info" style="color: #909399; margin-right: 4px;"></i>
        <span style="color: #909399; font-size: 13px;">批量处理完成后，将为所有选中的预警添加统一的处理记录，可继续多次处理</span>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeBatchProcessDialog">取 消</el-button>
        <el-button type="primary" @click="confirmBatchProcess">确认批量处理</el-button>
      </span>
    </el-dialog>
    
    <!-- 预警详情对话框 -->
    <WarningDetail
      :visible.sync="warningDetailVisible"
      :alert-id="currentAlertId"
      @handle-warning="handleWarningFromDetail"
      @handle-report="handleReportFromDetail"
      @handle-archive="handleArchiveFromDetail"
      @handle-false-alarm="handleFalseAlarmFromDetail"
    />
    
    <!-- 误报输入对话框 -->
    <el-dialog
      title="标记误报"
      :visible.sync="falseAlarmDialogVisible"
      width="30%"
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
        <i class="el-icon-warning" style="color: #E6A23C; margin-right: 4px;"></i>
        <span style="color: #E6A23C; font-size: 13px;">标记为误报后，该预警将被移出预警管理列表，并保存到复判记录中</span>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="falseAlarmDialogVisible = false; falseAlarmForm.reviewNotes = ''; archiveWarningId = ''">取消</el-button>
        <el-button type="primary" @click="handleFalseAlarmArchive">确认误报</el-button>
      </span>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      title="删除预警"
      :visible.sync="deleteDialogVisible"
      width="400px"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="delete-dialog-content">
        <div class="delete-warning-icon">
          <i class="el-icon-warning-outline" style="color: #f56c6c; font-size: 36px;"></i>
        </div>
        <div class="delete-text">
          <p class="delete-title">确定要删除选中的预警吗？</p>
          <p class="delete-desc">您已选择 <strong>{{ selectedWarnings.length }}</strong> 项预警，删除后将无法恢复</p>
          <div class="delete-tip">
            <i class="el-icon-info" style="color: #e6a23c; margin-right: 4px;"></i>
            <span style="color: #e6a23c; font-size: 13px;">此操作不可逆，请谨慎操作</span>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeDeleteDialog" :disabled="deleteLoading">取 消</el-button>
        <el-button type="danger" @click="confirmDelete" :loading="deleteLoading">确认删除</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<style scoped>
.warning-management-container {
  height: calc(100vh - 80px); /* 减去顶部导航栏高度，增加缓冲空间 */
  background: #f5f5f5;
  padding: 0;
  overflow: hidden; /* 防止出现外部滚动条 */
}

/* 内容区样式 - 科技感蓝色背景 */
.content-area {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 16px 24px 16px; /* 底部固定24px */
  overflow: hidden; /* 防止内容区域产生滚动条 */
  box-sizing: border-box;
}

/* 搜索和筛选区域 - 科技感样式 */
.search-filter-area {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
  position: relative;
  overflow: hidden;
  flex-shrink: 0; /* 不允许收缩 */
  min-height: 100px; /* 减少最小高度 */
}



.search-row {
  display: flex;
  margin-bottom: 12px;
  flex-wrap: wrap;
  position: relative;
  z-index: 2;
}

.date-picker-wrapper,
.select-wrapper,
.input-wrapper {
  margin-right: 12px;
  margin-bottom: 0;
}

.date-picker-wrapper {
  width: 340px;
}

.select-wrapper {
  width: 140px;
}

.input-wrapper {
  width: 140px;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
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
  margin-bottom: 0;
  min-width: 96px;
  height: 40px;
  padding: 0 16px;
  border-color: rgba(26, 109, 255, 0.1);
  background: rgba(26, 109, 255, 0.1);
  color: #1A6DFF;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.filter-buttons .el-button:hover {
  background: rgba(26, 109, 255, 0.05);
  border-color: rgba(26, 109, 255, 0.1);
  color: #1A6DFF;
  box-shadow: none;
  transform: none;
}

.filter-buttons .el-button.is-disabled,
.filter-buttons .el-button.is-disabled:hover,
.filter-buttons .el-button:disabled,
.filter-buttons .el-button:disabled:hover {
  background: #F4F4F4 !important;
  border-color: #F4F4F4 !important;
  color: #CCCCCC !important;
  box-shadow: none !important;
  transform: none !important;
}

.filter-buttons .el-button.active {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: #fff;
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  margin-left: 8px;
  margin-bottom: 0;
  min-width: 96px;
  height: 40px;
  padding: 0 16px;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.action-buttons .el-button--primary {
  background: rgba(26, 109, 255, 0.1);
  border: 1px solid rgba(26, 109, 255, 0.1);
  position: relative;
  overflow: hidden;
  color: #1A6DFF;
  font-weight: 500;
  letter-spacing: 0;
}

.action-buttons .el-button--primary::before {
  display: none;
}

.action-buttons .el-button--primary:hover {
  background: rgba(26, 109, 255, 0.05);
  border-color: rgba(26, 109, 255, 0.1);
  color: #1A6DFF;
  box-shadow: none;
  transform: none;
}

.action-buttons .el-button.is-disabled,
.action-buttons .el-button.is-disabled:hover,
.action-buttons .el-button:disabled,
.action-buttons .el-button:disabled:hover {
  background: #F4F4F4 !important;
  border-color: #F4F4F4 !important;
  color: #CCCCCC !important;
  box-shadow: none !important;
  transform: none !important;
}

.action-buttons .el-button--primary:hover::before {
  display: none;
}

.action-buttons .review-record-btn {
  background: #1A6DFF !important;
  border: 1px solid #1A6DFF !important;
  color: #FFFFFF !important;
  font-weight: 500 !important;
}

.action-buttons .review-record-btn:hover,
.action-buttons .review-record-btn:focus {
  background: #66B1FF !important;
  border-color: #66B1FF !important;
  color: #FFFFFF !important;
  box-shadow: none !important;
  transform: none !important;
}

/* 预警卡片样式 - 科技感设计 */
.warning-cards-container {
  flex: 1;
  height: auto; /* 由flex布局自动分配高度，避免挤压分页区底部留白 */
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 20px;
  background: #ffffff;
  border-radius: 16px;
  margin: 1px;
  /* 自定义滚动条样式 - 灰色主题 */
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 transparent;
  box-sizing: border-box;
}

/* 自定义滚动条样式 - WebKit 灰色主题 */
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
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 16px;
  margin: 0;
  padding-top: 16px;
  padding-bottom: 16px; /* 与顶部保持一致 */
  align-content: center; /* 行内容垂直居中，顶部和底部留白一致 */
}

.warning-col {
  width: calc(16.66% - 13.33px);
  margin: 0;
}

.warning-card {
  height: 370px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 0;
  position: relative;
  transition: all 0.3s ease;
  width: 100%;
  border: 1px solid #f3f4f6;
}



.warning-card > * {
  position: relative;
  z-index: 2;
}

.warning-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.warning-card.selected {
  border: 1px solid #3b82f6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
}

.warning-card.selected .selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(59, 130, 246, 0.05);
  z-index: 1;
}

/* 等级和状态标签容器 - 科技感样式 */
.warning-badges-container {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 6px;
  z-index: 10;
}

/* 预警等级标签 - 科技感样式（参考摄像头页面状态标签） */
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

/* 一级预警 - 危险红色渐变 */
.warning-level-badge.level-1-bg {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%) !important;
  color: #991b1b !important;
  border-color: #fca5a5 !important;
}

/* 二级预警 - 警告橙色渐变 */
.warning-level-badge.level-2-bg {
  background: linear-gradient(135deg, #fffbeb 0%, #fed7aa 100%) !important;
  color: #92400e !important;
  border-color: #fbbf24 !important;
}

/* 三级预警 - 信息蓝色渐变 */
.warning-level-badge.level-3-bg {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  color: #1e40af !important;
  border-color: #93c5fd !important;
}

/* 四级预警 - 成功绿色渐变 */
.warning-level-badge.level-4-bg {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
  color: #065f46 !important;
  border-color: #a7f3d0 !important;
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

.warning-video-preview i {
  font-size: 36px;
  margin-bottom: 12px;
  opacity: 0.8;
  color: #409EFF;
}

.warning-video-preview span {
  font-size: 13px;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
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

.warning-level {
  font-weight: 500;
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

/* 底部按钮样式 - 统一样式 */
.action-btn {
  padding: 6px 16px;
  font-size: 12px;
  border-radius: 16px;
  transition: all 0.3s ease;
  margin: 0 2px;
  font-weight: 500;
  border: 1px solid #dcdfe6;
  background: #ffffff;
  color: #606266;
}

.action-btn:hover {
  background: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}



/* 等级样式 - 移除边框相关样式 */
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

.level-1-text {
  color: #f56c6c;
}

.level-2-text {
  color: #e6a23c;
}

.level-3-text {
  color: #409eff;
}

.level-4-text {
  color: #67c23a;
}

/* 导出对话框样式 */
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

.export-format-section .el-radio {
  display: block;
  margin-bottom: 10px;
  padding: 8px 0;
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

/* 响应式调整 */
@media (max-width: 1600px) {
  .warning-col {
    width: calc(20% - 12.8px);
  }
}

@media (max-width: 1280px) {
  .warning-col {
    width: calc(25% - 12px);
  }
  
  .date-picker-wrapper {
    width: 100%;
    margin-right: 0;
  }
  
  .select-wrapper,
  .input-wrapper {
    width: calc(33.33% - 8px);
    min-width: 120px;
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
  
  /* 调整卡片容器高度以适应更大的搜索区域 */
  .warning-cards-container {
    height: calc(100vh - 250px) !important;
  }
  
  .search-filter-area {
    min-height: 130px !important;
  }
}

@media (max-width: 768px) {
  .select-wrapper,
  .input-wrapper {
    width: 100%;
    margin-right: 0;
  }
  
  .warning-col {
    width: calc(50% - 8px);
  }
  
  .warning-management-container {
    height: calc(100vh - 80px) !important;
  }
  
  /* 移动端调整卡片容器高度 */
  .warning-cards-container {
    height: calc(100vh - 300px) !important;
  }
  
  .search-filter-area {
    min-height: 160px !important;
  }
}

@media (max-width: 480px) {
  .warning-col {
    width: calc(50% - 8px);
  }
  
  .warning-cards-grid {
    gap: 12px;
  }
}

/* 添加重置按钮样式 */
.reset-button {
  margin-left: 8px;
}

.select-checkbox {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  transition: all 0.2s ease;
}

.select-checkbox >>> .el-checkbox {
  margin: 0;
}

.select-checkbox >>> .el-checkbox__input.is-checked .el-checkbox__inner {
  background-color: #3b82f6 !important;
  border-color: #3b82f6 !important;
}

.select-checkbox >>> .el-checkbox__inner:hover {
  border-color: #3b82f6 !important;
}

.select-checkbox >>> .el-checkbox__inner {
  width: 18px !important;
  height: 18px !important;
  border: 2px solid #dcdfe6 !important;
  border-radius: 3px !important;
  background: rgba(255, 255, 255, 0.9) !important;
}

.select-checkbox >>> .el-checkbox__inner::after {
  height: 8px !important;
  left: 5px !important;
  top: 1px !important;
  width: 3px !important;
  border: 2px solid #fff !important;
  border-left: 0 !important;
  border-top: 0 !important;
}

/* 没有数据时的提示样式 */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%; /* 填满整个容器高度 */
  padding: 40px 20px;
  color: #909399;
  text-align: center;
  box-sizing: border-box;
}

.no-data i {
  font-size: 64px;
  margin-bottom: 20px;
  color: #dcdfe6;
  opacity: 0.6;
}

.no-data p {
  font-size: 16px;
  margin: 0 0 8px 0;
  color: #606266;
  font-weight: 500;
}

.no-data-tip {
  font-size: 13px;
  color: #909399;
  opacity: 0.8;
}

/* 对话框内容样式 */
.dialog-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.confirm-content {
  text-align: center;
  padding: 20px 0;
}

.confirm-content p {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
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

/* 归档对话框样式 */
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

/* 动画效果 */
@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}



/* 预警状态标签 - 科技感样式（参考摄像头页面状态标签） */
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

.warning-status-badge:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

/* 待处理状态 - 灰色渐变 */
.warning-status-badge.status-pending {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%) !important;
  color: #4b5563 !important;
  border-color: #d1d5db !important;
}

/* 处理中状态 - 蓝色渐变 */
.warning-status-badge.status-processing {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  color: #1e40af !important;
  border-color: #93c5fd !important;
}

/* 已完成状态 - 绿色渐变 */
.warning-status-badge.status-completed {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
  color: #065f46 !important;
  border-color: #a7f3d0 !important;
}

/* 已归档状态 - 深灰色渐变 */
.warning-status-badge.status-archived {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%) !important;
  color: #374151 !important;
  border-color: #9ca3af !important;
}

/* 删除对话框样式 */
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

/* 科技感导出数据按钮样式 */
.export-data-btn {
  background: rgba(26, 109, 255, 0.1);
  border: 1px solid rgba(26, 109, 255, 0.1);
  color: #1A6DFF;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: none;
}

.export-data-btn:hover {
  background: rgba(26, 109, 255, 0.05);
  border-color: rgba(26, 109, 255, 0.1);
  color: #1A6DFF;
  box-shadow: none;
  transform: none;
}

.export-data-btn:focus {
  background: rgba(26, 109, 255, 0.1);
  border-color: rgba(26, 109, 255, 0.1);
  color: #1A6DFF;
  box-shadow: none;
}

.export-data-btn:active {
  transform: none;
  box-shadow: none;
}

.export-data-btn::before {
  display: none;
}

.export-data-btn:hover::before {
  display: none;
}

/* 对话框样式优化 - 科技感设计 */
.warning-management-container >>> .el-dialog {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.warning-management-container >>> .el-dialog__header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  padding: 16px 20px;
  text-align: left !important;
}

.warning-management-container >>> .el-dialog__title {
  color: #333333;
  font-size: 18px;
  font-weight: 600;
  font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  display: block;
  text-align: left !important;
}

.warning-management-container >>> .el-dialog__close {
  color: #6b7280;
  transition: color 0.3s ease;
}

.warning-management-container >>> .el-dialog__close:hover {
  color: #3b82f6;
}

.warning-management-container >>> .el-dialog__body {
  padding: 20px;
  background: #ffffff;
}

.warning-management-container >>> .el-button--primary {
  background: #1A6DFF !important;
  border: 1px solid #1A6DFF !important;
  box-shadow: none !important;
  color: white !important;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.warning-management-container >>> .el-button--primary:hover {
  background: #1A6DFF !important;
  border-color: #1A6DFF !important;
  box-shadow: none !important;
  color: #ffffff !important;
  transform: none !important;
}

.warning-management-container >>> .el-button--primary:focus,
.warning-management-container >>> .el-button--primary:active {
  background: #1A6DFF !important;
  border-color: #1A6DFF !important;
  color: #ffffff !important;
  box-shadow: none !important;
  transform: none !important;
}

.warning-management-container >>> .el-button--success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.warning-management-container >>> .el-button--success:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
}

.warning-management-container >>> .el-button--default {
  background: white;
  border: 1px solid #d1d5db;
  color: #4b5563;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.warning-management-container >>> .el-button--default:hover {
  background: #ffffff;
  border-color: #3b82f6;
  color: #1e40af;
  box-shadow: none;
}

.warning-management-container >>> .el-button--danger {
  background: linear-gradient(135deg, #f56c6c 0%, #dc2626 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.3);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.warning-management-container >>> .el-button--danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 4px 10px rgba(245, 108, 108, 0.4);
  transform: translateY(-1px);
}

.warning-management-container >>> .el-button--warning {
  background: linear-gradient(135deg, #e6a23c 0%, #f59e0b 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(230, 162, 60, 0.3);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.warning-management-container >>> .el-button--warning:hover {
  background: linear-gradient(135deg, #d97706 0%, #dc2626 100%);
  box-shadow: 0 4px 10px rgba(230, 162, 60, 0.4);
  transform: translateY(-1px);
}

/* 输入框和选择框样式优化 */
.warning-management-container >>> .el-input__inner {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.warning-management-container >>> .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.warning-management-container >>> .el-select .el-input__inner {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.warning-management-container >>> .el-select .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.warning-management-container >>> .el-date-editor.el-input {
  border-radius: 6px;
}

.warning-management-container >>> .el-date-editor .el-input__inner {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.warning-management-container >>> .el-date-editor .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 分页样式 - 参照multimodalLlmSkills.vue */
.pagination-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 100%;
  background: #ffffff;
  padding: 24px; /* 上下左右统一24px，顶部和底部一致 */
  margin-top: 8px; /* 减少上边距 */
  margin-bottom: 0; /* 与content-area底部24px保持精确间距 */
  margin-right: 0;
  margin-left: 0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.08);
  flex-shrink: 0; /* 不允许收缩 */
  height: auto;
  box-sizing: border-box;
}

.pagination-section >>> .el-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 覆盖Element UI分页组件样式 */
.pagination-section >>> .el-pagination .el-pager li {
  background: white !important;
  border: 1px solid #dcdfe6 !important;
  color: #606266 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
  margin: 0 2px !important;
}

.pagination-section >>> .el-pagination .el-pager li:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
}

.pagination-section >>> .el-pagination .el-pager li.active {
  background: #1A6DFF !important;
  border-color: #1A6DFF !important;
  color: white !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 6px rgba(26, 109, 255, 0.3);
}

.pagination-section >>> .el-pagination button {
  background: white !important;
  border: 1px solid #dcdfe6 !important;
  color: #606266 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
  margin: 0 2px !important;
}

.pagination-section >>> .el-pagination button:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
}

/* 更强的Element UI样式覆盖 */
.pagination-section >>> .el-pagination .el-pager li.number {
  background-color: white !important;
  border: 1px solid #dcdfe6 !important;
  color: #606266 !important;
}

.pagination-section >>> .el-pagination .el-pager li.number:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
}

.pagination-section >>> .el-pagination .el-pager li.number.active {
  background: #1A6DFF !important;
  border-color: #1A6DFF !important;
  color: white !important;
  box-shadow: 0 2px 6px rgba(26, 109, 255, 0.3);
}

.pagination-section >>> .el-pagination .btn-prev,
.pagination-section >>> .el-pagination .btn-next {
  background-color: white !important;
  border: 1px solid #dcdfe6 !important;
  color: #606266 !important;
}

.pagination-section >>> .el-pagination .btn-prev:hover,
.pagination-section >>> .el-pagination .btn-next:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
}

.pagination-section >>> .el-pagination .el-select .el-input .el-input__inner {
  border-color: #dcdfe6 !important;
  color: #606266 !important;
  border-radius: 6px !important;
}

.pagination-section >>> .el-pagination .el-select .el-input .el-input__inner:hover {
  border-color: #3b82f6 !important;
}

.pagination-section >>> .el-pagination .el-input__inner {
  border-radius: 6px !important;
}

.pagination-section >>> .el-pagination__jump {
  color: #606266 !important;
}

.pagination-section >>> .el-pagination__total {
  color: #606266 !important;
  font-weight: 500 !important;
}

/* 归档对话框中的 select 下拉框层级控制 */
.archive-select-dropdown {
  z-index: 9999 !important;
}

/* 归档对话框层级控制 */
.page-container >>> .el-dialog__wrapper {
  z-index: 3000 !important;
}
</style>

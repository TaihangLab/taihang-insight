<script>
import WarningDetail from './warningDetail.vue'
import { alertAPI, archiveAPI } from '@/components/service/VisionAIService.js'
import userService from '@/components/service/UserService.js'
import {
  ALERT_LEVEL_CODE_BY_KEY,
  ALERT_STATUS_NAME_BY_KEY,
  formatAlertDateTime,
  getAlertLevelName,
  getAlertLevelShortName,
  getAlertStatusName,
  getCurrentAlertTime,
  toAlertStatusKey
} from './utils/alertFormatting'
import { buildAlertProcessHistory } from './utils/alertProcessHistory'

export default {
  name: "WarningManagement",
  components: {
    WarningDetail
  },
  data() {
    return {
      // 定义搜索条件
      searchForm: {
        startDate: '',
        endDate: '',
        warningType: '', // 预警类型（如：安全生产预警）
        warningLevel: '',
        warningSkill: '', // 预警技能
        warningName: '', // 预警名称
        warningId: '', // 预警ID
        status: '', // 处理状态
        cameraId: '' // 点位（摄像头 ID）
      },
      
      // 预警列表数据
      warningList: [],
      
      // 表格加载状态
      loading: false,
      warningListRequestId: 0,
      warningListRequestController: null,
      
      // 选中的预警项
      selectedWarnings: [],
      // 显式勾选模式下保存每条预警的状态快照，支持跨页并发校验
      selectedWarningExpectedStatuses: {},
      // 筛选了预警技能后可「全选」当前筛选结果
      selectAllFiltered: false,
      selectionSnapshotLoading: false,
      selectionSnapshotRequestId: 0,
      
      // 日期范围
      dateRange: null,
      
      // 导出图片相关
      exportDialogVisible: false,
      exportImageType: 'annotated', // annotated | raw
      exportLoading: false,
      // 打包下载进度
      downloadProgressVisible: false,
      downloadProgressPhase: '',
      downloadProgressPercent: 0,
      downloadProgressStatus: undefined,
      downloadProgressTitle: '',
      downloadProgressMeta: '',
      downloadProgressError: '',
      downloadJobId: null,
      downloadPollTimer: null,
      zipDownloading: false,
      
      // 添加备注对话框
      remarkDialogVisible: false,
      currentWarningId: '',
      currentProcessingWarningId: '', // 统一变量名（与realtime页面一致）
      remarkForm: {
        remark: ''
      },

      // 重新处理对话框
      reopenDialogVisible: false,
      reopenWarningId: '',
      reopenForm: {
        reason: ''
      },
      
      // 上报确认对话框
      reportDialogVisible: false,
      reportWarningId: '',
      reportForm: {
        notes: ''
      },
      
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
      
      // 筛选下拉（从后端动态加载，与列表实际数据一致）
      warningSkillOptions: [],
      warningTypeOptions: [],
      cameraOptions: [],
      
      // 分页相关
      currentPage: 1,
      pageSize: 12,
      totalCount: 0
    }
  },
  computed: {
    // 筛选了预警技能后才允许全选
    canSelectAll() {
      return !!this.searchForm.warningSkill
    },
    exportSelectedCount() {
      return this.selectedWarnings.length
    }
  },
  watch: {
    dateRange(newVal) {
      if (newVal && newVal.length === 2) {
        this.searchForm.startDate = newVal[0]
        this.searchForm.endDate = newVal[1]
      } else {
        this.searchForm.startDate = ''
        this.searchForm.endDate = ''
      }
    },
    'searchForm.warningSkill'(val) {
      if (!val) {
        this.clearWarningSelection()
      }
    }
  },
  mounted() {
    this.loadFilterOptions()
    this.getWarningList()
  },
  beforeDestroy() {
    this.warningListRequestId += 1
    this.selectionSnapshotRequestId += 1
    if (this.warningListRequestController) {
      this.warningListRequestController.abort()
      this.warningListRequestController = null
    }
    this.stopDownloadPoll()
  },
  methods: {
    mapCameraOptions(cameras) {
      const cameraOptions = []
      ;(cameras || []).forEach(c => {
        if (!c || !c.camera_id) return
        const name = c.camera_name || ('点位' + c.camera_id)
        const count = c.alert_count ? `（${c.alert_count}）` : ''
        cameraOptions.push({
          label: `${name}${count}`,
          value: String(c.camera_id),
          cameraName: name
        })
      })
      return cameraOptions
    },

    fallbackCameraOptionsFromList() {
      const seen = {}
      const cameraOptions = []
      ;(this.warningList || []).forEach(item => {
        const api = item._apiData || {}
        const cid = api.camera_id != null ? String(api.camera_id) : (item.cameraId || '')
        if (!cid || seen[cid]) return
        seen[cid] = true
        const name = api.camera_name || item.device || ('点位' + cid)
        cameraOptions.push({ label: name, value: cid, cameraName: name })
      })
      return cameraOptions
    },

    syncCameraSelection() {
      if (!this.searchForm.cameraId) return
      const stillValid = this.cameraOptions.some(c => c.value === this.searchForm.cameraId)
      if (!stillValid) {
        this.searchForm.cameraId = ''
      }
    },

    async loadCameraOptions() {
      const cameraParams = {}
      const skillClassId = this.parseSelectedSkillClassId()
      if (skillClassId != null) {
        cameraParams.skill_class_id = skillClassId
      }
      let cameraOptions = []
      try {
        const res = await alertAPI.getAlertSkills(cameraParams)
        const payload = res && res.data && res.data.data
        cameraOptions = this.mapCameraOptions((payload && payload.cameras) || [])
      } catch (e) {
        console.error('加载点位筛选项失败:', e)
      }
      if (!cameraOptions.length) {
        cameraOptions = this.fallbackCameraOptionsFromList()
      }
      this.cameraOptions = cameraOptions
      this.syncCameraSelection()
    },

    async loadFilterOptions() {
      // 只展示预警列表里实际出现过的类型/技能/点位，避免筛选项与下方数据不一致
      const skillOptions = []
      const typeOptions = []
      let cameraOptions = []
      const cameraParams = {}
      const skillClassId = this.parseSelectedSkillClassId()
      if (skillClassId != null) {
        cameraParams.skill_class_id = skillClassId
      }
      try {
        const res = await alertAPI.getAlertSkills(cameraParams)
        const body = res && res.data
        const payload = body && body.data
        const skills = Array.isArray(payload)
          ? payload
          : ((payload && payload.skills) || [])
        const types = (!Array.isArray(payload) && payload && payload.alert_types) || []
        const cameras = (!Array.isArray(payload) && payload && payload.cameras) || []

        skills.forEach(s => {
          if (!s || s.skill_class_id == null) return
          const source = (s.skill_source === 'llm' || s.skill_source === 'graph') ? s.skill_source : 'vision'
          const name = s.skill_name_zh || ('技能#' + s.skill_class_id)
          const count = s.alert_count ? `（${s.alert_count}）` : ''
          const tag = source === 'llm' ? '[大模型]' : (source === 'graph' ? '[编排]' : '[视觉]')
          skillOptions.push({
            label: `${tag} ${name}${count}`,
            value: `${source}:${s.skill_class_id}`,
            skillClassId: s.skill_class_id,
            skillNameZh: name
          })
        })

        types.forEach(t => {
          if (!t || !t.alert_type) return
          const count = t.alert_count ? `（${t.alert_count}）` : ''
          typeOptions.push({
            label: `${t.alert_type}${count}`,
            value: t.alert_type
          })
        })

        cameraOptions = this.mapCameraOptions(cameras)
      } catch (e) {
        console.error('加载预警筛选选项失败:', e)
      }

      // 接口失败时，用当前页列表兜底
      if (Array.isArray(this.warningList) && this.warningList.length) {
        if (!skillOptions.length) {
          const seen = {}
          this.warningList.forEach(item => {
            const api = item._apiData || {}
            const sid = api.skill_class_id
            if (sid == null) return
            const source = (api.alert_type && String(api.alert_type).startsWith('llm_'))
              ? 'llm'
              : (api.skill_source === 'graph' ? 'graph' : 'vision')
            const value = `${source}:${sid}`
            if (seen[value]) return
            seen[value] = true
            skillOptions.push({
              label: api.skill_name_zh || ('技能#' + sid),
              value,
              skillClassId: sid,
              skillNameZh: api.skill_name_zh || ('技能#' + sid)
            })
          })
        }
        if (!typeOptions.length) {
          const seen = {}
          this.warningList.forEach(item => {
            const t = (item._apiData && item._apiData.alert_type) || item.type
            if (!t || seen[t]) return
            seen[t] = true
            typeOptions.push({ label: t, value: t })
          })
        }
        if (!cameraOptions.length) {
          cameraOptions = this.fallbackCameraOptionsFromList()
        }
      }

      this.warningSkillOptions = skillOptions
      this.warningTypeOptions = typeOptions
      this.cameraOptions = cameraOptions
      this.syncCameraSelection()
    },

    onSkillSelectVisible(visible) {
      if (visible && (!this.warningSkillOptions || !this.warningSkillOptions.length)) {
        this.loadFilterOptions()
      }
    },

    onTypeSelectVisible(visible) {
      if (visible && (!this.warningTypeOptions || !this.warningTypeOptions.length)) {
        this.loadFilterOptions()
      }
    },

    onCameraSelectVisible(visible) {
      if (visible && (!this.cameraOptions || !this.cameraOptions.length)) {
        this.loadCameraOptions()
      }
    },

    async handleSkillChange() {
      this.clearWarningSelection()
      await this.loadCameraOptions()
      this.handleSearch()
    },

    parseSelectedSkillClassId() {
      const skillVal = this.searchForm.warningSkill
      if (!skillVal) return null
      const str = String(skillVal)
      if (str.includes(':')) {
        const sid = parseInt(str.split(':')[1], 10)
        return isNaN(sid) ? null : sid
      }
      if (/^\d+$/.test(str)) return parseInt(str, 10)
      return null
    },

    // 搜索重置
    resetSearch() {
      this.searchForm = {
        startDate: '',
        endDate: '',
        warningType: '',
        warningLevel: '',
        warningSkill: '',
        warningName: '',
        warningId: '',
        status: '',
        cameraId: ''
      }
      this.dateRange = null
      this.currentPage = 1
      this.loadCameraOptions()
      this.getWarningList()
    },
    
    // 执行搜索
    handleSearch() {
      this.currentPage = 1
      this.getWarningList()
    },
    
    // 获取预警列表
    async getWarningList(options = {}) {
      const clearSelection = options.clearSelection !== false
      if (this.warningListRequestController) {
        this.warningListRequestController.abort()
      }
      const requestId = ++this.warningListRequestId
      const controller = typeof AbortController !== 'undefined'
        ? new AbortController()
        : null
      this.warningListRequestController = controller
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
          camera_id: this.searchForm.cameraId,
          statusFilter: this.searchForm.status
        }

        // 过滤空值参数
        Object.keys(apiParams).forEach(key => {
          if (apiParams[key] === '' || apiParams[key] === null || apiParams[key] === undefined) {
            delete apiParams[key]
          }
        })


        // 调用API获取数据
        const response = await alertAPI.getRealTimeAlerts(
          apiParams,
          controller ? { signal: controller.signal } : {}
        )
        if (requestId !== this.warningListRequestId) return

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
          
          if (!this.warningSkillOptions.length || !this.warningTypeOptions.length || !this.cameraOptions.length) {
            this.loadFilterOptions()
          }
        } else {
          console.error('获取预警列表失败:', response.data)
          this.$message.error('获取预警列表失败')
          this.warningList = []
          this.totalCount = 0
        }
        
        // 刷新后按需清空选择；翻页且已筛选技能时保留（支持全选/跨页勾选）
        this.cardHoverStates = {}
        if (clearSelection) {
          this.clearWarningSelection()
        }
      } catch (error) {
        const canceled = requestId !== this.warningListRequestId ||
          (controller && controller.signal.aborted) ||
          error.code === 'ERR_CANCELED' ||
          error.__CANCEL__ === true
        if (canceled) return

        console.error('获取预警列表异常:', error)
        this.$message.error('获取预警列表失败：' + (error.message || '网络错误'))
        // 发生错误时清空数据
        this.warningList = []
        this.totalCount = 0
      } finally {
        if (requestId === this.warningListRequestId) {
          this.loading = false
          this.warningListRequestController = null
        }
      }
    },

    isWarningSelected(id) {
      return this.selectedWarnings.includes(id)
    },

    clearWarningSelection() {
      this.selectionSnapshotRequestId += 1
      this.selectionSnapshotLoading = false
      this.selectedWarnings = []
      this.selectedWarningExpectedStatuses = {}
      this.selectAllFiltered = false
    },

    rememberWarningExpectedStatus(warning) {
      if (!warning) return
      const apiStatus = warning._apiData && Number(warning._apiData.status)
      if (apiStatus) {
        this.$set(this.selectedWarningExpectedStatuses, String(warning.id), apiStatus)
      }
    },

    forgetWarningExpectedStatus(id) {
      this.$delete(this.selectedWarningExpectedStatuses, String(id))
    },

    // 转换API数据为页面数据格式
    transformApiDataToPageData(apiData) {
      if (!Array.isArray(apiData)) {
        console.warn('API数据格式不正确，期望数组:', apiData)
        return []
      }

      return apiData.map(item => {
        // 🔧 统一处理操作历史（与realTimeMonitoring保持一致）
        const operationHistory = this.convertProcessHistory(
          item.process,
          item.status,
          formatAlertDateTime(item.alert_time),
          item.processed_by,
          formatAlertDateTime(item.resolved_at || item.processed_at),
          item.processing_notes
        );

        return {
          // 基本信息映射
          id: String(item.alert_id || item.id || Date.now()),
          deviceName: item.alert_name || '未知预警',
          imageUrl: item.minio_frame_url || null,
          value: 1,
          unit: '件',
          level: getAlertLevelName(item.alert_level),
          time: formatAlertDateTime(item.alert_time || item.created_at),
          status: toAlertStatusKey(item.status),
          
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

    // 🔧 转换处理历史 - 与realTimeMonitoring保持一致
    // alertTime: 预警产生时间, processedAt: 处理时间
    convertProcessHistory(processData, apiStatus, alertTime, processedBy, processedAt, processingNotes) {
      return buildAlertProcessHistory({
        processData,
        apiStatus,
        alertTime,
        processedBy,
        processedAt,
        processingNotes,
        formatTime: value => formatAlertDateTime(value),
        currentTime: () => getCurrentAlertTime()
      })
    },
    
    // 处理预警事件
    async handleWarning(id, action) {
      try {
        this.loading = true
        
        
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
          } else if (action === 'reopen') {
            this.reopenWarningId = id
            this.reopenForm.reason = ''
            this.reopenDialogVisible = true
            return
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

        const currentStatus = warningInfo._apiData
          ? Number(warningInfo._apiData.status)
          : null
        if (currentStatus != null && currentStatus !== 3) {
          this.$message.warning(`只有已处理状态的预警才能归档，当前状态为：${getAlertStatusName(currentStatus)}。请先点「处理」并结束处理后再归档。`)
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

        const currentStatus = warning._apiData ? Number(warning._apiData.status) : null
        if (currentStatus != null && currentStatus !== 3) {
          this.$message.warning(`只有已处理状态的预警才能归档，当前状态为：${getAlertStatusName(currentStatus)}。请先点「处理」并结束处理后再归档。`)
          this.closeArchiveDialog()
          return
        }

        const apiAlertId = warning._apiData ? warning._apiData.alert_id : parseInt(this.archiveWarningId)

        // 后端在同一事务中建立档案关联并更新预警状态。
        const response = await archiveAPI.linkAlertsToArchive(
          targetArchiveId,
          [apiAlertId],
          `预警管理归档 - 预警类型: ${warning.type || warning.alert_type}`
        )

        const archiveResult = response.data && response.data.data
        if (response.data && response.data.code === 0 &&
            archiveResult && archiveResult.failed_count === 0) {
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
            time: getCurrentAlertTime(),
            description: `预警已归档到：${archiveName}，可在预警档案中查看`,
            operationType: 'archive',
            operator: archiveResult.linked_by || this.getCurrentUserName(),
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
        const serverMessage = error.response && error.response.data &&
          (error.response.data.detail || error.response.data.message)
        this.$message.error('归档失败: ' + (serverMessage || error.message || '未知错误'))
      } finally {
        this.loading = false
      }
    },
    
    // 获取当前用户昵称
    getCurrentUserName() {
      return userService.getUserDisplayName()
    },
    
    
    // 选择当前页
    handleSelectPage() {
      if (this.selectAllFiltered) {
        this.clearWarningSelection()
      }
      const currentPageIds = this.warningList.map(item => item.id)
      if (currentPageIds.length === 0) {
        this.$message.warning('当前页没有可选择的预警')
        return
      }

      const isCurrentPageFullySelected = currentPageIds.every(id =>
        this.selectedWarnings.includes(id)
      )

      if (isCurrentPageFullySelected) {
        this.selectedWarnings = this.selectedWarnings.filter(id =>
          !currentPageIds.includes(id)
        )
        currentPageIds.forEach(id => this.forgetWarningExpectedStatus(id))
        this.$message.info('已取消选择本页')
      } else if (!this.canSelectAll) {
        // 未筛选技能：只选本页
        this.selectedWarnings = [...currentPageIds]
        this.selectedWarningExpectedStatuses = {}
        this.warningList.forEach(item => this.rememberWarningExpectedStatus(item))
        this.$message.success(`已选择本页 ${currentPageIds.length} 项预警`)
      } else {
        currentPageIds.forEach(id => {
          if (!this.selectedWarnings.includes(id)) this.selectedWarnings.push(id)
        })
        this.warningList.forEach(item => this.rememberWarningExpectedStatus(item))
        this.$message.success(`已选择本页 ${currentPageIds.length} 项预警`)
      }
    },

    // 全选当前筛选结果（需先筛选预警技能）
    async handleSelectAll() {
      if (!this.canSelectAll) {
        this.$message.warning('请先筛选预警技能后再全选')
        return
      }
      if (this.totalCount === 0) {
        this.$message.warning('当前没有可选择的预警')
        return
      }
      if (this.selectAllFiltered) {
        this.clearWarningSelection()
        this.$message.info('已取消全选')
        return
      }

      const filters = { ...this.buildCurrentFilterBody() }
      const requestId = ++this.selectionSnapshotRequestId
      this.selectionSnapshotLoading = true
      try {
        const response = await alertAPI.createAlertSelectionSnapshot(filters)
        if (requestId !== this.selectionSnapshotRequestId) return

        if (JSON.stringify(filters) !== JSON.stringify(this.buildCurrentFilterBody())) {
          this.$message.info('筛选条件已变化，请重新全选')
          return
        }

        const responseData = response.data || {}
        const snapshot = responseData.data || {}
        if (responseData.code !== 0) {
          throw new Error(responseData.msg || '创建选择快照失败')
        }

        const alertIds = Array.isArray(snapshot.alert_ids)
          ? snapshot.alert_ids.map(Number).filter(id => Number.isInteger(id) && id > 0)
          : []
        const rawExpectedStatuses = snapshot.expected_statuses || {}
        const expectedStatuses = {}
        alertIds.forEach(alertId => {
          const status = Number(rawExpectedStatuses[String(alertId)])
          if (Number.isInteger(status) && status > 0) {
            expectedStatuses[String(alertId)] = status
          }
        })

        if (alertIds.length !== Number(snapshot.total || 0) ||
            Object.keys(expectedStatuses).length !== alertIds.length) {
          throw new Error('选择快照数据不完整，请刷新后重试')
        }
        if (alertIds.length === 0) {
          this.clearWarningSelection()
          this.$message.warning('当前筛选结果已无可选择的预警')
          return
        }

        this.selectedWarnings = alertIds.map(String)
        this.selectedWarningExpectedStatuses = expectedStatuses
        this.selectAllFiltered = true
        this.$message.success(`已冻结并选中 ${alertIds.length} 项预警`)
      } catch (error) {
        if (requestId !== this.selectionSnapshotRequestId) return
        const detail = error.response && error.response.data && error.response.data.detail
        this.$message.error(
          typeof detail === 'string' ? detail : (error.message || '创建选择快照失败')
        )
      } finally {
        if (requestId === this.selectionSnapshotRequestId) {
          this.selectionSnapshotLoading = false
        }
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

        const selectionSnapshot = this.getSelectedAlertSnapshot()
        if (!selectionSnapshot.alertIds.length) {
          this.$message.error('未解析到有效的预警ID，请重新选择')
          return
        }
        if (selectionSnapshot.missingExpectedStatusIds.length) {
          this.$message.error('部分预警缺少状态快照，请重新选择后重试')
          return
        }

        const requestedCount = selectionSnapshot.alertIds.length
        updateData.expected_statuses = selectionSnapshot.expectedStatuses
        const response = await alertAPI.batchUpdateAlertStatus(
          selectionSnapshot.alertIds,
          updateData
        )
        
        if (response.data && response.data.code === 0) {
          const resultData = response.data.data || {}
          const successCount = resultData.success_count != null
            ? resultData.success_count
            : requestedCount
          this.$message.success(`已为 ${successCount} 项预警添加处理记录`)
          this.clearWarningSelection()
          this.closeBatchProcessDialog()
          await this.getWarningList()
        } else {
          const resultData = (response.data && response.data.data) || {}
          this.$message.warning(
            `批量处理完成：成功 ${resultData.success_count || 0} 项，失败 ${resultData.failure_count || 0} 项`
          )
          this.clearWarningSelection()
          this.closeBatchProcessDialog()
          await this.getWarningList()
        }
      } catch (error) {
        console.error('批量处理失败:', error)
        if (error.response && error.response.status === 409) {
          const detail = error.response.data && error.response.data.detail
          const resultData = detail && detail.data
          const successCount = resultData ? resultData.success_count : 0
          const conflictCount = resultData ? resultData.conflict_count : 0
          this.$message.warning(
            `${error.message}（${successCount} 项成功，${conflictCount} 项冲突）`
          )
          // 批量接口允许部分成功，冲突后必须刷新以同步已提交的项目。
          await this.getWarningList()
          this.clearWarningSelection()
          this.closeBatchProcessDialog()
        } else {
          this.$message.error('批量处理失败：' + (error.message || '网络错误'))
        }
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
      if (this.selectedWarnings.length === 0) {
        this.$message.warning(this.canSelectAll
          ? '请先选择本页或全选后再导出'
          : '请先选择本页预警后再导出')
        return
      }
      this.exportImageType = 'annotated'
      this.exportDialogVisible = true
    },
    
    // 获取导出选择文本
    getExportSelectionText() {
      if (this.selectAllFiltered) {
        return `将导出全选时冻结的 ${this.selectedWarnings.length} 条预警图片`
      }
      const count = this.selectedWarnings.length
      if (count > 0) {
        return `您已选择 ${count} 条预警，将打包导出图片`
      }
      return '请先选择要导出的预警'
    },

    // 检查是否有激活的筛选条件
    hasActiveFilters() {
      return !!(
        this.searchForm.warningType ||
        this.searchForm.warningLevel ||
        this.searchForm.warningSkill ||
        this.searchForm.warningName ||
        this.searchForm.warningId ||
        this.searchForm.status ||
        this.searchForm.cameraId ||
        this.searchForm.startDate ||
        this.searchForm.endDate
      );
    },

    selectedAlertIds() {
      return this.selectedWarnings.map(id => {
        const warning = this.warningList.find(item => item.id === id)
        return warning && warning._apiData ? warning._apiData.alert_id : parseInt(id, 10)
      }).filter(id => !isNaN(id))
    },

    getSelectedAlertSnapshot() {
      const alertIds = this.selectedAlertIds()
      const expectedStatuses = {}
      const missingExpectedStatusIds = []
      alertIds.forEach(alertId => {
        const expectedStatus = this.selectedWarningExpectedStatuses[String(alertId)]
        if (expectedStatus == null) {
          missingExpectedStatusIds.push(alertId)
        } else {
          expectedStatuses[String(alertId)] = expectedStatus
        }
      })
      return { alertIds, expectedStatuses, missingExpectedStatusIds }
    },

    buildCurrentFilterBody() {
      const body = {}
      const skillClassId = this.parseSelectedSkillClassId()
      if (skillClassId != null) {
        body.skill_class_id = skillClassId
      } else if (this.searchForm.warningSkill) {
        body.alert_type = this.searchForm.warningSkill
      }
      if (this.searchForm.warningLevel) {
        body.alert_level = ALERT_LEVEL_CODE_BY_KEY[this.searchForm.warningLevel]
      }
      if (this.searchForm.warningName) body.alert_name = this.searchForm.warningName
      if (this.searchForm.warningId) body.alert_id = parseInt(this.searchForm.warningId, 10)
      if (this.searchForm.cameraId) body.camera_id = this.searchForm.cameraId
      if (this.searchForm.status) {
        body.status = ALERT_STATUS_NAME_BY_KEY[this.searchForm.status] || this.searchForm.status
      }
      if (this.searchForm.startDate) body.start_date = this.searchForm.startDate
      if (this.searchForm.endDate) body.end_date = this.searchForm.endDate
      if (this.searchForm.warningType) body.alert_type = this.searchForm.warningType
      return body
    },

    buildAlertImageExportBody() {
      return {
        image_type: this.exportImageType,
        alert_ids: this.selectedAlertIds()
      }
    },

    stopDownloadPoll() {
      if (this.downloadPollTimer) {
        clearInterval(this.downloadPollTimer)
        this.downloadPollTimer = null
      }
    },

    onDownloadProgressClosed() {
      this.stopDownloadPoll()
      this.zipDownloading = false
      this.downloadJobId = null
    },

    applyDownloadJobProgress(job) {
      if (!job) return
      const total = job.total || 0
      const packed = job.packed || 0
      const failed = job.failed || 0
      this.downloadProgressPercent = Math.min(100, Number(job.percent) || 0)
      this.downloadProgressTitle = job.message || '打包中…'
      this.downloadProgressMeta = total
        ? `已处理 ${packed + failed} / ${total}（成功 ${packed}${failed ? `，失败 ${failed}` : ''}）`
        : ''
    },

    async pollDownloadJob() {
      if (!this.downloadJobId) return
      try {
        const res = await alertAPI.getAlertImageDownloadJob(this.downloadJobId)
        const job = (res.data && res.data.data) || {}
        this.applyDownloadJobProgress(job)
        if (job.status === 'done') {
          this.stopDownloadPoll()
          await this.fetchDownloadJobFile(job)
        } else if (job.status === 'error') {
          this.stopDownloadPoll()
          this.downloadProgressPhase = 'error'
          this.downloadProgressStatus = 'exception'
          this.downloadProgressTitle = '打包失败'
          this.downloadProgressError = job.error || job.message || '打包失败'
          this.zipDownloading = false
        }
      } catch (e) {
        this.stopDownloadPoll()
        this.downloadProgressPhase = 'error'
        this.downloadProgressStatus = 'exception'
        this.downloadProgressTitle = '查询进度失败'
        this.downloadProgressError = (e.response && e.response.data && e.response.data.detail) || e.message || '未知错误'
        this.zipDownloading = false
      }
    },

    async fetchDownloadJobFile(job) {
      this.downloadProgressPhase = 'transferring'
      this.downloadProgressStatus = undefined
      this.downloadProgressPercent = 0
      this.downloadProgressTitle = '打包完成，正在传输到本地…'
      const sizeHint = job && job.file_size_mb != null ? `约 ${job.file_size_mb} MB` : ''
      this.downloadProgressMeta = sizeHint
      try {
        const res = await alertAPI.downloadAlertImageDownloadJobFile(
          this.downloadJobId,
          (evt) => {
            if (!evt || !evt.total) return
            const pct = Math.min(99, Math.round((evt.loaded * 100) / evt.total))
            this.downloadProgressPercent = pct
            const loadedMb = (evt.loaded / (1024 * 1024)).toFixed(1)
            const totalMb = (evt.total / (1024 * 1024)).toFixed(1)
            this.downloadProgressMeta = `已传输 ${loadedMb} / ${totalMb} MB`
          }
        )
        const blob = res && res.data
        if (!blob || !(blob instanceof Blob) || !blob.size) {
          throw new Error('下载内容为空')
        }
        if (blob.type && blob.type.includes('application/json')) {
          const text = await blob.text()
          let detail = text
          try {
            const j = JSON.parse(text)
            detail = j.detail || j.message || text
          } catch (_) { /* ignore */ }
          throw new Error(detail || '下载失败')
        }
        const typeLabel = this.exportImageType === 'raw' ? '原图' : '标注图'
        const filename = (job && job.filename) || `预警${typeLabel}_${Date.now()}.zip`
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        this.downloadProgressPhase = 'done'
        this.downloadProgressPercent = 100
        this.downloadProgressStatus = 'success'
        this.downloadProgressTitle = '下载完成'
        const packed = (job && job.packed) || 0
        const failed = (job && job.failed) || 0
        this.downloadProgressMeta = failed
          ? `成功 ${packed} 张，失败 ${failed} 张`
          : `成功导出 ${packed} 张${typeLabel}`
        if (failed) this.$message.warning(this.downloadProgressMeta)
        else this.$message.success(this.downloadProgressMeta)
      } catch (e) {
        let msg = e.message || '下载失败'
        const data = e.response && e.response.data
        if (data instanceof Blob) {
          try {
            const text = await data.text()
            const j = JSON.parse(text)
            msg = j.detail || j.message || msg
          } catch (_) { /* ignore */ }
        } else if (e.response && e.response.data && e.response.data.detail) {
          msg = e.response.data.detail
        }
        this.downloadProgressPhase = 'error'
        this.downloadProgressStatus = 'exception'
        this.downloadProgressTitle = '传输失败'
        this.downloadProgressError = msg
      } finally {
        this.zipDownloading = false
      }
    },
    
    // 确认导出图片压缩包
    async confirmExport() {
      if (this.selectedWarnings.length === 0) {
        this.$message.warning('请先选择要导出的预警')
        return
      }
      if (this.zipDownloading) return

      const typeLabel = this.exportImageType === 'raw' ? '原图' : '标注图'
      const count = this.exportSelectedCount
      try {
        this.exportLoading = true
        const body = this.buildAlertImageExportBody()
        if (!body.alert_ids || body.alert_ids.length === 0) {
          throw new Error('未解析到有效的预警ID')
        }

        this.exportDialogVisible = false
        this.zipDownloading = true
        this.downloadProgressVisible = true
        this.downloadProgressPhase = 'packing'
        this.downloadProgressPercent = 0
        this.downloadProgressStatus = undefined
        this.downloadProgressTitle = '正在创建打包任务…'
        this.downloadProgressMeta = `共 ${count} 条，导出${typeLabel}`
        this.downloadProgressError = ''
        this.downloadJobId = null
        this.stopDownloadPoll()

        const res = await alertAPI.createAlertImageDownloadJob(body)
        const job = (res.data && res.data.data) || {}
        if (!job.job_id) throw new Error('未返回任务 ID')
        this.downloadJobId = job.job_id
        this.applyDownloadJobProgress(job)
        this.downloadPollTimer = setInterval(() => this.pollDownloadJob(), 800)
        await this.pollDownloadJob()
      } catch (error) {
        console.error('❌ 导出失败:', error)
        const errorMsg = (error.response && error.response.data && error.response.data.detail)
          || error.message
          || '导出失败，请稍后重试'
        if (this.downloadProgressVisible) {
          this.downloadProgressPhase = 'error'
          this.downloadProgressStatus = 'exception'
          this.downloadProgressTitle = '创建打包任务失败'
          this.downloadProgressError = errorMsg
        } else {
          this.$message.error(`导出失败: ${errorMsg}`)
        }
        this.zipDownloading = false
      } finally {
        this.exportLoading = false
      }
    },
    
    // 选择预警项
    toggleSelect(id) {
      if (this.selectAllFiltered) {
        // 退出全选，改为仅勾选本页其余项
        this.selectAllFiltered = false
        this.selectedWarnings = this.warningList
          .map(item => item.id)
          .filter(itemId => itemId !== id)
        this.selectedWarningExpectedStatuses = {}
        this.warningList
          .filter(item => item.id !== id)
          .forEach(item => this.rememberWarningExpectedStatus(item))
        return
      }
      // 未筛选技能时不允许跨页累积勾选：只在本页内切换
      if (!this.canSelectAll) {
        const currentPageIds = this.warningList.map(item => item.id)
        if (!currentPageIds.includes(id)) return
        const index = this.selectedWarnings.indexOf(id)
        if (index === -1) {
          const pageSelected = this.selectedWarnings.filter(sid => currentPageIds.includes(sid))
          this.selectedWarnings = [...pageSelected, id]
          this.rememberWarningExpectedStatus(this.warningList.find(item => item.id === id))
        } else {
          this.selectedWarnings = this.selectedWarnings.filter(sid => sid !== id && currentPageIds.includes(sid))
          this.forgetWarningExpectedStatus(id)
        }
        return
      }
      const index = this.selectedWarnings.indexOf(id)
      if (index === -1) {
        this.selectedWarnings.push(id)
        this.rememberWarningExpectedStatus(this.warningList.find(item => item.id === id))
      } else {
        this.selectedWarnings.splice(index, 1)
        this.forgetWarningExpectedStatus(id)
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
        
        // 确保ID类型一致（都转为字符串比较）
        const warning = this.warningList.find(item => String(item.id) === String(warningId))
        if (!warning) {
          console.error('❌ 未找到预警信息，warningId:', warningId, 'warningList:', this.warningList.map(w => w.id))
          this.$message.error('未找到预警信息，请刷新页面后重试')
          return
        }
        

        // 准备API更新数据
        const apiAlertId = warning._apiData ? warning._apiData.alert_id : parseInt(warningId)
        const expectedStatus = warning._apiData
          ? Number(warning._apiData.status)
          : ({ pending: 1, processing: 2, completed: 3, archived: 4, false_alarm: 5 })[warning.status]
        if (!expectedStatus) {
          this.$message.error('无法确定预警当前状态，请刷新页面后重试')
          return
        }
        const updateData = {
          status: 2, // 处理中状态
          expected_status: expectedStatus,
          processing_notes: this.remarkForm.remark,
          processed_by: this.getCurrentUserName()
        }


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
              time: getCurrentAlertTime(),
              description: `处理意见：${this.remarkForm.remark}`,
              operationType: 'processing-action',
              operator: this.getCurrentUserName()
            }
            
            this.warningList[index].operationHistory.push(newRecord)
            
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

    async confirmReopen() {
      const reason = this.reopenForm.reason.trim()
      if (!reason) {
        this.$message.warning('请输入重新处理原因')
        return
      }

      const warning = this.warningList.find(item => String(item.id) === String(this.reopenWarningId))
      if (!warning || !warning._apiData || warning._apiData.status !== 3) {
        this.$message.error('仅已处理状态的预警可以重新处理，请刷新页面后重试')
        return
      }

      try {
        this.loading = true
        const response = await alertAPI.reopenAlert(
          warning._apiData.alert_id,
          reason,
          Number(warning._apiData.status)
        )
        if (!response.data || response.data.code !== 0) {
          throw new Error((response.data && response.data.msg) || '重新处理失败')
        }

        const result = response.data.data || {}
        const processingRecord = result.processing_record || {}
        const updatedAlert = result.updated_alert || {}
        const operatorName = processingRecord.operator || updatedAlert.processed_by || '未知操作人'
        const reopenedAt = processingRecord.reopened_at || processingRecord.created_at

        this.$set(warning, 'status', 'processing')
        this.$set(warning._apiData, 'status', 2)
        this.$set(warning._apiData, 'processing_notes', reason)
        this.$set(warning._apiData, 'processed_by', operatorName)
        if (!warning.operationHistory) {
          this.$set(warning, 'operationHistory', [])
        }
        warning.operationHistory.push({
          id: processingRecord.record_id || (Date.now() + Math.random()),
          status: 'active',
          statusText: '重新处理',
          time: reopenedAt ? formatAlertDateTime(reopenedAt) : getCurrentAlertTime(),
          description: reason,
          operationType: 'processing',
          operator: operatorName
        })

        this.$message.success('预警已重新打开，状态已更新为处理中')
        this.closeReopenDialog()
        await this.getWarningList()
      } catch (error) {
        const serverMessage = error.response && error.response.data && error.response.data.detail
        this.$message.error('重新处理失败：' + (serverMessage || error.message || '网络错误'))
      } finally {
        this.loading = false
      }
    },

    closeReopenDialog() {
      this.reopenDialogVisible = false
      this.reopenWarningId = ''
      this.reopenForm.reason = ''
    },
    
    // 确认上报
    async confirmReport() {
      try {
        const warning = this.warningList.find(item => item.id === this.reportWarningId);
        if (!warning) {
          throw new Error('未找到待上报的预警')
        }
        this.loading = true
        const apiAlertId = warning._apiData ? warning._apiData.alert_id : parseInt(this.reportWarningId);
        const response = await alertAPI.reportAlert(apiAlertId, {
          report_notes: this.reportForm.notes
        });
        if (!response.data || response.data.code !== 0) {
          throw new Error((response.data && response.data.msg) || '上报失败')
        }

        const reportRecord = response.data.data && response.data.data.processing_record
        
        // 获取当前预警
        const index = this.warningList.findIndex(item => item.id === this.reportWarningId)
        if (index !== -1) {
          // 添加上报记录到操作历史
          if (!this.warningList[index].operationHistory) {
            this.$set(this.warningList[index], 'operationHistory', [])
          }
          
          const newRecord = {
            id: (reportRecord && reportRecord.record_id) || (Date.now() + Math.random()),
            status: 'completed',
            statusText: '预警上报',
            time: reportRecord && reportRecord.reported_at
              ? formatAlertDateTime(reportRecord.reported_at)
              : getCurrentAlertTime(),
            description: this.reportForm.notes
              ? `预警已上报：${this.reportForm.notes}`
              : '预警已上报',
            operationType: 'report',
            operator: (reportRecord && reportRecord.operator) || this.getCurrentUserName()
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
        const serverMessage = error.response && error.response.data &&
          (error.response.data.detail || error.response.data.message)
        this.$message.error('上报失败：' + (serverMessage || error.message || '网络错误'))
      } finally {
        this.loading = false
      }
    },
    
    // 关闭上报对话框
    closeReportDialog() {
      this.reportDialogVisible = false
      this.reportWarningId = ''
      this.reportForm.notes = ''
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
      
      if (['record-added', 'finished', 'reopened'].includes(eventData.action)) {
        await this.getWarningList()
      }
    },
    
    async handleReportFromDetail(eventData) {
      if (eventData && eventData.alert_id && eventData.action === 'reported') {
        await this.getWarningList()
      }
    },
    
    async handleArchiveFromDetail(eventData) {
      if (eventData && eventData.alert_id) {
        // 详情组件已经完成原子归档，这里只关闭详情并刷新列表。
        this.warningDetailVisible = false
        await this.getWarningList()
      }
    },
    
    handleFalseAlarmFromDetail(eventData) {
      if (eventData && eventData.alert_id) {
        if (eventData.completed) {
          this.getWarningList()
          return
        }
        this.handleWarning(eventData.alert_id, 'false_alarm')
      }
    },
    
    // 获取预警等级标签文本
    getLevelBadgeText(level) {
      return getAlertLevelShortName(level)
    },
    
    // 处理误报事件
    async handleFalseAlarmArchive() {
      try {
        // 获取当前预警信息
        const warningIndex = this.warningList.findIndex(item => item.id === this.archiveWarningId)
        if (warningIndex === -1) {
          this.$message.error('未找到预警信息')
          return
        }
        
        const warningInfo = this.warningList[warningIndex]
        const currentStatus = warningInfo._apiData ? warningInfo._apiData.status : null
        
        // 检查预警状态：待处理、处理中均可标记误报（与后端 _can_mark_false_alarm 一致）
        if (warningInfo._apiData && !this.canMarkFalseAlarm(warningInfo._apiData.status)) {
          const currentStatusName = getAlertStatusName(warningInfo._apiData.status)
          this.$message.warning(`只有待处理或处理中状态的预警才能标记为误报，当前状态为：${currentStatusName}`)
          this.falseAlarmDialogVisible = false
          this.falseAlarmForm.reviewNotes = ''
          return
        }
        
        const reviewNotes = this.falseAlarmForm.reviewNotes.trim() || '标记为误报'
        
        // 调用后端API标记误报
        const { alertAPI } = await import('../../service/VisionAIService.js')
        const response = await alertAPI.markAlertAsFalseAlarm(
          warningInfo._apiData ? warningInfo._apiData.alert_id : parseInt(this.archiveWarningId),
          currentStatus,
          reviewNotes
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
            time: getCurrentAlertTime(),
            description: `预警被标记为误报：${reviewNotes}`,
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
        if (error.response && error.response.status === 409) {
          const detail = error.response.data && error.response.data.detail
          this.$message.warning((detail && detail.message) || '预警状态已更新，请刷新后重试')
          await this.getWarningList()
          this.falseAlarmDialogVisible = false
          this.falseAlarmForm.reviewNotes = ''
          this.archiveWarningId = ''
        } else {
          this.$message.error('标记误报失败: ' + (error.message || '未知错误'))
        }
      } finally {
        this.loading = false
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
    
    // 从预警列表处理预警 - 点击处理仅打开意见对话框，确认后才变更状态
    handleWarningFromList(warning) {

      if (warning && warning.id) {
        this.currentProcessingWarningId = warning.id;
        this.remarkDialogVisible = true;
      } else {
        console.error('❌ 无效的预警数据:', warning);
        this.$message.error('预警数据无效，无法处理');
      }
    },

    // 结束处理 - 与预警详情对话框保持一致
    async finishProcessing() {
      try {
        this.loading = true
        
        // 获取当前预警信息（使用currentProcessingWarningId或currentWarningId）
        const warningId = this.currentProcessingWarningId || this.currentWarningId
        
        // 确保ID类型一致（都转为字符串比较）
        const warning = this.warningList.find(item => String(item.id) === String(warningId))
        if (!warning) {
          console.error('❌ finishProcessing - 未找到预警信息，warningId:', warningId)
          this.$message.error('未找到预警信息，请刷新页面后重试')
          return
        }
        

        // 准备API更新数据
        const apiAlertId = warning._apiData ? warning._apiData.alert_id : parseInt(warningId)
        const expectedStatus = warning._apiData
          ? Number(warning._apiData.status)
          : ({ pending: 1, processing: 2, completed: 3, archived: 4, false_alarm: 5 })[warning.status]
        if (!expectedStatus) {
          this.$message.error('无法确定预警当前状态，请刷新页面后重试')
          return
        }
        const updateData = {
          status: 3, // 已处理状态
          expected_status: expectedStatus,
          processing_notes: this.remarkForm.remark.trim() || null,
          processed_by: this.getCurrentUserName()
        }


        // 调用API更新预警状态
        const response = await alertAPI.updateAlertStatus(apiAlertId, updateData)
        
        if (response.data && response.data.code === 0) {
          const result = response.data.data || {}
          const updatedAlert = result.updated_alert || {}
          const processingRecord = result.processing_record || {}
          const processingNotes = updatedAlert.processing_notes != null
            ? updatedAlert.processing_notes
            : updateData.processing_notes
          const operatorName = processingRecord.operator || updatedAlert.processed_by || '未知操作人'

          // API调用成功，更新本地数据状态
          const index = this.warningList.findIndex(item => String(item.id) === String(warningId))
          if (index !== -1) {
            // 🔧 关键修复：更新 _apiData.status 字段为已处理
            if (this.warningList[index]._apiData) {
              this.$set(this.warningList[index]._apiData, 'status', 3)
              this.$set(this.warningList[index]._apiData, 'processing_notes', processingNotes)
              this.$set(this.warningList[index]._apiData, 'processed_by', operatorName)
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
              time: processingRecord.created_at ? formatAlertDateTime(processingRecord.created_at) : getCurrentAlertTime(),
              description: processingNotes || '未填写处理意见',
              operationType: 'completed',
              operator: operatorName
            }
            
            this.warningList[index].operationHistory.push(newRecord)
            
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
      if (!warning) {
        return true
      }

      // 当前后端状态是处理按钮的权威依据，历史上的“已处理”记录不能覆盖重新处理后的状态。
      if (warning._apiData && typeof warning._apiData.status !== 'undefined') {
        return [3, 4, 5].includes(Number(warning._apiData.status))
      }

      // 向后兼容没有原始API数据的列表项。
      if (warning.status) {
        return ['completed', 'archived', 'false_alarm'].includes(warning.status)
      }

      const operationHistory = Array.isArray(warning.operationHistory)
        ? warning.operationHistory
        : []
      const latestStatusRecord = [...operationHistory].reverse().find(record =>
        ['pending', 'processing', 'completed', 'archive', 'false_alarm'].includes(record.operationType)
      )

      if (!latestStatusRecord) {
        return false
      }

      return ['completed', 'archive', 'false_alarm'].includes(latestStatusRecord.operationType)
    },

    isResolvedWarning(warning) {
      return Boolean(
        warning && (
          (warning._apiData && warning._apiData.status === 3) ||
          warning.status === 'completed'
        )
      )
    },

    // 归档按钮：已归档/误报禁用；未处理完仍可点，由 handleArchiveProcess 弹出提示
    isArchiveDisabled(warning) {
      if (warning._apiData && typeof warning._apiData.status !== 'undefined') {
        const status = Number(warning._apiData.status)
        // 1待处理 2处理中 3已处理 4已归档 5误报
        return status === 4 || status === 5
      }
      if (warning.status === 'archived' || warning.status === 'false_alarm') {
        return true
      }
      if (warning.operationHistory && warning.operationHistory.some(record =>
        record.operationType === 'archive' || record.operationType === 'false_alarm'
      )) {
        return true
      }
      return false
    },

    getArchiveDisabledTip(warning) {
      if (!warning) return '当前预警不能归档'
      const status = warning._apiData ? Number(warning._apiData.status) : null
      if (status === 4 || warning.status === 'archived') return '该预警已归档'
      if (status === 5 || warning.status === 'false_alarm') return '误报预警不能归档'
      return '当前预警不能归档'
    },
    
    // 与后端 _can_mark_false_alarm 一致：待处理(1)、处理中(2) 可标记误报
    canMarkFalseAlarm(status) {
      const s = Number(status)
      return s === 1 || s === 2
    },

    // 检查误报按钮是否应该禁用
    isFalseAlarmDisabled(warning) {
      if (warning._apiData && warning._apiData.status !== undefined) {
        return !this.canMarkFalseAlarm(warning._apiData.status)
      }
      if (warning.status) {
        return warning.status !== 'pending' && warning.status !== 'processing'
      }
      return true
    },

    // 获取当前预警状态
    getCurrentWarningStatus(warning) {
      
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

      const selectionSnapshot = this.getSelectedAlertSnapshot()
      if (!selectionSnapshot.alertIds.length) {
        this.$message.warning('未解析到有效的预警ID')
        return
      }
      if (selectionSnapshot.missingExpectedStatusIds.length) {
        this.$message.error('部分预警缺少状态快照，请重新选择后重试')
        return
      }
      const body = {
        alert_ids: selectionSnapshot.alertIds,
        expected_statuses: selectionSnapshot.expectedStatuses
      }

      try {
        this.deleteLoading = true

        const response = await alertAPI.batchDeleteAlerts(body)

        if (response.data && response.data.code === 0) {
          const responseData = response.data.data || {}
          const deleted = responseData.deleted_count != null
            ? responseData.deleted_count
            : selectionSnapshot.alertIds.length
          this.$message.success(`已成功删除 ${deleted} 项预警`)
          this.clearWarningSelection()
          this.closeDeleteDialog()
          this.currentPage = 1
          await this.getWarningList()
          this.loadFilterOptions()
        } else {
          console.error('删除预警API失败:', response.data)
          this.$message.error('删除失败：' + (response.data && response.data.msg || '服务器错误'))
        }
      } catch (error) {
        console.error('删除失败:', error)
        const detail = error.response && error.response.data && error.response.data.detail
        if (error.response && error.response.status === 409 &&
            detail && detail.code === 'SELECTION_SNAPSHOT_STALE') {
          this.$message.warning(detail.message)
          this.clearWarningSelection()
          this.closeDeleteDialog()
          await this.getWarningList()
        } else {
          const detailMessage = typeof detail === 'string'
            ? detail
            : (detail && detail.message)
          this.$message.error('删除失败：' + (detailMessage || error.message || '网络错误'))
        }
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
      // 未筛选技能仅本页可选，翻页清空；筛选技能后保留全选/已选
      this.getWarningList({ clearSelection: !this.canSelectAll })
    },
    
    handleCurrentChange(val) {
      this.currentPage = val
      this.getWarningList({ clearSelection: !this.canSelectAll })
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
              filterable
              @visible-change="onTypeSelectVisible"
              @change="handleSearch"
            >
              <el-option 
                v-for="t in warningTypeOptions"
                :key="t.value"
                :label="t.label" 
                :value="t.value" 
              />
            </el-select>
          </div>
          
          <div class="select-wrapper">
            <el-select 
              v-model="searchForm.warningSkill" 
              placeholder="预警技能" 
              size="small"
              clearable
              filterable
              @visible-change="onSkillSelectVisible"
              @change="handleSkillChange"
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
          
          <div class="select-wrapper">
            <el-select
              v-model="searchForm.cameraId"
              placeholder="点位"
              size="small"
              clearable
              filterable
              @visible-change="onCameraSelectVisible"
              @change="handleSearch"
            >
              <el-option
                v-for="cam in cameraOptions"
                :key="cam.value"
                :label="cam.label"
                :value="cam.value"
              />
            </el-select>
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
              :disabled="selectionSnapshotLoading"
              @click="handleSelectPage"
            >选择本页</el-button>
            <el-button
              v-if="canSelectAll"
              size="small"
              type="primary"
              plain
              :loading="selectionSnapshotLoading"
              :disabled="loading"
              @click="handleSelectAll"
            >{{ selectAllFiltered ? '取消全选' : '全选' }}</el-button>
            <span v-if="exportSelectedCount > 0" class="selection-count-tip">
              已选 {{ exportSelectedCount }} 项
            </span>
            <el-button 
              size="small" 
              :disabled="exportSelectedCount === 0"
              @click="handleBatchProcess"
            >批量处理</el-button>
            <el-button 
              size="small" 
              icon="el-icon-delete"
              :disabled="exportSelectedCount === 0"
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
              :class="{ 'selected': isWarningSelected(item.id) }"
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
                v-show="cardHoverStates[item.id] || isWarningSelected(item.id)" 
                class="select-checkbox" 
                @click.stop
              >
                <el-checkbox 
                  :value="isWarningSelected(item.id)"
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
                    >
                      上报
                    </el-button>
                    
                    <el-tooltip
                      :disabled="!isArchiveDisabled(item)"
                      :content="getArchiveDisabledTip(item)"
                      placement="top">
                      <span class="archive-btn-wrap" @click.stop>
                        <el-button
                          size="mini"
                          class="action-btn archive-btn"
                          @click.stop="handleWarning(item.id, 'archive')"
                          :disabled="isArchiveDisabled(item)"
                        >
                          归档
                        </el-button>
                      </span>
                    </el-tooltip>
                    
                    <el-tooltip
                      :disabled="!isFalseAlarmDisabled(item)"
                      content="已处理、已归档或已标记误报的预警不能再点误报"
                      placement="top">
                      <span class="false-alarm-btn-wrap" @click.stop>
                        <el-button
                          size="mini"
                          class="action-btn false-alarm-btn"
                          @click.stop="handleWarning(item.id, 'false_alarm')"
                          :disabled="isFalseAlarmDisabled(item)"
                        >
                          误报
                        </el-button>
                      </span>
                    </el-tooltip>
                    
                    <el-button
                      v-if="isResolvedWarning(item)"
                      size="mini"
                      type="warning"
                      plain
                      class="action-btn reopen-btn"
                      @click.stop="handleWarning(item.id, 'reopen')"
                    >
                      重新处理
                    </el-button>

                    <el-button
                      v-else
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
    
    <!-- 导出图片对话框 -->
    <el-dialog
      title="导出预警图片"
      :visible.sync="exportDialogVisible"
      width="420px"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="export-dialog-content">
        <div class="export-info-section">
          <div class="export-data-info">
            <i class="el-icon-download" style="color: #409EFF; font-size: 20px; margin-right: 8px;"></i>
            <span style="font-size: 16px; font-weight: 500;">打包下载为 ZIP</span>
          </div>
          <p class="export-selection-info">
            {{ getExportSelectionText() }}
          </p>
        </div>
        
        <div class="export-format-section">
          <el-form label-width="90px">
            <el-form-item label="导出图片:">
              <el-radio-group v-model="exportImageType">
                <el-radio label="annotated">
                  标注图
                  <span class="format-desc">（带检测框）</span>
                </el-radio>
                <el-radio label="raw">
                  原图
                  <span class="format-desc">（未标注画面）</span>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>
        
        <div class="export-filter-info">
          <div class="filter-info-title">
            <i class="el-icon-info" style="color: #909399; margin-right: 4px;"></i>
            <span>提示：打包过程中可查看进度，完成后自动下载压缩包</span>
          </div>
          <div class="filter-summary" v-if="searchForm.warningSkill || hasActiveFilters()">
            <el-tag
              v-if="searchForm.warningSkill"
              size="mini"
              type="info"
              style="margin: 2px;"
            >技能: {{ (warningSkillOptions.find(s => s.value === searchForm.warningSkill) || {}).label || searchForm.warningSkill }}</el-tag>
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
              v-if="searchForm.cameraId"
              size="mini"
              type="success"
              style="margin: 2px;"
            >点位: {{ (cameraOptions.find(c => c.value === searchForm.cameraId) || {}).cameraName || searchForm.cameraId }}</el-tag>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="exportDialogVisible = false" :disabled="exportLoading">取 消</el-button>
        <el-button type="primary" @click="confirmExport" :loading="exportLoading">
          <i class="el-icon-download"></i>
          开始打包
        </el-button>
      </span>
    </el-dialog>

    <!-- 预警图片打包下载进度 -->
    <el-dialog
      title="导出预警图片"
      :visible.sync="downloadProgressVisible"
      width="480px"
      :close-on-click-modal="false"
      :close-on-press-escape="downloadProgressPhase === 'done' || downloadProgressPhase === 'error'"
      :show-close="downloadProgressPhase === 'done' || downloadProgressPhase === 'error'"
      append-to-body
      @closed="onDownloadProgressClosed">
      <div class="dl-progress-body">
        <div class="dl-progress-phase">{{ downloadProgressTitle }}</div>
        <el-progress
          :percentage="downloadProgressPercent"
          :status="downloadProgressStatus"
          :stroke-width="16"
          text-inside>
        </el-progress>
        <div class="dl-progress-meta">{{ downloadProgressMeta }}</div>
        <div v-if="downloadProgressError" class="dl-progress-error">{{ downloadProgressError }}</div>
      </div>
      <div slot="footer">
        <el-button
          v-if="downloadProgressPhase === 'done' || downloadProgressPhase === 'error'"
          size="small"
          type="primary"
          @click="downloadProgressVisible = false">
          关闭
        </el-button>
        <span v-else class="dl-progress-tip">打包/传输过程中请勿关闭页面</span>
      </div>
    </el-dialog>
    
    <!-- 添加备注对话框 -->
    <el-dialog
      title="处理预警"
      :visible.sync="remarkDialogVisible"
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
        <i class="el-icon-info" style="color: #909399; margin-right: 4px;"></i>
        <span style="color: #909399; font-size: 13px;">填写处理意见后，可点击"确认处理"添加处理记录，或点击"结束处理"完成整个处理流程</span>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="saveRemark">确认处理</el-button>
        <el-button type="success" @click="finishProcessing">结束处理</el-button>
      </span>
    </el-dialog>

    <!-- 重新处理对话框 -->
    <el-dialog
      title="重新处理预警"
      :visible.sync="reopenDialogVisible"
      width="30%"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="closeReopenDialog"
    >
      <el-form :model="reopenForm" label-width="110px">
        <el-form-item label="重新处理原因" required>
          <el-input
            v-model="reopenForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入重新打开该预警的原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <div class="process-tip">
        <i class="el-icon-info" style="color: #909399; margin-right: 4px;"></i>
        <span style="color: #909399; font-size: 13px;">确认后状态将由“已处理”变为“处理中”，系统会保留完成时间并记录重新打开时间</span>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeReopenDialog">取 消</el-button>
        <el-button type="warning" :loading="loading" @click="confirmReopen">确认重新处理</el-button>
      </span>
    </el-dialog>
    
    <!-- 上报确认对话框 -->
    <el-dialog
      title="上报确认"
      :visible.sync="reportDialogVisible"
      width="400px"
      center
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="confirm-content">
        <p>确定要上报此预警吗？</p>
        <p style="color: #909399; font-size: 12px;">状态保持不变，并记录一条可审计的上报记录</p>
        <el-form :model="reportForm" label-width="84px" style="margin-top: 16px; text-align: left;">
          <el-form-item label="上报说明">
            <el-input
              v-model="reportForm.notes"
              type="textarea"
              :rows="3"
              maxlength="2000"
              show-word-limit
              placeholder="请输入上报说明（可选）"
            />
          </el-form-item>
        </el-form>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeReportDialog">取 消</el-button>
        <el-button type="warning" :loading="loading" @click="confirmReport">确定上报</el-button>
      </span>
    </el-dialog>
    
    <!-- 归档确认对话框 -->
    <el-dialog
      title="归档预警"
      :visible.sync="archiveDialogVisible"
      width="40%"
      center
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
        <el-button type="danger" @click="confirmArchive" :loading="loading" :disabled="!selectedArchiveId">确认归档</el-button>
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
        <span style="font-size: 16px; font-weight: 500;">您将要批量处理 {{ exportSelectedCount }} 项预警</span>
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
            placeholder="请输入复判意见，说明为什么判定为误报（可选）"
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
        <el-button type="warning" @click="handleFalseAlarmArchive">确认误报</el-button>
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
          <p class="delete-title">{{ selectAllFiltered ? '确定要删除当前筛选结果中的全部预警吗？' : '确定要删除选中的预警吗？' }}</p>
          <p class="delete-desc">您已选择 <strong>{{ exportSelectedCount }}</strong> 项预警，删除后将无法恢复</p>
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

<style scoped src="./styles/warningManagement.scoped.css"></style>

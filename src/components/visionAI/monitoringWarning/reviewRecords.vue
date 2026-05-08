<script>
import WarningDetail from './warningDetail.vue'
import { reviewRecordAPI, skillAPI } from '../../service/VisionAIService.js'

const SKILL_SOURCE_VISION = 'vision'
const SKILL_SOURCE_LLM = 'llm'

export default {
  name: "ReviewRecords",
  components: {
    WarningDetail
  },
  // 添加路由元信息，便于路由识别
  meta: {
    title: '智能复判记录',
    requiresAuth: true
  },
  data() {
    return {
      // 看板：多模态/复判总数；预警处置覆盖（已处理∪归档∪误报∪有复判记录）/总预警；TOP3 按预警技能复判次数
      statistics: {
        reviewed: 0,
        total: 0,
        percentage: 0,
        closureCount: 0,
        closureTotal: 0,
        closurePct: 0,
        /** 已复判预警数 / 系统预警总数（复判覆盖率） */
        reviewAlertCount: 0,
        reviewAlertTotal: 0,
        reviewAlertRatioPct: 0,
      },
      topData: [],
      
      // 搜索条件
      searchForm: {
        startDate: '',
        endDate: '',
        reviewType: '',
        reviewResult: 'false_alarm',
        warningSkill: '',
        warningLocation: '',
        warningName: '',
        warningId: ''
      },
      
      // 实际执行的搜索条件（点击查询按钮后更新）
      activeSearchForm: {
        startDate: '',
        endDate: '',
        reviewType: '',
        reviewResult: 'false_alarm',
        warningSkill: '',
        warningLocation: '',
        warningName: '',
        warningId: ''
      },
      
             // 复判记录列表
       reviewList: [],
      
      // 分页
      pagination: {
        currentPage: 1,
        pageSize: 12,
        total: 325
      },
      
      // 加载状态
      loading: false,
      
      // 选中的记录
      selectedRecords: [],
      
      // 卡片悬停状态管理
      cardHoverStates: {},
      
      // 统计面板显示状态
      showStatsPanel: true,
      
      // 复判类型选项
      reviewTypeOptions: [
        { label: '全部', value: '' },
        { label: '多模态大模型复判', value: 'auto' },
        { label: '人工审核', value: 'manual' }
      ],

      // 复判结论选项（搜索下拉用）
      reviewResultOptions: [
        { label: '全部', value: '' },
        { label: '误报', value: 'false_alarm' },
        { label: '真实预警', value: 'real_alert' },
        { label: '需人工复核', value: 'need_review' }
      ],

      // 结论标签页
      activeResultTab: 'false_alarm',
      resultTabs: [
        { label: '全部', value: '' },
        { label: '误报', value: 'false_alarm' },
        { label: '真实预警', value: 'real_alert' },
        { label: '需人工复核', value: 'need_review' }
      ],
      
      // 预警技能选项（从后端动态加载）
      warningSkillOptions: [
        { label: '全部智能技能', value: '' }
      ],
      
      warningDetailVisible: false,
      currentAlertId: null,
      currentReviewData: null,
      zipDownloading: false
    }
  },
  computed: {
    filteredData() {
      return this.reviewList
    },
    
    currentPageData() {
      return this.reviewList
    },
    
    totalRecords() {
      return this.pagination.total
    }
  },
  async mounted() {
    await Promise.all([
      this.getReviewList(),
      this.fetchDashboardStats(),
      this.loadSkillOptions()
    ])
    this.applyTopFromListIfNeeded()
  },
  methods: {
    async loadSkillOptions() {
      const options = [{ label: '全部智能技能', value: '' }]
      try {
        const [visionRes, llmRes] = await Promise.allSettled([
          skillAPI.getSkillList({ page: 1, limit: 200 }),
          skillAPI.getLlmSkillList({ page: 1, limit: 200 })
        ])

        if (visionRes.status === 'fulfilled') {
          const skills = (visionRes.value && visionRes.value.data) || []
          skills.forEach(s => {
            options.push({
              label: `[视觉] ${s.name_zh || s.name || '技能#' + s.id}`,
              value: `${SKILL_SOURCE_VISION}:${s.id}`
            })
          })
        }

        if (llmRes.status === 'fulfilled') {
          const raw = llmRes.value && llmRes.value.data
          const llmSkills = Array.isArray(raw) ? raw
            : (raw && Array.isArray(raw.data) ? raw.data
              : (raw && Array.isArray(raw.skill_classes) ? raw.skill_classes : []))
          llmSkills.forEach(s => {
            options.push({
              label: `[大模型] ${s.skill_name || s.name || '技能#' + s.id}`,
              value: `${SKILL_SOURCE_LLM}:${s.id}`
            })
          })
        }
      } catch (e) {
        console.error('加载技能选项失败:', e)
      }
      this.warningSkillOptions = options
    },
    truncateText(text, maxLength = 30) {
      if (!text) return ''
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    },

    // 返回上一页
    goBack() {
      this.$router.go(-1)
    },
    
    overviewPayload(res) {
      const raw = res && res.data
      if (!raw) return null
      if (typeof raw.total_reviews === 'number') return raw
      if (raw.data && typeof raw.data.total_reviews === 'number') return raw.data
      return null
    },

    /** 接口未返回 TOP3 时，用当前列表按预警名称聚合（与列表数据一致） */
    applyTopFromListIfNeeded() {
      if (this.topData.length > 0 || !this.reviewList.length) return
      const totalR = this.statistics.total > 0 ? this.statistics.total : this.reviewList.length
      if (!totalR) return
      const map = {}
      for (const r of this.reviewList) {
        const k = (r.title && String(r.title).trim()) || '未知预警'
        map[k] = (map[k] || 0) + 1
      }
      const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3)
      const colors = ['#409EFF', '#67C23A', '#E6A23C']
      this.topData = entries.map(([name, cnt], i) => ({
        id: `local-${i}-${name}`,
        name: this.truncateText(name, 14),
        count: cnt,
        total: totalR,
        percentage: totalR > 0 ? Math.round((cnt / totalR) * 10000) / 100 : 0,
        color: colors[i] || '#909399',
      }))
    },

    async fetchDashboardStats() {
      try {
        const overRes = await reviewRecordAPI.getReviewRecordStatistics()
        const o = this.overviewPayload(overRes)
        if (!o || typeof o.total_reviews !== 'number') return
        const totalR = o.total_reviews
        const auto = typeof o.auto_reviews === 'number' ? o.auto_reviews : 0
        const closureCount = typeof o.handled_or_reviewed_alerts === 'number'
          ? o.handled_or_reviewed_alerts
          : 0
        const closureTotal = typeof o.total_alerts === 'number' ? o.total_alerts : 0
        const closurePct = typeof o.alert_handle_rate_pct === 'number'
          ? o.alert_handle_rate_pct
          : (closureTotal > 0 ? Math.round((closureCount / closureTotal) * 10000) / 100 : 0)
        const reviewAlertRatioPct = closureTotal > 0
          ? Math.round((totalR / closureTotal) * 10000) / 100
          : 0
        this.statistics = {
          reviewed: auto,
          total: totalR,
          percentage: totalR > 0 ? Math.round((auto / totalR) * 10000) / 100 : 0,
          closureCount,
          closureTotal,
          closurePct,
          reviewAlertCount: totalR,
          reviewAlertTotal: closureTotal,
          reviewAlertRatioPct,
        }
        const skills = Array.isArray(o.top_review_skills) ? o.top_review_skills : []
        const colors = ['#409EFF', '#67C23A', '#E6A23C']
        this.topData = skills.slice(0, 3).map((row, i) => {
          const cnt = row.review_count || 0
          return {
            id: `skill-${String(row.name || i)}-${i}`,
            name: this.truncateText(row.name || '未知', 14),
            count: cnt,
            total: totalR,
            percentage: totalR > 0 ? Math.round((cnt / totalR) * 10000) / 100 : 0,
            color: colors[i] || '#909399',
          }
        })
      } catch (e) {
        console.error('获取复判看板统计失败:', e)
      }
    },

    // 获取复判记录列表（服务端分页）
    async getReviewList() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.currentPage,
          limit: this.pagination.pageSize,
          review_type: this.activeSearchForm.reviewType || undefined,
          review_result: this.activeSearchForm.reviewResult || undefined,
          start_date: this.activeSearchForm.startDate || undefined,
          end_date: this.activeSearchForm.endDate || undefined,
          alert_name: this.activeSearchForm.warningName || undefined,
          camera_name: this.activeSearchForm.warningLocation || undefined
        }
        if (this.activeSearchForm.warningSkill) {
          const [source, idStr] = this.activeSearchForm.warningSkill.split(':')
          params.skill_class_id = Number(idStr)
          params.skill_source = source
        }
        const response = await reviewRecordAPI.getReviewRecords(params)
        
        if (response.data && response.data.code === 0) {
          this.reviewList = response.data.data.map(record => {
            const isLlm = record.alert_type && record.alert_type.startsWith('llm_')
            return {
              id: record.review_id.toString(),
              title: record.alert_name || '未知预警',
              image: record.image_url || require('./images/5.jpg'),
              cameraName: record.camera_name || '未知摄像头',
              location: record.location || '未知位置',
              startTime: record.created_at ? new Date(record.created_at).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }).replace(/\//g, '-') : '未知时间',
              duration: '2秒',
              reviewType: record.review_type,
              reviewResult: record.review_result || 'false_alarm',
              reviewResultDisplay: record.review_result_display || '误报',
              reviewNotes: record.review_notes,
              reviewerName: record.reviewer_name,
              alertId: record.alert_id,
              alertType: record.alert_type || '',
              skillClassId: record.skill_class_id || null,
              skillNameZh: record.skill_name_zh || '',
              skillSource: isLlm ? SKILL_SOURCE_LLM : SKILL_SOURCE_VISION,
              reviewSkillName: record.review_skill_name || ''
            }
          })
          
          if (response.data.pagination) {
            this.pagination.total = response.data.pagination.total
          }
        } else {
          console.error('获取复判记录失败:', response.data && response.data.msg)
          this.$message.error('获取复判记录失败: ' + ((response.data && response.data.msg) || '未知错误'))
        }
        
        this.cardHoverStates = {}
      } catch (error) {
        console.error('获取复判记录异常:', error)
        this.$message.error('获取复判记录失败: ' + (error.message || '网络错误'))
      } finally {
        this.loading = false
      }
    },
    
    async handleSearch() {
      this.activeSearchForm = { ...this.searchForm }
      this.activeSearchForm.reviewResult = this.activeResultTab
      this.pagination.currentPage = 1
      this.selectedRecords = []
      
      await this.getReviewList()
      this.$message.success(`找到 ${this.pagination.total} 条记录`)
    },

    switchResultTab(value) {
      this.activeResultTab = value
      this.searchForm.reviewResult = value
      this.activeSearchForm = { ...this.searchForm }
      this.activeSearchForm.reviewResult = value
      this.pagination.currentPage = 1
      this.selectedRecords = []
      this.cardHoverStates = {}
      this.getReviewList()
    },
    
    async resetSearch() {
      const empty = { startDate: '', endDate: '', reviewType: '', reviewResult: this.activeResultTab, warningSkill: '', warningLocation: '', warningName: '', warningId: '' }
      this.searchForm = { ...empty }
      this.activeSearchForm = { ...empty }
      this.pagination.currentPage = 1
      this.selectedRecords = []
      this.cardHoverStates = {}
      await this.getReviewList()
      this.$message.info('搜索条件已重置')
    },
    
    // 全选/取消全选
    handleSelectAll() {
      if (this.selectedRecords.length === this.filteredData.length) {
        // 如果已经全选，则取消全选
        this.selectedRecords = []
        this.$message.info('已取消全选')
      } else {
        // 全选所有筛选后的记录
        this.selectedRecords = this.filteredData.map(item => item.id)
        this.$message.success(`已选择 ${this.selectedRecords.length} 项记录`)
      }
    },
    
    // 选择本页
    handleSelectPage() {
      const currentPageIds = this.currentPageData.map(item => item.id)
      
      if (currentPageIds.every(id => this.selectedRecords.includes(id))) {
        // 如果当前页已全选，则取消选择
        this.selectedRecords = this.selectedRecords.filter(id => 
          !currentPageIds.includes(id)
        )
        this.$message.info('已取消选择本页')
      } else {
        // 选择当前页所有项，同时保留其他已选项
        const otherSelectedIds = this.selectedRecords.filter(id => 
          !currentPageIds.includes(id)
        )
        this.selectedRecords = [...otherSelectedIds, ...currentPageIds]
        this.$message.success(`已选择本页 ${currentPageIds.length} 项记录`)
      }
    },
    
    // 批量导出
    handleBatchExport() {
      if (this.selectedRecords.length === 0) {
        this.$message.warning('请先选择要导出的记录')
        return
      }
      
      try {
        const exportData = this.filteredData
          .filter(item => this.selectedRecords.includes(item.id))
          .map(item => ({
            预警名称: item.title,
            AI技能: item.skillNameZh || '-',
            违规位置: item.cameraName,
            预警位置: item.location,
            开始时间: item.startTime,
            复判类型: this.getReviewTypeText(item.reviewType),
            复判结论: item.reviewResultDisplay,
            复判意见: item.reviewNotes || '-'
          }))
        
        // 导出为CSV
        this.exportToCSV(exportData, `复判记录_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`)
        this.$message.success(`已导出 ${exportData.length} 条记录`)
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error('导出失败，请稍后重试')
      }
    },
    
    // 批量下载预警图片
    async handleBatchDownloadImages() {
      if (this.selectedRecords.length === 0) {
        this.$message.warning('请先选择要下载图片的记录')
        return
      }

      const selectedItems = this.filteredData.filter(item =>
        this.selectedRecords.includes(item.id)
      )
      const itemsWithImages = selectedItems.filter(item =>
        item.image && !item._imageError && typeof item.image === 'string' && item.image.startsWith('http')
      )

      if (itemsWithImages.length === 0) {
        this.$message.warning('选中的记录中没有可下载的预警图片（仅支持远程图片）')
        return
      }

      this.$message.info(`正在下载 ${itemsWithImages.length} 张预警图片...`)
      this.loading = true

      let successCount = 0
      let failCount = 0
      for (const item of itemsWithImages) {
        try {
          const response = await fetch(item.image)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const blob = await response.blob()
          const ext = this.guessImageExt(blob.type)
          const skillPart = item.skillNameZh ? `_${item.skillNameZh}` : ''
          const fileName = `预警${item.alertId || item.id}${skillPart}_${item.title}${ext}`
          this.downloadFile(blob, fileName)
          successCount++
        } catch (e) {
          console.error(`下载图片失败: ${item.id}`, e)
          failCount++
        }
      }

      this.loading = false
      if (failCount === 0) {
        this.$message.success(`成功下载 ${successCount} 张预警图片`)
      } else {
        this.$message.warning(`下载完成：成功 ${successCount} 张，失败 ${failCount} 张`)
      }
    },

    guessImageExt(mimeType) {
      const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }
      return map[mimeType] || '.jpg'
    },

    async handleDownloadFalseAlarmZip() {
      const params = {}
      const skillVal = this.activeSearchForm.warningSkill
      if (skillVal) {
        const [source, id] = skillVal.split(':')
        params.skill_class_id = Number(id)
        params.skill_source = source
      }

      this.zipDownloading = true
      try {
        const countRes = await reviewRecordAPI.countFalseAlarmImages(params)
        const info = countRes.data
        if (!info || info.total === 0) {
          this.$message.warning('该技能下没有误报预警图片')
          return
        }

        const { total, batch_limit, batches_needed } = info
        const batchHint = batches_needed > 1
          ? `，将分 ${batches_needed} 批下载（每批最多 ${batch_limit} 条）`
          : ''
        
        await this.$confirm(
          `该技能共有 ${total} 条误报预警${batchHint}。\n确定开始下载吗？`,
          '下载误报图片',
          { confirmButtonText: '开始下载', cancelButtonText: '取消', type: 'info' }
        )

        for (let batch = 1; batch <= batches_needed; batch++) {
          if (batches_needed > 1) {
            this.$message.info(`正在下载第 ${batch}/${batches_needed} 批...`)
          } else {
            this.$message.info('正在打包下载...')
          }
          const response = await reviewRecordAPI.downloadFalseAlarmImages({ ...params, batch })
          const blob = new Blob([response.data], { type: 'application/zip' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          const disp = response.headers['content-disposition'] || ''
          const match = disp.match(/filename="?([^"]+)"?/)
          a.download = match ? match[1] : `false_alarm_batch${batch}_${Date.now()}.zip`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
        }
        this.$message.success(batches_needed > 1
          ? `全部 ${batches_needed} 批下载完成`
          : '误报图片下载完成')
      } catch (e) {
        if (e === 'cancel') return
        console.error('下载误报图片失败:', e)
        if (e.response && e.response.status === 404) {
          this.$message.warning('没有找到符合条件的误报图片')
        } else {
          this.$message.error('下载失败，请稍后重试')
        }
      } finally {
        this.zipDownloading = false
      }
    },

    // 批量删除
    async handleBatchDelete() {
      if (this.selectedRecords.length === 0) {
        this.$message.warning('请先选择要删除的记录')
        return
      }
      
      try {
        await this.$confirm(
          `确定要删除选中的 ${this.selectedRecords.length} 项记录吗？删除后将无法恢复。`,
          '删除确认',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        this.loading = true
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // 从列表中移除选中项
        this.reviewList = this.reviewList.filter(item => 
          !this.selectedRecords.includes(item.id)
        )
        
        this.$message.success(`已成功删除 ${this.selectedRecords.length} 项记录`)
        this.selectedRecords = []
        
        // 如果当前页没有数据了，回到上一页
        if (this.currentPageData.length === 0 && this.pagination.currentPage > 1) {
          this.pagination.currentPage--
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
          this.$message.error('删除失败，请稍后重试')
        }
      } finally {
        this.loading = false
      }
    },
    
    // 刷新数据
    async handleRefresh() {
      this.selectedRecords = []
      this.cardHoverStates = {}
      try {
        await this.getReviewList()
        await this.fetchDashboardStats()
        this.applyTopFromListIfNeeded()
        this.$message.success('数据已刷新')
      } catch (e) {
        console.error(e)
        this.$message.error('刷新失败')
      }
    },
    
    // 导出CSV文件
    exportToCSV(data, filename) {
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
      this.downloadFile(blob, filename)
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
    
    handlePageChange(page) {
      this.pagination.currentPage = page
      this.getReviewList()
    },
    
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.currentPage = 1
      this.getReviewList()
    },
    
    viewDetail(item) {
      if (!item.alertId) {
        this.$message.warning('该复判记录缺少关联的预警ID，无法获取完整详情')
        return
      }
      this.currentAlertId = item.alertId
      this.currentReviewData = {
        reviewType: item.reviewType,
        reviewTypeText: this.getReviewTypeText(item.reviewType),
        reviewResult: item.reviewResult,
        reviewResultDisplay: item.reviewResultDisplay,
        reviewNotes: item.reviewNotes,
        reviewerName: item.reviewerName,
        reviewSkillName: item.reviewSkillName || ''
      }
      this.warningDetailVisible = true
    },
    
    // 格式化时间显示
    formatTimeDisplay(timeString) {
      try {
        // 如果已经是格式化的字符串，直接返回
        if (typeof timeString === 'string' && timeString.includes('年') && timeString.includes('月') && timeString.includes('日')) {
          return timeString
        }
        
        let date
        if (timeString instanceof Date) {
          date = timeString
        } else {
          date = new Date(timeString)
        }
        
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          console.warn('Invalid date:', timeString)
          return timeString
        }
        
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        const seconds = date.getSeconds().toString().padStart(2, '0')
        
        return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`
      } catch (error) {
        console.error('Time formatting error:', error, timeString)
        return timeString || ''
      }
    },
    
    // 处理预警详情对话框中的事件（复判记录页面不需要处理操作）
    handleWarningFromDetail(warning) {
      // 复判记录页面不需要处理预警操作
      console.log('复判记录页面：预警操作', warning)
    },
    
    // 处理预警详情对话框中的上报事件
    handleReportFromDetail(warning) {
      // 复判记录页面不需要处理上报操作
      console.log('复判记录页面：上报操作', warning)
    },
    
    // 处理预警详情对话框中的归档事件
    handleArchiveFromDetail(warning) {
      // 复判记录页面不需要处理归档操作
      console.log('复判记录页面：归档操作', warning)
    },
    
    // 处理预警详情对话框中的误报事件
    handleFalseAlarmFromDetail(warning) {
      // 复判记录页面不需要处理误报操作
      console.log('复判记录页面：误报操作', warning)
    },
    
    // 处理还原复判事件
    async handleRestoreReview(restoredWarning) {
      try {
        console.log('还原复判的预警数据:', restoredWarning)
        
        // 这里应该调用API将预警数据存入预警管理页面
        // 实际项目中需要调用后端API
        // await this.$http.post('/api/warnings/restore', restoredWarning)
        
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 从复判记录列表中移除该项（因为已经还原了）
        this.reviewList = this.reviewList.filter(item => item.id !== restoredWarning.id)
        
        // 如果当前页没有数据了，回到上一页
        if (this.currentPageData.length === 0 && this.pagination.currentPage > 1) {
          this.pagination.currentPage--
        }
        
        // 清除选中状态
        this.selectedRecords = this.selectedRecords.filter(id => id !== restoredWarning.id)
        
        this.$message.success(`预警"${restoredWarning.type}"已成功还原到预警管理页面`)
        
        // 可以通过事件总线或者其他方式通知预警管理页面更新数据
        // 这里使用localStorage来模拟跨页面通信
        const restoredWarnings = JSON.parse(localStorage.getItem('restoredWarnings') || '[]')
        restoredWarnings.push({
          ...restoredWarning,
          restoredAt: new Date().toISOString(),
          restoredFrom: 'reviewRecords'
        })
        localStorage.setItem('restoredWarnings', JSON.stringify(restoredWarnings))
        
        
      } catch (error) {
        console.error('还原复判失败:', error)
        this.$message.error('还原复判失败，请稍后重试')
      }
    },
    
    // 获取复判类型文本
    getReviewTypeText(type) {
      const typeMap = {
        'auto': '多模态大模型复判',
        'manual': '人工审核'
      }
      return typeMap[type] || '未知'
    },
    
    // 获取复判类型样式
    getReviewTypeClass(type) {
      const classMap = {
        'auto': 'review-type-auto',
        'manual': 'review-type-manual'
      }
      return classMap[type] || ''
    },
    
    // 切换统计面板显示状态
    toggleStatsPanel() {
      this.showStatsPanel = !this.showStatsPanel
    },
    
    // 切换选择状态
    toggleSelect(id, event) {
      // 阻止事件冒泡，避免触发卡片的点击事件
      if (event) {
        event.stopPropagation()
      }
      
      const index = this.selectedRecords.indexOf(id)
      if (index === -1) {
        this.selectedRecords.push(id)
      } else {
        this.selectedRecords.splice(index, 1)
      }
    },
    
    // 将日期时间转换为标准格式（YYYY-MM-DD HH:mm:ss）
    formatDateTimeToStandard(date) {
      try {
        let dateObj
        if (date instanceof Date) {
          dateObj = date
        } else {
          dateObj = new Date(date)
        }
        
        if (isNaN(dateObj.getTime())) {
          console.warn('Invalid date for standard format:', date)
          return date
        }
        
        const year = dateObj.getFullYear()
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
        const day = dateObj.getDate().toString().padStart(2, '0')
        const hours = dateObj.getHours().toString().padStart(2, '0')
        const minutes = dateObj.getMinutes().toString().padStart(2, '0')
        const seconds = dateObj.getSeconds().toString().padStart(2, '0')
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      } catch (error) {
        console.error('Date formatting error:', error, date)
        return date
      }
    },
    
    // 显示卡片选择框
    showCardCheckbox(recordId) {
      this.$set(this.cardHoverStates, recordId, true)
    },
    
    // 隐藏卡片选择框
    hideCardCheckbox(recordId) {
      this.$set(this.cardHoverStates, recordId, false)
    },
    
    // 卡片图片加载失败时标记，触发占位符显示
    handleImageError(item) {
      this.$set(item, '_imageError', true)
    }
  }
}
</script>

<template>
  <div class="review-records-container" v-loading="loading">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button 
          type="text" 
          icon="el-icon-arrow-left" 
          @click="goBack"
          class="back-btn"
        >
          智能复判记录
        </el-button>
      </div>
      <div class="header-right">
        <el-button 
          type="text" 
          :icon="showStatsPanel ? 'el-icon-view' : 'el-icon-s-data'"
          @click="toggleStatsPanel"
        >
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
          <div class="overview-subtitle">多模态复判 / 复判总条数</div>
        </div>
        
        <!-- 预警处置覆盖：已处理/归档/误报 或 已有复判记录，相对全部预警 -->
        <div class="overview-item">
          <div class="overview-label">预警处置覆盖</div>
          <div class="overview-value overview-value-mixed">
            <span class="mixed-fraction">{{ statistics.closureCount }}/{{ statistics.closureTotal }}</span>
            <span class="mixed-sep" aria-hidden="true">·</span>
            <span class="mixed-pct">{{ statistics.closurePct }}%</span>
          </div>
          <div class="overview-subtitle">已处理、已归档、误报或已产生复判的预警 / 全部预警</div>
        </div>

        <!-- 已复判预警数 / 系统预警总数（复判覆盖率） -->
        <div class="overview-item">
          <div class="overview-label">复判覆盖率</div>
          <div class="overview-value overview-value-mixed">
            <span class="mixed-fraction">{{ statistics.reviewAlertCount }}/{{ statistics.reviewAlertTotal }}</span>
            <span class="mixed-sep" aria-hidden="true">·</span>
            <span class="mixed-pct">{{ statistics.reviewAlertRatioPct }}%</span>
          </div>
          <div class="overview-subtitle">已产生复判结论的预警数 / 全部预警数</div>
        </div>
        
        <!-- 按预警技能/名称的复判次数 TOP3 -->
        <div class="overview-ranking">
          <div class="ranking-header">
            <span class="ranking-title">预警类型复判 TOP3</span>
            <div class="ranking-legend">
              <span class="legend-dot completed"></span>
              <span class="legend-text">该类型复判次数</span>
              <span class="legend-dot total"></span>
              <span class="legend-text">复判总条数</span>
            </div>
          </div>
          <div class="ranking-items">
            <div v-if="!topData.length" class="ranking-empty">暂无数据（无复判记录或统计未就绪）</div>
            <div v-for="(item, index) in topData" :key="item.id" class="ranking-row">
              <div class="ranking-index" :style="{ backgroundColor: item.color }">{{ index + 1 }}</div>
              <div class="ranking-name">{{ item.name }}</div>
              <div class="ranking-progress">
                <div class="progress-track">
                  <div class="progress-fill" :style="{ width: item.percentage + '%', backgroundColor: item.color }"></div>
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
      <!-- 复判结论标签页 -->
      <div class="result-tabs">
        <div
          v-for="tab in resultTabs"
          :key="tab.value"
          class="result-tab"
          :class="{ active: activeResultTab === tab.value }"
          @click="switchResultTab(tab.value)"
        >
          <span class="tab-label">{{ tab.label }}</span>
          <span v-if="tab.value !== ''" class="tab-dot" :class="'dot-' + tab.value"></span>
        </div>
      </div>

      <!-- 筛选区域 -->
      <div class="filter-section">
        <div class="filter-tabs">
          <el-button 
            size="small"
            @click="handleSelectAll"
          >
            {{ selectedRecords.length === filteredData.length && filteredData.length > 0 ? '取消全选' : '全选本页' }}
          </el-button>
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
            @click="handleBatchDownloadImages"
            icon="el-icon-download"
          >
            下载图片
          </el-button>
          <el-button 
            size="small"
            :disabled="selectedRecords.length === 0"
            @click="handleBatchDelete"
          >
            删除
          </el-button>
          <el-divider direction="vertical"></el-divider>
          <el-tooltip
            :disabled="!!activeSearchForm.warningSkill"
            content="请先在搜索条件中选择一个预警技能"
            placement="top"
          >
            <span>
              <el-button 
                size="small"
                type="warning"
                icon="el-icon-folder-opened"
                :loading="zipDownloading"
                :disabled="!activeSearchForm.warningSkill"
                @click="handleDownloadFalseAlarmZip"
              >
                下载全部误报图片
              </el-button>
            </span>
          </el-tooltip>
        </div>
        
        <div class="filter-actions">
          <div class="filter-right">
            <el-button 
              type="text" 
              icon="el-icon-refresh"
              @click="handleRefresh"
            >
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
              value-format="yyyy-MM-dd"
            />
            <span class="date-separator">-</span>
            <el-date-picker
              v-model="searchForm.endDate"
              type="date"
              placeholder="结束日期"
              size="small"
              value-format="yyyy-MM-dd"
            />
          </div>
          
          <div class="search-item">
            <label>复判类型：</label>
            <el-select 
              v-model="searchForm.reviewType" 
              placeholder="全部" 
              size="small"
            >
              <el-option 
                v-for="option in reviewTypeOptions"
                :key="option.value"
                :label="option.label" 
                :value="option.value" 
              />
            </el-select>
          </div>

          <div class="search-item">
            <label>预警技能：</label>
            <el-select 
              v-model="searchForm.warningSkill" 
              placeholder="全部智能技能" 
              size="small"
            >
              <el-option 
                v-for="option in warningSkillOptions"
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
            :class="{ 'selected': selectedRecords.includes(item.id) }"
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
                :value="selectedRecords.includes(item.id)"
                @change="toggleSelect(item.id)"
                size="mini"
              />
            </div>
            
            <div class="card-image">
              <img 
                v-if="item.image && !item._imageError" 
                :src="item.image" 
                :alt="item.title" 
                @error="handleImageError(item)"
              />
              <div v-else class="image-placeholder">
                <i class="el-icon-picture-outline"></i>
                <span>暂无截图</span>
              </div>
            </div>
            
            <div class="card-content">
              <div class="card-header">
                <div class="card-title">{{ item.title }}</div>
                <el-tag
                  :type="item.reviewType === 'auto' ? 'success' : 'warning'"
                  size="mini"
                  class="review-type-tag"
                >
                  {{ item.reviewType === 'auto' ? 'AI复判' : '人工审核' }}
                </el-tag>
                <el-tooltip
                  :content="item.reviewResult === 'false_alarm' ? 'AI判定该预警非真实事件（is_real_alert=false）' : item.reviewResult === 'real_alert' ? 'AI判定该预警为真实事件（is_real_alert=true）' : 'AI无法确定，建议人工复核'"
                  placement="top"
                >
                  <el-tag
                    :type="item.reviewResult === 'false_alarm' ? 'danger' : item.reviewResult === 'real_alert' ? 'success' : 'info'"
                    size="mini"
                    class="review-result-tag"
                  >
                    {{ item.reviewResultDisplay }}
                  </el-tag>
                </el-tooltip>
              </div>
              <div class="card-info">
                <div class="info-item" v-if="item.skillNameZh">
                  <span class="label">AI技能：</span>
                  <span class="value">
                    <el-tag
                      size="mini"
                      :type="item.skillSource === 'llm' ? 'warning' : 'primary'"
                      effect="plain"
                      class="skill-tag"
                    >{{ item.skillSource === 'llm' ? '大模型' : '视觉' }}</el-tag>
                    <span class="skill-name-text">{{ item.skillNameZh }}</span>
                  </span>
                </div>
                <div class="info-item" v-if="item.reviewType === 'auto' && item.reviewSkillName">
                  <span class="label">复判技能：</span>
                  <span class="value">
                    <span class="skill-name-text">{{ item.reviewSkillName }}</span>
                  </span>
                </div>
                <div class="info-item">
                  <span class="label">设备名称：</span>
                  <span class="value">{{ item.cameraName }}</span>
                </div>
                <div class="info-item">
                  <span class="label">违规位置：</span>
                  <span class="value">{{ item.location }}</span>
                </div>
                <div class="info-item review-notes-item" v-if="item.reviewNotes">
                  <span class="label">复判意见：</span>
                  <span class="value notes-text">{{ truncateText(item.reviewNotes, 30) }}</span>
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
          <i class="el-icon-folder-opened"></i>
          <p>暂无复判记录数据</p>
          <span class="no-data-tip">请尝试调整筛选条件或联系管理员</span>
        </div>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-section">
        <!-- <div class="pagination-info">
          共 {{ totalRecords }} 条数据
        </div> -->
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

      <div style="height: 10px;"></div>
    </div>

    <!-- 预警详情对话框 -->
    <WarningDetail
      :visible.sync="warningDetailVisible"
      :alert-id="currentAlertId"
      :review-data="currentReviewData"
      @handle-warning="handleWarningFromDetail"
      @handle-report="handleReportFromDetail"
      @handle-archive="handleArchiveFromDetail"
      @handle-false-alarm="handleFalseAlarmFromDetail"
      @restore-review="handleRestoreReview"
    />
  </div>
</template>

<style scoped>
.review-records-container {
  height: 100%;
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%);
  padding: 16px 20px;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto !important;
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
  align-items: center;
  text-align: center;
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

/* 分数与百分比同一行（在栏内水平居中） */
.overview-value-mixed {
  display: flex;
  flex-wrap: nowrap;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
  width: 100%;
  white-space: nowrap;
}

.overview-value-mixed .mixed-fraction {
  color: #303133;
}

.overview-value-mixed .mixed-sep {
  color: #dcdfe6;
  font-weight: 400;
  user-select: none;
}

.overview-value-mixed .mixed-pct {
  color: #409eff;
  font-weight: bold;
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
  font-size: 11px;
  color: #909399;
}

.legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot.completed {
  background: #409eff;
}

.legend-dot.total {
  background: #e4e7ed;
}

.legend-text {
  margin-left: 4px;
}

.ranking-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ranking-empty {
  font-size: 12px;
  color: #c0c4cc;
  padding: 12px 0;
  text-align: center;
}

.ranking-row {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 20px;
}

.ranking-index {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
}

.ranking-name {
  font-size: 11px;
  color: #606266;
  min-width: 80px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.ranking-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.progress-track {
  flex: 1;
  height: 3px;
  background: #f0f2f5;
  border-radius: 2px;
  overflow: hidden;
  min-width: 60px;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.ranking-stats {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: #909399;
  white-space: nowrap;
  flex-shrink: 0;
}

.completed-count {
  color: #606266;
  font-weight: 500;
}

.separator {
  color: #c0c4cc;
  margin: 0 1px;
}

.total-count {
  color: #909399;
}

.percentage-text {
  color: #409eff;
  font-weight: 500;
  margin-left: 4px;
}

/* 下半部分：内容卡片 - 科技感样式 */
.content-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
  position: relative;
}



/* 筛选区域 - 科技感样式 */
.filter-section {
  padding: 12px 24px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-actions {
  display: flex;
  gap: 16px;
}

/* 搜索区域 - 科技感样式 */
.search-section {
  padding: 12px 24px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.search-row:last-child {
  margin-bottom: 0;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.search-item label {
  font-size: 14px;
  color: #606266;
  min-width: auto;
}

.date-separator {
  color: #909399;
  margin: 0 4px;
}

.search-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

/* 记录列表区域 */
.records-section {
  padding: 20px 24px;
}

.records-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

@media (max-width: 1600px) {
  .records-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 1300px) {
  .records-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1000px) {
  .records-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
}

.record-card {
  border: 1px solid #e8eaed;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  position: relative;
}



.record-card > * {
  position: relative;
  z-index: 2;
}

.record-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

.card-image {
  height: 140px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0a1526, #1e3c72);
  flex-shrink: 0;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  gap: 6px;
}

.image-placeholder i {
  font-size: 32px;
}

.image-placeholder span {
  font-size: 12px;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  padding: 10px 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.card-title {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-type-tag {
  flex-shrink: 0;
  margin-left: 8px;
}

.review-result-tag {
  flex-shrink: 0;
  margin-left: 4px;
}

.result-tabs {
  display: flex;
  border-bottom: 1px solid #ebeef5;
  padding: 0 16px;
  background: #fff;
}

.result-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  cursor: pointer;
  color: #909399;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  user-select: none;
}

.result-tab:hover {
  color: #606266;
}

.result-tab.active {
  color: #409EFF;
  border-bottom-color: #409EFF;
  font-weight: 500;
}

.tab-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-false_alarm {
  background-color: #F56C6C;
}

.dot-real_alert {
  background-color: #67C23A;
}

.dot-need_review {
  background-color: #909399;
}

.skill-tag {
  font-size: 10px !important;
  padding: 0 4px !important;
  height: 18px !important;
  line-height: 16px !important;
  border-radius: 3px !important;
  margin-right: 4px;
  flex-shrink: 0;
}

.skill-name-text {
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.review-notes-item .notes-text {
  color: #606266;
  font-style: italic;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.info-item {
  display: flex;
  font-size: 12px;
  line-height: 1.4;
  text-align: left;
}

.info-item .label {
  color: #909399;
  min-width: 60px;
  flex-shrink: 0;
  font-weight: 500;
  text-align: left;
}

.info-item .value {
  color: #606266;
  flex: 1;
  font-weight: 400;
  text-align: left;
}

.time-item {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px solid #f2f3f5;
}

.time-item .time {
  font-size: 12px;
  color: #909399;
  font-weight: 400;
  line-height: 1.4;
}

/* 分页区域 */
.pagination-section {
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  padding-bottom: 10px;
  /* padding: 12px 24px;
  border-top: 1px solid #f0f2f5;
  background: #fafafa;
  margin: 0 -24px 0 -24px;
  flex-shrink: 0; */
}

.pagination-section >>> .el-pagination__total {
  padding-top: 3px;
}

.pagination-section >>> .el-pagination .el-pager li {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  color: #3b82f6;
  margin: 0 2px;
}

.pagination-section >>> .el-pagination .el-pager li:hover {
  color: #1d4ed8;
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.05);
}

.pagination-section >>> .el-pagination .el-pager li.active {
  background: #3b82f6 !important;
  border-color: #3b82f6 !important;
  color: white !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.pagination-section >>> .el-pagination .btn-prev,
.pagination-section >>> .el-pagination .btn-next {
  background-color: white !important;
  border: 1px solid #dcdfe6 !important;
  color: #606266 !important;
}

.pagination-info {
  font-size: 14px;
  color: #909399;
}

.pagination-controls {
  display: flex;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-overview {
    flex-direction: column;
    gap: 16px;
    min-height: auto;
  }
  
  .overview-item {
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
    padding: 12px 0;
    text-align: center;
    min-width: auto;
  }
  
  .overview-item:last-child {
    border-bottom: none;
  }
  
  .overview-ranking {
    padding-left: 0;
  }
  
  .search-row {
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .review-records-container {
    padding: 8px;
  }
  
  .page-header {
    padding: 10px 16px;
    margin-bottom: 8px;
  }
  
  .statistics-card {
    margin-bottom: 8px;
  }
  
  .stats-overview {
    padding: 10px 16px;
    gap: 12px;
    min-height: 50px;
  }
  
  .filter-section,
  .search-section {
    padding: 10px 16px;
  }
  
  .records-section {
    padding: 12px 16px;
  }
  
  .pagination-section {
    padding: 10px 16px;
  }
  
  .search-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .search-item {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }
  
  .search-actions {
    margin-left: 0;
    justify-content: center;
  }
  
  .records-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .card-image {
    height: 140px;
  }
  
  .pagination-section {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}

@media (max-width: 500px) {
  .records-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  
  .card-image {
    height: 160px;
  }
}

/* 选择框样式 - 与deviceSkills.vue保持一致 */
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

/* 卡片选中状态 */
.record-card.selected {
  border-color: #3b82f6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
}

.record-card.selected .selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(59, 130, 246, 0.05);
  z-index: 1;
}

/* 筛选按钮状态 */
.filter-tabs .el-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.filter-tabs .el-button.is-disabled {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #c0c4cc;
}

/* 无数据提示样式 */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.no-data i {
  font-size: 40px;
  color: #909399;
  margin-bottom: 10px;
}

.no-data p {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.no-data-tip {
  font-size: 12px;
  color: #c0c4cc;
}

/* 科技感按钮样式 */
/* .review-records-container >>> .el-button--primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.review-records-container >>> .el-button--primary:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.review-records-container >>> .el-button--default {
  background: white;
  border: 1px solid #d1d5db;
  color: #4b5563;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.review-records-container >>> .el-button--default:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  color: #1e40af;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  transform: translateY(-1px);
}

.review-records-container >>> .el-button--danger {
  background: linear-gradient(135deg, #f56c6c 0%, #dc2626 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.3);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.review-records-container >>> .el-button--danger:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  box-shadow: 0 4px 10px rgba(245, 108, 108, 0.4);
  transform: translateY(-1px);
}

.review-records-container >>> .el-button--text {
  color: #4b5563;
  transition: all 0.3s ease;
}

.review-records-container >>> .el-button--text:hover {
  color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
} */

/* 科技感输入框样式 */
/* .review-records-container >>> .el-input__inner {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.review-records-container >>> .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.review-records-container >>> .el-select .el-input__inner {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.review-records-container >>> .el-select .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.review-records-container >>> .el-date-editor.el-input {
  border-radius: 6px;
}

.review-records-container >>> .el-date-editor .el-input__inner {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.review-records-container >>> .el-date-editor .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
} */

/* 科技感分页样式 */
/* .review-records-container >>> .el-pagination {
  justify-content: center;
}

.review-records-container >>> .el-pagination .el-pager li {
  background: white !important;
  border: 1px solid #dcdfe6 !important;
  color: #606266 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
  margin: 0 2px !important;
}

.review-records-container >>> .el-pagination .el-pager li:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
}

.review-records-container >>> .el-pagination .el-pager li.active {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%) !important;
  border-color: #3b82f6 !important;
  color: white !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.review-records-container >>> .el-pagination button {
  background: white !important;
  border: 1px solid #dcdfe6 !important;
  color: #606266 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
  margin: 0 2px !important;
}

.review-records-container >>> .el-pagination button:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15);
} */

/* 对话框样式优化 - 科技感设计 */
.review-records-container >>> .el-dialog {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.review-records-container >>> .el-dialog__header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  padding: 16px 20px;
}

.review-records-container >>> .el-dialog__title {
  color: #1f2937;
  font-weight: 600;
}

.review-records-container >>> .el-dialog__close {
  color: #6b7280;
  transition: color 0.3s ease;
}

.review-records-container >>> .el-dialog__close:hover {
  color: #3b82f6;
}

.review-records-container >>> .el-dialog__body {
  padding: 20px;
  background: #ffffff;
}

.review-records-container >>> .el-button--success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.review-records-container >>> .el-button--success:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);
  transform: translateY(-1px);
}

.review-records-container >>> .el-button--warning {
  background: linear-gradient(135deg, #e6a23c 0%, #f59e0b 100%);
  border: none;
  box-shadow: 0 2px 6px rgba(230, 162, 60, 0.3);
  color: white;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 6px;
}

.review-records-container >>> .el-button--warning:hover {
  background: linear-gradient(135deg, #d97706 0%, #dc2626 100%);
  box-shadow: 0 4px 10px rgba(230, 162, 60, 0.4);
  transform: translateY(-1px);
}

/* 科技感复选框样式 */
.review-records-container >>> .el-checkbox__input.is-checked .el-checkbox__inner {
  background-color: #3b82f6 !important;
  border-color: #3b82f6 !important;
}

.review-records-container >>> .el-checkbox__inner:hover {
  border-color: #3b82f6 !important;
}

/* MessageBox 确认弹框样式 - 使用更强的选择器 */
</style>

<style>
/* 全局MessageBox确认弹框样式 - 简洁现代风格 */
.el-message-box {
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid #e5e7eb !important;
}

.el-message-box__header {
  background: #ffffff !important;
  border-bottom: 1px solid #f3f4f6 !important;
  padding: 20px 24px 16px !important;
}

.el-message-box__title {
  color: #111827 !important;
  font-weight: 500 !important;
  font-size: 16px !important;
}

.el-message-box__headerbtn {
  color: #9ca3af !important;
  transition: color 0.2s ease !important;
  top: 16px !important;
  right: 16px !important;
}

.el-message-box__headerbtn:hover {
  color: #6b7280 !important;
}

.el-message-box__content {
  padding: 16px 24px 24px !important;
  background: #ffffff !important;
}

.el-message-box__message {
  color: #374151 !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
}

.el-message-box__btns {
  padding: 0 24px 24px !important;
  background: #ffffff !important;
  border-top: none !important;
  text-align: right !important;
}

.el-message-box__btns .el-button {
  border-radius: 8px !important;
  font-weight: 500 !important;
  transition: all 0.2s ease !important;
  padding: 8px 16px !important;
  margin-left: 12px !important;
}

.el-message-box__btns .el-button--primary {
  background: linear-gradient(135deg, #f56c6c 0%, #dc2626 100%) !important;
  border: none !important;
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.3) !important;
  color: white !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
}

.el-message-box__btns .el-button--primary:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
  box-shadow: 0 4px 10px rgba(245, 108, 108, 0.4) !important;
  transform: translateY(-1px) !important;
}

.el-message-box__btns .el-button--default {
  background: white !important;
  border: 1px solid #d1d5db !important;
  color: #4b5563 !important;
  transition: all 0.3s ease !important;
  box-shadow: none !important;
}

.el-message-box__btns .el-button--default:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
  transform: translateY(-1px) !important;
}
</style> 

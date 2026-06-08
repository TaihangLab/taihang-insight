<template>
  <div class="sg-list-wrapper">
    <div class="sg-list">
      <div class="sg-page">
        <!-- 顶部标题 -->
        <div class="sg-page-title">技能编排</div>

        <!-- 工具栏 -->
        <div class="sg-toolbar">
          <div class="sg-toolbar-left">
            <el-input
              v-model="searchInput"
              class="sg-search"
              placeholder="请输入技能名称或ID搜索"
              clearable
              prefix-icon="el-icon-search"
              @keyup.enter.native="handleSearch"
              @clear="handleSearch" />

            <el-select v-model="filterStatus" class="sg-select" placeholder="全部发布状态" clearable @change="handleFilter">
              <el-option label="全部发布状态" value="" />
              <el-option label="已发布" value="published" />
              <el-option label="待发布" value="draft" />
            </el-select>

            <el-popover
              v-model="tagFilterVisible"
              placement="bottom-start"
              width="520"
              trigger="click"
              popper-class="sg-tagfilter-popper">
              <div class="sg-tagfilter">
                <div class="sg-tagfilter-head">
                  <span class="sg-tagfilter-title">技能标签筛选</span>
                  <el-button type="text" class="sg-tagfilter-clear" @click="clearTagFilters">清空筛选</el-button>
                </div>
                <div class="sg-tagfilter-rows">
                  <div v-for="(f, i) in tagFilters" :key="i" class="sg-tagfilter-row">
                    <el-select v-model="f.name" class="sg-tf-name" placeholder="请选择标签名称" clearable @change="f.value = ''">
                      <el-option v-for="n in tagNameOptions" :key="n" :label="n" :value="n" />
                    </el-select>
                    <el-select v-model="f.value" class="sg-tf-value" placeholder="请选择标签内容" clearable :disabled="!f.name">
                      <el-option v-for="v in tagValueOptions(f.name)" :key="v" :label="v" :value="v" />
                    </el-select>
                    <i class="el-icon-close sg-tf-del" @click="removeTagFilter(i)"></i>
                  </div>
                </div>
                <div class="sg-tagfilter-foot">
                  <el-button type="text" icon="el-icon-plus" class="sg-tf-add" @click="addTagFilter">添加筛选条件</el-button>
                  <el-button type="primary" size="small" class="sg-tf-query" @click="applyTagFilters">查询</el-button>
                </div>
              </div>
              <el-button slot="reference" class="sg-tag-filter" :class="{ 'is-active': appliedTagFilters.length }" icon="el-icon-collection-tag" plain>技能标签筛选</el-button>
            </el-popover>
          </div>

          <div class="sg-toolbar-right">
            <el-button-group class="sg-view-toggle">
              <el-button :class="{ 'is-active': viewMode === 'grid' }" icon="el-icon-menu" @click="viewMode = 'grid'"></el-button>
              <el-button :class="{ 'is-active': viewMode === 'list' }" icon="el-icon-s-unfold" @click="viewMode = 'list'"></el-button>
            </el-button-group>
            <el-button class="sg-refresh" icon="el-icon-refresh" @click="load"></el-button>
            <el-button type="primary" icon="el-icon-plus" class="sg-create-btn" @click="createNew">创建技能</el-button>
          </div>
        </div>

        <!-- 卡片区 -->
        <div class="sg-cards-container" v-loading="loading">
          <!-- 空状态 -->
          <div v-if="!loading && displayList.length === 0" class="sg-empty">
            <i class="el-icon-share sg-empty-icon"></i>
            <div class="sg-empty-text">暂无技能编排</div>
            <div class="sg-empty-tip">点击右上角"创建技能"开始可视化编排你的第一个技能</div>
            <el-button type="primary" icon="el-icon-plus" @click="createNew">创建技能</el-button>
          </div>

          <!-- 网格视图 -->
          <div v-else-if="viewMode === 'grid'" class="sg-grid">
            <div
              v-for="item in displayList"
              :key="item.skill_id"
              class="sg-card"
              @click="edit(item)">

              <!-- 状态/类型角标 -->
              <div v-if="item.status" class="sg-card-badge">已发布</div>

              <!-- 缩略图 -->
              <div class="sg-card-thumb" :style="coverOf(item) ? {} : thumbStyle(item)">
                <img v-if="coverOf(item)" :src="coverOf(item)" class="sg-card-cover" />
                <i v-else class="el-icon-share"></i>
              </div>

              <!-- 名称 -->
              <div class="sg-card-head">
                <i class="el-icon-share sg-card-name-ic"></i>
                <span class="sg-card-name" :title="item.skill_name">{{ item.skill_name }}</span>
                <span class="sg-card-idtag">ID</span>
              </div>

              <!-- 描述 -->
              <div class="sg-card-desc">{{ item.description || item.skill_name }}</div>

              <!-- 信息行 -->
              <div class="sg-card-info">
                <div class="sg-info-row">
                  <span class="sg-info-label">状态</span>
                  <span class="sg-status-dot" :class="item.status ? 'is-on' : 'is-off'"></span>
                  <span class="sg-status-text">{{ item.status ? '已发布' : '待发布' }}</span>
                </div>
                <div class="sg-info-row">
                  <span class="sg-info-label">标签</span>
                  <span class="sg-info-val">{{ tagCount(item) }} 个</span>
                </div>
              </div>

              <!-- 底部 -->
              <div class="sg-card-foot">
                <span class="sg-card-time">{{ item.skill_id }} {{ formatTime(item.updated_at) }} 更新</span>
              </div>

              <!-- 悬浮操作 -->
              <div class="sg-card-actions" @click.stop>
                <el-button size="mini" @click="edit(item)">编辑</el-button>
                <el-button size="mini" @click="openVersions(item)">历史</el-button>
                <el-button v-if="item.status" size="mini" @click="openStats(item)">监控</el-button>
                <el-button v-if="!item.status" size="mini" type="warning" @click="publish(item)">发布</el-button>
                <el-button v-else size="mini" type="info" @click="unpublish(item)">下线</el-button>
                <el-button size="mini" type="danger" @click="remove(item)">删除</el-button>
              </div>
            </div>
          </div>

          <!-- 列表视图 -->
          <el-table v-else :data="displayList" border style="width: 100%">
            <el-table-column prop="skill_id" label="技能ID" width="180" />
            <el-table-column prop="skill_name" label="技能名称" />
            <el-table-column prop="version" label="版本" width="80" />
            <el-table-column label="状态" width="100">
              <template slot-scope="s">
                <el-tag :type="s.row.status ? 'success' : 'info'" size="small">
                  {{ s.row.status ? '已发布' : '待发布' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="节点数" width="80">
              <template slot-scope="s">{{ nodeCount(s.row) }}</template>
            </el-table-column>
            <el-table-column prop="updated_at" label="更新时间" width="180">
              <template slot-scope="s">{{ formatTime(s.row.updated_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="320">
              <template slot-scope="s">
                <el-button size="mini" @click="edit(s.row)">编辑</el-button>
                <el-button size="mini" @click="openVersions(s.row)">历史</el-button>
                <el-button v-if="s.row.status" size="mini" @click="openStats(s.row)">监控</el-button>
                <el-button v-if="!s.row.status" size="mini" type="warning" @click="publish(s.row)">发布</el-button>
                <el-button v-else size="mini" type="info" @click="unpublish(s.row)">下线</el-button>
                <el-button size="mini" type="danger" @click="remove(s.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div class="sg-pagination">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
            :current-page="currentPage"
            :page-sizes="[12, 24, 36, 48]"
            :page-size="pageSize"
            :total="totalCount"
            layout="total, sizes, prev, pager, next"
            background>
            <template slot="total"><span>共 {{ totalCount }} 条数据</span></template>
          </el-pagination>
        </div>
      </div>
    </div>

    <!-- 创建技能 -->
    <el-dialog
      title="创建技能（技能编排）"
      :visible.sync="createDialogVisible"
      width="640px"
      custom-class="sg-create-dialog"
      :close-on-click-modal="false"
      @closed="resetCreateForm">
      <el-form :model="createForm" label-width="92px" label-position="left">
        <el-form-item label="技能名称" required>
          <el-input
            v-model="createForm.name"
            maxlength="100"
            show-word-limit
            placeholder="请输入技能名称" />
          <div class="sg-cf-hint">仅支持数字、中文、大小写英文字母、非特殊符号，不允许空格</div>
        </el-form-item>

        <el-form-item label="技能描述">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            maxlength="255"
            show-word-limit
            placeholder="请输入技能描述" />
        </el-form-item>

        <el-form-item label="自定义标签">
          <div class="sg-tag-rows">
            <div v-for="(t, i) in createForm.tags" :key="i" class="sg-tag-row">
              <el-input v-model="t.name" maxlength="64" show-word-limit placeholder="请输入标签名称" class="sg-tag-name" />
              <el-input v-model="t.value" maxlength="255" show-word-limit placeholder="请输入标签内容" class="sg-tag-value" />
              <i class="el-icon-close sg-tag-del" @click="removeTag(i)"></i>
            </div>
          </div>
          <el-button type="text" icon="el-icon-plus" class="sg-add-tag" @click="addTag">添加标签 ({{ createForm.tags.length }}/20)</el-button>
          <div class="sg-cf-hint">标签名称不可重复，且标签名称和字符串类型标签内容仅支持字母、数字、中文、下划线"_"和连字符"-"</div>
        </el-form-item>

        <el-form-item label="技能配图" required>
          <div class="sg-cover" @click="pickCover">
            <img :src="createForm.cover || defaultCover" class="sg-cover-img" />
            <div class="sg-cover-mask">修改配图</div>
          </div>
          <input ref="coverInput" type="file" accept="image/*" style="display:none" @change="onCoverChange" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="confirmCreate">确定</el-button>
      </span>
    </el-dialog>

    <!-- 历史版本 -->
    <el-dialog :title="`历史版本 - ${verSkill ? verSkill.skill_name : ''}`" :visible.sync="verDialogVisible" width="600px">
      <div class="sg-ver-tip">每次发布都会自动存档一个版本，可一键回滚到任意历史版本（回滚也会留档，不会丢历史）。</div>
      <el-table :data="versions" v-loading="verLoading" size="mini" border max-height="360">
        <el-table-column label="版本" width="80">
          <template slot-scope="s">
            v{{ s.row.version }}
            <el-tag v-if="verSkill && String(s.row.version) === String(verCurrent)" type="success" size="mini">当前</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="说明" />
        <el-table-column prop="created_at" label="时间" width="180" />
        <el-table-column label="操作" width="90">
          <template slot-scope="s">
            <el-button size="mini" type="text"
                       :disabled="verSkill && String(s.row.version) === String(verCurrent)"
                       @click="rollback(s.row)">回滚到此</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="!verLoading && !versions.length" class="sg-ver-tip">暂无历史版本（发布后才会产生版本快照）。</div>
    </el-dialog>

    <!-- 调用监控 -->
    <el-dialog :title="`调用监控 - ${statSkill ? statSkill.skill_name : ''}`" :visible.sync="statDialogVisible" width="680px">
      <div class="sg-ver-tip">
        外部系统可用 HTTP 直接调用该已发布技能（传一张图，返回是否触发与告警文本）：
      </div>
      <div class="sg-invoke-url" v-if="statSkill">
        POST {{ invokeUrl }}
        <i class="el-icon-document-copy" title="复制" @click="copyUrl"></i>
      </div>
      <div class="sg-invoke-url sg-invoke-body" v-if="statSkill">body: {"image_base64": "...", "roi": null, "source": "你的系统名"}</div>

      <div v-loading="statLoading">
        <div class="sg-metrics" v-if="stats">
          <div class="sg-metric"><div class="sg-metric-v">{{ stats.metrics.total }}</div><div class="sg-metric-l">总调用</div></div>
          <div class="sg-metric"><div class="sg-metric-v">{{ stats.metrics.today }}</div><div class="sg-metric-l">今日调用</div></div>
          <div class="sg-metric"><div class="sg-metric-v">{{ pct(stats.metrics.success_rate) }}</div><div class="sg-metric-l">成功率</div></div>
          <div class="sg-metric"><div class="sg-metric-v">{{ pct(stats.metrics.trigger_rate) }}</div><div class="sg-metric-l">触发率</div></div>
          <div class="sg-metric"><div class="sg-metric-v">{{ stats.metrics.avg_latency_ms }}ms</div><div class="sg-metric-l">平均耗时</div></div>
        </div>
        <div class="sg-ver-tip">最近调用</div>
        <el-table :data="stats ? stats.recent : []" size="mini" border max-height="260">
          <el-table-column prop="created_at" label="时间" width="180" />
          <el-table-column label="结果" width="80">
            <template slot-scope="s">
              <el-tag size="mini" :type="s.row.success ? 'success' : 'danger'">{{ s.row.success ? '成功' : '失败' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="触发告警" width="90">
            <template slot-scope="s">{{ s.row.triggered ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column prop="latency_ms" label="耗时(ms)" width="90" />
          <el-table-column prop="source" label="来源" />
        </el-table>
        <div v-if="stats && !stats.recent.length" class="sg-ver-tip">暂无调用记录。</div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { skillGraphAPI } from '@/components/service/VisionAIService.js'

export default {
  name: 'SkillGraphList',
  data() {
    return {
      list: [], loading: false,
      searchInput: '', searchKeyword: '',
      filterStatus: '',
      viewMode: 'grid',
      currentPage: 1, pageSize: 12, totalCount: 0,
      tagFilterVisible: false,
      tagFilters: [{ name: '', value: '' }],
      appliedTagFilters: [],
      createDialogVisible: false, creating: false,
      defaultCover: '/static/logo.png',
      createForm: { name: '', description: '', tags: [], cover: '' },
      verDialogVisible: false, verLoading: false,
      verSkill: null, versions: [], verCurrent: null,
      statDialogVisible: false, statLoading: false,
      statSkill: null, stats: null
    }
  },
  computed: {
    invokeUrl() {
      const origin = window.location.origin
      return `${origin}/api/v1/skill-graphs/${this.statSkill ? this.statSkill.skill_id : ''}/invoke`
    },
    tagNameOptions() {
      const set = new Set()
      this.list.forEach(item => {
        const tags = (item.graph_json && item.graph_json.tags) || []
        tags.forEach(t => { if (t && t.name) set.add(t.name) })
      })
      return Array.from(set)
    },
    displayList() {
      if (!this.appliedTagFilters.length) return this.list
      return this.list.filter(item => {
        const tags = (item.graph_json && item.graph_json.tags) || []
        return this.appliedTagFilters.every(f =>
          tags.some(t => t.name === f.name && (!f.value || t.value === f.value))
        )
      })
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const params = { page: this.currentPage, page_size: this.pageSize }
        if (this.searchKeyword && this.searchKeyword.trim()) params.name = this.searchKeyword.trim()
        if (this.filterStatus === 'published') params.status = true
        else if (this.filterStatus === 'draft') params.status = false
        const res = await skillGraphAPI.listGraphs(params)
        this.list = (res.data && res.data.data) || []
        this.totalCount = (res.data && res.data.total) || this.list.length
      } catch (e) {
        this.$message.error('加载失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.searchKeyword = this.searchInput
      this.currentPage = 1
      this.load()
    },
    handleFilter() {
      this.currentPage = 1
      this.load()
    },
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.load()
    },
    handlePageChange(val) {
      this.currentPage = val
      this.load()
    },
    nodeCount(row) {
      const g = row.graph_json || {}
      return (g.nodes && g.nodes.length) || 0
    },
    tagCount(row) {
      const tags = row.tags || row.skill_tags || (row.graph_json && row.graph_json.tags)
      return Array.isArray(tags) ? tags.length : 0
    },
    coverOf(row) {
      return (row.graph_json && row.graph_json.cover) || row.cover || ''
    },
    tagValueOptions(name) {
      if (!name) return []
      const set = new Set()
      this.list.forEach(item => {
        const tags = (item.graph_json && item.graph_json.tags) || []
        tags.forEach(t => { if (t && t.name === name && t.value) set.add(t.value) })
      })
      return Array.from(set)
    },
    addTagFilter() {
      this.tagFilters.push({ name: '', value: '' })
    },
    removeTagFilter(i) {
      this.tagFilters.splice(i, 1)
      if (!this.tagFilters.length) this.tagFilters.push({ name: '', value: '' })
    },
    clearTagFilters() {
      this.tagFilters = [{ name: '', value: '' }]
      this.appliedTagFilters = []
    },
    applyTagFilters() {
      this.appliedTagFilters = this.tagFilters
        .filter(f => f.name)
        .map(f => ({ name: f.name, value: f.value }))
      this.tagFilterVisible = false
    },
    formatTime(t) {
      if (!t) return '-'
      try {
        const d = new Date(t)
        const p = n => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
      } catch (e) {
        return t
      }
    },
    thumbStyle(item) {
      const palette = [
        'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #06b6d4 100%)',
        'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
        'linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%)',
        'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)',
        'linear-gradient(135deg, #be123c 0%, #f43f5e 100%)'
      ]
      let h = 0
      const s = String(item.skill_id || '')
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % palette.length
      return { background: palette[h] }
    },
    createNew() {
      this.createDialogVisible = true
    },
    resetCreateForm() {
      this.createForm = { name: '', description: '', tags: [], cover: '' }
    },
    addTag() {
      if (this.createForm.tags.length >= 20) {
        this.$message.warning('最多添加 20 个标签')
        return
      }
      this.createForm.tags.push({ name: '', value: '' })
    },
    removeTag(i) {
      this.createForm.tags.splice(i, 1)
    },
    validateTags() {
      const reg = /^[\u4e00-\u9fa5A-Za-z0-9_-]+$/
      const names = []
      for (const t of this.createForm.tags) {
        const name = (t.name || '').trim()
        if (!name) { this.$message.warning('标签名称不能为空'); return false }
        if (!reg.test(name)) { this.$message.warning('标签名称仅支持字母、数字、中文、下划线"_"和连字符"-"'); return false }
        if (names.includes(name)) { this.$message.warning(`标签名称不可重复：${name}`); return false }
        names.push(name)
        const val = (t.value || '').trim()
        if (val && !reg.test(val)) { this.$message.warning('标签内容仅支持字母、数字、中文、下划线"_"和连字符"-"'); return false }
      }
      return true
    },
    pickCover() {
      this.$refs.coverInput && this.$refs.coverInput.click()
    },
    onCoverChange(e) {
      const file = e.target.files && e.target.files[0]
      if (!file) return
      if (!/^image\//.test(file.type)) {
        this.$message.warning('请选择图片文件')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        this.$message.warning('图片大小不能超过 5MB')
        return
      }
      const reader = new FileReader()
      reader.onload = ev => { this.createForm.cover = ev.target.result }
      reader.readAsDataURL(file)
      e.target.value = ''
    },
    async confirmCreate() {
      const name = (this.createForm.name || '').trim()
      if (!name) { this.$message.warning('请输入技能名称'); return }
      if (/\s/.test(this.createForm.name)) { this.$message.warning('技能名称不允许空格'); return }
      if (!/^[\u4e00-\u9fa5A-Za-z0-9]+$/.test(name)) {
        this.$message.warning('技能名称仅支持数字、中文、大小写英文字母，不允许特殊符号')
        return
      }
      if (!this.validateTags()) return
      this.creating = true
      const skillId = 'g' + Date.now()
      const tags = this.createForm.tags.map(t => ({ name: (t.name || '').trim(), value: (t.value || '').trim() }))
      const graphJson = {
        skill_id: skillId,
        skill_name: name,
        nodes: [],
        edges: [],
        tags,
        cover: this.createForm.cover || this.defaultCover
      }
      try {
        await skillGraphAPI.createGraph({
          skill_id: skillId,
          skill_name: name,
          description: this.createForm.description,
          graph_json: graphJson
        })
        this.createDialogVisible = false
        this.$router.push({ path: '/skillManage/skillGraphEditor', query: { skillId } })
      } catch (e) {
        this.$message.error('创建失败：' + ((e.response && e.response.data && e.response.data.detail) || e.message))
      } finally {
        this.creating = false
      }
    },
    edit(row) {
      this.$router.push({ path: '/skillManage/skillGraphEditor', query: { skillId: row.skill_id } })
    },
    async publish(row) {
      try {
        await skillGraphAPI.publishGraph(row.skill_id)
        this.$message.success('已发布')
        this.load()
      } catch (e) {
        this.$message.error('发布失败：' + ((e.response && e.response.data && e.response.data.detail) || e.message))
      }
    },
    async unpublish(row) {
      try {
        await skillGraphAPI.unpublishGraph(row.skill_id)
        this.$message.success('已下线')
        this.load()
      } catch (e) {
        this.$message.error('下线失败')
      }
    },
    async openVersions(row) {
      this.verSkill = row
      this.verDialogVisible = true
      this.verLoading = true
      this.versions = []
      try {
        const res = await skillGraphAPI.listVersions(row.skill_id)
        this.versions = (res.data && res.data.data) || []
        this.verCurrent = res.data && res.data.current_version
      } catch (e) {
        this.$message.error('加载历史版本失败')
      } finally {
        this.verLoading = false
      }
    },
    rollback(ver) {
      this.$confirm(`确认把「${this.verSkill.skill_name}」回滚到 v${ver.version}？回滚也会生成新版本留档。`, '提示', { type: 'warning' }).then(async () => {
        try {
          const res = await skillGraphAPI.rollbackVersion(this.verSkill.skill_id, ver.version)
          this.$message.success((res.data && res.data.message) || '已回滚')
          this.verDialogVisible = false
          this.load()
        } catch (e) {
          this.$message.error('回滚失败：' + ((e.response && e.response.data && e.response.data.detail) || e.message))
        }
      }).catch(() => {})
    },
    async openStats(row) {
      this.statSkill = row
      this.statDialogVisible = true
      this.statLoading = true
      this.stats = null
      try {
        const res = await skillGraphAPI.callStats(row.skill_id)
        this.stats = res.data
      } catch (e) {
        this.$message.error('加载监控数据失败')
      } finally {
        this.statLoading = false
      }
    },
    copyUrl() {
      const ta = document.createElement('textarea')
      ta.value = this.invokeUrl
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); this.$message.success('已复制调用地址') } catch (e) { this.$message.warning('复制失败，请手动复制') }
      document.body.removeChild(ta)
    },
    pct(v) {
      return (Number(v || 0) * 100).toFixed(1) + '%'
    },
    remove(row) {
      this.$confirm(`确认删除技能「${row.skill_name}」?`, '提示', { type: 'warning' }).then(async () => {
        try {
          await skillGraphAPI.deleteGraph(row.skill_id)
          this.$message.success('已删除')
          this.load()
        } catch (e) {
          this.$message.error('删除失败')
        }
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.sg-list-wrapper { width: 100%; height: 100%; }
.sg-list { padding: 16px; background: #f5f7fa; min-height: calc(100vh - 80px); }
.sg-page {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  padding: 16px 20px 8px;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 112px);
}

/* 标题 */
.sg-page-title { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 14px; }

/* 工具栏 */
.sg-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}
.sg-toolbar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sg-toolbar-right { display: flex; align-items: center; gap: 8px; }
.sg-search { width: 240px; }
.sg-select { width: 150px; }
.sg-tag-filter { color: #606266; }
.sg-tag-filter.is-active { color: #2563eb; border-color: #b6d2ff; background: #ecf3ff; }

.sg-view-toggle >>> .el-button { padding: 8px 10px; }
.sg-view-toggle >>> .el-button.is-active {
  background: #ecf3ff;
  color: #2563eb;
  border-color: #b6d2ff;
}
.sg-refresh { padding: 8px 10px; }
.sg-create-btn {
  background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
  border: none;
}
.sg-create-btn:hover { opacity: 0.92; }

/* 卡片容器 */
.sg-cards-container { flex: 1; min-height: 0; }

.sg-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.sg-card {
  position: relative;
  background: #fff;
  border: 1px solid #eef0f4;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
}
.sg-card:hover {
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.14);
  transform: translateY(-3px);
  border-color: #d6e4ff;
}

.sg-card-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 3;
  background: rgba(16, 185, 129, 0.92);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
}

.sg-card-thumb {
  height: 96px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.sg-card-thumb i { font-size: 40px; color: rgba(255, 255, 255, 0.92); }
.sg-card-thumb { overflow: hidden; }
.sg-card-cover { width: 100%; height: 100%; object-fit: contain; display: block; padding: 6px; box-sizing: border-box; background: #f6f8fb; }

.sg-card-head { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.sg-card-name-ic { color: #2563eb; font-size: 15px; flex-shrink: 0; }
.sg-card-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sg-card-idtag {
  flex-shrink: 0;
  font-size: 10px;
  color: #9ca3af;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 0 4px;
  line-height: 16px;
}

.sg-card-desc {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.5;
  height: 18px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin-bottom: 10px;
}

.sg-card-info { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.sg-info-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.sg-info-label { color: #9ca3af; min-width: 28px; }
.sg-info-val { color: #374151; font-weight: 500; }
.sg-status-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
.sg-status-dot.is-on { background: #10b981; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.18); }
.sg-status-dot.is-off { background: #f59e0b; box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.18); }
.sg-status-text { color: #374151; }

.sg-card-foot {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #b0b6be;
  border-top: 1px solid #f3f4f6;
  padding-top: 8px;
}
.sg-card-time {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 悬浮操作条 */
.sg-card-actions {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  display: flex;
  gap: 4px;
  padding: 8px 10px;
  background: linear-gradient(180deg, rgba(255,255,255,0.6) 0%, #fff 40%);
  transform: translateY(100%);
  opacity: 0;
  transition: all 0.25s ease;
  flex-wrap: wrap;
}
.sg-card:hover .sg-card-actions { transform: translateY(0); opacity: 1; }
.sg-card-actions .el-button { margin: 0; padding: 5px 8px; font-size: 11px; }

/* 空状态 */
.sg-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 70px 0;
  color: #9ca3af;
}
.sg-empty-icon { font-size: 56px; color: #d1d5db; margin-bottom: 16px; }
.sg-empty-text { font-size: 16px; font-weight: 600; color: #4b5563; margin-bottom: 6px; }
.sg-empty-tip { font-size: 13px; margin-bottom: 18px; }

/* 分页 */
.sg-pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 0 6px;
  margin-top: auto;
}

.sg-ver-tip { font-size: 12px; color: #909399; line-height: 1.6; margin-bottom: 8px; }
.sg-invoke-url { font-family: monospace; font-size: 12px; background: #f5f7fa; border: 1px solid #ebeef5; border-radius: 4px; padding: 8px; margin-bottom: 6px; word-break: break-all; color: #303133; }
.sg-invoke-url .el-icon-document-copy { cursor: pointer; color: #409eff; margin-left: 6px; }
.sg-invoke-body { color: #909399; }
.sg-metrics { display: flex; gap: 10px; margin: 12px 0; }
.sg-metric { flex: 1; background: #f5f7fa; border-radius: 6px; padding: 12px; text-align: center; }
.sg-metric-v { font-size: 20px; font-weight: bold; color: #409eff; }
.sg-metric-l { font-size: 12px; color: #909399; margin-top: 4px; }

/* 创建技能弹窗 */
.sg-cf-hint { font-size: 12px; color: #9ca3af; line-height: 1.5; margin-top: 6px; }
.sg-tag-rows { display: flex; flex-direction: column; gap: 10px; }
.sg-tag-row { display: flex; align-items: center; gap: 10px; }
.sg-tag-name { width: 200px; }
.sg-tag-value { flex: 1; }
.sg-tag-del { color: #9ca3af; cursor: pointer; font-size: 16px; flex-shrink: 0; }
.sg-tag-del:hover { color: #f56c6c; }
.sg-add-tag { display: block; padding: 6px 0 0; color: #2563eb; text-align: left; }
.sg-cover {
  position: relative;
  width: 210px;
  height: 132px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%);
}
.sg-cover-img { width: 100%; height: 100%; object-fit: contain; display: block; padding: 10px; box-sizing: border-box; }
.sg-cover-ph {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: #b6c2d6;
}
.sg-cover-ph i { font-size: 40px; }
.sg-cover-mask {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 12px;
  text-align: center;
  padding: 4px 0;
}

/* 响应式 */
@media (max-width: 1600px) { .sg-grid { grid-template-columns: repeat(5, 1fr); } }
@media (max-width: 1400px) { .sg-grid { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 1100px) { .sg-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 800px) { .sg-grid { grid-template-columns: repeat(2, 1fr); } }
</style>

<!-- 标签筛选浮层（popover 渲染到 body，需非 scoped 样式） -->
<style>
.sg-tagfilter-popper { padding: 16px 18px !important; border-radius: 10px !important; }
.sg-tagfilter-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.sg-tagfilter-title { font-size: 15px; font-weight: 600; color: #1f2937; }
.sg-tagfilter-clear { color: #2563eb; padding: 0; }
.sg-tagfilter-rows { display: flex; flex-direction: column; gap: 10px; }
.sg-tagfilter-row { display: flex; align-items: center; gap: 10px; }
.sg-tagfilter-row .sg-tf-name { width: 210px; }
.sg-tagfilter-row .sg-tf-value { flex: 1; }
.sg-tagfilter-row .sg-tf-del { color: #9ca3af; cursor: pointer; font-size: 16px; flex-shrink: 0; }
.sg-tagfilter-row .sg-tf-del:hover { color: #f56c6c; }
.sg-tagfilter-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; }
.sg-tagfilter-foot .sg-tf-add { color: #2563eb; padding: 0; }
.sg-tagfilter-foot .sg-tf-query { background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); border: none; padding: 8px 22px; }
</style>

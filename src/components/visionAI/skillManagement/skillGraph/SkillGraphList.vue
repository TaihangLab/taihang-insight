<template>
  <div class="sg-list">
    <div class="sg-list-header">
      <span class="sg-list-title">可视化技能编排</span>
      <el-button type="primary" icon="el-icon-plus" size="small" @click="createNew">新建技能</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border style="width: 100%">
      <el-table-column prop="skill_id" label="技能ID" width="180" />
      <el-table-column prop="skill_name" label="技能名称" />
      <el-table-column prop="version" label="版本" width="80" />
      <el-table-column label="状态" width="100">
        <template slot-scope="s">
          <el-tag :type="s.row.status ? 'success' : 'info'" size="small">
            {{ s.row.status ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="节点数" width="80">
        <template slot-scope="s">{{ nodeCount(s.row) }}</template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新时间" width="180" />
      <el-table-column label="操作" width="350">
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
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const res = await skillGraphAPI.listGraphs()
        this.list = (res.data && res.data.data) || []
      } catch (e) {
        this.$message.error('加载失败')
      } finally {
        this.loading = false
      }
    },
    nodeCount(row) {
      const g = row.graph_json || {}
      return (g.nodes && g.nodes.length) || 0
    },
    createNew() {
      this.$router.push('/skillManage/skillGraphEditor')
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
.sg-list { padding: 16px; }
.sg-list-header { display: flex; align-items: center; margin-bottom: 16px; }
.sg-list-title { font-size: 18px; font-weight: bold; margin-right: auto; }
.sg-ver-tip { font-size: 12px; color: #909399; line-height: 1.6; margin-bottom: 8px; }
.sg-invoke-url { font-family: monospace; font-size: 12px; background: #f5f7fa; border: 1px solid #ebeef5; border-radius: 4px; padding: 8px; margin-bottom: 6px; word-break: break-all; color: #303133; }
.sg-invoke-url .el-icon-document-copy { cursor: pointer; color: #409eff; margin-left: 6px; }
.sg-invoke-body { color: #909399; }
.sg-metrics { display: flex; gap: 10px; margin: 12px 0; }
.sg-metric { flex: 1; background: #f5f7fa; border-radius: 6px; padding: 12px; text-align: center; }
.sg-metric-v { font-size: 20px; font-weight: bold; color: #409eff; }
.sg-metric-l { font-size: 12px; color: #909399; margin-top: 4px; }
</style>

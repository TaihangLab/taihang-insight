<!--
  开放 API 管理页（管理员）
  ==================================================
  三个页签：
  - API 密钥：创建 / 编辑 / 启停 / 删除 Key；创建后明文只弹一次
  - 资源目录：已发布的技能图 / LLM 技能 / 模型 + 一键复制 curl / python 调用示例
  - 调用日志：对外调用记录（按 Key / 资源类型过滤）
-->
<template>
  <div class="asset-page api-key-page">
    <div class="asset-page-header">
      <div class="asset-page-header__main">
        <div class="asset-page-title-row">
          <div class="asset-page-icon asset-page-icon--user">
            <i class="el-icon-key" />
          </div>
          <h2 class="asset-page-title">开放 API</h2>
        </div>
        <p class="asset-page-desc">
          把已发布的模型、技能编排、多模态技能以 REST 接口开放给外部系统。外部系统凭 API Key 调用
          <code>{{ overview.prefix }}</code>，每分钟限流、按 Key 授权、全量调用日志。
        </p>
      </div>
      <div class="asset-page-header__actions">
        <el-button icon="el-icon-refresh" size="small" @click="reloadAll">刷新</el-button>
        <el-button type="primary" icon="el-icon-plus" size="small" @click="openCreate">新建密钥</el-button>
      </div>
    </div>

    <div class="asset-stat-row">
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--total"><i class="el-icon-key" /></div>
        <div>
          <div class="asset-stat-card__value">{{ overview.keys.active }} / {{ overview.keys.total }}</div>
          <div class="asset-stat-card__label">启用密钥 / 总数</div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--online"><i class="el-icon-share" /></div>
        <div>
          <div class="asset-stat-card__value">{{ overview.resources.published }}</div>
          <div class="asset-stat-card__label">已发布资源</div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--idle"><i class="el-icon-data-line" /></div>
        <div>
          <div class="asset-stat-card__value">{{ overview.calls.today }}</div>
          <div class="asset-stat-card__label">今日调用</div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--offline"><i class="el-icon-timer" /></div>
        <div>
          <div class="asset-stat-card__value">{{ overview.calls.avg_latency_ms }} ms</div>
          <div class="asset-stat-card__label">平均耗时（成功率 {{ successRateText }}）</div>
        </div>
      </div>
    </div>

    <div class="asset-main">
      <el-tabs v-model="activeTab" class="api-key-tabs">
        <!-- ================= 密钥 ================= -->
        <el-tab-pane label="API 密钥" name="keys">
          <div class="asset-table-wrap api-key-table-wrap">
            <el-table :data="keys" v-loading="loadingKeys" height="100%" stripe>
              <el-table-column prop="name" label="名称" min-width="140" />
              <el-table-column label="密钥" width="170">
                <template slot-scope="scope">
                  <code class="key-prefix">{{ scope.row.key_prefix }}…</code>
                </template>
              </el-table-column>
              <el-table-column label="授权资源" min-width="220">
                <template slot-scope="scope">
                  <span v-if="!scope.row.allowed_resources || !scope.row.allowed_resources.length" class="muted">
                    全部已发布资源
                  </span>
                  <template v-else>
                    <el-tag v-for="r in scope.row.allowed_resources.slice(0, 3)" :key="r" size="mini" class="res-tag">
                      {{ resourceLabel(r) }}
                    </el-tag>
                    <span v-if="scope.row.allowed_resources.length > 3" class="muted">
                      +{{ scope.row.allowed_resources.length - 3 }}
                    </span>
                  </template>
                </template>
              </el-table-column>
              <el-table-column label="限流/分钟" width="100">
                <template slot-scope="scope">
                  {{ scope.row.rate_limit_per_minute === null || scope.row.rate_limit_per_minute === undefined
                    ? '默认' : (scope.row.rate_limit_per_minute === 0 ? '不限' : scope.row.rate_limit_per_minute) }}
                </template>
              </el-table-column>
              <el-table-column label="调用次数" width="100" prop="call_count" />
              <el-table-column label="最近使用" min-width="160">
                <template slot-scope="scope">{{ formatTime(scope.row.last_used_at) }}</template>
              </el-table-column>
              <el-table-column label="到期" min-width="160">
                <template slot-scope="scope">
                  <span :class="{ expired: isExpired(scope.row) }">{{ scope.row.expires_at ? formatTime(scope.row.expires_at) : '永久' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="90">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.is_active && !isExpired(scope.row) ? 'success' : 'info'" size="mini">
                    {{ isExpired(scope.row) ? '已过期' : (scope.row.is_active ? '启用' : '停用') }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="230" fixed="right">
                <template slot-scope="scope">
                  <el-button type="text" size="mini" @click="openStats(scope.row)">统计</el-button>
                  <el-button type="text" size="mini" @click="openEdit(scope.row)">编辑</el-button>
                  <el-button type="text" size="mini" @click="toggleActive(scope.row)">
                    {{ scope.row.is_active ? '停用' : '启用' }}
                  </el-button>
                  <el-button type="text" size="mini" class="danger-text" @click="removeKey(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- ================= 资源目录 ================= -->
        <el-tab-pane label="资源目录 / 调用示例" name="resources">
          <div class="asset-toolbar">
            <div class="asset-toolbar__left">
              <el-radio-group v-model="resourceFilter" size="small">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="skill_graph">技能编排</el-radio-button>
                <el-radio-button label="llm_skill">多模态技能</el-radio-button>
                <el-radio-button label="model">模型</el-radio-button>
              </el-radio-group>
              <el-checkbox v-model="onlyPublished" style="margin-left: 16px">只看已发布</el-checkbox>
            </div>
            <div class="muted">服务地址：<code>{{ resourceBaseUrl }}</code></div>
          </div>
          <div class="asset-table-wrap api-key-table-wrap">
            <el-table :data="filteredResources" v-loading="loadingResources" height="100%" stripe>
              <el-table-column label="类型" width="110">
                <template slot-scope="scope">
                  <el-tag size="mini" :type="typeTagType(scope.row.resource_type)">{{ typeLabel(scope.row.resource_type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="名称" min-width="160" />
              <el-table-column prop="resource_id" label="标识" min-width="160">
                <template slot-scope="scope"><code>{{ scope.row.resource_id }}</code></template>
              </el-table-column>
              <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
              <el-table-column label="发布状态" width="100">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.published ? 'success' : 'info'" size="mini">
                    {{ scope.row.published ? '已发布' : '未发布' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="接口" min-width="260" show-overflow-tooltip>
                <template slot-scope="scope"><code>POST {{ scope.row.example.url }}</code></template>
              </el-table-column>
              <el-table-column label="操作" width="110" fixed="right">
                <template slot-scope="scope">
                  <el-button type="text" size="mini" @click="openExample(scope.row)">调用示例</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- ================= 调用日志 ================= -->
        <el-tab-pane label="调用日志" name="logs">
          <div class="asset-toolbar">
            <div class="asset-toolbar__left">
              <el-select v-model="logFilter.api_key_id" size="small" clearable placeholder="全部密钥" style="width: 200px" @change="loadLogs(1)">
                <el-option v-for="k in keys" :key="k.id" :label="k.name + '（' + k.key_prefix + '…）'" :value="k.id" />
              </el-select>
              <el-select v-model="logFilter.resource_type" size="small" clearable placeholder="全部类型" style="width: 150px; margin-left: 8px" @change="loadLogs(1)">
                <el-option label="技能编排" value="skill_graph" />
                <el-option label="多模态技能" value="llm_skill" />
                <el-option label="模型" value="model" />
              </el-select>
            </div>
          </div>
          <div class="asset-table-wrap api-key-table-wrap">
            <el-table :data="logs.items" v-loading="loadingLogs" height="100%" stripe>
              <el-table-column label="时间" min-width="160">
                <template slot-scope="scope">{{ formatTime(scope.row.created_at) }}</template>
              </el-table-column>
              <el-table-column label="密钥" min-width="140">
                <template slot-scope="scope">{{ keyName(scope.row.api_key_id) }}</template>
              </el-table-column>
              <el-table-column label="类型" width="110">
                <template slot-scope="scope">
                  <el-tag size="mini" :type="typeTagType(scope.row.resource_type)">{{ typeLabel(scope.row.resource_type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="resource_id" label="资源" min-width="160" />
              <el-table-column label="结果" width="90">
                <template slot-scope="scope">
                  <el-tag :type="scope.row.success ? 'success' : 'danger'" size="mini">{{ scope.row.success ? '成功' : '失败' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="触发告警" width="90">
                <template slot-scope="scope">
                  <span v-if="scope.row.triggered === null || scope.row.triggered === undefined" class="muted">-</span>
                  <el-tag v-else :type="scope.row.triggered ? 'warning' : 'info'" size="mini">{{ scope.row.triggered ? '是' : '否' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="latency_ms" label="耗时(ms)" width="100" />
              <el-table-column prop="client_ip" label="来源 IP" min-width="130" />
              <el-table-column prop="source" label="来源标识" min-width="120" />
              <el-table-column prop="error" label="错误" min-width="200" show-overflow-tooltip />
            </el-table>
          </div>
          <div class="api-key-pager">
            <el-pagination
              layout="total, prev, pager, next"
              :total="logs.total"
              :page-size="logs.limit"
              :current-page="logs.page"
              @current-change="loadLogs"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 新建 / 编辑密钥 -->
    <el-dialog :title="dialogMode === 'create' ? '新建 API 密钥' : '编辑 API 密钥'" :visible.sync="dialogVisible" width="560px">
      <el-form ref="keyForm" :model="form" :rules="formRules" label-width="110px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：园区综合管理平台" />
        </el-form-item>
        <el-form-item label="授权资源">
          <el-select v-model="form.allowed_resources" multiple filterable clearable style="width: 100%"
            placeholder="不选 = 可调用全部已发布资源">
            <el-option-group v-for="g in resourceGroups" :key="g.type" :label="g.label">
              <el-option :label="'全部' + g.label" :value="g.type + ':*'" />
              <el-option v-for="r in g.items" :key="r.key" :label="r.name + '（' + r.resource_id + '）'" :value="r.key">
                <span>{{ r.name }}</span>
                <span class="muted" style="float: right; font-size: 12px">{{ r.resource_id }}{{ r.published ? '' : '（未发布）' }}</span>
              </el-option>
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="限流（次/分钟）">
          <el-input-number v-model="form.rate_limit_per_minute" :min="0" :step="10" controls-position="right" style="width: 180px" />
          <span class="muted" style="margin-left: 8px">留空 = 系统默认；0 = 不限</span>
        </el-form-item>
        <el-form-item label="有效期（天）">
          <el-input-number v-model="form.expires_in_days" :min="0" :max="3650" controls-position="right" style="width: 180px" />
          <span class="muted" style="margin-left: 8px">{{ dialogMode === 'create' ? '留空 = 永久' : '0 = 改为永久；留空 = 不改' }}</span>
        </el-form-item>
        <el-form-item v-if="dialogMode === 'edit'" label="状态">
          <el-switch v-model="form.is_active" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitKey">确定</el-button>
      </span>
    </el-dialog>

    <!-- 明文只显示一次 -->
    <el-dialog title="密钥已创建" :visible.sync="plainVisible" width="560px" :close-on-click-modal="false" :show-close="false">
      <el-alert type="warning" :closable="false" show-icon title="请立即复制保存，关闭后无法再次查看明文；丢失只能重新创建。" />
      <div class="plain-key-box">
        <code>{{ plainKey }}</code>
        <el-button size="mini" icon="el-icon-document-copy" @click="copyText(plainKey)">复制</el-button>
      </div>
      <p class="muted">调用时放在请求头：<code>X-API-Key: {{ plainKey.slice(0, 12) }}…</code></p>
      <span slot="footer">
        <el-button type="primary" @click="plainVisible = false">我已保存</el-button>
      </span>
    </el-dialog>

    <!-- 调用示例 -->
    <el-dialog :title="'调用示例：' + (exampleRow.name || '')" :visible.sync="exampleVisible" width="720px">
      <div v-if="exampleRow.example">
        <el-alert v-if="!exampleRow.published" type="info" :closable="false" show-icon
          title="该资源尚未发布，外部调用会返回 403。请先在对应管理页发布。" style="margin-bottom: 12px" />
        <div class="example-block">
          <div class="example-block__head">
            <span>curl</span>
            <el-button type="text" size="mini" icon="el-icon-document-copy" @click="copyText(exampleRow.example.curl)">复制</el-button>
          </div>
          <pre>{{ exampleRow.example.curl }}</pre>
        </div>
        <div class="example-block">
          <div class="example-block__head">
            <span>Python</span>
            <el-button type="text" size="mini" icon="el-icon-document-copy" @click="copyText(exampleRow.example.python)">复制</el-button>
          </div>
          <pre>{{ exampleRow.example.python }}</pre>
        </div>
        <div class="example-block">
          <div class="example-block__head"><span>响应说明</span></div>
          <pre>{{ responseHint(exampleRow.resource_type) }}</pre>
        </div>
      </div>
    </el-dialog>

    <!-- 某 Key 统计 -->
    <el-drawer :title="'调用统计：' + (statsKey.name || '')" :visible.sync="statsVisible" size="560px">
      <div class="stats-body" v-loading="loadingStats">
        <div class="asset-stat-row stats-row">
          <div class="asset-stat-card"><div><div class="asset-stat-card__value">{{ stats.metrics.total }}</div><div class="asset-stat-card__label">累计调用</div></div></div>
          <div class="asset-stat-card"><div><div class="asset-stat-card__value">{{ stats.metrics.today }}</div><div class="asset-stat-card__label">今日调用</div></div></div>
          <div class="asset-stat-card"><div><div class="asset-stat-card__value">{{ (stats.metrics.success_rate * 100).toFixed(1) }}%</div><div class="asset-stat-card__label">成功率</div></div></div>
          <div class="asset-stat-card"><div><div class="asset-stat-card__value">{{ stats.metrics.avg_latency_ms }}</div><div class="asset-stat-card__label">平均耗时 ms</div></div></div>
        </div>
        <el-table :data="stats.recent" size="mini" stripe max-height="520">
          <el-table-column label="时间" min-width="150">
            <template slot-scope="scope">{{ formatTime(scope.row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="资源" min-width="150">
            <template slot-scope="scope">{{ typeLabel(scope.row.resource_type) }} / {{ scope.row.resource_id }}</template>
          </el-table-column>
          <el-table-column label="结果" width="70">
            <template slot-scope="scope">
              <el-tag :type="scope.row.success ? 'success' : 'danger'" size="mini">{{ scope.row.success ? '成功' : '失败' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="latency_ms" label="ms" width="70" />
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import '../deviceManagement/asset-page.css'
import { openApiAPI } from '../../service/VisionAIService'

// 资源类型 → 中文
const TYPE_LABELS = { skill_graph: '技能编排', llm_skill: '多模态技能', model: '模型' }

export default {
  name: 'ApiKeyManage',
  data() {
    return {
      activeTab: 'keys',
      loadingKeys: false,
      loadingResources: false,
      loadingLogs: false,
      loadingStats: false,
      submitting: false,
      overview: {
        prefix: '/api/open/v1',
        keys: { total: 0, active: 0 },
        resources: { total: 0, published: 0, by_type: {} },
        calls: { total: 0, today: 0, success_rate: 0, avg_latency_ms: 0 }
      },
      keys: [],
      resources: [],
      resourceBaseUrl: '',
      resourceFilter: 'all',
      onlyPublished: false,
      logs: { items: [], total: 0, page: 1, limit: 20 },
      logFilter: { api_key_id: null, resource_type: null },
      dialogVisible: false,
      dialogMode: 'create',
      editingId: null,
      form: this.emptyForm(),
      formRules: {
        name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
      },
      plainVisible: false,
      plainKey: '',
      exampleVisible: false,
      exampleRow: {},
      statsVisible: false,
      statsKey: {},
      stats: { metrics: { total: 0, today: 0, success_rate: 0, avg_latency_ms: 0 }, recent: [] }
    }
  },
  computed: {
    // 成功率文本
    successRateText() {
      const r = Number(this.overview.calls.success_rate || 0)
      return (r * 100).toFixed(1) + '%'
    },
    // 资源目录页签筛选
    filteredResources() {
      return (this.resources || []).filter((r) => {
        if (this.resourceFilter !== 'all' && r.resource_type !== this.resourceFilter) return false
        if (this.onlyPublished && !r.published) return false
        return true
      })
    },
    // 授权选择器分组
    resourceGroups() {
      return ['skill_graph', 'llm_skill', 'model'].map((t) => ({
        type: t,
        label: TYPE_LABELS[t],
        items: (this.resources || []).filter((r) => r.resource_type === t)
      }))
    }
  },
  created() {
    this.reloadAll()
  },
  methods: {
    // 表单初始值
    emptyForm() {
      return {
        name: '',
        allowed_resources: [],
        rate_limit_per_minute: undefined,
        expires_in_days: undefined,
        is_active: true,
        remark: ''
      }
    },
    // 从 axios 错误里取后端 detail
    apiError(e, fallback) {
      const detail = e && e.response && e.response.data && e.response.data.detail
      return (typeof detail === 'string' && detail) ? detail : fallback
    },
    formatTime(value) {
      if (!value) return '-'
      return String(value).replace('T', ' ').slice(0, 19)
    },
    isExpired(row) {
      return !!(row.expires_at && new Date(row.expires_at).getTime() < Date.now())
    },
    typeLabel(t) {
      return TYPE_LABELS[t] || t
    },
    typeTagType(t) {
      return t === 'model' ? 'warning' : (t === 'llm_skill' ? 'success' : '')
    },
    // "skill_graph:xxx" → "技能编排:xxx"
    resourceLabel(r) {
      const idx = String(r).indexOf(':')
      if (idx < 0) return r
      return this.typeLabel(r.slice(0, idx)) + ':' + r.slice(idx + 1)
    },
    keyName(id) {
      if (id === null || id === undefined) return '（登录用户）'
      const k = this.keys.find((x) => x.id === id)
      return k ? k.name : '#' + id + '（已删除）'
    },
    // 各资源类型的响应字段说明
    responseHint(type) {
      if (type === 'model') {
        return '{ success, latency_ms, model_name, image_size:{width,height}, count,\n  detections:[{ bbox:[x1,y1,x2,y2], confidence, class_id, class_name }] }'
      }
      if (type === 'llm_skill') {
        return '{ success, latency_ms, skill_id, skill_name, triggered,\n  output:{ <输出参数名>: 值 }, raw_response }'
      }
      return '{ success, latency_ms, skill_id, skill_name, triggered,\n  messages:[告警文本], results:[各结束节点结果] }'
    },
    // 复制到剪贴板（兼容非 https 场景）
    copyText(text) {
      const done = () => this.$message.success('已复制')
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done).catch(() => this.fallbackCopy(text, done))
      } else {
        this.fallbackCopy(text, done)
      }
    },
    fallbackCopy(text, done) {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); done() } catch (e) { this.$message.error('复制失败，请手动复制') }
      document.body.removeChild(ta)
    },

    // ==== 加载 ====
    reloadAll() {
      this.loadOverview()
      this.loadKeys()
      this.loadResources()
      this.loadLogs(1)
    },
    loadOverview() {
      openApiAPI.getOverview().then((res) => {
        const d = res.data || {}
        this.overview = {
          prefix: this.overview.prefix,
          keys: d.keys || this.overview.keys,
          resources: d.resources || this.overview.resources,
          calls: d.calls || this.overview.calls
        }
      }).catch(() => {})
    },
    loadKeys() {
      this.loadingKeys = true
      openApiAPI.listKeys().then((res) => {
        this.keys = Array.isArray(res.data) ? res.data : []
      }).catch((e) => {
        this.$message.error(this.apiError(e, '加载密钥失败'))
      }).finally(() => { this.loadingKeys = false })
    },
    loadResources() {
      this.loadingResources = true
      openApiAPI.listResources().then((res) => {
        const d = res.data || {}
        this.resources = d.items || []
        this.resourceBaseUrl = d.base_url || ''
        if (d.open_api_prefix) this.overview.prefix = d.open_api_prefix
      }).catch((e) => {
        this.$message.error(this.apiError(e, '加载资源目录失败'))
      }).finally(() => { this.loadingResources = false })
    },
    loadLogs(page) {
      this.loadingLogs = true
      const params = { page: page || 1, limit: this.logs.limit }
      if (this.logFilter.api_key_id) params.api_key_id = this.logFilter.api_key_id
      if (this.logFilter.resource_type) params.resource_type = this.logFilter.resource_type
      openApiAPI.listLogs(params).then((res) => {
        const d = res.data || {}
        this.logs = { items: d.items || [], total: d.total || 0, page: d.page || 1, limit: d.limit || 20 }
      }).catch((e) => {
        this.$message.error(this.apiError(e, '加载日志失败'))
      }).finally(() => { this.loadingLogs = false })
    },

    // ==== 密钥 CRUD ====
    openCreate() {
      this.dialogMode = 'create'
      this.editingId = null
      this.form = this.emptyForm()
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.keyForm && this.$refs.keyForm.clearValidate())
    },
    openEdit(row) {
      this.dialogMode = 'edit'
      this.editingId = row.id
      this.form = {
        name: row.name,
        allowed_resources: row.allowed_resources ? row.allowed_resources.slice() : [],
        rate_limit_per_minute: row.rate_limit_per_minute === null ? undefined : row.rate_limit_per_minute,
        expires_in_days: undefined,
        is_active: !!row.is_active,
        remark: row.remark || ''
      }
      this.dialogVisible = true
    },
    submitKey() {
      this.$refs.keyForm.validate((ok) => {
        if (!ok) return
        this.submitting = true
        const payload = {
          name: this.form.name,
          allowed_resources: this.form.allowed_resources && this.form.allowed_resources.length ? this.form.allowed_resources : null,
          rate_limit_per_minute: this.form.rate_limit_per_minute === undefined ? null : this.form.rate_limit_per_minute,
          remark: this.form.remark || null
        }
        let req
        if (this.dialogMode === 'create') {
          if (this.form.expires_in_days) payload.expires_in_days = this.form.expires_in_days
          req = openApiAPI.createKey(payload).then((res) => {
            const d = (res.data && res.data.data) || {}
            this.plainKey = d.plain_key || ''
            this.plainVisible = !!this.plainKey
          })
        } else {
          if (this.form.expires_in_days !== undefined && this.form.expires_in_days !== null) {
            payload.expires_in_days = this.form.expires_in_days
          }
          payload.is_active = this.form.is_active
          req = openApiAPI.updateKey(this.editingId, payload)
        }
        req.then(() => {
          this.$message.success(this.dialogMode === 'create' ? '密钥已创建' : '密钥已更新')
          this.dialogVisible = false
          this.loadKeys()
          this.loadOverview()
        }).catch((e) => {
          this.$message.error(this.apiError(e, '保存失败'))
        }).finally(() => { this.submitting = false })
      })
    },
    toggleActive(row) {
      const next = !row.is_active
      openApiAPI.updateKey(row.id, { is_active: next }).then(() => {
        this.$message.success(next ? '已启用' : '已停用')
        this.loadKeys()
        this.loadOverview()
      }).catch((e) => {
        this.$message.error(this.apiError(e, '操作失败'))
      })
    },
    removeKey(row) {
      this.$confirm(`删除后使用「${row.name}」的外部系统将立即无法调用，确认删除？`, '删除密钥', {
        type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消'
      }).then(() => {
        return openApiAPI.deleteKey(row.id).then(() => {
          this.$message.success('已删除')
          this.loadKeys()
          this.loadOverview()
        }).catch((e) => {
          this.$message.error(this.apiError(e, '删除失败'))
        })
      }).catch(() => {})
    },

    // ==== 示例 / 统计 ====
    openExample(row) {
      this.exampleRow = row
      this.exampleVisible = true
    },
    openStats(row) {
      this.statsKey = row
      this.statsVisible = true
      this.loadingStats = true
      openApiAPI.getKeyStats(row.id, 30).then((res) => {
        const d = res.data || {}
        this.stats = { metrics: d.metrics || this.stats.metrics, recent: d.recent || [] }
      }).catch((e) => {
        this.$message.error(this.apiError(e, '加载统计失败'))
      }).finally(() => { this.loadingStats = false })
    }
  }
}
</script>

<style scoped>
.api-key-page .asset-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.api-key-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.api-key-tabs >>> .el-tabs__content {
  flex: 1;
  min-height: 0;
}
.api-key-tabs >>> .el-tab-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.api-key-table-wrap {
  flex: 1;
  min-height: 0;
}
.api-key-pager {
  padding: 8px 0 0;
  text-align: right;
}
.key-prefix,
.plain-key-box code,
.asset-page-desc code {
  font-family: Consolas, Menlo, monospace;
  background: #f4f6fa;
  padding: 2px 6px;
  border-radius: 4px;
  color: #303133;
}
.res-tag {
  margin-right: 4px;
}
.muted {
  color: #909399;
  font-size: 12px;
}
.expired {
  color: #f56c6c;
}
.danger-text {
  color: #f56c6c;
}
.plain-key-box {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0 8px;
  padding: 12px;
  background: #f4f6fa;
  border-radius: 6px;
  word-break: break-all;
}
.plain-key-box code {
  flex: 1;
  font-size: 14px;
  background: transparent;
  padding: 0;
}
.example-block {
  margin-bottom: 14px;
}
.example-block__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}
.example-block pre {
  margin: 0;
  padding: 10px 12px;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
.stats-body {
  padding: 0 16px 16px;
}
.stats-row {
  margin-bottom: 12px;
}
</style>

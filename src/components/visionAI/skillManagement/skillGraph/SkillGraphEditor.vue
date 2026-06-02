<template>
  <div class="sg-editor">
    <!-- 顶部工具栏 -->
    <div class="sg-toolbar">
      <el-button icon="el-icon-back" size="small" @click="goBack">返回</el-button>
      <el-input v-model="skillName" size="small" placeholder="技能名称" style="width: 200px; margin: 0 8px;" />
      <el-input v-model="skillId" size="small" placeholder="技能ID(英文)" :disabled="isEdit" style="width: 160px;" />
      <div class="sg-toolbar-right">
        <el-button-group style="margin-right:8px">
          <el-button size="small" icon="el-icon-zoom-in" title="放大" @click="zoom(true)" />
          <el-button size="small" icon="el-icon-zoom-out" title="缩小" @click="zoom(false)" />
          <el-button size="small" icon="el-icon-rank" title="适应画布" @click="fitView" />
        </el-button-group>
        <el-button size="small" @click="doValidate">校验</el-button>
        <el-button size="small" type="primary" @click="doTestRun">试跑</el-button>
        <el-button size="small" @click="openEval">评测</el-button>
        <el-button size="small" type="success" @click="doSave">保存草稿</el-button>
        <el-button size="small" type="warning" @click="doPublish" :disabled="!isEdit">发布</el-button>
      </div>
    </div>

    <div class="sg-body">
      <!-- 左侧：节点面板 -->
      <div class="sg-palette">
        <div class="sg-palette-title">节点面板</div>
        <div v-for="(group, cat) in groupedNodeTypes" :key="cat" class="sg-palette-group">
          <div class="sg-palette-cat">{{ categoryName(cat) }}</div>
          <div
            v-for="nt in group"
            :key="nt.type"
            class="sg-palette-item"
            :title="nt.description"
            @click="addNode(nt)"
          >
            <i class="el-icon-plus"></i> {{ nt.name_zh }}
          </div>
        </div>
        <div class="sg-tip">点击节点添加到画布；拖动节点连接线即可串联。</div>
      </div>

      <!-- 中间：画布 -->
      <div ref="canvas" class="sg-canvas"></div>

      <!-- 右侧：配置面板 -->
      <div class="sg-config">
        <div class="sg-config-title">{{ selectedNode ? '节点配置' : '请选择一个节点' }}</div>
        <div v-if="selectedNode" class="sg-config-body">
          <el-form label-position="top" size="small">
            <el-form-item label="节点名称">
              <el-input v-model="form._name" @change="applyConfig" />
            </el-form-item>

            <!-- 视觉模型 -->
            <template v-if="selectedType === 'detection_model'">
              <el-form-item label="检测模型名">
                <el-input v-model="form.model_name" placeholder="如 coco_detector" @change="applyConfig" />
              </el-form-item>
              <el-form-item label="目标类别(逗号分隔)">
                <el-input v-model="form.target_classes" placeholder="如 person,car" @change="applyConfig" />
              </el-form-item>
              <el-form-item label="置信度阈值">
                <el-input-number v-model="form.confidence_threshold" :min="0" :max="1" :step="0.05" @change="applyConfig" />
              </el-form-item>
            </template>

            <!-- 多模态大模型 -->
            <template v-else-if="selectedType === 'vlm_model'">
              <el-form-item label="系统提示词">
                <el-input v-model="form.system_prompt" type="textarea" :rows="2" @change="applyConfig" />
              </el-form-item>
              <el-form-item label="用户提示词(分析指令)">
                <el-input v-model="form.prompt" type="textarea" :rows="4" @change="applyConfig" />
              </el-form-item>
              <el-form-item label="输出参数(JSON数组)">
                <el-input v-model="form.output_parameters_text" type="textarea" :rows="4"
                          placeholder='[{"name":"has_helmet","type":"boolean","description":"是否戴安全帽"}]'
                          @change="applyConfig" />
              </el-form-item>
            </template>

            <!-- 区域过滤 -->
            <template v-else-if="selectedType === 'region_filter'">
              <el-form-item label="过滤模式">
                <el-select v-model="form.trigger_mode" @change="applyConfig">
                  <el-option label="只保留围栏内" value="inside" />
                  <el-option label="只保留围栏外" value="outside" />
                </el-select>
              </el-form-item>
            </template>

            <!-- 尺寸过滤 -->
            <template v-else-if="selectedType === 'size_filter'">
              <el-form-item label="最小宽度(px)">
                <el-input-number v-model="form.min_width" :min="0" @change="applyConfig" />
              </el-form-item>
              <el-form-item label="最大宽度(px)">
                <el-input-number v-model="form.max_width" :min="0" @change="applyConfig" />
              </el-form-item>
              <el-form-item label="最小高度(px)">
                <el-input-number v-model="form.min_height" :min="0" @change="applyConfig" />
              </el-form-item>
              <el-form-item label="最大高度(px)">
                <el-input-number v-model="form.max_height" :min="0" @change="applyConfig" />
              </el-form-item>
            </template>

            <!-- 相交 -->
            <template v-else-if="selectedType === 'intersect'">
              <el-form-item label="IoU计算方式">
                <el-select v-model="form.iou_mode" @change="applyConfig">
                  <el-option label="并集" value="union" />
                  <el-option label="较小框" value="min" />
                  <el-option label="较大框" value="max" />
                </el-select>
              </el-form-item>
              <el-form-item label="IoU阈值">
                <el-input-number v-model="form.iou_threshold" :min="0" :max="1" :step="0.05" @change="applyConfig" />
              </el-form-item>
            </template>

            <!-- 越线检测 -->
            <template v-else-if="selectedType === 'line_crossing'">
              <el-form-item label="线段起点 (0~1)">
                <div style="display:flex;gap:6px">
                  <el-input-number v-model="form.lx1" :min="0" :max="1" :step="0.05" :precision="2" size="mini" @change="applyConfig" />
                  <el-input-number v-model="form.ly1" :min="0" :max="1" :step="0.05" :precision="2" size="mini" @change="applyConfig" />
                </div>
              </el-form-item>
              <el-form-item label="线段终点 (0~1)">
                <div style="display:flex;gap:6px">
                  <el-input-number v-model="form.lx2" :min="0" :max="1" :step="0.05" :precision="2" size="mini" @change="applyConfig" />
                  <el-input-number v-model="form.ly2" :min="0" :max="1" :step="0.05" :precision="2" size="mini" @change="applyConfig" />
                </div>
              </el-form-item>
              <el-form-item label="允许方向">
                <el-select v-model="form.direction" @change="applyConfig">
                  <el-option label="双向" value="both" />
                  <el-option label="正向(A→B)" value="ab" />
                  <el-option label="反向(B→A)" value="ba" />
                </el-select>
              </el-form-item>
              <div class="sg-tip">坐标为画面比例(0~1)；越线检测需上游目标带跟踪ID。</div>
            </template>

            <!-- 距离检测 -->
            <template v-else-if="selectedType === 'distance'">
              <el-form-item label="距离阈值(像素)">
                <el-input-number v-model="form.max_distance" :min="0" @change="applyConfig" />
              </el-form-item>
              <div class="sg-tip">两组目标中心距离小于阈值即配对，需连入 targets1 / targets2 两组检测。</div>
            </template>

            <!-- 停留检测 -->
            <template v-else-if="selectedType === 'dwell'">
              <el-form-item label="停留时长(秒)">
                <el-input-number v-model="form.min_seconds" :min="0" @change="applyConfig" />
              </el-form-item>
              <el-form-item label="最大位移(像素)">
                <el-input-number v-model="form.max_move" :min="0" @change="applyConfig" />
              </el-form-item>
              <div class="sg-tip">目标在最大位移内停留超过设定时长即触发，需上游目标带跟踪ID。</div>
            </template>

            <!-- 判断节点 -->
            <template v-else-if="selectedType === 'judge'">
              <el-form-item label="条件组之间的关系">
                <el-select v-model="form.global_relation" @change="applyConfig">
                  <el-option label="满足任一条件组(或)" value="or" />
                  <el-option label="满足所有条件组(且)" value="and" />
                </el-select>
              </el-form-item>
              <div v-for="(grp, gi) in form.groups" :key="gi" class="sg-cond-group">
                <div class="sg-cond-group-head">
                  <span>条件组 {{ gi + 1 }}</span>
                  <el-select v-model="grp.relation" size="mini" style="width:96px" @change="applyConfig">
                    <el-option label="全部(且)" value="all" />
                    <el-option label="任一(或)" value="any" />
                    <el-option label="全不(非)" value="not" />
                  </el-select>
                  <el-button icon="el-icon-close" size="mini" circle title="删除该组" @click="removeGroup(gi)" />
                </div>
                <div v-for="(c, ci) in grp.conditions" :key="ci" class="sg-cond-row">
                  <el-input v-model="c.field" placeholder="字段" style="width:78px" @change="applyConfig" />
                  <el-select v-model="c.operator" style="width:80px" @change="applyConfig">
                    <el-option v-for="op in operators" :key="op.v" :label="op.l" :value="op.v" />
                  </el-select>
                  <el-input v-model="c.value" placeholder="值" style="width:56px" @change="applyConfig" />
                  <el-button icon="el-icon-delete" size="mini" circle @click="removeCond(gi, ci)" />
                </div>
                <el-button size="mini" icon="el-icon-plus" @click="addCond(gi)">条件</el-button>
              </div>
              <el-button size="mini" type="primary" plain icon="el-icon-plus" style="margin-top:6px" @click="addGroup">添加条件组</el-button>
              <el-form-item label="持续时间(秒)" style="margin-top:8px">
                <el-input-number v-model="form.duration" :min="0" @change="applyConfig" />
              </el-form-item>
              <el-form-item label="缓冲时间(秒)">
                <el-input-number v-model="form.buffer" :min="0" @change="applyConfig" />
              </el-form-item>
              <div class="sg-tip">字段名 = 上游连到本节点的端口名（如计数节点连进来用 count）</div>
            </template>

            <!-- 结束节点 -->
            <template v-else-if="selectedType === 'end'">
              <el-form-item label="告警文本(可用{字段}占位)">
                <el-input v-model="form.message" type="textarea" :rows="2"
                          placeholder="如 围栏内聚集 {count} 人" @change="applyConfig" />
              </el-form-item>
            </template>

            <!-- 开始节点 -->
            <template v-else-if="selectedType === 'start'">
              <div class="sg-tip">开始节点输出当前帧图像与电子围栏，无需配置。</div>
            </template>

            <el-button type="danger" size="mini" icon="el-icon-delete" style="margin-top:12px"
                       @click="deleteSelected">删除此节点</el-button>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 试跑结果 -->
    <el-dialog title="试跑结果" :visible.sync="testDialogVisible" width="600px" append-to-body>
      <pre class="sg-result">{{ testResultText }}</pre>
    </el-dialog>

    <!-- 效果评测 -->
    <el-dialog title="效果评测" :visible.sync="evalDialogVisible" width="720px" append-to-body>
      <div class="sg-eval-tip">
        上传一批图片并标注"该不该报警"，点开始评测即可看到准确率/精确率/召回率。
        提示：评测把每张图当单帧处理，判断节点的"持续时间"建议设为 0。
      </div>
      <div style="margin:8px 0">
        <el-button size="small" icon="el-icon-upload2" @click="$refs.evalFile.click()">添加图片</el-button>
        <el-button size="small" type="primary" :loading="evalLoading"
                   :disabled="!evalSamples.length" @click="runEval">开始评测</el-button>
        <el-button size="small" v-if="evalSamples.length" @click="evalSamples = []">清空</el-button>
        <input ref="evalFile" type="file" accept="image/*" multiple style="display:none" @change="onEvalFiles" />
      </div>

      <!-- 样本列表 -->
      <div class="sg-eval-grid" v-if="evalSamples.length">
        <div v-for="(s, i) in evalSamples" :key="i" class="sg-eval-item">
          <img :src="s.image_base64" class="sg-eval-thumb" />
          <el-switch v-model="s.expected" active-text="应报警" inactive-text="不报警"
                     active-color="#f56c6c" inactive-color="#909399" />
          <i class="el-icon-delete sg-eval-del" @click="evalSamples.splice(i, 1)"></i>
        </div>
      </div>

      <!-- 评测结果 -->
      <div v-if="evalResult" class="sg-eval-result">
        <div class="sg-metrics">
          <div class="sg-metric"><div class="sg-metric-v">{{ pct(evalResult.metrics.accuracy) }}</div><div class="sg-metric-l">准确率</div></div>
          <div class="sg-metric"><div class="sg-metric-v">{{ pct(evalResult.metrics.precision) }}</div><div class="sg-metric-l">精确率(少误报)</div></div>
          <div class="sg-metric"><div class="sg-metric-v">{{ pct(evalResult.metrics.recall) }}</div><div class="sg-metric-l">召回率(少漏报)</div></div>
          <div class="sg-metric"><div class="sg-metric-v">{{ pct(evalResult.metrics.f1) }}</div><div class="sg-metric-l">F1</div></div>
        </div>
        <div class="sg-eval-tip">
          共 {{ evalResult.metrics.total }} 张：报对 {{ evalResult.metrics.tp }} | 误报 {{ evalResult.metrics.fp }} | 漏报 {{ evalResult.metrics.fn }} | 正确放过 {{ evalResult.metrics.tn }}
        </div>
        <el-table :data="evalResult.samples" size="mini" max-height="240" border>
          <el-table-column prop="name" label="样本" width="100" />
          <el-table-column label="应报警" width="80">
            <template slot-scope="sc">{{ sc.row.expected ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column label="实际触发" width="90">
            <template slot-scope="sc">{{ sc.row.predicted ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column label="结果">
            <template slot-scope="sc">
              <el-tag size="mini" :type="sc.row.correct ? 'success' : 'danger'">
                {{ sc.row.correct ? '正确' : (sc.row.expected ? '漏报' : '误报') }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import LogicFlow from '@logicflow/core'
import '@logicflow/core/dist/style/index.css'
import { RectNode, RectNodeModel } from '@logicflow/core'
import { skillGraphAPI } from '@/components/service/VisionAIService.js'

// 节点类型 -> 端口（用于自定义锚点）的缓存，由 node-types 接口填充
const PORT_MAP = {}

// 自定义节点：根据 inputPorts/outputPorts 生成左右命名锚点
class SGNodeModel extends RectNodeModel {
  setAttributes() {
    this.width = 170
    this.height = 46
    this.radius = 6
  }
  getNodeStyle() {
    const style = super.getNodeStyle()
    if (this.properties && this.properties.isError) {
      style.stroke = '#f56c6c'
      style.strokeWidth = 2
    }
    return style
  }
  getDefaultAnchor() {
    const { x, y, width, height, id } = this
    const props = this.properties || {}
    const outs = props.outputPorts || []
    const anchors = []
    // 输入锚点：固定端口 + （动态输入节点）一个通用入口
    const inList = (props.inputPorts || []).slice()
    if (props.dynamic) inList.push('*')
    inList.forEach((p, i) => {
      anchors.push({
        x: x - width / 2,
        y: y - height / 2 + (height / (inList.length + 1)) * (i + 1),
        id: `${id}__in__${p}`,
        type: 'incoming',
        portName: p
      })
    })
    outs.forEach((p, i) => {
      anchors.push({
        x: x + width / 2,
        y: y - height / 2 + (height / (outs.length + 1)) * (i + 1),
        id: `${id}__out__${p}`,
        type: 'outgoing',
        portName: p
      })
    })
    return anchors
  }
}
class SGNode extends RectNode {}

export default {
  name: 'SkillGraphEditor',
  data() {
    return {
      lf: null,
      nodeTypes: [],
      skillId: '',
      skillName: '',
      isEdit: false,
      selectedNode: null,
      selectedType: '',
      form: {},
      testDialogVisible: false,
      testResultText: '',
      evalDialogVisible: false,
      evalSamples: [],
      evalResult: null,
      evalLoading: false,
      operators: [
        { v: 'eq', l: '等于' }, { v: 'ne', l: '不等于' },
        { v: 'gt', l: '大于' }, { v: 'gte', l: '大于等于' },
        { v: 'lt', l: '小于' }, { v: 'lte', l: '小于等于' },
        { v: 'contains', l: '包含' }, { v: 'not_contains', l: '不包含' },
        { v: 'is_empty', l: '为空' }, { v: 'is_not_empty', l: '不为空' }
      ]
    }
  },
  computed: {
    groupedNodeTypes() {
      const g = {}
      this.nodeTypes.forEach(nt => {
        if (!g[nt.category]) g[nt.category] = []
        g[nt.category].push(nt)
      })
      return g
    }
  },
  async mounted() {
    await this.loadNodeTypes()
    this.initLogicFlow()
    const sid = this.$route.query.skillId
    if (sid) {
      this.isEdit = true
      this.skillId = sid
      await this.loadGraph(sid)
    }
    window.addEventListener('keydown', this.onKeydown)
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    categoryName(cat) {
      return { start: '开始', model: '模型', process: '处理', judge: '判断', end: '结束' }[cat] || cat
    },
    async loadNodeTypes() {
      try {
        const res = await skillGraphAPI.getNodeTypes()
        this.nodeTypes = (res.data && res.data.data) || []
        this.nodeTypes.forEach(nt => {
          PORT_MAP[nt.type] = {
            inputs: Object.keys(nt.input_ports || {}),
            outputs: Object.keys(nt.output_ports || {}),
            dynamic: !!nt.dynamic_inputs,
            name_zh: nt.name_zh
          }
        })
      } catch (e) {
        this.$message.error('加载节点类型失败')
      }
    },
    initLogicFlow() {
      this.lf = new LogicFlow({
        container: this.$refs.canvas,
        grid: true,
        adjustEdge: true,
        nodeTextEdit: false
      })
      this.lf.register({ type: 'sg-node', view: SGNode, model: SGNodeModel })
      this.lf.setDefaultEdgeType('polyline')
      this.lf.render({ nodes: [], edges: [] })

      // 选中节点 → 打开配置面板
      this.lf.on('node:click', ({ data }) => this.onSelectNode(data))
      this.lf.on('blank:click', () => { this.selectedNode = null; this.selectedType = '' })
      // 连线建立 → 记录端口名到边的 properties
      this.lf.on('edge:add', ({ data }) => this.onEdgeAdd(data))
    },
    onEdgeAdd(edge) {
      // 边的锚点id在 model 上，data 不一定带；从 model 取最稳
      const model = this.lf.getEdgeModelById(edge.id)
      const srcAnchor = (model && model.sourceAnchorId) || edge.sourceAnchorId
      const tgtAnchor = (model && model.targetAnchorId) || edge.targetAnchorId
      const sp = this.parsePort(srcAnchor, 'out')
      let tp = this.parsePort(tgtAnchor, 'in')
      // 动态输入节点：通用入口 '*' 的端口名沿用上游输出端口名
      if (tp === '*') tp = sp || 'value'
      this.lf.setProperties(edge.id, { sourcePort: sp, targetPort: tp })
    },
    parsePort(anchorId, kind) {
      if (!anchorId) return null
      const sep = `__${kind}__`
      const i = anchorId.indexOf(sep)
      return i >= 0 ? anchorId.substring(i + sep.length) : null
    },
    addNode(nt) {
      const ports = PORT_MAP[nt.type] || { inputs: [], outputs: [], dynamic: false }
      this.lf.addNode({
        type: 'sg-node',
        x: 220 + Math.round(Math.random() * 180),
        y: 120 + Math.round(Math.random() * 220),
        text: nt.name_zh,
        properties: {
          nodeType: nt.type,
          name_zh: nt.name_zh,
          inputPorts: ports.inputs,
          outputPorts: ports.outputs,
          dynamic: ports.dynamic,
          config: this.defaultConfig(nt.type)
        }
      })
    },
    defaultConfig(type) {
      const d = {
        detection_model: { model_name: 'coco_detector', target_classes: ['person'], confidence_threshold: 0.5 },
        vlm_model: { system_prompt: '', prompt: '', output_parameters: [] },
        region_filter: { trigger_mode: 'inside' },
        size_filter: {},
        intersect: { iou_mode: 'union', iou_threshold: 0.1 },
        line_crossing: { line: [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }], direction: 'both' },
        distance: { max_distance: 100 },
        dwell: { min_seconds: 5, max_move: 50 },
        judge: { conditions: { condition_groups: [{ conditions: [], relation: 'all' }], global_relation: 'or' }, duration: 0, buffer: 0 },
        end: { message: '' },
        start: { params: {} }
      }
      return d[type] || {}
    },
    onSelectNode(data) {
      this.selectedNode = data
      this.selectedType = (data.properties && data.properties.nodeType) || ''
      const cfg = (data.properties && data.properties.config) || {}
      const f = { _name: data.text && data.text.value ? data.text.value : (data.properties.name_zh || '') }
      // 把各类型配置摊平到表单
      if (this.selectedType === 'detection_model') {
        f.model_name = cfg.model_name || ''
        f.target_classes = (cfg.target_classes || []).join(',')
        f.confidence_threshold = cfg.confidence_threshold != null ? cfg.confidence_threshold : 0.5
      } else if (this.selectedType === 'vlm_model') {
        f.system_prompt = cfg.system_prompt || ''
        f.prompt = cfg.prompt || ''
        f.output_parameters_text = JSON.stringify(cfg.output_parameters || [], null, 0)
      } else if (this.selectedType === 'region_filter') {
        f.trigger_mode = cfg.trigger_mode || 'inside'
      } else if (this.selectedType === 'size_filter') {
        f.min_width = cfg.min_width || 0
        f.max_width = cfg.max_width || 0
        f.min_height = cfg.min_height || 0
        f.max_height = cfg.max_height || 0
      } else if (this.selectedType === 'intersect') {
        f.iou_mode = cfg.iou_mode || 'union'
        f.iou_threshold = cfg.iou_threshold != null ? cfg.iou_threshold : 0.1
      } else if (this.selectedType === 'line_crossing') {
        const ln = cfg.line || [{ x: 0.5, y: 0 }, { x: 0.5, y: 1 }]
        f.lx1 = ln[0] ? ln[0].x : 0.5
        f.ly1 = ln[0] ? ln[0].y : 0
        f.lx2 = ln[1] ? ln[1].x : 0.5
        f.ly2 = ln[1] ? ln[1].y : 1
        f.direction = cfg.direction || 'both'
      } else if (this.selectedType === 'distance') {
        f.max_distance = cfg.max_distance != null ? cfg.max_distance : 100
      } else if (this.selectedType === 'dwell') {
        f.min_seconds = cfg.min_seconds != null ? cfg.min_seconds : 5
        f.max_move = cfg.max_move != null ? cfg.max_move : 50
      } else if (this.selectedType === 'judge') {
        const conds = cfg.conditions || {}
        const groups = (conds.condition_groups || []).map(g => ({
          relation: g.relation || 'all',
          conditions: (g.conditions || []).map(c => ({ ...c }))
        }))
        f.groups = groups.length ? groups : [{ relation: 'all', conditions: [] }]
        f.global_relation = conds.global_relation || 'or'
        f.duration = cfg.duration || 0
        f.buffer = cfg.buffer || 0
      } else if (this.selectedType === 'end') {
        f.message = cfg.message || ''
      }
      this.form = f
    },
    addGroup() {
      if (!this.form.groups) this.$set(this.form, 'groups', [])
      this.form.groups.push({ relation: 'all', conditions: [] })
      this.applyConfig()
    },
    removeGroup(gi) {
      this.form.groups.splice(gi, 1)
      if (!this.form.groups.length) this.form.groups.push({ relation: 'all', conditions: [] })
      this.applyConfig()
    },
    addCond(gi) {
      const grp = this.form.groups[gi]
      if (!grp.conditions) this.$set(grp, 'conditions', [])
      grp.conditions.push({ field: '', operator: 'gte', value: '' })
      this.applyConfig()
    },
    removeCond(gi, ci) {
      this.form.groups[gi].conditions.splice(ci, 1)
      this.applyConfig()
    },
    applyConfig() {
      if (!this.selectedNode) return
      const id = this.selectedNode.id
      const cfg = {}
      const t = this.selectedType
      if (t === 'detection_model') {
        cfg.model_name = this.form.model_name
        cfg.target_classes = (this.form.target_classes || '').split(',').map(s => s.trim()).filter(Boolean)
        cfg.confidence_threshold = Number(this.form.confidence_threshold)
      } else if (t === 'vlm_model') {
        cfg.system_prompt = this.form.system_prompt
        cfg.prompt = this.form.prompt
        try { cfg.output_parameters = JSON.parse(this.form.output_parameters_text || '[]') } catch (e) { cfg.output_parameters = [] }
      } else if (t === 'region_filter') {
        cfg.trigger_mode = this.form.trigger_mode
      } else if (t === 'size_filter') {
        cfg.min_width = Number(this.form.min_width) || 0
        cfg.max_width = Number(this.form.max_width) || 0
        cfg.min_height = Number(this.form.min_height) || 0
        cfg.max_height = Number(this.form.max_height) || 0
      } else if (t === 'intersect') {
        cfg.iou_mode = this.form.iou_mode
        cfg.iou_threshold = Number(this.form.iou_threshold)
      } else if (t === 'line_crossing') {
        cfg.line = [
          { x: Number(this.form.lx1) || 0, y: Number(this.form.ly1) || 0 },
          { x: Number(this.form.lx2) || 0, y: Number(this.form.ly2) || 0 }
        ]
        cfg.direction = this.form.direction || 'both'
      } else if (t === 'distance') {
        cfg.max_distance = Number(this.form.max_distance) || 0
      } else if (t === 'dwell') {
        cfg.min_seconds = Number(this.form.min_seconds) || 0
        cfg.max_move = Number(this.form.max_move) || 0
      } else if (t === 'judge') {
        cfg.conditions = {
          condition_groups: (this.form.groups || []).map(g => ({
            conditions: g.conditions || [],
            relation: g.relation || 'all'
          })),
          global_relation: this.form.global_relation || 'or'
        }
        cfg.duration = Number(this.form.duration) || 0
        cfg.buffer = Number(this.form.buffer) || 0
      } else if (t === 'end') {
        cfg.message = this.form.message
      } else if (t === 'start') {
        cfg.params = {}
      }
      const props = this.selectedNode.properties || {}
      props.config = cfg
      this.lf.setProperties(id, props)
      if (this.form._name) {
        this.lf.updateText(id, this.form._name)
      }
    },
    deleteSelected() {
      if (!this.selectedNode) return
      this.lf.deleteNode(this.selectedNode.id)
      this.selectedNode = null
      this.selectedType = ''
    },
    zoom(zoomIn) {
      if (this.lf) this.lf.zoom(zoomIn)
    },
    fitView() {
      if (this.lf) this.lf.fitView(40, 40)
    },
    // Delete/Backspace 删除选中的节点或连线（输入框内不拦截）
    onKeydown(e) {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const tag = (e.target && e.target.tagName) || ''
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return
      if (!this.lf) return
      const els = this.lf.getSelectElements ? this.lf.getSelectElements(true) : { nodes: [], edges: [] }
      let removed = false
      ;(els.edges || []).forEach(ed => { this.lf.deleteEdge(ed.id); removed = true })
      ;(els.nodes || []).forEach(n => { this.lf.deleteNode(n.id); removed = true })
      if (removed) {
        e.preventDefault()
        this.selectedNode = null
        this.selectedType = ''
      }
    },
    // 清除所有节点的错误高亮
    clearErrors() {
      if (!this.lf) return
      const g = this.lf.getGraphData()
      ;(g.nodes || []).forEach(n => {
        if (n.properties && n.properties.isError) {
          this.lf.setProperties(n.id, { ...n.properties, isError: false })
        }
      })
    },
    // 根据校验错误信息里的 [节点id] 高亮对应节点
    highlightErrors(errors) {
      if (!this.lf) return
      const ids = new Set()
      ;(errors || []).forEach(msg => {
        const m = /\[([^\]]+)\]/.exec(msg || '')
        if (m) ids.add(m[1])
      })
      const g = this.lf.getGraphData()
      ;(g.nodes || []).forEach(n => {
        if (ids.has(n.id)) {
          this.lf.setProperties(n.id, { ...(n.properties || {}), isError: true })
        }
      })
    },
    // ---- 序列化：LogicFlow 图 -> 后端 GraphDef ----
    toGraphDef() {
      const g = this.lf.getGraphData()
      const nodes = (g.nodes || []).map(n => ({
        id: n.id,
        type: (n.properties && n.properties.nodeType) || n.type,
        name: (n.text && n.text.value) || (n.properties && n.properties.name_zh) || '',
        config: (n.properties && n.properties.config) || {},
        position: { x: n.x, y: n.y }
      }))
      const edges = (g.edges || []).map(e => ({
        id: e.id,
        source: e.sourceNodeId,
        source_port: (e.properties && e.properties.sourcePort) || this.parsePort(e.sourceAnchorId, 'out') || 'image',
        target: e.targetNodeId,
        target_port: (e.properties && e.properties.targetPort) || this.parsePort(e.targetAnchorId, 'in') || 'image'
      }))
      return {
        skill_id: this.skillId || 'draft',
        skill_name: this.skillName || '未命名技能',
        nodes,
        edges
      }
    },
    // ---- 反序列化：后端 GraphDef -> LogicFlow 图 ----
    fromGraphDef(gd) {
      const typeById = {}
      ;(gd.nodes || []).forEach(n => { typeById[n.id] = n.type })
      const nodes = (gd.nodes || []).map(n => {
        const ports = PORT_MAP[n.type] || { inputs: [], outputs: [], dynamic: false }
        const pos = n.position || { x: 200, y: 120 }
        return {
          id: n.id,
          type: 'sg-node',
          x: pos.x,
          y: pos.y,
          text: n.name || (ports.name_zh || n.type),
          properties: {
            nodeType: n.type,
            name_zh: ports.name_zh || n.type,
            inputPorts: ports.inputs,
            outputPorts: ports.outputs,
            dynamic: ports.dynamic,
            config: n.config || {}
          }
        }
      })
      const edges = (gd.edges || []).map(e => {
        const tPorts = PORT_MAP[typeById[e.target]] || { inputs: [], dynamic: false }
        // 目标端口若不是固定端口、且目标是动态输入节点，则连到通用入口 '*'
        const tAnchorPort = (tPorts.inputs.indexOf(e.target_port) >= 0)
          ? e.target_port
          : (tPorts.dynamic ? '*' : e.target_port)
        return {
          id: e.id || undefined,
          type: 'polyline',
          sourceNodeId: e.source,
          targetNodeId: e.target,
          sourceAnchorId: `${e.source}__out__${e.source_port}`,
          targetAnchorId: `${e.target}__in__${tAnchorPort}`,
          properties: { sourcePort: e.source_port, targetPort: e.target_port }
        }
      })
      this.lf.render({ nodes, edges })
    },
    async loadGraph(sid) {
      try {
        const res = await skillGraphAPI.getGraph(sid)
        const d = res.data
        this.skillName = d.skill_name
        this.skillId = d.skill_id
        if (d.graph_json && d.graph_json.nodes) {
          this.fromGraphDef(d.graph_json)
        }
      } catch (e) {
        this.$message.error('加载技能图失败')
      }
    },
    async doValidate() {
      this.clearErrors()
      try {
        const res = await skillGraphAPI.validateGraph(this.toGraphDef())
        const r = res.data
        if (r.valid) {
          this.$message.success('校验通过！执行顺序: ' + r.execution_order.join(' → '))
        } else {
          this.highlightErrors(r.errors)
          this.$alert(r.errors.join('\n'), '校验未通过（出错节点已红框标出）', { type: 'warning' })
        }
      } catch (e) {
        this.$message.error('校验请求失败')
      }
    },
    async doTestRun() {
      try {
        const res = await skillGraphAPI.testRun(this.toGraphDef(), null, null)
        this.testResultText = JSON.stringify(res.data, null, 2)
        this.testDialogVisible = true
      } catch (e) {
        this.$message.error('试跑失败：' + ((e.response && e.response.data && e.response.data.detail) || e.message))
      }
    },
    async doSave() {
      if (!this.skillId) { this.$message.warning('请填写技能ID'); return }
      if (!this.skillName) { this.$message.warning('请填写技能名称'); return }
      const payload = {
        skill_id: this.skillId,
        skill_name: this.skillName,
        description: '',
        graph_json: this.toGraphDef()
      }
      try {
        if (this.isEdit) {
          await skillGraphAPI.updateGraph(this.skillId, { skill_name: this.skillName, graph_json: payload.graph_json })
        } else {
          await skillGraphAPI.createGraph(payload)
          this.isEdit = true
        }
        this.$message.success('已保存草稿')
      } catch (e) {
        this.$message.error('保存失败：' + ((e.response && e.response.data && e.response.data.detail) || e.message))
      }
    },
    async doPublish() {
      try {
        await this.doSave()
        await skillGraphAPI.publishGraph(this.skillId)
        this.$message.success('已发布')
      } catch (e) {
        this.$message.error('发布失败：' + ((e.response && e.response.data && e.response.data.detail) || e.message))
      }
    },
    openEval() {
      this.evalResult = null
      this.evalDialogVisible = true
    },
    onEvalFiles(e) {
      const files = Array.from(e.target.files || [])
      files.forEach(file => {
        const reader = new FileReader()
        reader.onload = ev => {
          this.evalSamples.push({ name: file.name, image_base64: ev.target.result, expected: true })
        }
        reader.readAsDataURL(file)
      })
      e.target.value = ''  // 允许重复选同一文件
    },
    async runEval() {
      this.evalLoading = true
      this.evalResult = null
      try {
        const samples = this.evalSamples.map(s => ({
          name: s.name, image_base64: s.image_base64, expected: s.expected
        }))
        const res = await skillGraphAPI.evaluate(this.toGraphDef(), samples)
        this.evalResult = res.data
      } catch (e) {
        this.$message.error('评测失败：' + ((e.response && e.response.data && e.response.data.detail) || e.message))
      } finally {
        this.evalLoading = false
      }
    },
    pct(v) {
      return (Number(v || 0) * 100).toFixed(1) + '%'
    },
    goBack() {
      this.$router.push('/skillManage/skillGraphList')
    }
  }
}
</script>

<style scoped>
.sg-editor { display: flex; flex-direction: column; height: calc(100vh - 84px); background: #f5f7fa; }
.sg-toolbar { display: flex; align-items: center; padding: 8px 12px; background: #fff; border-bottom: 1px solid #e4e7ed; }
.sg-toolbar-right { margin-left: auto; }
.sg-body { display: flex; flex: 1; overflow: hidden; }
.sg-palette { width: 180px; background: #fff; border-right: 1px solid #e4e7ed; overflow-y: auto; padding: 8px; }
.sg-palette-title, .sg-config-title { font-weight: bold; margin-bottom: 8px; color: #303133; }
.sg-palette-cat { font-size: 12px; color: #909399; margin: 8px 0 4px; }
.sg-palette-item { padding: 6px 8px; margin-bottom: 4px; background: #ecf5ff; border: 1px solid #d9ecff;
  border-radius: 4px; cursor: pointer; font-size: 13px; color: #409eff; }
.sg-palette-item:hover { background: #409eff; color: #fff; }
.sg-canvas { flex: 1; background: #fafafa; }
.sg-config { width: 280px; background: #fff; border-left: 1px solid #e4e7ed; overflow-y: auto; padding: 12px; }
.sg-cond-row { display: flex; gap: 4px; margin-bottom: 6px; align-items: center; }
.sg-cond-group { border: 1px solid #ebeef5; border-radius: 4px; padding: 8px; margin-bottom: 8px; background: #fafafa; }
.sg-cond-group-head { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; font-size: 12px; color: #606266; }
.sg-cond-group-head > span { flex: 1; font-weight: bold; }
.sg-tip { font-size: 12px; color: #909399; margin-top: 8px; line-height: 1.5; }
.sg-result { max-height: 400px; overflow: auto; background: #f5f7fa; padding: 12px; font-size: 12px; }
.sg-eval-tip { font-size: 12px; color: #909399; line-height: 1.6; margin-bottom: 6px; }
.sg-eval-grid { display: flex; flex-wrap: wrap; gap: 10px; max-height: 240px; overflow-y: auto; margin-bottom: 12px; }
.sg-eval-item { width: 120px; border: 1px solid #ebeef5; border-radius: 4px; padding: 6px; text-align: center; position: relative; }
.sg-eval-thumb { width: 100%; height: 70px; object-fit: cover; border-radius: 3px; display: block; margin-bottom: 6px; }
.sg-eval-del { position: absolute; top: 4px; right: 4px; color: #f56c6c; cursor: pointer; background: rgba(255,255,255,.85); border-radius: 50%; padding: 2px; }
.sg-eval-result { margin-top: 12px; }
.sg-metrics { display: flex; gap: 12px; margin-bottom: 10px; }
.sg-metric { flex: 1; background: #f5f7fa; border-radius: 6px; padding: 12px; text-align: center; }
.sg-metric-v { font-size: 22px; font-weight: bold; color: #409eff; }
.sg-metric-l { font-size: 12px; color: #909399; margin-top: 4px; }
</style>

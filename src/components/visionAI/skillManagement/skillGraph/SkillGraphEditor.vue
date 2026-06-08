<template>
  <div class="sg-editor">
    <!-- 顶部工具栏 -->
    <div class="sg-toolbar">
      <i class="el-icon-back sg-back" title="返回" @click="goBack"></i>
      <div class="sg-title-block">
        <el-input v-model="skillName" placeholder="未命名技能" class="sg-name-input" />
        <el-input v-model="skillId" placeholder="技能ID(英文)" :disabled="isEdit" class="sg-id-input" />
      </div>
      <div class="sg-toolbar-right">
        <el-button class="sg-tb-btn" size="small" plain @click="doValidate">校验</el-button>
        <el-button class="sg-tb-btn" size="small" icon="el-icon-video-play" plain @click="doTestRun">试运行</el-button>
        <el-button class="sg-tb-btn" size="small" icon="el-icon-data-analysis" plain @click="openEval">评测</el-button>
        <el-button class="sg-tb-btn" size="small" icon="el-icon-folder-checked" plain @click="doSave">预发布</el-button>
        <el-button class="sg-tb-btn sg-tb-primary" size="small" type="primary" icon="el-icon-position"
                   :disabled="!isEdit" @click="doPublish">发布</el-button>
      </div>
    </div>

    <div class="sg-body">
      <!-- 左侧：节点面板 -->
      <div class="sg-palette">
        <div class="sg-palette-search">
          <i class="el-icon-search"></i>
          <input v-model="palKeyword" placeholder="搜索节点名称或描述" />
        </div>
        <div v-for="(group, cat) in filteredNodeTypes" :key="cat" class="sg-palette-group">
          <div class="sg-palette-cat">{{ categoryName(cat) }}</div>
          <div
            v-for="nt in group"
            :key="nt.type"
            class="sg-palette-item"
            :title="nt.description"
            @mousedown="startDragNode(nt)"
          >
            <span class="sg-pal-ic" :style="palIconStyle(nt)"><i :class="palIconClass(nt)"></i></span>
            <div class="sg-pal-meta">
              <div class="sg-pal-name">{{ nt.name_zh }}<span class="sg-pal-ver">V1</span></div>
              <div class="sg-pal-desc">{{ nt.description }}</div>
            </div>
          </div>
        </div>
        <div class="sg-tip">从左侧拖动节点到画布；拖动节点锚点连线即可串联。开始/结束节点已默认放置。</div>
      </div>

      <!-- 中间：画布 -->
      <div class="sg-canvas-wrap">
        <div ref="canvas" class="sg-canvas"></div>

        <!-- 底部缩放工具条 -->
        <div class="sg-zoombar">
          <i class="el-icon-magic-stick" title="优化布局" @click="optimizeLayout"></i>
          <span class="sg-zoombar-sep"></span>
          <i class="el-icon-aim" title="居中视图" @click="centerView"></i>
          <span class="sg-zoombar-sep"></span>
          <i class="el-icon-minus" title="缩小" @click="zoom(false)"></i>
          <span class="sg-zoombar-pct" title="重置缩放" @click="resetZoom">{{ zoomPct }}%</span>
          <i class="el-icon-plus" title="放大" @click="zoom(true)"></i>
          <span class="sg-zoombar-sep"></span>
          <i :class="edgeMode === 'bezier' ? 'el-icon-share' : 'el-icon-position'"
             :title="edgeMode === 'bezier' ? '切换成折线' : '切换成平滑线'" @click="toggleEdgeType"></i>
        </div>

        <!-- 右侧：配置抽屉（拖入节点/选中节点时弹出，点击空白缩回） -->
        <div class="sg-config" :class="{ 'is-open': !!selectedNode }">
          <div v-if="selectedNode" class="sg-config-head">
            <span class="sg-config-ic" :style="{ background: selColor }"><i :class="selIcon"></i></span>
            <div class="sg-config-hd-meta">
              <div class="sg-config-hd-title">
                {{ isFixedNode ? selName : (form._name || selName) }}<span class="sg-config-ver">V1</span>
              </div>
              <div class="sg-config-hd-desc">{{ selDesc }}</div>
            </div>
            <i class="el-icon-close sg-config-close" @click="closeConfig"></i>
          </div>
          <div v-if="selectedNode" class="sg-config-body">
          <el-form label-position="top" size="small">
            <el-form-item v-if="!isFixedNode" label="节点名称">
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
              <div class="sg-params">
                <div class="sg-params-head">
                  <span>输出</span>
                  <i class="el-icon-plus sg-params-add" title="添加参数" @click="addEndParam"></i>
                </div>
                <div v-if="form.out_params && form.out_params.length" class="sg-params-cols">
                  <span class="c-name">参数名 <i class="sg-req-star">*</i></span>
                  <span class="c-type">引用参数 <i class="sg-req-star">*</i></span>
                  <span class="c-act"></span>
                </div>
                <div v-for="(op, oi) in form.out_params" :key="oi" class="sg-param-row">
                  <el-input v-model="op.name" size="mini" maxlength="30" placeholder="请输入参数名"
                            class="c-name" @input="applyConfig" />
                  <el-select v-model="op.ref" size="mini" class="c-type" placeholder="请选择参数" @change="applyConfig">
                    <el-option v-for="r in refParamOptions" :key="r" :label="r" :value="r" />
                  </el-select>
                  <i class="el-icon-remove-outline sg-param-del c-act" title="删除"
                     @click="removeEndParam(oi)"></i>
                </div>

                <div class="sg-out-label">输出信息</div>
                <el-input v-model="form.message" type="textarea" :rows="4" maxlength="255" show-word-limit
                          placeholder='请输入输出信息，可输入"{"可快捷插入标签' @input="applyConfig" />
                <div class="sg-out-foot">
                  <el-button type="text" class="sg-out-clear" @click="clearEndMessage">清空</el-button>
                </div>
              </div>
            </template>

            <!-- 开始节点：定义技能运行需要输入的信息 -->
            <template v-else-if="selectedType === 'start'">
              <div class="sg-params">
                <div class="sg-params-head">
                  <span>输入</span>
                  <i class="el-icon-plus sg-params-add" title="添加参数" @click="addStartParam"></i>
                </div>
                <div class="sg-params-cols">
                  <span class="c-name">参数名 <i class="sg-req-star">*</i></span>
                  <span class="c-type">参数类型</span>
                  <span class="c-req">必填</span>
                  <span class="c-act"></span>
                </div>
                <div v-for="(pp, pi) in form.input_params" :key="pi" class="sg-param-row">
                  <el-input v-model="pp.name" size="mini" maxlength="30" placeholder="请输入参数名"
                            class="c-name" @input="applyConfig" />
                  <el-popover v-model="pp._typeOpen" placement="bottom-start" trigger="click"
                              popper-class="sg-typemenu-popper" :width="170"
                              @hide="pp._arrayHover = false">
                    <div class="sg-typemenu">
                      <div class="sg-typemenu-list">
                        <div v-for="t in startParamTypes" :key="t.v"
                             class="sg-typemenu-item" :class="{ 'has-child': t.v === 'Array', 'is-active': t.v === 'Array' && pp._arrayHover }"
                             @mouseenter="t.v === 'Array' ? showArray(pp) : hideArray(pp)"
                             @click="t.v === 'Array' ? null : selectType(pp, t.v)">
                          <span>{{ t.l }}</span>
                          <i v-if="t.v === 'Array'" class="el-icon-arrow-right"></i>
                        </div>
                      </div>
                      <div v-show="pp._arrayHover" class="sg-typemenu-sub"
                           @mouseenter="showArray(pp)" @mouseleave="hideArray(pp)">
                        <div v-for="it in arrayItemTypes" :key="it.v"
                             class="sg-typemenu-item"
                             @click.stop="selectArrayType(pp, it.v)">{{ it.l }}</div>
                      </div>
                    </div>
                    <div slot="reference" class="c-type sg-type-box">
                      <span class="sg-type-box-txt">{{ typeLabel(pp) }}</span>
                      <i class="el-icon-arrow-down"></i>
                    </div>
                  </el-popover>
                  <el-checkbox v-model="pp.required" class="c-req" @change="applyConfig" />
                  <i class="el-icon-remove-outline sg-param-del c-act" title="删除"
                     @click="removeStartParam(pi)"></i>
                </div>
              </div>
              <div class="sg-tip">开始节点定义技能运行所需的输入；其中 image 为当前帧图像。</div>
            </template>

            <el-button v-if="selectedType !== 'start' && selectedType !== 'end'"
                       type="danger" size="mini" icon="el-icon-delete" style="margin-top:12px"
                       @click="deleteSelected">删除此节点</el-button>
            <div v-else class="sg-tip">开始/结束节点为固定节点，不可删除。</div>
          </el-form>
        </div>
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
import { HtmlNode, HtmlNodeModel } from '@logicflow/core'
import { skillGraphAPI } from '@/components/service/VisionAIService.js'

// 节点类型 -> 端口（用于自定义锚点）的缓存，由 node-types 接口填充
const PORT_MAP = {}

// 节点大类的主题色与图标
const CAT_META = {
  start: { color: '#16b777', icon: 'el-icon-video-play' },
  model: { color: '#7c5cff', icon: 'el-icon-picture-outline' },
  process: { color: '#2f7bff', icon: 'el-icon-set-up' },
  judge: { color: '#13c2c2', icon: 'el-icon-sort' },
  end: { color: '#f5566c', icon: 'el-icon-finished' },
  other: { color: '#909399', icon: 'el-icon-cpu' }
}
// 具体节点类型的图标覆盖
const TYPE_ICON = {
  start: 'el-icon-video-play',
  end: 'el-icon-finished',
  detection_model: 'el-icon-picture-outline',
  vlm_model: 'el-icon-cpu',
  region_filter: 'el-icon-crop',
  size_filter: 'el-icon-full-screen',
  intersect: 'el-icon-connection',
  line_crossing: 'el-icon-right',
  distance: 'el-icon-rank',
  dwell: 'el-icon-time',
  count: 'el-icon-data-line',
  judge: 'el-icon-sort'
}
// 端口类型 -> 展示标签与颜色
const PT_META = {
  Image: { label: '图片', color: '#2f7bff' },
  Detection: { label: '目标', color: '#7c5cff' },
  ROI: { label: '电子围栏', color: '#16b777' },
  Tripwire: { label: '绊线', color: '#fa8c16' },
  Number: { label: '数值', color: '#13c2c2' },
  Boolean: { label: '布尔', color: '#eb2f96' },
  String: { label: '文本', color: '#722ed1' },
  Params: { label: '参数', color: '#faad14' },
  Any: { label: '任意', color: '#909399' }
}
// 端口名 -> 友好中文（找不到则回退到端口类型标签 / 端口名）
const PORT_LABELS = {
  image: '图片', roi: '电子围栏', trigger: '触发',
  targets: '目标', targets1: '目标1', targets2: '目标2',
  target: '目标', target1: '目标1', target2: '目标2',
  count: '数量', passed: '判定', value: '值', result: '结果',
  detections: '检测目标', crossed: '越线目标', matched: '配对目标',
  dwelled: '停留目标', output: '输出', filtered: '过滤结果'
}

// 开始节点的"输入参数"类型（对标参考产品）
const PARAM_TYPE_META = {
  String: { label: '文本', color: '#722ed1' },
  TemplateString: { label: '模板', color: '#722ed1' },
  Integer: { label: '整数', color: '#13c2c2' },
  Double: { label: '小数', color: '#13c2c2' },
  Boolean: { label: '布尔', color: '#eb2f96' },
  Time: { label: '时间', color: '#fa8c16' },
  Image: { label: '图片', color: '#2f7bff' },
  Video: { label: '视频', color: '#2f7bff' },
  Detection: { label: '目标', color: '#7c5cff' },
  TrackDetection: { label: '跟踪目标', color: '#7c5cff' },
  AttributeGroup: { label: '属性组', color: '#7c5cff' },
  Attribute: { label: '属性', color: '#7c5cff' },
  ROI: { label: '电子围栏', color: '#16b777' },
  Tripwire: { label: '绊线', color: '#fa8c16' },
  Target: { label: '目标', color: '#7c5cff' },
  Array: { label: '数组', color: '#faad14' }
}

function catMeta(cat) { return CAT_META[cat] || CAT_META.other }
function typeIcon(type, cat) { return TYPE_ICON[type] || catMeta(cat).icon }
function portLabel(name, type) {
  return PORT_LABELS[name] || (PT_META[type] && PT_META[type].label) || name
}
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ))
}
function chipHtml(name, type) {
  const meta = PT_META[type] || PT_META.Any
  return `<span class="sgx-chip" style="--c:${meta.color}">`
    + `<span class="sgx-chip-dot"></span>${escapeHtml(portLabel(name, type))}</span>`
}
// 开始节点的输入参数 -> chip
function paramChipHtml(pp) {
  const name = pp && pp.name
  if (!name) {
    return '<span class="sgx-chip sgx-chip-warn" style="--c:#f0a020">'
      + '<i class="el-icon-warning-outline"></i>未定义</span>'
  }
  const meta = PARAM_TYPE_META[pp.type] || PARAM_TYPE_META.String
  return `<span class="sgx-chip" style="--c:${meta.color}">`
    + `<span class="sgx-chip-dot"></span>${escapeHtml(PORT_LABELS[name] || name)}</span>`
}

// 自定义 HTML 卡片节点：左右命名锚点 + 卡片样式
class SGNodeModel extends HtmlNodeModel {
  setAttributes() {
    const p = this.properties || {}
    this.width = 248
    if (p.nodeType === 'start') {
      const n = (((p.config || {}).input_params) || []).length || 1
      this.height = 18 + 40 + (12 + Math.ceil(n / 2) * 26)
      return
    }
    if (p.nodeType === 'end') {
      this.height = 18 + 40 + (12 + 26)
      return
    }
    const inCount = (p.inputPorts || []).length + (p.dynamic ? 1 : 0)
    const outCount = (p.outputPorts || []).length
    const inLines = inCount ? Math.ceil(inCount / 2) : 0
    const outLines = outCount ? Math.ceil(outCount / 2) : 0
    this.height = 18 + 40
      + (inCount ? (12 + inLines * 26) : 0)
      + (outCount ? (12 + outLines * 26) : 0)
  }
  getOutlineStyle() {
    const style = super.getOutlineStyle()
    const cat = (this.properties && this.properties.category) || 'other'
    style.stroke = catMeta(cat).color
    style.strokeWidth = 1
    style.strokeDasharray = '4 4'
    if (style.hover) { style.hover.stroke = catMeta(cat).color }
    return style
  }
  getAnchorStyle(anchorInfo) {
    const style = super.getAnchorStyle(anchorInfo)
    const cat = (this.properties && this.properties.category) || 'other'
    const c = catMeta(cat).color
    style.r = 4
    style.fill = '#fff'
    style.stroke = c
    style.strokeWidth = 2
    style.hover = { r: 8, fill: c, fillOpacity: 0.2, stroke: c, strokeWidth: 2 }
    return style
  }
  getAnchorLineStyle(anchorInfo) {
    const style = super.getAnchorLineStyle(anchorInfo)
    const cat = (this.properties && this.properties.category) || 'other'
    style.stroke = catMeta(cat).color
    return style
  }
  getDefaultAnchor() {
    const { x, y, width, height, id } = this
    const props = this.properties || {}
    const nodeType = props.nodeType
    // 开始节点：仅一个输出锚点，位于底部中心
    if (nodeType === 'start') {
      const port = (props.outputPorts && props.outputPorts[0]) || 'image'
      return [{ x, y: y + height / 2, id: `${id}__out__${port}`, type: 'outgoing', portName: port }]
    }
    // 结束节点：仅一个输入锚点，位于顶部中心
    if (nodeType === 'end') {
      return [{ x, y: y - height / 2, id: `${id}__in__*`, type: 'incoming', portName: '*' }]
    }
    const outs = props.outputPorts || []
    const anchors = []
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

class SGNode extends HtmlNode {
  // 隐藏默认的 SVG 文本（标题改在 HTML 卡片里渲染，避免重影）
  getText() { return '' }
  setHtml(rootEl) {
    const m = this.props ? this.props.model : this
    const p = (m && m.properties) || {}
    const cat = p.category || 'other'
    const meta = catMeta(cat)
    const title = (m && m.text && m.text.value) || p.name_zh || ''
    const types = p.portTypes || {}
    const cfg = p.config || {}

    const row = (label, chips) => chips.length
      ? `<div class="sgx-row"><span class="sgx-row-l">${label}</span><span class="sgx-chips">${chips.join('')}</span></div>`
      : ''

    let body = ''
    if (p.nodeType === 'start') {
      // 开始节点：展示用户定义的输入参数
      const list = (cfg.input_params && cfg.input_params.length) ? cfg.input_params : [{}]
      body = row('输入', list.map(paramChipHtml))
    } else if (p.nodeType === 'end') {
      // 结束节点：展示输出文本（未配置时占位）
      const msg = cfg.message
      body = `<div class="sgx-row"><span class="sgx-row-l">输出</span>`
        + `<span class="sgx-out${msg ? '' : ' is-empty'}">${msg ? escapeHtml(msg) : '未配置输出'}</span></div>`
    } else {
      const ins = (p.inputPorts || []).map(n => chipHtml(n, types[n]))
      if (p.dynamic) ins.push('<span class="sgx-chip sgx-chip-dyn" style="--c:#909399"><span class="sgx-chip-dot"></span>动态输入</span>')
      const outs = (p.outputPorts || []).map(n => chipHtml(n, types[n]))
      body = row('输入', ins) + row('输出', outs)
    }

    const html =
      `<div class="sgx-card sgx-cat-${cat}">`
      + `<div class="sgx-hd">`
      + `<span class="sgx-ic" style="background:${meta.color}"><i class="${typeIcon(p.nodeType, cat)}"></i></span>`
      + `<span class="sgx-ti">${escapeHtml(title)}</span>`
      + `<span class="sgx-ver">V1</span>`
      + `</div>`
      + body
      + `</div>`
    // rootEl 是 <foreignObject>，必须用 HTML 命名空间的 div 承载内容，否则不渲染
    while (rootEl.firstChild) rootEl.removeChild(rootEl.firstChild)
    const wrap = document.createElement('div')
    wrap.className = 'sgx-root' + (p.isError ? ' is-error' : '')
    wrap.innerHTML = html
    rootEl.appendChild(wrap)
  }
}

export default {
  name: 'SkillGraphEditor',
  data() {
    return {
      lf: null,
      nodeTypes: [],
      skillId: '',
      skillName: '',
      skillDescription: '',
      skillTags: [],
      skillCover: '',
      isEdit: false,
      selectedNode: null,
      selectedType: '',
      zoomPct: 100,
      edgeMode: 'bezier',
      palKeyword: '',
      form: {},
      testDialogVisible: false,
      testResultText: '',
      evalDialogVisible: false,
      evalSamples: [],
      evalResult: null,
      evalLoading: false,
      startParamTypes: [
        { v: 'String', l: 'String' },
        { v: 'TemplateString', l: 'TemplateString' },
        { v: 'Integer', l: 'Integer' },
        { v: 'Double', l: 'Double' },
        { v: 'Boolean', l: 'Boolean' },
        { v: 'Time', l: 'Time' },
        { v: 'Image', l: 'Image' },
        { v: 'Video', l: 'Video' },
        { v: 'Detection', l: 'Detection' },
        { v: 'TrackDetection', l: 'TrackDetection' },
        { v: 'AttributeGroup', l: 'AttributeGroup' },
        { v: 'Attribute', l: 'Attribute' },
        { v: 'ROI', l: 'ROI' },
        { v: 'Tripwire', l: 'Tripwire' },
        { v: 'Array', l: 'Array' }
      ],
      arrayItemTypes: [
        { v: 'String', l: 'String' },
        { v: 'Integer', l: 'Integer' },
        { v: 'Double', l: 'Double' },
        { v: 'Boolean', l: 'Boolean' },
        { v: 'Image', l: 'Image' },
        { v: 'Video', l: 'Video' },
        { v: 'Detection', l: 'Detection' },
        { v: 'TrackDetection', l: 'TrackDetection' },
        { v: 'Attribute', l: 'Attribute' },
        { v: 'ROI', l: 'ROI' },
        { v: 'Tripwire', l: 'Tripwire' },
        { v: 'Target', l: 'Target' }
      ],
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
        // 开始/结束为固定节点，已默认放置在画布上，不在面板中提供拖拽
        if (nt.category === 'start' || nt.category === 'end') return
        if (!g[nt.category]) g[nt.category] = []
        g[nt.category].push(nt)
      })
      return g
    },
    selCat() {
      return (this.selectedNode && this.selectedNode.properties && this.selectedNode.properties.category) || this.selectedType || 'other'
    },
    selColor() {
      return catMeta(this.selCat).color
    },
    selIcon() {
      return typeIcon(this.selectedType, this.selCat)
    },
    selName() {
      const p = this.selectedNode && this.selectedNode.properties
      return (p && p.name_zh) || this.selectedType
    },
    isFixedNode() {
      return this.selectedType === 'start' || this.selectedType === 'end'
    },
    refParamOptions() {
      // 引用参数候选：取画布上开始节点定义的输入参数名
      void this.selectedNode
      try {
        const g = this.lf.getGraphData()
        const startNode = (g.nodes || []).find(n => ((n.properties && n.properties.nodeType) || n.type) === 'start')
        const params = (startNode && startNode.properties && startNode.properties.config && startNode.properties.config.input_params) || []
        return params.map(p => p.name).filter(Boolean)
      } catch (e) {
        return []
      }
    },
    selDesc() {
      const nt = this.nodeTypes.find(n => n.type === this.selectedType)
      return (nt && nt.description) || ''
    },
    filteredNodeTypes() {
      const kw = (this.palKeyword || '').trim().toLowerCase()
      if (!kw) return this.groupedNodeTypes
      const g = {}
      Object.keys(this.groupedNodeTypes).forEach(cat => {
        const items = this.groupedNodeTypes[cat].filter(nt =>
          (nt.name_zh || '').toLowerCase().includes(kw) ||
          (nt.description || '').toLowerCase().includes(kw)
        )
        if (items.length) g[cat] = items
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
    } else {
      // 新建技能：默认放置开始 / 结束两个节点
      this.addDefaultNodes()
    }
    this.$nextTick(() => this.fitView())
    window.addEventListener('keydown', this.onKeydown)
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeydown)
  },
  methods: {
    categoryName(cat) {
      return { start: '开始', model: '模型节点', process: '处理节点', judge: '判断节点', end: '结束' }[cat] || cat
    },
    palIconClass(nt) {
      return typeIcon(nt.type, nt.category)
    },
    palIconStyle(nt) {
      return { background: catMeta(nt.category).color }
    },
    async loadNodeTypes() {
      try {
        const res = await skillGraphAPI.getNodeTypes()
        this.nodeTypes = (res.data && res.data.data) || []
        this.nodeTypes.forEach(nt => {
          PORT_MAP[nt.type] = {
            inputs: Object.keys(nt.input_ports || {}),
            outputs: Object.keys(nt.output_ports || {}),
            types: { ...(nt.input_ports || {}), ...(nt.output_ports || {}) },
            dynamic: !!nt.dynamic_inputs,
            name_zh: nt.name_zh,
            category: nt.category
          }
        })
      } catch (e) {
        this.$message.error('加载节点类型失败')
      }
    },
    initLogicFlow() {
      this.lf = new LogicFlow({
        container: this.$refs.canvas,
        grid: { size: 16, visible: true, type: 'dot', config: { color: '#d6dbe4', thickness: 1 } },
        background: { backgroundColor: '#f6f8fb' },
        adjustEdge: true,
        nodeTextEdit: false,
        stopScrollGraph: true,
        edgeType: 'bezier'
      })
      this.lf.register({ type: 'sg-node', view: SGNode, model: SGNodeModel })
      this.lf.setTheme({
        bezier: { stroke: '#b9c2d0', strokeWidth: 2, hoverStroke: '#7c5cff', selectedStroke: '#7c5cff' },
        anchor: { stroke: '#7c5cff', fill: '#fff', r: 4, hover: { r: 8, fill: '#7c5cff', fillOpacity: 0.2, stroke: '#7c5cff', strokeWidth: 2 } },
        nodeText: { color: '#1f2329', fontSize: 12 },
        edgeText: { color: '#8a94a6', fontSize: 12, background: { fill: '#f6f8fb' } }
      })
      this.lf.setDefaultEdgeType('bezier')
      // 缩放范围限制：最小 50%，最大 200%
      this.lf.setZoomMiniSize(0.5)
      this.lf.setZoomMaxSize(2)
      // 加大滚轮缩放步长（默认偏小，滚一下太慢）
      try { this.lf.graphModel.transformModel.ZOOM_SIZE = 0.12 } catch (e) { /* ignore */ }
      this.lf.render({ nodes: [], edges: [] })

      // 缩放/平移变化（含滚轮缩放）时实时同步比例数字
      this.lf.on('graph:transform', () => this.syncZoom())

      // 选中节点 → 打开配置面板
      this.lf.on('node:click', ({ data }) => this.onSelectNode(data))
      // 点击空白区域 → 收起配置抽屉
      this.lf.on('blank:click', () => this.closeConfig())
      // 拖入新节点 → 自动选中并弹出配置抽屉
      this.lf.on('node:dnd-add', (evt) => {
        const data = (evt && evt.data) || evt
        if (!data || !data.id) return
        this.$nextTick(() => {
          if (this.lf.selectElementById) this.lf.selectElementById(data.id, false)
          this.onSelectNode(data)
        })
      })
      // 连线建立 → 记录端口名到边的 properties
      this.lf.on('edge:add', ({ data }) => this.onEdgeAdd(data))
    },
    // 默认放置开始 / 结束两个固定节点
    addDefaultNodes() {
      const sp = PORT_MAP['start'] || { inputs: [], outputs: [], dynamic: false }
      const ep = PORT_MAP['end'] || { inputs: [], outputs: [], dynamic: false }
      this.lf.addNode({
        id: 'start',
        type: 'sg-node',
        x: 420,
        y: 140,
        text: sp.name_zh || '开始节点',
        properties: {
          nodeType: 'start',
          name_zh: sp.name_zh || '开始节点',
          category: sp.category || 'start',
          inputPorts: sp.inputs,
          outputPorts: sp.outputs,
          portTypes: sp.types || {},
          dynamic: sp.dynamic,
          config: this.defaultConfig('start')
        }
      })
      this.lf.addNode({
        id: 'end',
        type: 'sg-node',
        x: 420,
        y: 460,
        text: ep.name_zh || '结束节点',
        properties: {
          nodeType: 'end',
          name_zh: ep.name_zh || '结束节点',
          category: ep.category || 'end',
          inputPorts: ep.inputs,
          outputPorts: ep.outputs,
          portTypes: ep.types || {},
          dynamic: ep.dynamic,
          config: this.defaultConfig('end')
        }
      })
    },
    // 在面板上按下鼠标 → 启动拖拽，松开时落到画布
    startDragNode(nt) {
      const ports = PORT_MAP[nt.type] || { inputs: [], outputs: [], dynamic: false }
      this.lf.dnd.startDrag({
        type: 'sg-node',
        text: nt.name_zh,
        properties: {
          nodeType: nt.type,
          name_zh: nt.name_zh,
          category: nt.category || ports.category,
          inputPorts: ports.inputs,
          outputPorts: ports.outputs,
          portTypes: ports.types || {},
          dynamic: ports.dynamic,
          config: this.defaultConfig(nt.type)
        }
      })
    },
    closeConfig() {
      this.selectedNode = null
      this.selectedType = ''
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
        start: { params: {}, input_params: [{ name: 'image', type: 'Image', required: true }] }
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
        f.out_params = (cfg.output_params || []).map(op => ({ name: op.name || '', ref: op.ref || '' }))
      } else if (this.selectedType === 'start') {
        const list = (cfg.input_params || []).map(pp => ({
          name: pp.name || '', type: pp.type || 'String', required: !!pp.required,
          item_type: pp.item_type || 'String', _typeOpen: false, _arrayHover: false
        }))
        f.input_params = list.length ? list : [{ name: 'image', type: 'Image', required: true, item_type: 'String', _typeOpen: false, _arrayHover: false }]
      }
      this.form = f
    },
    addStartParam() {
      if (!this.form.input_params) this.$set(this.form, 'input_params', [])
      this.form.input_params.push({ name: '', type: 'String', required: false, item_type: 'String', _typeOpen: false, _arrayHover: false })
      this.applyConfig()
    },
    typeLabel(pp) {
      if (pp.type === 'Array') return `Array<${pp.item_type || 'String'}>`
      return pp.type || 'String'
    },
    showArray(pp) {
      if (this._arrayHideTimer) { clearTimeout(this._arrayHideTimer); this._arrayHideTimer = null }
      pp._arrayHover = true
    },
    hideArray(pp) {
      if (this._arrayHideTimer) clearTimeout(this._arrayHideTimer)
      this._arrayHideTimer = setTimeout(() => { pp._arrayHover = false }, 220)
    },
    selectType(pp, v) {
      this.$set(pp, 'type', v)
      pp._typeOpen = false
      this.applyConfig()
    },
    selectArrayType(pp, v) {
      this.$set(pp, 'type', 'Array')
      this.$set(pp, 'item_type', v)
      pp._typeOpen = false
      this.applyConfig()
    },
    clearEndMessage() {
      this.form.message = ''
      this.applyConfig()
    },
    addEndParam() {
      if (!this.form.out_params) this.$set(this.form, 'out_params', [])
      this.form.out_params.push({ name: '', ref: '' })
      this.applyConfig()
    },
    removeEndParam(oi) {
      this.form.out_params.splice(oi, 1)
      this.applyConfig()
    },
    removeStartParam(pi) {
      this.form.input_params.splice(pi, 1)
      this.applyConfig()
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
        cfg.output_params = (this.form.out_params || [])
          .map(op => ({ name: (op.name || '').trim(), ref: op.ref || '' }))
          .filter(op => op.name)
      } else if (t === 'start') {
        const list = (this.form.input_params || []).map(pp => {
          const o = { name: (pp.name || '').trim(), type: pp.type || 'String', required: !!pp.required }
          if (o.type === 'Array') o.item_type = pp.item_type || 'String'
          return o
        })
        cfg.input_params = list
        // image / roi 由开始节点内置输出，自定义参数才进 params 字典（后端用）
        const params = {}
        list.forEach(pp => { if (pp.name && pp.name !== 'image' && pp.name !== 'roi') params[pp.name] = '' })
        cfg.params = params
      }
      const props = this.selectedNode.properties || {}
      props.config = cfg
      // 先更新文本，再 setProperties 触发 HTML 节点重渲染，使标题改名即时生效
      if (this.form._name) {
        this.lf.updateText(id, this.form._name)
        props.name_zh = this.form._name
      }
      this.lf.setProperties(id, props)
    },
    deleteSelected() {
      if (!this.selectedNode) return
      if (this.selectedType === 'start' || this.selectedType === 'end') {
        this.$message.warning('开始/结束节点不可删除')
        return
      }
      this.lf.deleteNode(this.selectedNode.id)
      this.selectedNode = null
      this.selectedType = ''
    },
    zoom(zoomIn) {
      if (this.lf) { this.lf.zoom(zoomIn); this.syncZoom() }
    },
    resetZoom() {
      if (this.lf) { this.lf.resetZoom(); this.syncZoom() }
    },
    fitView() {
      if (this.lf) { this.lf.fitView(60, 60); this.syncZoom() }
    },
    // 居中视图：将图形平移到画布中心（不改变缩放比例）
    centerView() {
      if (this.lf) { this.lf.translateCenter(); this.syncZoom() }
    },
    syncZoom() {
      try {
        const t = this.lf && this.lf.getTransform && this.lf.getTransform()
        if (t && t.SCALE_X) this.zoomPct = Math.round(t.SCALE_X * 100)
      } catch (e) { /* ignore */ }
    },
    // 平滑曲线 / 折线 切换
    toggleEdgeType() {
      if (!this.lf) return
      this.edgeMode = this.edgeMode === 'bezier' ? 'polyline' : 'bezier'
      this.lf.setDefaultEdgeType(this.edgeMode)
      const g = this.lf.getGraphData()
      const edges = (g.edges || []).map(e => ({ ...e, type: this.edgeMode }))
      this.lf.render({ nodes: g.nodes || [], edges })
    },
    // 自动整理布局：连通的节点沿连线方向竖着分层排，互不相连的链横向并排
    optimizeLayout() {
      if (!this.lf) return
      const g = this.lf.getGraphData()
      const nodes = g.nodes || []
      const edges = g.edges || []
      if (!nodes.length) return
      const ids = nodes.map(n => n.id)
      const adjU = {}   // 无向（求连通分量）
      const adjD = {}   // 有向（求层级）
      const indeg = {}
      ids.forEach(id => { adjU[id] = []; adjD[id] = []; indeg[id] = 0 })
      edges.forEach(e => {
        if (adjD[e.sourceNodeId] && indeg[e.targetNodeId] != null) {
          adjD[e.sourceNodeId].push(e.targetNodeId)
          indeg[e.targetNodeId]++
          adjU[e.sourceNodeId].push(e.targetNodeId)
          adjU[e.targetNodeId].push(e.sourceNodeId)
        }
      })
      // 连通分量划分
      const comp = {}
      let cnt = 0
      ids.forEach(id => {
        if (comp[id] != null) return
        const stack = [id]
        comp[id] = cnt
        while (stack.length) {
          const x = stack.pop()
          adjU[x].forEach(y => { if (comp[y] == null) { comp[y] = cnt; stack.push(y) } })
        }
        cnt++
      })
      // 最长路径分层（层 = 竖向行）
      const layer = {}
      const ind = { ...indeg }
      const q = ids.filter(id => ind[id] === 0)
      q.forEach(id => { layer[id] = 0 })
      while (q.length) {
        const id = q.shift()
        adjD[id].forEach(t => {
          layer[t] = Math.max(layer[t] || 0, (layer[id] || 0) + 1)
          if (--ind[t] === 0) q.push(t)
        })
      }
      ids.forEach(id => { if (layer[id] == null) layer[id] = 0 })
      // 逐分量布局，分量之间横向偏移
      const yGap = 150, xGap = 280, compGap = 360, x0 = 240, y0 = 120
      let offsetX = x0
      for (let c = 0; c < cnt; c++) {
        const members = ids.filter(id => comp[id] === c)
        const layers = {}
        members.forEach(id => { (layers[layer[id]] || (layers[layer[id]] = [])).push(id) })
        const maxCols = Math.max.apply(null, Object.keys(layers).map(l => layers[l].length))
        const compW = (maxCols - 1) * xGap
        Object.keys(layers).forEach(l => {
          const li = Number(l)
          const list = layers[l]
          const totalW = (list.length - 1) * xGap
          list.forEach((id, i) => {
            const x = offsetX + compW / 2 + (i * xGap - totalW / 2)
            const y = y0 + li * yGap
            this.lf.graphModel.moveNode2Coordinate(id, x, y)
          })
        })
        offsetX += compW + compGap
      }
      this.$nextTick(() => this.fitView())
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
      ;(els.nodes || []).forEach(n => {
        const t = n.properties && n.properties.nodeType
        if (t === 'start' || t === 'end') return  // 固定节点不可删除
        this.lf.deleteNode(n.id); removed = true
      })
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
      const def = {
        skill_id: this.skillId || 'draft',
        skill_name: this.skillName || '未命名技能',
        nodes,
        edges
      }
      if (this.skillTags && this.skillTags.length) def.tags = this.skillTags
      if (this.skillCover) def.cover = this.skillCover
      return def
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
            category: ports.category || n.type,
            inputPorts: ports.inputs,
            outputPorts: ports.outputs,
            portTypes: ports.types || {},
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
          type: 'bezier',
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
        this.skillDescription = d.description || ''
        this.skillTags = (d.graph_json && d.graph_json.tags) || []
        this.skillCover = (d.graph_json && d.graph_json.cover) || ''
        if (d.graph_json && d.graph_json.nodes && d.graph_json.nodes.length) {
          this.fromGraphDef(d.graph_json)
        } else {
          this.addDefaultNodes()
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
        description: this.skillDescription || '',
        graph_json: this.toGraphDef()
      }
      try {
        if (this.isEdit) {
          await skillGraphAPI.updateGraph(this.skillId, { skill_name: this.skillName, description: this.skillDescription || '', graph_json: payload.graph_json })
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
.sg-editor { display: flex; flex-direction: column; height: calc(100vh - 84px); background: #f1f3f7; }
/* 顶部工具栏 */
.sg-toolbar { display: flex; align-items: center; padding: 10px 16px; background: #fff; border-bottom: 1px solid #edeff3;
  box-shadow: 0 1px 2px rgba(0,0,0,.03); }
.sg-back { font-size: 18px; color: #5b667a; cursor: pointer; margin-right: 12px; }
.sg-back:hover { color: #7c5cff; }
.sg-title-block { display: flex; align-items: center; gap: 8px; }
.sg-title-block >>> .sg-name-input .el-input__inner { border: none; font-size: 15px; font-weight: 600; color: #1f2329;
  padding-left: 0; width: 200px; }
.sg-title-block >>> .sg-id-input .el-input__inner { border: 1px dashed #dfe3ea; border-radius: 6px; font-size: 12px;
  height: 30px; line-height: 30px; color: #8a94a6; width: 160px; }
.sg-toolbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.sg-toolbar-right >>> .sg-tb-btn { border-radius: 8px; }
.sg-toolbar-right >>> .sg-tb-primary { background: #7c5cff; border-color: #7c5cff; box-shadow: 0 4px 10px rgba(124,92,255,.3); }
.sg-toolbar-right >>> .sg-tb-primary:hover { background: #6b49f0; border-color: #6b49f0; }

.sg-body { display: flex; flex: 1; overflow: hidden; }

/* 左侧节点面板 */
.sg-palette { width: 240px; background: #fff; border-right: 1px solid #edeff3; overflow-y: auto; padding: 12px; }
.sg-palette-search { display: flex; align-items: center; gap: 6px; background: #f3f5f9; border-radius: 8px;
  padding: 7px 10px; margin-bottom: 14px; color: #9aa3b2; }
.sg-palette-search input { border: none; outline: none; background: transparent; flex: 1; font-size: 13px; color: #1f2329; }
.sg-palette-cat { font-size: 13px; font-weight: 600; color: #1f2329; margin: 14px 0 8px; }
.sg-palette-group:first-child .sg-palette-cat { margin-top: 0; }
.sg-palette-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px; margin-bottom: 8px;
  background: #fff; border: 1px solid #edeff3; border-radius: 10px; cursor: grab; user-select: none; transition: all .15s; }
.sg-palette-item:hover { border-color: #c9bbff; box-shadow: 0 6px 16px rgba(124,92,255,.12); transform: translateY(-1px); }
.sg-palette-item:active { cursor: grabbing; }
.sg-pal-ic { flex: none; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center;
  justify-content: center; color: #fff; font-size: 16px; }
.sg-pal-meta { min-width: 0; }
.sg-pal-name { font-size: 13px; font-weight: 600; color: #1f2329; display: flex; align-items: center; gap: 6px; }
.sg-pal-ver { font-size: 10px; color: #9aa3b2; background: #f1f2f5; border-radius: 4px; padding: 0 4px; line-height: 15px; font-weight: 500; }
.sg-pal-desc { font-size: 12px; color: #9aa3b2; line-height: 1.5; margin-top: 3px;
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* 画布 */
.sg-canvas-wrap { position: relative; flex: 1; overflow: hidden; }
.sg-canvas { width: 100%; height: 100%; }

/* 底部缩放条 */
.sg-zoombar { position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%); display: flex; align-items: center;
  gap: 4px; background: #fff; border: 1px solid #edeff3; border-radius: 10px; padding: 6px 10px;
  box-shadow: 0 6px 20px rgba(0,0,0,.08); z-index: 9; }
.sg-zoombar i { font-size: 15px; color: #5b667a; cursor: pointer; padding: 3px; border-radius: 6px; }
.sg-zoombar i:hover { color: #7c5cff; background: #f3f0ff; }
.sg-zoombar-sep { width: 1px; height: 16px; background: #edeff3; margin: 0 2px; }
.sg-zoombar-pct { font-size: 12px; color: #5b667a; cursor: pointer; min-width: 42px; text-align: center; user-select: none; }
.sg-zoombar-pct:hover { color: #7c5cff; }

/* 右侧配置抽屉 */
.sg-config {
  position: absolute; top: 0; right: 0; height: 100%; width: 360px;
  background: #fff; border-left: 1px solid #edeff3; overflow-y: auto; padding: 0 16px 16px;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.06);
  transform: translateX(106%); transition: transform .25s ease; z-index: 10;
}
.sg-config.is-open { transform: translateX(0); }
.sg-config-head { display: flex; align-items: flex-start; gap: 10px; padding: 16px 0 12px; position: sticky; top: 0;
  background: #fff; border-bottom: 1px solid #f1f2f5; margin-bottom: 12px; z-index: 1; }
.sg-config-ic { flex: none; width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center;
  justify-content: center; color: #fff; font-size: 17px; }
.sg-config-hd-meta { flex: 1; min-width: 0; }
.sg-config-hd-title { font-size: 15px; font-weight: 600; color: #1f2329; display: flex; align-items: center; gap: 6px; }
.sg-config-ver { font-size: 10px; color: #9aa3b2; background: #f1f2f5; border-radius: 4px; padding: 0 4px; line-height: 15px; font-weight: 500; }
.sg-config-hd-desc { font-size: 12px; color: #9aa3b2; line-height: 1.5; margin-top: 3px; }
.sg-config-close { cursor: pointer; color: #b4bbc7; font-size: 16px; padding: 2px; }
.sg-config-close:hover { color: #7c5cff; }
/* 开始节点：输入参数编辑器 */
.sg-params { margin-bottom: 6px; }
.sg-params-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.sg-params-head > span { font-size: 13px; font-weight: 600; color: #1f2329; }
.sg-params-add { cursor: pointer; color: #7c5cff; font-size: 16px; padding: 2px; border-radius: 6px; }
.sg-params-add:hover { background: #f3f0ff; }
.sg-params-cols { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #9aa3b2; margin-bottom: 6px; }
.sg-req-star { color: #f56c6c; font-style: normal; }
.sg-out-label { font-size: 13px; color: #1f2329; margin-bottom: 8px; }
.sg-out-foot { display: flex; justify-content: flex-end; margin-top: 6px; }
.sg-out-clear { color: #9aa3b2; padding: 0; }
.sg-out-clear:hover { color: #7c5cff; }
.sg-param-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.sg-param-row .c-name, .sg-params-cols .c-name { flex: 1 1 0; min-width: 0; }
.sg-param-row .c-type, .sg-params-cols .c-type { flex: 1 1 0; min-width: 0; }
.sg-param-row .c-req, .sg-params-cols .c-req { flex: none; width: 34px; text-align: center; }
.sg-param-row .c-act, .sg-params-cols .c-act { flex: none; width: 18px; text-align: center; }
.sg-type-box {
  display: flex; align-items: center; justify-content: space-between; gap: 4px;
  height: 28px; padding: 0 8px; border: 1px solid #dcdfe6; border-radius: 4px;
  background: #fff; cursor: pointer; font-size: 12px; color: #606266; box-sizing: border-box;
}
.sg-type-box:hover { border-color: #c0c4cc; }
.sg-type-box-txt { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sg-type-box .el-icon-arrow-down { color: #c0c4cc; flex: none; }
.sg-param-del { cursor: pointer; color: #b4bbc7; font-size: 16px; }
.sg-param-del:hover { color: #f5566c; }
.sg-param-row >>> .el-checkbox__label { display: none; }
.sg-cond-row { display: flex; gap: 4px; margin-bottom: 6px; align-items: center; }
.sg-cond-group { border: 1px solid #ebeef5; border-radius: 8px; padding: 8px; margin-bottom: 8px; background: #f8f9fc; }
.sg-cond-group-head { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; font-size: 12px; color: #606266; }
.sg-cond-group-head > span { flex: 1; font-weight: bold; }
.sg-tip { font-size: 12px; color: #9aa3b2; margin-top: 8px; line-height: 1.5; }
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

<!-- 非 scoped：作用于 LogicFlow 注入的 HTML 节点卡片 -->
<style>
/* 参数类型二级菜单（popover 渲染到 body，需非 scoped） */
.sg-typemenu-popper.el-popover { padding: 6px 0 !important; overflow: visible !important; min-width: 150px; }
.sg-typemenu { position: relative; font-size: 13px; color: #1f2329; }
.sg-typemenu-list { max-height: 280px; overflow-y: auto; }
.sg-typemenu-item {
  position: relative; display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px; cursor: pointer; white-space: nowrap;
}
.sg-typemenu-item:hover, .sg-typemenu-item.is-active { background: #f5f7fa; }
.sg-typemenu-item .el-icon-arrow-right { color: #c0c4cc; margin-left: 12px; }
.sg-typemenu-sub {
  position: absolute; right: 100%; top: -6px; min-width: 140px;
  max-height: 300px; overflow-y: auto; background: #fff; border: 1px solid #ebeef5;
  border-radius: 6px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12); z-index: 5; padding: 6px 0;
}
/* 透明桥，避免主菜单与二级菜单之间出现空隙导致 hover 丢失 */
.sg-typemenu-sub::after {
  content: ''; position: absolute; top: 0; bottom: 0; right: -8px; width: 8px;
}

.sg-canvas .lf-html { overflow: visible; }
.sgx-root { width: 100%; height: 100%; }
.sgx-card {
  position: relative; width: 100%; height: 100%; box-sizing: border-box;
  background: #fff; border: 1px solid #e7eaf0; border-radius: 12px;
  box-shadow: 0 4px 14px rgba(31, 35, 41, .06);
  padding: 10px 12px 10px 14px; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  cursor: move; transition: box-shadow .15s, border-color .15s; overflow: hidden;
}
.sgx-card::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
  border-radius: 12px 0 0 12px; background: var(--accent, #909399);
}
.sgx-cat-start { --accent: #16b777; }
.sgx-cat-model { --accent: #7c5cff; }
.sgx-cat-process { --accent: #2f7bff; }
.sgx-cat-judge { --accent: #13c2c2; }
.sgx-cat-end { --accent: #f5566c; }
.sgx-card:hover { box-shadow: 0 8px 22px rgba(31, 35, 41, .12); border-color: #d6d2f5; }
.sgx-root.is-error .sgx-card { border-color: #f5566c; box-shadow: 0 0 0 2px rgba(245, 86, 108, .25); }

.sgx-hd { display: flex; align-items: center; gap: 8px; }
.sgx-ic { flex: none; width: 24px; height: 24px; border-radius: 7px; display: flex; align-items: center;
  justify-content: center; color: #fff; font-size: 14px; }
.sgx-ti { flex: 1; min-width: 0; font-size: 14px; font-weight: 600; color: #1f2329;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sgx-ver { flex: none; font-size: 10px; color: #9aa3b2; background: #f1f2f5; border-radius: 4px;
  padding: 1px 5px; font-weight: 500; }

.sgx-row { display: flex; align-items: flex-start; gap: 8px; margin-top: 9px; }
.sgx-row-l { flex: none; font-size: 12px; color: #8a94a6; line-height: 22px; }
.sgx-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.sgx-chip { display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px;
  background: #f5f7fb; border: 1px solid #eaedf3; border-radius: 6px; font-size: 12px; color: #4a5365; }
.sgx-chip-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--c, #909399); }
.sgx-chip-dyn { border-style: dashed; color: #9aa3b2; }
.sgx-chip-warn { border-color: #ffe1b3; background: #fff7e8; color: #d48806; }
.sgx-chip-warn i { font-size: 12px; }
.sgx-out { flex: 1; min-width: 0; height: 22px; line-height: 22px; padding: 0 8px; border-radius: 6px;
  background: #f5f7fb; border: 1px solid #eaedf3; font-size: 12px; color: #4a5365;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sgx-out.is-empty { color: #b4bbc7; }
</style>

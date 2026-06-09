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
              <div class="sg-pal-name">
                {{ nt.name_zh }}
                <el-popover
                  v-if="nt.type === 'target_matting'"
                  v-model="mattingIntroOpen"
                  placement="right-start"
                  trigger="manual"
                  popper-class="sg-matting-intro-pop"
                  :width="272"
                  :append-to-body="true"
                >
                  <div class="sg-matting-intro" @mouseenter="clearMattingIntroTimer" @mouseleave="scheduleCloseMattingIntro">
                    <div class="sg-matting-intro-title">抠图还原上线啦 🎉</div>
                    <div class="sg-matting-intro-desc">对目标区域抠图并进行推理，并将推理结果还原到原图</div>
                    <div class="sg-matting-intro-demo" aria-hidden="true">
                      <div class="sg-matting-demo-scene">
                        <div class="sg-matting-demo-bg-left"></div>
                        <div class="sg-matting-demo-bg-right"></div>
                        <div class="sg-matting-demo-road"></div>
                        <div class="sg-matting-demo-focus">
                          <div class="sg-matting-demo-poly">
                            <span class="sg-matting-demo-tag">违停车辆</span>
                            <svg viewBox="0 0 88 54" aria-hidden="true">
                              <polygon points="16,49 16,36 19,23 30,12 44,10 58,10 72,12 81,23 82,36 82,49" fill="none" stroke="#52c41a" stroke-width="2" />
                            </svg>
                            <div class="sg-matting-demo-car"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="sg-matting-intro-foot">
                      <button type="button" class="sg-matting-intro-btn" @mousedown.stop @click="closeMattingIntro">我知道了</button>
                    </div>
                  </div>
                  <span
                    slot="reference"
                    class="sg-pal-dot-hit"
                    title="拖入后附带小图批处理节点"
                    @mousedown.stop
                    @mouseenter="openMattingIntro"
                    @mouseleave="scheduleCloseMattingIntro"
                    @click.stop="openMattingIntro"
                  >
                    <span class="sg-pal-dot"></span>
                  </span>
                </el-popover>
                <span v-else-if="nt.has_companion" class="sg-pal-dot-hit" title="拖入后附带子节点" @mousedown.stop>
                  <span class="sg-pal-dot"></span>
                </span>
                <span class="sg-pal-ver">v1</span>
              </div>
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
        <div class="sg-config" :class="{ 'is-open': !!selectedNode, 'is-judge': selectedType === 'judge' }">
          <div v-if="selectedNode" class="sg-config-head">
            <span class="sg-config-ic" :style="{ background: selColor }"><i :class="selIcon"></i></span>
            <div class="sg-config-hd-meta">
              <div class="sg-config-hd-title">
                {{ configDrawerTitle }}<span class="sg-config-ver">v1</span>
              </div>
              <div class="sg-config-hd-desc">{{ selDesc }}</div>
            </div>
            <i class="el-icon-close sg-config-close" @click="closeConfig"></i>
          </div>
          <div v-if="showUpstreamWarn" class="sg-upstream-warn">
            <span class="sg-upstream-warn-ic">!</span>
            <span>请先连接前序节点</span>
          </div>
          <div v-if="selectedNode" class="sg-config-body">
          <el-form label-position="top" size="small">

            <!-- 通用：输入来源选择（除视觉模型/开始/结束外，其余有输入的节点统一在这里选） -->
            <template v-if="hasInputSelector && selectedType !== 'detection_model' && selectedType !== 'vlm_model' && selectedType !== 'custom_code' && selectedType !== 'video_slice' && selectedType !== 'size_filter' && selectedType !== 'intersection' && selectedType !== 'intersect' && selectedType !== 'displacement' && selectedType !== 'distance' && selectedType !== 'tripwire_tracking' && selectedType !== 'region_filter' && selectedType !== 'count' && selectedType !== 'small_image_batch' && selectedType !== 'target_matting'">
              <div class="sg-sec-title">输入</div>
              <el-form-item v-for="sel in inputSelectors" :key="sel.port" :label="sel.label" :required="!sel.optional">
                <el-popover v-model="sel.popOpen" placement="bottom-start" trigger="click"
                            :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                  <el-tree v-if="sel.treeData.length" :data="sel.treeData" node-key="id"
                           default-expand-all :expand-on-click-node="false" :highlight-current="true"
                           :current-node-key="sel.value" @node-click="onParamPick(sel, $event)">
                    <span slot-scope="{ data }" class="sg-tree-node">
                      <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                      <span>{{ data.label }}</span>
                    </span>
                  </el-tree>
                  <div v-else class="sg-tree-empty">暂无数据</div>
                  <div slot="reference" class="sg-ref-box" :class="{ 'is-empty': !sel.value }">
                    <span class="sg-ref-txt">{{ selLabel(sel) || ('请选择参数（' + sel.type + (sel.optional ? '，可选' : '') + '）') }}</span>
                    <i v-if="sel.value" class="el-icon-circle-close sg-ref-clear" @click.stop="clearInput(sel)"></i>
                    <i v-else class="el-icon-arrow-down sg-ref-arrow"></i>
                  </div>
                </el-popover>
              </el-form-item>
            </template>

            <!-- 视觉模型 -->
            <template v-if="selectedType === 'detection_model'">
              <div class="sg-sec-title">模型选择</div>
              <el-form-item label="模型选择" required>
                <el-select v-model="form.model_id" placeholder="请选择模型" filterable remote reserve-keyword
                           :remote-method="searchModels" :loading="modelLoading" style="width:100%"
                           @change="onModelChange" @visible-change="onModelSelectVisible">
                  <el-option v-for="m in modelOptions" :key="m.id" :label="m._label" :value="m.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="模型标签" required>
                <el-select v-model="form.target_classes" multiple collapse-tags placeholder="请选择模型标签"
                           :loading="classLoading" :disabled="!form.model_id" style="width:100%" @change="onClassesChange">
                  <el-option v-for="c in modelClassOptions" :key="c.name" :label="c.name_zh" :value="c.name" />
                </el-select>
                <div v-if="form.model_id && !modelClassOptions.length && !classLoading" class="sg-tip">
                  该模型暂无可用标签，请先在模型管理中维护检测类别。
                </div>
              </el-form-item>

              <div class="sg-sec-title">输入</div>
              <el-form-item v-for="sel in inputSelectors" :key="sel.port" :label="sel.label" :required="!sel.optional">
                <el-popover v-model="sel.popOpen" placement="bottom-start" trigger="click"
                            :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                  <el-tree v-if="sel.treeData.length" :data="sel.treeData" node-key="id"
                           default-expand-all :expand-on-click-node="false" :highlight-current="true"
                           :current-node-key="sel.value" @node-click="onParamPick(sel, $event)">
                    <span slot-scope="{ data }" class="sg-tree-node">
                      <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                      <span>{{ data.label }}</span>
                    </span>
                  </el-tree>
                  <div v-else class="sg-tree-empty">暂无数据</div>
                  <div slot="reference" class="sg-ref-box" :class="{ 'is-empty': !sel.value }">
                    <span class="sg-ref-txt">{{ selLabel(sel) || ('请选择参数（' + sel.type + (sel.optional ? '，可选' : '') + '）') }}</span>
                    <i v-if="sel.value" class="el-icon-circle-close sg-ref-clear" @click.stop="clearInput(sel)"></i>
                    <i v-else class="el-icon-arrow-down sg-ref-arrow"></i>
                  </div>
                </el-popover>
              </el-form-item>

              <div class="sg-sec-title">配置</div>
              <template v-if="form.target_classes && form.target_classes.length">
                <el-form-item v-for="cls in form.target_classes" :key="cls" :label="classLabel(cls)" required>
                  <el-input-number v-model="form.class_thresholds[cls]" :min="0" :max="1" :step="0.05" :precision="4"
                                   controls-position="right" style="width:100%" @change="applyConfig" />
                  <div class="sg-tip">仅支持输入数字，取值范围[0，1]，最多保留4位小数</div>
                </el-form-item>
              </template>
              <div v-else class="sg-io-empty">请先配置模型和标签</div>

              <div class="sg-sec-title">输出</div>
              <div v-if="form.target_classes && form.target_classes.length" class="sg-io-list">
                <div v-for="cls in form.target_classes" :key="cls" class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#7c5cff"></span>{{ classLabel(cls) }}
                  <span class="sg-io-tag">det.</span>
                </div>
              </div>
              <div v-else class="sg-io-empty">请先配置模型和标签</div>
            </template>

            <!-- 多模态大模型 -->
            <template v-else-if="selectedType === 'vlm_model'">
              <el-select v-model="form.model_name" placeholder="请选择多模态大模型" filterable
                         :loading="vlmModelLoading" style="width:100%;margin-bottom:12px" @change="applyConfig"
                         @visible-change="onVlmModelSelectVisible">
                <el-option v-for="m in vlmModelOptions" :key="m.value" :label="m.label" :value="m.value" />
              </el-select>

              <div class="sg-params">
                <div class="sg-params-head">
                  <span>输入</span>
                  <i class="el-icon-plus sg-params-add" title="添加输入参数" @click="addVlmInputParam"></i>
                </div>
                <div v-for="(ip, ii) in form.input_params" :key="'vlm-in-' + ii" class="sg-vlm-input-item">
                  <div class="sg-param-row sg-vlm-param-row">
                    <el-input v-model="ip.name" size="mini" maxlength="30" show-word-limit placeholder="请输入参数名"
                              class="c-name" :class="{ 'is-invalid': !paramNameValid(ip.name) }" @input="applyConfig" />
                    <el-popover v-model="ip._typeOpen" placement="bottom-start" trigger="click"
                                popper-class="sg-typemenu-popper" :width="170"
                                @hide="ip._arrayHover = false">
                      <div class="sg-typemenu">
                        <div class="sg-typemenu-list">
                          <div v-for="t in vlmInputParamTypes" :key="t.v"
                               class="sg-typemenu-item" :class="{ 'has-child': t.v === 'Array', 'is-active': t.v === 'Array' && ip._arrayHover }"
                               @mouseenter="t.v === 'Array' ? showArray(ip) : hideArray(ip)"
                               @click="t.v === 'Array' ? null : selectVlmInputType(ip, t.v)">
                            <span class="sg-vlm-type-opt">
                              <i v-if="t.v === 'Image'" class="el-icon-picture-outline sg-vlm-type-ic"></i>{{ t.l }}
                            </span>
                            <i v-if="t.v === 'Array'" class="el-icon-arrow-right"></i>
                          </div>
                        </div>
                        <div v-show="ip._arrayHover" class="sg-typemenu-sub"
                             @mouseenter="showArray(ip)" @mouseleave="hideArray(ip)">
                          <div v-for="it in vlmInputArrayItemTypes" :key="it.v"
                               class="sg-typemenu-item"
                               @click.stop="selectVlmInputArrayType(ip, it.v)">{{ it.l }}</div>
                        </div>
                      </div>
                      <div slot="reference" class="c-type sg-type-box">
                        <i v-if="ip.type === 'Image' || ip.type === 'Array'" class="el-icon-picture-outline sg-vlm-type-ic"></i>
                        <span class="sg-type-box-txt">{{ vlmInputTypeLabel(ip) }}</span>
                        <i class="el-icon-arrow-down"></i>
                      </div>
                    </el-popover>
                    <i class="el-icon-remove-outline sg-param-del c-act" title="删除"
                       @click="removeVlmInputParam(ii)"></i>
                  </div>
                  <div v-if="!paramNameValid(ip.name)" class="sg-param-err">参数名必须以字母开头，只能包含字母、数字、下划线</div>
                  <el-popover v-if="ip.name" v-model="ip._bindOpen" placement="bottom-start" trigger="click"
                              :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                    <el-tree v-if="vlmInputTreeData(ip).length" :data="vlmInputTreeData(ip)" node-key="id"
                             default-expand-all :expand-on-click-node="false" :highlight-current="true"
                             :current-node-key="vlmInputBindingValue(ip.name)"
                             @node-click="onVlmInputPick(ip, $event)">
                      <span slot-scope="{ data }" class="sg-tree-node">
                        <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                        <span>{{ data.label }}</span>
                      </span>
                    </el-tree>
                    <div v-else class="sg-tree-empty">暂无数据</div>
                    <div slot="reference" class="sg-vlm-bind" :class="{ 'is-empty': !vlmInputBindingValue(ip.name) }">
                      <i :class="paramTypeIcon(ip.type === 'Array' ? 'Image' : ip.type)"></i>
                      <span class="sg-vlm-bind-txt">{{ vlmInputBindLabel(ip.name) || '请选择参数' }}</span>
                      <i v-if="vlmInputBindingValue(ip.name)" class="el-icon-circle-close sg-vlm-bind-clear"
                         @click.stop="clearVlmInput(ip)"></i>
                      <i v-else class="el-icon-link sg-vlm-bind-link"></i>
                    </div>
                  </el-popover>
                </div>
              </div>

              <el-form-item required>
                <span slot="label">
                  提示词
                  <el-tooltip content="描述希望多模态大模型对输入内容进行的分析任务" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-input v-model="form.prompt" type="textarea" :rows="4" maxlength="1000" show-word-limit
                          placeholder="请输入提示词" @input="applyConfig" />
              </el-form-item>

              <div class="sg-params">
                <div class="sg-params-head">
                  <span>输出</span>
                  <i class="el-icon-plus sg-params-add" title="添加输出参数" @click="addVlmOutputParam"></i>
                </div>
                <div v-if="form.output_parameters && form.output_parameters.length" class="sg-params-cols">
                  <span class="c-name">
                    参数名 <i class="sg-req-star">*</i>
                    <el-tooltip content="支持1～30字中英文、数字或下划线；必须以字母开头" placement="top">
                      <i class="el-icon-question sg-field-help"></i>
                    </el-tooltip>
                  </span>
                  <span class="c-type">
                    参数类型
                    <el-tooltip content="大模型返回的结构化字段类型" placement="top">
                      <i class="el-icon-question sg-field-help"></i>
                    </el-tooltip>
                  </span>
                  <span class="c-act"></span>
                </div>
                <div v-for="(op, oi) in form.output_parameters" :key="'vlm-out-' + oi" class="sg-param-item">
                  <div class="sg-param-row">
                    <el-input v-model="op.name" size="mini" maxlength="30" show-word-limit placeholder="请输入参数名"
                              class="c-name" :class="{ 'is-invalid': !paramNameValid(op.name) }" @input="applyConfig" />
                    <el-popover v-model="op._typeOpen" placement="bottom-start" trigger="click"
                                popper-class="sg-typemenu-popper" :width="190">
                      <div class="sg-typemenu">
                        <div class="sg-typemenu-list">
                          <div v-for="t in vlmOutputParamTypes" :key="t.v"
                               class="sg-typemenu-item" :class="{ 'is-selected': op.type === t.v }"
                               @click="selectVlmOutputType(op, t.v)">
                            <span>{{ t.l }}</span>
                          </div>
                        </div>
                      </div>
                      <div slot="reference" class="c-type sg-type-box has-prefix">
                        <span class="sg-type-prefix">{{ vlmTypePrefix(op.type) }}</span>
                        <span class="sg-type-box-txt">{{ vlmOutputTypeLabel(op.type) }}</span>
                        <i class="el-icon-arrow-down"></i>
                      </div>
                    </el-popover>
                    <i class="el-icon-remove-outline sg-param-del c-act" title="删除"
                       @click="removeVlmOutputParam(oi)"></i>
                  </div>
                  <div v-if="!paramNameValid(op.name)" class="sg-param-err">参数名必须以字母开头，只能包含字母、数字、下划线</div>
                </div>
              </div>
            </template>

            <!-- 小图批处理（多模态大模型） -->
            <template v-else-if="selectedType === 'small_image_batch' && form.model_mode === 'vlm_model'">
              <el-select v-model="form.model_name" placeholder="请选择多模态大模型" filterable
                         :loading="vlmModelLoading" style="width:100%;margin-bottom:12px" @change="applyConfig"
                         @visible-change="onVlmModelSelectVisible">
                <el-option v-for="m in vlmModelOptions" :key="m.value" :label="m.label" :value="m.value" />
              </el-select>

              <div class="sg-sec-title">输入</div>
              <el-form-item label="图片" required>
                <el-popover v-model="form._sibImgPop" placement="bottom-start" trigger="click"
                            :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                  <el-tree v-if="sibImageTreeData.length" :data="sibImageTreeData" node-key="id"
                           default-expand-all :expand-on-click-node="false" :highlight-current="true"
                           :current-node-key="sibImageBindingValue" @node-click="onSibImagePick">
                    <span slot-scope="{ data }" class="sg-tree-node">
                      <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                      <span>{{ data.label }}</span>
                    </span>
                  </el-tree>
                  <div v-else class="sg-tree-empty">暂无数据</div>
                  <div slot="reference" class="sg-ref-box" :class="{ 'is-empty': !sibImageBindingValue }">
                    <i class="el-icon-picture-outline" style="color:#2f7bff;margin-right:6px"></i>
                    <span class="sg-ref-txt">{{ sibImageBindLabel || '请选择参数' }}</span>
                    <i v-if="sibImageBindingValue" class="el-icon-circle-close sg-ref-clear" @click.stop="clearSibImage"></i>
                    <i v-else class="el-icon-link sg-ref-arrow"></i>
                  </div>
                </el-popover>
              </el-form-item>

              <el-form-item required>
                <span slot="label">
                  提示词
                  <el-tooltip content="描述希望多模态大模型对输入内容进行的分析任务" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-input v-model="form.prompt" type="textarea" :rows="4" maxlength="1000" show-word-limit
                          placeholder="请输入提示词" @input="applyConfig" />
              </el-form-item>

              <div class="sg-params">
                <div class="sg-params-head">
                  <span>输出</span>
                  <i class="el-icon-plus sg-params-add" title="添加输出参数" @click="addVlmOutputParam"></i>
                </div>
                <div v-if="form.output_parameters && form.output_parameters.length" class="sg-params-cols">
                  <span class="c-name">参数名 <i class="sg-req-star">*</i></span>
                  <span class="c-type">参数类型</span>
                  <span class="c-act"></span>
                </div>
                <div v-for="(op, oi) in form.output_parameters" :key="'sib-vlm-out-' + oi" class="sg-param-item">
                  <div class="sg-param-row">
                    <el-input v-model="op.name" size="mini" maxlength="30" show-word-limit placeholder="请输入参数名"
                              class="c-name" :class="{ 'is-invalid': !paramNameValid(op.name) }" @input="applyConfig" />
                    <el-popover v-model="op._typeOpen" placement="bottom-start" trigger="click"
                                popper-class="sg-typemenu-popper" :width="190">
                      <div class="sg-typemenu">
                        <div class="sg-typemenu-list">
                          <div v-for="t in sibVlmOutputParamTypes" :key="t.v"
                               class="sg-typemenu-item" :class="{ 'is-selected': op.type === t.v }"
                               @click="selectSibVlmOutputType(op, t.v)">
                            <span>{{ t.l }}</span>
                          </div>
                        </div>
                      </div>
                      <div slot="reference" class="c-type sg-type-box has-prefix">
                        <span class="sg-type-prefix">{{ vlmTypePrefix(op.type) }}</span>
                        <span class="sg-type-box-txt">{{ vlmOutputTypeLabel(op.type) }}</span>
                        <i class="el-icon-arrow-down"></i>
                      </div>
                    </el-popover>
                    <i class="el-icon-remove-outline sg-param-del c-act" title="删除"
                       @click="removeVlmOutputParam(oi)"></i>
                  </div>
                </div>
              </div>
            </template>

            <!-- 小图批处理（视觉模型） -->
            <template v-else-if="selectedType === 'small_image_batch' && form.model_mode === 'detection_model'">
              <div class="sg-sec-title">模型选择</div>
              <el-form-item label="模型选择" required>
                <el-select v-model="form.model_id" placeholder="请选择模型" filterable remote reserve-keyword
                           :remote-method="searchModels" :loading="modelLoading" style="width:100%"
                           @change="onModelChange" @visible-change="onModelSelectVisible">
                  <el-option v-for="m in modelOptions" :key="m.id" :label="m._label" :value="m.id" />
                </el-select>
              </el-form-item>
              <el-form-item label="模型标签" required>
                <el-select v-model="form.target_classes" multiple collapse-tags placeholder="请选择模型标签"
                           :loading="classLoading" :disabled="!form.model_id" style="width:100%" @change="onClassesChange">
                  <el-option v-for="c in modelClassOptions" :key="c.name" :label="c.name_zh" :value="c.name" />
                </el-select>
                <div v-if="form.model_id && !modelClassOptions.length && !classLoading" class="sg-tip">
                  该模型暂无可用标签，请先在模型管理中维护检测类别。
                </div>
              </el-form-item>

              <div class="sg-sec-title">输入</div>
              <el-form-item label="图片" required>
                <el-popover v-model="form._sibImgPop" placement="bottom-start" trigger="click"
                            :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                  <el-tree v-if="sibImageTreeData.length" :data="sibImageTreeData" node-key="id"
                           default-expand-all :expand-on-click-node="false" :highlight-current="true"
                           :current-node-key="sibImageBindingValue" @node-click="onSibImagePick">
                    <span slot-scope="{ data }" class="sg-tree-node">
                      <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                      <span>{{ data.label }}</span>
                    </span>
                  </el-tree>
                  <div v-else class="sg-tree-empty">暂无数据</div>
                  <div slot="reference" class="sg-ref-box" :class="{ 'is-empty': !sibImageBindingValue }">
                    <i class="el-icon-picture-outline" style="color:#2f7bff;margin-right:6px"></i>
                    <span class="sg-ref-txt">{{ sibImageBindLabel || '请选择参数' }}</span>
                    <i v-if="sibImageBindingValue" class="el-icon-circle-close sg-ref-clear" @click.stop="clearSibImage"></i>
                    <i v-else class="el-icon-link sg-ref-arrow"></i>
                  </div>
                </el-popover>
              </el-form-item>
              <el-form-item label="电子围栏">
                <el-popover v-model="form._sibRoiPop" placement="bottom-start" trigger="click"
                            :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                  <el-tree v-if="sibRoiTreeData.length" :data="sibRoiTreeData" node-key="id"
                           default-expand-all :expand-on-click-node="false" :highlight-current="true"
                           :current-node-key="sibRoiBindingValue" @node-click="onSibRoiPick">
                    <span slot-scope="{ data }" class="sg-tree-node">
                      <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                      <span>{{ data.label }}</span>
                    </span>
                  </el-tree>
                  <div v-else class="sg-tree-empty">暂无数据</div>
                  <div slot="reference" class="sg-ref-box" :class="{ 'is-empty': !sibRoiBindingValue }">
                    <span class="sg-ref-txt">{{ sibRoiBindLabel || '请选择参数' }}</span>
                    <i v-if="sibRoiBindingValue" class="el-icon-circle-close sg-ref-clear" @click.stop="clearSibRoi"></i>
                    <i v-else class="el-icon-link sg-ref-arrow"></i>
                  </div>
                </el-popover>
              </el-form-item>

              <div class="sg-sec-title">配置</div>
              <template v-if="form.target_classes && form.target_classes.length">
                <el-form-item v-for="cls in form.target_classes" :key="cls" :label="classLabel(cls)" required>
                  <el-input-number v-model="form.class_thresholds[cls]" :min="0" :max="1" :step="0.05" :precision="4"
                                   controls-position="right" style="width:100%" @change="applyConfig" />
                </el-form-item>
              </template>
              <div v-else class="sg-io-empty">请先配置模型和标签</div>

              <div class="sg-sec-title">输出</div>
              <div v-if="form.target_classes && form.target_classes.length" class="sg-io-list">
                <div v-for="cls in form.target_classes" :key="cls" class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#7c5cff"></span>{{ classLabel(cls) }}
                  <span class="sg-io-tag">det.</span>
                </div>
              </div>
              <div v-else class="sg-io-empty">请先配置模型和标签</div>
            </template>

            <!-- 小图批处理：未选模型 -->
            <template v-else-if="selectedType === 'small_image_batch'">
              <div class="sg-io-empty">请先在节点上点击选择推理模型节点</div>
            </template>

            <!-- 目标抠图推理 -->
            <template v-else-if="selectedType === 'target_matting'">
              <div class="sg-sec-title">输入</div>
              <el-form-item v-for="sel in inputSelectors" :key="sel.port" :label="sel.label" required>
                <el-popover v-model="sel.popOpen" placement="bottom-start" trigger="click"
                            :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                  <el-tree v-if="sel.treeData.length" :data="sel.treeData" node-key="id"
                           default-expand-all :expand-on-click-node="false" :highlight-current="true"
                           :current-node-key="sel.value" @node-click="onParamPick(sel, $event)">
                    <span slot-scope="{ data }" class="sg-tree-node">
                      <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                      <span>{{ data.label }}</span>
                    </span>
                  </el-tree>
                  <div v-else class="sg-tree-empty">暂无数据</div>
                  <div slot="reference" class="sg-ref-box" :class="{ 'is-empty': !sel.value }">
                    <i v-if="sel.port === 'image'" class="el-icon-picture-outline sg-ref-pre-ic"></i>
                    <span v-if="sel.port === 'target'" class="sg-ref-pre-tag">det.</span>
                    <span class="sg-ref-txt">{{ selLabel(sel) || '请选择参数' }}</span>
                    <i v-if="sel.value" class="el-icon-circle-close sg-ref-clear" @click.stop="clearInput(sel)"></i>
                    <i v-else class="el-icon-link sg-ref-arrow"></i>
                  </div>
                </el-popover>
              </el-form-item>

              <div class="sg-sec-title">配置</div>
              <el-form-item label="抠图宽度倍数" required>
                <el-input-number v-model="form.width_multiplier" :min="0.1" :max="10" :step="0.1" :precision="4"
                                 controls-position="right" style="width:100%" @change="applyConfig" />
                <div class="sg-tip">仅支持输入数字，取值范围[0.1，10]，最多保留4位小数</div>
              </el-form-item>
              <el-form-item label="抠图高度倍数" required>
                <el-input-number v-model="form.height_multiplier" :min="0.1" :max="10" :step="0.1" :precision="4"
                                 controls-position="right" style="width:100%" @change="applyConfig" />
                <div class="sg-tip">仅支持输入数字，取值范围[0.1，10]，最多保留4位小数</div>
              </el-form-item>

              <div class="sg-sec-title">输出</div>
              <div class="sg-matting-out-tree">
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#2f7bff"></span>小图序列
                  <i class="el-icon-picture-outline sg-io-type-ic"></i>
                </div>
                <div class="sg-matting-out-lv1">
                  <div class="sg-io-item">
                    <span class="sg-io-dot" style="--c:#7c5cff"></span>抠图推理目标
                    <span class="sg-io-tag">det.</span>
                  </div>
                  <div class="sg-matting-out-lv2">
                    <div class="sg-io-item">
                      <span class="sg-io-dot" style="--c:#722ed1"></span>output
                      <span class="sg-io-tag">str.</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- 自定义节点 -->
            <template v-else-if="selectedType === 'custom_code'">
              <div class="sg-params">
                <div class="sg-params-head">
                  <span>输入</span>
                  <i class="el-icon-plus sg-params-add" title="添加输入参数" @click="addCustomInputParam"></i>
                </div>
                <div v-for="(ip, ii) in form.input_params" :key="'cc-in-' + ii" class="sg-vlm-input-item">
                  <div class="sg-param-row sg-vlm-param-row">
                    <el-input v-model="ip.name" size="mini" maxlength="30" show-word-limit placeholder="请输入参数名"
                              class="c-name" :class="{ 'is-invalid': !paramNameValid(ip.name) }" @input="applyConfig" />
                    <el-popover v-model="ip._typeOpen" placement="bottom-start" trigger="click"
                                popper-class="sg-typemenu-popper" :width="170"
                                @hide="ip._arrayHover = false">
                      <div class="sg-typemenu">
                        <div class="sg-typemenu-list">
                          <div v-for="t in startParamTypes" :key="t.v"
                               class="sg-typemenu-item" :class="{ 'has-child': t.v === 'Array', 'is-active': t.v === 'Array' && ip._arrayHover }"
                               @mouseenter="t.v === 'Array' ? showArray(ip) : hideArray(ip)"
                               @click="t.v === 'Array' ? null : selectCustomInputType(ip, t.v)">
                            <span>{{ t.l }}</span>
                            <i v-if="t.v === 'Array'" class="el-icon-arrow-right"></i>
                          </div>
                        </div>
                        <div v-show="ip._arrayHover" class="sg-typemenu-sub"
                             @mouseenter="showArray(ip)" @mouseleave="hideArray(ip)">
                          <div v-for="it in arrayItemTypes" :key="it.v"
                               class="sg-typemenu-item"
                               @click.stop="selectCustomInputArrayType(ip, it.v)">{{ it.l }}</div>
                        </div>
                      </div>
                      <div slot="reference" class="c-type sg-type-box">
                        <span class="sg-type-box-txt">{{ typeLabel(ip) }}</span>
                        <i class="el-icon-arrow-down"></i>
                      </div>
                    </el-popover>
                    <i class="el-icon-remove-outline sg-param-del c-act" title="删除"
                       @click="removeCustomInputParam(ii)"></i>
                  </div>
                  <div v-if="!paramNameValid(ip.name)" class="sg-param-err">参数名必须以字母开头，只能包含字母、数字、下划线</div>
                  <el-popover v-if="ip.name" v-model="ip._bindOpen" placement="bottom-start" trigger="click"
                              :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                    <el-tree v-if="customInputTreeData(ip).length" :data="customInputTreeData(ip)" node-key="id"
                             default-expand-all :expand-on-click-node="false" :highlight-current="true"
                             :current-node-key="customInputBindingValue(ip.name)"
                             @node-click="onCustomInputPick(ip, $event)">
                      <span slot-scope="{ data }" class="sg-tree-node">
                        <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                        <span>{{ data.label }}</span>
                      </span>
                    </el-tree>
                    <div v-else class="sg-tree-empty">暂无数据</div>
                    <div slot="reference" class="sg-vlm-bind" :class="{ 'is-empty': !customInputBindingValue(ip.name) }">
                      <i :class="paramTypeIcon(customPortType(ip.type))"></i>
                      <span class="sg-vlm-bind-txt">{{ customInputBindLabel(ip.name) || '请选择参数' }}</span>
                      <i v-if="customInputBindingValue(ip.name)" class="el-icon-circle-close sg-vlm-bind-clear"
                         @click.stop="clearCustomInput(ip)"></i>
                      <i v-else class="el-icon-link sg-vlm-bind-link"></i>
                    </div>
                  </el-popover>
                </div>
              </div>

              <div class="sg-params">
                <div class="sg-params-head">
                  <span>代码</span>
                  <el-button size="mini" type="text" icon="el-icon-edit-outline" @click="openCodeEditor">编辑代码</el-button>
                </div>
                <div ref="codePreviewBox" class="sg-code-preview cm-s-material-darker"></div>
              </div>

              <div class="sg-params">
                <div class="sg-params-head">
                  <span>输出</span>
                  <i class="el-icon-plus sg-params-add" title="添加输出参数" @click="addCustomOutputParam"></i>
                </div>
                <div v-if="form.output_parameters && form.output_parameters.length" class="sg-params-cols">
                  <span class="c-name">参数名 <i class="sg-req-star">*</i></span>
                  <span class="c-type">参数类型</span>
                  <span class="c-act"></span>
                </div>
                <div v-for="(op, oi) in form.output_parameters" :key="'cc-out-' + oi" class="sg-param-item">
                  <div class="sg-param-row">
                    <el-input v-model="op.name" size="mini" maxlength="30" show-word-limit placeholder="请输入参数名"
                              class="c-name" :class="{ 'is-invalid': !paramNameValid(op.name) }" @input="applyConfig" />
                    <el-popover v-model="op._typeOpen" placement="bottom-start" trigger="click"
                                popper-class="sg-typemenu-popper" :width="170"
                                @hide="op._arrayHover = false">
                      <div class="sg-typemenu">
                        <div class="sg-typemenu-list">
                          <div v-for="t in startParamTypes" :key="t.v"
                               class="sg-typemenu-item" :class="{ 'has-child': t.v === 'Array', 'is-active': t.v === 'Array' && op._arrayHover }"
                               @mouseenter="t.v === 'Array' ? showArray(op) : hideArray(op)"
                               @click="t.v === 'Array' ? null : selectCustomOutputType(op, t.v)">
                            <span>{{ t.l }}</span>
                            <i v-if="t.v === 'Array'" class="el-icon-arrow-right"></i>
                          </div>
                        </div>
                        <div v-show="op._arrayHover" class="sg-typemenu-sub"
                             @mouseenter="showArray(op)" @mouseleave="hideArray(op)">
                          <div v-for="it in arrayItemTypes" :key="it.v"
                               class="sg-typemenu-item"
                               @click.stop="selectCustomOutputArrayType(op, it.v)">{{ it.l }}</div>
                        </div>
                      </div>
                      <div slot="reference" class="c-type sg-type-box">
                        <span class="sg-type-box-txt">{{ typeLabel(op) }}</span>
                        <i class="el-icon-arrow-down"></i>
                      </div>
                    </el-popover>
                    <i class="el-icon-remove-outline sg-param-del c-act" title="删除"
                       @click="removeCustomOutputParam(oi)"></i>
                  </div>
                  <div v-if="!paramNameValid(op.name)" class="sg-param-err">参数名必须以字母开头，只能包含字母、数字、下划线</div>
                </div>
              </div>

              <div class="sg-params">
                <div class="sg-params-head">
                  <span>异常处理</span>
                </div>
                <el-form-item required>
                  <span slot="label">
                    超时时间(ms)
                    <el-tooltip content="代码执行超时时间，取值范围[1, 10000]" placement="top">
                      <i class="el-icon-question sg-field-help"></i>
                    </el-tooltip>
                  </span>
                  <el-input-number v-model="form.timeout_ms" :min="1" :max="10000" :step="100"
                                   controls-position="right" style="width:100%" @change="applyConfig" />
                  <div class="sg-tip">请输入整数，取值范围[1, 10000]</div>
                </el-form-item>
              </div>
            </template>

            <!-- 视频切片 -->
            <template v-else-if="selectedType === 'video_slice'">
              <div class="sg-sec-title">输入</div>
              <el-form-item required>
                <span slot="label">
                  原视频
                  <el-tooltip content="待切片的原始视频" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-popover v-model="form._vsPop.video" placement="bottom-start" trigger="click"
                            :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                  <el-tree v-if="videoSliceBindTree('Video').length" :data="videoSliceBindTree('Video')" node-key="id"
                           default-expand-all :expand-on-click-node="false" :highlight-current="true"
                           :current-node-key="videoSliceBindingValue('video')"
                           @node-click="onVideoSlicePick('video', $event)">
                    <span slot-scope="{ data }" class="sg-tree-node">
                      <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                      <span>{{ data.label }}</span>
                    </span>
                  </el-tree>
                  <div v-else class="sg-tree-empty">暂无数据</div>
                  <div slot="reference" class="sg-vlm-bind" :class="{ 'is-empty': !videoSliceBindingValue('video') }">
                    <i class="el-icon-video-camera sg-vlm-type-ic"></i>
                    <span class="sg-vlm-bind-txt">{{ videoSliceBindLabel('video') || '请选择参数' }}</span>
                    <i v-if="videoSliceBindingValue('video')" class="el-icon-circle-close sg-vlm-bind-clear"
                       @click.stop="clearVideoSliceInput('video')"></i>
                    <i v-else class="el-icon-link sg-vlm-bind-link"></i>
                  </div>
                </el-popover>
              </el-form-item>

              <el-form-item v-for="nf in videoSliceNumericFields" :key="nf.port" required>
                <span slot="label">
                  {{ nf.label }}
                  <el-tooltip :content="nf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <div class="sg-vs-num-row">
                  <el-input-number v-model="form[nf.port]" :min="0" :max="1800" :step="0.1" :precision="4"
                                   controls-position="right" style="flex:1" :disabled="videoSliceBound(nf.port)"
                                   :placeholder="nf.placeholder" @change="applyConfig" />
                  <el-popover v-model="form._vsPop[nf.port]" placement="bottom-start" trigger="click"
                              :width="300" popper-class="sg-param-pop">
                    <el-tree v-if="videoSliceBindTree('Number').length" :data="videoSliceBindTree('Number')" node-key="id"
                             default-expand-all :expand-on-click-node="false" :highlight-current="true"
                             :current-node-key="videoSliceBindingValue(nf.port)"
                             @node-click="onVideoSlicePick(nf.port, $event)">
                      <span slot-scope="{ data }" class="sg-tree-node">
                        <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                        <span>{{ data.label }}</span>
                      </span>
                    </el-tree>
                    <div v-else class="sg-tree-empty">暂无数据</div>
                    <i slot="reference" class="el-icon-link sg-vs-link" title="连接上游参数"></i>
                  </el-popover>
                </div>
                <div v-if="videoSliceBound(nf.port)" class="sg-tip">已连接：{{ videoSliceBindLabel(nf.port) }}</div>
                <div v-else class="sg-tip">仅支持输入数字，取值范围[0, 1800]，最多保留4位小数</div>
              </el-form-item>

              <div class="sg-sec-title">输出</div>
              <div class="sg-io-list">
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#2f7bff"></span>视频片段
                  <i class="el-icon-video-camera sg-io-type-ic"></i>
                </div>
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#eb2f96"></span>成功状态
                  <span class="sg-io-tag">bool.</span>
                </div>
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#722ed1"></span>错误信息
                  <span class="sg-io-tag">str.</span>
                </div>
              </div>
            </template>

            <!-- 区域过滤 -->
            <template v-else-if="selectedType === 'region_filter'">
              <div class="sg-sec-title">输入</div>
              <el-form-item v-for="tf in regionFilterFields" :key="tf.port" required>
                <span slot="label">
                  {{ tf.label }}
                  <el-tooltip :content="tf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-popover v-model="form._rfPop[tf.port]" placement="bottom-start" trigger="click"
                            :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                  <el-tree v-if="intersectBindTree(tf.bindType).length" :data="intersectBindTree(tf.bindType)" node-key="id"
                           default-expand-all :expand-on-click-node="false" :highlight-current="true"
                           :current-node-key="intersectBindingValue(tf.port)"
                           @node-click="onIntersectPick(tf.port, $event)">
                    <span slot-scope="{ data }" class="sg-tree-node">
                      <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                      <span>{{ data.label }}</span>
                    </span>
                  </el-tree>
                  <div v-else class="sg-tree-empty">暂无数据</div>
                  <div slot="reference" class="sg-vlm-bind" :class="{ 'is-empty': !intersectBindingValue(tf.port) }">
                    <i :class="paramTypeIcon(tf.bindType)"></i>
                    <span class="sg-vlm-bind-txt">{{ intersectBindLabel(tf.port) || '请选择参数' }}</span>
                    <i v-if="intersectBindingValue(tf.port)" class="el-icon-circle-close sg-vlm-bind-clear"
                       @click.stop="clearIntersectInput(tf.port)"></i>
                    <i v-else class="el-icon-link sg-vlm-bind-link"></i>
                  </div>
                </el-popover>
              </el-form-item>

              <div class="sg-sec-title">输出</div>
              <div class="sg-io-list">
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#7c5cff"></span>过滤目标标签
                  <span class="sg-io-tag">det.</span>
                </div>
              </div>
            </template>

            <!-- 尺寸过滤 -->
            <template v-else-if="selectedType === 'size_filter'">
              <div class="sg-sec-title">输入</div>
              <el-form-item v-for="tf in sizeFilterTargetFields" :key="tf.port" required>
                <span slot="label">
                  {{ tf.label }}
                  <el-tooltip :content="tf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-popover v-model="form._sfPop[tf.port]" placement="bottom-start" trigger="click"
                            :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                  <el-tree v-if="intersectBindTree('Detection').length" :data="intersectBindTree('Detection')" node-key="id"
                           default-expand-all :expand-on-click-node="false" :highlight-current="true"
                           :current-node-key="intersectBindingValue(tf.port)"
                           @node-click="onIntersectPick(tf.port, $event)">
                    <span slot-scope="{ data }" class="sg-tree-node">
                      <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                      <span>{{ data.label }}</span>
                    </span>
                  </el-tree>
                  <div v-else class="sg-tree-empty">暂无数据</div>
                  <div slot="reference" class="sg-vlm-bind" :class="{ 'is-empty': !intersectBindingValue(tf.port) }">
                    <i class="el-icon-aim sg-vlm-type-ic"></i>
                    <span class="sg-vlm-bind-txt">{{ intersectBindLabel(tf.port) || '请选择参数' }}</span>
                    <i v-if="intersectBindingValue(tf.port)" class="el-icon-circle-close sg-vlm-bind-clear"
                       @click.stop="clearIntersectInput(tf.port)"></i>
                    <i v-else class="el-icon-link sg-vlm-bind-link"></i>
                  </div>
                </el-popover>
              </el-form-item>

              <el-form-item v-for="nf in sizeFilterNumericFields" :key="nf.port" :required="nf.required">
                <span slot="label">
                  {{ nf.label }}
                  <el-tooltip :content="nf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <div class="sg-vs-num-row">
                  <el-input-number v-model="form[nf.port]" :min="nf.min" :max="nf.max" :step="nf.step" :precision="nf.precision"
                                   controls-position="right" style="flex:1" :disabled="intersectBound(nf.port)"
                                   :placeholder="nf.placeholder" @change="applyConfig" />
                  <el-popover v-model="form._sfPop[nf.port]" placement="bottom-start" trigger="click"
                              :width="300" popper-class="sg-param-pop">
                    <el-tree v-if="intersectBindTree('Number').length" :data="intersectBindTree('Number')" node-key="id"
                             default-expand-all :expand-on-click-node="false" :highlight-current="true"
                             :current-node-key="intersectBindingValue(nf.port)"
                             @node-click="onIntersectPick(nf.port, $event)">
                      <span slot-scope="{ data }" class="sg-tree-node">
                        <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                        <span>{{ data.label }}</span>
                      </span>
                    </el-tree>
                    <div v-else class="sg-tree-empty">暂无数据</div>
                    <i slot="reference" class="el-icon-link sg-vs-link" title="连接上游参数"></i>
                  </el-popover>
                </div>
                <div v-if="intersectBound(nf.port)" class="sg-tip">已连接：{{ intersectBindLabel(nf.port) }}</div>
                <div v-else class="sg-tip">{{ nf.hint }}</div>
              </el-form-item>

              <div class="sg-sec-title">输出</div>
              <div class="sg-io-list">
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#7c5cff"></span>满足尺寸的目标
                  <i class="el-icon-aim sg-io-type-ic"></i>
                </div>
              </div>
            </template>

            <!-- 计数 -->
            <template v-else-if="selectedType === 'count'">
              <div class="sg-sec-title">输入</div>
              <el-form-item v-for="tf in countTargetFields" :key="tf.port" required>
                <span slot="label">
                  {{ tf.label }}
                  <el-tooltip :content="tf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-popover v-model="form._countPop[tf.port]" placement="bottom-start" trigger="click"
                            :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                  <el-tree v-if="intersectBindTree(tf.bindType).length" :data="intersectBindTree(tf.bindType)" node-key="id"
                           default-expand-all :expand-on-click-node="false" :highlight-current="true"
                           :current-node-key="intersectBindingValue(tf.port)"
                           @node-click="onIntersectPick(tf.port, $event)">
                    <span slot-scope="{ data }" class="sg-tree-node">
                      <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                      <span>{{ data.label }}</span>
                    </span>
                  </el-tree>
                  <div v-else class="sg-tree-empty">暂无数据</div>
                  <div slot="reference" class="sg-vlm-bind" :class="{ 'is-empty': !intersectBindingValue(tf.port) }">
                    <span class="sg-type-prefix">det.</span>
                    <span class="sg-vlm-bind-txt">{{ intersectBindLabel(tf.port) || '请选择参数' }}</span>
                    <i v-if="intersectBindingValue(tf.port)" class="el-icon-circle-close sg-vlm-bind-clear"
                       @click.stop="clearIntersectInput(tf.port)"></i>
                    <i v-else class="el-icon-link sg-vlm-bind-link"></i>
                  </div>
                </el-popover>
              </el-form-item>

              <div class="sg-sec-title">输出</div>
              <div class="sg-io-list">
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#13c2c2"></span>数量值
                  <span class="sg-io-tag">int.</span>
                </div>
              </div>
            </template>

            <!-- 相交 -->
            <template v-else-if="selectedType === 'intersection'">
              <div class="sg-sec-title">输入</div>
              <el-form-item v-for="tf in intersectionTargetFields" :key="tf.port" required>
                <span slot="label">
                  {{ tf.label }}
                  <el-tooltip :content="tf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-popover v-model="form._intPop[tf.port]" placement="bottom-start" trigger="click"
                            :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                  <el-tree v-if="intersectBindTree('Detection').length" :data="intersectBindTree('Detection')" node-key="id"
                           default-expand-all :expand-on-click-node="false" :highlight-current="true"
                           :current-node-key="intersectBindingValue(tf.port)"
                           @node-click="onIntersectPick(tf.port, $event)">
                    <span slot-scope="{ data }" class="sg-tree-node">
                      <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                      <span>{{ data.label }}</span>
                    </span>
                  </el-tree>
                  <div v-else class="sg-tree-empty">暂无数据</div>
                  <div slot="reference" class="sg-vlm-bind" :class="{ 'is-empty': !intersectBindingValue(tf.port) }">
                    <i class="el-icon-aim sg-vlm-type-ic"></i>
                    <span class="sg-vlm-bind-txt">{{ intersectBindLabel(tf.port) || '请选择参数' }}</span>
                    <i v-if="intersectBindingValue(tf.port)" class="el-icon-circle-close sg-vlm-bind-clear"
                       @click.stop="clearIntersectInput(tf.port)"></i>
                    <i v-else class="el-icon-link sg-vlm-bind-link"></i>
                  </div>
                </el-popover>
              </el-form-item>

              <el-form-item required>
                <span slot="label">
                  交并比计算方法
                  <el-tooltip content="计算两类目标整体相交面积与分母面积之比的方法" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <div class="sg-vs-num-row">
                  <el-select v-model="form.iou_method" style="flex:1" :disabled="intersectBound('iou_method')" @change="applyConfig">
                    <el-option v-for="opt in iouMethodIntOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                  </el-select>
                  <el-popover v-model="form._intPop.iou_method" placement="bottom-start" trigger="click"
                              :width="300" popper-class="sg-param-pop">
                    <el-tree v-if="intersectBindTree('Number').length" :data="intersectBindTree('Number')" node-key="id"
                             default-expand-all :expand-on-click-node="false" :highlight-current="true"
                             :current-node-key="intersectBindingValue('iou_method')"
                             @node-click="onIntersectPick('iou_method', $event)">
                      <span slot-scope="{ data }" class="sg-tree-node">
                        <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                        <span>{{ data.label }}</span>
                      </span>
                    </el-tree>
                    <div v-else class="sg-tree-empty">暂无数据</div>
                    <i slot="reference" class="el-icon-link sg-vs-link" title="连接上游参数"></i>
                  </el-popover>
                </div>
                <div v-if="intersectBound('iou_method')" class="sg-tip">已连接：{{ intersectBindLabel('iou_method') }}</div>
              </el-form-item>

              <el-form-item v-for="nf in intersectionNumericFields" :key="nf.port" :required="nf.required">
                <span slot="label">
                  {{ nf.label }}
                  <el-tooltip :content="nf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <div class="sg-vs-num-row">
                  <el-input-number v-model="form[nf.port]" :min="nf.min" :max="nf.max" :step="nf.step" :precision="nf.precision"
                                   controls-position="right" style="flex:1" :disabled="intersectBound(nf.port)"
                                   :placeholder="nf.placeholder" @change="applyConfig" />
                  <el-popover v-model="form._intPop[nf.port]" placement="bottom-start" trigger="click"
                              :width="300" popper-class="sg-param-pop">
                    <el-tree v-if="intersectBindTree('Number').length" :data="intersectBindTree('Number')" node-key="id"
                             default-expand-all :expand-on-click-node="false" :highlight-current="true"
                             :current-node-key="intersectBindingValue(nf.port)"
                             @node-click="onIntersectPick(nf.port, $event)">
                      <span slot-scope="{ data }" class="sg-tree-node">
                        <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                        <span>{{ data.label }}</span>
                      </span>
                    </el-tree>
                    <div v-else class="sg-tree-empty">暂无数据</div>
                    <i slot="reference" class="el-icon-link sg-vs-link" title="连接上游参数"></i>
                  </el-popover>
                </div>
                <div v-if="intersectBound(nf.port)" class="sg-tip">已连接：{{ intersectBindLabel(nf.port) }}</div>
                <div v-else class="sg-tip">{{ nf.hint }}</div>
              </el-form-item>

              <div class="sg-sec-title">输出</div>
              <div class="sg-io-list">
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#7c5cff"></span>相交目标1的结果
                  <i class="el-icon-aim sg-io-type-ic"></i>
                </div>
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#7c5cff"></span>相交目标2的结果
                  <i class="el-icon-aim sg-io-type-ic"></i>
                </div>
              </div>
            </template>

            <!-- 相交(追踪) -->
            <template v-else-if="selectedType === 'intersect'">
              <div class="sg-sec-title">输入</div>
              <el-form-item v-for="tf in intersectTargetFields" :key="tf.port" required>
                <span slot="label">
                  {{ tf.label }}
                  <el-tooltip :content="tf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-popover v-model="form._isPop[tf.port]" placement="bottom-start" trigger="click"
                            :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                  <el-tree v-if="intersectBindTree('Detection').length" :data="intersectBindTree('Detection')" node-key="id"
                           default-expand-all :expand-on-click-node="false" :highlight-current="true"
                           :current-node-key="intersectBindingValue(tf.port)"
                           @node-click="onIntersectPick(tf.port, $event)">
                    <span slot-scope="{ data }" class="sg-tree-node">
                      <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                      <span>{{ data.label }}</span>
                    </span>
                  </el-tree>
                  <div v-else class="sg-tree-empty">暂无数据</div>
                  <div slot="reference" class="sg-vlm-bind" :class="{ 'is-empty': !intersectBindingValue(tf.port) }">
                    <i class="el-icon-aim sg-vlm-type-ic"></i>
                    <span class="sg-vlm-bind-txt">{{ intersectBindLabel(tf.port) || '请选择参数' }}</span>
                    <i v-if="intersectBindingValue(tf.port)" class="el-icon-circle-close sg-vlm-bind-clear"
                       @click.stop="clearIntersectInput(tf.port)"></i>
                    <i v-else class="el-icon-link sg-vlm-bind-link"></i>
                  </div>
                </el-popover>
              </el-form-item>

              <el-form-item required>
                <span slot="label">
                  交并比计算方法
                  <el-tooltip content="计算两个目标框相交面积与分母面积之比的方法" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-select v-model="form.iou_mode" style="width:100%" @change="applyConfig">
                  <el-option v-for="opt in iouModeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>

              <el-form-item v-for="nf in intersectNumericFields" :key="nf.port" :required="nf.required">
                <span slot="label">
                  {{ nf.label }}
                  <el-tooltip :content="nf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <div class="sg-vs-num-row">
                  <el-input-number v-model="form[nf.port]" :min="nf.min" :max="nf.max" :step="nf.step" :precision="nf.precision"
                                   controls-position="right" style="flex:1" :disabled="intersectBound(nf.port)"
                                   :placeholder="nf.placeholder" @change="applyConfig" />
                  <el-popover v-model="form._isPop[nf.port]" placement="bottom-start" trigger="click"
                              :width="300" popper-class="sg-param-pop">
                    <el-tree v-if="intersectBindTree('Number').length" :data="intersectBindTree('Number')" node-key="id"
                             default-expand-all :expand-on-click-node="false" :highlight-current="true"
                             :current-node-key="intersectBindingValue(nf.port)"
                             @node-click="onIntersectPick(nf.port, $event)">
                      <span slot-scope="{ data }" class="sg-tree-node">
                        <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                        <span>{{ data.label }}</span>
                      </span>
                    </el-tree>
                    <div v-else class="sg-tree-empty">暂无数据</div>
                    <i slot="reference" class="el-icon-link sg-vs-link" title="连接上游参数"></i>
                  </el-popover>
                </div>
                <div v-if="intersectBound(nf.port)" class="sg-tip">已连接：{{ intersectBindLabel(nf.port) }}</div>
                <div v-else class="sg-tip">{{ nf.hint }}</div>
              </el-form-item>

              <div class="sg-sec-title">输出</div>
              <div class="sg-io-list">
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#7c5cff"></span>满足相交的目标1(追踪)
                  <i class="el-icon-aim sg-io-type-ic"></i>
                </div>
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#7c5cff"></span>满足相交的目标2(追踪)
                  <i class="el-icon-aim sg-io-type-ic"></i>
                </div>
              </div>
            </template>

            <!-- 位移(追踪) -->
            <template v-else-if="selectedType === 'displacement'">
              <div class="sg-sec-title">输入</div>
              <el-form-item v-for="tf in displacementTargetFields" :key="tf.port" required>
                <span slot="label">
                  {{ tf.label }}
                  <el-tooltip :content="tf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-popover v-model="form._dispPop[tf.port]" placement="bottom-start" trigger="click"
                            :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                  <el-tree v-if="intersectBindTree('Detection').length" :data="intersectBindTree('Detection')" node-key="id"
                           default-expand-all :expand-on-click-node="false" :highlight-current="true"
                           :current-node-key="intersectBindingValue(tf.port)"
                           @node-click="onIntersectPick(tf.port, $event)">
                    <span slot-scope="{ data }" class="sg-tree-node">
                      <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                      <span>{{ data.label }}</span>
                    </span>
                  </el-tree>
                  <div v-else class="sg-tree-empty">暂无数据</div>
                  <div slot="reference" class="sg-vlm-bind" :class="{ 'is-empty': !intersectBindingValue(tf.port) }">
                    <i class="el-icon-aim sg-vlm-type-ic"></i>
                    <span class="sg-vlm-bind-txt">{{ intersectBindLabel(tf.port) || '请选择参数' }}</span>
                    <i v-if="intersectBindingValue(tf.port)" class="el-icon-circle-close sg-vlm-bind-clear"
                       @click.stop="clearIntersectInput(tf.port)"></i>
                    <i v-else class="el-icon-link sg-vlm-bind-link"></i>
                  </div>
                </el-popover>
              </el-form-item>

              <el-form-item v-for="nf in displacementNumericFieldsH" :key="nf.port" :required="nf.required">
                <span slot="label">
                  {{ nf.label }}
                  <el-tooltip :content="nf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <div class="sg-vs-num-row">
                  <el-input-number v-model="form[nf.port]" :min="nf.min" :max="nf.max" :step="nf.step" :precision="nf.precision"
                                   controls-position="right" style="flex:1" :disabled="intersectBound(nf.port)"
                                   :placeholder="nf.placeholder" @change="applyConfig" />
                  <el-popover v-model="form._dispPop[nf.port]" placement="bottom-start" trigger="click"
                              :width="300" popper-class="sg-param-pop">
                    <el-tree v-if="intersectBindTree('Number').length" :data="intersectBindTree('Number')" node-key="id"
                             default-expand-all :expand-on-click-node="false" :highlight-current="true"
                             :current-node-key="intersectBindingValue(nf.port)"
                             @node-click="onIntersectPick(nf.port, $event)">
                      <span slot-scope="{ data }" class="sg-tree-node">
                        <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                        <span>{{ data.label }}</span>
                      </span>
                    </el-tree>
                    <div v-else class="sg-tree-empty">暂无数据</div>
                    <i slot="reference" class="el-icon-link sg-vs-link" title="连接上游参数"></i>
                  </el-popover>
                </div>
                <div v-if="intersectBound(nf.port)" class="sg-tip">已连接：{{ intersectBindLabel(nf.port) }}</div>
                <div v-else class="sg-tip">{{ nf.hint }}</div>
              </el-form-item>

              <el-form-item v-for="sf in displacementSelectFieldsH" :key="sf.port" required>
                <span slot="label">
                  {{ sf.label }}
                  <el-tooltip :content="sf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-select v-model="form[sf.port]" style="width:100%" :disabled="intersectBound(sf.port)" @change="applyConfig">
                  <el-option v-for="opt in sf.options" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
                <div v-if="intersectBound(sf.port)" class="sg-tip">已连接：{{ intersectBindLabel(sf.port) }}</div>
              </el-form-item>

              <el-form-item v-for="nf in displacementNumericFieldsV" :key="nf.port" :required="nf.required">
                <span slot="label">
                  {{ nf.label }}
                  <el-tooltip :content="nf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <div class="sg-vs-num-row">
                  <el-input-number v-model="form[nf.port]" :min="nf.min" :max="nf.max" :step="nf.step" :precision="nf.precision"
                                   controls-position="right" style="flex:1" :disabled="intersectBound(nf.port)"
                                   :placeholder="nf.placeholder" @change="applyConfig" />
                  <el-popover v-model="form._dispPop[nf.port]" placement="bottom-start" trigger="click"
                              :width="300" popper-class="sg-param-pop">
                    <el-tree v-if="intersectBindTree('Number').length" :data="intersectBindTree('Number')" node-key="id"
                             default-expand-all :expand-on-click-node="false" :highlight-current="true"
                             :current-node-key="intersectBindingValue(nf.port)"
                             @node-click="onIntersectPick(nf.port, $event)">
                      <span slot-scope="{ data }" class="sg-tree-node">
                        <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                        <span>{{ data.label }}</span>
                      </span>
                    </el-tree>
                    <div v-else class="sg-tree-empty">暂无数据</div>
                    <i slot="reference" class="el-icon-link sg-vs-link" title="连接上游参数"></i>
                  </el-popover>
                </div>
                <div v-if="intersectBound(nf.port)" class="sg-tip">已连接：{{ intersectBindLabel(nf.port) }}</div>
                <div v-else class="sg-tip">{{ nf.hint }}</div>
              </el-form-item>

              <el-form-item v-for="sf in displacementSelectFieldsV" :key="sf.port" required>
                <span slot="label">
                  {{ sf.label }}
                  <el-tooltip :content="sf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-select v-model="form[sf.port]" style="width:100%" :disabled="intersectBound(sf.port)" @change="applyConfig">
                  <el-option v-for="opt in sf.options" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
                <div v-if="intersectBound(sf.port)" class="sg-tip">已连接：{{ intersectBindLabel(sf.port) }}</div>
              </el-form-item>

              <el-form-item required>
                <span slot="label">
                  同时满足垂直和水平条件
                  <el-tooltip content="开启时要求水平和垂直位移条件同时满足，关闭时任一满足即可" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-select v-model="form.both_axes" style="width:100%" @change="applyConfig">
                  <el-option label="是" :value="true" />
                  <el-option label="否" :value="false" />
                </el-select>
              </el-form-item>

              <el-form-item v-for="nf in displacementNumericFieldsTime" :key="nf.port" :required="nf.required">
                <span slot="label">
                  {{ nf.label }}
                  <el-tooltip :content="nf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <div class="sg-vs-num-row">
                  <el-input-number v-model="form[nf.port]" :min="nf.min" :max="nf.max" :step="nf.step" :precision="nf.precision"
                                   controls-position="right" style="flex:1" :disabled="intersectBound(nf.port)"
                                   :placeholder="nf.placeholder" @change="applyConfig" />
                  <el-popover v-model="form._dispPop[nf.port]" placement="bottom-start" trigger="click"
                              :width="300" popper-class="sg-param-pop">
                    <el-tree v-if="intersectBindTree('Number').length" :data="intersectBindTree('Number')" node-key="id"
                             default-expand-all :expand-on-click-node="false" :highlight-current="true"
                             :current-node-key="intersectBindingValue(nf.port)"
                             @node-click="onIntersectPick(nf.port, $event)">
                      <span slot-scope="{ data }" class="sg-tree-node">
                        <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                        <span>{{ data.label }}</span>
                      </span>
                    </el-tree>
                    <div v-else class="sg-tree-empty">暂无数据</div>
                    <i slot="reference" class="el-icon-link sg-vs-link" title="连接上游参数"></i>
                  </el-popover>
                </div>
                <div v-if="intersectBound(nf.port)" class="sg-tip">已连接：{{ intersectBindLabel(nf.port) }}</div>
                <div v-else class="sg-tip">{{ nf.hint }}</div>
              </el-form-item>

              <div class="sg-sec-title">输出</div>
              <div class="sg-io-list">
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#7c5cff"></span>满足位移的目标(追踪)
                  <i class="el-icon-aim sg-io-type-ic"></i>
                </div>
              </div>
            </template>

            <!-- 绊线(追踪) -->
            <template v-else-if="selectedType === 'tripwire_tracking'">
              <div class="sg-sec-title">输入</div>
              <el-form-item v-for="tf in tripwireTrackingFields" :key="tf.port" required>
                <span slot="label">
                  {{ tf.label }}
                  <el-tooltip :content="tf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-popover v-model="form._ttPop[tf.port]" placement="bottom-start" trigger="click"
                            :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                  <el-tree v-if="intersectBindTree(tf.bindType).length" :data="intersectBindTree(tf.bindType)" node-key="id"
                           default-expand-all :expand-on-click-node="false" :highlight-current="true"
                           :current-node-key="intersectBindingValue(tf.port)"
                           @node-click="onIntersectPick(tf.port, $event)">
                    <span slot-scope="{ data }" class="sg-tree-node">
                      <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                      <span>{{ data.label }}</span>
                    </span>
                  </el-tree>
                  <div v-else class="sg-tree-empty">暂无数据</div>
                  <div slot="reference" class="sg-vlm-bind" :class="{ 'is-empty': !intersectBindingValue(tf.port) }">
                    <i :class="paramTypeIcon(tf.bindType)"></i>
                    <span class="sg-vlm-bind-txt">{{ intersectBindLabel(tf.port) || '请选择参数' }}</span>
                    <i v-if="intersectBindingValue(tf.port)" class="el-icon-circle-close sg-vlm-bind-clear"
                       @click.stop="clearIntersectInput(tf.port)"></i>
                    <i v-else class="el-icon-link sg-vlm-bind-link"></i>
                  </div>
                </el-popover>
              </el-form-item>

              <div class="sg-sec-title">输出</div>
              <div class="sg-io-list">
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#7c5cff"></span>跨线目标
                  <i class="el-icon-aim sg-io-type-ic"></i>
                </div>
              </div>
            </template>

            <!-- 距离 -->
            <template v-else-if="selectedType === 'distance'">
              <div class="sg-sec-title">输入</div>
              <el-form-item v-for="tf in distanceTargetFields" :key="tf.port" required>
                <span slot="label">
                  {{ tf.label }}
                  <el-tooltip :content="tf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-popover v-model="form._distPop[tf.port]" placement="bottom-start" trigger="click"
                            :width="300" popper-class="sg-param-pop" style="display:block;width:100%">
                  <el-tree v-if="intersectBindTree('Detection').length" :data="intersectBindTree('Detection')" node-key="id"
                           default-expand-all :expand-on-click-node="false" :highlight-current="true"
                           :current-node-key="intersectBindingValue(tf.port)"
                           @node-click="onIntersectPick(tf.port, $event)">
                    <span slot-scope="{ data }" class="sg-tree-node">
                      <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                      <span>{{ data.label }}</span>
                    </span>
                  </el-tree>
                  <div v-else class="sg-tree-empty">暂无数据</div>
                  <div slot="reference" class="sg-vlm-bind" :class="{ 'is-empty': !intersectBindingValue(tf.port) }">
                    <i class="el-icon-aim sg-vlm-type-ic"></i>
                    <span class="sg-vlm-bind-txt">{{ intersectBindLabel(tf.port) || '请选择参数' }}</span>
                    <i v-if="intersectBindingValue(tf.port)" class="el-icon-circle-close sg-vlm-bind-clear"
                       @click.stop="clearIntersectInput(tf.port)"></i>
                    <i v-else class="el-icon-link sg-vlm-bind-link"></i>
                  </div>
                </el-popover>
              </el-form-item>

              <el-form-item v-for="nf in distanceNumericFields" :key="nf.port" :required="nf.required">
                <span slot="label">
                  {{ nf.label }}
                  <el-tooltip :content="nf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <div class="sg-vs-num-row">
                  <el-input-number v-model="form[nf.port]" :min="nf.min" :max="nf.max" :step="nf.step" :precision="nf.precision"
                                   controls-position="right" style="flex:1" :disabled="intersectBound(nf.port)"
                                   :placeholder="nf.placeholder" @change="applyConfig" />
                  <el-popover v-model="form._distPop[nf.port]" placement="bottom-start" trigger="click"
                              :width="300" popper-class="sg-param-pop">
                    <el-tree v-if="intersectBindTree('Number').length" :data="intersectBindTree('Number')" node-key="id"
                             default-expand-all :expand-on-click-node="false" :highlight-current="true"
                             :current-node-key="intersectBindingValue(nf.port)"
                             @node-click="onIntersectPick(nf.port, $event)">
                      <span slot-scope="{ data }" class="sg-tree-node">
                        <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                        <span>{{ data.label }}</span>
                      </span>
                    </el-tree>
                    <div v-else class="sg-tree-empty">暂无数据</div>
                    <i slot="reference" class="el-icon-link sg-vs-link" title="连接上游参数"></i>
                  </el-popover>
                </div>
                <div v-if="intersectBound(nf.port)" class="sg-tip">已连接：{{ intersectBindLabel(nf.port) }}</div>
                <div v-else class="sg-tip">{{ nf.hint }}</div>
              </el-form-item>

              <el-form-item required>
                <span slot="label">
                  同时满足垂直和水平条件
                  <el-tooltip content="开启时要求水平和垂直距离条件同时满足，关闭时任一满足即可" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-select v-model="form.both_axes" style="width:100%" @change="applyConfig">
                  <el-option label="是" :value="true" />
                  <el-option label="否" :value="false" />
                </el-select>
              </el-form-item>

              <div class="sg-sec-title">输出</div>
              <div class="sg-io-list">
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#7c5cff"></span>距离目标1的标签
                  <i class="el-icon-aim sg-io-type-ic"></i>
                </div>
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#7c5cff"></span>距离目标2的标签
                  <i class="el-icon-aim sg-io-type-ic"></i>
                </div>
              </div>
            </template>

            <!-- 条件分支 -->
            <template v-else-if="selectedType === 'judge'">
              <div class="sg-sec-title">
                <span>配置</span>
              </div>
              <div class="sg-judge-cond-head">
                <span class="sg-judge-cond-title">判断条件 <i class="sg-req-star">*</i></span>
                <el-tooltip content="最多添加10个条件组" placement="top">
                  <el-button icon="el-icon-plus" size="mini" circle
                             :disabled="(form.groups || []).length >= judgeMaxGroups"
                             @click="addGroup" />
                </el-tooltip>
              </div>

              <div class="sg-judge-groups-outer">
                <div v-if="(form.groups || []).length > 1" class="sg-judge-global-rel-wrap">
                  <el-select v-model="form.global_relation" size="mini" class="sg-judge-global-rel" @change="applyConfig">
                    <el-option v-for="ro in judgeGlobalRelationOptions" :key="ro.v" :label="ro.l" :value="ro.v" />
                  </el-select>
                </div>
                <div class="sg-judge-groups-list">
                  <div v-for="(grp, gi) in form.groups" :key="gi" class="sg-cond-group sg-judge-group">
                    <div class="sg-cond-group-head">
                      <span>条件组{{ gi + 1 }} <i class="sg-req-star">*</i></span>
                      <i class="el-icon-delete sg-judge-group-del" title="删除条件组"
                         @click="removeGroup(gi)"></i>
                    </div>
                    <div class="sg-judge-group-body">
                      <div v-if="(grp.conditions || []).length > 1" class="sg-judge-relation-wrap">
                        <el-select v-model="grp.relation" size="mini" class="sg-judge-relation" @change="applyConfig">
                          <el-option v-for="ro in judgeRelationOptions" :key="ro.v" :label="ro.l" :value="ro.v" />
                        </el-select>
                      </div>
                      <div class="sg-judge-conds-wrap">
                        <div v-for="(c, ci) in grp.conditions" :key="ci" class="sg-judge-cond-item">
                          <div class="sg-judge-cond-row">
                            <div class="sg-judge-param-wrap">
                              <el-popover v-model="c._paramPop" placement="bottom-start" trigger="click"
                                          :width="300" popper-class="sg-param-pop">
                                <el-tree v-if="judgeParamTree.length" :data="judgeParamTree" node-key="id"
                                         default-expand-all :expand-on-click-node="false" :highlight-current="true"
                                         :current-node-key="c.param_ref"
                                         @node-click="onJudgeParamPick(gi, ci, $event)">
                                  <span slot-scope="{ data }" class="sg-tree-node">
                                    <i :class="[data.icon, data.isNode ? 'sg-tree-nodeic' : 'sg-opt-ic']"></i>
                                    <span>{{ data.label }}</span>
                                  </span>
                                </el-tree>
                                <div v-else class="sg-tree-empty">暂无数据</div>
                                <div slot="reference" class="sg-vlm-bind sg-judge-param-ref"
                                     :class="{ 'is-empty': !c.param_ref, 'is-invalid': judgeCondShowErr(c) && !c.param_ref }">
                                  <i :class="judgeParamTypeIcon(c.param_type)"></i>
                                  <span class="sg-vlm-bind-txt">{{ judgeParamLabel(c.param_ref) || '请选择参数' }}</span>
                                  <i v-if="c.param_ref" class="el-icon-circle-close sg-vlm-bind-clear"
                                     @click.stop="clearJudgeParam(gi, ci)"></i>
                                  <i v-else class="el-icon-arrow-down sg-judge-param-arrow"></i>
                                </div>
                              </el-popover>
                            </div>
                            <div class="sg-judge-cond-fields">
                              <el-select v-model="c.operator" size="mini" placeholder="条件"
                                         :disabled="!c.param_type"
                                         :class="{ 'is-invalid-select': judgeCondShowErr(c) && !c.operator }"
                                         @change="onJudgeOperatorChange(gi, ci)">
                                <el-option v-for="op in judgeOperatorsForType(c.param_type)" :key="op.v"
                                           :label="op.l" :value="op.v" />
                              </el-select>
                              <el-input v-model="c.value" size="mini" placeholder="条件值"
                                        :disabled="!c.operator || !judgeCondNeedsValue(c.operator)"
                                        :class="{ 'is-invalid-input': judgeCondShowErr(c) && judgeCondValueMissing(c) }"
                                        @input="applyConfig" />
                              <el-button icon="el-icon-minus" size="mini" circle class="sg-judge-cond-del"
                                         @click="removeCond(gi, ci)" />
                            </div>
                          </div>
                          <div v-if="judgeCondShowErr(c)" class="sg-judge-cond-err">
                            {{ judgeCondErrText(c) }}
                          </div>
                        </div>
                        <el-tooltip content="最多添加10个条件" placement="top">
                          <el-button type="text" class="sg-judge-add-cond"
                                     :disabled="(grp.conditions || []).length >= judgeMaxConditions"
                                     @click="addCond(gi)">
                            <i class="el-icon-plus"></i> 添加条件
                          </el-button>
                        </el-tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="sg-judge-same-target">
                <span class="sg-judge-same-target-lbl">
                  相同目标判断
                  <el-tooltip content="开启后引用的参数来自于同一个目标则条件组成立" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <el-switch v-model="form.same_target" @change="applyConfig" />
              </div>

              <div v-if="judgeConfigInvalid" class="sg-judge-global-err">请检查条件分支配置</div>

              <el-form-item v-for="nf in judgeDurationFields" :key="nf.port" :required="nf.required">
                <span slot="label">
                  {{ nf.label }}
                  <el-tooltip :content="nf.tip" placement="top">
                    <i class="el-icon-question sg-field-help"></i>
                  </el-tooltip>
                </span>
                <div class="sg-vs-num-row">
                  <span class="sg-type-prefix">dou.</span>
                  <el-input-number v-model="form[nf.port]" :min="nf.min" :max="nf.max"
                                   :step="nf.step" :precision="nf.precision" controls-position="right"
                                   style="flex:1" @change="applyConfig" />
                </div>
                <div class="sg-tip">{{ nf.hint }}</div>
              </el-form-item>

              <div class="sg-sec-title">输出</div>
              <div class="sg-io-list">
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#16b777"></span>真
                  <i class="el-icon-success sg-io-type-ic" style="color:#16b777"></i>
                </div>
                <div class="sg-io-item">
                  <span class="sg-io-dot" style="--c:#f5566c"></span>假
                  <i class="el-icon-error sg-io-type-ic" style="color:#f5566c"></i>
                </div>
              </div>
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
                <div v-for="(op, oi) in form.out_params" :key="oi" class="sg-param-item">
                <div class="sg-param-row">
                  <el-input v-model="op.name" size="mini" maxlength="30" placeholder="请输入参数名"
                            class="c-name" :class="{ 'is-invalid': !paramNameValid(op.name) }" @input="applyConfig" />
                  <el-select v-model="op.ref" size="mini" class="c-type" placeholder="请选择参数" @change="applyConfig">
                    <el-option v-for="r in refParamOptions" :key="r" :label="r" :value="r" />
                  </el-select>
                  <i class="el-icon-remove-outline sg-param-del c-act" title="删除"
                     @click="removeEndParam(oi)"></i>
                </div>
                <div v-if="!paramNameValid(op.name)" class="sg-param-err">参数名必须以字母开头，只能包含字母、数字、下划线</div>
                </div>

                <div class="sg-out-label">输出信息</div>
                <el-input ref="endMsgInput" v-model="form.message" type="textarea" :rows="4" maxlength="255" show-word-limit
                          placeholder='请输入输出信息，点击下方标签可快捷插入' @input="applyConfig" />
                <div v-if="endRefTokens.length" class="sg-token-bar">
                  <span class="sg-token-tip">可插入标签：</span>
                  <span v-for="t in endRefTokens" :key="t.token" class="sg-token" :title="t.token"
                        @click="insertToken(t.token)">{{ t.label }}</span>
                </div>
                <div v-else class="sg-tip">先把上游节点（如计数、视觉模型）连到本结束节点，这里会列出可插入的标签。</div>
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
                <div v-for="(pp, pi) in form.input_params" :key="pi" class="sg-param-item">
                <div class="sg-param-row">
                  <el-input v-model="pp.name" size="mini" maxlength="30" placeholder="请输入参数名"
                            class="c-name" :class="{ 'is-invalid': !paramNameValid(pp.name) }" @input="applyConfig" />
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
                <div v-if="!paramNameValid(pp.name)" class="sg-param-err">参数名必须以字母开头，只能包含字母、数字、下划线</div>
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

      <!-- 自定义节点：代码编辑面板（覆盖左侧节点面板 + 画布，保留右侧配置抽屉） -->
      <div v-if="codeEditorOpen" class="sg-code-panel">
        <div class="sg-code-panel-head">
          <span class="sg-code-panel-lang">Python</span>
          <i class="el-icon-s-fold sg-code-panel-close" title="收起" @click="closeCodeEditor"></i>
        </div>
        <div class="sg-code-panel-body">
          <div ref="codeEditor" class="sg-code-editor"></div>
        </div>
        <div class="sg-code-panel-foot">
          <div class="sg-code-test-col">
            <div class="sg-code-test-head">
              <span>输入参数</span>
              <el-button size="mini" type="primary" plain :loading="codeTestLoading" @click="runCustomCodeTest">模拟测试</el-button>
            </div>
            <textarea v-model="codeTestInput" class="sg-code-test-input" spellcheck="false"
                      placeholder='{"input": "hello"}'></textarea>
          </div>
          <div class="sg-code-test-col">
            <div class="sg-code-test-head">
              <span>输出结果</span>
              <span class="sg-code-test-actions">
                <el-button v-if="codeTestOutput" size="mini" type="text" @click="parseTestOutputToParams">解析到输出参数</el-button>
                <el-button v-if="codeTestOutput" size="mini" type="text" @click="copyCodeTestOutput">复制</el-button>
              </span>
            </div>
            <pre class="sg-code-test-output">{{ codeTestOutput || '请在左侧填写输入数据，进行查看输出结果' }}</pre>
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
        提示：评测把每张图当单帧处理，条件分支的"持续时间"建议设为 0。
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

    <!-- 小图批处理：推理模型选择浮层 -->
    <div v-if="batchPicker.visible" class="sg-batch-picker-mask" @click="closeBatchPicker"></div>
    <div v-if="batchPicker.visible" class="sg-batch-picker" :style="batchPickerStyle" @click.stop>
      <div class="sg-batch-picker-title">模型节点选择</div>
      <div class="sg-batch-picker-item" @click="selectBatchModel('vlm_model')">
        <span class="sg-batch-picker-ic vlm"><i class="el-icon-cpu"></i></span>
        <div class="sg-batch-picker-meta">
          <div class="sg-batch-picker-name">多模态大模型</div>
          <div class="sg-batch-picker-desc">调用多模态大模型，通过提示词描述理解图片内容</div>
        </div>
      </div>
      <div class="sg-batch-picker-item" @click="selectBatchModel('detection_model')">
        <span class="sg-batch-picker-ic det"><i class="el-icon-picture-outline"></i></span>
        <div class="sg-batch-picker-meta">
          <div class="sg-batch-picker-name">视觉模型</div>
          <div class="sg-batch-picker-desc">调用视觉模型，识别图片中的目标和属性信息</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import LogicFlow from '@logicflow/core'
import '@logicflow/core/dist/style/index.css'
import { HtmlNode, HtmlNodeModel } from '@logicflow/core'
import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/material-darker.css'
import 'codemirror/mode/python/python'
import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/addon/edit/closebrackets'
import 'codemirror/addon/runmode/runmode'
import { skillGraphAPI, modelAPI } from '@/components/service/VisionAIService.js'

// 节点类型 -> 端口（用于自定义锚点）的缓存，由 node-types 接口填充
const PORT_MAP = {}

// 前端扩展节点：目标抠图推理 + 附带小图批处理
const EXTRA_NODE_TYPES = [
  {
    type: 'target_matting',
    category: 'process',
    name_zh: '目标抠图推理',
    description: '对目标区域抠图并进行推理，并将推理结果将还原到原图。',
    has_companion: true,
    companion_type: 'small_image_batch',
    input_ports: { image: 'Image', target: 'Detection' },
    output_ports: { small_images: 'Array', target: 'Detection' }
  },
  {
    type: 'small_image_batch',
    category: 'process',
    name_zh: '小图批处理',
    description: '对小图序列批量调用推理模型',
    hidden_in_palette: true,
    input_ports: { small_images: 'Array' },
    output_ports: { output: 'String' }
  }
]

const DEFAULT_CUSTOM_CODE = `def main(inputs):
    """
    inputs: 这是一个字典，包含了当前输入配置中映射的所有变量
    """
    # 1. 获取输入
    input_value = inputs.get("input", "")

    # 2. 编写你的逻辑
    result_value = input_value

    # 3. 返回结果
    result = {
        "output": result_value
    }
    return result`

// 节点大类的主题色与图标
const CAT_META = {
  start: { color: '#16b777', icon: 'el-icon-video-play' },
  model: { color: '#7c5cff', icon: 'el-icon-picture-outline' },
  process: { color: '#2f7bff', icon: 'el-icon-set-up' },
  judge: { color: '#fa8c16', icon: 'el-icon-share' },
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
  intersect: 'el-icon-aim',
  intersection: 'el-icon-aim',
  displacement: 'el-icon-rank',
  tripwire_tracking: 'el-icon-right',
  distance: 'el-icon-rank',
  count: 'el-icon-data-line',
  video_slice: 'el-icon-video-camera',
  judge: 'el-icon-share',
  custom_code: 'el-icon-edit-outline',
  target_matting: 'el-icon-crop',
  small_image_batch: 'el-icon-cpu'
}
// 端口类型 -> 展示标签与颜色
const PT_META = {
  Image: { label: '图片', color: '#2f7bff' },
  Video: { label: '视频', color: '#2f7bff' },
  Detection: { label: '目标', color: '#7c5cff' },
  ROI: { label: '电子围栏', color: '#16b777' },
  Tripwire: { label: '绊线', color: '#fa8c16' },
  Number: { label: '数值', color: '#13c2c2' },
  Boolean: { label: '布尔', color: '#eb2f96' },
  String: { label: '文本', color: '#722ed1' },
  Params: { label: '参数', color: '#faad14' },
  Array: { label: '数组', color: '#faad14' },
  Any: { label: '任意', color: '#909399' }
}
// 端口名 -> 友好中文（找不到则回退到端口类型标签 / 端口名）
const PORT_LABELS = {
  image: '图片', roi: '电子围栏', trigger: '触发',
  targets: '目标',
  targets1: '相交目标1 (追踪)', targets2: '相交目标2 (追踪)',
  result1: '相交目标1的结果', result2: '相交目标2的结果',
  target1: '距离目标1的标签', target2: '距离目标2的标签',
  targets: '跨线目标（追踪）', tripwire: '绊线', crossed: '跨线目标',
  matched1: '满足相交的目标1(追踪)', matched2: '满足相交的目标2(追踪)',
  period: '位移计算周期(s)',
  h_min: '水平移动距离下限(px)', h_max: '水平移动距离上限(px)', h_direction: '目标水平移动方向',
  v_min: '垂直移动距离下限(px)', v_max: '垂直移动距离上限(px)', v_direction: '目标垂直移动方向',
  both_axes: '同时满足垂直和水平条件',
  iou_threshold: '交并比阈值下限', iou_method: '交并比计算方法', duration: '持续时间 (s)',
  target: '目标', target1: '目标1', target2: '目标2',
  count: '数量', passed: '判定', value: '值', result: '结果',
  detections: '检测目标', filter_target: '过滤目标', filtered_targets: '过滤目标标签',
  crossed: '越线目标', matched: '配对目标',
  output: '输出', filtered: '过滤结果',
  video: '原视频', start_time: '开始时间（秒）', end_time: '结束时间（秒）', buffer: '前后缓冲区间（秒）',
  video_clip: '视频片段', success: '成功状态', error_message: '错误信息',
  small_images: '小图序列'
}

const VIDEO_SLICE_NUMERIC_FIELDS = [
  { port: 'start_time', label: '开始时间（秒）', placeholder: '请输入开始时间（秒）', tip: '切片起始时间，单位秒' },
  { port: 'end_time', label: '结束时间（秒）', placeholder: '请输入结束时间（秒）', tip: '切片结束时间，单位秒' },
  { port: 'buffer', label: '前后缓冲区间（秒）', placeholder: '0.0', tip: '在开始/结束时间基础上向前后扩展的缓冲时长' }
]

const INTERSECTION_TARGET_FIELDS = [
  { port: 'targets1', label: '相交目标1', tip: '第一类待判断相交关系的目标列表' },
  { port: 'targets2', label: '相交目标2', tip: '第二类待判断相交关系的目标列表' }
]

const INTERSECTION_NUMERIC_FIELDS = [
  {
    port: 'iou_threshold', label: '交并比阈值下限', placeholder: '0.5', required: true,
    min: 0, max: 1, step: 0.05, precision: 4,
    tip: '两类目标整体相交面积与分母面积之比的下限阈值',
    hint: '仅支持输入数字，取值范围[0, 1]，最多保留4位小数'
  }
]

const IOU_METHOD_INT_OPTIONS = [
  { value: 0, label: '以相交后并集面积做分母' },
  { value: 1, label: '以较小面积作为分母' },
  { value: 2, label: '以较大面积作为分母' }
]

const IOU_METHOD_INT_LABELS = {
  0: '以相交后并集面积做分母',
  1: '以较小面积作为分母',
  2: '以较大面积作为分母'
}

const INTERSECT_TARGET_FIELDS = [
  { port: 'targets1', label: '相交目标1 (追踪)', tip: '第一类待判断相交关系的追踪目标列表' },
  { port: 'targets2', label: '相交目标2 (追踪)', tip: '第二类待判断相交关系的追踪目标列表' }
]

const TRIPWIRE_TRACKING_FIELDS = [
  { port: 'targets', label: '跨线目标（追踪）', tip: '待判断跨线关系的追踪目标列表', bindType: 'Detection' },
  { port: 'tripwire', label: '绊线', tip: '用于判断跨线方向的绊线参数', bindType: 'Tripwire' }
]

const REGION_FILTER_FIELDS = [
  { port: 'image', label: '尺寸参照图片', tip: '用于确定电子围栏与目标坐标的尺寸参照', bindType: 'Image' },
  { port: 'filter_target', label: '过滤目标', tip: '待按电子围栏区域筛选的检测目标列表', bindType: 'Detection' },
  { port: 'roi', label: '电子围栏', tip: '用于筛选目标的电子围栏区域', bindType: 'ROI' }
]

const COUNT_TARGET_FIELDS = [
  { port: 'count_target', label: '计数目标', tip: '待统计数量的目标列表', bindType: 'Detection' }
]

const SIZE_FILTER_TARGET_FIELDS = [
  { port: 'detections', label: '过滤目标', tip: '待按尺寸条件过滤的目标列表' }
]

const SIZE_FILTER_NUMERIC_FIELDS = [
  {
    port: 'min_width', label: '目标宽度下限(px)', placeholder: '0.0', required: true,
    min: 0, max: 8192, step: 1, precision: 4,
    tip: '目标框宽度需达到的最小像素值',
    hint: '仅支持输入数字，取值范围[0, 8192]，最多保留4位小数'
  },
  {
    port: 'max_width', label: '目标宽度上限(px)', placeholder: '1920.0', required: true,
    min: 0, max: 8192, step: 1, precision: 4,
    tip: '目标框宽度允许的最大像素值',
    hint: '仅支持输入数字，取值范围[0, 8192]，最多保留4位小数'
  },
  {
    port: 'min_height', label: '目标高度下限(px)', placeholder: '0.0', required: true,
    min: 0, max: 8192, step: 1, precision: 4,
    tip: '目标框高度需达到的最小像素值',
    hint: '仅支持输入数字，取值范围[0, 8192]，最多保留4位小数'
  },
  {
    port: 'max_height', label: '目标高度上限(px)', placeholder: '1080.0', required: true,
    min: 0, max: 8192, step: 1, precision: 4,
    tip: '目标框高度允许的最大像素值',
    hint: '仅支持输入数字，取值范围[0, 8192]，最多保留4位小数'
  }
]

const INTERSECT_NUMERIC_FIELDS = [
  {
    port: 'iou_threshold', label: '交并比阈值下限', placeholder: '0.5', required: true,
    min: 0, max: 1, step: 0.05, precision: 4,
    tip: '两个目标框相交面积与分母面积之比的下限阈值',
    hint: '仅支持输入数字，取值范围[0, 1]，最多保留4位小数'
  },
  {
    port: 'duration', label: '持续时间 (s)', placeholder: '0.0', required: true,
    min: 0, max: 3600, step: 0.1, precision: 4,
    tip: '相交状态需连续满足的时长，单位秒',
    hint: '仅支持输入数字，取值范围[0, 3600]，最多保留4位小数'
  },
  {
    port: 'buffer', label: '缓冲时间 (s)', placeholder: '0.0', required: false,
    min: 0, max: 3600, step: 0.1, precision: 4,
    tip: '计时过程中允许相交状态短暂不满足而不打断计时',
    hint: '仅支持输入数字，取值范围[0, 3600]，最多保留4位小数'
  }
]

const IOU_MODE_OPTIONS = [
  { value: 'union', label: '以相交后并集面积做分母' },
  { value: 'min', label: '以较小面积作为分母' },
  { value: 'max', label: '以较大面积作为分母' }
]

const IOU_MODE_LABELS = {
  union: '以相交后并集面积做分母',
  min: '以较小面积作为分母',
  max: '以较大面积作为分母'
}

const DISPLACEMENT_TARGET_FIELDS = [
  { port: 'targets', label: '位移目标（追踪）', tip: '待判断位移情况的追踪目标列表' }
]

const DISPLACEMENT_NUMERIC_FIELDS_H = [
  {
    port: 'period', label: '位移计算周期(s)', placeholder: '0', required: true,
    min: 0, max: 3600, step: 1, precision: 0,
    tip: '计算目标位移的时间窗口，单位秒',
    hint: '请输入整数，取值范围[0, 3600]'
  },
  {
    port: 'h_min', label: '水平移动距离下限(px)', placeholder: '0.0', required: true,
    min: 0, max: 1000000, step: 1, precision: 4,
    tip: '目标水平位移需达到的最小距离',
    hint: '仅支持输入数字，取值范围[0, 1000000]，最多保留4位小数'
  },
  {
    port: 'h_max', label: '水平移动距离上限(px)', placeholder: '1000000.0', required: true,
    min: 0, max: 1000000, step: 1, precision: 4,
    tip: '目标水平位移允许的最大距离',
    hint: '仅支持输入数字，取值范围[0, 1000000]，最多保留4位小数'
  }
]

const DISPLACEMENT_SELECT_FIELDS_H = [
  {
    port: 'h_direction', label: '目标水平移动方向',
    tip: '限定目标水平位移的方向',
    options: [
      { value: '左', label: '左' },
      { value: '右', label: '右' },
      { value: '双向', label: '双向' }
    ]
  }
]

const DISPLACEMENT_NUMERIC_FIELDS_V = [
  {
    port: 'v_min', label: '垂直移动距离下限(px)', placeholder: '0.0', required: true,
    min: 0, max: 1000000, step: 1, precision: 4,
    tip: '目标垂直位移需达到的最小距离',
    hint: '仅支持输入数字，取值范围[0, 1000000]，最多保留4位小数'
  },
  {
    port: 'v_max', label: '垂直移动距离上限(px)', placeholder: '1000000.0', required: true,
    min: 0, max: 1000000, step: 1, precision: 4,
    tip: '目标垂直位移允许的最大距离',
    hint: '仅支持输入数字，取值范围[0, 1000000]，最多保留4位小数'
  }
]

const DISPLACEMENT_SELECT_FIELDS_V = [
  {
    port: 'v_direction', label: '目标垂直移动方向',
    tip: '限定目标垂直位移的方向',
    options: [
      { value: '上', label: '上' },
      { value: '下', label: '下' },
      { value: '双向', label: '双向' }
    ]
  }
]

const DISPLACEMENT_NUMERIC_FIELDS_TIME = [
  {
    port: 'duration', label: '持续时间(s)', placeholder: '0.0', required: true,
    min: 0, max: 3600, step: 0.1, precision: 4,
    tip: '位移条件需连续满足的时长，单位秒',
    hint: '仅支持输入数字，取值范围[0, 3600]，最多保留4位小数'
  },
  {
    port: 'buffer', label: '缓冲时间(s)', placeholder: '0.0', required: true,
    min: 0, max: 3600, step: 0.1, precision: 4,
    tip: '计时过程中允许位移条件短暂不满足而不打断计时',
    hint: '仅支持输入数字，取值范围[0, 3600]，最多保留4位小数'
  }
]

const DISTANCE_TARGET_FIELDS = [
  { port: 'targets1', label: '距离目标1', tip: '第一类待判断距离关系的目标列表' },
  { port: 'targets2', label: '距离目标2', tip: '第二类待判断距离关系的目标列表' }
]

const DISTANCE_NUMERIC_FIELDS = [
  {
    port: 'h_min', label: '水平距离下限(px)', placeholder: '0.0', required: true,
    min: 0, max: 1000000, step: 1, precision: 4,
    tip: '两类目标中心点水平间距需达到的最小值',
    hint: '仅支持输入数字，取值范围[0, 1000000]，最多保留4位小数'
  },
  {
    port: 'h_max', label: '水平距离上限(px)', placeholder: '1000000.0', required: true,
    min: 0, max: 1000000, step: 1, precision: 4,
    tip: '两类目标中心点水平间距允许的最大值',
    hint: '仅支持输入数字，取值范围[0, 1000000]，最多保留4位小数'
  },
  {
    port: 'v_min', label: '垂直距离下限(px)', placeholder: '0.0', required: true,
    min: 0, max: 1000000, step: 1, precision: 4,
    tip: '两类目标中心点垂直间距需达到的最小值',
    hint: '仅支持输入数字，取值范围[0, 1000000]，最多保留4位小数'
  },
  {
    port: 'v_max', label: '垂直距离上限(px)', placeholder: '1000000.0', required: true,
    min: 0, max: 1000000, step: 1, precision: 4,
    tip: '两类目标中心点垂直间距允许的最大值',
    hint: '仅支持输入数字，取值范围[0, 1000000]，最多保留4位小数'
  }
]

// 检测目标可引用的常见属性（结束节点文案 {端口.属性} 用）
const DETECTION_ATTRS = [
  { k: 'plate_text', l: '车牌号' },
  { k: 'label', l: '类别' },
  { k: 'confidence', l: '置信度' },
  { k: 'track_id', l: '跟踪ID' }
]

const JUDGE_MAX_GROUPS = 10
const JUDGE_MAX_CONDITIONS = 10
const JUDGE_OPERATORS_BY_TYPE = {
  String: ['等于', '不等于', '包含', '不包含', '为空', '不为空'],
  TemplateString: ['为空', '不为空'],
  Integer: ['等于', '不等于', '大于等于', '小于等于', '大于', '小于', '为空', '不为空'],
  Double: ['等于', '不等于', '大于等于', '小于等于', '大于', '小于', '为空', '不为空'],
  Boolean: ['等于', '不等于', '为空', '不为空'],
  Time: ['等于', '不等于', '大于等于', '小于等于', '大于', '小于', '为空', '不为空'],
  Image: ['为空', '不为空'],
  Video: ['为空', '不为空'],
  Detection: ['为空', '不为空'],
  TrackDetection: ['等于', '不等于', '包含', '不包含', '为空', '不为空'],
  AttributeGroup: ['为空', '不为空'],
  Attribute: ['为空', '不为空'],
  ROI: ['为空', '不为空'],
  Tripwire: ['为空', '不为空'],
  Array: ['为空', '不为空']
}
const JUDGE_OP_LABEL_TO_CODE = {
  '等于': 'eq', '不等于': 'ne', '包含': 'contains', '不包含': 'not_contains',
  '为空': 'is_empty', '不为空': 'is_not_empty',
  '大于等于': 'gte', '小于等于': 'lte', '大于': 'gt', '小于': 'lt'
}
const JUDGE_OP_CODE_TO_LABEL = Object.keys(JUDGE_OP_LABEL_TO_CODE).reduce((m, k) => {
  m[JUDGE_OP_LABEL_TO_CODE[k]] = k
  return m
}, {})
const JUDGE_RELATION_OPTIONS = [
  { v: 'all', l: '且 (全部满足)' },
  { v: 'any', l: '或 (任意满足)' },
  { v: 'not', l: '非 (全不满足)' }
]
const JUDGE_RELATION_SHORT = { all: '且', any: '或', not: '非', and: '且', or: '或' }
const JUDGE_GLOBAL_RELATION_OPTIONS = [
  { v: 'or', l: '或 (任意满足)' },
  { v: 'and', l: '且 (全部满足)' },
  { v: 'not', l: '非 (全不满足)' }
]
const JUDGE_DURATION_FIELDS = [
  {
    port: 'duration', label: '持续时间 (s)', placeholder: '0.0', required: true,
    min: 0, max: 3600, step: 0.1, precision: 4,
    tip: '条件需连续满足的时长，单位秒',
    hint: '仅支持输入数字，取值范围[0, 3600]，最多保留4位小数'
  },
  {
    port: 'buffer', label: '缓冲时间 (s)', placeholder: '0.0', required: false,
    min: 0, max: 3600, step: 0.1, precision: 4,
    tip: '计时过程中允许条件短暂不满足而不打断计时',
    hint: '仅支持输入数字，取值范围[0, 3600]，最多保留4位小数'
  }
]

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
function chipHtml(name, type, text) {
  const meta = PT_META[type] || PT_META.Any
  const label = text != null ? text : portLabel(name, type)
  return `<span class="sgx-chip" style="--c:${meta.color}">`
    + `<span class="sgx-chip-dot"></span>${escapeHtml(label)}</span>`
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
function judgeCanvasCondText(cond, part) {
  const c = cond || {}
  if (part === 'param') {
    if (!c.field) return '未选择'
    if (c.param_type) {
      const prefix = { String: 'str.', Integer: 'int.', Double: 'dou.', Boolean: 'bool.' }[c.param_type] || ''
      const name = (c.field || '').split('__').pop() || c.field
      return prefix ? `${prefix}${name}` : name
    }
    return (c.field || '').split('__').pop() || '已选'
  }
  if (!c.field) return '未填写'
  if (!c.operator) return '未填写'
  const needVal = c.operator !== 'is_empty' && c.operator !== 'is_not_empty'
  if (needVal && (c.value === '' || c.value == null)) return '未填写'
  if (needVal && c.value != null && c.value !== '') return String(c.value)
  return JUDGE_OP_CODE_TO_LABEL[c.operator] || '已配置'
}
function judgeCanvasCondPill(cond, part) {
  const txt = judgeCanvasCondText(cond, part)
  const warn = txt === '未选择' || txt === '未填写'
  return `<span class="sgx-judge-pill${warn ? ' is-warn' : ''}">`
    + (warn ? '<i class="el-icon-warning-outline"></i>' : '')
    + escapeHtml(txt) + '</span>'
}
function judgeCanvasCondRowHtml(cond) {
  return `<div class="sgx-judge-cond-row">${judgeCanvasCondPill(cond, 'param')}${judgeCanvasCondPill(cond, 'val')}</div>`
}
function judgeCanvasBracketHtml(relation, itemHtmlList, multi) {
  const body = itemHtmlList.join('')
  if (!multi) return `<div class="sgx-judge-plain">${body}</div>`
  const rel = JUDGE_RELATION_SHORT[relation] || '且'
  return `<div class="sgx-judge-bracket">`
    + `<div class="sgx-judge-bracket-side">`
    + `<span class="sgx-judge-bracket-cap top"></span>`
    + `<span class="sgx-judge-bracket-line"></span>`
    + `<span class="sgx-judge-bracket-op">${escapeHtml(rel)}</span>`
    + `<span class="sgx-judge-bracket-cap bottom"></span>`
    + `</div>`
    + `<div class="sgx-judge-bracket-items">${body}</div>`
    + `</div>`
}
function judgeCanvasGroupHtml(group) {
  const conds = (group && group.conditions) || []
  const list = conds.length ? conds : [{}]
  const rel = (group && group.relation) || 'all'
  const items = list.map(c => `<div class="sgx-judge-bracket-item">${judgeCanvasCondRowHtml(c)}</div>`)
  return judgeCanvasBracketHtml(rel, items, list.length > 1)
}
function judgeCanvasLogicHtml(conditions) {
  const groups = (conditions && conditions.condition_groups) || [{}]
  const globalRel = (conditions && conditions.global_relation) || 'or'
  const items = groups.map(g => `<div class="sgx-judge-bracket-item sgx-judge-group-item">${judgeCanvasGroupHtml(g)}</div>`)
  return judgeCanvasBracketHtml(globalRel, items, groups.length > 1)
}
function judgeCanvasPreviewHeight(conditions) {
  const groups = (conditions && conditions.condition_groups) || [{}]
  let rows = 0
  groups.forEach(g => { rows += Math.max(1, ((g && g.conditions) || []).length) })
  return 18 + 40 + 10 + Math.max(52, rows * 30 + groups.length * 6) + 28
}
function vlmOutputPortType(type) {
  if (!type) return 'String'
  if (String(type).startsWith('Array<')) return 'Array'
  return type
}
function customPortType(type) {
  if (!type) return 'String'
  if (type === 'Array') return 'Array'
  return type
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
    if (p.nodeType === 'detection_model') {
      // 卡片固定渲染：模型行 + 输入行(图片/电子围栏一行) + 输出行(按标签)
      const classes = (p.outputPorts && p.outputPorts.length)
        ? p.outputPorts
        : (((p.config || {}).target_classes) || [])
      // 输出行始终显示（空时为"未配置输出"占位），至少占一行
      const outLines = classes.length ? Math.ceil(classes.length / 2) : 1
      this.height = 18 + 40
        + (12 + 26)
        + (12 + 26)
        + (12 + outLines * 26)
      return
    }
    if (p.nodeType === 'vlm_model') {
      const vlmCfg = p.config || {}
      const inputs = ((vlmCfg.input_params) || [{ name: 'image' }]).length || 1
      const outputs = ((vlmCfg.output_parameters) || [{ name: 'output' }]).length || 1
      this.height = 18 + 40
        + (12 + 26)
        + (12 + 26)
        + (12 + Math.ceil(inputs / 2) * 26)
        + (12 + Math.ceil(outputs / 2) * 26)
      return
    }
    if (p.nodeType === 'custom_code') {
      const ccCfg = p.config || {}
      const inputs = ((ccCfg.input_params) || [{ name: 'input' }]).length || 1
      const outputs = ((ccCfg.output_parameters) || [{ name: 'output' }]).length || 1
      this.height = 18 + 40
        + (12 + Math.ceil(inputs / 2) * 26)
        + (12 + Math.ceil(outputs / 2) * 26)
      return
    }
    if (p.nodeType === 'target_matting') {
      this.height = 18 + 40 + (12 + 26) + (12 + 26)
      return
    }
    if (p.nodeType === 'small_image_batch') {
      const mode = (p.config || {}).model_mode
      this.width = 260
      this.height = mode ? 18 + 40 + 12 + 130 : 18 + 40 + 12 + 88
      return
    }
    if (p.nodeType === 'judge') {
      this.width = 248
      this.height = judgeCanvasPreviewHeight(p.config && p.config.conditions)
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
    // 小图批处理：仅左侧进点（接目标抠图推理的小图序列）
    if (nodeType === 'small_image_batch') {
      return [{ x: x - width / 2, y, id: `${id}__side_in__small_images`, type: 'incoming', portName: 'small_images' }]
    }
    // 条件分支：顶部进点 + 底部真/假两个出点
    if (nodeType === 'judge') {
      return [
        { x, y: y - height / 2, id: `${id}__in__*`, type: 'incoming', portName: '*' },
        { x: x - width / 4, y: y + height / 2, id: `${id}__out__passed`, type: 'outgoing', portName: 'passed' },
        { x: x + width / 4, y: y + height / 2, id: `${id}__out__false`, type: 'outgoing', portName: 'false' }
      ]
    }
    // 其余所有节点：统一"顶部一个进点 + 底部一个出点"，分叉也从这一个点分出
    const anchors = []
    const hasIn = (props.inputPorts && props.inputPorts.length) || props.dynamic || nodeType === 'detection_model'
    if (hasIn) {
      const inPort = nodeType === 'detection_model'
        ? 'image'
        : (props.dynamic ? '*' : ((props.inputPorts && props.inputPorts[0]) || '*'))
      anchors.push({ x, y: y - height / 2, id: `${id}__in__${inPort}`, type: 'incoming', portName: inPort })
    }
    const outPort = nodeType === 'detection_model'
      ? 'detections'
      : nodeType === 'target_matting'
        ? 'target'
        : ((props.outputPorts && props.outputPorts[0]) || 'out')
    anchors.push({ x, y: y + height / 2, id: `${id}__out__${outPort}`, type: 'outgoing', portName: outPort })
    // 目标抠图推理：右侧额外出点连接小图批处理
    if (nodeType === 'target_matting') {
      anchors.push({ x: x + width / 2, y, id: `${id}__side_out__small_images`, type: 'outgoing', portName: 'small_images' })
    }
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
    } else if (p.nodeType === 'detection_model') {
      // 视觉模型：模型 + 输入(图片/电子围栏) + 按标签输出
      const modelLabel = p.modelLabel || cfg.model_label || ''
      const classLabels = p.classLabels || cfg.class_labels || {}
      const classes = (p.outputPorts && p.outputPorts.length) ? p.outputPorts : (cfg.target_classes || [])
      const modelRow = `<div class="sgx-row"><span class="sgx-row-l">模型</span>`
        + `<span class="sgx-out${modelLabel ? '' : ' is-empty'}">${modelLabel ? escapeHtml(modelLabel) : '未配置模型'}</span></div>`
      const ins = [chipHtml('image', 'Image'), chipHtml('roi', 'ROI')]
      const outs = classes.map(c => chipHtml(c, 'Detection', classLabels[c] || c))
      const outRow = outs.length
        ? row('输出', outs)
        : `<div class="sgx-row"><span class="sgx-row-l">输出</span><span class="sgx-out is-empty">未配置输出</span></div>`
      body = modelRow + row('输入', ins) + outRow
    } else if (p.nodeType === 'vlm_model') {
      const modelName = cfg.model_name || ''
      const modelRow = `<div class="sgx-row"><span class="sgx-row-l">模型</span>`
        + `<span class="sgx-out${modelName ? '' : ' is-empty'}">${modelName ? escapeHtml(modelName) : '未配置模型'}</span></div>`
      const inputParams = (cfg.input_params && cfg.input_params.length) ? cfg.input_params : [{ name: 'image', type: 'Image' }]
      const ins = inputParams.filter(x => x && x.name).map(x => chipHtml(x.name, x.type === 'Array' ? 'Array' : (x.type || 'Image')))
      const outParams = (cfg.output_parameters && cfg.output_parameters.length)
        ? cfg.output_parameters
        : [{ name: 'output', type: 'String' }]
      const outs = outParams.filter(x => x && x.name).map(x => chipHtml(x.name, vlmOutputPortType(x.type)))
      const outRow = outs.length
        ? row('输出', outs)
        : `<div class="sgx-row"><span class="sgx-row-l">输出</span><span class="sgx-out is-empty">未配置输出</span></div>`
      body = modelRow + row('输入', ins) + outRow
    } else if (p.nodeType === 'custom_code') {
      const inputParams = (cfg.input_params && cfg.input_params.length)
        ? cfg.input_params
        : [{ name: 'input', type: 'String' }]
      const ins = inputParams.filter(x => x && x.name).map(x => paramChipHtml(x))
      const outParams = (cfg.output_parameters && cfg.output_parameters.length)
        ? cfg.output_parameters
        : [{ name: 'output', type: 'String' }]
      const outs = outParams.filter(x => x && x.name).map(x => paramChipHtml(x))
      body = row('输入', ins) + row('输出', outs)
    } else if (p.nodeType === 'intersection') {
      const method = cfg.iou_method != null ? cfg.iou_method : 1
      const ins = [
        chipHtml('targets1', 'Detection', '相交目标1'),
        chipHtml('targets2', 'Detection', '相交目标2'),
        chipHtml('iou_method', 'Number', IOU_METHOD_INT_LABELS[method] || IOU_METHOD_INT_LABELS[1]),
        chipHtml('iou_threshold', 'Number', '交并比阈值下限')
      ]
      const outs = [
        chipHtml('result1', 'Detection', '相交目标1的结果'),
        chipHtml('result2', 'Detection', '相交目标2的结果')
      ]
      body = row('输入', ins) + row('输出', outs)
    } else if (p.nodeType === 'intersect') {
      const ins = [
        chipHtml('targets1', 'Detection'),
        chipHtml('targets2', 'Detection'),
        chipHtml('iou_mode', 'String', IOU_MODE_LABELS[cfg.iou_mode] || IOU_MODE_LABELS.min),
        chipHtml('iou_threshold', 'Number', '交并比阈值下限'),
        chipHtml('duration', 'Number', '持续时间 (s)'),
        chipHtml('buffer', 'Number', '缓冲时间 (s)')
      ]
      const outs = [
        chipHtml('matched1', 'Detection'),
        chipHtml('matched2', 'Detection')
      ]
      body = row('输入', ins) + row('输出', outs)
    } else if (p.nodeType === 'region_filter') {
      const ins = [
        chipHtml('image', 'Image', '尺寸参照图片'),
        chipHtml('filter_target', 'Detection', '过滤目标'),
        chipHtml('roi', 'ROI', '电子围栏')
      ]
      const outs = [chipHtml('filtered_targets', 'Detection', '过滤目标标签')]
      body = row('输入', ins) + row('输出', outs)
    } else if (p.nodeType === 'size_filter') {
      const ins = [
        chipHtml('detections', 'Detection', '过滤目标'),
        chipHtml('min_width', 'Number', '目标宽度下限(px)'),
        chipHtml('max_width', 'Number', '目标宽度上限(px)'),
        chipHtml('min_height', 'Number', '目标高度下限(px)'),
        chipHtml('max_height', 'Number', '目标高度上限(px)')
      ]
      const outs = [chipHtml('detections', 'Detection', '满足尺寸的目标')]
      body = row('输入', ins) + row('输出', outs)
    } else if (p.nodeType === 'count') {
      const ins = [chipHtml('count_target', 'Detection', '计数目标')]
      const outs = [chipHtml('count', 'Number', '数量值')]
      body = row('输入', ins) + row('输出', outs)
    } else if (p.nodeType === 'tripwire_tracking') {
      const ins = [
        chipHtml('targets', 'Detection', '跨线目标（追踪）'),
        chipHtml('tripwire', 'Tripwire', '绊线')
      ]
      const outs = [chipHtml('crossed', 'Detection', '跨线目标')]
      body = row('输入', ins) + row('输出', outs)
    } else if (p.nodeType === 'distance') {
      const ins = [
        chipHtml('targets1', 'Detection', '距离目标1'),
        chipHtml('targets2', 'Detection', '距离目标2'),
        chipHtml('h_min', 'Number', '水平距离下限(px)'),
        chipHtml('h_max', 'Number', '水平距离上限(px)'),
        chipHtml('v_min', 'Number', '垂直距离下限(px)'),
        chipHtml('v_max', 'Number', '垂直距离上限(px)'),
        chipHtml('both_axes', 'Boolean', cfg.both_axes === false ? '否' : '是')
      ]
      const outs = [
        chipHtml('target1', 'Detection', '距离目标1的标签'),
        chipHtml('target2', 'Detection', '距离目标2的标签')
      ]
      body = row('输入', ins) + row('输出', outs)
    } else if (p.nodeType === 'displacement') {
      const ins = [
        chipHtml('targets', 'Detection', '位移目标（追踪）'),
        chipHtml('period', 'Number', '位移计算周期(s)'),
        chipHtml('h_min', 'Number', '水平移动距离下限(px)'),
        chipHtml('h_max', 'Number', '水平移动距离上限(px)'),
        chipHtml('h_direction', 'String', cfg.h_direction || '双向'),
        chipHtml('v_min', 'Number', '垂直移动距离下限(px)'),
        chipHtml('v_max', 'Number', '垂直移动距离上限(px)'),
        chipHtml('v_direction', 'String', cfg.v_direction || '双向'),
        chipHtml('both_axes', 'Boolean', cfg.both_axes === false ? '否' : '是'),
        chipHtml('duration', 'Number', '持续时间(s)'),
        chipHtml('buffer', 'Number', '缓冲时间(s)')
      ]
      const outs = [chipHtml('matched', 'Detection', '满足位移的目标(追踪)')]
      body = row('输入', ins) + row('输出', outs)
    } else if (p.nodeType === 'target_matting') {
      const ins = [chipHtml('image', 'Image', '原图'), chipHtml('target', 'Detection', '抠图推理目标')]
      const outs = [chipHtml('small_images', 'Array', '小图序列'), chipHtml('target', 'Detection', '抠图推理目标')]
      body = row('输入', ins) + row('输出', outs)
    } else if (p.nodeType === 'small_image_batch') {
      const nid = (m && m.id) || ''
      const mode = cfg.model_mode || ''
      let inner = ''
      if (!mode) {
        inner = `<div class="sgx-sib-pick" data-sib-pick="1" data-node-id="${escapeHtml(nid)}">`
          + `<i class="el-icon-plus"></i><span>点击选择推理模型节点</span></div>`
      } else if (mode === 'vlm_model') {
        const modelName = cfg.model_name || ''
        const outs = ((cfg.output_parameters || []).filter(x => x && x.name))
        const outChip = outs.length
          ? outs.map(x => chipHtml(x.name, vlmOutputPortType(x.type))).join('')
          : chipHtml('output', 'String', 'str. output')
        inner = `<div class="sgx-sib-inner sgx-sib-vlm">`
          + `<div class="sgx-sib-inner-hd"><i class="el-icon-cpu"></i><span>多模态大模型</span><span class="sgx-ver">v1</span></div>`
          + `<div class="sgx-sib-inner-row"><span>模型</span><span class="sgx-out${modelName ? '' : ' is-empty'}">${modelName ? escapeHtml(modelName) : '未配置模型'}</span></div>`
          + `<div class="sgx-sib-inner-row"><span>输入</span><span class="sgx-chips">${chipHtml('image', 'Image', '图片')}</span></div>`
          + `<div class="sgx-sib-inner-row"><span>输出</span><span class="sgx-chips">${outChip}</span></div>`
          + `</div>`
      } else {
        const modelLabel = cfg.model_label || ''
        const classes = (cfg.target_classes || [])
        const outRow = classes.length
          ? classes.map(c => chipHtml(c, 'Detection', (cfg.class_labels || {})[c] || c)).join('')
          : '<span class="sgx-chip sgx-chip-warn" style="--c:#f0a020"><i class="el-icon-warning-outline"></i>未定义</span>'
        inner = `<div class="sgx-sib-inner sgx-sib-det">`
          + `<div class="sgx-sib-inner-hd"><i class="el-icon-picture-outline"></i><span>视觉模型</span><span class="sgx-ver">v1</span></div>`
          + `<div class="sgx-sib-inner-row"><span>模型</span><span class="sgx-out${modelLabel ? '' : ' is-empty'}">${modelLabel ? escapeHtml(modelLabel) : '未配置模型'}</span></div>`
          + `<div class="sgx-sib-inner-row"><span>输入</span><span class="sgx-chips">${chipHtml('image', 'Image', '图片')}${chipHtml('roi', 'ROI', '电子围栏')}</span></div>`
          + `<div class="sgx-sib-inner-row"><span>输出</span><span class="sgx-chips">${outRow}</span></div>`
          + `</div>`
      }
      const clearBtn = mode
        ? `<button type="button" class="sgx-sib-clear" data-sib-clear="1" data-node-id="${escapeHtml(nid)}" title="清空模型节点"><i class="el-icon-delete"></i></button>`
        : ''
      body = `<div class="sgx-sib-wrap">${inner}${clearBtn}</div>`
    } else if (p.nodeType === 'judge') {
      const logic = judgeCanvasLogicHtml(cfg.conditions || {})
      body = logic
        + `<div class="sgx-judge-out-footer">`
        + `<span class="sgx-judge-out-lbl true">TRUE</span>`
        + `<span class="sgx-judge-out-lbl false">FALSE</span>`
        + `</div>`
    } else {
      const ins = (p.inputPorts || []).map(n => chipHtml(n, types[n]))
      if (p.dynamic) ins.push('<span class="sgx-chip sgx-chip-dyn" style="--c:#909399"><span class="sgx-chip-dot"></span>动态输入</span>')
      const outs = (p.outputPorts || []).map(n => chipHtml(n, types[n]))
      body = row('输入', ins) + row('输出', outs)
    }

    const cardCls = p.nodeType === 'small_image_batch' ? 'sgx-card sgx-sib-card' : 'sgx-card'
    const html =
      `<div class="${cardCls} sgx-cat-${cat}">`
      + `<div class="sgx-hd">`
      + `<span class="sgx-ic" style="background:${meta.color}"><i class="${typeIcon(p.nodeType, cat)}"></i></span>`
      + `<span class="sgx-ti">${escapeHtml(title)}</span>`
      + `<span class="sgx-ver">v1</span>`
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
      modelOptions: [],
      modelLoading: false,
      classLoading: false,
      modelClassesCache: {},
      inputSelectors: [],
      graphEdgeRev: 0,
      _normalizingEdge: false,
      testDialogVisible: false,
      testResultText: '',
      evalDialogVisible: false,
      evalSamples: [],
      evalResult: null,
      evalLoading: false,
      codeEditorOpen: false,
      codeMirrorInstance: null,
      _codeChangeTimer: null,
      codeTestInput: '',
      codeTestOutput: '',
      codeTestLoading: false,
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
      vlmModelOptions: [],
      vlmModelDefault: '',
      vlmModelLoading: false,
      vlmInputParamTypes: [
        { v: 'Image', l: 'Image' },
        { v: 'Array', l: 'Array' }
      ],
      vlmInputArrayItemTypes: [
        { v: 'Image', l: 'Image' }
      ],
      sibVlmOutputParamTypes: [
        { v: 'Boolean', l: 'Boolean' },
        { v: 'String', l: 'String' },
        { v: 'Integer', l: 'Integer' },
        { v: 'Double', l: 'Double' }
      ],
      vlmOutputParamTypes: [
        { v: 'Boolean', l: 'Boolean' },
        { v: 'String', l: 'String' },
        { v: 'Integer', l: 'Integer' },
        { v: 'Double', l: 'Double' },
        { v: 'Array<String>', l: 'Array<String>' },
        { v: 'Array<Integer>', l: 'Array<Integer>' },
        { v: 'Array<Double>', l: 'Array<Double>' },
        { v: 'Array<Boolean>', l: 'Array<Boolean>' },
        { v: 'Array<Target>', l: 'Array<Target>' },
        { v: 'Array<Detection>', l: 'Array<Detection>' }
      ],
      operators: [
        { v: 'eq', l: '等于' }, { v: 'ne', l: '不等于' },
        { v: 'gt', l: '大于' }, { v: 'gte', l: '大于等于' },
        { v: 'lt', l: '小于' }, { v: 'lte', l: '小于等于' },
        { v: 'contains', l: '包含' }, { v: 'not_contains', l: '不包含' },
        { v: 'is_empty', l: '为空' }, { v: 'is_not_empty', l: '不为空' }
      ],
      judgeMaxGroups: JUDGE_MAX_GROUPS,
      judgeMaxConditions: JUDGE_MAX_CONDITIONS,
      judgeRelationOptions: JUDGE_RELATION_OPTIONS,
      judgeGlobalRelationOptions: JUDGE_GLOBAL_RELATION_OPTIONS,
      judgeDurationFields: JUDGE_DURATION_FIELDS,
      judgeConfigTouched: false,
      batchPicker: { visible: false, nodeId: '', x: 0, y: 0 },
      mattingIntroOpen: false,
      _mattingIntroTimer: null
    }
  },
  computed: {
    groupedNodeTypes() {
      const g = {}
      this.nodeTypes.forEach(nt => {
        // 开始/结束为固定节点，已默认放置在画布上，不在面板中提供拖拽
        if (nt.category === 'start' || nt.category === 'end') return
        if (nt.hidden_in_palette) return
        if (!g[nt.category]) g[nt.category] = []
        g[nt.category].push(nt)
      })
      // 模型节点：多模态大模型、视觉模型
      if (g.model) {
        const modelRank = (t) => {
          if (t === 'vlm_model') return 0
          if (t === 'detection_model') return 1
          return 2
        }
        g.model.sort((a, b) => modelRank(a.type) - modelRank(b.type))
      }
      // 处理节点：自定义节点、视频切片、相交(追踪)、目标抠图推理、位移(追踪)、绊线(追踪)、相交、区域过滤、尺寸过滤、距离、计数
      if (g.process) {
        const processRank = (t) => {
          if (t === 'custom_code') return 0
          if (t === 'video_slice') return 1
          if (t === 'intersect') return 2
          if (t === 'target_matting') return 3
          if (t === 'displacement') return 4
          if (t === 'tripwire_tracking') return 5
          if (t === 'intersection') return 6
          if (t === 'region_filter') return 7
          if (t === 'size_filter') return 8
          if (t === 'distance') return 9
          if (t === 'count') return 10
          return 11
        }
        g.process.sort((a, b) => processRank(a.type) - processRank(b.type))
      }
      // 面板分组顺序：模型节点 → 处理节点 → 判断节点
      const ordered = {}
      ;['model', 'process', 'judge'].forEach(cat => {
        if (g[cat]) ordered[cat] = g[cat]
      })
      Object.keys(g).forEach(cat => {
        if (!ordered[cat]) ordered[cat] = g[cat]
      })
      return ordered
    },
    configDrawerTitle() {
      if (this.isFixedNode) return this.selName
      if (this.selectedType === 'small_image_batch') {
        const mode = this.form.model_mode
        if (mode === 'vlm_model') return '小图批处理 (多模态大模型)'
        if (mode === 'detection_model') return '小图批处理 (视觉模型)'
      }
      return this.form._name || this.selName
    },
    batchPickerStyle() {
      const p = this.batchPicker
      return { left: `${p.x}px`, top: `${p.y}px` }
    },
    sibImageBindingValue() {
      if (!this.selectedNode) return ''
      const bound = this.collectInputBindings(this.selectedNode.id)
      return bound.image || bound.small_images || ''
    },
    sibImageTreeData() {
      if (!this.selectedNode) return []
      return this.groupsToTree(this.typedSourceGroups('Array', this.selectedNode.id))
    },
    sibImageBindLabel() {
      const val = this.sibImageBindingValue
      if (!val) return ''
      return this.refLabel(val, this.typedSourceGroups('Array', this.selectedNode.id))
    },
    sibRoiBindingValue() {
      if (!this.selectedNode) return ''
      return this.collectInputBindings(this.selectedNode.id).roi || ''
    },
    sibRoiTreeData() {
      if (!this.selectedNode) return []
      return this.groupsToTree(this.typedSourceGroups('ROI', this.selectedNode.id))
    },
    sibRoiBindLabel() {
      const val = this.sibRoiBindingValue
      if (!val) return ''
      return this.refLabel(val, this.typedSourceGroups('ROI', this.selectedNode.id))
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
    codePreview() {
      const code = (this.form && this.form.code) || DEFAULT_CUSTOM_CODE
      const lines = String(code).split('\n')
      return lines.slice(0, 12).join('\n') + (lines.length > 12 ? '\n...' : '')
    },
    hasInputSelector() {
      const t = this.selectedType
      if (!t || t === 'start' || t === 'end') return false
      const props = (this.selectedNode && this.selectedNode.properties) || {}
      return !!(props.inputPorts && props.inputPorts.length)
    },
    // 非开始/结束节点：没有任何连入边时，在抽屉标题下提示先连前序
    showUpstreamWarn() {
      if (this.isFixedNode || !this.selectedNode || !this.lf) return false
      if (this.selectedType === 'small_image_batch') return false
      void this.graphEdgeRev
      const g = this.lf.getGraphData && this.lf.getGraphData()
      if (!g) return false
      const nid = this.selectedNode.id
      return !(g.edges || []).some(e => e.targetNodeId === nid)
    },
    modelClassOptions() {
      const id = this.form && this.form.model_id
      return (id != null && this.modelClassesCache[id]) || []
    },
    // 结束节点：可插入到文案的标签（连进来的上游端口 + 检测目标属性）
    endRefTokens() {
      if (this.selectedType !== 'end' || !this.selectedNode || !this.lf) return []
      let g
      try { g = this.lf.getGraphData() } catch (e) { return [] }
      const nodesById = {}
      ;(g.nodes || []).forEach(n => { nodesById[n.id] = n })
      const tokens = []
      const seen = new Set()
      ;(g.edges || []).filter(e => e.targetNodeId === this.selectedNode.id).forEach(e => {
        const tp = (e.properties && e.properties.targetPort) || this.parsePort(e.targetAnchorId, 'in')
        if (!tp || tp === 'trigger' || tp === '*') return
        const sp = (e.properties && e.properties.sourcePort) || this.parsePort(e.sourceAnchorId, 'out')
        const srcNode = nodesById[e.sourceNodeId]
        const srcType = (srcNode && srcNode.properties && srcNode.properties.portTypes && srcNode.properties.portTypes[sp]) || ''
        if (!seen.has(tp)) { seen.add(tp); tokens.push({ token: tp, label: tp }) }
        if (srcType === 'Detection') {
          DETECTION_ATTRS.forEach(a => {
            const tk = `${tp}.${a.k}`
            if (!seen.has(tk)) { seen.add(tk); tokens.push({ token: tk, label: `${tp}·${a.l}` }) }
          })
        }
      })
      return tokens
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
      if (this.selectedType === 'small_image_batch') {
        if (this.form.model_mode === 'vlm_model') {
          return '调用多模态大模型，通过提示词描述理解图片内容'
        }
        if (this.form.model_mode === 'detection_model') {
          return '调用视觉模型，识别图片中的目标和属性信息'
        }
      }
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
    },
    videoSliceNumericFields() {
      return VIDEO_SLICE_NUMERIC_FIELDS
    },
    intersectionTargetFields() {
      return INTERSECTION_TARGET_FIELDS
    },
    intersectionNumericFields() {
      return INTERSECTION_NUMERIC_FIELDS
    },
    iouMethodIntOptions() {
      return IOU_METHOD_INT_OPTIONS
    },
    intersectTargetFields() {
      return INTERSECT_TARGET_FIELDS
    },
    intersectNumericFields() {
      return INTERSECT_NUMERIC_FIELDS
    },
    tripwireTrackingFields() {
      return TRIPWIRE_TRACKING_FIELDS
    },
    regionFilterFields() {
      return REGION_FILTER_FIELDS
    },
    countTargetFields() {
      return COUNT_TARGET_FIELDS
    },
    sizeFilterTargetFields() {
      return SIZE_FILTER_TARGET_FIELDS
    },
    sizeFilterNumericFields() {
      return SIZE_FILTER_NUMERIC_FIELDS
    },
    displacementTargetFields() {
      return DISPLACEMENT_TARGET_FIELDS
    },
    displacementNumericFieldsH() {
      return DISPLACEMENT_NUMERIC_FIELDS_H
    },
    displacementSelectFieldsH() {
      return DISPLACEMENT_SELECT_FIELDS_H
    },
    displacementNumericFieldsV() {
      return DISPLACEMENT_NUMERIC_FIELDS_V
    },
    displacementSelectFieldsV() {
      return DISPLACEMENT_SELECT_FIELDS_V
    },
    displacementNumericFieldsTime() {
      return DISPLACEMENT_NUMERIC_FIELDS_TIME
    },
    distanceTargetFields() {
      return DISTANCE_TARGET_FIELDS
    },
    distanceNumericFields() {
      return DISTANCE_NUMERIC_FIELDS
    },
    iouModeOptions() {
      return IOU_MODE_OPTIONS
    },
    judgeParamTree() {
      if (this.selectedType !== 'judge' || !this.selectedNode) return []
      return this.groupsToTree(this.judgeAllSourceGroups())
    },
    judgeConfigInvalid() {
      if (this.selectedType !== 'judge' || !this.judgeConfigTouched) return false
      const groups = (this.form && this.form.groups) || []
      if (!groups.length) return true
      return groups.some(g => {
        const conds = g.conditions || []
        if (!conds.length) return true
        return conds.some(c => !this.judgeCondComplete(c))
      })
    }
  },
  watch: {
    codePreview() {
      this.renderCodePreview()
    },
    codeEditorOpen(val) {
      if (val) {
        this.$nextTick(() => this.initCodeMirror())
      } else {
        this.destroyCodeMirror()
        this.renderCodePreview()
      }
    },
    selectedType(val) {
      if (val === 'custom_code') this.renderCodePreview()
    }
  },
  async mounted() {
    await Promise.all([this.loadNodeTypes(), this.loadVlmModels()])
    this.loadModels()
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
    this.clearMattingIntroTimer()
    window.removeEventListener('keydown', this.onKeydown)
    if (this._graphHtmlClick && this.$refs.canvas) {
      this.$refs.canvas.removeEventListener('click', this._graphHtmlClick)
    }
    this.destroyCodeMirror()
    if (this._codeChangeTimer) clearTimeout(this._codeChangeTimer)
  },
  methods: {
    categoryName(cat) {
      return { start: '开始', model: '模型节点', process: '处理节点', judge: '条件分支', end: '结束' }[cat] || cat
    },
    palIconClass(nt) {
      return typeIcon(nt.type, nt.category)
    },
    palIconStyle(nt) {
      return { background: catMeta(nt.category).color }
    },
    async loadVlmModels() {
      this.vlmModelLoading = true
      try {
        const res = await skillGraphAPI.getVlmModels()
        const body = res.data || {}
        const list = body.data || []
        this.vlmModelDefault = body.default || ''
        this.vlmModelOptions = list.map(m => ({
          value: m.value,
          label: m.label || m.value,
          role: m.role || ''
        }))
        this.ensureVlmModelOption(this.form && this.form.model_name)
      } catch (e) {
        this.vlmModelOptions = []
        this.vlmModelDefault = ''
        console.warn('加载多模态大模型列表失败', e)
      } finally {
        this.vlmModelLoading = false
      }
    },
    ensureVlmModelOption(modelName) {
      if (!modelName) return
      if (!this.vlmModelOptions.some(m => m.value === modelName)) {
        this.vlmModelOptions = [
          { value: modelName, label: modelName },
          ...this.vlmModelOptions
        ]
      }
    },
    onVlmModelSelectVisible(visible) {
      if (visible && !this.vlmModelOptions.length) this.loadVlmModels()
    },
    registerNodeTypeMeta(nt) {
      PORT_MAP[nt.type] = {
        inputs: Object.keys(nt.input_ports || {}),
        outputs: Object.keys(nt.output_ports || {}),
        types: { ...(nt.input_ports || {}), ...(nt.output_ports || {}) },
        dynamic: !!nt.dynamic_inputs,
        name_zh: nt.name_zh,
        category: nt.category,
        has_companion: !!nt.has_companion,
        companion_type: nt.companion_type || '',
        hidden_in_palette: !!nt.hidden_in_palette
      }
    },
    mergeExtraNodeTypes() {
      EXTRA_NODE_TYPES.forEach(nt => {
        const idx = this.nodeTypes.findIndex(x => x.type === nt.type)
        if (idx >= 0) {
          this.$set(this.nodeTypes, idx, { ...this.nodeTypes[idx], ...nt })
        } else {
          this.nodeTypes.push({ ...nt })
        }
        this.registerNodeTypeMeta(nt)
      })
    },
    openMattingIntro() {
      this.clearMattingIntroTimer()
      this.mattingIntroOpen = true
    },
    scheduleCloseMattingIntro() {
      this.clearMattingIntroTimer()
      this._mattingIntroTimer = setTimeout(() => {
        this.mattingIntroOpen = false
      }, 180)
    },
    clearMattingIntroTimer() {
      if (this._mattingIntroTimer) {
        clearTimeout(this._mattingIntroTimer)
        this._mattingIntroTimer = null
      }
    },
    closeMattingIntro() {
      this.clearMattingIntroTimer()
      this.mattingIntroOpen = false
    },
    async loadNodeTypes() {
      try {
        const res = await skillGraphAPI.getNodeTypes()
        this.nodeTypes = (res.data && res.data.data) || []
        this.nodeTypes.forEach(nt => this.registerNodeTypeMeta(nt))
        this.mergeExtraNodeTypes()
      } catch (e) {
        this.nodeTypes = []
        this.mergeExtraNodeTypes()
        if (!EXTRA_NODE_TYPES.length) {
          this.$message.error('加载节点类型失败')
        }
      }
    },
    // 视觉模型：加载可选模型列表（服务端按名称搜索 + 分页，取第一页）
    async loadModels(query) {
      this.modelLoading = true
      try {
        const params = { page: 1, limit: 50 }
        if (query) params.name = query
        const res = await modelAPI.getModelList(params)
        const list = (res.data && res.data.data) || []
        const mapped = list.map(m => ({ ...m, _label: this.buildModelLabel(m) }))
        // 保留当前已选模型选项，避免回显丢失
        const selId = this.form && this.form.model_id
        if (selId != null && !mapped.some(m => m.id === selId)) {
          const cur = this.modelOptions.find(m => m.id === selId)
          if (cur) mapped.unshift(cur)
        }
        this.modelOptions = mapped
      } catch (e) {
        this.modelOptions = []
      } finally {
        this.modelLoading = false
      }
    },
    // el-select 远程搜索回调（按名称服务端检索）
    searchModels(query) {
      this.loadModels(query)
    },
    // 下拉展开时若列表为空则拉取第一页
    onModelSelectVisible(visible) {
      if (visible && !this.modelOptions.length) this.loadModels()
    },
    // 确保当前已选模型在选项里（编辑回显用）
    ensureSelectedModelOption(id, label, name, version) {
      if (id == null) return
      if (!this.modelOptions.some(m => m.id === id)) {
        this.modelOptions = [
          { id, name: name || '', version: version || '', _label: label || name || String(id) },
          ...this.modelOptions
        ]
      }
    },
    buildModelLabel(m) {
      const v = m.version
      const ver = v == null || v === '' ? 'V1' : (String(v).toUpperCase().startsWith('V') ? v : 'V' + v)
      return `${m.name}/${ver}`
    },
    uniqueNodeName(nodeType, base, excludeId) {
      const g = (this.lf && this.lf.getGraphData && this.lf.getGraphData()) || {}
      const used = new Set()
      ;(g.nodes || []).forEach((n) => {
        if (n.id === excludeId) return
        const t = (n.properties && n.properties.nodeType) || n.type
        if (t !== nodeType) return
        const nm = (n.text && (n.text.value != null ? n.text.value : n.text)) ||
          (n.properties && n.properties.name_zh) || ''
        if (nm) used.add(nm)
      })
      if (!used.has(base)) return base
      let i = 1
      while (used.has(`${base}_${i}`)) i++
      return `${base}_${i}`
    },
    // 沿连边反向追溯，得到当前节点的所有前序节点（未连前序则为空）
    upstreamNodeIds(selfId) {
      const g = (this.lf && this.lf.getGraphData && this.lf.getGraphData()) || { edges: [] }
      const upstream = new Set()
      let frontier = [selfId]
      const seen = new Set([selfId])
      while (frontier.length) {
        const next = []
        frontier.forEach(nid => {
          ;(g.edges || []).forEach(e => {
            if (e.targetNodeId !== nid) return
            const src = e.sourceNodeId
            if (seen.has(src)) return
            seen.add(src)
            upstream.add(src)
            next.push(src)
          })
        })
        frontier = next
      }
      return upstream
    },
    // 按类型聚合「前序路径上」节点的可选输出参数（未连前序则无选项）
    typedSourceGroups(portType, selfId) {
      const g = (this.lf && this.lf.getGraphData && this.lf.getGraphData()) || { nodes: [] }
      const upstream = this.upstreamNodeIds(selfId)
      if (!upstream.size) return []
      const groups = []
      ;(g.nodes || []).forEach(n => {
        if (!upstream.has(n.id)) return
        const nt = n.properties && n.properties.nodeType
        if (nt === 'end') return
        const outs = this.nodeTypedOutputs(n).filter(o =>
          o.type === portType || (portType === 'Detection' && o.type === 'TrackDetection')
        )
        if (!outs.length) return
        const nodeName = (n.text && (n.text.value != null ? n.text.value : n.text)) ||
          (n.properties && n.properties.name_zh) || n.id
        groups.push({ nodeId: n.id, nodeName, params: outs })
      })
      return groups
    },
    // 某节点对外可用的类型化输出参数（供下游按类型选择）
    nodeTypedOutputs(n) {
      const props = (n && n.properties) || {}
      const nt = props.nodeType
      const types = props.portTypes || {}
      const out = []
      if (nt === 'start') {
        const params = ((props.config || {}).input_params) || []
        params.forEach(pp => {
          if (!pp || !pp.name) return
          out.push({ port: pp.name, type: pp.type || 'String', label: PORT_LABELS[pp.name] || pp.name })
        })
      } else {
        ;(props.outputPorts || []).forEach(p => {
          const t = types[p] || ''
          let label = PORT_LABELS[p] || p
          if (nt === 'count' && p === 'count') label = '数量值'
          if (t === 'Array') label = `${label}[i]`
          out.push({ port: p, type: t, label })
        })
      }
      return out
    },
    paramTypeIcon(type) {
      const m = {
        Image: 'el-icon-picture-outline', Video: 'el-icon-video-camera', ROI: 'el-icon-crop',
        Detection: 'el-icon-aim', TrackDetection: 'el-icon-aim', Tripwire: 'el-icon-right'
      }
      return m[type] || 'el-icon-document'
    },
    customPortType(type) {
      if (!type) return 'String'
      if (type === 'Array') return 'Array'
      return type
    },
    // 参数名格式校验：必须以字母开头，只能包含字母、数字、下划线（空名由"必填"负责，这里只校验格式）
    paramNameValid(name) {
      if (!name) return true
      return /^[A-Za-z][A-Za-z0-9_]*$/.test(name)
    },
    // 某节点类型的"单一进点 / 出点"端口名（所有节点都收敛到单进单出锚点）
    singleInPort(type) {
      if (type === 'end') return '*'
      if (type === 'detection_model') return 'image'
      if (type === 'small_image_batch') return 'small_images'
      const pm = PORT_MAP[type] || {}
      return pm.dynamic ? '*' : ((pm.inputs && pm.inputs[0]) || '*')
    },
    singleOutPort(type) {
      if (type === 'detection_model') return 'detections'
      if (type === 'target_matting') return 'target'
      if (type === 'judge') return 'passed'
      const pm = PORT_MAP[type] || {}
      return (pm.outputs && pm.outputs[0]) || 'out'
    },
    isSideBatchEdge(sourceType, sourcePort, targetType, targetPort) {
      return sourceType === 'target_matting' && sourcePort === 'small_images'
        && targetType === 'small_image_batch' && targetPort === 'small_images'
    },
    edgeAnchors(sourceId, targetId, sourceType, targetType, sourcePort, targetPort) {
      if (this.isSideBatchEdge(sourceType, sourcePort, targetType, targetPort)) {
        return {
          sourceAnchorId: `${sourceId}__side_out__small_images`,
          targetAnchorId: `${targetId}__side_in__small_images`
        }
      }
      return {
        sourceAnchorId: `${sourceId}__out__${this.singleOutPort(sourceType)}`,
        targetAnchorId: `${targetId}__in__${this.singleInPort(targetType)}`
      }
    },
    // 分组数据 -> el-tree 树数据（节点为父，参数为叶）
    groupsToTree(groups) {
      return (groups || []).map(g => ({
        id: g.nodeId,
        label: g.nodeName,
        isNode: true,
        icon: 'el-icon-cpu',
        children: (g.params || []).map(p => ({
          id: `${g.nodeId}::${p.port}`,
          label: p.label,
          icon: this.paramTypeIcon(p.type),
          leaf: true
        }))
      }))
    },
    // `${nodeId}::${port}` -> "节点名/参数名"
    refLabel(val, groups) {
      if (!val) return ''
      const idx = val.indexOf('::')
      const nid = idx >= 0 ? val.substring(0, idx) : val
      const port = idx >= 0 ? val.substring(idx + 2) : ''
      const g = (groups || []).find(x => x.nodeId === nid)
      if (!g) return val
      const p = (g.params || []).find(x => x.port === port)
      return `${g.nodeName}/${p ? p.label : port}`
    },
    selLabel(sel) {
      return this.refLabel(sel.value, sel.groups)
    },
    // 树里点选：点参数(叶)才算选择，点节点(父)仅展开/收起
    onParamPick(sel, data) {
      if (!data || !data.leaf) return
      sel.value = data.id
      sel.popOpen = false
      this.bindInput(sel.port, sel.value)
    },
    clearInput(sel) {
      sel.value = ''
      sel.popOpen = false
      if (!this.selectedNode) return
      const nid = this.selectedNode.id
      const g = this.lf.getGraphData()
      // 仅清除参数绑定，保留画布上的结构连线
      ;(g.edges || []).forEach(x => {
        if (x.targetNodeId !== nid) return
        const xtp = (x.properties && x.properties.targetPort) || this.parsePort(x.targetAnchorId, 'in')
        if (xtp !== sel.port) return
        this.lf.setProperties(x.id, { ...(x.properties || {}), paramBound: false })
      })
    },
    // 读取本节点各输入端口当前绑定的上游来源：返回 { port: `${nodeId}::${port}` }
    collectInputBindings(nodeId) {
      const g = (this.lf && this.lf.getGraphData && this.lf.getGraphData()) || { edges: [] }
      const map = {}
      ;(g.edges || []).forEach(e => {
        if (e.targetNodeId !== nodeId) return
        if (e.properties && e.properties.paramBound === false) return
        const sp = (e.properties && e.properties.sourcePort) || this.parsePort(e.sourceAnchorId, 'out') || ''
        const tp = (e.properties && e.properties.targetPort) || this.parsePort(e.targetAnchorId, 'in')
        if (tp && !map[tp]) map[tp] = `${e.sourceNodeId}::${sp}`
      })
      return map
    },
    // 为当前选中节点的每个输入端口构建一个"树形选择器"
    refreshInputBindings(nodeId) {
      const node = (this.lf && this.lf.getNodeModelById && this.lf.getNodeModelById(nodeId)) || this.selectedNode
      const props = (node && node.properties) || {}
      const t = props.nodeType
      if (t === 'start' || t === 'end' || !(props.inputPorts && props.inputPorts.length)) {
        this.inputSelectors = []
        return
      }
      const types = props.portTypes || {}
      const upstream = this.upstreamNodeIds(nodeId)
      const bound = this.collectInputBindings(nodeId)
      const mattingLabels = { image: '原图', target: '抠图推理目标' }
      const countLabels = { count_target: '计数目标' }
      const sizeFilterLabels = { detections: '过滤目标' }
      this.inputSelectors = (props.inputPorts || []).filter(p => {
        if (t === 'small_image_batch' && p === 'small_images') return false
        return true
      }).map(p => {
        const type = types[p] || ''
        const groups = this.typedSourceGroups(type, nodeId)
        let value = bound[p] || ''
        if (value) {
          const srcId = value.indexOf('::') >= 0 ? value.substring(0, value.indexOf('::')) : value
          if (!upstream.has(srcId)) value = ''
        }
        return {
          port: p,
          label: (t === 'size_filter' && sizeFilterLabels[p])
            || (t === 'count' && countLabels[p])
            || (t === 'target_matting' && mattingLabels[p])
            || PORT_LABELS[p] || p,
          type,
          optional: type === 'ROI',
          value,
          groups,
          treeData: this.groupsToTree(groups),
          popOpen: false
        }
      })
    },
    // 把某输入端口绑定到选中的上游参数：清掉该端口旧边并按真实 sourcePort/targetPort 建新边
    bindInput(targetPort, val) {
      if (!this.selectedNode) return
      const nid = this.selectedNode.id
      const upstream = this.upstreamNodeIds(nid)
      if (!upstream.size) return
      const myType = this.selectedType
      const g = this.lf.getGraphData()
      ;(g.edges || []).forEach(x => {
        if (x.targetNodeId !== nid) return
        const xtp = (x.properties && x.properties.targetPort) || this.parsePort(x.targetAnchorId, 'in')
        if (xtp === targetPort) this.lf.deleteEdge(x.id)
      })
      if (val) {
        const idx = val.indexOf('::')
        const srcId = idx >= 0 ? val.substring(0, idx) : val
        if (!upstream.has(srcId)) return
        const port = idx >= 0 ? val.substring(idx + 2) : ''
        const srcNode = (g.nodes || []).find(n => n.id === srcId)
        const srcType = (srcNode && srcNode.properties && srcNode.properties.nodeType) || ''
        let sourceAnchorId = `${srcId}__out__${this.singleOutPort(srcType)}`
        let targetAnchorId = `${nid}__in__${this.singleInPort(myType)}`
        if (srcType === 'target_matting' && port === 'small_images') {
          sourceAnchorId = `${srcId}__side_out__small_images`
        }
        if (myType === 'small_image_batch') {
          targetAnchorId = `${nid}__side_in__small_images`
        }
        this.lf.addEdge({
          type: this.edgeMode || 'bezier',
          sourceAnchorId,
          targetAnchorId,
          sourceNodeId: srcId,
          targetNodeId: nid,
          properties: { sourcePort: port, targetPort, paramBound: true }
        })
      }
      this.$nextTick(() => this.refreshInputBindings(nid))
    },
    // 视觉模型：加载某模型的检测类别（模型标签），带缓存
    async loadModelClasses(modelId) {
      if (modelId == null || this.modelClassesCache[modelId]) return
      this.classLoading = true
      try {
        const res = await modelAPI.getModelClasses(modelId)
        const classes = (res.data && res.data.classes) || []
        this.$set(this.modelClassesCache, modelId, classes)
      } catch (e) {
        this.$set(this.modelClassesCache, modelId, [])
      } finally {
        this.classLoading = false
      }
    },
    onModelChange(modelId) {
      const m = this.modelOptions.find(x => x.id === modelId)
      this.form.model_name = m ? m.name : ''
      this.form.model_version = m ? m.version : ''
      this.$set(this.form, '_modelLabel', m ? m._label : '')
      // 切换模型 → 清空已选标签与阈值
      this.$set(this.form, 'target_classes', [])
      this.$set(this.form, 'class_thresholds', {})
      this.loadModelClasses(modelId)
      this.applyConfig()
    },
    onClassesChange() {
      if (!this.form.class_thresholds) this.$set(this.form, 'class_thresholds', {})
      const th = this.form.class_thresholds
      const selected = this.form.target_classes || []
      // 新增标签补默认阈值
      selected.forEach(c => { if (th[c] == null) this.$set(th, c, 0.5) })
      // 移除已取消的标签阈值
      Object.keys(th).forEach(c => { if (selected.indexOf(c) < 0) this.$delete(th, c) })
      this.applyConfig()
    },
    classLabel(cls) {
      const o = (this.modelClassOptions || []).find(x => x.name === cls)
      if (o) return o.name_zh || o.name
      return (this.form._classLabels && this.form._classLabels[cls]) || cls
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
        bezier: {
          stroke: '#b9c2d0', strokeWidth: 2, hoverStroke: '#7c5cff', selectedStroke: '#7c5cff',
          arrow: { offset: 8, verticalLength: 4 }
        },
        polyline: {
          stroke: '#b9c2d0', strokeWidth: 2, hoverStroke: '#7c5cff', selectedStroke: '#7c5cff',
          arrow: { offset: 8, verticalLength: 4 }
        },
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

      // 统一拦截节点删除：目标抠图推理删除时连带小图批处理
      this._rawDeleteNode = this.lf.deleteNode.bind(this.lf)
      this.lf.deleteNode = (nodeId) => {
        if (!nodeId) return
        try {
          const model = this.lf.getNodeModelById(nodeId)
          const props = (model && model.properties) || {}
          const t = props.nodeType
          if (t === 'target_matting') {
            this.deleteMattingCompanions(nodeId, props)
          } else if (t === 'small_image_batch') {
            this.clearMattingCompanionRef(nodeId, props)
          }
        } catch (e) { /* ignore */ }
        return this._rawDeleteNode(nodeId)
      }

      // 缩放/平移变化（含滚轮缩放）时实时同步比例数字
      this.lf.on('graph:transform', () => this.syncZoom())

      // 选中节点 → 打开配置面板
      this.lf.on('node:click', ({ data }) => this.onSelectNode(data))
      // 点击空白区域 → 收起配置抽屉
      this.lf.on('blank:click', () => {
        this.closeBatchPicker()
        this.closeConfig()
      })
      // 小图批处理节点内交互（选模型 / 清空）
      this._graphHtmlClick = (e) => this.onGraphHtmlClick(e)
      this.$refs.canvas.addEventListener('click', this._graphHtmlClick)
      // 拖入新节点 → 自动选中并弹出配置抽屉
      this.lf.on('node:dnd-add', (evt) => {
        const data = (evt && evt.data) || evt
        if (!data || !data.id) return
        // 等拖放结算完成后再处理，避免打断 LogicFlow 拖拽状态
        this.$nextTick(() => {
          // 同类型节点自动命名：第一个用原名，其后 _1 / _2 ...
          const nodeType = (data.properties && data.properties.nodeType) || data.type
          const base = (data.properties && data.properties.name_zh) || nodeType
          const name = this.uniqueNodeName(nodeType, base, data.id)
          if (name !== base) {
            this.lf.updateText(data.id, name)
            const m = this.lf.getNodeModelById && this.lf.getNodeModelById(data.id)
            if (m && m.setProperties) m.setProperties({ name_zh: name })
            if (data.text && typeof data.text === 'object') data.text.value = name
            else data.text = { value: name }
          }
          if (nodeType === 'target_matting') {
            this.attachSmallImageBatch(data)
          }
          if (this.lf.selectElementById) this.lf.selectElementById(data.id, false)
          this.onSelectNode(data)
        })
      })
      this.lf.on('node:delete', ({ data }) => this.onNodeDelete(data))
      // 连线建立 → 记录端口名到边的 properties
      this.lf.on('edge:add', ({ data }) => {
        this.onEdgeAdd(data)
        this.graphEdgeRev++
      })
      // 连线增删 → 刷新输入来源选择器 / 前序连接提示
      this.lf.on('edge:delete', () => {
        this.graphEdgeRev++
        if (this.selectedNode && this.hasInputSelector) {
          this.$nextTick(() => this.refreshInputBindings(this.selectedNode.id))
        }
      })
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
      const cfg = this.defaultConfig(nt.type)
      const props = {
        nodeType: nt.type,
        name_zh: nt.name_zh,
        category: nt.category || ports.category,
        inputPorts: ports.inputs,
        outputPorts: ports.outputs,
        portTypes: ports.types || {},
        dynamic: ports.dynamic,
        config: cfg
      }
      if (nt.type === 'custom_code') {
        const inputs = (cfg.input_params || []).filter(p => p.name)
        const outputs = (cfg.output_parameters || []).filter(p => p.name)
        const pt = {}
        inputs.forEach(p => { pt[p.name] = customPortType(p.type) })
        outputs.forEach(p => { pt[p.name] = customPortType(p.type) })
        props.inputPorts = inputs.map(p => p.name)
        props.outputPorts = outputs.map(p => p.name)
        props.portTypes = pt
        props.dynamic = true
      }
      this.lf.dnd.startDrag({
        type: 'sg-node',
        text: nt.name_zh,
        properties: props
      })
    },
    closeConfig() {
      this.closeCodeEditor()
      this.selectedNode = null
      this.selectedType = ''
    },
    onEdgeAdd(edge) {
      const model = this.lf.getEdgeModelById(edge.id)
      if (!model) return
      const srcAnchor = model.sourceAnchorId || edge.sourceAnchorId
      const tgtAnchor = model.targetAnchorId || edge.targetAnchorId
      // 允许从后续节点上方(in)拖到前序节点下方(out)；建边后自动纠正为 out → in，箭头指向下游
      const srcIsIn = srcAnchor && srcAnchor.indexOf('__in__') >= 0
      const tgtIsOut = tgtAnchor && tgtAnchor.indexOf('__out__') >= 0
      if (srcIsIn && tgtIsOut && !this._normalizingEdge) {
        this._normalizingEdge = true
        const props = { ...(model.properties || {}) }
        this.lf.deleteEdge(edge.id)
        this.lf.addEdge({
          type: model.type || this.edgeMode || 'bezier',
          sourceNodeId: model.targetNodeId,
          targetNodeId: model.sourceNodeId,
          sourceAnchorId: tgtAnchor,
          targetAnchorId: srcAnchor,
          properties: props
        })
        this._normalizingEdge = false
        this.graphEdgeRev++
        return
      }
      const existing = model.properties || {}
      // 若建边时已显式带上 sourcePort/targetPort（抽屉里选参数建的边），以其为准，不被锚点反推覆盖
      const sp = existing.sourcePort || this.parsePort(srcAnchor, 'out')
      let tp = existing.targetPort || this.parsePort(tgtAnchor, 'in')
      // 动态输入节点：通用入口 '*' 的端口名沿用上游输出端口名
      if (tp === '*') tp = sp || 'value'
      this.lf.setProperties(edge.id, { sourcePort: sp, targetPort: tp })
      const tgtNode = (model && model.targetNodeId) || edge.targetNodeId
      if (this.selectedNode && this.hasInputSelector && tgtNode === this.selectedNode.id) {
        this.$nextTick(() => this.refreshInputBindings(this.selectedNode.id))
      }
    },
    parsePort(anchorId, kind) {
      if (!anchorId) return null
      const prefixes = kind === 'in'
        ? ['__side_in__', '__in__']
        : ['__side_out__', '__out__']
      for (let i = 0; i < prefixes.length; i++) {
        const sep = prefixes[i]
        const idx = anchorId.indexOf(sep)
        if (idx >= 0) return anchorId.substring(idx + sep.length)
      }
      return null
    },
    defaultConfig(type) {
      const d = {
        detection_model: { model_name: '', model_id: null, model_version: '', model_label: '', target_classes: [], class_thresholds: {}, confidence_threshold: 0.5, class_labels: {} },
        vlm_model: {
          model_name: '',
          system_prompt: '',
          prompt: '',
          input_params: [{ name: 'image', type: 'Image', item_type: 'Image' }],
          output_parameters: [{ name: 'output', type: 'String' }]
        },
        region_filter: {},
        video_slice: { start_time: 0, end_time: 0, buffer: 0 },
        size_filter: { min_width: 0, max_width: 1920, min_height: 0, max_height: 1080 },
        intersect: { iou_mode: 'min', iou_threshold: 0.5, duration: 0, buffer: 0 },
        intersection: { iou_method: 1, iou_threshold: 0.5 },
        displacement: {
          period: 0, h_min: 0, h_max: 1000000, h_direction: '双向',
          v_min: 0, v_max: 1000000, v_direction: '双向', both_axes: true,
          duration: 0, buffer: 0
        },
        tripwire_tracking: {},
        distance: { h_min: 0, h_max: 1000000, v_min: 0, v_max: 1000000, both_axes: true },
        judge: {
          conditions: {
            condition_groups: [{
              conditions: [{ field: '', operator: '', value: '', param_type: '' }],
              relation: 'all'
            }],
            global_relation: 'or',
            same_target: false
          },
          duration: 0,
          buffer: 0
        },
        custom_code: {
          input_params: [{ name: 'input', type: 'String' }],
          output_parameters: [{ name: 'output', type: 'String' }],
          code: DEFAULT_CUSTOM_CODE,
          timeout_ms: 10000
        },
        end: { message: '' },
        start: { params: {}, input_params: [{ name: 'image', type: 'Image', required: true }] },
        target_matting: { width_multiplier: 1.4, height_multiplier: 1.4 },
        small_image_batch: {
          model_mode: '',
          model_name: '',
          system_prompt: '',
          prompt: '',
          model_id: null,
          model_version: '',
          model_label: '',
          target_classes: [],
          class_thresholds: {},
          class_labels: {},
          input_params: [{ name: 'image', type: 'Image', item_type: 'Image' }],
          output_parameters: [{ name: 'output', type: 'String' }]
        }
      }
      return d[type] || {}
    },
    onSelectNode(data) {
      if (!data || !data.id) return
      let nodeData = data
      try {
        const model = this.lf && this.lf.getNodeModelById(data.id)
        if (model && model.getData) nodeData = model.getData()
      } catch (e) { /* 回退 event data */ }
      if (this.selectedType === 'custom_code' && ((nodeData.properties && nodeData.properties.nodeType) || '') !== 'custom_code') {
        this.closeCodeEditor()
      }
      this.selectedNode = nodeData
      this.selectedType = (nodeData.properties && nodeData.properties.nodeType) || ''
      const cfg = (nodeData.properties && nodeData.properties.config) || {}
      const f = { _name: nodeData.text && nodeData.text.value ? nodeData.text.value : (nodeData.properties.name_zh || '') }
      // 把各类型配置摊平到表单
      if (this.selectedType === 'detection_model') {
        f.model_id = cfg.model_id != null ? cfg.model_id : null
        f.model_name = cfg.model_name || ''
        f.model_version = cfg.model_version || ''
        f._modelLabel = cfg.model_label || ''
        f.target_classes = (cfg.target_classes || []).slice()
        f.class_thresholds = { ...(cfg.class_thresholds || {}) }
        f._classLabels = { ...(cfg.class_labels || {}) }
        f.target_classes.forEach(c => { if (f.class_thresholds[c] == null) f.class_thresholds[c] = 0.5 })
        if (f.model_id != null) {
          this.ensureSelectedModelOption(f.model_id, f._modelLabel, f.model_name, f.model_version)
          this.loadModelClasses(f.model_id)
        }
      } else if (this.selectedType === 'vlm_model') {
        f.model_name = cfg.model_name || this.vlmModelDefault || ''
        this.ensureVlmModelOption(f.model_name)
        f.system_prompt = cfg.system_prompt || ''
        f.prompt = cfg.prompt || ''
        const inList = (cfg.input_params || []).map(ip => {
          const type = ip.type === 'Array' ? 'Array' : (ip.type || 'Image')
          return {
            name: ip.name || '',
            type: type === 'Array' || type === 'Image' ? type : 'Image',
            item_type: 'Image',
            _typeOpen: false,
            _arrayHover: false,
            _bindOpen: false
          }
        })
        f.input_params = inList.length
          ? inList
          : [{ name: 'image', type: 'Image', item_type: 'Image', _typeOpen: false, _arrayHover: false, _bindOpen: false }]
        const outList = (cfg.output_parameters || []).map(op => ({
          name: op.name || '',
          type: this.backendToVlmType(op.type) || 'String',
          _typeOpen: false
        }))
        f.output_parameters = outList.length
          ? outList
          : [{ name: 'output', type: 'String', _typeOpen: false }]
      } else if (this.selectedType === 'custom_code') {
        const inList = (cfg.input_params || []).map(ip => ({
          name: ip.name || '',
          type: ip.type || 'String',
          item_type: ip.item_type || 'String',
          _typeOpen: false,
          _arrayHover: false,
          _bindOpen: false
        }))
        f.input_params = inList.length
          ? inList
          : [{ name: 'input', type: 'String', item_type: 'String', _typeOpen: false, _arrayHover: false, _bindOpen: false }]
        const outList = (cfg.output_parameters || []).map(op => ({
          name: op.name || '',
          type: op.type || 'String',
          item_type: op.item_type || 'String',
          _typeOpen: false,
          _arrayHover: false
        }))
        f.output_parameters = outList.length
          ? outList
          : [{ name: 'output', type: 'String', _typeOpen: false }]
        f.code = cfg.code || DEFAULT_CUSTOM_CODE
        f.timeout_ms = cfg.timeout_ms != null ? cfg.timeout_ms : 10000
        this.codeTestInput = this.buildCustomTestInput(f.input_params)
        this.codeTestOutput = ''
      } else if (this.selectedType === 'region_filter') {
        f._rfPop = { image: false, filter_target: false, roi: false }
      } else if (this.selectedType === 'count') {
        f._countPop = { count_target: false }
      } else if (this.selectedType === 'video_slice') {
        f.start_time = cfg.start_time != null ? cfg.start_time : 0
        f.end_time = cfg.end_time != null ? cfg.end_time : 0
        f.buffer = cfg.buffer != null ? cfg.buffer : 0
        f._vsPop = { video: false, start_time: false, end_time: false, buffer: false }
      } else if (this.selectedType === 'size_filter') {
        f.min_width = cfg.min_width != null ? cfg.min_width : 0
        f.max_width = cfg.max_width != null ? cfg.max_width : 1920
        f.min_height = cfg.min_height != null ? cfg.min_height : 0
        f.max_height = cfg.max_height != null ? cfg.max_height : 1080
        f._sfPop = { detections: false, min_width: false, max_width: false, min_height: false, max_height: false }
      } else if (this.selectedType === 'intersection') {
        f.iou_method = cfg.iou_method != null ? cfg.iou_method : 1
        f.iou_threshold = cfg.iou_threshold != null ? cfg.iou_threshold : 0.5
        f._intPop = { targets1: false, targets2: false, iou_method: false, iou_threshold: false }
      } else if (this.selectedType === 'intersect') {
        f.iou_mode = cfg.iou_mode || 'min'
        f.iou_threshold = cfg.iou_threshold != null ? cfg.iou_threshold : 0.5
        f.duration = cfg.duration != null ? cfg.duration : 0
        f.buffer = cfg.buffer != null ? cfg.buffer : 0
        f._isPop = { targets1: false, targets2: false, iou_threshold: false, duration: false, buffer: false }
      } else if (this.selectedType === 'displacement') {
        f.period = cfg.period != null ? cfg.period : 0
        f.h_min = cfg.h_min != null ? cfg.h_min : 0
        f.h_max = cfg.h_max != null ? cfg.h_max : 1000000
        f.h_direction = cfg.h_direction || '双向'
        f.v_min = cfg.v_min != null ? cfg.v_min : 0
        f.v_max = cfg.v_max != null ? cfg.v_max : 1000000
        f.v_direction = cfg.v_direction || '双向'
        f.both_axes = cfg.both_axes === false || cfg.both_axes === '否' ? false : true
        f.duration = cfg.duration != null ? cfg.duration : 0
        f.buffer = cfg.buffer != null ? cfg.buffer : 0
        f._dispPop = {
          targets: false, period: false, h_min: false, h_max: false,
          h_direction: false, v_min: false, v_max: false, v_direction: false,
          duration: false, buffer: false
        }
      } else if (this.selectedType === 'tripwire_tracking') {
        f._ttPop = { targets: false, tripwire: false }
      } else if (this.selectedType === 'distance') {
        f.h_min = cfg.h_min != null ? cfg.h_min : 0
        f.h_max = cfg.h_max != null ? cfg.h_max : 1000000
        f.v_min = cfg.v_min != null ? cfg.v_min : 0
        f.v_max = cfg.v_max != null ? cfg.v_max : 1000000
        f.both_axes = cfg.both_axes === false || cfg.both_axes === '否' ? false : true
        f._distPop = {
          targets1: false, targets2: false,
          h_min: false, h_max: false, v_min: false, v_max: false
        }
      } else if (this.selectedType === 'judge') {
        this.judgeConfigTouched = false
        const conds = cfg.conditions || {}
        const bound = this.collectInputBindings(nodeData.id)
        const groups = (conds.condition_groups || []).map(g => ({
          relation: g.relation || 'all',
          conditions: (g.conditions || []).map(c => {
            const field = c.field || ''
            const paramRef = field && bound[field] ? bound[field] : (c.param_ref || '')
            let paramType = c.param_type || ''
            if (paramRef && !paramType) paramType = this.judgeParamTypeFromRef(paramRef)
            return {
              field,
              operator: c.operator || '',
              value: c.value != null ? c.value : '',
              param_type: paramType,
              param_ref: paramRef,
              _paramPop: false
            }
          })
        }))
        f.groups = groups.length
          ? groups
          : [{ relation: 'all', conditions: [this.emptyJudgeCond()] }]
        f.groups.forEach(g => {
          if (!g.conditions || !g.conditions.length) g.conditions = [this.emptyJudgeCond()]
        })
        f.global_relation = conds.global_relation || 'or'
        f.same_target = !!conds.same_target
        f.duration = cfg.duration != null ? cfg.duration : 0
        f.buffer = cfg.buffer != null ? cfg.buffer : 0
      } else if (this.selectedType === 'end') {
        f.message = cfg.message || ''
        f.out_params = (cfg.output_params || []).map(op => ({ name: op.name || '', ref: op.ref || '' }))
      } else if (this.selectedType === 'start') {
        const list = (cfg.input_params || []).map(pp => ({
          name: pp.name || '', type: pp.type || 'String', required: !!pp.required,
          item_type: pp.item_type || 'String', _typeOpen: false, _arrayHover: false
        }))
        f.input_params = list.length ? list : [{ name: 'image', type: 'Image', required: true, item_type: 'String', _typeOpen: false, _arrayHover: false }]
      } else if (this.selectedType === 'target_matting') {
        f.width_multiplier = cfg.width_multiplier != null ? cfg.width_multiplier : 1.4
        f.height_multiplier = cfg.height_multiplier != null ? cfg.height_multiplier : 1.4
      } else if (this.selectedType === 'small_image_batch') {
        f.model_mode = cfg.model_mode || ''
        f._sibImgPop = false
        f._sibRoiPop = false
        if (f.model_mode === 'vlm_model') {
          f.model_name = cfg.model_name || this.vlmModelDefault || ''
          this.ensureVlmModelOption(f.model_name)
          f.system_prompt = cfg.system_prompt || ''
          f.prompt = cfg.prompt || ''
          const outList = (cfg.output_parameters || []).map(op => ({
            name: op.name || '',
            type: this.normalizeSibVlmOutputType(op.type),
            _typeOpen: false
          }))
          f.output_parameters = outList.length
            ? outList
            : [{ name: 'output', type: 'String', _typeOpen: false }]
        } else if (f.model_mode === 'detection_model') {
          f.model_id = cfg.model_id != null ? cfg.model_id : null
          f.model_name = cfg.model_name || ''
          f.model_version = cfg.model_version || ''
          f._modelLabel = cfg.model_label || ''
          f.target_classes = (cfg.target_classes || []).slice()
          f.class_thresholds = { ...(cfg.class_thresholds || {}) }
          f._classLabels = { ...(cfg.class_labels || {}) }
          f.target_classes.forEach(c => { if (f.class_thresholds[c] == null) f.class_thresholds[c] = 0.5 })
          if (f.model_id != null) {
            this.ensureSelectedModelOption(f.model_id, f._modelLabel, f.model_name, f.model_version)
            this.loadModelClasses(f.model_id)
          }
        }
      }
      this.form = f
      // 通用：为任意"有输入端口"的节点构建输入来源选择器（树形）
      this.refreshInputBindings(nodeData.id)
      if (this.selectedType === 'custom_code') {
        this.renderCodePreview()
      }
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
    // 在文案光标处插入标签 {token}
    insertToken(token) {
      const ins = `{${token}}`
      const cur = this.form.message || ''
      const wrap = this.$refs.endMsgInput
      const ta = wrap && wrap.$el && wrap.$el.querySelector('textarea')
      if (ta && typeof ta.selectionStart === 'number') {
        const s = ta.selectionStart
        const e = ta.selectionEnd
        this.$set(this.form, 'message', cur.slice(0, s) + ins + cur.slice(e))
        this.$nextTick(() => {
          ta.focus()
          const p = s + ins.length
          ta.setSelectionRange(p, p)
        })
      } else {
        this.$set(this.form, 'message', cur + ins)
      }
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
    addVlmInputParam() {
      if (!this.form.input_params) this.$set(this.form, 'input_params', [])
      this.form.input_params.push({
        name: '', type: 'Image', item_type: 'Image',
        _typeOpen: false, _arrayHover: false, _bindOpen: false
      })
      this.applyConfig()
    },
    removeVlmInputParam(ii) {
      const ip = this.form.input_params[ii]
      if (ip && ip.name) this.clearVlmInput(ip)
      this.form.input_params.splice(ii, 1)
      this.applyConfig()
    },
    addVlmOutputParam() {
      if (!this.form.output_parameters) this.$set(this.form, 'output_parameters', [])
      this.form.output_parameters.push({ name: '', type: 'String', _typeOpen: false })
      this.applyConfig()
    },
    removeVlmOutputParam(oi) {
      this.form.output_parameters.splice(oi, 1)
      if (!this.form.output_parameters.length) {
        this.form.output_parameters.push({ name: 'output', type: 'String', _typeOpen: false })
      }
      this.applyConfig()
    },
    vlmInputTypeLabel(ip) {
      if (ip.type === 'Array') return 'Array<Image>'
      return 'Image'
    },
    vlmOutputTypeLabel(type) {
      return type || 'String'
    },
    vlmTypePrefix(type) {
      if (!type) return 'any.'
      if (String(type).startsWith('Array<')) return 'arr.'
      const m = { String: 'str.', Integer: 'int.', Double: 'dbl.', Boolean: 'bool.' }
      return m[type] || 'any.'
    },
    vlmPortType(ip) {
      return ip.type === 'Array' ? 'Array' : (ip.type || 'Image')
    },
    backendToVlmType(type) {
      if (!type) return 'String'
      const s = String(type).trim()
      const arr = s.match(/^array<(.+)>$/i)
      if (arr) {
        const inner = this.backendToVlmType(arr[1])
        return `Array<${inner}>`
      }
      const m = {
        string: 'String', str: 'String',
        integer: 'Integer', int: 'Integer',
        double: 'Double', float: 'Double',
        boolean: 'Boolean', bool: 'Boolean',
        target: 'Target',
        detection: 'Detection'
      }
      return m[s.toLowerCase()] || s
    },
    vlmTypeToBackend(type) {
      if (!type) return 'string'
      if (String(type).startsWith('Array<')) {
        const inner = type.slice(6, -1)
        return `array<${this.vlmTypeToBackend(inner)}>`
      }
      const m = { String: 'string', Integer: 'integer', Double: 'double', Boolean: 'boolean', Target: 'target', Detection: 'detection' }
      return m[type] || String(type).toLowerCase()
    },
    selectVlmInputType(ip, v) {
      this.$set(ip, 'type', v)
      ip._typeOpen = false
      if (ip.name) this.clearVlmInput(ip)
      this.applyConfig()
    },
    selectVlmInputArrayType(ip, v) {
      this.$set(ip, 'type', 'Array')
      this.$set(ip, 'item_type', 'Image')
      ip._typeOpen = false
      if (ip.name) this.clearVlmInput(ip)
      this.applyConfig()
    },
    selectVlmOutputType(op, v) {
      this.$set(op, 'type', v)
      op._typeOpen = false
      this.applyConfig()
    },
    normalizeSibVlmOutputType(type) {
      const allowed = ['Boolean', 'String', 'Integer', 'Double']
      const t = this.backendToVlmType(type) || 'String'
      return allowed.includes(t) ? t : 'String'
    },
    selectSibVlmOutputType(op, v) {
      this.$set(op, 'type', this.normalizeSibVlmOutputType(v))
      op._typeOpen = false
      this.applyConfig()
    },
    vlmInputBindingValue(portName) {
      if (!this.selectedNode || !portName) return ''
      const bound = this.collectInputBindings(this.selectedNode.id)
      return bound[portName] || ''
    },
    vlmInputTreeData(ip) {
      if (!this.selectedNode || !ip || !ip.name) return []
      return this.groupsToTree(this.typedSourceGroups(this.vlmPortType(ip), this.selectedNode.id))
    },
    vlmInputBindLabel(portName) {
      const val = this.vlmInputBindingValue(portName)
      if (!val) return ''
      const ip = (this.form.input_params || []).find(p => p.name === portName)
      const groups = this.selectedNode
        ? this.typedSourceGroups(this.vlmPortType(ip || {}), this.selectedNode.id)
        : []
      return this.refLabel(val, groups)
    },
    onVlmInputPick(ip, data) {
      if (!data || !data.leaf || !ip.name) return
      ip._bindOpen = false
      this.bindInput(ip.name, data.id)
    },
    clearVlmInput(ip) {
      if (!ip || !ip.name || !this.selectedNode) return
      ip._bindOpen = false
      const nid = this.selectedNode.id
      const g = this.lf.getGraphData()
      ;(g.edges || []).forEach(x => {
        if (x.targetNodeId !== nid) return
        const xtp = (x.properties && x.properties.targetPort) || this.parsePort(x.targetAnchorId, 'in')
        if (xtp !== ip.name) return
        this.lf.setProperties(x.id, { ...(x.properties || {}), paramBound: false })
      })
    },
    videoSliceBindingValue(port) {
      const sel = (this.inputSelectors || []).find(s => s.port === port)
      return sel ? sel.value : ''
    },
    videoSliceBindLabel(port) {
      const sel = (this.inputSelectors || []).find(s => s.port === port)
      return sel ? this.selLabel(sel) : ''
    },
    videoSliceBound(port) {
      return !!this.videoSliceBindingValue(port)
    },
    videoSliceBindTree(type) {
      if (!this.selectedNode) return []
      const types = type === 'Number' ? ['Number', 'Double'] : [type]
      const seen = new Set()
      const groups = []
      types.forEach(t => {
        this.typedSourceGroups(t, this.selectedNode.id).forEach(g => {
          const key = `${g.nodeId}::${(g.params || []).map(p => p.port).join(',')}`
          if (seen.has(key)) return
          seen.add(key)
          groups.push(g)
        })
      })
      return this.groupsToTree(groups)
    },
    onVideoSlicePick(port, data) {
      if (!data || !data.leaf) return
      if (this.form._vsPop) this.$set(this.form._vsPop, port, false)
      this.bindInput(port, data.id)
    },
    clearVideoSliceInput(port) {
      const sel = (this.inputSelectors || []).find(s => s.port === port)
      if (sel) this.clearInput(sel)
      if (this.form._vsPop) this.$set(this.form._vsPop, port, false)
    },
    intersectBindingValue(port) {
      const sel = (this.inputSelectors || []).find(s => s.port === port)
      return sel ? sel.value : ''
    },
    intersectBindLabel(port) {
      const sel = (this.inputSelectors || []).find(s => s.port === port)
      return sel ? this.selLabel(sel) : ''
    },
    intersectBound(port) {
      return !!this.intersectBindingValue(port)
    },
    intersectBindTree(type) {
      if (!this.selectedNode) return []
      const types = type === 'Number' ? ['Number', 'Double'] : [type]
      const seen = new Set()
      const groups = []
      types.forEach(t => {
        this.typedSourceGroups(t, this.selectedNode.id).forEach(g => {
          const key = `${g.nodeId}::${(g.params || []).map(p => p.port).join(',')}`
          if (seen.has(key)) return
          seen.add(key)
          groups.push(g)
        })
      })
      return this.groupsToTree(groups)
    },
    intersectPopKey() {
      if (this.selectedType === 'intersection') return '_intPop'
      if (this.selectedType === 'region_filter') return '_rfPop'
      if (this.selectedType === 'size_filter') return '_sfPop'
      if (this.selectedType === 'count') return '_countPop'
      if (this.selectedType === 'tripwire_tracking') return '_ttPop'
      if (this.selectedType === 'displacement') return '_dispPop'
      if (this.selectedType === 'distance') return '_distPop'
      return '_isPop'
    },
    onIntersectPick(port, data) {
      if (!data || !data.leaf) return
      const popKey = this.intersectPopKey()
      if (this.form[popKey]) this.$set(this.form[popKey], port, false)
      this.bindInput(port, data.id)
    },
    clearIntersectInput(port) {
      const sel = (this.inputSelectors || []).find(s => s.port === port)
      if (sel) this.clearInput(sel)
      const popKey = this.intersectPopKey()
      if (this.form[popKey]) this.$set(this.form[popKey], port, false)
    },
    addGroup() {
      if (!this.form.groups) this.$set(this.form, 'groups', [])
      if (this.form.groups.length >= JUDGE_MAX_GROUPS) {
        this.$message.warning('最多添加10个条件组')
        return
      }
      this.form.groups.push({
        relation: 'all',
        conditions: [this.emptyJudgeCond()]
      })
      this.judgeConfigTouched = true
      this.applyConfig()
    },
    removeGroup(gi) {
      this.form.groups.splice(gi, 1)
      if (!this.form.groups.length) {
        this.form.groups.push({
          relation: 'all',
          conditions: [this.emptyJudgeCond()]
        })
      }
      this.judgeConfigTouched = true
      this.applyConfig()
    },
    addCond(gi) {
      const grp = this.form.groups[gi]
      if (!grp.conditions) this.$set(grp, 'conditions', [])
      if (grp.conditions.length >= JUDGE_MAX_CONDITIONS) {
        this.$message.warning('最多添加10个条件')
        return
      }
      grp.conditions.push(this.emptyJudgeCond())
      this.judgeConfigTouched = true
      this.applyConfig()
    },
    removeCond(gi, ci) {
      const grp = this.form.groups[gi]
      const c = grp.conditions[ci]
      if (c && c.field) this.unbindJudgeField(c.field)
      grp.conditions.splice(ci, 1)
      if (!grp.conditions.length) grp.conditions.push(this.emptyJudgeCond())
      this.judgeConfigTouched = true
      this.applyConfig()
    },
    emptyJudgeCond() {
      return { field: '', operator: '', value: '', param_type: '', param_ref: '', _paramPop: false }
    },
    judgeAllSourceGroups() {
      if (!this.selectedNode) return []
      const g = (this.lf && this.lf.getGraphData && this.lf.getGraphData()) || { nodes: [] }
      const upstream = this.upstreamNodeIds(this.selectedNode.id)
      if (!upstream.size) return []
      const groups = []
      ;(g.nodes || []).forEach(n => {
        if (!upstream.has(n.id)) return
        const nt = n.properties && n.properties.nodeType
        if (nt === 'end') return
        const outs = this.nodeTypedOutputs(n)
        if (!outs.length) return
        const nodeName = (n.text && (n.text.value != null ? n.text.value : n.text)) ||
          (n.properties && n.properties.name_zh) || n.id
        groups.push({ nodeId: n.id, nodeName, params: outs })
      })
      return groups
    },
    judgeParamTypeFromRef(ref) {
      if (!ref) return 'String'
      const idx = ref.indexOf('::')
      const nid = idx >= 0 ? ref.substring(0, idx) : ref
      const port = idx >= 0 ? ref.substring(idx + 2) : ''
      const g = this.judgeAllSourceGroups().find(x => x.nodeId === nid)
      const p = g && (g.params || []).find(x => x.port === port)
      return (p && p.type) || 'String'
    },
    judgeParamLabel(ref) {
      if (!ref) return ''
      return this.refLabel(ref, this.judgeAllSourceGroups())
    },
    judgeParamTypeIcon(type) {
      return this.paramTypeIcon(type || 'String')
    },
    judgeOperatorsForType(type) {
      const labels = JUDGE_OPERATORS_BY_TYPE[type] || JUDGE_OPERATORS_BY_TYPE.String
      return labels.map(l => ({ v: JUDGE_OP_LABEL_TO_CODE[l], l }))
    },
    judgeCondNeedsValue(operator) {
      return operator && operator !== 'is_empty' && operator !== 'is_not_empty'
    },
    judgeCondValueMissing(c) {
      return this.judgeCondNeedsValue(c.operator) && (c.value === '' || c.value == null)
    },
    judgeCondComplete(c) {
      if (!c || !c.param_ref || !c.field || !c.operator) return false
      if (this.judgeCondNeedsValue(c.operator) && (c.value === '' || c.value == null)) return false
      return true
    },
    judgeCondShowErr(c) {
      return this.judgeConfigTouched && !this.judgeCondComplete(c)
    },
    judgeCondErrText(c) {
      if (!c.param_ref || !c.field) return '参数、条件、条件值不可为空'
      if (!c.operator) return '条件、条件值不可为空'
      if (this.judgeCondValueMissing(c)) return '条件、条件值不可为空'
      return '参数、条件、条件值不可为空'
    },
    onJudgeParamPick(gi, ci, data) {
      if (!data || !data.leaf) return
      const grp = this.form.groups[gi]
      const c = grp.conditions[ci]
      const idx = data.id.indexOf('::')
      const srcId = idx >= 0 ? data.id.substring(0, idx) : data.id
      const port = idx >= 0 ? data.id.substring(idx + 2) : data.id
      const field = `${srcId}__${port}`
      const oldField = c.field
      if (oldField && oldField !== field) this.unbindJudgeField(oldField)
      c.param_ref = data.id
      c.field = field
      c.param_type = this.judgeParamTypeFromRef(data.id)
      c._paramPop = false
      const ops = this.judgeOperatorsForType(c.param_type)
      if (!ops.some(o => o.v === c.operator)) c.operator = ''
      this.bindInput(field, data.id)
      this.judgeConfigTouched = true
      this.applyConfig()
    },
    clearJudgeParam(gi, ci) {
      const c = this.form.groups[gi].conditions[ci]
      if (c.field) this.unbindJudgeField(c.field)
      c.param_ref = ''
      c.field = ''
      c.param_type = ''
      c.operator = ''
      c.value = ''
      c._paramPop = false
      this.judgeConfigTouched = true
      this.applyConfig()
    },
    onJudgeOperatorChange(gi, ci) {
      const c = this.form.groups[gi].conditions[ci]
      if (!this.judgeCondNeedsValue(c.operator)) c.value = ''
      this.judgeConfigTouched = true
      this.applyConfig()
    },
    unbindJudgeField(field) {
      if (!this.selectedNode || !field) return
      const nid = this.selectedNode.id
      const g = this.lf.getGraphData()
      ;(g.edges || []).forEach(x => {
        if (x.targetNodeId !== nid) return
        const xtp = (x.properties && x.properties.targetPort) || this.parsePort(x.targetAnchorId, 'in')
        if (xtp === field) this.lf.deleteEdge(x.id)
      })
    },
    applyConfig() {
      if (!this.selectedNode) return
      const id = this.selectedNode.id
      const cfg = {}
      const t = this.selectedType
      if (t === 'detection_model') {
        const classes = (this.form.target_classes || []).slice()
        const th = {}
        classes.forEach(c => {
          const v = this.form.class_thresholds ? this.form.class_thresholds[c] : null
          th[c] = v == null || v === '' ? 0.5 : Number(v)
        })
        const labels = {}
        ;(this.modelClassOptions || []).forEach(o => { labels[o.name] = o.name_zh || o.name })
        const classLabels = {}
        classes.forEach(c => {
          classLabels[c] = labels[c] || (this.form._classLabels && this.form._classLabels[c]) || c
        })
        cfg.model_id = this.form.model_id != null ? this.form.model_id : null
        cfg.model_name = this.form.model_name || ''
        cfg.model_version = this.form.model_version || ''
        cfg.model_label = this.form._modelLabel || ''
        cfg.target_classes = classes
        cfg.class_thresholds = th
        cfg.confidence_threshold = classes.length ? Math.min.apply(null, Object.values(th)) : 0.5
        cfg.class_labels = classLabels
      } else if (t === 'vlm_model') {
        cfg.model_name = this.form.model_name || ''
        cfg.system_prompt = this.form.system_prompt || ''
        cfg.prompt = this.form.prompt || ''
        cfg.input_params = (this.form.input_params || []).map(ip => {
          const rawType = ip.type || 'Image'
          const o = {
            name: (ip.name || '').trim(),
            type: rawType === 'Array' ? 'Array' : 'Image'
          }
          if (o.type === 'Array') o.item_type = 'Image'
          return o
        }).filter(ip => ip.name)
        cfg.output_parameters = (this.form.output_parameters || []).map(op => ({
          name: (op.name || '').trim(),
          type: this.vlmTypeToBackend(op.type),
          description: op.description || ''
        })).filter(op => op.name)
      } else if (t === 'region_filter') {
        // 默认保留围栏内目标，与节点说明一致
        cfg.trigger_mode = 'inside'
      } else if (t === 'video_slice') {
        const clamp = v => {
          const n = Number(v)
          if (Number.isNaN(n)) return 0
          return Math.max(0, Math.min(1800, n))
        }
        if (!this.videoSliceBound('start_time')) cfg.start_time = clamp(this.form.start_time)
        if (!this.videoSliceBound('end_time')) cfg.end_time = clamp(this.form.end_time)
        if (!this.videoSliceBound('buffer')) cfg.buffer = clamp(this.form.buffer)
      } else if (t === 'size_filter') {
        const clamp8192 = v => {
          const n = Number(v)
          if (Number.isNaN(n)) return 0
          return Math.max(0, Math.min(8192, n))
        }
        if (!this.intersectBound('min_width')) cfg.min_width = clamp8192(this.form.min_width)
        if (!this.intersectBound('max_width')) cfg.max_width = clamp8192(this.form.max_width)
        if (!this.intersectBound('min_height')) cfg.min_height = clamp8192(this.form.min_height)
        if (!this.intersectBound('max_height')) cfg.max_height = clamp8192(this.form.max_height)
      } else if (t === 'intersection') {
        const clamp01 = v => {
          const n = Number(v)
          if (Number.isNaN(n)) return 0.5
          return Math.max(0, Math.min(1, n))
        }
        if (!this.intersectBound('iou_method')) {
          const method = Number(this.form.iou_method)
          cfg.iou_method = [0, 1, 2].includes(method) ? method : 1
        }
        if (!this.intersectBound('iou_threshold')) cfg.iou_threshold = clamp01(this.form.iou_threshold)
      } else if (t === 'intersect') {
        cfg.iou_mode = this.form.iou_mode || 'min'
        const clamp01 = v => {
          const n = Number(v)
          if (Number.isNaN(n)) return 0.5
          return Math.max(0, Math.min(1, n))
        }
        const clamp3600 = v => {
          const n = Number(v)
          if (Number.isNaN(n)) return 0
          return Math.max(0, Math.min(3600, n))
        }
        if (!this.intersectBound('iou_threshold')) cfg.iou_threshold = clamp01(this.form.iou_threshold)
        if (!this.intersectBound('duration')) cfg.duration = clamp3600(this.form.duration)
        if (!this.intersectBound('buffer')) cfg.buffer = clamp3600(this.form.buffer)
      } else if (t === 'displacement') {
        const clamp3600 = v => {
          const n = Number(v)
          if (Number.isNaN(n)) return 0
          return Math.max(0, Math.min(3600, n))
        }
        const clamp1m = v => {
          const n = Number(v)
          if (Number.isNaN(n)) return 0
          return Math.max(0, Math.min(1000000, n))
        }
        if (!this.intersectBound('period')) cfg.period = Math.round(clamp3600(this.form.period))
        if (!this.intersectBound('h_min')) cfg.h_min = clamp1m(this.form.h_min)
        if (!this.intersectBound('h_max')) cfg.h_max = clamp1m(this.form.h_max)
        if (!this.intersectBound('h_direction')) cfg.h_direction = this.form.h_direction || '双向'
        if (!this.intersectBound('v_min')) cfg.v_min = clamp1m(this.form.v_min)
        if (!this.intersectBound('v_max')) cfg.v_max = clamp1m(this.form.v_max)
        if (!this.intersectBound('v_direction')) cfg.v_direction = this.form.v_direction || '双向'
        cfg.both_axes = this.form.both_axes !== false
        if (!this.intersectBound('duration')) cfg.duration = clamp3600(this.form.duration)
        if (!this.intersectBound('buffer')) cfg.buffer = clamp3600(this.form.buffer)
      } else if (t === 'distance') {
        const clamp1m = v => {
          const n = Number(v)
          if (Number.isNaN(n)) return 0
          return Math.max(0, Math.min(1000000, n))
        }
        if (!this.intersectBound('h_min')) cfg.h_min = clamp1m(this.form.h_min)
        if (!this.intersectBound('h_max')) cfg.h_max = clamp1m(this.form.h_max)
        if (!this.intersectBound('v_min')) cfg.v_min = clamp1m(this.form.v_min)
        if (!this.intersectBound('v_max')) cfg.v_max = clamp1m(this.form.v_max)
        cfg.both_axes = this.form.both_axes !== false
      } else if (t === 'judge') {
        const clamp3600 = v => {
          const n = Number(v)
          if (Number.isNaN(n)) return 0
          return Math.max(0, Math.min(3600, Math.round(n * 10000) / 10000))
        }
        cfg.conditions = {
          condition_groups: (this.form.groups || []).map(g => ({
            conditions: (g.conditions || []).map(c => ({
              field: c.field || '',
              operator: c.operator || '',
              value: c.value,
              param_type: c.param_type || ''
            })),
            relation: g.relation || 'all'
          })),
          global_relation: this.form.global_relation || 'or',
          same_target: !!this.form.same_target
        }
        cfg.duration = clamp3600(this.form.duration)
        cfg.buffer = clamp3600(this.form.buffer)
      } else if (t === 'custom_code') {
        cfg.input_params = (this.form.input_params || []).map(ip => {
          const o = { name: (ip.name || '').trim(), type: ip.type || 'String' }
          if (o.type === 'Array') o.item_type = ip.item_type || 'String'
          return o
        }).filter(ip => ip.name)
        cfg.output_parameters = (this.form.output_parameters || []).map(op => {
          const o = { name: (op.name || '').trim(), type: op.type || 'String' }
          if (o.type === 'Array') o.item_type = op.item_type || 'String'
          return o
        }).filter(op => op.name)
        cfg.code = this.form.code || DEFAULT_CUSTOM_CODE
        cfg.timeout_ms = Number(this.form.timeout_ms) || 10000
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
      } else if (t === 'target_matting') {
        const clampMattingMul = v => {
          const n = Number(v)
          if (Number.isNaN(n)) return 1.4
          return Math.max(0.1, Math.min(10, Math.round(n * 10000) / 10000))
        }
        cfg.width_multiplier = clampMattingMul(this.form.width_multiplier)
        cfg.height_multiplier = clampMattingMul(this.form.height_multiplier)
      } else if (t === 'small_image_batch') {
        const mode = this.form.model_mode || ''
        cfg.model_mode = mode
        if (mode === 'vlm_model') {
          cfg.model_name = this.form.model_name || ''
          cfg.system_prompt = this.form.system_prompt || ''
          cfg.prompt = this.form.prompt || ''
          cfg.output_parameters = (this.form.output_parameters || []).map(op => ({
            name: (op.name || '').trim(),
            type: this.vlmTypeToBackend(op.type),
            description: op.description || ''
          })).filter(op => op.name)
        } else if (mode === 'detection_model') {
          const classes = (this.form.target_classes || []).slice()
          const th = {}
          classes.forEach(c => {
            const v = this.form.class_thresholds ? this.form.class_thresholds[c] : null
            th[c] = v == null || v === '' ? 0.5 : Number(v)
          })
          const labels = {}
          ;(this.modelClassOptions || []).forEach(o => { labels[o.name] = o.name_zh || o.name })
          const classLabels = {}
          classes.forEach(c => {
            classLabels[c] = labels[c] || (this.form._classLabels && this.form._classLabels[c]) || c
          })
          cfg.model_id = this.form.model_id != null ? this.form.model_id : null
          cfg.model_name = this.form.model_name || ''
          cfg.model_version = this.form.model_version || ''
          cfg.model_label = this.form._modelLabel || ''
          cfg.target_classes = classes
          cfg.class_thresholds = th
          cfg.confidence_threshold = classes.length ? Math.min.apply(null, Object.values(th)) : 0.5
          cfg.class_labels = classLabels
        }
      }
      const props = this.selectedNode.properties || {}
      // 视觉模型：输出端口随选中的标签动态生成（每个标签一个 Detection 输出）
      if (t === 'detection_model') {
        const classes = (cfg.target_classes || []).slice()
        const pt = { image: 'Image', roi: 'ROI' }
        classes.forEach(c => { pt[c] = 'Detection' })
        props.inputPorts = ['image', 'roi']
        props.outputPorts = classes
        props.portTypes = pt
        props.modelLabel = cfg.model_label
        props.classLabels = cfg.class_labels
      }
      if (t === 'vlm_model') {
        const inputs = (cfg.input_params || []).filter(p => p.name)
        const pt = {}
        inputs.forEach(p => { pt[p.name] = p.type === 'Array' ? 'Array' : (p.type || 'Image') })
        props.inputPorts = inputs.length ? inputs.map(p => p.name) : ['image']
        if (!inputs.length) pt.image = 'Image'
        const outputs = (cfg.output_parameters || []).filter(p => p.name)
        props.outputPorts = outputs.length ? outputs.map(p => p.name) : ['output']
        outputs.forEach(p => { pt[p.name] = vlmOutputPortType(p.type) })
        if (!outputs.length) pt.output = 'String'
        props.portTypes = pt
      }
      if (t === 'custom_code') {
        const inputs = (cfg.input_params || []).filter(p => p.name)
        const pt = {}
        inputs.forEach(p => { pt[p.name] = customPortType(p.type) })
        props.inputPorts = inputs.length ? inputs.map(p => p.name) : ['input']
        if (!inputs.length) pt.input = 'String'
        const outputs = (cfg.output_parameters || []).filter(p => p.name)
        props.outputPorts = outputs.length ? outputs.map(p => p.name) : ['output']
        outputs.forEach(p => { pt[p.name] = customPortType(p.type) })
        if (!outputs.length) pt.output = 'String'
        props.portTypes = pt
        props.dynamic = true
      }
      if (t === 'small_image_batch') {
        const mode = cfg.model_mode || ''
        const pt = { small_images: 'Array' }
        if (mode === 'vlm_model') {
          const outputs = (cfg.output_parameters || []).filter(p => p.name)
          props.outputPorts = outputs.length ? outputs.map(p => p.name) : ['output']
          outputs.forEach(p => { pt[p.name] = vlmOutputPortType(p.type) })
          if (!outputs.length) pt.output = 'String'
          pt.image = 'Image'
          props.inputPorts = ['small_images', 'image']
        } else if (mode === 'detection_model') {
          const classes = (cfg.target_classes || []).slice()
          props.outputPorts = classes.length ? classes : ['output']
          classes.forEach(c => { pt[c] = 'Detection' })
          if (!classes.length) pt.output = 'String'
          pt.image = 'Image'
          pt.roi = 'ROI'
          props.inputPorts = ['small_images', 'image', 'roi']
        } else {
          props.outputPorts = ['output']
          pt.output = 'String'
          props.inputPorts = ['small_images']
        }
        props.portTypes = pt
        const parentId = props.parent_id || (props.config && props.config.parent_id) || ''
        cfg.parent_id = parentId
        props.parent_id = parentId
      }
      if (t === 'target_matting') {
        const companionId = props.companion_id || (props.config && props.config.companion_id) || ''
        cfg.companion_id = companionId
        props.companion_id = companionId
      }
      props.config = cfg
      // 先更新文本，再 setProperties 触发 HTML 节点重渲染，使标题改名即时生效
      if (this.form._name) {
        this.lf.updateText(id, this.form._name)
        props.name_zh = this.form._name
      }
      this.lf.setProperties(id, props)
      if (t === 'judge') {
        try {
          const model = this.lf.getNodeModelById(id)
          if (model && model.setAttributes) {
            model.setAttributes()
            if (model.initAnchors) model.initAnchors()
          }
        } catch (e) { /* ignore */ }
      }
    },
    deleteSelected() {
      if (!this.selectedNode) return
      if (this.selectedType === 'start' || this.selectedType === 'end') {
        this.$message.warning('开始/结束节点不可删除')
        return
      }
      this.closeCodeEditor()
      const deletedId = this.selectedNode.id
      this.lf.deleteNode(deletedId)
      this.onNodeDeleted(deletedId)
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
        const props = this.resolveNodeProps(n)
        const t = props.nodeType
        if (t === 'start' || t === 'end') return  // 固定节点不可删除
        this.lf.deleteNode(n.id)
        this.onNodeDeleted(n.id)
        removed = true
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
        const props = {
          nodeType: n.type,
          name_zh: ports.name_zh || n.type,
          category: ports.category || n.type,
          inputPorts: ports.inputs,
          outputPorts: ports.outputs,
          portTypes: ports.types || {},
          dynamic: ports.dynamic,
          config: n.config || {}
        }
        // 视觉模型：输出端口随配置里的标签恢复（每个标签一个 Detection 输出）
        if (n.type === 'detection_model') {
          const cfg = n.config || {}
          const classes = (cfg.target_classes || []).slice()
          const pt = { image: 'Image', roi: 'ROI' }
          classes.forEach(c => { pt[c] = 'Detection' })
          props.inputPorts = ['image', 'roi']
          props.outputPorts = classes
          props.portTypes = pt
          props.modelLabel = cfg.model_label || ''
          props.classLabels = cfg.class_labels || {}
        }
        if (n.type === 'vlm_model') {
          const cfg = n.config || {}
          const inputs = (cfg.input_params || []).filter(p => p && p.name)
          const outputs = (cfg.output_parameters || []).filter(p => p && p.name)
          const pt = {}
          inputs.forEach(p => { pt[p.name] = p.type === 'Array' ? 'Array' : (p.type || 'Image') })
          props.inputPorts = inputs.length ? inputs.map(p => p.name) : ['image']
          if (!inputs.length) pt.image = 'Image'
          props.outputPorts = outputs.length ? outputs.map(p => p.name) : ['output']
          outputs.forEach(p => { pt[p.name] = vlmOutputPortType(p.type) })
          if (!outputs.length) pt.output = 'String'
          props.portTypes = pt
        }
        if (n.type === 'custom_code') {
          const cfg = n.config || {}
          const inputs = (cfg.input_params || []).filter(p => p && p.name)
          const outputs = (cfg.output_parameters || []).filter(p => p && p.name)
          const pt = {}
          inputs.forEach(p => { pt[p.name] = customPortType(p.type) })
          props.inputPorts = inputs.length ? inputs.map(p => p.name) : ['input']
          if (!inputs.length) pt.input = 'String'
          props.outputPorts = outputs.length ? outputs.map(p => p.name) : ['output']
          outputs.forEach(p => { pt[p.name] = customPortType(p.type) })
          if (!outputs.length) pt.output = 'String'
          props.portTypes = pt
          props.dynamic = true
        }
        if (n.type === 'target_matting') {
          props.companion_id = (n.config || {}).companion_id || ''
        }
        if (n.type === 'small_image_batch') {
          const cfg = n.config || {}
          props.parent_id = cfg.parent_id || ''
          const mode = cfg.model_mode || ''
          const pt = { small_images: 'Array' }
          if (mode === 'vlm_model') {
            const outputs = (cfg.output_parameters || []).filter(p => p && p.name)
            props.outputPorts = outputs.length ? outputs.map(p => p.name) : ['output']
            outputs.forEach(p => { pt[p.name] = vlmOutputPortType(p.type) })
            if (!outputs.length) pt.output = 'String'
          } else if (mode === 'detection_model') {
            const classes = (cfg.target_classes || []).slice()
            props.outputPorts = classes.length ? classes : ['output']
            classes.forEach(c => { pt[c] = 'Detection' })
            if (!classes.length) pt.output = 'String'
          } else {
            props.outputPorts = ['output']
            pt.output = 'String'
          }
          props.inputPorts = ['small_images']
          props.portTypes = pt
        }
        return { id: n.id, type: 'sg-node', x: pos.x, y: pos.y, text: n.name || (ports.name_zh || n.type), properties: props }
      })
      const edges = (gd.edges || []).map(e => {
        const srcType = typeById[e.source]
        const tgtType = typeById[e.target]
        const anchors = this.edgeAnchors(e.source, e.target, srcType, tgtType, e.source_port, e.target_port)
        return {
          id: e.id || undefined,
          type: 'bezier',
          sourceNodeId: e.source,
          targetNodeId: e.target,
          sourceAnchorId: anchors.sourceAnchorId,
          targetAnchorId: anchors.targetAnchorId,
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
      if (this.selectedType === 'judge') this.judgeConfigTouched = true
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
    initCodeMirror() {
      if (this.codeMirrorInstance) {
        this.codeMirrorInstance.setValue(this.form.code || DEFAULT_CUSTOM_CODE)
        this.$nextTick(() => this.codeMirrorInstance.refresh())
        return
      }
      const host = this.$refs.codeEditor
      if (!host) return
      this.codeMirrorInstance = CodeMirror(host, {
        value: this.form.code || DEFAULT_CUSTOM_CODE,
        mode: 'python',
        theme: 'material-darker',
        lineNumbers: true,
        lineWrapping: true,
        tabSize: 4,
        indentUnit: 4,
        indentWithTabs: false,
        matchBrackets: true,
        autoCloseBrackets: true,
        extraKeys: {
          Tab: (cm) => {
            if (cm.somethingSelected()) CodeMirror.commands.indentMore(cm)
            else cm.replaceSelection('    ', 'end')
          }
        }
      })
      this.codeMirrorInstance.on('change', (cm) => {
        if (this._codeChangeTimer) clearTimeout(this._codeChangeTimer)
        this._codeChangeTimer = setTimeout(() => {
          this.$set(this.form, 'code', cm.getValue())
          this.applyConfig()
        }, 150)
      })
      this.$nextTick(() => this.codeMirrorInstance.refresh())
    },
    destroyCodeMirror() {
      if (!this.codeMirrorInstance) return
      const wrapper = this.codeMirrorInstance.getWrapperElement()
      if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper)
      this.codeMirrorInstance = null
    },
    renderCodePreview() {
      if (this.selectedType !== 'custom_code') return
      const paint = () => {
        const el = this.$refs.codePreviewBox
        if (!el) return false
        el.innerHTML = ''
        const text = this.codePreview || ''
        const truncated = text.endsWith('\n...')
        const main = truncated ? text.slice(0, -4) : text
        if (main && typeof CodeMirror.runMode === 'function') {
          CodeMirror.runMode(main, 'python', el)
        } else if (main) {
          el.textContent = main
        }
        if (truncated) {
          const more = document.createElement('span')
          more.className = 'sg-code-preview-more'
          more.textContent = '...'
          el.appendChild(more)
        }
        return true
      }
      this.$nextTick(() => {
        if (!paint()) this.$nextTick(paint)
      })
    },
    openCodeEditor() {
      if (this.selectedType !== 'custom_code') return
      if (!this.form.code) this.$set(this.form, 'code', DEFAULT_CUSTOM_CODE)
      this.codeEditorOpen = true
    },
    closeCodeEditor() {
      this.codeEditorOpen = false
    },
    buildCustomTestInput(inputParams) {
      const obj = {}
      ;(inputParams || []).forEach(p => {
        if (!p || !p.name) return
        const t = p.type || 'String'
        if (t === 'Integer') obj[p.name] = 0
        else if (t === 'Double') obj[p.name] = 0.0
        else if (t === 'Boolean') obj[p.name] = false
        else if (t === 'Array') obj[p.name] = []
        else if (t === 'Detection' || t === 'TrackDetection' || t === 'AttributeGroup' || t === 'Attribute') obj[p.name] = []
        else if (t === 'ROI' || t === 'Tripwire') obj[p.name] = null
        else obj[p.name] = ''
      })
      return JSON.stringify(obj, null, 2)
    },
    async runCustomCodeTest() {
      if (!this.form.code) {
        this.$message.warning('请先编写代码')
        return
      }
      let inputs = {}
      try {
        inputs = JSON.parse(this.codeTestInput || '{}')
        if (typeof inputs !== 'object' || inputs === null || Array.isArray(inputs)) {
          throw new Error('输入必须是 JSON 对象')
        }
      } catch (e) {
        this.$message.error('输入参数 JSON 格式不正确')
        return
      }
      this.codeTestLoading = true
      try {
        const res = await skillGraphAPI.testCustomCode(
          this.form.code,
          inputs,
          this.form.timeout_ms || 10000
        )
        const body = res.data || {}
        if (body.success) {
          this.codeTestOutput = JSON.stringify(body.result, null, 2)
        } else {
          this.codeTestOutput = body.error || '执行失败'
        }
      } catch (e) {
        this.codeTestOutput = (e.response && e.response.data && e.response.data.detail) || e.message || '请求失败'
      } finally {
        this.codeTestLoading = false
      }
    },
    inferParamTypeFromValue(val) {
      if (val === null || val === undefined) return { type: 'String', item_type: 'String' }
      if (typeof val === 'boolean') return { type: 'Boolean', item_type: 'String' }
      if (typeof val === 'number') {
        return { type: Number.isInteger(val) ? 'Integer' : 'Double', item_type: 'String' }
      }
      if (typeof val === 'string') return { type: 'String', item_type: 'String' }
      if (Array.isArray(val)) {
        if (!val.length) return { type: 'Array', item_type: 'String' }
        const first = val[0]
        if (first && typeof first === 'object' && (first.bbox || first.label != null)) {
          return { type: 'Array', item_type: 'Detection' }
        }
        const inner = this.inferParamTypeFromValue(first)
        const itemType = inner.type === 'Array' ? 'String' : inner.type
        return { type: 'Array', item_type: itemType }
      }
      if (typeof val === 'object') {
        if (val.bbox || val.label != null) return { type: 'Detection', item_type: 'String' }
        if (val.points) return { type: 'ROI', item_type: 'String' }
        return { type: 'String', item_type: 'String' }
      }
      return { type: 'String', item_type: 'String' }
    },
    parseTestOutputToParams() {
      if (!this.codeTestOutput) {
        this.$message.warning('暂无输出结果')
        return
      }
      let result
      try {
        result = JSON.parse(this.codeTestOutput)
        if (typeof result !== 'object' || result === null || Array.isArray(result)) {
          throw new Error('invalid')
        }
      } catch (e) {
        this.$message.error('输出结果不是有效的 JSON 对象，请先执行模拟测试')
        return
      }
      const keys = Object.keys(result)
      if (!keys.length) {
        this.$message.warning('输出结果为空')
        return
      }
      const invalid = keys.filter(k => !this.paramNameValid(k))
      if (invalid.length) {
        this.$message.error(`参数名不合法：${invalid.join('、')}（须以字母开头，仅含字母数字下划线）`)
        return
      }
      this.$set(this.form, 'output_parameters', keys.map(name => {
        const { type, item_type } = this.inferParamTypeFromValue(result[name])
        return { name, type, item_type, _typeOpen: false, _arrayHover: false }
      }))
      this.applyConfig()
      this.$message.success(`已解析 ${keys.length} 个输出参数`)
    },
    copyCodeTestOutput() {
      if (!this.codeTestOutput) return
      const ta = document.createElement('textarea')
      ta.value = this.codeTestOutput
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        this.$message.success('已复制')
      } catch (e) {
        this.$message.error('复制失败')
      }
      document.body.removeChild(ta)
    },
    addCustomInputParam() {
      if (!this.form.input_params) this.$set(this.form, 'input_params', [])
      this.form.input_params.push({
        name: '', type: 'String', item_type: 'String',
        _typeOpen: false, _arrayHover: false, _bindOpen: false
      })
      this.applyConfig()
    },
    removeCustomInputParam(ii) {
      const ip = this.form.input_params[ii]
      if (ip && ip.name) this.clearCustomInput(ip)
      this.form.input_params.splice(ii, 1)
      if (!this.form.input_params.length) {
        this.form.input_params.push({
          name: 'input', type: 'String', item_type: 'String',
          _typeOpen: false, _arrayHover: false, _bindOpen: false
        })
      }
      this.codeTestInput = this.buildCustomTestInput(this.form.input_params)
      this.applyConfig()
    },
    addCustomOutputParam() {
      if (!this.form.output_parameters) this.$set(this.form, 'output_parameters', [])
      this.form.output_parameters.push({
        name: '', type: 'String', item_type: 'String',
        _typeOpen: false, _arrayHover: false
      })
      this.applyConfig()
    },
    removeCustomOutputParam(oi) {
      this.form.output_parameters.splice(oi, 1)
      if (!this.form.output_parameters.length) {
        this.form.output_parameters.push({
          name: 'output', type: 'String', item_type: 'String',
          _typeOpen: false, _arrayHover: false
        })
      }
      this.applyConfig()
    },
    selectCustomInputType(ip, v) {
      if (ip.name) this.clearCustomInput(ip)
      this.selectType(ip, v)
    },
    selectCustomInputArrayType(ip, v) {
      if (ip.name) this.clearCustomInput(ip)
      this.selectArrayType(ip, v)
    },
    selectCustomOutputType(op, v) {
      this.selectType(op, v)
    },
    selectCustomOutputArrayType(op, v) {
      this.selectArrayType(op, v)
    },
    customInputBindingValue(portName) {
      if (!this.selectedNode || !portName) return ''
      const bound = this.collectInputBindings(this.selectedNode.id)
      return bound[portName] || ''
    },
    customInputTreeData(ip) {
      if (!this.selectedNode || !ip || !ip.name) return []
      return this.groupsToTree(this.typedSourceGroups(customPortType(ip.type), this.selectedNode.id))
    },
    customInputBindLabel(portName) {
      const val = this.customInputBindingValue(portName)
      if (!val) return ''
      const ip = (this.form.input_params || []).find(p => p.name === portName)
      const groups = this.selectedNode
        ? this.typedSourceGroups(customPortType((ip && ip.type) || 'String'), this.selectedNode.id)
        : []
      return this.refLabel(val, groups)
    },
    onCustomInputPick(ip, data) {
      if (!data || !data.leaf || !ip.name) return
      ip._bindOpen = false
      this.bindInput(ip.name, data.id)
    },
    clearCustomInput(ip) {
      if (!ip || !ip.name || !this.selectedNode) return
      ip._bindOpen = false
      const nid = this.selectedNode.id
      const g = this.lf.getGraphData()
      ;(g.edges || []).forEach(x => {
        if (x.targetNodeId !== nid) return
        const xtp = (x.properties && x.properties.targetPort) || this.parsePort(x.targetAnchorId, 'in')
        if (xtp !== ip.name) return
        this.lf.setProperties(x.id, { ...(x.properties || {}), paramBound: false })
      })
    },
    onGraphHtmlClick(e) {
      const pick = e.target.closest('[data-sib-pick]')
      if (pick) {
        e.stopPropagation()
        const nid = pick.getAttribute('data-node-id')
        if (nid) this.openBatchModelPicker(nid, e)
        return
      }
      const clearBtn = e.target.closest('[data-sib-clear]')
      if (clearBtn) {
        e.stopPropagation()
        const nid = clearBtn.getAttribute('data-node-id')
        if (nid) this.clearBatchModel(nid)
      }
    },
    openBatchModelPicker(nodeId, e) {
      this.batchPicker = {
        visible: true,
        nodeId,
        x: e.clientX,
        y: e.clientY + 8
      }
    },
    closeBatchPicker() {
      this.batchPicker = { visible: false, nodeId: '', x: 0, y: 0 }
    },
    selectBatchModel(mode) {
      const nodeId = this.batchPicker.nodeId
      this.closeBatchPicker()
      if (!nodeId || !this.lf) return
      const model = this.lf.getNodeModelById(nodeId)
      if (!model) return
      const props = { ...(model.properties || {}) }
      const cfg = { ...this.defaultConfig('small_image_batch'), ...(props.config || {}), model_mode: mode }
      if (mode === 'vlm_model') {
        cfg.model_name = this.vlmModelDefault || ''
        cfg.output_parameters = [{ name: 'output', type: 'String' }]
      } else {
        cfg.model_id = null
        cfg.target_classes = []
        cfg.class_thresholds = {}
        cfg.class_labels = {}
      }
      props.config = cfg
      this.lf.setProperties(nodeId, props)
      const data = model.getData ? model.getData() : { id: nodeId, properties: props }
      if (this.lf.selectElementById) this.lf.selectElementById(nodeId, false)
      this.onSelectNode(data)
    },
    clearBatchModel(nodeId) {
      if (!nodeId || !this.lf) return
      const model = this.lf.getNodeModelById(nodeId)
      if (!model) return
      const props = { ...(model.properties || {}) }
      const parentId = props.parent_id || (props.config && props.config.parent_id) || ''
      props.config = {
        ...this.defaultConfig('small_image_batch'),
        parent_id: parentId
      }
      props.outputPorts = ['output']
      props.portTypes = { small_images: 'Array', output: 'String' }
      this.lf.setProperties(nodeId, props)
      if (this.selectedNode && this.selectedNode.id === nodeId) {
        this.onSelectNode(model.getData ? model.getData() : { id: nodeId, properties: props })
      }
    },
    attachSmallImageBatch(parentData) {
      if (!this.lf || !parentData || !parentData.id) return
      const parentId = parentData.id
      let px = parentData.x
      let py = parentData.y
      try {
        const pm = this.lf.getNodeModelById(parentId)
        if (pm) { px = pm.x; py = pm.y }
      } catch (e) { /* ignore */ }
      const ports = PORT_MAP.small_image_batch || { inputs: ['small_images'], outputs: ['output'], types: { small_images: 'Array', output: 'String' } }
      const batchId = `sib_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const cfg = { ...this.defaultConfig('small_image_batch'), parent_id: parentId }
      this.lf.addNode({
        id: batchId,
        type: 'sg-node',
        x: px + 320,
        y: py,
        text: ports.name_zh || '小图批处理',
        properties: {
          nodeType: 'small_image_batch',
          name_zh: ports.name_zh || '小图批处理',
          category: ports.category || 'process',
          inputPorts: ports.inputs || ['small_images'],
          outputPorts: ports.outputs || ['output'],
          portTypes: ports.types || { small_images: 'Array', output: 'String' },
          dynamic: false,
          config: cfg,
          parent_id: parentId
        }
      })
      const parentProps = { ...(parentData.properties || {}) }
      parentProps.companion_id = batchId
      parentProps.config = { ...(parentProps.config || {}), companion_id: batchId }
      this.lf.setProperties(parentId, parentProps)
      this.lf.addEdge({
        type: this.edgeMode || 'bezier',
        sourceNodeId: parentId,
        targetNodeId: batchId,
        sourceAnchorId: `${parentId}__side_out__small_images`,
        targetAnchorId: `${batchId}__side_in__small_images`,
        properties: { sourcePort: 'small_images', targetPort: 'small_images' }
      })
      this.graphEdgeRev++
    },
    resolveNodeProps(nodeRef) {
      if (!nodeRef || !this.lf) return {}
      try {
        const model = this.lf.getNodeModelById(nodeRef.id)
        if (model && model.properties) return model.properties
      } catch (e) { /* ignore */ }
      return nodeRef.properties || {}
    },
    getMattingCompanionId(mattingId, props) {
      const fromProps = (props && (props.companion_id || (props.config && props.config.companion_id))) || ''
      if (fromProps) return fromProps
      return this.findBatchNodeByParent(mattingId)
    },
    findBatchNodeByParent(parentId) {
      if (!parentId || !this.lf) return ''
      try {
        const g = this.lf.getGraphData()
        const edge = (g.edges || []).find(e => {
          if (e.sourceNodeId !== parentId) return false
          const sp = (e.properties && e.properties.sourcePort) || this.parsePort(e.sourceAnchorId, 'out')
          return sp === 'small_images'
        })
        if (edge) return edge.targetNodeId
        const node = (g.nodes || []).find(n => {
          const p = n.properties || {}
          if (p.nodeType !== 'small_image_batch') return false
          const pid = p.parent_id || (p.config && p.config.parent_id) || ''
          return pid === parentId
        })
        return node ? node.id : ''
      } catch (e) {
        return ''
      }
    },
    deleteMattingCompanions(mattingId, props) {
      if (!this.lf || !mattingId) return
      const companionId = this.getMattingCompanionId(mattingId, props)
      if (!companionId || companionId === mattingId) return
      try {
        if (this._rawDeleteNode) {
          this._rawDeleteNode(companionId)
        } else {
          this.lf.deleteNode(companionId)
        }
      } catch (e) { /* ignore */ }
    },
    clearMattingCompanionRef(batchId, props) {
      if (!this.lf || !batchId) return
      const parentId = (props && (props.parent_id || (props.config && props.config.parent_id))) || ''
      if (!parentId) return
      try {
        const parent = this.lf.getNodeModelById(parentId)
        if (!parent || !parent.properties) return
        const pp = { ...parent.properties, companion_id: '' }
        pp.config = { ...(pp.config || {}), companion_id: '' }
        this.lf.setProperties(parentId, pp)
      } catch (e) { /* ignore */ }
    },
    onNodeDeleted(nodeId) {
      if (!nodeId || !this.selectedNode) return
      const selId = this.selectedNode.id
      if (selId === nodeId) {
        this.closeConfig()
        return
      }
      const selProps = this.resolveNodeProps(this.selectedNode)
      if (selProps.nodeType === 'target_matting' && this.getMattingCompanionId(selId, selProps) === nodeId) {
        this.closeConfig()
      }
    },
    onNodeDelete(data) {
      if (!data || !data.id) return
      this.onNodeDeleted(data.id)
    },
    onSibImagePick(data) {
      if (!data || !data.leaf) return
      this.form._sibImgPop = false
      this.bindInput('image', data.id)
    },
    clearSibImage() {
      if (!this.selectedNode) return
      this.form._sibImgPop = false
      const nid = this.selectedNode.id
      const g = this.lf.getGraphData()
      ;(g.edges || []).forEach(x => {
        if (x.targetNodeId !== nid) return
        const xtp = (x.properties && x.properties.targetPort) || this.parsePort(x.targetAnchorId, 'in')
        if (xtp !== 'image') return
        this.lf.deleteEdge(x.id)
      })
      this.graphEdgeRev++
    },
    onSibRoiPick(data) {
      if (!data || !data.leaf) return
      this.form._sibRoiPop = false
      this.bindInput('roi', data.id)
    },
    clearSibRoi() {
      if (!this.selectedNode) return
      this.form._sibRoiPop = false
      const nid = this.selectedNode.id
      const g = this.lf.getGraphData()
      ;(g.edges || []).forEach(x => {
        if (x.targetNodeId !== nid) return
        const xtp = (x.properties && x.properties.targetPort) || this.parsePort(x.targetAnchorId, 'in')
        if (xtp !== 'roi') return
        this.lf.deleteEdge(x.id)
      })
      this.graphEdgeRev++
    },
    goBack() {
      this.$router.push('/skillManage/skillGraphList')
    }
  }
}
</script>

<style scoped>
.sg-editor { display: flex; flex-direction: column; height: calc(100vh - 84px); background: #f1f3f7; text-align: left; }
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

.sg-body {
  display: flex; flex: 1; overflow: hidden;
  position: relative;
  --sg-config-w: 360px;
}

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
.sg-pal-dot-hit {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; flex: none; cursor: pointer; vertical-align: middle;
}
.sg-pal-dot {
  display: block; width: 10px; height: 10px; border-radius: 50%; background: #2f7bff;
  box-shadow: 0 0 0 4px rgba(47, 123, 255, .3);
}
.sg-batch-picker-mask {
  position: fixed; inset: 0; z-index: 1998; background: transparent;
}
.sg-batch-picker {
  position: fixed; z-index: 1999; width: 280px; background: #fff; border-radius: 10px;
  box-shadow: 0 8px 28px rgba(31, 35, 41, .16); border: 1px solid #edeff3; padding: 8px 0;
}
.sg-batch-picker-title { font-size: 12px; color: #9aa3b2; padding: 4px 14px 8px; }
.sg-batch-picker-item {
  display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; cursor: pointer;
  transition: background .15s;
}
.sg-batch-picker-item:hover { background: #f5f7fb; }
.sg-batch-picker-ic {
  flex: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center;
  justify-content: center; color: #fff; font-size: 16px;
}
.sg-batch-picker-ic.vlm { background: #7c5cff; }
.sg-batch-picker-ic.det { background: #2f7bff; }
.sg-batch-picker-name { font-size: 13px; font-weight: 600; color: #1f2329; }
.sg-batch-picker-desc { font-size: 12px; color: #9aa3b2; line-height: 1.5; margin-top: 2px; }
.sg-pal-desc { font-size: 12px; color: #9aa3b2; line-height: 1.5; margin-top: 3px;
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* 画布 */
.sg-canvas-wrap { position: relative; flex: 1; overflow: hidden; }
.sg-canvas { width: 100%; height: 100%; }

/* 自定义节点：代码编辑面板（覆盖左侧节点面板 + 画布，右侧留出配置抽屉） */
.sg-code-panel {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: calc(100% - var(--sg-config-w));
  background: #fff; border-right: 1px solid #edeff3;
  display: flex; flex-direction: column; overflow: hidden;
  z-index: 12;
  box-shadow: 4px 0 16px rgba(0, 0, 0, .06);
}
.sg-code-panel-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid #f1f2f5; flex: none;
}
.sg-code-panel-lang { font-size: 14px; font-weight: 600; color: #1f2329; }
.sg-code-panel-close { font-size: 18px; color: #8a94a6; cursor: pointer; padding: 4px; border-radius: 6px; }
.sg-code-panel-close:hover { color: #7c5cff; background: #f3f0ff; }
.sg-code-panel-body { flex: 1; min-height: 0; padding: 0; overflow: hidden; }
.sg-code-editor { height: 100%; }
.sg-code-editor >>> .CodeMirror {
  height: 100%;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
}
.sg-code-panel-foot {
  flex: none; display: flex; gap: 12px; padding: 12px 16px 16px;
  border-top: 1px solid #f1f2f5; background: #fafbfc; min-height: 180px;
}
.sg-code-test-col { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.sg-code-test-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #1f2329;
}
.sg-code-test-actions { display: flex; align-items: center; gap: 4px; }
.sg-code-test-actions >>> .el-button { padding: 0 4px; }
.sg-code-test-input {
  flex: 1; min-height: 120px; box-sizing: border-box; border: 1px solid #e3e6ee;
  border-radius: 8px; padding: 10px; resize: none; font-size: 12px; text-align: left;
  font-family: Consolas, Monaco, 'Courier New', monospace; background: #fff;
}
.sg-code-test-output {
  flex: 1; min-height: 120px; margin: 0; box-sizing: border-box;
  border: 1px solid #e3e6ee; border-radius: 8px; padding: 10px; text-align: left;
  font-size: 12px; font-family: Consolas, Monaco, 'Courier New', monospace;
  background: #f7f8fc; color: #4a5365; overflow: auto; white-space: pre-wrap;
}
.sg-code-preview {
  margin: 0; padding: 10px 12px; background: #212121; color: #eeffff; text-align: left;
  border-radius: 8px; font-size: 12px; line-height: 1.5; max-height: 180px; overflow: auto;
  font-family: Consolas, Monaco, 'Courier New', monospace; white-space: pre-wrap; word-break: break-word;
}
.sg-code-preview-more { color: #9aa3b2; }

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
  position: absolute; top: 0; right: 0; height: 100%; width: var(--sg-config-w, 360px);
  background: #fff; border-left: 1px solid #edeff3; overflow-y: auto; padding: 0 16px 16px;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.06);
  transform: translateX(106%); transition: transform .25s ease; z-index: 20;
}
.sg-config.is-open { transform: translateX(0); }
.sg-config.is-judge { --sg-config-w: 400px; }
.sg-config-head { display: flex; align-items: flex-start; gap: 10px; padding: 16px 0 12px; position: sticky; top: 0;
  background: #fff; border-bottom: 1px solid #f1f2f5; margin-bottom: 12px; z-index: 1; }
.sg-config-ic { flex: none; width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center;
  justify-content: center; color: #fff; font-size: 17px; }
.sg-config-hd-meta { flex: 1; min-width: 0; }
.sg-config-hd-title { font-size: 15px; font-weight: 600; color: #1f2329; display: flex; align-items: center; gap: 6px; }
.sg-config-ver { font-size: 10px; color: #9aa3b2; background: #f1f2f5; border-radius: 4px; padding: 0 4px; line-height: 15px; font-weight: 500; }
.sg-config-hd-desc { font-size: 12px; color: #9aa3b2; line-height: 1.5; margin-top: 3px; }
.sg-upstream-warn {
  display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
  padding: 10px 12px; background: #fff7e8; border-radius: 8px;
  font-size: 13px; color: #4a5365; line-height: 1.5;
}
.sg-upstream-warn-ic {
  display: flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 50%; background: #fa8c16; color: #fff;
  font-size: 13px; font-weight: 700; line-height: 1; flex: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
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
.sg-token-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 8px; }
.sg-token-tip { font-size: 12px; color: #9aa3b2; }
.sg-token { font-size: 12px; color: #7c5cff; background: #f3f0ff; border: 1px solid #e3dbff;
  border-radius: 6px; padding: 2px 8px; cursor: pointer; user-select: none; }
.sg-token:hover { background: #e9e2ff; }
.sg-out-foot { display: flex; justify-content: flex-end; margin-top: 6px; }
.sg-out-clear { color: #9aa3b2; padding: 0; }
.sg-out-clear:hover { color: #7c5cff; }
.sg-param-item { margin-bottom: 8px; }
.sg-param-item .sg-param-row { margin-bottom: 0; }
.sg-param-err { color: #f5566c; font-size: 12px; line-height: 1.4; margin-top: 4px; }
.sg-param-row .c-name.is-invalid >>> .el-input__inner { border-color: #f5566c; }
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
.sg-type-box.has-prefix { padding-left: 6px; }
.sg-type-prefix {
  flex: none; font-size: 10px; color: #606266; background: #f2f3f5;
  border-radius: 3px; padding: 0 4px; line-height: 16px; font-family: monospace;
}
.sg-field-help { color: #c0c4cc; font-size: 13px; margin-left: 2px; cursor: help; vertical-align: middle; }
.sg-vlm-input-item { margin-bottom: 10px; }
.sg-vlm-param-row { margin-bottom: 0; }
.sg-vlm-bind {
  display: flex; align-items: center; gap: 8px; margin-top: 6px;
  padding: 0 10px; height: 32px; box-sizing: border-box;
  background: #f7f8fc; border: 1px solid #eef0f5; border-radius: 6px; cursor: pointer;
}
.sg-vlm-bind:hover { border-color: #dcdfe6; }
.sg-vlm-bind.is-empty .sg-vlm-bind-txt { color: #c0c4cc; }
.sg-vlm-bind-txt { flex: 1; min-width: 0; font-size: 13px; color: #1f2329;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sg-vlm-bind-link { color: #7c5cff; font-size: 14px; flex: none; }
.sg-vlm-bind-clear { color: #c0c4cc; font-size: 14px; flex: none; }
.sg-vlm-bind-clear:hover { color: #909399; }
.sg-vlm-type-ic { color: #2f7bff; font-size: 14px; }
.sg-vlm-type-opt { display: inline-flex; align-items: center; gap: 6px; }
.sg-param-del { cursor: pointer; color: #b4bbc7; font-size: 16px; }
.sg-param-del:hover { color: #f5566c; }
.sg-param-row >>> .el-checkbox__label { display: none; }
.sg-cond-row { display: flex; gap: 4px; margin-bottom: 6px; align-items: center; }
.sg-cond-group { border: 1px solid #ebeef5; border-radius: 8px; padding: 8px; margin-bottom: 8px; background: #f8f9fc; }
.sg-cond-group-head { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; font-size: 12px; color: #606266; }
.sg-cond-group-head > span { flex: 1; font-weight: bold; }
.sg-judge-cond-head { display: flex; align-items: center; justify-content: space-between; margin: 8px 0 10px; }
.sg-judge-cond-title { font-size: 13px; font-weight: 600; color: #1f2329; }
.sg-judge-groups-outer { display: flex; align-items: stretch; gap: 0; }
.sg-judge-global-rel-wrap {
  flex: none; width: 72px; position: relative; padding-right: 10px; margin-right: 6px;
  display: flex; align-items: center; justify-content: center;
}
.sg-judge-global-rel-wrap::after {
  content: ''; position: absolute; right: 0; top: 12px; bottom: 12px; width: 2px;
  background: #dcdfe6; border-radius: 1px;
}
.sg-judge-global-rel { width: 100%; }
.sg-judge-global-rel >>> .el-input__inner { padding-left: 6px; padding-right: 22px; font-size: 12px; text-align: center; }
.sg-judge-groups-list { flex: 1; min-width: 0; }
.sg-judge-group-del { cursor: pointer; color: #b4bbc7; font-size: 16px; }
.sg-judge-group-del:hover { color: #f5566c; }
.sg-judge-group-body { display: flex; align-items: stretch; gap: 0; }
.sg-judge-relation-wrap {
  flex: none; width: 108px; position: relative; padding-right: 10px; margin-right: 6px;
  display: flex; align-items: flex-start; padding-top: 4px;
}
.sg-judge-relation-wrap::after {
  content: ''; position: absolute; right: 0; top: 12px; bottom: 12px; width: 2px;
  background: #dcdfe6; border-radius: 1px;
}
.sg-judge-relation { width: 100%; }
.sg-judge-relation >>> .el-input__inner { padding-left: 8px; padding-right: 24px; font-size: 12px; }
.sg-judge-conds-wrap { flex: 1; min-width: 0; }
.sg-judge-cond-item { margin-bottom: 10px; }
.sg-judge-cond-row { display: flex; flex-direction: column; gap: 6px; }
.sg-judge-param-wrap { width: 100%; min-width: 0; }
.sg-judge-param-ref { margin-top: 0; height: 32px; box-sizing: border-box; }
.sg-judge-param-ref.is-invalid { border-color: #f5566c; }
.sg-judge-param-arrow { color: #c0c4cc; font-size: 12px; flex: none; }
.sg-judge-cond-fields {
  display: grid; grid-template-columns: minmax(72px, 1fr) minmax(72px, 1fr) 28px;
  gap: 6px; align-items: center;
}
.sg-judge-cond-fields >>> .el-input__inner { font-size: 12px; }
.sg-judge-cond-del { padding: 5px; flex: none; }
.sg-judge-cond-err { color: #f5566c; font-size: 12px; line-height: 1.4; margin-top: 2px; padding-left: 2px; }
.sg-judge-global-err { color: #f5566c; font-size: 12px; margin: 8px 0; }
.sg-judge-add-cond { padding-left: 0; font-size: 12px; margin-bottom: 4px; }
.sg-judge-same-target {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 12px; padding-top: 12px; border-top: 1px solid #eef0f5;
}
.sg-judge-same-target-lbl { font-size: 12px; color: #606266; display: inline-flex; align-items: center; gap: 2px; }
.is-invalid-select >>> .el-input__inner { border-color: #f5566c; }
.is-invalid-input >>> .el-input__inner { border-color: #f5566c; }
.sg-tip { font-size: 12px; color: #9aa3b2; margin-top: 8px; line-height: 1.5; }
/* 视觉模型抽屉：分区标题与输入/输出列表 */
.sg-sec-title { font-size: 13px; font-weight: 600; color: #1f2329; margin: 16px 0 10px; }
.sg-io-list { display: flex; flex-direction: column; gap: 8px; }
.sg-io-item { display: flex; align-items: center; gap: 8px; height: 34px; padding: 0 10px;
  background: #f7f8fc; border: 1px solid #eef0f5; border-radius: 8px; font-size: 13px; color: #4a5365; }
.sg-io-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c, #909399); flex: none; }
.sg-io-tag { margin-left: auto; font-size: 11px; color: #7c5cff; background: #f3f0ff; border-radius: 4px; padding: 1px 6px; }
.sg-io-type-ic { margin-left: auto; color: #2f7bff; font-size: 14px; }
.sg-vs-num-row { display: flex; align-items: center; gap: 8px; width: 100%; }
.sg-vs-link { color: #7c5cff; font-size: 16px; cursor: pointer; flex: none; padding: 4px; }
.sg-vs-link:hover { color: #5a3fd6; }
.sg-io-empty { font-size: 13px; color: #b4bbc7; text-align: center; padding: 18px 0; background: #f7f8fc;
  border: 1px dashed #e3e6ee; border-radius: 8px; }
.sg-opt { display: inline-flex; align-items: center; gap: 6px; }
.sg-opt-ic { color: #7c5cff; font-size: 14px; }
.sg-ref-box { display: flex; align-items: center; width: 100%; box-sizing: border-box; height: 32px;
  padding: 0 10px; cursor: pointer; border: 1px solid #dcdfe6; border-radius: 4px; background: #fff; transition: border-color .15s; }
.sg-ref-box:hover { border-color: #c0c4cc; }
.sg-ref-box.is-disabled { cursor: not-allowed; background: #f5f7fa; border-color: #e4e7ed; }
.sg-ref-box.is-disabled .sg-ref-txt { color: #c0c4cc; }
.sg-ref-box.is-empty .sg-ref-txt { color: #c0c4cc; }
.sg-ref-pre-ic { color: #2f7bff; font-size: 14px; margin-right: 6px; flex: none; }
.sg-ref-pre-tag {
  flex: none; font-size: 10px; color: #7c5cff; background: #f3f0ff; border-radius: 3px;
  padding: 0 4px; line-height: 16px; margin-right: 6px;
}
.sg-matting-out-tree { display: flex; flex-direction: column; gap: 6px; }
.sg-matting-out-lv1 { padding-left: 14px; display: flex; flex-direction: column; gap: 6px; }
.sg-matting-out-lv2 { padding-left: 14px; display: flex; flex-direction: column; gap: 6px; }
.sg-ref-txt { flex: 1; font-size: 13px; color: #1f2329; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sg-ref-arrow { color: #c0c4cc; font-size: 14px; }
.sg-ref-clear { color: #c0c4cc; font-size: 14px; }
.sg-ref-clear:hover { color: #909399; }
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
/* 视觉模型输入参数树（popover 渲染到 body，需非 scoped） */
.sg-param-pop.el-popover { padding: 6px 0 !important; max-height: 320px; overflow-y: auto; }
.sg-param-pop .sg-tree-node { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
.sg-param-pop .sg-tree-nodeic { color: #7c5cff; font-size: 14px; }
.sg-param-pop .sg-opt-ic { color: #2f7bff; font-size: 14px; }
.sg-param-pop .sg-tree-empty { padding: 16px; text-align: center; color: #b4bbc7; font-size: 13px; }

/* 参数类型二级菜单（popover 渲染到 body，需非 scoped） */
.sg-typemenu-popper.el-popover { padding: 6px 0 !important; overflow: visible !important; min-width: 150px; }
.sg-typemenu { position: relative; font-size: 13px; color: #1f2329; }
.sg-typemenu-list { max-height: 280px; overflow-y: auto; }
.sg-typemenu-item {
  position: relative; display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px; cursor: pointer; white-space: nowrap;
}
.sg-typemenu-item:hover, .sg-typemenu-item.is-active { background: #f5f7fa; }
.sg-typemenu-item.is-selected { color: #409eff; }
.sg-typemenu-item.is-selected:hover { background: #f5f7fa; }
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
.sgx-cat-judge { --accent: #fa8c16; }
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

.sgx-judge-plain { margin-top: 8px; min-width: 0; }
.sgx-judge-bracket {
  display: flex; align-items: stretch; gap: 0; margin-top: 8px; min-width: 0;
}
.sgx-judge-bracket-side {
  flex: none; width: 26px; position: relative; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.sgx-judge-bracket-line {
  position: absolute; left: 13px; top: 14px; bottom: 14px; width: 2px;
  background: #c8cdd8; border-radius: 1px;
}
.sgx-judge-bracket-cap {
  position: absolute; left: 13px; width: 10px; height: 2px; background: #c8cdd8; border-radius: 1px;
}
.sgx-judge-bracket-cap.top { top: 14px; }
.sgx-judge-bracket-cap.bottom { bottom: 14px; }
.sgx-judge-bracket-op {
  position: relative; z-index: 1; font-size: 12px; font-weight: 600; color: #8a94a6;
  background: #fff; padding: 2px 0; line-height: 1.2;
}
.sgx-judge-bracket-items {
  flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; padding: 2px 0;
}
.sgx-judge-bracket-item { position: relative; min-width: 0; }
.sgx-judge-bracket-items > .sgx-judge-bracket-item::before {
  content: ''; position: absolute; left: -8px; top: 50%; width: 8px; height: 2px;
  background: #c8cdd8; transform: translateY(-50%);
}
.sgx-judge-plain > .sgx-judge-bracket-item::before { display: none; }
.sgx-judge-group-item { padding: 2px 0; }
.sgx-judge-cond-row { display: flex; gap: 4px; align-items: center; }
.sgx-judge-pill {
  flex: 1; min-width: 0; display: inline-flex; align-items: center; justify-content: center; gap: 3px;
  height: 24px; padding: 0 6px; border: 1px solid #eaedf3; border-radius: 6px;
  background: #f5f7fb; font-size: 11px; color: #4a5365; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap;
}
.sgx-judge-pill.is-warn { border-color: #ffe1b3; background: #fff7e8; color: #d48806; }
.sgx-judge-pill.is-warn i { font-size: 11px; flex: none; }
.sgx-judge-out-footer {
  display: flex; justify-content: space-between; margin-top: 10px; padding-top: 8px;
  border-top: 1px dashed #eef0f5;
}
.sgx-judge-out-lbl { font-size: 11px; font-weight: 600; letter-spacing: .5px; }
.sgx-judge-out-lbl.true { color: #16b777; }
.sgx-judge-out-lbl.false { color: #f5566c; }

.sgx-sib-card {
  background: #f0f6ff !important;
  border: 2px dashed #5b9dff !important;
  box-shadow: none !important;
}
.sgx-sib-card::before { display: none; }
.sgx-sib-wrap { position: relative; margin-top: 8px; }
.sgx-sib-pick {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; min-height: 72px; background: #fff; border-radius: 10px; border: 1px solid #e7eaf0;
  color: #2f7bff; font-size: 12px; cursor: pointer; user-select: none;
}
.sgx-sib-pick i { font-size: 22px; font-weight: 600; }
.sgx-sib-pick:hover { background: #f8fbff; border-color: #b8d4ff; }
.sgx-sib-inner {
  background: #fff; border-radius: 10px; border: 1px solid #e7eaf0; padding: 10px;
}
.sgx-sib-inner-hd {
  display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 13px;
  font-weight: 600; color: #7c5cff;
}
.sgx-sib-inner-hd i { font-size: 14px; }
.sgx-sib-inner-hd .sgx-ver { margin-left: auto; }
.sgx-sib-det .sgx-sib-inner-hd { color: #7c5cff; }
.sgx-sib-inner-row {
  display: flex; align-items: flex-start; gap: 8px; margin-top: 6px; font-size: 12px;
}
.sgx-sib-inner-row > span:first-child { flex: none; color: #8a94a6; line-height: 22px; min-width: 28px; }
.sgx-sib-clear {
  position: absolute; top: -14px; right: -6px; width: 26px; height: 26px; border: 1px solid #edeff3;
  border-radius: 8px; background: #fff; color: #8a94a6; cursor: pointer; display: flex;
  align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,.08);
}
.sgx-sib-clear:hover { color: #2f7bff; border-color: #b8d4ff; }

/* 目标抠图推理蓝点：功能介绍弹窗 */
.sg-matting-intro-pop.el-popover {
  padding: 0 !important; border: none !important; z-index: 3000 !important;
  background: #2f7bff !important; box-shadow: 0 8px 24px rgba(47, 123, 255, .35) !important;
}
.sg-matting-intro-pop .popper__arrow::after { border-right-color: #2f7bff !important; }
.sg-matting-intro-pop[x-placement^="right"] .popper__arrow::after { border-right-color: #2f7bff !important; }
.sg-matting-intro {
  padding: 14px 14px 12px; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
}
.sg-matting-intro-title { font-size: 15px; font-weight: 700; line-height: 1.4; }
.sg-matting-intro-desc { margin-top: 6px; font-size: 12px; line-height: 1.55; opacity: .92; }
.sg-matting-intro-demo { margin-top: 10px; border-radius: 8px; overflow: hidden; background: #1a1a1a; }
.sg-matting-demo-scene {
  position: relative; height: 120px; overflow: hidden;
}
.sg-matting-demo-bg-left {
  position: absolute; inset: 0; right: 50%;
  background: linear-gradient(180deg, #9aabb8 0%, #c5cdd6 36%, #7d9178 36%, #667a62 100%);
}
.sg-matting-demo-bg-right {
  position: absolute; inset: 0; left: 50%;
  background: repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 10px 10px;
  opacity: .85;
}
.sg-matting-demo-road {
  position: absolute; left: 0; right: 50%; bottom: 0; height: 30px; background: #4a4f55;
}
.sg-matting-demo-focus {
  position: absolute; left: 50%; bottom: 26px; transform: translateX(-50%); z-index: 2;
}
.sg-matting-demo-poly {
  position: relative; width: 88px; height: 54px; pointer-events: none;
}
.sg-matting-demo-poly svg {
  position: absolute; inset: 0; width: 100%; height: 100%;
}
.sg-matting-demo-tag {
  position: absolute; top: -16px; left: 12px; z-index: 1;
  padding: 1px 6px; font-size: 10px; line-height: 1.35;
  background: #52c41a; color: #fff; border-radius: 3px; white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0,0,0,.18);
}
.sg-matting-demo-car {
  position: absolute; left: 50%; bottom: 7px; transform: translateX(-50%);
  width: 58px; height: 36px; background: #2a3038; border-radius: 6px 6px 3px 3px;
}
.sg-matting-demo-car::before {
  content: ''; position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
  width: 28px; height: 13px; background: rgba(170, 185, 200, .5); border-radius: 2px 2px 0 0;
  box-shadow: -14px 0 0 -2px rgba(170,185,200,.35), 14px 0 0 -2px rgba(170,185,200,.35);
}
.sg-matting-demo-car::after {
  content: ''; position: absolute; bottom: -2px; left: 11px; width: 11px; height: 11px;
  border-radius: 50%; background: #111; box-shadow: 26px 0 0 #111;
}
.sg-matting-intro-foot { display: flex; justify-content: flex-end; margin-top: 10px; }
.sg-matting-intro-btn {
  border: none; border-radius: 6px; padding: 5px 14px; font-size: 12px; font-weight: 600;
  color: #2f7bff; background: #fff; cursor: pointer; transition: opacity .15s;
}
.sg-matting-intro-btn:hover { opacity: .88; }
</style>

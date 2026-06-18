<template>
  <el-drawer
    :visible.sync="innerVisible"
    size="880px"
    :wrapper-closable="false"
    :show-close="true"
    custom-class="run-plan-drawer"
    @closed="onClosed">
    <div slot="title" class="drawer-title">
      <span class="drawer-title__text">{{ drawerTitle }}</span>
      <el-tag v-if="isView" size="mini" type="info" effect="plain">只读</el-tag>
    </div>

    <div class="drawer-body">
      <!-- 步骤条 -->
      <div class="step-bar">
        <div
          v-for="(s, i) in stepLabels"
          :key="i"
          class="step-item"
          :class="{ active: step === i, done: step > i }"
          @click="!isView && goStep(i)">
          <span class="step-num">{{ step > i ? '✓' : i + 1 }}</span>
          <span class="step-label">{{ s }}</span>
        </div>
      </div>

      <!-- 步骤1：基本信息 -->
      <div v-show="step === 0" class="step-pane">
        <div class="form-section">
          <div class="section-head"><i class="el-icon-info"></i> 基本信息</div>
          <el-form label-width="100px" size="small" :disabled="isView">
            <el-form-item label="AI技能" required>
              <el-select
                v-model="form.skill_ref"
                filterable
                placeholder="请选择 AI 技能"
                :disabled="isView"
                style="width: 100%; max-width: 480px;"
                @change="onSkillChange">
                <el-option
                  v-for="s in skillOptions"
                  :key="s.ref"
                  :label="s.label"
                  :value="s.ref">
                  <div class="skill-option">
                    <span class="skill-option__name">{{ s.label }}</span>
                    <el-tag :type="kindTagType(s.kind)" size="mini" effect="plain">{{ s.kindLabel }}</el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="计划启停" required>
              <el-switch v-model="form.enabled" active-text="开启" inactive-text="关闭"></el-switch>
            </el-form-item>

            <el-form-item label="运行周期" required>
              <div class="hint">按所选星期与时段周期性执行，每个点位派生一条运行任务</div>
              <div class="cycle-box">
                <div class="cycle-row">
                  <span class="cycle-label">运行频率<span class="req">*</span></span>
                  <div class="weekday-group">
                    <span
                      v-for="d in weekDays"
                      :key="d.value"
                      class="weekday"
                      :class="{ active: form.run_cycle.weekdays.includes(d.value), disabled: isView }"
                      @click="!isView && toggleWeekday(d.value)">{{ d.label }}</span>
                  </div>
                </div>
                <div class="cycle-row" v-for="(p, i) in form.run_cycle.periods" :key="i">
                  <span class="cycle-label">{{ i === 0 ? '运行时段' : '' }}<span class="req" v-if="i === 0">*</span></span>
                  <el-time-picker v-model="p.start" value-format="HH:mm" format="HH:mm" placeholder="开始" size="small" style="width: 120px;"></el-time-picker>
                  <span class="dash">至</span>
                  <el-time-picker v-model="p.end" value-format="HH:mm" format="HH:mm" placeholder="结束" size="small" style="width: 120px;"></el-time-picker>
                  <i v-if="i > 0 && !isView" class="el-icon-delete del-period" @click="removePeriod(i)"></i>
                </div>
                <a class="add-period" v-if="form.run_cycle.periods.length < 5 && !isView" @click="addPeriod">
                  <i class="el-icon-plus"></i> 添加时段 ({{ form.run_cycle.periods.length }}/5)
                </a>
              </div>
            </el-form-item>
          </el-form>
        </div>

        <div class="form-section">
          <div class="section-head"><i class="el-icon-location-outline"></i> 点位选择</div>
          <div class="point-tip">
            <i class="el-icon-info"></i>
            每个点位与技能组合将生成一条独立的运行计划
          </div>
          <div class="point-selector">
            <div class="ps-tree">
              <channel-tree-panel @channel-click="onChannelTreeClick"></channel-tree-panel>
              <div v-if="!isView" class="ps-tree-tip">点击通道节点即可加入已选列表</div>
            </div>
            <div class="ps-selected">
              <div class="ps-head">
                已选点位 ({{ form.cameras.length }})
                <a v-if="!isView && form.cameras.length" class="clear-link" @click="clearSelected">清空</a>
              </div>
              <div class="ps-list">
                <div v-for="c in form.cameras" :key="c.camera_id" class="ps-item selected-item">
                  <div class="selected-item__main">
                    <span class="selected-item__name">
                      <i class="el-icon-video-camera"></i> {{ c.camera_name }}
                    </span>
                    <span class="selected-item__status">
                      <span class="status-dot" :class="c.online ? 'is-online' : 'is-offline'"></span>
                      {{ c.online ? '在线' : '离线' }}
                    </span>
                  </div>
                  <i v-if="!isView" class="el-icon-close" @click="removeSelected(c)"></i>
                </div>
                <div v-if="!form.cameras.length" class="empty-tip-sm">请从左侧通道列表选择点位</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤2：运行参数 -->
      <div v-show="step === 1" class="step-pane">
        <div class="form-section">
          <div class="section-head"><i class="el-icon-video-camera"></i> 视频抽帧配置</div>
          <el-form label-width="100px" size="small" :disabled="isView">
            <el-form-item label="抽取规则">
              <div class="frame-box">
                <span class="frame-text">每</span>
                <el-input-number v-model="form.frame_extraction.interval_seconds" :min="1" :max="60" size="small" controls-position="right" style="width:100px;"></el-input-number>
                <span class="frame-text">秒，抽取</span>
                <el-input-number v-model="form.frame_extraction.frames" :min="1" :max="30" size="small" controls-position="right" style="width:100px;"></el-input-number>
                <span class="frame-text">帧</span>
              </div>
              <div class="hint">固定频率抽帧，支持 1 秒多帧或多秒 1 帧</div>
            </el-form-item>
            <el-form-item v-if="form.skill_kind !== 'llm'" label="实时推流">
              <div class="rtsp-streaming-row">
                <span class="rtsp-streaming-row__label">检测结果实时推流：</span>
                <el-switch
                  v-model="rtspStreamingEnabled"
                  active-color="#67C23A"
                  inactive-color="#909399">
                </el-switch>
                <span class="rtsp-streaming-row__status" :class="{ 'is-on': rtspStreamingEnabled }">
                  {{ rtspStreamingEnabled ? '已启用' : '已禁用' }}
                </span>
                <el-tooltip content="开启后将实时推流检测结果画面，会消耗较多系统资源，不推荐使用" placement="top">
                  <i class="el-icon-question rtsp-streaming-row__help"></i>
                </el-tooltip>
              </div>
              <el-alert
                v-if="rtspStreamingEnabled"
                class="rtsp-streaming-alert"
                title="注意：开启实时推流会显著增加系统资源消耗，建议仅在必要时使用"
                type="warning"
                :closable="false"
                show-icon>
              </el-alert>
            </el-form-item>
          </el-form>
        </div>

        <div class="form-section" v-if="form.skill_kind !== 'llm'">
          <div class="section-head"><i class="el-icon-setting"></i> 技能参数</div>
          <div v-if="skillParamsLoading" class="skill-params-hint">
            <i class="el-icon-loading"></i> 正在加载技能参数…
          </div>
          <div v-else-if="!skillParamFields.length" class="skill-params-hint">该技能暂无可配置参数</div>
          <el-form v-else label-width="240px" size="small" :disabled="isView" class="skill-params-form">
            <el-form-item v-for="p in skillParamFields" :key="p.key" :label="p.key" class="skill-param-row">
              <template v-if="p.type === 'number'">
                <el-input-number
                  v-model="form.skill_params[p.key]"
                  :step="getNumberStep(p.default)"
                  :precision="getNumberPrecision(p.default)"
                  controls-position="right"
                  class="skill-param-number">
                </el-input-number>
              </template>
              <template v-else-if="p.type === 'boolean'">
                <el-switch v-model="form.skill_params[p.key]"></el-switch>
              </template>
              <template v-else-if="p.type === 'array'">
                <div class="param-readonly-tags">
                  <el-tag v-for="(item, idx) in form.skill_params[p.key]" :key="idx" size="mini" type="info">{{ item }}</el-tag>
                </div>
              </template>
              <template v-else-if="p.type === 'object'">
                <pre class="param-readonly-json">{{ formatParamValue(form.skill_params[p.key]) }}</pre>
              </template>
              <template v-else>
                <el-input v-model="form.skill_params[p.key]" class="skill-param-input"></el-input>
              </template>
            </el-form-item>
          </el-form>
        </div>

        <div class="form-section" v-if="skillNeedsFence || skillNeedsTripwire">
          <div class="section-head"><i class="el-icon-crop"></i> 区域绘制</div>
          <div class="region-draw">
            <div class="region-list">
              <div
                v-for="c in form.cameras"
                :key="c.camera_id"
                class="region-cam"
                :class="{ active: currentFenceCam && currentFenceCam.camera_id === c.camera_id }"
                @click="currentFenceCam = c">
                <i class="el-icon-video-camera"></i>
                <span class="region-cam__name">{{ c.camera_name }}</span>
                <span class="region-cam__badge" :class="fenceDrawn(c) ? 'drawn' : ''">
                  {{ fenceDrawn(c) ? '已绘制' : '未绘制' }}
                </span>
              </div>
              <div v-if="!form.cameras.length" class="empty-tip-sm">请先选择点位</div>
            </div>
            <div class="region-canvas" v-if="currentFenceCam">
              <div class="region-toolbar">
                <span class="region-status__label">检测区域</span>
                <el-button v-if="!isView" type="primary" size="mini" plain icon="el-icon-edit-outline" @click="openFence(currentFenceCam)">
                  {{ fenceDrawn(currentFenceCam) ? '重新绘制' : '开始绘制' }}
                </el-button>
              </div>
              <div class="region-preview">
                <fence-preview
                  :key="currentFenceCam.camera_id"
                  :src="snapshotUrl(currentFenceCam.camera_id)"
                  :fence="currentFenceCam.fence">
                </fence-preview>
                <div class="region-preview__ph">
                  <i class="el-icon-picture-outline"></i>
                  <span>点位画面预览</span>
                </div>
              </div>
            </div>
            <div class="region-canvas region-canvas--empty" v-else>
              <div class="empty-tip-sm"><i class="el-icon-video-camera"></i><br>请选择左侧点位</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤3：预警规则 -->
      <div v-show="step === 2" class="step-pane">
        <div class="form-section">
          <div class="section-head"><i class="el-icon-bell"></i> 预警信息</div>
          <el-form label-width="100px" size="small" :disabled="isView">
            <el-form-item label="预警名称" required>
              <el-input
                v-model="form.alert_name"
                maxlength="30"
                show-word-limit
                placeholder="默认使用技能名称"
                style="width: 100%; max-width: 420px;"
                @input="onAlertNameInput">
              </el-input>
              <div class="hint">默认使用技能名称，可自定义修改</div>
            </el-form-item>
            <el-form-item label="预警等级" required>
              <el-select
                v-model="form.alert_level"
                placeholder="请选择预警等级"
                class="alert-level-select"
                popper-class="alert-level-select-dropdown">
                <el-option
                  v-for="lv in alertLevels"
                  :key="lv.value"
                  :label="lv.label"
                  :value="lv.value">
                  <span class="alert-level-option">
                    <span class="alert-level-option__left">
                      <i class="level-dot" :class="'level-dot--' + lv.value"></i>
                      {{ lv.label }}
                    </span>
                    <el-tag :type="lv.tagType" size="mini" effect="plain">{{ lv.short }}</el-tag>
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="是否预警合并">
              <div class="merge-switch-row">
                <el-switch
                  v-model="form.alert_config.merge_enabled"
                  active-text="开启"
                  inactive-text="关闭">
                </el-switch>
                <el-popover
                  placement="bottom-start"
                  width="440"
                  trigger="click"
                  popper-class="merge-effect-popover">
                  <div class="merge-effect-popover__body">
                    <div class="merge-effect-popover__title">合并效果说明</div>
                    <img
                      src="/static/img/alert-merge-guide/merge-effect.png"
                      alt="合并效果说明"
                      class="merge-effect-img" />
                  </div>
                  <a slot="reference" class="merge-effect-link" @click.prevent>
                    <i class="el-icon-message-solid"></i> 合并效果说明
                  </a>
                </el-popover>
              </div>
            </el-form-item>
            <template v-if="form.alert_config.merge_enabled">
              <el-form-item>
                <span slot="label" class="merge-cycle-label">
                  合并周期
                  <el-tooltip content="高级设置" placement="top">
                    <button
                      type="button"
                      class="merge-gear-btn"
                      :class="{ 'is-active': mergeAdvancedOpen }"
                      :disabled="isView"
                      @click.prevent="toggleMergeAdvanced">
                      <i class="el-icon-setting"></i>
                    </button>
                  </el-tooltip>
                </span>
                <div class="merge-cycle-row">
                  <span class="frame-text">同类预警距首条发生不超过</span>
                  <el-input-number
                    v-model="form.alert_config.merge_window_seconds"
                    :min="1"
                    :max="600"
                    size="small"
                    controls-position="right"
                    style="width:110px;">
                  </el-input-number>
                  <span class="frame-text">秒，将合并为一条</span>
                </div>
                <div class="hint">系统默认 {{ defaultMergeWindowSeconds }} 秒，一般无需修改</div>
              </el-form-item>

              <template v-if="mergeAdvancedOpen">
                <el-form-item label="发送延迟基数">
                  <el-input-number
                    v-model="form.alert_config.merge_base_delay_seconds"
                    :min="0.5"
                    :max="60"
                    :step="0.5"
                    :precision="1"
                    size="small"
                    controls-position="right"
                    style="width:110px;">
                  </el-input-number>
                  <span class="frame-text">秒</span>
                  <div class="hint">默认 {{ defaultMergeBaseDelaySeconds }} 秒</div>
                </el-form-item>

                <el-form-item label="最大合并时长">
                  <el-input-number
                    v-model="form.alert_config.merge_max_duration_seconds"
                    :min="5"
                    :max="600"
                    size="small"
                    controls-position="right"
                    style="width:110px;">
                  </el-input-number>
                  <span class="frame-text">秒</span>
                  <div class="hint">默认 {{ defaultMergeMaxDurationSeconds }} 秒</div>
                </el-form-item>

                <el-form-item label="立即发送等级">
                  <el-select
                    v-model="form.alert_config.merge_immediate_levels"
                    multiple
                    collapse-tags
                    placeholder="默认全部参与合并"
                    style="width: 100%; max-width: 420px;">
                    <el-option
                      v-for="lv in alertLevels"
                      :key="lv.value"
                      :label="lv.label"
                      :value="lv.value">
                    </el-option>
                  </el-select>
                  <div class="hint">不选表示一至四级均参与合并；选中则该等级立即发送</div>
                </el-form-item>

                <el-form-item label="快速发送阈值">
                  <el-input-number
                    v-model="form.alert_config.merge_quick_send_threshold"
                    :min="2"
                    :max="100"
                    size="small"
                    controls-position="right"
                    style="width:110px;">
                  </el-input-number>
                  <span class="frame-text">条</span>
                  <div class="hint">默认 {{ defaultMergeQuickSendThreshold }} 条</div>
                </el-form-item>

                <el-form-item label="等级延迟系数">
                  <el-input-number
                    v-model="form.alert_config.merge_level_delay_factor"
                    :min="0"
                    :max="5"
                    :step="0.1"
                    :precision="1"
                    size="small"
                    controls-position="right"
                    style="width:110px;">
                  </el-input-number>
                  <span class="frame-text">秒/级</span>
                  <div class="hint">默认 {{ defaultMergeLevelDelayFactor }}</div>
                </el-form-item>
              </template>
            </template>
          </el-form>
        </div>

        <div v-if="form.skill_kind === 'llm'" class="form-section">
          <div class="info-box">
            <i class="el-icon-info"></i>
            多模态大模型技能仅生成预警截图，不生成预警视频；上方合并配置仍会生效。
          </div>
        </div>

        <div v-else class="form-section">
          <div class="section-head"><i class="el-icon-film"></i> 预警视频</div>

          <div class="info-box video-behavior-box">
            <i class="el-icon-info"></i>
            <div>
              <template v-if="!form.alert_config.merge_enabled">
                <strong>未开启合并：</strong>每条预警触发后<strong>立即</strong>生成视频，以该时刻为中心，前后各
                {{ videoBufferBefore }} / {{ videoBufferAfter }} 秒（默认
                {{ defaultVideoBeforeSeconds }} / {{ defaultVideoAfterSeconds }} 秒）。
              </template>
              <template v-else-if="form.alert_config.video_generate_time === 'after'">
                <strong>已开启合并 · 截取首条~末条：</strong>视频在<strong>合并组发送时</strong>一次性生成（非每条预警各生成），
                时间范围取首条至末条，前后各 {{ videoBufferBefore }} / {{ videoBufferAfter }} 秒；
                可设时长上限（超出时保留靠后片段）。
              </template>
              <template v-else>
                <strong>已开启合并 · 截取首条时刻：</strong>视频同样在<strong>合并组发送时</strong>一次性生成，
                但只取<strong>首条预警时刻</strong>为中心，前后各 {{ videoBufferBefore }} / {{ videoBufferAfter }} 秒
                （不含末条之后的画面）。
              </template>
            </div>
          </div>

          <el-form label-width="120px" size="small" :disabled="isView" class="video-advanced-form">
            <el-form-item v-if="form.alert_config.merge_enabled" label="视频截取范围">
              <el-radio-group v-model="form.alert_config.video_generate_time">
                <el-radio label="before">首条时刻</el-radio>
                <el-radio label="after">首条~末条</el-radio>
              </el-radio-group>
              <div class="hint">决定合并组发送时视频取哪段画面；两种模式都在发送时生成，不在每条预警时各生成</div>
            </el-form-item>

            <el-form-item
              v-if="form.alert_config.merge_enabled && form.alert_config.video_generate_time === 'after'"
              label="视频时长上限">
              <el-input-number
                v-model="form.alert_config.video_duration_limit_minutes"
                :min="1"
                :max="60"
                size="small"
                controls-position="right"
                style="width:110px;">
              </el-input-number>
              <span class="frame-text">分钟</span>
              <div class="hint">仅「首条~末条」模式且开启合并时后端会裁剪；默认 1 分钟</div>
            </el-form-item>

            <el-form-item label="视频缓冲范围">
              <div class="frame-box frame-box--inline">
                <span class="frame-text">预警前</span>
                <el-input-number
                  v-model="form.alert_config.video_before_seconds"
                  :min="0"
                  :max="300"
                  size="small"
                  controls-position="right"
                  style="width:100px;">
                </el-input-number>
                <span class="frame-text">秒 ~ 预警后</span>
                <el-input-number
                  v-model="form.alert_config.video_after_seconds"
                  :min="0"
                  :max="300"
                  size="small"
                  controls-position="right"
                  style="width:100px;">
                </el-input-number>
                <span class="frame-text">秒</span>
              </div>
              <div class="hint">
                在预警时间范围外额外保留的秒数；运行计划统一配置，默认
                {{ defaultVideoBeforeSeconds }} / {{ defaultVideoAfterSeconds }} 秒
              </div>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <div class="drawer-footer">
      <el-button @click="innerVisible = false">{{ isView ? '关闭' : '取消' }}</el-button>
      <template v-if="!isView">
        <el-button v-if="step > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="step < 2" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-else type="primary" :loading="submitting" @click="submit">确定</el-button>
      </template>
    </div>

    <fence-drawer
      :visible.sync="fenceVisible"
      :init-fence="fenceEditing"
      :camera-id="currentFenceCam ? currentFenceCam.camera_id : null"
      :allow-polygon="skillNeedsFence"
      :allow-tripwire="skillNeedsTripwire"
      @confirm="onFenceConfirm">
    </fence-drawer>
  </el-drawer>
</template>

<script>
import { runPlanAPI, skillAPI } from '@/components/service/VisionAIService.js';
import FenceDrawer from './FenceDrawer.vue';
import FencePreview from './FencePreview.vue';
import ChannelTreePanel from './ChannelTreePanel.vue';

function normalizeImmediateLevels(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(Number).filter(n => !isNaN(n));
  return String(val).split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
}

function defaultAlertConfig() {
  return {
    merge_enabled: true,
    merge_window_seconds: 10,
    merge_base_delay_seconds: 4,
    merge_max_duration_seconds: 30,
    merge_immediate_levels: [],
    merge_quick_send_threshold: 10,
    merge_level_delay_factor: 0.5,
    video_generate_time: 'after',
    video_duration_limit_minutes: 1,
    video_before_seconds: 2,
    video_after_seconds: 2
  };
}

function defaultForm() {
  return {
    analysis_resource: 'cloud',
    skill_ref: '',
    skill_kind: 'visual',
    skill_class_id: '',
    llm_skill_id: '',
    skill_name: '',
    enabled: true,
    run_cycle: {
      type: 'loop',
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      periods: [{ start: '00:00', end: '23:59' }]
    },
    frame_extraction: {
      interval_seconds: 1,
      frames: 1,
      rtsp_streaming: { enabled: false }
    },
    skill_params: {},
    alert_name: '',
    alert_level: '',
    alert_config: defaultAlertConfig(),
    cameras: []
  };
}

export default {
  name: 'RunPlanCreateDrawer',
  components: { FenceDrawer, FencePreview, ChannelTreePanel },
  props: {
    visible: { type: Boolean, default: false },
    editPlan: { type: Object, default: null },
    mode: { type: String, default: 'create' }
  },
  data() {
    return {
      innerVisible: this.visible,
      step: 0,
      stepLabels: ['基本信息', '运行参数', '预警规则'],
      submitting: false,
      form: defaultForm(),
      skillOptions: [],
      skillParamFields: [],
      skillParamsLoading: false,
      skillNeedsFence: true,
      skillNeedsTripwire: false,
      currentFenceCam: null,
      fenceVisible: false,
      fenceEditing: null,
      weekDays: [
        { label: '一', value: 1 }, { label: '二', value: 2 }, { label: '三', value: 3 },
        { label: '四', value: 4 }, { label: '五', value: 5 }, { label: '六', value: 6 },
        { label: '日', value: 7 }
      ],
      alertLevels: [
        { label: '一级预警', value: 1, short: '最高', tagType: 'danger' },
        { label: '二级预警', value: 2, short: '高', tagType: 'warning' },
        { label: '三级预警', value: 3, short: '中', tagType: '' },
        { label: '四级预警', value: 4, short: '低', tagType: 'info' }
      ],
      alertConfigDefaults: null,
      alertNameTouched: false,
      mergeAdvancedOpen: false
    };
  },
  computed: {
    defaultMergeWindowSeconds() {
      const cfg = this.alertConfigDefaults || defaultAlertConfig();
      return cfg.merge_window_seconds;
    },
    defaultMergeBaseDelaySeconds() {
      const cfg = this.alertConfigDefaults || defaultAlertConfig();
      return cfg.merge_base_delay_seconds;
    },
    defaultMergeMaxDurationSeconds() {
      const cfg = this.alertConfigDefaults || defaultAlertConfig();
      return cfg.merge_max_duration_seconds;
    },
    defaultMergeQuickSendThreshold() {
      const cfg = this.alertConfigDefaults || defaultAlertConfig();
      return cfg.merge_quick_send_threshold;
    },
    defaultMergeLevelDelayFactor() {
      const cfg = this.alertConfigDefaults || defaultAlertConfig();
      return cfg.merge_level_delay_factor;
    },
    defaultVideoBeforeSeconds() {
      const cfg = this.alertConfigDefaults || defaultAlertConfig();
      return cfg.video_before_seconds;
    },
    defaultVideoAfterSeconds() {
      const cfg = this.alertConfigDefaults || defaultAlertConfig();
      return cfg.video_after_seconds;
    },
    videoBufferBefore() {
      const v = this.form.alert_config.video_before_seconds;
      return v !== undefined && v !== null && v !== '' ? v : this.defaultVideoBeforeSeconds;
    },
    videoBufferAfter() {
      const v = this.form.alert_config.video_after_seconds;
      return v !== undefined && v !== null && v !== '' ? v : this.defaultVideoAfterSeconds;
    },
    isEdit() {
      return this.mode === 'edit' && !!(this.editPlan && this.editPlan.plan_id);
    },
    isView() {
      return this.mode === 'view';
    },
    drawerTitle() {
      if (this.isView) return '查看运行计划';
      if (this.isEdit) return '编辑运行计划';
      return '创建运行计划';
    },
    rtspStreamingEnabled: {
      get() {
        this.ensureRtspStreamingConfig();
        return !!(this.form.frame_extraction.rtsp_streaming && this.form.frame_extraction.rtsp_streaming.enabled);
      },
      set(val) {
        this.ensureRtspStreamingConfig();
        this.$set(this.form.frame_extraction.rtsp_streaming, 'enabled', !!val);
      }
    }
  },
  watch: {
    visible(v) {
      this.innerVisible = v;
      if (v) this.init();
    },
    innerVisible(v) {
      this.$emit('update:visible', v);
    },
    // 点位列表变化（回到上一步删/换摄像头）时，同步围栏预览所选点位，避免残留旧摄像头画面
    'form.cameras'(cams) {
      const cur = this.currentFenceCam;
      const match = cur && cams.find(c => String(c.camera_id) === String(cur.camera_id));
      this.currentFenceCam = match || cams[0] || null;
    }
  },
  created() {
    this.loadSkills();
  },
  methods: {
    goStep(i) {
      if (i < this.step) this.step = i;
    },
    async loadSkills() {
      try {
        this.skillOptions = await skillAPI.fetchRunPlanSkillOptions();
      } catch (e) {
        console.warn('加载技能选项失败', e);
        this.skillOptions = [];
      }
    },
    kindTagType(kind) {
      // 视觉技能用 Element 默认蓝色标签（''），注意空串是 falsy，不能用 || 兜底
      return { visual: '', graph: 'success', llm: 'warning' }[kind] || '';
    },
    ensureRtspStreamingConfig() {
      if (!this.form.frame_extraction.rtsp_streaming) {
        this.$set(this.form.frame_extraction, 'rtsp_streaming', { enabled: false });
      }
    },
    async init() {
      this.step = 0;
      this.alertNameTouched = false;
      this.mergeAdvancedOpen = false;
      await this.loadAlertDefaults();
      const baseAlertConfig = this.alertConfigDefaults || defaultAlertConfig();
      if (this.isEdit || this.isView) {
        const p = this.editPlan;
        const kind = p.skill_kind || 'visual';
        const skillRef = kind === 'llm'
          ? (p.llm_skill_id ? 'llm:' + p.llm_skill_id : '')
          : (p.skill_class_id ? 'sc:' + p.skill_class_id : '');
        const alertConfig = Object.assign({}, baseAlertConfig, p.alert_config || {});
        alertConfig.merge_immediate_levels = normalizeImmediateLevels(alertConfig.merge_immediate_levels);
        this.form = Object.assign(defaultForm(), {
          analysis_resource: p.analysis_resource || 'cloud',
          skill_ref: skillRef,
          skill_kind: kind,
          skill_class_id: p.skill_class_id || '',
          llm_skill_id: p.llm_skill_id || '',
          skill_name: p.skill_name || '',
          enabled: p.enabled !== false,
          run_cycle: Object.assign(defaultForm().run_cycle, p.run_cycle || {}),
          frame_extraction: Object.assign(defaultForm().frame_extraction, p.frame_extraction || {}),
          skill_params: Object.assign({}, p.skill_params || {}),
          alert_name: p.alert_name || '',
          alert_level: p.alert_level || '',
          alert_config: alertConfig,
          cameras: JSON.parse(JSON.stringify(p.cameras || []))
        });
        this.alertNameTouched = true;
        if (kind !== 'llm' && p.skill_class_id) this.loadSkillParams(p.skill_class_id, true);
      } else {
        this.form = defaultForm();
        const alertConfig = Object.assign({}, baseAlertConfig);
        alertConfig.merge_immediate_levels = normalizeImmediateLevels(alertConfig.merge_immediate_levels);
        this.form.alert_config = alertConfig;
        this.skillParamFields = [];
        this.skillParamsLoading = false;
      }
      this.ensureRtspStreamingConfig();
      this.currentFenceCam = this.form.cameras[0] || null;
    },
    async loadAlertDefaults() {
      try {
        const res = await runPlanAPI.getDefaults();
        const payload = res.data || {};
        const cfg = (payload.data && payload.data.alert_config) || payload.alert_config;
        this.alertConfigDefaults = Object.assign(defaultAlertConfig(), cfg || {});
      } catch (e) {
        console.warn('加载预警默认配置失败', e);
        this.alertConfigDefaults = defaultAlertConfig();
      }
    },
    onAlertNameInput() {
      this.alertNameTouched = true;
    },
    toggleMergeAdvanced() {
      this.mergeAdvancedOpen = !this.mergeAdvancedOpen;
    },
    ensureAlertNameDefault() {
      if (!this.alertNameTouched && !this.form.alert_name && this.form.skill_name) {
        this.form.alert_name = this.form.skill_name;
      }
    },
    onChannelTreeClick(channel) {
      if (this.isView) return;
      if (this.isSelected(channel)) {
        this.removeSelected(channel);
      } else {
        this.form.cameras.push({
          camera_id: channel.camera_id,
          camera_name: channel.camera_name,
          online: !!channel.online,
          fence: null
        });
      }
    },
    toggleWeekday(v) {
      const arr = this.form.run_cycle.weekdays;
      const i = arr.indexOf(v);
      if (i >= 0) arr.splice(i, 1); else arr.push(v);
    },
    addPeriod() {
      if (this.form.run_cycle.periods.length < 5) {
        this.form.run_cycle.periods.push({ start: '00:00', end: '23:59' });
      }
    },
    removePeriod(i) {
      this.form.run_cycle.periods.splice(i, 1);
    },
    isSelected(pt) {
      return this.form.cameras.some(c => String(c.camera_id) === String(pt.camera_id));
    },
    togglePoint(pt, checked) {
      if (checked) {
        if (!this.isSelected(pt)) {
          this.form.cameras.push({ camera_id: pt.camera_id, camera_name: pt.camera_name, online: !!pt.online, fence: null });
        }
      } else {
        this.removeSelected(pt);
      }
    },
    removeSelected(pt) {
      const i = this.form.cameras.findIndex(c => String(c.camera_id) === String(pt.camera_id));
      if (i >= 0) this.form.cameras.splice(i, 1);
    },
    clearSelected() {
      this.form.cameras = [];
    },
    onSkillChange(ref) {
      const s = this.skillOptions.find(o => o.ref === ref);
      if (!s) {
        this.form.skill_name = '';
        this.skillNeedsFence = true;
        this.skillNeedsTripwire = false;
        if (!this.alertNameTouched) this.form.alert_name = '';
        return;
      }
      this.form.skill_kind = s.kind === 'llm' ? 'llm' : (s.kind === 'graph' ? 'graph' : 'visual');
      this.form.skill_name = s.label;
      if (!this.alertNameTouched) {
        this.form.alert_name = s.label || '';
      }
      if (s.kind === 'llm') {
        this.form.llm_skill_id = s.llm_skill_id;
        this.form.skill_class_id = '';
        this.form.skill_params = {};
        this.skillParamFields = [];
        this.skillParamsLoading = false;
        this.skillNeedsFence = false;
        this.skillNeedsTripwire = false;
      } else {
        this.form.skill_class_id = s.skill_class_id;
        this.form.llm_skill_id = '';
        this.loadSkillParams(s.skill_class_id, false);
      }
    },
    getSkillParamType(value) {
      if (Array.isArray(value)) return 'array';
      if (typeof value === 'boolean') return 'boolean';
      if (typeof value === 'object' && value !== null) return 'object';
      if (typeof value === 'number') return 'number';
      return 'string';
    },
    formatParamValue(value) {
      if (Array.isArray(value)) return value.join(', ');
      if (typeof value === 'object' && value !== null) return JSON.stringify(value, null, 2);
      return value;
    },
    getNumberStep(value) {
      if (Number.isInteger(value)) return 1;
      const decimalPart = String(value).split('.')[1];
      if (!decimalPart) return 1;
      if (decimalPart.length === 1) return 0.01;
      return Math.pow(0.1, decimalPart.length);
    },
    getNumberPrecision(value) {
      if (Number.isInteger(value)) return 0;
      const decimalPart = String(value).split('.')[1];
      if (!decimalPart) return 0;
      return decimalPart.length === 1 ? 2 : decimalPart.length;
    },
    async loadSkillParams(id, keepValues) {
      this.skillParamsLoading = true;
      try {
        const res = await skillAPI.getAITaskSkillDetail(id);
        const payload = res.data || {};
        const detail = payload.data !== undefined ? payload.data : payload;
        const params = (detail.default_config && detail.default_config.params) || {};
        const fields = [];
        Object.keys(params).forEach(key => {
          const val = params[key];
          fields.push({
            key,
            default: val,
            type: this.getSkillParamType(val)
          });
          if (!keepValues || this.form.skill_params[key] === undefined) {
            this.$set(this.form.skill_params, key, JSON.parse(JSON.stringify(val)));
          }
        });
        this.skillParamFields = fields;
        this.skillNeedsFence = this.computeSkillNeedsFence(detail);
        this.skillNeedsTripwire = this.computeSkillNeedsTripwire(detail);
      } catch (e) {
        console.warn('加载技能参数失败', e);
        this.skillParamFields = [];
        this.skillNeedsFence = true;
        this.skillNeedsTripwire = false;
      } finally {
        this.skillParamsLoading = false;
      }
    },
    // 技能输入声明了什么就绘制什么：开始节点声明 ROI → 多边形围栏；声明 Tripwire → 绊线。
    // 非技能图（传统视觉技能）无法判断，保持显示围栏配置（仅多边形）。
    startNodeInputTypes(detail) {
      const dc = (detail && detail.default_config) || {};
      const gj = dc.graph_json || dc.graphJson;
      if (!gj || !Array.isArray(gj.nodes)) return null;
      const startNode = gj.nodes.find(n => {
        const t = n.type || (n.properties && n.properties.nodeType);
        return t === 'start';
      });
      if (!startNode) return null;
      const cfg = startNode.config || (startNode.properties && startNode.properties.config) || {};
      return (cfg.input_params || []).map(p => String((p && p.type) || '').toLowerCase());
    },
    computeSkillNeedsFence(detail) {
      try {
        const types = this.startNodeInputTypes(detail);
        if (types === null) return true;
        return types.includes('roi');
      } catch (e) {
        return true;
      }
    },
    computeSkillNeedsTripwire(detail) {
      try {
        const types = this.startNodeInputTypes(detail);
        if (types === null) return false;
        return types.includes('tripwire');
      } catch (e) {
        return false;
      }
    },
    fenceDrawn(cam) {
      if (!cam || !cam.fence) return false;
      const hasRegions = cam.fence.regions && cam.fence.regions.length > 0;
      const hasTripwires = cam.fence.tripwires && cam.fence.tripwires.length > 0;
      return hasRegions || hasTripwires;
    },
    snapshotUrl(cameraId) {
      return runPlanAPI.getCameraSnapshotUrl(cameraId);
    },
    openFence(cam) {
      this.currentFenceCam = cam;
      this.fenceEditing = cam.fence ? JSON.parse(JSON.stringify(cam.fence)) : null;
      this.fenceVisible = true;
    },
    onFenceConfirm(fence) {
      if (this.currentFenceCam) {
        this.$set(this.currentFenceCam, 'fence', fence);
      }
    },
    nextStep() {
      if (this.step === 0) {
        if (!this.form.skill_ref) { this.$message.warning('请选择 AI 技能'); return; }
        if (!this.form.cameras.length) { this.$message.warning('请至少选择一个点位'); return; }
        if (!this.form.run_cycle.weekdays.length) { this.$message.warning('请选择运行频率'); return; }
      }
      if (this.step === 1) {
        this.ensureAlertNameDefault();
      }
      if (this.step < 2) this.step += 1;
    },
    prevStep() {
      if (this.step > 0) this.step -= 1;
    },
    buildPayload() {
      const cameras = this.form.cameras.map(c => ({
        camera_id: c.camera_id,
        camera_name: c.camera_name,
        fence: this.toBackendFence(c.fence)
      }));
      const payload = {
        analysis_resource: this.form.analysis_resource,
        skill_kind: this.form.skill_kind,
        skill_name: this.form.skill_name,
        enabled: this.form.enabled,
        run_cycle: this.form.run_cycle,
        frame_extraction: this.form.frame_extraction,
        skill_params: this.form.skill_params,
        alert_name: this.form.alert_name,
        alert_level: this.form.alert_level === '' ? 0 : this.form.alert_level,
        alert_config: this.form.alert_config,
        cameras
      };
      if (this.form.skill_kind === 'llm') {
        payload.llm_skill_id = this.form.llm_skill_id;
      } else {
        payload.skill_class_id = this.form.skill_class_id;
      }
      return payload;
    },
    toBackendFence(fence) {
      const regions = (fence && fence.regions) || [];
      const tripwires = (fence && fence.tripwires) || [];
      if (!regions.length && !tripwires.length) {
        return { enabled: false, points: [] };
      }
      const out = {
        enabled: true,
        regions,
        points: regions.length ? (regions[0].points || []) : []
      };
      if (tripwires.length) out.tripwires = tripwires;
      return out;
    },
    async submit() {
      this.ensureAlertNameDefault();
      if (!this.form.alert_name) { this.$message.warning('请输入预警名称'); this.step = 2; return; }
      if (this.form.alert_level === '') { this.$message.warning('请选择预警等级'); this.step = 2; return; }
      this.submitting = true;
      try {
        const payload = this.buildPayload();
        if (this.isEdit) {
          await runPlanAPI.updatePlan(this.editPlan.plan_id, payload);
          this.$message.success('更新成功');
        } else {
          await runPlanAPI.createPlan(payload);
          this.$message.success('创建成功');
        }
        this.$emit('saved');
        this.innerVisible = false;
      } catch (e) {
        this.$message.error('保存失败：' + (e.response && e.response.data && e.response.data.detail ? e.response.data.detail : '请检查配置'));
      } finally {
        this.submitting = false;
      }
    },
    onClosed() {
      this.step = 0;
      this.form = defaultForm();
      this.skillParamFields = [];
      this.skillParamsLoading = false;
      this.alertNameTouched = false;
      this.mergeAdvancedOpen = false;
    }
  }
};
</script>

<style scoped>
.drawer-title { display: flex; align-items: center; justify-content: flex-start; gap: 10px; text-align: left; }
.drawer-title__text { font-size: 16px; font-weight: 600; color: #1d2129; }

.drawer-body { padding: 0 24px 88px; height: calc(100vh - 110px); overflow-y: auto; text-align: left; }

.step-pane { text-align: left; }

/* 步骤条 */
.step-bar {
  display: flex; align-items: center; justify-content: center;
  gap: 0; margin: 8px 0 28px; padding: 0 20px;
}
.step-item {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px 0; position: relative; cursor: pointer;
  color: #909399; font-size: 13px;
}
.step-item:not(:last-child)::after {
  content: ''; position: absolute; right: 0; top: 50%;
  width: calc(50% - 20px); height: 2px; background: #e4e7ed;
  transform: translate(50%, -50%); z-index: 0;
}
.step-item.done:not(:last-child)::after { background: #409eff; }
.step-num {
  width: 26px; height: 26px; border-radius: 50%;
  border: 2px solid #dcdfe6; display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; background: #fff; z-index: 1; transition: all 0.2s;
}
.step-item.active .step-num { border-color: #409eff; background: #409eff; color: #fff; }
.step-item.done .step-num { border-color: #409eff; background: #409eff; color: #fff; }
.step-item.active { color: #303133; font-weight: 600; }
.step-item.done { color: #409eff; }

/* 表单区块 */
.form-section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px 20px 8px;
  margin-bottom: 16px;
  text-align: left;
}
.section-head {
  font-size: 14px; font-weight: 600; color: #1d2129;
  margin-bottom: 16px; padding-bottom: 10px;
  border-bottom: 1px solid #f0f2f5;
  text-align: left;
}
.section-head i { margin-right: 6px; color: #409eff; }

.form-section >>> .el-form-item__label {
  text-align: left;
}
.form-section >>> .el-form-item__content {
  text-align: left;
}
.form-section >>> .el-radio-group {
  text-align: left;
}

.hint { font-size: 12px; color: #a8abb2; line-height: 1.6; margin-top: 4px; }

.rtsp-streaming-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.rtsp-streaming-row__label {
  font-size: 13px;
  color: #606266;
}
.rtsp-streaming-row__status {
  font-size: 12px;
  color: #909399;
}
.rtsp-streaming-row__status.is-on {
  color: #67C23A;
}
.rtsp-streaming-row__help {
  color: #909399;
  cursor: help;
}
.rtsp-streaming-alert {
  margin-top: 10px;
  max-width: 520px;
}

.skill-params-hint {
  font-size: 13px;
  color: #909399;
  padding: 4px 0 8px;
}
.skill-params-form >>> .skill-param-row.el-form-item {
  margin-bottom: 14px;
}
.skill-params-form >>> .skill-param-row .el-form-item__label {
  line-height: 1.4;
  word-break: break-all;
  padding-top: 7px;
}
.skill-params-form >>> .skill-param-row .el-form-item__content {
  line-height: 32px;
}
.skill-param-number,
.skill-param-input {
  width: 200px;
}
.skill-params-form >>> .el-input-number .el-input__inner {
  padding-right: 42px;
  text-align: left;
}
.param-readonly-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.param-readonly-json {
  margin: 0;
  padding: 6px 8px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  max-width: 360px;
  overflow-x: auto;
  word-break: break-all;
  white-space: pre-wrap;
}

.skill-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.skill-option__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.req { color: #f56c6c; margin-left: 2px; }

.cycle-box { background: #fafbfc; border-radius: 8px; padding: 16px; margin-top: 8px; border: 1px solid #f0f2f5; }
.cycle-row { display: flex; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 6px; }
.cycle-label { width: 80px; font-size: 13px; color: #606266; flex-shrink: 0; }
.weekday-group { display: flex; flex-wrap: wrap; gap: 6px; }
.weekday {
  width: 32px; height: 32px; border-radius: 50%;
  border: 1px solid #dcdfe6; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #606266; transition: all 0.15s;
}
.weekday.active { color: #fff; background: #409eff; border-color: #409eff; }
.weekday.disabled { cursor: default; }
.dash { margin: 0 6px; color: #909399; font-size: 13px; }
.del-period { margin-left: 8px; color: #f56c6c; cursor: pointer; font-size: 16px; }
.add-period { color: #409eff; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; margin-top: 4px; }

.point-tip {
  background: #ecf5ff; color: #409eff; font-size: 12px;
  padding: 8px 12px; border-radius: 6px; margin-bottom: 12px;
  display: flex; align-items: center; gap: 6px;
}
.point-selector { display: flex; border: 1px solid #ebeef5; border-radius: 8px; height: 360px; overflow: hidden; }
.ps-tree {
  flex: 1; min-width: 0; min-height: 0; display: flex; flex-direction: column;
  border-right: 1px solid #ebeef5; padding: 10px; background: #fafbfc;
}
.ps-tree >>> .channel-tree-panel {
  flex: 1;
  min-height: 0;
}
.ps-tree-tip { font-size: 11px; color: #909399; margin-top: 8px; text-align: left; }
.ps-selected {
  width: 240px; flex-shrink: 0; padding: 12px;
  display: flex; flex-direction: column; background: #fff;
}
.ps-col { flex: 1; border-right: 1px solid #ebeef5; padding: 12px; display: flex; flex-direction: column; background: #fafbfc; }
.ps-col:last-child { border-right: none; background: #fff; }
.ps-head { font-size: 13px; color: #303133; font-weight: 600; display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; text-align: left; }
.ps-list { flex: 1; overflow-y: auto; margin-top: 4px; }
.ps-item { padding: 7px 6px; font-size: 13px; color: #606266; display: flex; align-items: center; border-radius: 4px; }
.org-item { cursor: pointer; }
.org-item:hover { background: #ecf5ff; }
.org-item.active { background: #ecf5ff; }
.org-item i { color: #409eff; margin-right: 6px; }
.org-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.org-count { color: #909399; font-size: 12px; margin-left: 6px; }
.selected-item { justify-content: space-between; align-items: flex-start; }
.selected-item__main { flex: 1; min-width: 0; }
.selected-item__name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 2px;
}
.selected-item__name i { color: #409eff; margin-right: 4px; }
.selected-item__status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #909399;
}
.selected-item .status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.selected-item .status-dot.is-online { background: #67c23a; }
.selected-item .status-dot.is-offline { background: #c0c4cc; }
.selected-item .el-icon-close { cursor: pointer; color: #c0c4cc; padding: 4px; flex-shrink: 0; margin-top: 2px; }
.selected-item .el-icon-close:hover { color: #f56c6c; }
.clear-link { color: #409eff; font-size: 12px; cursor: pointer; font-weight: 400; }
.empty-tip-sm { color: #c0c4cc; font-size: 12px; text-align: center; padding: 40px 10px; line-height: 1.8; }

.frame-box { background: #fafbfc; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; border: 1px solid #f0f2f5; }
.frame-box--inline { display: inline-flex; }
.frame-text { font-size: 13px; color: #606266; }

.region-draw { display: flex; border: 1px solid #ebeef5; border-radius: 8px; min-height: 320px; overflow: hidden; }
.region-list { width: 220px; border-right: 1px solid #ebeef5; padding: 10px; background: #fafbfc; overflow-y: auto; }
.region-cam {
  display: flex; align-items: center; gap: 6px;
  padding: 10px; font-size: 13px; color: #606266;
  cursor: pointer; border-radius: 6px; margin-bottom: 4px; transition: background 0.15s;
}
.region-cam:hover { background: #ecf5ff; }
.region-cam.active { background: #ecf5ff; color: #409eff; }
.region-cam__name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.region-cam__badge { font-size: 11px; color: #909399; background: #f0f2f5; padding: 1px 6px; border-radius: 8px; }
.region-cam__badge.drawn { color: #67c23a; background: #f0f9eb; }
.region-canvas { flex: 1; padding: 14px; display: flex; flex-direction: column; }
.region-canvas--empty { align-items: center; justify-content: center; }
.region-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.region-status__label { font-size: 13px; font-weight: 600; color: #303133; }
.region-preview {
  position: relative; background: #1d2129; border-radius: 8px;
  flex: 1; min-height: 220px; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.region-preview__ph { position: relative; z-index: 0; display: flex; flex-direction: column; align-items: center; color: #909399; font-size: 12px; }
.region-preview__ph i { font-size: 36px; margin-bottom: 8px; }

.alert-level-select { width: 240px; }

.merge-switch-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}
.merge-effect-link {
  color: #409eff;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
}
.merge-effect-link:hover { color: #66b1ff; }
.merge-effect-popover__body { text-align: left; }
.merge-effect-popover__title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}
.merge-effect-img {
  display: block;
  width: 100%;
  height: auto;
}
.merge-cycle-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.merge-cycle-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.merge-gear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #909399;
  cursor: pointer;
  transition: all 0.15s;
  vertical-align: middle;
}
.merge-gear-btn:hover:not(:disabled),
.merge-gear-btn.is-active {
  color: #409eff;
  background: #ecf5ff;
}
.merge-gear-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.merge-gear-btn i { font-size: 14px; }
.merge-advanced-collapse {
  border: none;
  margin-top: 4px;
}
.merge-advanced-collapse >>> .el-collapse-item__header {
  height: 36px;
  line-height: 36px;
  font-size: 13px;
  color: #409eff;
  border: none;
  background: transparent;
  padding-left: 0;
}
.merge-advanced-collapse >>> .el-collapse-item__wrap {
  border: none;
}
.merge-advanced-collapse >>> .el-collapse-item__content {
  padding: 4px 0 0;
}
.video-behavior-box {
  margin-top: 0;
  margin-bottom: 8px;
  align-items: flex-start;
}
.video-behavior-box strong { color: #303133; font-weight: 600; }
.video-advanced-form { margin-top: 4px; }
.video-range-help {
  margin-left: 4px;
  color: #909399;
  cursor: help;
  font-size: 14px;
}
.info-box { background: #ecf5ff; color: #409eff; font-size: 12px; padding: 8px 12px; border-radius: 6px; margin-top: 8px; line-height: 1.6; display: flex; gap: 6px; max-width: 560px; }

.drawer-footer {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 14px 24px; border-top: 1px solid #ebeef5;
  background: #fff; text-align: right; z-index: 10;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
}
</style>

<style>
.run-plan-drawer .el-drawer__header {
  margin-bottom: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f2f5;
  text-align: left;
}
.run-plan-drawer .el-drawer__body { padding: 0; position: relative; text-align: left; }
.run-plan-drawer .el-drawer__close-btn { text-align: right; }
.merge-effect-popover { padding: 16px !important; }
.alert-level-select-dropdown { min-width: 240px !important; }
.alert-level-select-dropdown .el-select-dropdown__item {
  height: auto;
  line-height: normal;
  padding: 8px 16px;
}
.alert-level-select-dropdown .alert-level-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}
.alert-level-select-dropdown .alert-level-option__left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #303133;
}
.alert-level-select-dropdown .level-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.alert-level-select-dropdown .level-dot--1 { background: #f56c6c; }
.alert-level-select-dropdown .level-dot--2 { background: #e6a23c; }
.alert-level-select-dropdown .level-dot--3 { background: #409eff; }
.alert-level-select-dropdown .level-dot--4 { background: #909399; }
</style>

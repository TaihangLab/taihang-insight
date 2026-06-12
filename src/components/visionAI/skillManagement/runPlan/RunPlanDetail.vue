<template>
  <div class="plan-detail-page" v-loading="loading">
    <!-- 页头 -->
    <div class="page-header">
      <div class="page-header__left">
        <i class="el-icon-arrow-left back-btn" @click="goBack"></i>
        <span class="page-header__title">运行计划详情（{{ planId }}）</span>
      </div>
      <div class="page-header__right">
        <el-button size="small" @click="openEdit">编辑</el-button>
        <el-button size="small" type="danger" plain @click="deletePlan">删除</el-button>
      </div>
    </div>

    <el-card class="detail-card" shadow="never">
      <div class="detail-tab">运行计划详情</div>

      <div v-if="plan" class="detail-body">
        <!-- 基本信息 -->
        <div class="detail-section">
          <div class="section-title">基本信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">计划ID</span>
              <span class="info-value mono">{{ plan.plan_id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">计划启停</span>
              <span class="info-value">
                <el-switch v-model="plan.enabled" @change="toggleEnabled"></el-switch>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">更新时间</span>
              <span class="info-value">{{ plan.updated_at || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">AI技能</span>
              <span class="info-value">
                <el-tag v-if="plan.skill_kind === 'llm'" size="mini" type="warning" effect="plain">大模型</el-tag>
                <el-tag v-else-if="plan.skill_kind === 'graph'" size="mini" type="success" effect="plain">编排</el-tag>
                {{ plan.skill_name || '-' }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">点位名称</span>
              <span class="info-value">{{ cameraNames }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">运行周期</span>
              <span class="info-value">循环</span>
            </div>
            <div class="info-item">
              <span class="info-label">运行频率</span>
              <span class="info-value">{{ weekdaysText }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">运行时段</span>
              <span class="info-value">{{ periodsText }}</span>
            </div>
          </div>
        </div>

        <!-- 运行参数信息 -->
        <div class="detail-section">
          <div class="section-title">运行参数信息</div>

          <div class="sub-title">视频抽帧参数</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">抽帧频率</span>
              <span class="info-value param-box">{{ frameText }}</span>
            </div>
          </div>

          <template v-if="skillParamEntries.length">
            <div class="sub-title">技能参数</div>
            <div class="info-grid">
              <div v-for="p in skillParamEntries" :key="p.key" class="info-item">
                <span class="info-label">{{ p.key }}</span>
                <span class="info-value">{{ p.value }}</span>
              </div>
            </div>
          </template>

          <template v-if="plan.skill_kind !== 'llm'">
            <div class="sub-title">区域绘制信息</div>
            <div class="region-layout">
              <!-- 多点位：左侧点位列表，逐个切换查看 -->
              <div v-if="plan.cameras.length > 1" class="region-cam-list">
                <div
                  v-for="cam in plan.cameras"
                  :key="cam.camera_id"
                  class="region-cam-item"
                  :class="{ active: activeCam && String(activeCam.camera_id) === String(cam.camera_id) }"
                  @click="activeCamId = cam.camera_id">
                  <i class="el-icon-video-camera"></i>
                  <span class="region-cam-item__name" :title="cam.camera_name">{{ cam.camera_name }}</span>
                  <span class="region-cam-item__badge" :class="{ drawn: isFenceDrawn(cam.fence) }">
                    {{ isFenceDrawn(cam.fence) ? '已绘制' : '未绘制' }}
                  </span>
                </div>
              </div>
              <div v-if="activeCam" class="region-block">
                <div class="region-block__head">
                  <span class="region-block__badge">
                    <i class="el-icon-crop"></i> 检测区域
                  </span>
                  <span class="region-block__state" :class="{ drawn: isFenceDrawn(activeCam.fence) }">
                    <span class="state-dot"></span>
                    {{ isFenceDrawn(activeCam.fence) ? '已绘制' : '未绘制' }}
                  </span>
                  <span class="region-block__cam">
                    <i class="el-icon-video-camera"></i> {{ activeCam.camera_name }}
                  </span>
                </div>
                <div class="region-block__preview">
                  <img
                    :key="activeCam.camera_id + '-' + refreshKey"
                    :src="snapshotUrl(activeCam.camera_id)"
                    class="region-block__img"
                    @error="onPreviewError" />
                  <div class="region-block__ph">
                    <i class="el-icon-picture-outline"></i>
                    <span>点位画面预览</span>
                  </div>
                  <i class="el-icon-refresh-right region-block__refresh" title="刷新画面" @click="refreshKey++"></i>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 预警规则信息 -->
        <div class="detail-section">
          <div class="section-title">预警规则信息</div>

          <div class="sub-title">预警信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">预警名称</span>
              <span class="info-value">{{ plan.alert_name || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">预警等级</span>
              <span class="info-value">
                <el-tag :type="alertLevelTagType(plan.alert_level)" size="small" effect="plain">
                  {{ alertLevelLabel(plan.alert_level) }}
                </el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">预警合并</span>
              <span class="info-value">{{ mergeEnabled ? '开启' : '关闭' }}</span>
            </div>
            <div v-if="mergeEnabled" class="info-item info-item--wide">
              <span class="info-label">合并周期</span>
              <span class="info-value">两个事件的发生间隔小于{{ mergeWindowSeconds }}秒，则被合并在一起</span>
            </div>
          </div>

          <template v-if="plan.skill_kind !== 'llm'">
            <div class="sub-title">预警视频信息</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">视频生成时间</span>
                <span class="info-value">{{ videoGenerateText }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">视频范围</span>
                <span class="info-value">预警前{{ videoBefore }}秒 ~ 预警后{{ videoAfter }}秒</span>
              </div>
            </div>
          </template>
          <div v-else class="llm-tip">
            <i class="el-icon-info"></i> 多模态大模型技能仅生成预警截图，不生成预警视频
          </div>
        </div>
      </div>

      <div v-else-if="!loading" class="empty-wrap">
        <i class="el-icon-warning-outline"></i>
        <p>运行计划不存在或已被删除</p>
        <el-button size="small" @click="goBack">返回列表</el-button>
      </div>
    </el-card>

    <run-plan-create-drawer
      :visible.sync="drawerVisible"
      :edit-plan="plan"
      mode="edit"
      @saved="onSaved">
    </run-plan-create-drawer>
  </div>
</template>

<script>
import { runPlanAPI } from '@/components/service/VisionAIService.js';
import RunPlanCreateDrawer from './RunPlanCreateDrawer.vue';
import {
  formatWeekdays,
  formatPeriods,
  formatFrameExtraction,
  alertLevelLabel,
  alertLevelTagType,
  fenceDrawn
} from './runPlanFormat.js';

export default {
  name: 'RunPlanDetail',
  components: { RunPlanCreateDrawer },
  data() {
    return {
      loading: false,
      plan: null,
      drawerVisible: false,
      refreshKey: 0,
      activeCamId: null
    };
  },
  computed: {
    planId() {
      return this.$route.params.planId;
    },
    activeCam() {
      const cams = (this.plan && this.plan.cameras) || [];
      if (!cams.length) return null;
      const found = cams.find(c => String(c.camera_id) === String(this.activeCamId));
      return found || cams[0];
    },
    cameraNames() {
      const names = (this.plan && this.plan.camera_names) || [];
      return names.length ? names.join('、') : '-';
    },
    weekdaysText() {
      return formatWeekdays(this.plan && this.plan.run_cycle);
    },
    periodsText() {
      return formatPeriods(this.plan && this.plan.run_cycle);
    },
    frameText() {
      return formatFrameExtraction(this.plan && this.plan.frame_extraction);
    },
    skillParamEntries() {
      const params = (this.plan && this.plan.skill_params) || {};
      return Object.keys(params).map(key => {
        const v = params[key];
        let value = v;
        if (Array.isArray(v)) value = v.join('、');
        else if (typeof v === 'object' && v !== null) value = JSON.stringify(v);
        else if (typeof v === 'boolean') value = v ? '开启' : '关闭';
        return { key, value };
      });
    },
    mergeEnabled() {
      const ac = (this.plan && this.plan.alert_config) || {};
      return ac.merge_enabled !== false;
    },
    mergeWindowSeconds() {
      const ac = (this.plan && this.plan.alert_config) || {};
      return ac.merge_window_seconds != null ? ac.merge_window_seconds : 10;
    },
    videoGenerateText() {
      const ac = (this.plan && this.plan.alert_config) || {};
      if (!this.mergeEnabled) return '预警触发后立即生成';
      return ac.video_generate_time === 'before' ? '预警合并前' : '预警合并后';
    },
    videoBefore() {
      const ac = (this.plan && this.plan.alert_config) || {};
      return ac.video_before_seconds != null ? ac.video_before_seconds : 2;
    },
    videoAfter() {
      const ac = (this.plan && this.plan.alert_config) || {};
      return ac.video_after_seconds != null ? ac.video_after_seconds : 2;
    }
  },
  created() {
    this.loadPlan();
  },
  methods: {
    alertLevelLabel,
    alertLevelTagType,
    isFenceDrawn: fenceDrawn,
    async loadPlan() {
      this.loading = true;
      try {
        const res = await runPlanAPI.getPlan(this.planId);
        const d = res.data || {};
        this.plan = d.data || null;
      } catch (e) {
        this.plan = null;
        if (!(e.response && e.response.status === 404)) {
          this.$message.error('加载运行计划详情失败');
        }
      } finally {
        this.loading = false;
      }
    },
    goBack() {
      this.$router.push('/skillManage/runPlan');
    },
    snapshotUrl(cameraId) {
      // refreshKey 变更可强制刷新底图
      return runPlanAPI.getCameraSnapshotUrl(cameraId) + '&r=' + this.refreshKey;
    },
    onPreviewError(e) {
      if (e && e.target) e.target.style.display = 'none';
    },
    openEdit() {
      if (!this.plan) return;
      this.drawerVisible = true;
    },
    onSaved() {
      this.drawerVisible = false;
      this.loadPlan();
    },
    async toggleEnabled(val) {
      try {
        await runPlanAPI.setEnabled(this.planId, val);
        this.$message.success(val ? '已启用' : '已停用');
      } catch (e) {
        this.plan.enabled = !val;
        this.$message.error('操作失败');
      }
    },
    async deletePlan() {
      try {
        await this.$confirm(`确认删除计划「${this.planId}」及其关联运行任务？`, '删除确认', { type: 'warning' });
        await runPlanAPI.deletePlan(this.planId);
        this.$message.success('删除成功');
        this.goBack();
      } catch (e) {
        if (e !== 'cancel') this.$message.error('删除失败');
      }
    }
  }
};
</script>

<style scoped>
.plan-detail-page {
  padding: 16px 20px;
  background: #f5f7fa;
  min-height: 100%;
  overflow-y: auto !important;
  box-sizing: border-box;
  text-align: left;
}

/* 页头 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.page-header__left { display: flex; align-items: center; gap: 10px; }
.back-btn {
  font-size: 18px;
  color: #606266;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s;
}
.back-btn:hover { color: #409eff; background: #ecf5ff; }
.page-header__title { font-size: 16px; font-weight: 600; color: #1d2129; }
.page-header__right { display: flex; gap: 8px; }

/* 卡片 */
.detail-card { border-radius: 10px; border: none; }
.detail-card >>> .el-card__body { padding: 0; }
.detail-tab {
  display: inline-block;
  margin: 12px 20px 0;
  padding: 0 4px 10px;
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  border-bottom: 2px solid #409eff;
}
.detail-body {
  border-top: 1px solid #f0f2f5;
  padding: 20px;
}

/* 区块 */
.detail-section { margin-bottom: 28px; }
.detail-section:last-child { margin-bottom: 8px; }
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 16px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}
.sub-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin: 14px 0 12px;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 14px 24px;
}
.info-item { display: flex; align-items: flex-start; min-width: 0; }
.info-item--wide { grid-column: span 2; }
.info-label {
  width: 120px;
  flex-shrink: 0;
  padding-right: 12px;
  box-sizing: border-box;
  font-size: 13px;
  color: #909399;
  line-height: 1.8;
  word-break: break-all;
}
.info-value { flex: 1; min-width: 0; font-size: 13px; color: #303133; line-height: 1.8; word-break: break-all; }
.info-value.mono { font-family: 'SF Mono', 'Roboto Mono', Consolas, monospace; color: #409eff; }
.param-box {
  display: inline-block;
  background: #f5f7fa;
  border-radius: 6px;
  padding: 8px 14px;
}

/* 区域绘制 */
.region-layout {
  display: flex;
  gap: 14px;
  align-items: stretch;
}
.region-cam-list {
  flex-shrink: 0;
  width: 220px;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  background: #fafbfc;
  padding: 8px;
  overflow-y: auto;
  max-height: 480px;
}
.region-cam-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 10px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 4px;
  transition: background 0.15s;
}
.region-cam-item:hover { background: #ecf5ff; }
.region-cam-item.active { background: #ecf5ff; color: #409eff; }
.region-cam-item i { color: #409eff; flex-shrink: 0; }
.region-cam-item__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.region-cam-item__badge {
  flex-shrink: 0;
  font-size: 11px;
  color: #909399;
  background: #f0f2f5;
  padding: 1px 6px;
  border-radius: 8px;
}
.region-cam-item__badge.drawn { color: #67c23a; background: #f0f9eb; }
.region-block {
  flex: 1;
  min-width: 0;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 14px;
}
.region-block__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #fafbfc;
  border-bottom: 1px solid #f0f2f5;
}
.region-block__badge {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
  background: #ecf5ff;
  padding: 4px 10px;
  border-radius: 6px;
}
.region-block__state {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #909399;
}
.region-block__state .state-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #c0c4cc;
}
.region-block__state.drawn { color: #67c23a; }
.region-block__state.drawn .state-dot { background: #67c23a; }
.region-block__cam {
  margin-left: auto;
  font-size: 12px;
  color: #606266;
}
.region-block__cam i { color: #409eff; margin-right: 4px; }
.region-block__preview {
  position: relative;
  background: #1d2129;
  min-height: 300px;
  max-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.region-block__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: 1;
}
.region-block__ph {
  display: flex; flex-direction: column; align-items: center;
  color: #909399; font-size: 12px;
}
.region-block__ph i { font-size: 36px; margin-bottom: 8px; }
.region-block__refresh {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 2;
  color: #fff;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  padding: 6px;
  cursor: pointer;
  font-size: 14px;
}
.region-block__refresh:hover { background: rgba(0, 0, 0, 0.6); }

.llm-tip {
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  border-radius: 6px;
  padding: 8px 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* 空态 */
.empty-wrap {
  text-align: center;
  padding: 80px 20px;
  color: #909399;
}
.empty-wrap i { font-size: 42px; color: #e6a23c; margin-bottom: 12px; }
.empty-wrap p { margin: 0 0 16px; font-size: 14px; }

@media (max-width: 900px) {
  .info-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>

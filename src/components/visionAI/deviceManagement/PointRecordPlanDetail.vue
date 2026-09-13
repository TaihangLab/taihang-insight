<template>
  <div class="asset-page record-plan-detail">
    <div class="asset-page-header">
      <div class="asset-page-header__main">
        <div class="asset-page-title-row">
          <el-button type="text" class="back-btn" icon="el-icon-arrow-left" @click="goBack">返回</el-button>
          <h2 class="asset-page-title">点位录像计划详情</h2>
        </div>
      </div>
    </div>

    <div v-loading="loading" class="detail-card">
      <template v-if="point">
        <div class="detail-head">
          <div class="detail-title-row">
            <h3>{{ point.name }}</h3>
            <span class="asset-status-text" :class="statusTextClass(point.status)">
              <span class="asset-status-dot" :class="statusDotClass(point.status)" />
              {{ point.status }}
            </span>
            <el-tag v-if="point.recordMode === 'always'" size="mini" type="warning">全天录像</el-tag>
            <el-tag v-else-if="point.configStatus === '已配置'" size="mini" :type="point.planEnabled ? 'success' : 'info'">
              {{ point.planEnabled ? '启用' : '停用' }}
            </el-tag>
            <el-tag v-else size="mini" type="info">未配置</el-tag>
            <el-button size="mini" class="edit-btn" @click="goPlayback()">看录像</el-button>
            <el-button
              v-if="point.recordMode === 'always'"
              size="mini"
              @click="stopOverride"
            >停止录像</el-button>
            <el-button
              v-if="point.configStatus === '已配置'"
              size="mini"
              @click="openEdit"
            >编辑计划</el-button>
          </div>
          <p v-if="point.recordMode === 'always'" class="detail-empty-plan">
            当前为<strong>全天录像</strong>，未按星期时段执行。关掉开关即停止；保存计划后改为按计划录像。
          </p>
          <p v-else-if="point.configStatus !== '已配置'" class="detail-empty-plan">
            该点位尚未配置录像计划，<strong>不会录像</strong>。返回列表勾选后点「批量配置录像计划」。
          </p>
          <template v-if="hasSchedulePlan">
            <div class="detail-cycle">
              <i class="el-icon-refresh" /> 循环执行计划
            </div>
            <div class="detail-meta">
              <span>录像周期：循环</span>
              <el-divider direction="vertical" />
              <span>录像频率：{{ weekdayText }}</span>
              <el-divider direction="vertical" />
              <span>录像时段：{{ periodText }}</span>
              <el-divider direction="vertical" />
              <span>保留 {{ point.plan.retainDays }} 天</span>
            </div>
          </template>
        </div>

        <div class="clip-toolbar">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            size="small"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="yyyy-MM-dd HH:mm:ss"
            style="width: 360px;"
          />
          <div class="clip-toolbar__right">
            <el-checkbox v-model="selectAll" :disabled="!visibleClips.length" @change="toggleSelectAll">全选</el-checkbox>
            <el-button size="small" :disabled="!selectedClips.length" @click="batchDelete">批量删除</el-button>
            <el-button size="small" :disabled="!selectedClips.length" @click="batchDownload">批量下载</el-button>
          </div>
        </div>

        <div v-if="!visibleClips.length" class="clip-empty">
          <asset-empty-state
            icon="el-icon-film"
            title="暂无录像文件"
            description="所选时间内没有片段。点「看录像」可打开时间轴回放。"
          >
            <el-button type="primary" size="small" @click="goPlayback()">打开录像回放</el-button>
          </asset-empty-state>
        </div>
        <div v-else class="clip-grid">
          <div v-for="(item, index) in visibleClips" :key="item.id" class="clip-card">
            <div class="clip-thumb" @click="preview(index)">
              <el-checkbox v-model="item.selected" class="clip-check" @click.native.stop />
              <i class="el-icon-video-play clip-play" />
            </div>
            <div class="clip-name">{{ item.name }}</div>
          </div>
        </div>
      </template>
      <asset-empty-state
        v-else-if="!loading"
        icon="el-icon-warning-outline"
        title="点位不存在"
        description="可能已被删除，请返回列表"
      >
        <el-button size="small" @click="goBack">返回列表</el-button>
      </asset-empty-state>
    </div>

    <el-drawer
      :visible.sync="editVisible"
      title="编辑录像计划"
      size="560px"
      :wrapper-closable="false"
      custom-class="record-plan-drawer"
    >
      <div class="drawer-body">
        <el-form label-width="100px" size="small">
          <el-form-item label="计划启停">
            <el-switch v-model="form.enabled" active-text="开启" inactive-text="关闭" />
          </el-form-item>
        </el-form>
        <div class="cycle-box">
          <div class="cycle-row">
            <span class="cycle-label">录像频率<span class="req">*</span></span>
            <div class="weekday-group">
              <span
                v-for="d in weekDays"
                :key="d.value"
                class="weekday"
                :class="{ active: form.weekdays.includes(d.value) }"
                @click="toggleWeekday(d.value)"
              >{{ d.label }}</span>
            </div>
          </div>
          <div class="cycle-row" v-for="(p, i) in form.periods" :key="i">
            <span class="cycle-label">{{ i === 0 ? '录像时段' : '' }}<span class="req" v-if="i === 0">*</span></span>
            <el-time-picker v-model="p.start" value-format="HH:mm" format="HH:mm" placeholder="开始" size="small" style="width: 120px;" />
            <span class="dash">至</span>
            <el-time-picker v-model="p.end" value-format="HH:mm" format="HH:mm" placeholder="结束" size="small" style="width: 120px;" />
            <i v-if="i > 0" class="el-icon-delete del-period" @click="form.periods.splice(i, 1)" />
          </div>
          <a v-if="form.periods.length < 5" class="add-period" @click="form.periods.push({ start: '00:00', end: '23:59' })">
            <i class="el-icon-plus" /> 添加时段 ({{ form.periods.length }}/5)
          </a>
        </div>
        <el-form label-width="100px" size="small" style="margin-top: 16px;">
          <el-form-item label="录像保留">
            <el-input-number v-model="form.retainDays" :min="1" :max="365" size="small" />
            <span class="retain-unit">天</span>
          </el-form-item>
        </el-form>
      </div>
      <div class="drawer-footer">
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </div>
    </el-drawer>

    <el-dialog
      :visible.sync="previewVisible"
      :title="previewTitle"
      width="960px"
      append-to-body
      custom-class="record-preview-dialog"
      @closed="onPreviewClosed"
    >
      <div v-if="previewClip" class="preview-body">
        <div class="preview-player">
          <video
            :key="previewClip.url + previewClip.id"
            :src="previewClip.url"
            controls
            autoplay
            class="preview-video"
          />
        </div>
        <div class="preview-meta">
          <div class="preview-meta__title">基本信息</div>
          <div class="preview-meta__row"><span>文件名称</span><span>{{ previewClip.name }}</span></div>
          <div class="preview-meta__row"><span>开始时间</span><span>{{ previewClip.startText }}</span></div>
          <div class="preview-meta__row"><span>结束时间</span><span>{{ previewClip.endText }}</span></div>
          <div class="preview-meta__row"><span>点位名称</span><span>{{ point.name }}</span></div>
        </div>
      </div>
      <div slot="footer" class="preview-footer">
        <el-button :disabled="previewIndex <= 0" @click="previewIndex -= 1">上一条</el-button>
        <el-button :disabled="previewIndex >= visibleClips.length - 1" @click="previewIndex += 1">下一条</el-button>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button type="primary" @click="goPlayback(previewClip)">时间轴回放</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import './asset-page.css';
import { assetAPI } from '../../service/AssetService.js';
import AssetEmptyState from './AssetEmptyState.vue';
import { streamStatusDotClass, streamStatusTextClass } from './assetStreamStatus.js';
import {
  WEEK_DAYS,
  defaultPlan,
  mergePointWithPlan,
  formatWeekdays,
  formatPeriods,
  hasSchedule,
} from './recordPlanStore.js';

export default {
  name: 'PointRecordPlanDetail',
  components: { AssetEmptyState },
  data() {
    return {
      loading: false,
      point: null,
      dateRange: null,
      clips: [],
      selectAll: false,
      editVisible: false,
      previewVisible: false,
      previewIndex: 0,
      weekDays: WEEK_DAYS,
      form: defaultPlan(),
    };
  },
  computed: {
    weekdayText() {
      return this.point && this.point.plan ? formatWeekdays(this.point.plan.weekdays) : '-';
    },
    periodText() {
      return this.point && this.point.plan ? formatPeriods(this.point.plan.periods) : '-';
    },
    selectedClips() {
      return this.visibleClips.filter((c) => c.selected);
    },
    visibleClips() {
      if (!this.dateRange || this.dateRange.length !== 2) return this.clips;
      const start = new Date(this.dateRange[0].replace(/-/g, '/')).getTime();
      const end = new Date(this.dateRange[1].replace(/-/g, '/')).getTime();
      return this.clips.filter((c) => c.endMs >= start && c.startMs <= end);
    },
    previewClip() {
      return this.visibleClips[this.previewIndex] || null;
    },
    previewTitle() {
      if (!this.previewClip) return '录像文件预览';
      return '录像文件预览 (' + (this.previewIndex + 1) + '/' + this.visibleClips.length + ')';
    },
    hasSchedulePlan() {
      return hasSchedule(this.point && this.point.plan);
    },
  },
  mounted() {
    this.load();
  },
  methods: {
    statusTextClass: streamStatusTextClass,
    statusDotClass: streamStatusDotClass,
    goBack() {
      this.$router.push({ name: 'pointRecordPlan' });
    },
    async stopOverride() {
      try {
        await assetAPI.setRecordPlansEnabled([this.point.id], false);
        this.$message.success('已停止录像');
        this.load();
      } catch (e) {
        this.$message.error((e && e.message) || '操作失败');
      }
    },
    async load() {
      this.loading = true;
      try {
        const [data, plans] = await Promise.all([
          assetAPI.fetchPoints({ page: 1, pageSize: 2000 }),
          assetAPI.fetchRecordPlans().catch(() => ({})),
        ]);
        const found = (data.list || []).find((p) => p.id === this.$route.params.pointId);
        this.point = found ? mergePointWithPlan(found, plans || {}) : null;
        await this.reloadClips();
      } catch (e) {
        this.$message.error(e.message || '加载失败');
      } finally {
        this.loading = false;
      }
    },
    openEdit() {
      const plan = this.point.plan;
      if (hasSchedule(plan)) {
        this.form = {
          enabled: plan.enabled,
          weekdays: (plan.weekdays || []).slice(),
          periods: (plan.periods || []).map((p) => ({ ...p })),
          retainDays: plan.retainDays || 7,
        };
      } else {
        this.form = defaultPlan();
      }
      this.editVisible = true;
    },
    toggleWeekday(value) {
      const arr = this.form.weekdays;
      const i = arr.indexOf(value);
      if (i >= 0) arr.splice(i, 1);
      else arr.push(value);
    },
    async submitEdit() {
      if (!this.form.weekdays.length) {
        this.$message.warning('请选择录像频率');
        return;
      }
      const periods = this.form.periods.filter((p) => p.start && p.end);
      if (!periods.length) {
        this.$message.warning('请填写录像时段');
        return;
      }
      try {
        await assetAPI.saveRecordPlans([this.point.id], {
          enabled: this.form.enabled,
          weekdays: this.form.weekdays,
          periods,
          retainDays: this.form.retainDays,
        });
        this.$message.success('已保存该点位录像计划');
        this.editVisible = false;
        this.load();
      } catch (e) {
        this.$message.error(e.message || '保存失败');
      }
    },
    async reloadClips() {
      if (!this.point) {
        this.clips = [];
        return;
      }
      const retainDays = this.point.plan && this.point.plan.retainDays ? this.point.plan.retainDays : 7;
      const end = Date.now();
      const start = end - retainDays * 86400000;
      try {
        const data = await assetAPI.fetchRecordings({
          pointId: this.point.id,
          startMs: start,
          endMs: end,
        });
        this.clips = (data.list || []).map((c) => Object.assign({}, c, { selected: false }));
      } catch (e) {
        this.clips = [];
        this.$message.error(e.message || '加载录像失败');
      }
    },
    toggleSelectAll(val) {
      this.visibleClips.forEach((c) => { c.selected = val; });
    },
    batchDelete() {
      const ids = this.selectedClips.map((c) => c.id);
      if (!ids.length) return;
      this.$confirm('确定删除选中的 ' + ids.length + ' 个录像文件？删除后不可恢复。', '删除提示', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      }).then(async () => {
        try {
          await assetAPI.deleteRecordings(ids);
          this.clips = this.clips.filter((c) => ids.indexOf(c.id) < 0);
          this.selectAll = false;
          this.$message.success('已删除 ' + ids.length + ' 个录像文件');
        } catch (e) {
          this.$message.error(e.message || '删除失败');
        }
      }).catch(() => {});
    },
    batchDownload() {
      const count = this.selectedClips.length;
      if (!count) return;
      this.selectedClips.forEach((c) => {
        const a = document.createElement('a');
        a.href = c.url;
        a.target = '_blank';
        a.download = c.name + '.mp4';
        a.click();
      });
      this.$message.success('开始下载 ' + count + ' 个录像文件');
    },
    preview(index) {
      this.previewIndex = index;
      this.previewVisible = true;
    },
    onPreviewClosed() {
      this.previewIndex = 0;
    },
    goPlayback(clip) {
      if (!this.point) return;
      const query = { pointId: this.point.id, pointName: this.point.name || '' };
      if (clip && clip.startMs) query.t = String(clip.startMs);
      this.$router.push({ name: 'pointRecordPlayback', query: query });
    },
  },
};
</script>

<style scoped>
.back-btn { font-size: 14px; color: #303133; padding: 0 8px 0 0; }
.detail-card {
  flex: 1;
  min-height: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  padding: 20px 24px;
  overflow: auto;
}
.detail-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.detail-title-row h3 { margin: 0; font-size: 18px; color: #303133; }
.edit-btn { margin-left: auto; }
.detail-empty-plan { margin: 12px 0 0; color: #909399; font-size: 13px; }
.detail-cycle { margin-top: 10px; color: #606266; font-size: 13px; }
.detail-meta { margin-top: 8px; color: #606266; font-size: 13px; }
.clip-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 20px 0 12px;
}
.clip-toolbar__right { display: flex; align-items: center; gap: 10px; }
.clip-empty { padding: 40px 0; }
.clip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.clip-card { min-width: 0; }
.clip-thumb {
  position: relative;
  height: 128px;
  border-radius: 8px;
  background: #1f2329;
  cursor: pointer;
}
.clip-check { position: absolute; top: 8px; left: 8px; }
.clip-play {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 36px;
  color: #fff;
}
.clip-name { margin-top: 8px; font-size: 13px; color: #303133; }
.drawer-body { padding: 0 20px 20px; }
.cycle-box {
  background: #fafbfc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #f0f2f5;
}
.cycle-row { display: flex; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 6px; }
.cycle-label { width: 80px; font-size: 13px; color: #606266; flex-shrink: 0; }
.req { color: #f56c6c; margin-left: 2px; }
.weekday-group { display: flex; flex-wrap: wrap; gap: 6px; }
.weekday {
  width: 32px; height: 32px; border-radius: 50%;
  border: 1px solid #dcdfe6; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #606266; user-select: none;
}
.weekday.active { color: #fff; background: #409eff; border-color: #409eff; }
.dash { margin: 0 6px; color: #909399; }
.del-period { margin-left: 8px; color: #f56c6c; cursor: pointer; }
.add-period { color: #409eff; font-size: 13px; cursor: pointer; }
.retain-unit { margin-left: 8px; font-size: 13px; color: #606266; }
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 20px 20px;
}
.preview-body {
  display: flex;
  gap: 16px;
  min-height: 360px;
}
.preview-player {
  flex: 1;
  min-width: 0;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}
.preview-video {
  width: 100%;
  height: 360px;
  object-fit: contain;
  background: #000;
}
.preview-meta {
  width: 260px;
  flex-shrink: 0;
  font-size: 13px;
  color: #303133;
}
.preview-meta__title {
  font-weight: 600;
  margin-bottom: 10px;
}
.preview-meta__row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  color: #606266;
}
.preview-meta__row span:last-child {
  color: #303133;
  text-align: right;
  word-break: break-all;
}
.preview-footer { display: flex; justify-content: flex-end; }
</style>

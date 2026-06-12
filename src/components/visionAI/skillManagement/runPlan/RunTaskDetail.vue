<template>
  <div class="task-detail-page" v-loading="loading">
    <!-- 页头 -->
    <div class="page-header">
      <div class="page-header__left">
        <i class="el-icon-arrow-left back-btn" @click="goBack"></i>
        <span class="page-header__title">运行任务详情（{{ taskId }}）</span>
        <span v-if="task" class="status-pill" :class="task.status ? 'is-running' : 'is-stopped'">
          <span class="status-dot"></span>
          {{ task.status ? '运行中' : '已停止' }}
        </span>
      </div>
      <div class="page-header__right">
        <el-button size="small" type="danger" plain @click="deleteTask">删除</el-button>
      </div>
    </div>

    <el-card class="detail-card" shadow="never">
      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane label="任务详情" name="detail"></el-tab-pane>
        <el-tab-pane label="任务日志" name="log"></el-tab-pane>
      </el-tabs>

      <!-- 任务详情 -->
      <div v-if="activeTab === 'detail'" class="detail-body">
        <template v-if="task">
          <div class="detail-section">
            <div class="section-title">基本信息</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">任务ID</span>
                <span class="info-value mono">{{ task.task_id }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">任务状态</span>
                <span class="info-value">
                  <span class="status-dot-inline" :class="task.status ? 'is-running' : 'is-stopped'"></span>
                  {{ task.status ? '运行中' : '已停止' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">AI技能</span>
                <span class="info-value">
                  <el-tag v-if="task.skill_kind === 'llm'" size="mini" type="warning" effect="plain">大模型</el-tag>
                  <el-tag v-else-if="task.skill_kind === 'graph'" size="mini" type="success" effect="plain">编排</el-tag>
                  {{ task.skill_name || '-' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">点位名称</span>
                <span class="info-value">{{ task.camera_name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">所属计划</span>
                <span class="info-value">
                  <a class="link-text" @click="goPlanDetail">{{ task.plan_id || '-' }}</a>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">开始时间</span>
                <span class="info-value">{{ task.start_time || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">结束时间</span>
                <span class="info-value">{{ task.end_time || '-' }}</span>
              </div>
            </div>
          </div>

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

            <template v-if="task.skill_kind !== 'llm'">
              <div class="sub-title">区域检测信息</div>
              <div class="region-block">
                <div class="region-block__head">
                  <span class="region-block__badge">
                    <i class="el-icon-crop"></i> 检测区域
                  </span>
                  <span class="region-block__state" :class="{ drawn: fenceIsDrawn }">
                    <span class="state-dot"></span>
                    {{ fenceIsDrawn ? '已绘制' : '未绘制' }}
                  </span>
                </div>
                <div class="region-block__preview">
                  <img
                    v-if="task.camera_id"
                    :src="snapshotUrl(task.camera_id)"
                    class="region-block__img"
                    @error="onPreviewError" />
                  <div class="region-block__ph">
                    <i class="el-icon-picture-outline"></i>
                    <span>点位画面预览</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </template>

        <div v-else-if="!loading" class="empty-wrap">
          <i class="el-icon-warning-outline"></i>
          <p>运行任务不存在或已被删除</p>
          <el-button size="small" @click="goBack">返回列表</el-button>
        </div>
      </div>

      <!-- 任务日志 -->
      <div v-else class="detail-body" v-loading="logsLoading">
        <div class="detail-section">
          <div class="section-title">任务状态时间轴</div>
          <div v-if="timeline.length" class="timeline-wrap">
            <div v-if="showTimelineToggle" class="timeline-toolbar">
              <span class="timeline-toolbar__hint">
                共 {{ timelineDesc.length }} 条状态记录
                <template v-if="!timelineExpanded">，中间 {{ timelineOmittedCount }} 条已折叠</template>
              </span>
              <el-button type="text" size="mini" @click="toggleTimelineExpand">
                {{ timelineExpanded ? '收起中间节点' : '展开全部' }}
                <i :class="timelineExpanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
              </el-button>
            </div>
            <div class="snake-timeline" ref="snakeTimeline">
              <svg
                v-if="snakePathD"
                class="snake-rail"
                :width="snakeSvgWidth"
                :height="snakeSvgHeight"
                :viewBox="snakeViewBox">
                <path
                  :d="snakePathD"
                  fill="none"
                  stroke="#dcdfe6"
                  stroke-width="2"
                  stroke-linecap="butt"
                  stroke-linejoin="miter"
                  vector-effect="non-scaling-stroke" />
              </svg>
              <div
                v-for="(row, rowIdx) in timelineRows"
                :key="'row-' + rowIdx"
                class="snake-row"
                :style="{ '--cols': snakeColsPerRow }">
                <template v-for="slot in snakeRowSlots(row, rowIdx)">
                  <template v-if="slot.type === 'node'">
                    <div
                      :key="slot.key + '-card'"
                      class="snake-node__card"
                      :class="slot.cell.type === 'collapse' ? 'snake-node__card--collapse' : snakeCardClass(slot.cell)"
                      :style="{ gridColumn: slot.gridCol, gridRow: 1 }"
                      @click="slot.cell.type === 'collapse' ? toggleTimelineExpand() : null">
                      <template v-if="slot.cell.type === 'collapse'">
                        <span class="snake-node__label">··· {{ slot.cell.count }} 条 ···</span>
                        <span class="snake-node__time">点击展开</span>
                      </template>
                      <template v-else>
                        <span v-if="isCurrentCell(slot.cell)" class="snake-node__badge is-current">当前</span>
                        <span v-if="isStartCell(slot.cell)" class="snake-node__badge is-start">开始</span>
                        <span class="snake-node__label">{{ slot.cell.item.label }}</span>
                        <span class="snake-node__time">{{ slot.cell.item.time || '-' }}</span>
                      </template>
                    </div>
                    <div
                      :key="slot.key + '-track'"
                      class="snake-node__track"
                      :style="{ gridColumn: slot.gridCol, gridRow: 2 }">
                      <span
                        class="snake-node__dot"
                        :class="snakeDotClass(slot.cell)"
                        :data-snake-key="slot.cell.key"></span>
                    </div>
                  </template>
                  <div
                    v-else
                    :key="slot.key"
                    class="snake-spacer"
                    :style="{ gridColumn: slot.gridCol, gridRow: '1 / 3' }"></div>
                </template>
              </div>
            </div>
          </div>
          <div v-else class="empty-sm">暂无状态记录</div>
        </div>

        <div class="detail-section">
          <div class="section-title">任务异常记录</div>
          <el-table :data="pagedErrors" stripe style="width: 100%" empty-text="暂无异常记录">
            <el-table-column prop="time" label="发生时间" width="200"></el-table-column>
            <el-table-column prop="message" label="错误信息" min-width="400" show-overflow-tooltip></el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next"
              :current-page.sync="errorPage"
              :page-size.sync="errorLimit"
              :page-sizes="[10, 20, 50]"
              :total="errors.length">
            </el-pagination>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { runPlanAPI } from '@/components/service/VisionAIService.js';
import { formatFrameExtraction, fenceDrawn } from './runPlanFormat.js';

export default {
  name: 'RunTaskDetail',
  data() {
    return {
      loading: false,
      logsLoading: false,
      logsLoaded: false,
      activeTab: 'detail',
      task: null,
      timeline: [],
      errors: [],
      errorPage: 1,
      errorLimit: 10,
      snakeColsPerRow: 4,
      timelineExpanded: false,
      timelineKeepHead: 3,
      timelineKeepTail: 2,
      timelineCollapseThreshold: 9,
      snakePathD: '',
      snakeViewBox: '0 0 0 0',
      snakeSvgWidth: 0,
      snakeSvgHeight: 0
    };
  },
  computed: {
    taskId() {
      return this.$route.params.taskId;
    },
    frameText() {
      if (this.task && this.task.frame_extraction) {
        return formatFrameExtraction(this.task.frame_extraction);
      }
      // 计划已删除时退化为帧率展示
      if (this.task && this.task.frame_rate) {
        return `${this.task.frame_rate} 帧/秒`;
      }
      return '-';
    },
    skillParamEntries() {
      const params = (this.task && this.task.skill_params) || {};
      return Object.keys(params).map(key => {
        const v = params[key];
        let value = v;
        if (Array.isArray(v)) value = v.join('、');
        else if (typeof v === 'object' && v !== null) value = JSON.stringify(v);
        else if (typeof v === 'boolean') value = v ? '开启' : '关闭';
        return { key, value };
      });
    },
    fenceIsDrawn() {
      return fenceDrawn(this.task && this.task.fence);
    },
    pagedErrors() {
      const start = (this.errorPage - 1) * this.errorLimit;
      return this.errors.slice(start, start + this.errorLimit);
    },
    /** 最新事件在最前 */
    timelineDesc() {
      return [...this.timeline].reverse();
    },
    showTimelineToggle() {
      return this.timelineDesc.length > this.timelineCollapseThreshold;
    },
    timelineOmittedCount() {
      const total = this.timelineDesc.length;
      if (this.timelineExpanded || total <= this.timelineCollapseThreshold) return 0;
      return total - this.timelineKeepHead - this.timelineKeepTail;
    },
    /** 折叠中间节点：保留最新若干 + 最早若干 */
    timelineDisplayCells() {
      const items = this.timelineDesc;
      const total = items.length;
      if (this.timelineExpanded || total <= this.timelineCollapseThreshold) {
        return items.map((item, idx) => ({
          type: 'item',
          key: 'item-' + idx,
          item,
          globalIdx: idx
        }));
      }
      const head = this.timelineKeepHead;
      const tail = this.timelineKeepTail;
      const cells = [];
      items.slice(0, head).forEach((item, idx) => {
        cells.push({ type: 'item', key: 'item-' + idx, item, globalIdx: idx });
      });
      cells.push({
        type: 'collapse',
        key: 'collapse',
        count: total - head - tail,
        globalIdx: head
      });
      items.slice(total - tail).forEach((item, idx) => {
        const globalIdx = total - tail + idx;
        cells.push({ type: 'item', key: 'item-' + globalIdx, item, globalIdx });
      });
      return cells;
    },
    /** 蛇形时间轴：按行分组 */
    timelineRows() {
      const rows = [];
      const cells = this.timelineDisplayCells;
      const n = this.snakeColsPerRow;
      for (let i = 0; i < cells.length; i += n) {
        rows.push(cells.slice(i, i + n));
      }
      return rows;
    }
  },
  watch: {
    activeTab(tab) {
      if (tab === 'log' && !this.logsLoaded) {
        this.loadLogs();
      } else if (tab === 'log') {
        this.scheduleSnakePathUpdate();
      }
    },
    timelineRows: {
      handler() {
        this.scheduleSnakePathUpdate();
      },
      deep: true
    },
    timelineExpanded() {
      this.scheduleSnakePathUpdate();
    },
    logsLoading(val) {
      if (!val) this.scheduleSnakePathUpdate();
    }
  },
  mounted() {
    this._onSnakeResize = () => this.scheduleSnakePathUpdate();
    window.addEventListener('resize', this._onSnakeResize);
    this._snakeResizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => this.scheduleSnakePathUpdate())
      : null;
  },
  beforeDestroy() {
    if (this._onSnakeResize) {
      window.removeEventListener('resize', this._onSnakeResize);
    }
    if (this._snakeResizeObserver) {
      this._snakeResizeObserver.disconnect();
    }
    if (this._snakePathTimer) clearTimeout(this._snakePathTimer);
  },
  created() {
    this.loadTask();
  },
  methods: {
    async loadTask() {
      this.loading = true;
      try {
        const res = await runPlanAPI.getRunTask(this.taskId);
        const d = res.data || {};
        this.task = d.data || null;
      } catch (e) {
        this.task = null;
        if (!(e.response && e.response.status === 404)) {
          this.$message.error('加载运行任务详情失败');
        }
      } finally {
        this.loading = false;
      }
    },
    async loadLogs() {
      this.logsLoading = true;
      try {
        const res = await runPlanAPI.getRunTaskLogs(this.taskId);
        const d = (res.data || {}).data || {};
        this.timeline = d.timeline || [];
        this.errors = d.errors || [];
        this.timelineExpanded = false;
        this.logsLoaded = true;
      } catch (e) {
        this.timeline = [];
        this.errors = [];
        this.$message.error('加载任务日志失败');
      } finally {
        this.logsLoading = false;
        this.scheduleSnakePathUpdate();
      }
    },
    toggleTimelineExpand() {
      this.timelineExpanded = !this.timelineExpanded;
      this.snakePathD = '';
      this.scheduleSnakePathUpdate(true);
    },
    bindSnakeResizeObserver() {
      const el = this.$refs.snakeTimeline;
      if (!this._snakeResizeObserver || !el) return;
      this._snakeResizeObserver.disconnect();
      this._snakeResizeObserver.observe(el);
    },
    scheduleSnakePathUpdate(immediate) {
      if (this._snakePathTimer) clearTimeout(this._snakePathTimer);
      const delay = immediate ? 0 : 40;
      this._snakePathTimer = setTimeout(() => {
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => this.updateSnakePath(0));
          });
        });
      }, delay);
    },
    snakeOrderedCells() {
      const ordered = [];
      this.timelineRows.forEach(row => {
        // 奇数行已用 direction:rtl 布局，数组顺序即蛇形路径顺序，勿再 reverse
        ordered.push.apply(ordered, row);
      });
      return ordered;
    },
    updateSnakePath(retry) {
      if (retry === undefined) retry = 0;
      const container = this.$refs.snakeTimeline;
      if (!container || this.activeTab !== 'log') {
        this.snakePathD = '';
        return;
      }
      this.bindSnakeResizeObserver();
      const cells = this.snakeOrderedCells();
      if (cells.length < 2) {
        this.snakePathD = '';
        return;
      }
      const cRect = container.getBoundingClientRect();
      if (!cRect.width || !cRect.height) {
        if (retry < 5) this.scheduleSnakePathRetry(retry + 1);
        return;
      }
      const points = [];
      let missing = false;
      cells.forEach(cell => {
        const dot = container.querySelector('.snake-node__dot[data-snake-key="' + cell.key + '"]');
        if (!dot) {
          missing = true;
          return;
        }
        const dRect = dot.getBoundingClientRect();
        points.push({
          x: dRect.left + dRect.width / 2 - cRect.left,
          y: dRect.top + dRect.height / 2 - cRect.top
        });
      });
      if (missing || points.length !== cells.length) {
        if (retry < 5) this.scheduleSnakePathRetry(retry + 1);
        return;
      }
      const rowEnds = new Set();
      let offset = 0;
      this.timelineRows.forEach(row => {
        offset += row.length - 1;
        rowEnds.add(offset);
        offset += 1;
      });
      const fmt = n => Number(n.toFixed(1));
      const rowIndexOf = pointIdx => {
        let seen = 0;
        for (let r = 0; r < this.timelineRows.length; r++) {
          seen += this.timelineRows[r].length;
          if (pointIdx < seen) return r;
        }
        return 0;
      };
      let d = 'M ' + fmt(points[0].x) + ' ' + fmt(points[0].y);
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        if (rowEnds.has(i - 1)) {
          const rowIdx = rowIndexOf(i - 1);
          const turnX = rowIdx % 2 === 0
            ? Math.max(prev.x, curr.x)
            : Math.min(prev.x, curr.x);
          // 行间折返：水平 → 垂直 → 水平（严格正交）
          if (Math.abs(prev.x - turnX) > 0.5) {
            d += ' L ' + fmt(turnX) + ' ' + fmt(prev.y);
          }
          d += ' L ' + fmt(turnX) + ' ' + fmt(curr.y);
          if (Math.abs(curr.x - turnX) > 0.5) {
            d += ' L ' + fmt(curr.x) + ' ' + fmt(curr.y);
          }
        } else if (Math.abs(prev.y - curr.y) > 0.5) {
          d += ' L ' + fmt(curr.x) + ' ' + fmt(prev.y);
          d += ' L ' + fmt(curr.x) + ' ' + fmt(curr.y);
        } else {
          d += ' L ' + fmt(curr.x) + ' ' + fmt(curr.y);
        }
      }
      this.snakeViewBox = '0 0 ' + fmt(cRect.width) + ' ' + fmt(cRect.height);
      this.snakeSvgWidth = fmt(cRect.width);
      this.snakeSvgHeight = fmt(cRect.height);
      this.snakePathD = d;
    },
    scheduleSnakePathRetry(retry) {
      if (this._snakePathTimer) clearTimeout(this._snakePathTimer);
      this._snakePathTimer = setTimeout(() => {
        this.$nextTick(() => {
          requestAnimationFrame(() => this.updateSnakePath(retry));
        });
      }, 60);
    },
    snakeRowSlots(row, rowIdx) {
      const cols = this.snakeColsPerRow;
      const fromRight = rowIdx % 2 === 1;
      const slots = row.map((cell, colIdx) => ({
        type: 'node',
        cell,
        key: cell.key,
        gridCol: fromRight ? cols - colIdx : colIdx + 1
      }));
      const used = {};
      slots.forEach(s => { used[s.gridCol] = true; });
      for (let c = 1; c <= cols; c++) {
        if (!used[c]) {
          slots.push({ type: 'spacer', key: 'spacer-' + rowIdx + '-' + c, gridCol: c });
        }
      }
      return slots;
    },
    isCurrentCell(cell) {
      return cell.type === 'item' && cell.globalIdx === 0;
    },
    isStartCell(cell) {
      if (cell.type !== 'item') return false;
      if (this.timelineDesc.length <= 1) return false;
      const lastIdx = this.timelineDesc.length - 1;
      return cell.globalIdx === lastIdx || cell.item.event === 'created';
    },
    snakeCardClass(cell) {
      return {
        'is-current': this.isCurrentCell(cell),
        'is-start': this.isStartCell(cell),
        'is-error': cell.item.event === 'error'
      };
    },
    snakeDotClass(cell) {
      if (cell.type === 'collapse') return 'dot-collapse';
      const item = cell.item;
      if (item.event === 'error') return 'dot-danger';
      if (item.event === 'running') return 'dot-success';
      if (this.isCurrentCell(cell)) return 'dot-primary';
      if (this.isStartCell(cell)) return 'dot-start';
      return 'dot-default';
    },
    goBack() {
      this.$router.push('/skillManage/runPlan?tab=task');
    },
    goPlanDetail() {
      if (this.task && this.task.plan_id) {
        this.$router.push(`/skillManage/runPlan/detail/${this.task.plan_id}`);
      }
    },
    snapshotUrl(cameraId) {
      return runPlanAPI.getCameraSnapshotUrl(cameraId);
    },
    onPreviewError(e) {
      if (e && e.target) e.target.style.display = 'none';
    },
    async deleteTask() {
      try {
        await this.$confirm(`确认删除任务「${this.taskId}」？`, '删除确认', { type: 'warning' });
        await runPlanAPI.deleteRunTask(this.taskId);
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
.task-detail-page {
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

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 12px;
}
.status-pill .status-dot { width: 7px; height: 7px; border-radius: 50%; }
.status-pill.is-running { color: #67c23a; background: #f0f9eb; }
.status-pill.is-running .status-dot { background: #67c23a; }
.status-pill.is-stopped { color: #909399; background: #f5f7fa; }
.status-pill.is-stopped .status-dot { background: #c0c4cc; }

/* 卡片 */
.detail-card { border-radius: 10px; border: none; }
.detail-card >>> .el-card__body { padding: 0; }
.detail-tabs { padding: 6px 20px 0; }
.detail-tabs >>> .el-tabs__header { margin-bottom: 0; }
.detail-tabs >>> .el-tabs__nav-wrap::after { height: 1px; background: #f0f2f5; }
.detail-tabs >>> .el-tabs__item { font-size: 14px; }

.detail-body { padding: 20px; }

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
.link-text {
  color: #409eff;
  cursor: pointer;
  font-family: 'SF Mono', 'Roboto Mono', Consolas, monospace;
}
.link-text:hover { text-decoration: underline; }

.status-dot-inline {
  display: inline-block; width: 7px; height: 7px;
  border-radius: 50%; margin-right: 6px; vertical-align: middle;
}
.status-dot-inline.is-running { background: #67c23a; box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.25); }
.status-dot-inline.is-stopped { background: #c0c4cc; }

/* 区域检测 */
.region-block {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  overflow: hidden;
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

/* 蛇形时间轴 */
.timeline-wrap {
  padding: 16px 16px 12px;
  background: #fafbfc;
  border-radius: 10px;
  overflow-x: auto;
}
.timeline-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
}
.timeline-toolbar__hint {
  font-size: 12px;
  color: #909399;
}
.snake-timeline {
  position: relative;
  min-width: 640px;
}
.snake-rail {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
  overflow: visible;
}

.snake-row {
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  grid-template-rows: 1fr 24px;
  column-gap: 0;
  row-gap: 8px;
  position: relative;
  z-index: 1;
  margin-bottom: 28px;
  min-height: 88px;
  align-items: end;
}
.snake-row:last-child { margin-bottom: 0; }
.snake-spacer { pointer-events: none; }

.snake-node__card {
  position: relative;
  justify-self: center;
  align-self: end;
  width: 100%;
  max-width: 132px;
  min-height: 54px;
  padding: 10px 10px 8px;
  margin-bottom: 0;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  text-align: center;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.snake-node__badge {
  position: absolute;
  top: -9px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  line-height: 16px;
  padding: 0 7px;
  border-radius: 8px;
  white-space: nowrap;
  font-weight: 600;
}
.snake-node__badge.is-current {
  background: #409eff;
  color: #fff;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.35);
}
.snake-node__badge.is-start {
  background: #909399;
  color: #fff;
}
.snake-node__card.is-current {
  border-color: #b3d8ff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.12);
}
.snake-node__card.is-start {
  border-color: #d3d4d6;
}
.snake-node__card--collapse {
  cursor: pointer;
  border-style: dashed;
  border-color: #c6e2ff;
  background: #f5faff;
}
.snake-node__card--collapse:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.12);
}
.snake-node__card--collapse .snake-node__label { color: #409eff; }
.snake-node__card.is-error .snake-node__label { color: #f56c6c; }
.snake-node__label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  word-break: break-all;
}
.snake-node__time {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #909399;
  line-height: 1.3;
  word-break: break-all;
}
.snake-node__card.is-current .snake-node__time { color: #79bbff; }

.snake-node__track {
  position: relative;
  justify-self: center;
  width: 100%;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.snake-node__dot {
  position: relative;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #dcdfe6;
  background: #fff;
  box-sizing: border-box;
  flex-shrink: 0;
}
.snake-node__dot.dot-default {
  border-color: #dcdfe6;
  background: #f5f7fa;
}
.snake-node__dot.dot-success {
  border-color: #67c23a;
  background: #67c23a;
}
.snake-node__dot.dot-danger {
  border-color: #f56c6c;
  background: #f56c6c;
}
.snake-node__dot.dot-primary {
  border-color: #409eff;
  background: #409eff;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.18);
  animation: snake-dot-pulse 2s infinite;
}
.snake-node__dot.dot-start {
  border-color: #909399;
  background: #909399;
  box-shadow: 0 0 0 3px rgba(144, 147, 153, 0.2);
}
.snake-node__dot.dot-collapse {
  width: 10px;
  height: 10px;
  border-color: #409eff;
  background: #ecf5ff;
}
@keyframes snake-dot-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.18); }
  50% { box-shadow: 0 0 0 7px rgba(64, 158, 255, 0.08); }
}

.empty-sm { color: #c0c4cc; font-size: 13px; padding: 24px 0; }

.pagination-wrapper {
  display: flex; justify-content: flex-end;
  padding: 14px 0 0;
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
  .snake-timeline { min-width: 480px; }
  .snake-node__card { max-width: 108px; padding: 6px 8px; }
}
</style>

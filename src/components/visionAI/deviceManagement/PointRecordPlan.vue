<template>
  <div class="asset-page record-plan-page">
    <div class="asset-page-header">
      <div class="asset-page-header__main">
        <div class="asset-page-title-row">
          <div class="asset-page-icon asset-page-icon--video">
            <i class="el-icon-video-camera-solid" />
          </div>
          <h2 class="asset-page-title">点位录像计划</h2>
        </div>
        <p class="asset-page-desc">
          默认不录像。勾选需要录像的点位，再「批量配置录像计划」——只录这些点位、只在所选星期和时段录。看录像请到「录像回放」，可拖动时间轴定位。
        </p>
      </div>
      <div class="asset-page-header__actions">
        <span class="asset-link-btn" @click="$router.push({ name: 'pointRecordPlayback' })">
          录像回放 <i class="el-icon-arrow-right" />
        </span>
        <span class="asset-link-btn" @click="$router.push({ name: 'pointManage' })">
          前往点位管理 <i class="el-icon-arrow-right" />
        </span>
      </div>
    </div>

    <div class="asset-layout">
      <aside class="asset-sidebar">
        <div class="asset-sidebar__head">
          <span class="asset-sidebar__head-title"><i class="el-icon-office-building" />组织筛选</span>
          <el-checkbox v-model="includeSubOrg" size="small" @change="onIncludeSubChange">包含下级</el-checkbox>
        </div>
        <div class="asset-sidebar__body">
          <div v-if="!orgTree.length" class="asset-sidebar__empty">
            <i class="el-icon-office-building" />
            暂无组织数据
          </div>
          <el-tree
            v-else
            :data="orgTree"
            node-key="id"
            :props="{ label: 'title', children: 'children' }"
            highlight-current
            default-expand-all
            @node-click="onOrgSelect"
          />
        </div>
      </aside>

      <main class="asset-main">
        <div class="asset-toolbar">
          <div class="asset-toolbar__left">
            <el-button size="small" :type="showFilter ? 'primary' : 'default'" plain @click="toggleFilter">
              <i class="el-icon-s-operation" /> 筛选
            </el-button>
          </div>
          <div class="asset-toolbar__right">
            <span v-if="selectedRows.length" class="selected-hint">已选 {{ selectedRows.length }} 个点位</span>
            <el-button size="small" :disabled="!selectedRows.length" @click="batchDisable">批量停用</el-button>
            <el-button size="small" :disabled="!selectedRows.length" @click="batchEnable">批量启用</el-button>
            <el-button type="primary" size="small" :disabled="!selectedRows.length" @click="openBatchConfig">
              批量配置录像计划
            </el-button>
          </div>
        </div>

        <div v-show="showFilter" class="record-filter-panel">
          <div class="record-filter-item">
            <span class="record-filter-label">点位名称</span>
            <el-input v-model="filters.name" size="small" placeholder="请输入点位名称" clearable @keyup.enter.native="onSearch" />
          </div>
          <div class="record-filter-item">
            <span class="record-filter-label">点位状态</span>
            <el-select v-model="filters.status" size="small" placeholder="全部状态" clearable>
              <el-option label="全部状态" value="" />
              <el-option label="在线" value="active" />
              <el-option label="空闲" value="idle" />
              <el-option label="异常" value="abnormal" />
            </el-select>
          </div>
          <div class="record-filter-item">
            <span class="record-filter-label">点位类型</span>
            <el-select v-model="filters.type" size="small" placeholder="全部类型" clearable>
              <el-option label="全部类型" value="" />
              <el-option label="设备点位" value="device" />
              <el-option label="国标平台点位" value="gb28181" />
              <el-option label="虚拟点位" value="virtual" />
            </el-select>
          </div>
          <div class="record-filter-item">
            <span class="record-filter-label">录像配置</span>
            <el-select v-model="filters.config" size="small">
              <el-option label="全部配置状态" value="" />
              <el-option label="已配置" value="已配置" />
              <el-option label="未配置" value="未配置" />
            </el-select>
          </div>
          <div class="record-filter-item">
            <span class="record-filter-label">计划启停</span>
            <el-select v-model="filters.enabled" size="small">
              <el-option label="全部启停状态" value="" />
              <el-option label="启用" value="on" />
              <el-option label="停用" value="off" />
            </el-select>
          </div>
          <div class="record-filter-actions">
            <el-button size="small" @click="resetSearch">重置</el-button>
            <el-button type="primary" size="small" @click="onSearch">查询</el-button>
          </div>
        </div>

        <div ref="assetTableWrap" class="asset-table-wrap">
          <el-table
            ref="table"
            v-loading="loading"
            :data="list"
            stripe
            row-key="id"
            :height="assetTableHeight"
            @selection-change="onSelectionChange"
          >
            <template slot="empty">
              <asset-empty-state
                icon="el-icon-video-camera"
                title="暂无点位"
                description="请先在点位管理中建点，再回来勾选需要录像的点位"
              >
                <el-button type="primary" size="small" @click="$router.push({ name: 'pointManage' })">前往点位管理</el-button>
              </asset-empty-state>
            </template>
            <el-table-column type="selection" width="48" align="center" reserve-selection />
            <el-table-column prop="name" label="点位名称" min-width="160" show-overflow-tooltip>
              <template slot-scope="{ row }">
                <a class="point-name-link" @click="viewPlan(row)">{{ row.name }}</a>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="点位状态" width="110" align="center">
              <template slot-scope="{ row }">
                <span class="asset-status-text" :class="statusTextClass(row.status)">
                  <span class="asset-status-dot" :class="statusDotClass(row.status)" />
                  {{ row.status }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="orgName" label="所属组织" min-width="120" show-overflow-tooltip />
            <el-table-column prop="type" label="点位类型" width="130" show-overflow-tooltip />
            <el-table-column label="录像配置状态" width="130" align="center">
              <template slot-scope="{ row }">
                <span
                  class="config-tag"
                  :class="{
                    'config-tag--on': row.configStatus === '已配置' && row.recordMode !== 'always',
                    'config-tag--always': row.recordMode === 'always',
                  }"
                >{{ configStatusText(row) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="计划启停" width="110" align="center">
              <template slot-scope="{ row }">
                <el-tooltip
                  :content="enabledTip(row)"
                  placement="top"
                >
                  <el-switch
                    :value="row.planEnabled"
                    :disabled="row.configStatus !== '已配置'"
                    active-text="启用"
                    inactive-text="停用"
                    @change="(val) => onToggleEnabled(row, val)"
                  />
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" align="center">
              <template slot-scope="{ row }">
                <el-button type="text" @click="viewPlayback(row)">看录像</el-button>
                <el-button type="text" @click="viewPlan(row)">查看计划</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="total > 0" class="asset-pagination">
            <el-pagination
              background
              layout="total, prev, pager, next"
              :total="total"
              :page-size="pageSize"
              :current-page.sync="page"
              @current-change="applyPageSlice"
            />
          </div>
        </div>
      </main>
    </div>

    <el-drawer
      :visible.sync="drawerVisible"
      title="批量配置录像计划"
      size="560px"
      :wrapper-closable="false"
      custom-class="record-plan-drawer"
    >
      <div class="drawer-body">
        <div class="drawer-tip">
          <i class="el-icon-info" />
          只会给下面这 {{ selectedRows.length }} 个点位写计划，其它点位仍然不录像。
        </div>
        <div class="selected-points">
          <span class="selected-points__label">已选点位</span>
          <el-tag
            v-for="row in selectedRows.slice(0, 8)"
            :key="row.id"
            size="small"
            type="primary"
            effect="plain"
          >{{ row.name }}</el-tag>
          <span v-if="selectedRows.length > 8" class="selected-points__more">等 {{ selectedRows.length }} 个</span>
        </div>

        <el-form label-width="100px" size="small">
          <el-form-item label="计划启停">
            <el-switch v-model="form.enabled" active-text="开启" inactive-text="关闭" />
          </el-form-item>
          <el-form-item label="录像周期" required>
            <el-radio-group value="loop" size="small">
              <el-radio-button label="loop">循环</el-radio-button>
            </el-radio-group>
            <div class="form-hint">重复执行：只在勾选的星期、填写的时段内录像</div>
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
            <i v-if="i > 0" class="el-icon-delete del-period" @click="removePeriod(i)" />
          </div>
          <a v-if="form.periods.length < 5" class="add-period" @click="addPeriod">
            <i class="el-icon-plus" /> 添加时段 ({{ form.periods.length }}/5)
          </a>
        </div>

        <el-form label-width="100px" size="small" style="margin-top: 16px;">
          <el-form-item label="录像保留" required>
            <el-input-number v-model="form.retainDays" :min="1" :max="365" size="small" />
            <span class="retain-unit">天</span>
            <div class="form-hint">1–365 的整数；到期后由录像服务按点位保留天数清理</div>
          </el-form-item>
        </el-form>
      </div>
      <div class="drawer-footer">
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="submitConfig">确定</el-button>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import './asset-page.css';
import { assetAPI } from '../../service/AssetService.js';
import AssetEmptyState from './AssetEmptyState.vue';
import assetTableLayout from './assetTableLayout.js';
import {
  pointStatusBucket,
  streamStatusDotClass,
  streamStatusTextClass,
} from './assetStreamStatus.js';
import {
  WEEK_DAYS,
  defaultPlan,
  mergePointWithPlan,
  configStatusText,
} from './recordPlanStore.js';

function emptyFilters() {
  return { name: '', status: '', type: '', config: '', enabled: '' };
}

export default {
  name: 'PointRecordPlan',
  components: { AssetEmptyState },
  mixins: [assetTableLayout],
  data() {
    return {
      loading: false,
      showFilter: true,
      orgTree: [],
      includeSubOrg: true,
      selectedOrgId: '',
      allRows: [],
      list: [],
      total: 0,
      page: 1,
      pageSize: 10,
      filters: emptyFilters(),
      selectedRows: [],
      drawerVisible: false,
      weekDays: WEEK_DAYS,
      form: defaultPlan(),
      plansMap: {},
    };
  },
  mounted() {
    this.loadOrgs();
    this.load();
  },
  methods: {
    statusTextClass: streamStatusTextClass,
    statusDotClass: streamStatusDotClass,
    configStatusText,
    async loadOrgs() {
      try {
        const orgs = await assetAPI.fetchOrganizations();
        this.orgTree = Array.isArray(orgs) ? orgs : [];
      } catch (e) {
        this.orgTree = [];
      }
    },
    onOrgSelect(node) {
      this.selectedOrgId = node.id || node.key;
      this.page = 1;
      this.load();
    },
    onIncludeSubChange() {
      this.page = 1;
      this.load();
    },
    toggleFilter() {
      this.showFilter = !this.showFilter;
      this.updateAssetTableHeight();
    },
    onSearch() {
      this.page = 1;
      this.load();
    },
    resetSearch() {
      this.filters = emptyFilters();
      this.selectedOrgId = '';
      this.page = 1;
      this.load();
    },
    async load() {
      this.loading = true;
      try {
        const [data, plans] = await Promise.all([
          assetAPI.fetchPoints({
            page: 1,
            pageSize: 2000,
            key: (this.filters.name || '').trim(),
            type: this.filters.type || '',
            orgId: this.selectedOrgId || '',
            includeSub: this.includeSubOrg,
          }),
          assetAPI.fetchRecordPlans().catch(() => ({})),
        ]);
        this.plansMap = plans || {};
        const rows = (data.list || []).map((p) => mergePointWithPlan(p, this.plansMap));
        this.allRows = this.applyLocalFilters(rows);
        this.total = this.allRows.length;
        this.applyPageSlice();
      } catch (e) {
        this.$message.error(e.message || '加载失败');
      } finally {
        this.loading = false;
        this.updateAssetTableHeight();
      }
    },
    applyLocalFilters(rows) {
      return rows.filter((row) => {
        if (this.filters.status && pointStatusBucket(row) !== this.filters.status) return false;
        if (this.filters.config && row.configStatus !== this.filters.config) return false;
        if (this.filters.enabled === 'on' && !row.planEnabled) return false;
        if (this.filters.enabled === 'off' && row.planEnabled) return false;
        return true;
      });
    },
    applyPageSlice() {
      const start = (this.page - 1) * this.pageSize;
      this.list = this.allRows.slice(start, start + this.pageSize);
    },
    onSelectionChange(rows) {
      this.selectedRows = rows;
    },
    openBatchConfig() {
      if (!this.selectedRows.length) {
        this.$message.warning('请先勾选需要录像的点位');
        return;
      }
      const first = this.selectedRows.find((r) => r.plan) || this.selectedRows[0];
      this.form = first.plan
        ? {
            enabled: first.plan.enabled,
            weekdays: (first.plan.weekdays || []).slice(),
            periods: (first.plan.periods || []).map((p) => ({ ...p })),
            retainDays: first.plan.retainDays || 7,
          }
        : defaultPlan();
      this.drawerVisible = true;
    },
    toggleWeekday(value) {
      const arr = this.form.weekdays;
      const i = arr.indexOf(value);
      if (i >= 0) arr.splice(i, 1);
      else arr.push(value);
    },
    addPeriod() {
      if (this.form.periods.length >= 5) return;
      this.form.periods.push({ start: '00:00', end: '23:59' });
    },
    removePeriod(i) {
      this.form.periods.splice(i, 1);
    },
    async submitConfig() {
      if (!this.form.weekdays.length) {
        this.$message.warning('请选择录像频率');
        return;
      }
      const periods = this.form.periods.filter((p) => p.start && p.end);
      if (!periods.length) {
        this.$message.warning('请填写录像时段');
        return;
      }
      const ids = this.selectedRows.map((r) => r.id);
      try {
        await assetAPI.saveRecordPlans(ids, {
          enabled: this.form.enabled,
          weekdays: this.form.weekdays,
          periods,
          retainDays: this.form.retainDays,
        });
        this.$message.success(`已为 ${ids.length} 个点位配置录像计划，未勾选的点位仍不录像`);
        this.drawerVisible = false;
        this.selectedRows = [];
        if (this.$refs.table) this.$refs.table.clearSelection();
        this.load();
      } catch (e) {
        this.$message.error(e.message || '保存失败');
      }
    },
    configuredSelection() {
      return this.selectedRows.filter((r) => r.configStatus === '已配置');
    },
    batchEnable() {
      this.confirmBatch(true);
    },
    batchDisable() {
      this.confirmBatch(false);
    },
    confirmBatch(enabled) {
      const rows = this.configuredSelection();
      if (!rows.length) {
        this.$message.warning('请先给勾选的点位配置录像计划，未配置的点位不会录像');
        return;
      }
      const action = enabled ? '启用' : '停用';
      this.$confirm(
        `${action}后仅这 ${rows.length} 个已配置点位会${enabled ? '按计划录像' : '停止录像'}，未配置点位不受影响。`,
        `批量${action} ${rows.length} 个计划`,
        { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
      ).then(async () => {
        try {
          await assetAPI.setRecordPlansEnabled(rows.map((r) => r.id), enabled);
          this.$message.success(`${rows.length} 个录像计划已${action}`);
          this.selectedRows = [];
          if (this.$refs.table) this.$refs.table.clearSelection();
          this.load();
        } catch (e) {
          this.$message.error(e.message || '操作失败');
        }
      }).catch(() => {});
    },
    enabledTip(row) {
      if (row.recordMode === 'always') return '关掉后停止全天录像';
      if (row.configStatus === '已配置') return '停用后该点位不再录像';
      return '请先勾选点位并配置录像计划';
    },
    async onToggleEnabled(row, val) {
      if (row.configStatus !== '已配置') return;
      try {
        await assetAPI.setRecordPlansEnabled([row.id], val);
        this.$message.success(val ? '已启用该点位录像' : '已停用该点位录像');
        this.load();
      } catch (e) {
        this.$message.error(e.message || '操作失败');
      }
    },
    viewPlan(row) {
      this.$router.push({ name: 'pointRecordPlanDetail', params: { pointId: row.id } });
    },
    viewPlayback(row) {
      this.$router.push({
        name: 'pointRecordPlayback',
        query: { pointId: row.id, pointName: row.name || '' },
      });
    },
  },
};
</script>

<style scoped>
.selected-hint {
  color: #606266;
  font-size: 13px;
  margin-right: 4px;
}
.point-name-link {
  color: #409eff;
  cursor: pointer;
}
.config-tag {
  color: #303133;
  font-size: 13px;
}
.config-tag--on {
  background: #e8ffea;
  color: #00b42a;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
}
.config-tag--always {
  background: #fff7e8;
  color: #ff7d00;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
}
.record-filter-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px 20px;
  padding: 14px 16px;
  background: #f7f8fa;
  border-bottom: 1px solid #f0f2f5;
  flex-shrink: 0;
}
.record-filter-item {
  display: flex;
  align-items: center;
  min-width: 0;
}
.record-filter-label {
  width: 72px;
  flex-shrink: 0;
  font-size: 13px;
  color: #303133;
}
.record-filter-item .el-input,
.record-filter-item .el-select {
  flex: 1;
  min-width: 0;
}
.record-filter-actions {
  grid-column: 3;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
}
.drawer-body { padding: 0 20px 20px; }
.drawer-tip {
  background: #ecf5ff;
  color: #409eff;
  font-size: 13px;
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}
.drawer-tip i { margin-right: 6px; }
.selected-points {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}
.selected-points__label {
  font-size: 13px;
  color: #606266;
}
.selected-points__more { font-size: 12px; color: #909399; }
.form-hint { color: #909399; font-size: 12px; line-height: 1.5; margin-top: 6px; }
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
  cursor: pointer; color: #606266; transition: all 0.15s;
  user-select: none;
}
.weekday.active { color: #fff; background: #409eff; border-color: #409eff; }
.dash { margin: 0 6px; color: #909399; font-size: 13px; }
.del-period { margin-left: 8px; color: #f56c6c; cursor: pointer; font-size: 16px; }
.add-period { color: #409eff; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; }
.retain-unit { margin-left: 8px; color: #606266; font-size: 13px; }
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 20px 20px;
}
</style>

<style>
.record-plan-drawer .el-drawer__header { margin-bottom: 12px; padding: 16px 20px 0; }
.record-plan-drawer .el-drawer__body { padding: 0; display: flex; flex-direction: column; }
</style>

<template>
  <div class="asset-page point-manage-page">
    <div class="asset-page-header">
      <div class="asset-page-header__main">
        <div class="asset-page-title-row">
          <div class="asset-page-icon asset-page-icon--point">
            <i class="el-icon-location-outline" />
          </div>
          <h2 class="asset-page-title">点位管理</h2>
        </div>
        <p class="asset-page-desc">
          AI 任务与实时监控均基于「点位」。从 GoWVP 通道批量建点，或通过 RTSP 拉流、RTMP 推流（含文件推流）创建虚拟点位。
          拉流点位支持 CSV 批量导入/导出；国标录像机请先在设备接入后，再「从通道建点」
        </p>
      </div>
      <div class="asset-page-header__actions">
        <span class="asset-link-btn" @click="$router.push({ name: 'camera' })">
          查看 AI 摄像头 <i class="el-icon-arrow-right" />
        </span>
      </div>
    </div>

    <div class="asset-stat-row">
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--total">
          <i class="el-icon-location" />
        </div>
        <div>
          <div class="asset-stat-card__value">{{ pointStats.total }}</div>
          <div class="asset-stat-card__label">点位总数</div>
          <div v-if="pointStats.virtual > 0" class="asset-stat-card__sub">
            含虚拟点位 {{ pointStats.virtual }} 个
          </div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--online">
          <i class="el-icon-video-camera" />
        </div>
        <div>
          <div class="asset-stat-card__value">{{ pointStats.active }}</div>
          <div class="asset-stat-card__label">活跃</div>
          <div class="asset-stat-card__sub">在线 / 拉流中 / 推流中</div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--idle">
          <i class="el-icon-video-pause" />
        </div>
        <div>
          <div class="asset-stat-card__value">{{ pointStats.idle }}</div>
          <div class="asset-stat-card__label">空闲</div>
          <div class="asset-stat-card__sub">未拉流 / 已停止</div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--offline">
          <i class="el-icon-warning-outline" />
        </div>
        <div>
          <div class="asset-stat-card__value">{{ pointStats.sourceBad || pointStats.offline }}</div>
          <div class="asset-stat-card__label">需关注</div>
          <div class="asset-stat-card__sub">
            <template v-if="pointStats.sourceBad">源异常 {{ pointStats.sourceBad }}</template>
            <template v-if="pointStats.sourceBad && pointStats.offline"> · </template>
            <template v-if="pointStats.offline">离线 {{ pointStats.offline }}</template>
            <template v-if="!pointStats.sourceBad && !pointStats.offline">暂无</template>
          </div>
        </div>
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
            <el-input
              v-model="searchKey"
              placeholder="搜索点位名称"
              clearable
              size="small"
              style="width: 200px"
              @keyup.enter.native="onSearch"
              @clear="onSearch"
            >
              <i slot="prefix" class="el-icon-search" />
            </el-input>
            <el-select
              v-model="typeFilter"
              placeholder="点位类型"
              clearable
              size="small"
              style="width: 130px"
              @change="onSearch"
            >
              <el-option label="设备点位" value="device" />
              <el-option label="国标平台点位" value="gb28181" />
              <el-option label="虚拟点位" value="virtual" />
            </el-select>
            <el-button size="small" type="primary" plain @click="onSearch">查询</el-button>
            <el-button size="small" @click="resetSearch">重置</el-button>
          </div>
          <div class="asset-toolbar__right">
            <el-dropdown
              trigger="click"
              placement="bottom-start"
              popper-class="stream-batch-dropdown"
              :disabled="csvBusy"
              @command="onStreamCsvCommand"
            >
              <el-button class="stream-batch-drop-btn" size="small" :loading="csvBusy">
                拉流批量操作<i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="export">导出拉流点位</el-dropdown-item>
                <el-dropdown-item command="template">下载导入模板</el-dropdown-item>
                <el-dropdown-item divided command="import">从 CSV 导入</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <input
              ref="streamCsvInput"
              type="file"
              accept=".csv,text/csv"
              style="display:none"
              @change="onStreamCsvSelected"
            />
            <el-button size="small" icon="el-icon-link" @click="showStream = true">拉流建点</el-button>
            <el-button size="small" icon="el-icon-upload" @click="showFile = true">推流建点</el-button>
            <el-button size="small" type="primary" icon="el-icon-plus" @click="openBatch">从通道建点</el-button>
          </div>
        </div>

        <div ref="assetTableWrap" class="asset-table-wrap">
          <el-table v-loading="loading" :data="list" stripe :height="assetTableHeight">
            <template slot="empty">
              <asset-empty-state
                icon="el-icon-location-outline"
                title="暂无点位"
                description="请先从 GoWVP 通道批量建点，或通过 RTSP 拉流 / RTMP 推流创建虚拟点位"
              >
                <el-button type="primary" size="small" icon="el-icon-plus" @click="openBatch">从通道建点</el-button>
                <el-button size="small" icon="el-icon-link" @click="showStream = true">拉流建点</el-button>
                <el-button size="small" icon="el-icon-upload" @click="showFile = true">推流建点</el-button>
              </asset-empty-state>
            </template>
            <el-table-column prop="name" label="点位名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template slot-scope="{ row }">
                <span
                  class="asset-status-text"
                  :class="statusTextClass(row.status)"
                >
                  <span
                    class="asset-status-dot"
                    :class="statusDotClass(row.status)"
                  />
                  {{ row.status }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="源状态" width="120" align="center">
              <template slot-scope="{ row }">
                <template v-if="row.pointType === 'virtual' && row.virtualMode === 'stream'">
                  <el-tooltip :content="sourceTooltip(row)" placement="top">
                    <el-tag size="mini" :type="sourceTagType(displaySourceStatus(row))">
                      {{ displaySourceStatusText(row) || '未检测' }}
                    </el-tag>
                  </el-tooltip>
                  <el-button
                    type="text"
                    size="mini"
                    icon="el-icon-refresh"
                    :loading="!!rowProbing[row.id]"
                    title="立即检测源地址"
                    @click="handleProbeRow(row)"
                  />
                </template>
                <span v-else class="cell-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="orgName" label="组织" width="120" show-overflow-tooltip />
            <el-table-column prop="type" label="点位类型" width="120">
              <template slot-scope="{ row }">
                <el-tag size="mini" effect="plain">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="mainType" label="主体类型" width="100" />
            <el-table-column prop="source" label="来源设备" min-width="130" show-overflow-tooltip />
            <el-table-column prop="gbCode" label="国标编码" min-width="150" show-overflow-tooltip>
              <template slot-scope="{ row }">{{ row.gbCode && row.gbCode !== '-' ? row.gbCode : '-' }}</template>
            </el-table-column>
            <el-table-column prop="channelId" label="通道 ID" min-width="130" show-overflow-tooltip>
              <template slot-scope="{ row }">
                <span class="mono-text">{{ row.channelId || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="推流" width="90" align="center">
              <template slot-scope="{ row }">
                <template v-if="row.pointType === 'virtual' && row.virtualMode === 'file'">
                  <el-button v-if="!row.running" type="text" size="small" @click="handleStart(row)">启动</el-button>
                  <el-button v-else type="text" size="small" class="btn-warn-text" @click="handleStop(row)">停止</el-button>
                </template>
                <span v-else class="cell-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right" align="center">
              <template slot-scope="{ row }">
                <el-button type="text" class="btn-danger-text" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog title="从通道批量建点" :visible.sync="showBatch" width="760px" @open="loadChannels">
      <p class="asset-dialog-tip">以下通道来自 GoWVP 且尚未建点，勾选后批量创建 AI 点位</p>
      <el-form inline class="batch-form">
        <el-form-item label="所属组织">
          <el-radio-group v-model="batchForm.inheritOrg" size="small">
            <el-radio :label="true">延续设备组织</el-radio>
            <el-radio :label="false">自定义</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="!batchForm.inheritOrg">
          <el-select v-model="batchForm.orgId" placeholder="选择组织" size="small" style="width:200px">
            <el-option v-for="o in orgOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <el-table
        ref="channelTable"
        v-loading="channelLoading"
        :data="channels"
        stripe
        max-height="360"
        @selection-change="sel => (selected = sel)"
      >
        <template slot="empty">
          <asset-empty-state
            compact
            icon="el-icon-link"
            title="暂无可用通道"
            description="请先在「设备接入」添加设备并等待上线，或当前组织下通道已全部建点"
          />
        </template>
        <el-table-column type="selection" width="45" />
        <el-table-column prop="channelName" label="通道" min-width="140" />
        <el-table-column prop="deviceName" label="设备" min-width="120" />
        <el-table-column prop="mainType" label="类型" width="90" />
        <el-table-column prop="orgName" label="组织" width="110" />
      </el-table>
      <span slot="footer">
        <el-button @click="showBatch = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitBatch">创建点位</el-button>
      </span>
    </el-dialog>

    <el-dialog title="拉流建虚拟点位" :visible.sync="showStream" width="520px">
      <el-form :model="streamForm" label-width="100px">
        <el-form-item label="点位名称" required>
          <el-input v-model="streamForm.name" placeholder="请输入点位名称" />
        </el-form-item>
        <el-form-item label="流地址" required>
          <el-input v-model="streamForm.streamUrl" placeholder="rtsp:// 或 rtmp://" @input="probeResult = null">
            <el-button slot="append" :loading="probing" @click="handleProbeUrl">测试连接</el-button>
          </el-input>
          <div v-if="probeResult" class="probe-result" :class="'probe-result--' + probeTone(probeResult.status)">
            <i :class="probeTone(probeResult.status) === 'ok' ? 'el-icon-success' : 'el-icon-warning'" />
            {{ probeResult.statusText }}<template v-if="probeResult.detail">：{{ probeResult.detail }}</template>
          </div>
        </el-form-item>
        <el-form-item label="所属组织" required>
          <el-select v-model="streamForm.orgId" style="width:100%">
            <el-option v-for="o in orgOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showStream = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitStream">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="RTMP 推流建点" :visible.sync="showFile" width="520px" @closed="resetFileForm">
      <p class="asset-dialog-tip">上传 mp4/mov 等文件，创建 RTMP 推流虚拟点位（ffmpeg 推至 GoWVP）；创建后可在列表中启动/停止推流</p>
      <el-form label-width="100px">
        <el-form-item label="点位名称">
          <el-input v-model="fileForm.name" placeholder="可选，默认取文件名" />
        </el-form-item>
        <el-form-item label="所属组织" required>
          <el-select v-model="fileForm.orgId" style="width:100%">
            <el-option v-for="o in orgOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="视频文件" required>
          <el-upload
            action="#"
            :show-file-list="false"
            :auto-upload="false"
            accept="video/*,.mp4,.mov,.avi,.mkv"
            :on-change="onFileChange"
          >
            <el-button icon="el-icon-folder-opened" size="small">
              {{ fileForm.file ? fileForm.file.name : '选择视频文件' }}
            </el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showFile = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitFile">创建并推流</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import './asset-page.css';
import { assetAPI, flattenOrgOptions } from '../../service/AssetService.js';
import AssetEmptyState from './AssetEmptyState.vue';
import assetTableLayout from './assetTableLayout.js';
import {
  displaySourceStatus,
  displaySourceStatusText,
  isActiveStreamStatus,
  probeTone,
  sourceTagType,
  sourceTooltip,
  streamStatusDotClass,
  streamStatusTextClass,
  summarizePointStats,
} from './assetStreamStatus.js';

export default {
  name: 'PointManage',
  components: { AssetEmptyState },
  mixins: [assetTableLayout],
  data() {
    return {
      loading: false,
      submitting: false,
      channelLoading: false,
      list: [],
      statsList: [],
      total: 0,
      page: 1,
      pageSize: 10,
      searchKey: '',
      typeFilter: '',
      showBatch: false,
      showStream: false,
      showFile: false,
      channels: [],
      selected: [],
      orgTree: [],
      orgOptions: [],
      selectedOrgId: '',
      includeSubOrg: true,
      batchForm: { inheritOrg: true, orgId: 'org-root' },
      streamForm: { name: '', streamUrl: '', orgId: 'org-root' },
      fileForm: { name: '', orgId: 'org-root', file: null },
      probing: false,
      probeResult: null,
      rowProbing: {},
      csvBusy: false,
    };
  },
  computed: {
    pointStats() {
      return summarizePointStats(this.statsList);
    },
  },
  mounted() {
    this.loadOrgs();
    this.load();
  },
  methods: {
    async loadOrgs() {
      try {
        const orgs = await assetAPI.fetchOrganizations();
        this.orgTree = Array.isArray(orgs) ? orgs : [];
        this.orgOptions = flattenOrgOptions(this.orgTree);
        const defaultOrg = (this.orgOptions[0] && this.orgOptions[0].value) || 'org-root';
        this.batchForm.orgId = defaultOrg;
        this.streamForm.orgId = defaultOrg;
        this.fileForm.orgId = defaultOrg;
      } catch (e) {
        this.orgTree = [{ id: 'org-root', title: '根组织', key: 'org-root', children: [] }];
        this.orgOptions = [{ value: 'org-root', label: '根组织' }];
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
    onSearch() {
      this.page = 1;
      this.load();
    },
    resetSearch() {
      this.searchKey = '';
      this.typeFilter = '';
      this.selectedOrgId = '';
      this.page = 1;
      this.load();
    },
    applyPageSlice() {
      const start = (this.page - 1) * this.pageSize;
      this.list = this.statsList.slice(start, start + this.pageSize);
    },
    async load() {
      this.loading = true;
      try {
        const data = await assetAPI.fetchPoints({
          page: 1,
          pageSize: 2000,
          key: this.searchKey.trim(),
          type: this.typeFilter || '',
          orgId: this.selectedOrgId || '',
          includeSub: this.includeSubOrg,
        });
        const rows = data.list || [];
        this.statsList = rows;
        this.total = data.total != null ? data.total : rows.length;
        this.applyPageSlice();
      } catch (e) {
        this.$message.error(e.message || '加载失败');
      } finally {
        this.loading = false;
        this.updateAssetTableHeight();
      }
    },
    openBatch() {
      this.showBatch = true;
    },
    onStreamCsvCommand(cmd) {
      if (cmd === 'export') this.handleExportStream(false);
      else if (cmd === 'template') this.handleExportStream(true);
      else if (cmd === 'import') this.$refs.streamCsvInput && this.$refs.streamCsvInput.click();
    },
    async handleExportStream(template = false) {
      this.csvBusy = true;
      try {
        await assetAPI.exportStreamPoints(!!template);
        this.$message.success(template ? '模板已下载' : '导出成功');
      } catch (e) {
        this.$message.error(e.message || '导出失败');
      } finally {
        this.csvBusy = false;
      }
    },
    async onStreamCsvSelected(e) {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      this.csvBusy = true;
      try {
        const result = await assetAPI.importStreamPoints(file);
        const success = result.success || 0;
        const failed = result.failed || 0;
        const warnings = result.warnings || [];
        let msg = `导入完成：成功 ${success} 条，失败 ${failed} 条`;
        if (warnings.length) {
          msg += `；${warnings.slice(0, 3).join('；')}`;
        }
        if (failed > 0) {
          const errLines = (result.errors || [])
            .slice(0, 8)
            .map((x) => `第${x.row}行 ${x.name || ''}：${x.msg}`)
            .join('<br/>');
          this.$alert(msg + (errLines ? '<br/><br/>' + errLines : ''), '导入结果', {
            dangerouslyUseHTMLString: true,
            type: success > 0 ? 'warning' : 'error',
          });
        } else {
          this.$message.success(msg);
        }
        this.load();
      } catch (err) {
        this.$message.error(err.message || '导入失败');
      } finally {
        this.csvBusy = false;
      }
    },
    async loadChannels() {
      this.channelLoading = true;
      try {
        const data = await assetAPI.fetchAvailableChannels({
          orgId: this.selectedOrgId || '',
          includeSub: this.includeSubOrg,
        });
        this.channels = data.list || [];
      } catch (e) {
        this.$message.error(e.message || '加载通道失败');
      } finally {
        this.channelLoading = false;
      }
    },
    async submitBatch() {
      const ids = this.selected.map((r) => r.channelId);
      if (!ids.length) {
        this.$message.warning('请选择通道');
        return;
      }
      this.submitting = true;
      try {
        await assetAPI.createPointsBatch({
          channelIds: ids,
          inheritOrg: this.batchForm.inheritOrg,
          orgId: this.batchForm.inheritOrg ? '' : this.batchForm.orgId,
        });
        this.$message.success('建点成功');
        this.showBatch = false;
        this.load();
      } catch (e) {
        this.$message.error(e.message || '建点失败');
      } finally {
        this.submitting = false;
      }
    },
    isActiveStatus(status) {
      return isActiveStreamStatus(status);
    },
    statusTextClass: streamStatusTextClass,
    statusDotClass: streamStatusDotClass,
    sourceTagType,
    probeTone,
    sourceTooltip,
    displaySourceStatus,
    displaySourceStatusText,
    async handleProbeUrl() {
      if (!this.streamForm.streamUrl) {
        this.$message.warning('请先填写流地址');
        return;
      }
      this.probing = true;
      this.probeResult = null;
      try {
        this.probeResult = await assetAPI.probeStreamUrl(this.streamForm.streamUrl);
      } catch (e) {
        this.$message.error(e.message || '检测失败');
      } finally {
        this.probing = false;
      }
    },
    async handleProbeRow(row) {
      this.$set(this.rowProbing, row.id, true);
      try {
        const res = await assetAPI.probePoint(row.id);
        row.sourceStatus = res.status;
        row.sourceStatusText = res.statusText;
        row.sourceDetail = res.detail;
        row.sourceCheckedAt = res.checkedAt;
      } catch (e) {
        this.$message.error(e.message || '检测失败');
      } finally {
        this.$set(this.rowProbing, row.id, false);
      }
    },
    async submitStream() {
      if (!this.streamForm.name || !this.streamForm.streamUrl) {
        this.$message.warning('请填写名称和流地址');
        return;
      }
      this.submitting = true;
      try {
        const row = await assetAPI.createVirtualPointStream({
          name: this.streamForm.name,
          streamUrl: this.streamForm.streamUrl,
          orgId: this.streamForm.orgId,
        });
        if (row && (row.sourceStatus === 'ok' || row.sourceStatus === 'streaming')) {
          this.$message.success('虚拟点位已创建，源地址检测正常');
        } else if (row && row.sourceStatus) {
          this.$message.warning(
            `虚拟点位已创建，但源地址检测异常（${row.sourceStatusText || ''}${row.sourceDetail ? '：' + row.sourceDetail : ''}），请检查流地址`
          );
        } else {
          this.$message.success('虚拟点位已创建');
        }
        this.showStream = false;
        this.probeResult = null;
        this.load();
      } catch (e) {
        this.$message.error(e.message || '创建失败');
      } finally {
        this.submitting = false;
      }
    },
    onFileChange(file) {
      this.fileForm.file = file.raw;
      if (!this.fileForm.name && file.name) {
        this.fileForm.name = file.name.replace(/\.[^/.]+$/, '');
      }
    },
    resetFileForm() {
      this.fileForm = {
        name: '',
        orgId: this.selectedOrgId || (this.orgOptions[0] && this.orgOptions[0].value) || 'org-root',
        file: null,
      };
    },
    async submitFile() {
      if (!this.fileForm.file) {
        this.$message.warning('请选择视频文件');
        return;
      }
      if (!this.fileForm.orgId) {
        this.$message.warning('请选择所属组织');
        return;
      }
      this.submitting = true;
      try {
        await assetAPI.createVirtualPointFile(
          this.fileForm.file,
          (this.fileForm.name || '').trim(),
          this.fileForm.orgId
        );
        this.$message.success('虚拟点位已创建，可在列表中管理推流');
        this.showFile = false;
        this.load();
      } catch (e) {
        this.$message.error(e.message || '创建失败');
      } finally {
        this.submitting = false;
      }
    },
    async handleStart(row) {
      try {
        await assetAPI.startPointStream(row.id);
        this.$message.success('推流已启动');
        this.load();
      } catch (e) {
        this.$message.error(e.message || '启动失败');
      }
    },
    async handleStop(row) {
      try {
        await assetAPI.stopPointStream(row.id);
        this.$message.success('推流已停止');
        this.load();
      } catch (e) {
        this.$message.error(e.message || '停止失败');
      }
    },
    handleDelete(row) {
      this.$confirm(
        `删除点位「${row.name}」将同步删除关联的 AI 任务绑定，且无法恢复，确定继续？`,
        '删除点位',
        { type: 'warning' }
      )
        .then(async () => {
          await assetAPI.deletePoint(row.id);
          this.$message.success('已删除');
          this.load();
        })
        .catch(() => {});
    },
  },
};
</script>

<style scoped>
.mono-text {
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  color: #909399;
}
.cell-muted { color: #c0c4cc; }
.probe-result {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
}
.probe-result--ok { color: #67c23a; }
.probe-result--bad { color: #e6a23c; }
.btn-danger-text { color: #f56c6c !important; }
.btn-warn-text { color: #e6a23c !important; }
.batch-form { margin-bottom: 12px; }
</style>

<style>
/* 下拉挂到 body；按钮与菜单同宽，三项等高 */
.stream-batch-drop-btn {
  width: 142px;
  padding-left: 10px;
  padding-right: 10px;
}
.stream-batch-dropdown.el-dropdown-menu {
  width: 142px;
  min-width: 142px;
  padding: 4px 0;
  box-sizing: border-box;
}
.stream-batch-dropdown .el-dropdown-menu__item {
  padding: 0 12px;
  height: 32px;
  line-height: 32px;
  font-size: 13px;
  text-align: center;
}
</style>

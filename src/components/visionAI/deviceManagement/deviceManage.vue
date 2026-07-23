<template>
  <div class="asset-page device-manage-page">
    <div class="asset-page-header">
      <div class="asset-page-header__main">
        <div class="asset-page-title-row">
          <div class="asset-page-icon asset-page-icon--device">
            <i class="el-icon-connection" />
          </div>
          <h2 class="asset-page-title">设备接入</h2>
        </div>
        <p class="asset-page-desc">
           接入 GB28181 国标、RTSP/RTMP 拉流或 ONVIF 摄像机；接入后可自动建点，供 AI 任务与实时监控使用。
          多通道设备显示通道在线汇总；RTSP 拉流可查看源状态（与点位管理一致）。
        </p>
      </div>
      <div class="asset-page-header__actions">
        <el-button icon="el-icon-info" size="small" @click="showGbInfo = true">国标接入信息</el-button>
        <el-button icon="el-icon-search" size="small" @click="openOnvifDiscover">ONVIF 扫描</el-button>
        <el-button type="primary" icon="el-icon-plus" size="small" @click="showAdd = true">添加设备</el-button>
      </div>
    </div>

    <div class="asset-stat-row">
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--total">
          <i class="el-icon-cpu" />
        </div>
        <div>
          <div class="asset-stat-card__value">{{ deviceStats.total }}</div>
          <div class="asset-stat-card__label">设备总数</div>
          <div v-if="deviceStats.hasMultiChannel" class="asset-stat-card__sub">
            通道 {{ deviceStats.channelOnline }}/{{ deviceStats.channelTotal }} 在线
          </div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--online">
          <i class="el-icon-success" />
        </div>
        <div>
          <div class="asset-stat-card__value">{{ deviceStats.active }}</div>
          <div class="asset-stat-card__label">活跃</div>
          <div class="asset-stat-card__sub">在线 / 拉流中 / 推流中</div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--idle">
          <i class="el-icon-video-pause" />
        </div>
        <div>
          <div class="asset-stat-card__value">{{ deviceStats.idle }}</div>
          <div class="asset-stat-card__label">空闲</div>
          <div class="asset-stat-card__sub">未拉流 / 已停止</div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--offline">
          <i class="el-icon-remove-outline" />
        </div>
        <div>
          <div class="asset-stat-card__value">{{ deviceStats.offline }}</div>
          <div class="asset-stat-card__label">离线</div>
          <div class="asset-stat-card__sub">设备或通道不可用</div>
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
              placeholder="搜索设备名称"
              clearable
              size="small"
              style="width: 220px"
              @keyup.enter.native="onSearch"
              @clear="onSearch"
            >
              <i slot="prefix" class="el-icon-search" />
            </el-input>
            <el-select
              v-model="statusFilter"
              placeholder="状态"
              clearable
              size="small"
              style="width: 110px"
              @change="onStatusFilterChange"
            >
              <el-option label="活跃" value="active" />
              <el-option label="空闲" value="idle" />
              <el-option label="离线" value="offline" />
            </el-select>
            <el-button size="small" type="primary" plain @click="onSearch">查询</el-button>
            <el-button size="small" @click="resetSearch">重置</el-button>
          </div>
        </div>

        <div ref="assetTableWrap" class="asset-table-wrap">
          <el-table v-loading="loading" :data="list" stripe :height="assetTableHeight">
            <template slot="empty">
              <asset-empty-state
                icon="el-icon-connection"
                title="暂无接入设备"
                description="可通过 GB28181 国标、ONVIF 扫描或 RTSP 拉流接入摄像机"
              >
                <el-button type="primary" size="small" icon="el-icon-plus" @click="showAdd = true">添加设备</el-button>
                <el-button size="small" icon="el-icon-search" @click="openOnvifDiscover">ONVIF 扫描</el-button>
              </asset-empty-state>
            </template>
            <el-table-column prop="name" label="设备名称" min-width="160" show-overflow-tooltip />
            <el-table-column prop="type" label="接入类型" width="110">
              <template slot-scope="{ row }">
                <el-tag size="mini" effect="plain" type="info">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deviceCode" label="设备编码" min-width="160" show-overflow-tooltip>
              <template slot-scope="{ row }">
                <span class="mono-text">{{ row.deviceCode || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="orgName" label="组织" width="130" show-overflow-tooltip />
            <el-table-column label="通道" width="100" align="center">
              <template slot-scope="{ row }">
                <span :title="row.channelCount > 1 ? '在线通道数 / 总通道数' : '通道数量'">
                  {{ formatChannelSummary(row) }}
                </span>
              </template>
            </el-table-column>
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
            <el-table-column prop="model" label="型号" width="120" show-overflow-tooltip>
              <template slot-scope="{ row }">{{ row.model || '-' }}</template>
            </el-table-column>
            <el-table-column prop="lastOnline" label="最近心跳" width="170" show-overflow-tooltip>
              <template slot-scope="{ row }">{{ row.lastOnline || '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right" align="center">
              <template slot-scope="{ row }">
                <div class="asset-op-cell">
                  <el-button
                    v-if="canEditDevice(row)"
                    type="text"
                    @click="openEdit(row)"
                  >编辑</el-button>
                  <el-button type="text" @click="openChangeOrg(row)">变更组织</el-button>
                  <el-button type="text" class="btn-danger-text" @click="handleDelete(row)">删除</el-button>
                </div>
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

    <el-dialog title="添加设备" :visible.sync="showAdd" width="560px" custom-class="asset-dialog" @closed="resetForm">
      <el-alert
        v-if="form.accessType === 'gb28181'"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
        title="国标设备需先在摄像机侧配置 SIP 注册，再在此预登记设备编码"
      />
      <el-form :model="form" label-width="100px" class="asset-form">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="设备名称" />
        </el-form-item>
        <el-form-item label="所属组织" required>
          <el-select v-model="form.orgId" placeholder="请选择组织" style="width:100%">
            <el-option v-for="o in orgOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="接入方式" required>
          <el-select v-model="form.accessType" style="width:100%">
            <el-option label="GB28181 国标" value="gb28181" />
            <el-option label="RTSP/RTMP 拉流" value="stream" />
            <el-option label="ONVIF" value="onvif" />
          </el-select>
        </el-form-item>

        <template v-if="form.accessType === 'gb28181'">
          <el-form-item label="国标编码" required>
            <el-input v-model="form.gbCode" placeholder="20 位国标设备编码" maxlength="20" />
          </el-form-item>
          <el-form-item label="鉴权">
            <el-switch v-model="form.auth" active-text="启用 SIP 鉴权" />
          </el-form-item>
          <template v-if="form.auth">
            <el-form-item label="用户名">
              <el-input v-model="form.username" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="form.password" type="password" show-password />
            </el-form-item>
          </template>
        </template>

        <template v-if="form.accessType === 'stream'">
          <el-form-item label="流地址" required>
            <el-input v-model="form.streamUrl" placeholder="rtsp:// 或 rtmp://" @input="probeResult = null">
              <el-button slot="append" :loading="probing" @click="handleProbeUrl">测试连接</el-button>
            </el-input>
            <div v-if="probeResult" class="probe-result" :class="'probe-result--' + probeTone(probeResult.status)">
              <i :class="probeTone(probeResult.status) === 'ok' ? 'el-icon-success' : 'el-icon-warning'" />
              {{ probeResult.statusText }}<template v-if="probeResult.detail">：{{ probeResult.detail }}</template>
            </div>
          </el-form-item>
          <el-form-item label="传输协议">
            <el-radio-group v-model="form.protocol">
              <el-radio label="TCP">TCP</el-radio>
              <el-radio label="UDP">UDP</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>

        <template v-if="form.accessType === 'onvif'">
          <el-form-item label="IP" required>
            <el-input v-model="form.ip" />
          </el-form-item>
          <el-form-item label="端口">
            <el-input-number v-model="form.port" :min="1" :max="65535" />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="form.username" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
        </template>

        <el-form-item label="自动建点">
          <el-switch v-model="form.createPoint" />
          <span class="asset-form-tip">接入成功后自动将通道创建为 AI 点位</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAdd">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="GB28181 接入信息" :visible.sync="showGbInfo" width="520px" @open="loadGbInfo">
      <div v-loading="gbInfoLoading">
        <p class="asset-dialog-tip">{{ gbInfo.hint }}</p>
        <el-descriptions :column="1" border size="medium">
          <el-descriptions-item label="SIP 服务器 ID">{{ gbInfo.sipServerId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="SIP 域">{{ gbInfo.sipDomain || '-' }}</el-descriptions-item>
          <el-descriptions-item label="SIP 服务器 IP">{{ gbInfo.sipHost || '-' }}</el-descriptions-item>
          <el-descriptions-item label="SIP 端口">{{ gbInfo.sipPort || '-' }}</el-descriptions-item>
          <el-descriptions-item label="传输协议">{{ gbInfo.transport || 'UDP' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <span slot="footer">
        <el-button type="primary" @click="showGbInfo = false">知道了</el-button>
      </span>
    </el-dialog>

    <el-dialog title="编辑设备" :visible.sync="showEditDevice" width="520px" @closed="resetDeviceEditForm">
      <div v-loading="editLoading">
        <el-form :model="deviceEditForm" label-width="100px">
          <el-form-item label="设备名称" required>
            <el-input v-model="deviceEditForm.name" placeholder="请输入设备名称" />
          </el-form-item>
          <template v-if="deviceEditForm.accessType === 'gb28181'">
            <el-form-item label="国标编码" required>
              <el-input v-model="deviceEditForm.gbCode" placeholder="20 位国标设备编码" maxlength="20" />
            </el-form-item>
            <el-form-item label="用户名">
              <el-input v-model="deviceEditForm.username" placeholder="SIP 鉴权用户名（可选）" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="deviceEditForm.password"
                type="password"
                show-password
                :placeholder="deviceEditForm.hasPassword ? '留空则不修改密码' : '可选'"
              />
            </el-form-item>
          </template>
          <template v-else-if="deviceEditForm.accessType === 'onvif'">
            <el-form-item label="IP" required>
              <el-input v-model="deviceEditForm.ip" placeholder="设备 IP" />
            </el-form-item>
            <el-form-item label="端口" required>
              <el-input-number v-model="deviceEditForm.port" :min="1" :max="65535" />
            </el-form-item>
            <el-form-item label="用户名" required>
              <el-input v-model="deviceEditForm.username" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="deviceEditForm.password"
                type="password"
                show-password
                :placeholder="deviceEditForm.hasPassword ? '留空则不修改密码' : '请输入密码'"
              />
            </el-form-item>
          </template>
        </el-form>
        <p class="asset-dialog-tip">
          <template v-if="deviceEditForm.accessType === 'gb28181'">
            国标编码需与摄像机侧配置一致，否则设备无法重新注册。
          </template>
          <template v-else>
            修改 IP/端口/账号后需能重新连上设备；密码留空表示不修改。
          </template>
        </p>
      </div>
      <span slot="footer">
        <el-button @click="showEditDevice = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEditDevice">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="编辑视频流地址" :visible.sync="showEditStream" width="520px" @closed="resetEditForm">
      <div v-loading="editLoading">
        <el-form :model="editForm" label-width="100px">
          <el-form-item label="设备名称" required>
            <el-input v-model="editForm.name" placeholder="请输入设备名称" />
          </el-form-item>
          <el-form-item label="流地址" required>
            <el-input v-model="editForm.streamUrl" placeholder="rtsp:// 或 rtmp://" @input="editProbeResult = null">
              <el-button slot="append" :loading="editProbing" @click="handleProbeEditUrl">测试连接</el-button>
            </el-input>
            <div v-if="editProbeResult" class="probe-result" :class="'probe-result--' + probeTone(editProbeResult.status)">
              <i :class="probeTone(editProbeResult.status) === 'ok' ? 'el-icon-success' : 'el-icon-warning'" />
              {{ editProbeResult.statusText }}<template v-if="editProbeResult.detail">：{{ editProbeResult.detail }}</template>
            </div>
          </el-form-item>
          <el-form-item label="传输协议">
            <el-radio-group v-model="editForm.protocol">
              <el-radio label="TCP">TCP</el-radio>
              <el-radio label="UDP">UDP</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <p class="asset-dialog-tip">保存后设备会自动切换到新流地址，已关联点位与 AI 任务不受影响。</p>
      </div>
      <span slot="footer">
        <el-button @click="showEditStream = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEditStream">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="变更所属组织" :visible.sync="showChangeOrg" width="460px">
      <el-form label-width="100px">
        <el-form-item label="设备名称">
          <span>{{ changeOrgForm.name }}</span>
        </el-form-item>
        <el-form-item label="当前组织">
          <span>{{ changeOrgForm.currentOrgName }}</span>
        </el-form-item>
        <el-form-item label="目标组织" required>
          <el-select v-model="changeOrgForm.orgId" placeholder="选择组织" style="width:100%">
            <el-option v-for="o in orgOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <p class="asset-dialog-tip">变更后，该设备下所有点位将一并归入目标组织。</p>
      <span slot="footer">
        <el-button @click="showChangeOrg = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitChangeOrg">确定</el-button>
      </span>
    </el-dialog>

    <onvif-discover
      ref="onvifDiscover"
      :org-options="orgOptions"
      :default-org-id="selectedOrgId || form.orgId"
      @added="load"
    />
  </div>
</template>

<script>
import './asset-page.css';
import { assetAPI, flattenOrgOptions, collectOrgScopeIds } from '../../service/AssetService.js';
import OnvifDiscover from './OnvifDiscover.vue';
import AssetEmptyState from './AssetEmptyState.vue';
import assetTableLayout from './assetTableLayout.js';
import {
  deviceStatusBucket,
  formatChannelSummary,
  isActiveStreamStatus,
  probeTone,
  streamStatusDotClass,
  streamStatusTextClass,
  summarizeDeviceStats,
} from './assetStreamStatus.js';

export default {
  name: 'DeviceManage',
  components: { OnvifDiscover, AssetEmptyState },
  mixins: [assetTableLayout],
  data() {
    return {
      loading: false,
      submitting: false,
      gbInfoLoading: false,
      list: [],
      statsList: [],
      total: 0,
      page: 1,
      pageSize: 10,
      searchKey: '',
      statusFilter: '',
      showAdd: false,
      showGbInfo: false,
      showChangeOrg: false,
      showEditStream: false,
      showEditDevice: false,
      editLoading: false,
      editForm: { id: '', name: '', streamUrl: '', protocol: 'TCP' },
      editProbing: false,
      editProbeResult: null,
      deviceEditForm: {
        id: '',
        name: '',
        accessType: '',
        gbCode: '',
        username: '',
        password: '',
        ip: '',
        port: 80,
        hasPassword: false,
      },
      changeOrgForm: { id: '', name: '', currentOrgName: '', orgId: '' },
      orgTree: [],
      orgOptions: [],
      selectedOrgId: '',
      includeSubOrg: true,
      gbInfo: {},
      probing: false,
      probeResult: null,
      form: {
        name: '',
        orgId: 'org-root',
        accessType: 'gb28181',
        gbCode: '',
        streamUrl: '',
        protocol: 'TCP',
        auth: false,
        ip: '',
        port: 80,
        username: '',
        password: '',
        createPoint: true,
      },
    };
  },
  computed: {
    deviceStats() {
      return summarizeDeviceStats(this.statsList);
    },
  },
  mounted() {
    this.loadOrgs();
    this.load();
  },
  methods: {
    isActiveStatus(status) {
      return isActiveStreamStatus(status);
    },
    statusTextClass: streamStatusTextClass,
    statusDotClass: streamStatusDotClass,
    formatChannelSummary,
    probeTone,
    async handleProbeUrl() {
      if (!this.form.streamUrl) {
        this.$message.warning('请先填写流地址');
        return;
      }
      this.probing = true;
      this.probeResult = null;
      try {
        this.probeResult = await assetAPI.probeStreamUrl(this.form.streamUrl);
      } catch (e) {
        this.$message.error(e.message || '检测失败');
      } finally {
        this.probing = false;
      }
    },
    applyPageSlice() {
      const filtered = this.statusFilter
        ? this.statsList.filter((r) => deviceStatusBucket(r) === this.statusFilter)
        : this.statsList;
      this.total = filtered.length;
      const start = (this.page - 1) * this.pageSize;
      this.list = filtered.slice(start, start + this.pageSize);
    },
    async loadOrgs() {
      try {
        const orgs = await assetAPI.fetchOrganizations();
        this.orgTree = Array.isArray(orgs) ? orgs : [];
        this.orgOptions = flattenOrgOptions(this.orgTree);
        if (!this.orgOptions.some((o) => o.value === this.form.orgId)) {
          this.form.orgId = (this.orgOptions[0] && this.orgOptions[0].value) || 'org-root';
        }
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
    onStatusFilterChange() {
      this.page = 1;
      this.applyPageSlice();
    },
    resetSearch() {
      this.searchKey = '';
      this.statusFilter = '';
      this.selectedOrgId = '';
      this.page = 1;
      this.load();
    },
    openOnvifDiscover() {
      if (this.$refs.onvifDiscover) {
        this.$refs.onvifDiscover.open();
      }
    },
    async loadGbInfo() {
      this.gbInfoLoading = true;
      try {
        this.gbInfo = await assetAPI.fetchGbAccessInfo();
      } catch (e) {
        this.gbInfo = { hint: e.message || '获取接入信息失败，请确认 GoWVP 已启动' };
      } finally {
        this.gbInfoLoading = false;
      }
    },
    async load() {
      this.loading = true;
      try {
        const data = await assetAPI.fetchDevices({
          page: 1,
          pageSize: 500,
          key: this.searchKey.trim(),
        });
        let rows = data.list || [];
        if (this.selectedOrgId) {
          const scope = collectOrgScopeIds(this.orgTree, this.selectedOrgId, this.includeSubOrg);
          rows = rows.filter((r) => scope.includes(r.orgId));
        }
        this.statsList = rows;
        this.total = rows.length;
        this.applyPageSlice();
      } catch (e) {
        this.$message.error(e.message || '加载失败');
      } finally {
        this.loading = false;
        this.updateAssetTableHeight();
      }
    },
    resetForm() {
      this.probeResult = null;
      this.form = {
        name: '',
        orgId: this.selectedOrgId || (this.orgOptions[0] && this.orgOptions[0].value) || 'org-root',
        accessType: 'gb28181',
        gbCode: '',
        streamUrl: '',
        protocol: 'TCP',
        auth: false,
        ip: '',
        port: 80,
        username: '',
        password: '',
        createPoint: true,
      };
    },
    async submitAdd() {
      if (!this.form.name) {
        this.$message.warning('请填写设备名称');
        return;
      }
      if (!this.form.orgId) {
        this.$message.warning('请选择所属组织');
        return;
      }
      if (this.form.accessType === 'gb28181' && !this.form.gbCode) {
        this.$message.warning('请填写国标编码');
        return;
      }
      if (this.form.accessType === 'stream' && !this.form.streamUrl) {
        this.$message.warning('请填写流地址');
        return;
      }
      if (this.form.accessType === 'onvif' && !this.form.ip) {
        this.$message.warning('请填写 ONVIF 设备 IP');
        return;
      }
      this.submitting = true;
      try {
        await assetAPI.createDevice({ ...this.form });
        this.$message.success(this.form.createPoint ? '添加成功，已自动创建点位' : '添加成功');
        this.showAdd = false;
        this.load();
      } catch (e) {
        this.$message.error(e.message || '添加失败');
      } finally {
        this.submitting = false;
      }
    },
    canEditDevice(row) {
      const t = (row && row.rawType) || '';
      return t === 'RTSP' || t === 'GB28181' || t === 'ONVIF';
    },
    async openEdit(row) {
      if (!this.canEditDevice(row)) return;
      if (row.rawType === 'RTSP') {
        await this.openEditStream(row);
        return;
      }
      await this.openEditDevice(row);
    },
    async openEditDevice(row) {
      this.resetDeviceEditForm();
      this.deviceEditForm.id = row.id;
      this.deviceEditForm.name = row.name || '';
      this.deviceEditForm.accessType = row.rawType === 'ONVIF' ? 'onvif' : 'gb28181';
      this.showEditDevice = true;
      this.editLoading = true;
      try {
        const detail = await assetAPI.fetchDeviceDetail(row.id);
        this.deviceEditForm = {
          id: row.id,
          name: (detail && detail.name) || row.name || '',
          accessType: (detail && detail.accessType) || this.deviceEditForm.accessType,
          gbCode: (detail && detail.gbCode) || '',
          username: (detail && detail.username) || '',
          password: '',
          ip: (detail && detail.ip) || '',
          port: (detail && detail.port) || 80,
          hasPassword: !!(detail && detail.hasPassword),
        };
      } catch (e) {
        this.$message.error(e.message || '加载设备信息失败');
        this.showEditDevice = false;
      } finally {
        this.editLoading = false;
      }
    },
    resetDeviceEditForm() {
      this.deviceEditForm = {
        id: '',
        name: '',
        accessType: '',
        gbCode: '',
        username: '',
        password: '',
        ip: '',
        port: 80,
        hasPassword: false,
      };
    },
    async submitEditDevice() {
      const f = this.deviceEditForm;
      if (!f.name) {
        this.$message.warning('请填写设备名称');
        return;
      }
      if (f.accessType === 'gb28181' && !f.gbCode) {
        this.$message.warning('请填写国标编码');
        return;
      }
      if (f.accessType === 'onvif') {
        if (!f.ip) {
          this.$message.warning('请填写 ONVIF 设备 IP');
          return;
        }
        if (!f.port) {
          this.$message.warning('请填写端口');
          return;
        }
        if (!f.username) {
          this.$message.warning('请填写用户名');
          return;
        }
        if (!f.hasPassword && !f.password) {
          this.$message.warning('请填写密码');
          return;
        }
      }
      this.submitting = true;
      try {
        const payload = { name: f.name };
        if (f.accessType === 'gb28181') {
          payload.gbCode = f.gbCode;
          payload.username = f.username || '';
          payload.password = f.password || '';
        } else if (f.accessType === 'onvif') {
          payload.ip = f.ip;
          payload.port = f.port;
          payload.username = f.username;
          payload.password = f.password || '';
        }
        await assetAPI.updateDevice(f.id, payload);
        this.$message.success('已更新');
        this.showEditDevice = false;
        this.load();
      } catch (e) {
        this.$message.error(e.message || '更新失败');
      } finally {
        this.submitting = false;
      }
    },
    async openEditStream(row) {
      this.editForm = {
        id: row.id,
        name: row.name || '',
        streamUrl: '',
        protocol: 'TCP',
      };
      this.editProbeResult = null;
      this.showEditStream = true;
      this.editLoading = true;
      try {
        const detail = await assetAPI.fetchDeviceDetail(row.id);
        this.editForm = {
          id: row.id,
          name: (detail && detail.name) || row.name || '',
          streamUrl: (detail && detail.streamUrl) || '',
          protocol: (detail && detail.protocol) || 'TCP',
        };
      } catch (e) {
        // 回显失败仍允许手工填写
      } finally {
        this.editLoading = false;
      }
    },
    resetEditForm() {
      this.editForm = { id: '', name: '', streamUrl: '', protocol: 'TCP' };
      this.editProbeResult = null;
    },
    async handleProbeEditUrl() {
      if (!this.editForm.streamUrl) {
        this.$message.warning('请先填写流地址');
        return;
      }
      this.editProbing = true;
      this.editProbeResult = null;
      try {
        this.editProbeResult = await assetAPI.probeStreamUrl(this.editForm.streamUrl);
      } catch (e) {
        this.$message.error(e.message || '检测失败');
      } finally {
        this.editProbing = false;
      }
    },
    async submitEditStream() {
      if (!this.editForm.name || !this.editForm.streamUrl) {
        this.$message.warning('请填写名称和流地址');
        return;
      }
      this.submitting = true;
      try {
        await assetAPI.updateDeviceStream(this.editForm.id, {
          name: this.editForm.name,
          streamUrl: this.editForm.streamUrl,
          protocol: this.editForm.protocol,
        });
        this.$message.success('已更新');
        this.showEditStream = false;
        this.load();
      } catch (e) {
        this.$message.error(e.message || '更新失败');
      } finally {
        this.submitting = false;
      }
    },
    openChangeOrg(row) {
      this.changeOrgForm = {
        id: row.id,
        name: row.name,
        currentOrgName: row.orgName || '-',
        orgId: row.orgId || '',
      };
      this.showChangeOrg = true;
    },
    async submitChangeOrg() {
      if (!this.changeOrgForm.orgId) {
        this.$message.warning('请选择目标组织');
        return;
      }
      this.submitting = true;
      try {
        const res = await assetAPI.updateDeviceOrg(this.changeOrgForm.id, this.changeOrgForm.orgId);
        const synced = (res && res.syncedPoints) || 0;
        this.$message.success(synced > 0 ? `组织已变更，同步更新 ${synced} 个点位` : '组织已变更');
        this.showChangeOrg = false;
        this.load();
      } catch (e) {
        this.$message.error(e.message || '变更失败');
      } finally {
        this.submitting = false;
      }
    },
    handleDelete(row) {
      this.$confirm(
        `删除设备「${row.name}」将同步删除 GoWVP 通道及已关联点位，且无法恢复，确定继续？`,
        '删除设备',
        { type: 'warning' }
      )
        .then(async () => {
          await assetAPI.deleteDevice(row.id);
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
  color: #606266;
}
.btn-danger-text {
  color: #f56c6c !important;
}
.cell-muted {
  color: #c0c4cc;
}
.probe-result {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
}
.probe-result--ok { color: #67c23a; }
.probe-result--bad { color: #e6a23c; }
.asset-op-cell {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}
.asset-op-cell .el-button + .el-button {
  margin-left: 8px;
}
.asset-op-cell .el-button {
  padding-left: 0;
  padding-right: 0;
}
</style>

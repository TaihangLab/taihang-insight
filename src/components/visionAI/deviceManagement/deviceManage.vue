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
          通过 GoWVP 接入 GB28181 国标、RTSP/RTMP 拉流或 ONVIF 摄像机；接入后可自动建点，供 AI 任务与实时监控使用
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
          <div class="asset-stat-card__value">{{ total }}</div>
          <div class="asset-stat-card__label">设备总数</div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--online">
          <i class="el-icon-success" />
        </div>
        <div>
          <div class="asset-stat-card__value">{{ onlineCount }}</div>
          <div class="asset-stat-card__label">在线</div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--offline">
          <i class="el-icon-remove-outline" />
        </div>
        <div>
          <div class="asset-stat-card__value">{{ offlineCount }}</div>
          <div class="asset-stat-card__label">离线</div>
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
            <el-table-column prop="channelCount" label="通道" width="70" align="center" />
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
            <el-table-column label="操作" width="90" fixed="right" align="center">
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
              @current-change="load"
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
            <el-input v-model="form.streamUrl" placeholder="rtsp:// 或 rtmp://" />
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
      total: 0,
      page: 1,
      pageSize: 10,
      searchKey: '',
      showAdd: false,
      showGbInfo: false,
      orgTree: [],
      orgOptions: [],
      selectedOrgId: '',
      includeSubOrg: true,
      gbInfo: {},
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
    onlineCount() {
      return this.list.filter((d) => this.isActiveStatus(d.status)).length;
    },
    offlineCount() {
      return this.list.filter((d) => !this.isActiveStatus(d.status)).length;
    },
  },
  mounted() {
    this.loadOrgs();
    this.load();
  },
  methods: {
    isActiveStatus(status) {
      return status === '在线' || status === '拉流中' || status === '推流中';
    },
    statusTextClass(status) {
      if (this.isActiveStatus(status)) return 'is-online';
      if (status === '未拉流' || status === '已停止') return 'is-idle';
      return 'is-offline';
    },
    statusDotClass(status) {
      if (this.isActiveStatus(status)) return 'asset-status-dot--online';
      if (status === '未拉流' || status === '已停止') return 'asset-status-dot--idle';
      return 'asset-status-dot--offline';
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
    resetSearch() {
      this.searchKey = '';
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
          page: this.page,
          pageSize: this.pageSize,
          key: this.searchKey.trim(),
        });
        let rows = data.list || [];
        if (this.selectedOrgId) {
          const scope = collectOrgScopeIds(this.orgTree, this.selectedOrgId, this.includeSubOrg);
          rows = rows.filter((r) => scope.includes(r.orgId));
        }
        this.list = rows;
        this.total = this.selectedOrgId ? rows.length : (data.total || 0);
      } catch (e) {
        this.$message.error(e.message || '加载失败');
      } finally {
        this.loading = false;
        this.updateAssetTableHeight();
      }
    },
    resetForm() {
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
</style>

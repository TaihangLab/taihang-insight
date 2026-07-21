<template>
  <el-drawer
    :visible.sync="visible"
    direction="btt"
    size="72%"
    :with-header="false"
    custom-class="onvif-discover-drawer"
    @closed="onDrawerClosed"
  >
    <div class="discover-wrap">
      <!-- 扫描页 -->
      <div v-show="!showForm" class="discover-panel">
        <div class="discover-head">
          <div class="discover-head-icon"><i class="el-icon-connection" /></div>
          <div>
            <h3>ONVIF 设备发现</h3>
            <p class="sub"> 在局域网内 WS-Discovery 扫描摄像机，点击设备填写账号后添加</p>
          </div>
        </div>

        <div class="scan-status">
          <div class="scan-icon" :class="{ pulsing: discovering }">
            <i class="el-icon-connection"></i>
          </div>
          <p v-if="discovering" class="status-text scanning">正在扫描局域网 ONVIF 设备…</p>
          <div v-else-if="devices.length === 0" class="empty-tips">
            <p class="status-text">未发现设备</p>
            <ul>
              <li>请确认摄像机与 GoWVP 在同一网段</li>
              <li>部分设备需开启 ONVIF 或 WS-Discovery</li>
              <li>也可使用「手动添加」直接填写 IP</li>
            </ul>
          </div>
        </div>

        <div v-if="devices.length" class="device-grid">
          <div
            v-for="item in devices"
            :key="item.id"
            class="device-card"
            @click="selectDevice(item)"
          >
            <i class="el-icon-video-camera device-icon"></i>
            <div class="device-ip">{{ item.ip }}</div>
            <div class="device-port">端口 {{ item.port }}</div>
          </div>
        </div>

        <div class="discover-actions">
          <el-button v-if="discovering" @click="stopDiscovery">停止扫描</el-button>
          <template v-else>
            <el-button @click="startDiscovery">重新扫描</el-button>
            <el-button type="primary" @click="openManualForm">手动添加</el-button>
          </template>
        </div>
      </div>

      <!-- 添加表单 -->
      <div v-show="showForm" class="form-panel">
        <div class="form-head">
          <el-button type="text" icon="el-icon-arrow-left" @click="showForm = false">返回</el-button>
          <span class="form-title">添加 ONVIF 设备</span>
          <el-button type="primary" :loading="submitting" @click="submitAdd">添加</el-button>
        </div>
        <el-form :model="form" label-width="100px" class="add-form">
          <el-form-item label="设备名称" required>
            <el-input v-model="form.name" placeholder="例如 Camera 192.168.1.100" />
          </el-form-item>
          <el-form-item label="所属组织" required>
            <el-select v-model="form.orgId" placeholder="请选择组织" style="width:100%">
              <el-option v-for="o in orgOptions" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="IP" required>
            <el-input v-model="form.ip" placeholder="192.168.1.100" />
          </el-form-item>
          <el-form-item label="端口" required>
            <el-input-number v-model="form.port" :min="1" :max="65535" />
          </el-form-item>
          <el-form-item label="用户名" required>
            <el-input v-model="form.username" placeholder="admin" />
          </el-form-item>
          <el-form-item label="密码" required>
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
          <el-form-item label="自动建点">
            <el-switch v-model="form.createPoint" />
          </el-form-item>
        </el-form>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import config from '../../../../config/index.js';
import { assetAPI } from '../../service/AssetService.js';

const DISCOVER_URL = `${config.API_BASE_URL}/api/v1/asset/onvif/discover`;

export default {
  name: 'OnvifDiscover',
  props: {
    orgOptions: {
      type: Array,
      default: () => [],
    },
    defaultOrgId: {
      type: String,
      default: 'org-root',
    },
  },
  data() {
    return {
      visible: false,
      discovering: false,
      showForm: false,
      submitting: false,
      devices: [],
      eventSource: null,
      scanFinished: false,
      form: this.emptyForm(),
    };
  },
  beforeDestroy() {
    this.stopDiscovery();
  },
  methods: {
    emptyForm() {
      return {
        name: '',
        orgId: this.defaultOrgId || 'org-root',
        ip: '',
        port: 80,
        username: 'admin',
        password: '',
        createPoint: true,
      };
    },
    open() {
      this.visible = true;
      this.showForm = false;
      this.devices = [];
      this.form = this.emptyForm();
      this.$nextTick(() => {
        this.startDiscovery();
      });
    },
    onDrawerClosed() {
      this.stopDiscovery();
      this.showForm = false;
    },
    startDiscovery() {
      this.stopDiscovery(false);
      this.discovering = true;
      this.scanFinished = false;
      this.devices = [];
      this.showForm = false;

      const es = new EventSource(DISCOVER_URL);
      this.eventSource = es;

      es.addEventListener('discover', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!data.addr) return;
          const [ip, portStr] = String(data.addr).split(':');
          const port = parseInt(portStr, 10) || 80;
          const exists = this.devices.some((d) => d.ip === ip && d.port === port);
          if (exists) return;
          this.devices.push({
            id: `device-${ip}-${port}`,
            ip,
            port,
          });
        } catch (e) {
          console.error('解析 ONVIF 扫描结果失败', e);
        }
      });

      es.addEventListener('end', () => {
        this.scanFinished = true;
        this.stopDiscovery();
      });

      // SSE 正常结束时浏览器也会触发 onerror，需用 scanFinished 区分
      es.onerror = () => {
        if (this.scanFinished) {
          this.stopDiscovery();
          return;
        }
        if (es.readyState === EventSource.CONNECTING) {
          return;
        }
        this.stopDiscovery();
        this.$message.warning('GoWVP 扫描服务异常，请确认 gowvp 已启动');
      };
    },
    stopDiscovery(closeEs = true) {
      if (closeEs && this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
      this.discovering = false;
    },
    selectDevice(device) {
      this.form = {
        ...this.emptyForm(),
        ip: device.ip,
        port: device.port,
        name: `Camera ${device.ip}`,
      };
      this.showForm = true;
    },
    openManualForm() {
      this.form = this.emptyForm();
      this.showForm = true;
    },
    async submitAdd() {
      if (!this.form.name || !this.form.ip || !this.form.port) {
        this.$message.warning('请填写设备名称、IP 和端口');
        return;
      }
      if (!this.form.username || !this.form.password) {
        this.$message.warning('ONVIF 设备需要填写用户名和密码');
        return;
      }
      if (!this.form.orgId) {
        this.$message.warning('请选择所属组织');
        return;
      }
      this.submitting = true;
      try {
        await assetAPI.createDevice({
          name: this.form.name,
          accessType: 'onvif',
          orgId: this.form.orgId,
          ip: this.form.ip,
          port: this.form.port,
          username: this.form.username,
          password: this.form.password,
          createPoint: this.form.createPoint,
        });
        this.$message.success('添加成功');
        this.visible = false;
        this.stopDiscovery();
        this.$emit('added');
      } catch (e) {
        this.$message.error(e.message || '添加失败');
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style scoped>
.discover-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 24px 24px;
  box-sizing: border-box;
}

.discover-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.discover-head-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #409eff 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  flex-shrink: 0;
}

.discover-head h3 {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.discover-head .sub {
  margin: 0;
  color: #909399;
  font-size: 13px;
}

.scan-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 16px 0;
}

.scan-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #ecf5ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #409eff;
}

.scan-icon.pulsing {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.85; }
}

.status-text {
  margin: 12px 0 0;
  color: #606266;
}

.status-text.scanning {
  color: #409eff;
}

.empty-tips ul {
  margin: 8px 0 0;
  padding-left: 18px;
  color: #909399;
  font-size: 13px;
  line-height: 1.8;
  text-align: left;
}

.device-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  padding: 8px 0 16px;
}

.device-card {
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 18px 12px;
  text-align: center;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
  background: #fafbfc;
}

.device-card:hover {
  border-color: #409eff;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
  background: #fff;
}

.device-icon {
  font-size: 28px;
  color: #409eff;
}

.device-ip {
  margin-top: 8px;
  font-weight: 600;
  font-size: 14px;
}

.device-port {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.discover-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}

.form-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.form-title {
  font-size: 16px;
  font-weight: 600;
}

.add-form {
  max-width: 520px;
  margin: 0 auto;
  width: 100%;
}
</style>

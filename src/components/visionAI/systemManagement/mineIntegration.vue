<template>
  <div class="mine-integration-page">
    <div class="page-heading">
      <div>
        <h2>煤矿平台对接</h2>
        <p>配置接收平台网关和 OAuth 客户端。客户端密钥由本平台后端加密保存，浏览器不会读取已保存的密钥。</p>
      </div>
      <el-tag :type="config.enabled ? 'success' : 'info'">
        {{ config.enabled ? '已启用配置' : '未启用推送' }}
      </el-tag>
    </div>

    <el-card shadow="never" class="config-card">
      <el-alert
        title="当前阶段"
        type="info"
        :closable="false"
        show-icon
        description="连接测试只获取 OAuth 令牌，不会向对方写入摄像仪或算法业务数据。上下车人数只有在下方开关打开、并且摄像机已配置对方编码时才会入队。"
      />

      <el-form ref="form" :model="config" :rules="rules" label-width="170px" class="config-form">
        <el-form-item label="网关地址" prop="base_url">
          <el-input v-model.trim="config.base_url" placeholder="http://172.16.201.80:8000/coal" />
          <div class="field-help">填写接收端网关根地址，不要在末尾加业务接口路径。</div>
        </el-form-item>
        <el-form-item label="OAuth 客户端 ID" prop="client_id">
          <el-input v-model.trim="config.client_id" autocomplete="off" />
        </el-form-item>
        <el-form-item label="客户端密钥">
          <el-input
            v-model="config.client_secret"
            type="password"
            autocomplete="new-password"
            show-password
            :placeholder="secretConfigured ? '密钥已保存；留空表示不修改' : '请输入客户端密钥'"
          />
          <div class="field-help">保存后不会回显。更换密钥时输入新值；留空会保留已保存的密钥。</div>
        </el-form-item>
        <el-form-item label="Scope" prop="scope">
          <el-input v-model.trim="config.scope" placeholder="mine" />
        </el-form-item>
        <el-form-item label="煤矿编码">
          <el-input v-model.trim="config.mine_code" maxlength="12" placeholder="可留空，使用接收端全局配置" />
        </el-form-item>
        <el-form-item label="请求超时">
          <el-input-number v-model="config.timeout_seconds" :min="3" :max="120" />
          <span class="unit">秒</span>
        </el-form-item>
        <el-form-item label="启用对接配置">
          <el-switch v-model="config.enabled" active-text="启用" inactive-text="关闭" />
          <div class="field-help">关闭时不向煤矿平台发送数据。打开后，只发送已配置摄像仪编码的上车/下车人数；认证测试不受此开关影响。尾随不向对方发送。</div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-check" :loading="saving" @click="saveConfig">保存配置</el-button>
          <el-button icon="el-icon-connection" :loading="testing" @click="testConnection">测试认证</el-button>
          <el-button icon="el-icon-refresh" :disabled="saving || testing" @click="loadConfig">重新加载</el-button>
        </el-form-item>
      </el-form>
      <el-alert
        v-if="testResult.message"
        :title="testResult.message"
        :type="testResult.success ? 'success' : 'error'"
        :closable="false"
        show-icon
        class="test-result"
      />
    </el-card>

    <el-card shadow="never" class="config-card section-card">
      <div slot="header">摄像仪编码映射</div>
      <el-alert
        title="未配置对方摄像仪编码时不会发送，也不会使用 camera_01 等默认值。"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form :inline="true" class="mapping-form" @submit.native.prevent>
        <el-form-item label="本平台摄像机">
          <el-select v-model="mapping.local_camera_id" filterable allow-create default-first-option placeholder="选择或输入摄像机 ID" style="width: 280px">
            <el-option v-for="camera in cameras" :key="camera.id" :label="cameraLabel(camera)" :value="String(camera.id)" />
          </el-select>
        </el-form-item>
        <el-form-item label="对方 cameraCode">
          <el-input v-model.trim="mapping.camera_code" placeholder="矿下安装后提供的编码" style="width: 260px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="mappingSaving" @click="saveMapping">保存映射</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="mappings" size="small" empty-text="尚未配置摄像仪编码">
        <el-table-column prop="local_camera_id" label="本平台摄像机" min-width="180" />
        <el-table-column prop="camera_code" label="对方 cameraCode" min-width="180" />
        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button type="text" @click="removeMapping(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never" class="config-card section-card">
      <div slot="header" class="record-header">
        <span>上下车人数外发记录</span>
        <el-button size="mini" icon="el-icon-refresh" @click="loadRecords">刷新</el-button>
      </div>
      <el-alert
        title="对方接口没有方向字段。上车和下车都会以 analysisType=08 推送，对方系统无法区分这两类结果。尾随只保留在本平台内部，不会调用煤矿平台接口。"
        type="info"
        :closable="false"
        show-icon
        class="record-note"
      />
      <el-radio-group v-model="recordStatus" size="small" @change="loadRecords">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="config_error">配置错误</el-radio-button>
        <el-radio-button label="pending">待发送</el-radio-button>
        <el-radio-button label="failed">最终失败</el-radio-button>
        <el-radio-button label="succeeded">已成功</el-radio-button>
      </el-radio-group>
      <el-table :data="records" size="small" empty-text="暂无外发记录" class="record-table">
        <el-table-column prop="data_time" label="数据时间" min-width="160" />
        <el-table-column prop="local_camera_id" label="本平台摄像机" min-width="140" />
        <el-table-column prop="camera_code" label="cameraCode" min-width="140" />
        <el-table-column prop="analysis_case" label="人数编码" width="100" />
        <el-table-column label="本平台方向" width="110">
          <template slot-scope="scope">{{ sideText(scope.row.event_side) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template slot-scope="scope">{{ statusText(scope.row.status) }}</template>
        </el-table-column>
        <el-table-column prop="attempt_count" label="尝试" width="70" />
        <el-table-column prop="last_error" label="说明" min-width="220" />
        <el-table-column label="操作" width="90">
          <template slot-scope="scope">
            <el-button v-if="scope.row.status === 'failed' || scope.row.status === 'config_error'" type="text" @click="retryRecord(scope.row)">重试</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { cameraAPI, mineIntegrationAPI, formatApiError } from '../../service/VisionAIService'

const emptyConfig = () => ({
  base_url: 'http://172.16.201.80:8000/coal',
  client_id: '',
  client_secret: '',
  scope: 'mine',
  mine_code: '',
  enabled: false,
  timeout_seconds: 15
})

export default {
  name: 'MineIntegration',
  data() {
    return {
      config: emptyConfig(),
      secretConfigured: false,
      saving: false,
      testing: false,
      testResult: { success: false, message: '' },
      cameras: [],
      mappings: [],
      mapping: { local_camera_id: '', camera_code: '' },
      mappingSaving: false,
      records: [],
      recordStatus: '',
      rules: {
        base_url: [
          { required: true, message: '请输入网关地址', trigger: 'blur' },
          { type: 'url', message: '请输入完整地址，例如 http://172.16.201.80:8000/coal', trigger: 'blur' }
        ],
        client_id: [{ required: true, message: '请输入 OAuth 客户端 ID', trigger: 'blur' }],
        scope: [{ required: true, message: '请输入 Scope', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.loadConfig()
    this.loadCameras()
    this.loadMappings()
    this.loadRecords()
  },
  methods: {
    async loadConfig() {
      try {
        const res = await mineIntegrationAPI.getConfig()
        const saved = res.data || {}
        this.config = Object.assign(emptyConfig(), saved, { client_secret: '' })
        this.secretConfigured = !!saved.client_secret_configured
        this.testResult = { success: false, message: '' }
      } catch (error) {
        this.$message.error(formatApiError(error, '读取煤矿平台对接配置失败'))
      }
    },
    async saveConfig() {
      const valid = await new Promise(resolve => this.$refs.form.validate(resolve))
      if (!valid) return
      this.saving = true
      try {
        const payload = {
          base_url: this.config.base_url,
          client_id: this.config.client_id,
          client_secret: this.config.client_secret || null,
          scope: this.config.scope,
          mine_code: this.config.mine_code || null,
          enabled: this.config.enabled,
          timeout_seconds: this.config.timeout_seconds
        }
        const res = await mineIntegrationAPI.saveConfig(payload)
        const saved = res.data || {}
        this.secretConfigured = !!saved.client_secret_configured
        this.config.client_secret = ''
        this.$message.success('对接配置已保存')
      } catch (error) {
        this.$message.error(formatApiError(error, '保存煤矿平台对接配置失败'))
      } finally {
        this.saving = false
      }
    },
    async testConnection() {
      this.testing = true
      this.testResult = { success: false, message: '' }
      try {
        const res = await mineIntegrationAPI.testConnection()
        const result = res.data || {}
        this.testResult = {
          success: !!result.success,
          message: result.message || (result.success ? '认证成功' : '认证失败')
        }
      } catch (error) {
        this.testResult = { success: false, message: formatApiError(error, '认证测试失败') }
      } finally {
        this.testing = false
      }
    },
    cameraLabel(camera) {
      return `${camera.name || '未命名'}（${camera.id}）`
    },
    sideText(side) {
      if (side === 'boarding') return '上车（仅本平台）'
      if (side === 'alighting') return '下车（仅本平台）'
      return side || '-'
    },
    statusText(status) {
      return {
        pending: '待发送',
        sending: '发送中',
        succeeded: '已成功',
        failed: '最终失败',
        config_error: '配置错误',
        invalid: '计数无效',
        blocked: '已拦截'
      }[status] || status
    },
    async loadCameras() {
      try {
        const res = await cameraAPI.getCameraList({ page: 1, limit: 100 })
        const body = res.data || {}
        this.cameras = body.data || body.cameras || []
      } catch (error) {
        this.cameras = []
      }
    },
    async loadMappings() {
      try {
        const res = await mineIntegrationAPI.listCameraMappings()
        this.mappings = (res.data && res.data.items) || []
      } catch (error) {
        this.$message.error(formatApiError(error, '读取摄像仪编码映射失败'))
      }
    },
    async saveMapping() {
      if (!this.mapping.local_camera_id || !this.mapping.camera_code) {
        this.$message.warning('请填写本平台摄像机和对方摄像仪编码')
        return
      }
      this.mappingSaving = true
      try {
        await mineIntegrationAPI.saveCameraMapping({
          local_camera_id: this.mapping.local_camera_id,
          camera_code: this.mapping.camera_code
        })
        this.mapping.camera_code = ''
        this.$message.success('摄像仪编码已保存')
        await this.loadMappings()
        await this.loadRecords()
      } catch (error) {
        this.$message.error(formatApiError(error, '保存摄像仪编码失败'))
      } finally {
        this.mappingSaving = false
      }
    },
    async removeMapping(row) {
      try {
        await mineIntegrationAPI.deleteCameraMapping(row.local_camera_id)
        this.$message.success('映射已删除')
        await this.loadMappings()
      } catch (error) {
        this.$message.error(formatApiError(error, '删除摄像仪编码失败'))
      }
    },
    async loadRecords() {
      try {
        const params = { limit: 50 }
        if (this.recordStatus) params.status = this.recordStatus
        const res = await mineIntegrationAPI.listOutbound(params)
        this.records = (res.data && res.data.items) || []
      } catch (error) {
        this.$message.error(formatApiError(error, '读取外发记录失败'))
      }
    },
    async retryRecord(row) {
      try {
        await mineIntegrationAPI.retryOutbound(row.id)
        this.$message.success('已重新排队')
        await this.loadRecords()
      } catch (error) {
        this.$message.error(formatApiError(error, '重试外发失败'))
      }
    }
  }
}
</script>

<style scoped>
.mine-integration-page { padding: 22px 28px 32px; color: #263445; }
.page-heading { display: flex; align-items: center; justify-content: space-between; margin: 0 auto 18px; max-width: 1080px; }
.page-heading h2 { margin: 0 0 8px; font-size: 22px; }
.page-heading p { margin: 0; color: #738093; font-size: 13px; line-height: 1.7; }
.config-card { max-width: 1080px; margin: 0 auto; border-radius: 8px; }
.config-form { max-width: 780px; margin: 24px auto 4px; }
.field-help { margin-top: 4px; color: #8793a2; font-size: 12px; line-height: 1.5; }
.unit { margin-left: 10px; color: #606c7a; }
.test-result { margin: 12px auto 0; max-width: 780px; }
.section-card { margin-top: 16px; }
.mapping-form { margin-top: 16px; }
.record-header { display: flex; align-items: center; justify-content: space-between; }
.record-note { margin-bottom: 12px; }
.record-table { margin-top: 12px; }
@media (max-width: 700px) {
  .mine-integration-page { padding: 16px 12px; }
  .page-heading { align-items: flex-start; gap: 12px; }
  .config-form { margin-top: 18px; }
}
</style>

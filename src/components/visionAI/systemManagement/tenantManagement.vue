<template>
  <div class="tenant-mgmt">
    <div class="page-header">
      <h2>租户管理</h2>
      <p class="subtitle">管理多租户、分配套餐、启停账户与切换查看（仅超级管理员可见）</p>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="query" size="small">
        <el-form-item label="企业名称">
          <el-input v-model="query.companyName" placeholder="企业名称" clearable @keyup.enter.native="loadList(1)"/>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width:120px">
            <el-option label="正常" value="0"/>
            <el-option label="停用" value="1"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="loadList(1)">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
        <el-form-item style="float:right">
          <el-button type="success" icon="el-icon-plus" @click="openCreateDialog">新增租户</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table v-loading="loading" :data="list" border stripe size="small">
        <el-table-column label="租户编号" prop="tenantId" width="100"/>
        <el-table-column label="企业名称" prop="companyName" min-width="160"/>
        <el-table-column label="联系人" prop="contactUserName" width="120"/>
        <el-table-column label="联系电话" prop="contactPhoneNumber" width="140"/>
        <el-table-column label="套餐ID" prop="packageId" width="90"/>
        <el-table-column label="过期时间" prop="expireTime" width="170">
          <template slot-scope="scope">{{ scope.row.expireTime || '永不' }}</template>
        </el-table-column>
        <el-table-column label="账号数" prop="accountCount" width="80">
          <template slot-scope="scope">{{ scope.row.accountCount === -1 ? '不限' : scope.row.accountCount }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-switch
              :value="scope.row.status === '0'"
              :disabled="scope.row.tenantId === '000000'"
              @change="onToggleStatus(scope.row, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template slot-scope="scope">
            <el-button type="text" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button type="text" @click="onSwitchTenant(scope.row)" v-if="scope.row.tenantId !== '000000'">切换查看</el-button>
            <el-button type="text" style="color:#f56c6c" :disabled="scope.row.tenantId === '000000'" @click="onDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-row">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :current-page.sync="query.pageNum"
          :page-size.sync="query.pageSize"
          :page-sizes="[10, 20, 50]"
          @current-change="loadList()"
          @size-change="loadList(1)"
        />
      </div>
    </el-card>

    <!-- 新增 / 编辑对话框 -->
    <el-dialog :title="dialogMode === 'create' ? '新增租户' : '编辑租户'" :visible.sync="dialogVisible" width="640px" :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="110px" size="small">
        <el-form-item label="企业名称" prop="companyName">
          <el-input v-model="form.companyName" placeholder="必填"/>
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contactUserName"/>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contactPhoneNumber"/>
        </el-form-item>
        <el-form-item label="信用代码">
          <el-input v-model="form.licenseNumber"/>
        </el-form-item>
        <el-form-item label="访问域名">
          <el-input v-model="form.domain" placeholder="可选，按 host 自动选中"/>
        </el-form-item>
        <el-form-item label="租户套餐" prop="packageId">
          <el-select v-model="form.packageId" placeholder="请选择套餐" style="width:100%">
            <el-option v-for="p in packageOptions" :key="p.packageId" :label="p.packageName + '（#' + p.packageId + '）'" :value="p.packageId"/>
          </el-select>
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker v-model="form.expireTime" type="datetime" placeholder="留空表示永不过期" value-format="yyyy-MM-dd HH:mm:ss" style="width:100%"/>
        </el-form-item>
        <el-form-item label="账号数限制">
          <el-input-number v-model="form.accountCount" :min="-1" :max="10000"/>
          <span style="margin-left:8px;color:#909399">-1 不限</span>
        </el-form-item>
        <template v-if="dialogMode === 'create'">
          <el-divider content-position="left">租户管理员账号（自动创建）</el-divider>
          <el-form-item label="管理员账号" prop="username">
            <el-input v-model="form.username" placeholder="2-64 字符"/>
          </el-form-item>
          <el-form-item label="初始密码" prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="8-20 位，字母+数字+特殊字符"/>
          </el-form-item>
        </template>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" rows="2"/>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmit">保 存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  listTenants,
  addTenant,
  updateTenant,
  deleteTenants,
  changeTenantStatus,
  switchTenant
} from '@/api/tenant'
import { selectTenantPackages } from '@/api/tenantPackage'
import { clearLoginBootstrapCache } from '@/utils/loginBootstrap'

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[~!@#$%^&*()_+`\-={}:";'<>?,.\/]).{8,20}$/

export default {
  name: 'TenantManagement',
  data () {
    return {
      query: { pageNum: 1, pageSize: 10, companyName: '', status: '' },
      list: [],
      total: 0,
      loading: false,
      packageOptions: [],
      dialogVisible: false,
      dialogMode: 'create',
      submitting: false,
      form: this.emptyForm(),
      rules: {
        companyName: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
        packageId: [{ required: true, message: '请选择套餐', trigger: 'change' }],
        username: [{ required: true, message: '请输入管理员账号', trigger: 'blur' }, { min: 2, max: 64, message: '账号长度 2-64', trigger: 'blur' }],
        password: [
          { required: true, message: '请输入初始密码', trigger: 'blur' },
          { pattern: PASSWORD_PATTERN, message: '密码 8-20 位，必须含字母+数字+特殊字符', trigger: 'blur' }
        ]
      }
    }
  },
  mounted () {
    this.loadPackages()
    this.loadList()
  },
  methods: {
    emptyForm () {
      return {
        id: null,
        companyName: '',
        contactUserName: '',
        contactPhoneNumber: '',
        licenseNumber: '',
        domain: '',
        packageId: null,
        expireTime: null,
        accountCount: -1,
        username: '',
        password: '',
        remark: ''
      }
    },
    loadPackages () {
      selectTenantPackages().then(res => {
        this.packageOptions = res.data || []
      })
    },
    loadList (page) {
      if (page) this.query.pageNum = page
      this.loading = true
      listTenants(this.query).then(res => {
        const data = res.data || {}
        this.list = data.rows || []
        this.total = data.total || 0
      }).finally(() => { this.loading = false })
    },
    resetQuery () {
      this.query = { pageNum: 1, pageSize: 10, companyName: '', status: '' }
      this.loadList()
    },
    openCreateDialog () {
      this.dialogMode = 'create'
      this.form = this.emptyForm()
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    },
    openEditDialog (row) {
      this.dialogMode = 'edit'
      this.form = Object.assign(this.emptyForm(), row, { username: '', password: '' })
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    },
    onSubmit () {
      this.$refs.form.validate(valid => {
        if (!valid) return
        this.submitting = true
        const payload = Object.assign({}, this.form)
        const api = this.dialogMode === 'create' ? addTenant(payload) : updateTenant(payload)
        api.then(res => {
          clearLoginBootstrapCache()
          this.$message({ message: res.msg || '操作成功', type: 'success' })
          this.dialogVisible = false
          this.loadList()
        }).finally(() => { this.submitting = false })
      })
    },
    onToggleStatus (row, on) {
      const newStatus = on ? '0' : '1'
      changeTenantStatus(row.id, newStatus).then(() => {
        clearLoginBootstrapCache()
        row.status = newStatus
        this.$message({ message: '已更新', type: 'success' })
      })
    },
    onDelete (row) {
      this.$confirm(`确认删除租户「${row.companyName}」？该操作不可恢复`, '确认删除', { type: 'warning' }).then(() => {
        deleteTenants(row.id).then(res => {
          clearLoginBootstrapCache()
          this.$message({ message: res.msg || '删除成功', type: 'success' })
          this.loadList()
        })
      }).catch(() => {})
    },
    onSwitchTenant (row) {
      this.$confirm(`将当前会话切换到租户「${row.companyName} / ${row.tenantId}」查看其数据？`, '切换租户', { type: 'info' }).then(() => {
        switchTenant(row.tenantId).then(res => {
          this.$store.commit('SET_DYNAMIC_TENANT_ID', row.tenantId)
          this.$message({ message: res.msg || '切换成功，刷新页面后生效', type: 'success' })
        })
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.tenant-mgmt { padding: 16px; }
.page-header { margin-bottom: 12px; }
.page-header h2 { margin: 0 0 4px; }
.subtitle { margin: 0; color: #909399; font-size: 12px; }
.filter-card { margin-bottom: 12px; }
.pagination-row { margin-top: 12px; text-align: right; }
</style>

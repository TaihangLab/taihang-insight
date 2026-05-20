<template>
  <div class="user-mgmt">
    <div class="page-header">
      <h2>用户管理</h2>
      <p class="subtitle">管理本租户内的账号、角色与所属部门（账号在本租户内不可重复）</p>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="query" size="small">
        <el-form-item label="账号">
          <el-input v-model="query.userName" placeholder="账号" clearable @keyup.enter.native="loadList(1)"/>
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
          <el-button type="success" icon="el-icon-plus" @click="openCreateDialog">新增用户</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table v-loading="loading" :data="list" border stripe size="small">
        <el-table-column label="ID" prop="userId" width="80"/>
        <el-table-column label="账号" prop="userName" min-width="120"/>
        <el-table-column label="昵称" prop="nickName" min-width="120"/>
        <el-table-column label="邮箱" prop="email" min-width="180" show-overflow-tooltip/>
        <el-table-column label="手机号" prop="phonenumber" width="130"/>
        <el-table-column label="部门" prop="deptId" width="80"/>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'" size="mini">
              {{ scope.row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="160"/>
        <el-table-column label="操作" width="180">
          <template slot-scope="scope">
            <el-button type="text" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button type="text" style="color:#f56c6c" :disabled="scope.row.userId === 1" @click="onDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-row">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper"
          :total="total" :current-page.sync="query.pageNum" :page-size.sync="query.pageSize"
          :page-sizes="[10, 20, 50]" @current-change="loadList()" @size-change="loadList(1)"/>
      </div>
    </el-card>

    <el-dialog :title="dialogMode === 'create' ? '新增用户' : '编辑用户'" :visible.sync="dialogVisible" width="560px" :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" size="small">
        <el-form-item label="账号" prop="userName">
          <el-input v-model="form.userName" :disabled="dialogMode === 'edit'" placeholder="2-64 字符，本租户内唯一"/>
        </el-form-item>
        <el-form-item label="昵称" prop="nickName">
          <el-input v-model="form.nickName" placeholder="留空则使用账号"/>
        </el-form-item>
        <el-form-item v-if="dialogMode === 'create'" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="8-20 位，字母+数字+特殊字符"/>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="可选"/>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phonenumber"/>
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="form.sex" style="width:140px">
            <el-option label="男" value="0"/>
            <el-option label="女" value="1"/>
            <el-option label="未知" value="2"/>
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleIds" multiple placeholder="选择角色" style="width:100%">
            <el-option v-for="r in roleOptions" :key="r.roleId" :label="r.roleName" :value="r.roleId"/>
          </el-select>
        </el-form-item>
        <el-form-item v-if="dialogMode === 'edit'" label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
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
import { listUsers, addUser, updateUser, deleteUser, getUserRoles } from '@/api/user'
import { listRoles } from '@/api/role'

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[~!@#$%^&*()_+`\-={}:";'<>?,./]).{8,20}$/

export default {
  name: 'UserManagement',
  data () {
    return {
      query: { pageNum: 1, pageSize: 10, userName: '', status: '' },
      list: [],
      total: 0,
      loading: false,
      roleOptions: [],
      dialogVisible: false,
      dialogMode: 'create',
      submitting: false,
      form: this.emptyForm(),
      rules: {
        userName: [
          { required: true, message: '请输入账号', trigger: 'blur' },
          { min: 2, max: 64, message: '账号长度 2-64', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { pattern: PASSWORD_PATTERN, message: '密码 8-20 位，必须含字母+数字+特殊字符', trigger: 'blur' }
        ],
        email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
      }
    }
  },
  mounted () {
    this.loadRoles()
    this.loadList()
  },
  methods: {
    emptyForm () {
      return {
        userId: null, userName: '', nickName: '', password: '',
        email: '', phonenumber: '', sex: '0', roleIds: [], status: '0'
      }
    },
    loadRoles () {
      listRoles({ pageNum: 1, pageSize: 200 }).then(res => {
        const data = res.data || {}
        this.roleOptions = data.rows || data || []
      })
    },
    loadList (page) {
      if (page) this.query.pageNum = page
      this.loading = true
      listUsers(this.query).then(res => {
        const data = res.data || {}
        this.list = data.rows || []
        this.total = data.total || 0
      }).finally(() => { this.loading = false })
    },
    resetQuery () {
      this.query = { pageNum: 1, pageSize: 10, userName: '', status: '' }
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
      this.form = Object.assign(this.emptyForm(), row)
      this.dialogVisible = true
      getUserRoles(row.userId).then(res => {
        this.$set(this.form, 'roleIds', res.data || [])
      })
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    },
    onSubmit () {
      this.$refs.form.validate(valid => {
        if (!valid) return
        this.submitting = true
        const payload = Object.assign({}, this.form)
        if (payload.userName) payload.userName = String(payload.userName).trim()
        if (this.dialogMode === 'edit') delete payload.password
        const api = this.dialogMode === 'create' ? addUser(payload) : updateUser(this.form.userId, payload)
        api.then(res => {
          this.$message({ message: res.msg || '操作成功', type: 'success' })
          this.dialogVisible = false
          this.loadList()
        }).finally(() => { this.submitting = false })
      })
    },
    onDelete (row) {
      this.$confirm(`确认删除用户「${row.userName}」？`, '确认删除', { type: 'warning' }).then(() => {
        deleteUser(row.userId).then(res => {
          this.$message({ message: res.msg || '删除成功', type: 'success' })
          this.loadList()
        })
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.user-mgmt { padding: 16px; }
.page-header { margin-bottom: 12px; }
.page-header h2 { margin: 0 0 4px; }
.subtitle { margin: 0; color: #909399; font-size: 12px; }
.filter-card { margin-bottom: 12px; }
.pagination-row { margin-top: 12px; text-align: right; }
</style>

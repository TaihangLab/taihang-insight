<template>
  <div class="user-mgmt">
    <div class="page-header">
      <h2>用户管理</h2>
      <p class="subtitle">管理系统账号、角色与所属部门</p>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="query" size="small">
        <el-form-item label="账号">
          <el-input v-model="query.userName" placeholder="账号" clearable @keyup.enter.native="loadList(1)"/>
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="query.nickName" placeholder="昵称" clearable @keyup.enter.native="loadList(1)"/>
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
        <el-table-column label="部门" prop="deptName" min-width="200" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ scope.row.deptName || '—' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'" size="mini">
              {{ scope.row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="160"/>
        <el-table-column label="操作" width="260">
          <template slot-scope="scope">
            <el-button type="text" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button
              type="text"
              @click="openResetPwdDialog(scope.row)"
            >重置密码</el-button>
            <el-button type="text" style="color:#f56c6c" :disabled="isBuiltinAdmin(scope.row)" @click="onDelete(scope.row)">删除</el-button>
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
          <el-input v-model="form.userName" :disabled="dialogMode === 'edit'" placeholder="2-64 字符，全局唯一"/>
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
        <el-form-item label="部门">
          <el-popover
            ref="deptPopover"
            placement="bottom-start"
            width="380"
            trigger="click"
            popper-class="user-dept-tree-popover"
            @show="onDeptPopoverShow"
          >
            <div class="dept-tree-panel">
              <el-input
                v-model="deptTreeFilter"
                size="small"
                clearable
                prefix-icon="el-icon-search"
                placeholder="搜索部门名称或路径"
                @input="filterDeptTree"
              />
              <el-tree
                ref="deptTree"
                class="dept-select-tree"
                :data="deptTreeOptions"
                node-key="deptId"
                :props="deptTreeProps"
                default-expand-all
                highlight-current
                :expand-on-click-node="false"
                :filter-node-method="filterDeptNode"
                @node-click="selectDept"
              >
                <span slot-scope="{ data }" class="dept-tree-node" @click.stop="selectDept(data)">
                  <span class="dept-tree-node__name">{{ data.deptName }}</span>
                  <span v-if="data.deptPath && data.deptPath !== data.deptName" class="dept-tree-node__path">
                    {{ data.deptPath }}
                  </span>
                </span>
              </el-tree>
            </div>
            <el-input
              slot="reference"
              readonly
              :value="selectedDeptLabel"
              placeholder="点击选择所属部门"
              style="width:100%"
              class="dept-tree-input"
            >
              <i
                v-if="form.deptId"
                slot="suffix"
                class="el-input__icon el-icon-circle-close dept-clear-icon"
                @click.stop="clearDept"
              />
              <i v-else slot="suffix" class="el-input__icon el-icon-arrow-down"/>
            </el-input>
          </el-popover>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleIds" multiple placeholder="选择角色" style="width:100%">
            <el-option v-for="r in roleOptions" :key="r.roleId" :label="r.roleName" :value="r.roleId"/>
          </el-select>
        </el-form-item>
        <el-form-item v-if="dialogMode === 'edit'" label="状态">
          <el-radio-group v-model="form.status" :disabled="isBuiltinAdmin(form)">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
          <span v-if="isBuiltinAdmin(form)" class="protected-tip">内置管理员账号不可停用</span>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmit">保 存</el-button>
      </div>
    </el-dialog>

    <el-dialog title="重置密码" :visible.sync="resetPwdVisible" width="480px" :close-on-click-modal="false" @closed="onResetPwdClosed">
      <p class="reset-tip">为用户 <strong>{{ resetPwdTarget.userName }}</strong> 设置新密码（无需旧密码）</p>
      <el-form ref="resetPwdForm" :model="resetPwdForm" :rules="resetPwdRules" label-width="100px" size="small">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetPwdForm.password" type="password" show-password placeholder="8-20 位，字母+数字+特殊字符"/>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetPwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码"/>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="resetPwdVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetPwdSubmitting" @click="onResetPwdSubmit">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listUsers, addUser, updateUser, deleteUser, getUser, getUserDeptTree, resetUserPassword } from '@/api/user'
import { listRoles } from '@/api/role'

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[~!@#$%^&*()_+`\-={}:";'<>?,./]).{8,20}$/

export default {
  name: 'UserManagement',
  data () {
    return {
      query: { pageNum: 1, pageSize: 10, userName: '', nickName: '', status: '' },
      list: [],
      total: 0,
      loading: false,
      roleOptions: [],
      deptTreeOptions: [],
      deptFlatMap: {},
      deptTreeProps: { label: 'deptName', children: 'children' },
      deptTreeFilter: '',
      dialogVisible: false,
      dialogMode: 'create',
      submitting: false,
      form: this.emptyForm(),
      resetPwdVisible: false,
      resetPwdSubmitting: false,
      resetPwdTarget: { userId: null, userName: '' },
      resetPwdForm: { password: '', confirmPassword: '' },
      rules: {
        userName: [
          { required: true, message: '请输入账号', trigger: 'blur' },
          { min: 2, max: 64, message: '账号长度 2-64', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { pattern: PASSWORD_PATTERN, message: '密码 8-20 位，必须含字母+数字+特殊字符', trigger: 'blur' }
        ],
        email: [{
          validator: (rule, value, cb) => {
            const v = (value == null ? '' : String(value)).trim()
            if (!v) return cb()
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!re.test(v)) cb(new Error('邮箱格式不正确'))
            else cb()
          },
          trigger: 'blur'
        }]
      },
      resetPwdRules: {
        password: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { pattern: PASSWORD_PATTERN, message: '密码 8-20 位，必须含字母+数字+特殊字符', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请再次输入密码', trigger: 'blur' },
          {
            validator: (rule, value, cb) => {
              if (value !== this.resetPwdForm.password) cb(new Error('两次输入的密码不一致'))
              else cb()
            },
            trigger: 'blur'
          }
        ]
      }
    }
  },
  computed: {
    selectedDeptLabel () {
      if (!this.form.deptId) return ''
      const node = this.deptFlatMap[this.form.deptId]
      if (!node) return ''
      return node.deptPath || node.deptName || ''
    }
  },
  mounted () {
    this.loadRoles()
    this.loadDeptTree()
    this.loadList()
  },
  methods: {
    isBuiltinAdmin (row) {
      if (!row) return false
      const name = (row.userName || '').trim()
      return name === 'admin' || name === 'admin2'
    },
    emptyForm () {
      return {
        userId: null, userName: '', nickName: '', password: '',
        email: '', phonenumber: '', sex: '0', deptId: null, roleIds: [], status: '0'
      }
    },
    flattenDeptTree (nodes) {
      ;(nodes || []).forEach(n => {
        this.deptFlatMap[n.deptId] = n
        if (n.children && n.children.length) this.flattenDeptTree(n.children)
      })
    },
    loadDeptTree () {
      getUserDeptTree().then(res => {
        this.deptTreeOptions = res.data || []
        this.deptFlatMap = {}
        this.flattenDeptTree(this.deptTreeOptions)
      }).catch(() => {
        this.deptTreeOptions = []
        this.deptFlatMap = {}
      })
    },
    onDeptPopoverShow () {
      this.deptTreeFilter = ''
      this.$nextTick(() => {
        const tree = this.$refs.deptTree
        if (tree) {
          tree.filter('')
          if (this.form.deptId) tree.setCurrentKey(this.form.deptId)
        }
      })
    },
    filterDeptTree (val) {
      if (this.$refs.deptTree) this.$refs.deptTree.filter(val)
    },
    filterDeptNode (value, data) {
      if (!value) return true
      const kw = String(value).trim().toLowerCase()
      const name = (data.deptName || '').toLowerCase()
      const path = (data.deptPath || '').toLowerCase()
      return name.includes(kw) || path.includes(kw)
    },
    closeDeptPopover () {
      const pop = this.$refs.deptPopover
      if (pop && typeof pop.doClose === 'function') {
        pop.doClose()
      }
    },
    selectDept (data) {
      if (!data || data.deptId == null) return
      this.form.deptId = data.deptId
      // 延迟关闭，避免与 popover 的 click 触发逻辑冲突
      setTimeout(() => this.closeDeptPopover(), 0)
    },
    clearDept () {
      this.form.deptId = null
      if (this.$refs.deptTree) this.$refs.deptTree.setCurrentKey(null)
    },
    syncDeptTreeCurrent () {
      this.$nextTick(() => {
        if (this.$refs.deptTree && this.form.deptId) {
          this.$refs.deptTree.setCurrentKey(this.form.deptId)
        }
      })
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
      this.query = { pageNum: 1, pageSize: 10, userName: '', nickName: '', status: '' }
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
      this.dialogVisible = true
      getUser(row.userId).then(res => {
        const data = res.data || {}
        const user = data.user || row
        this.form = Object.assign(this.emptyForm(), user, {
          deptId: user.deptId != null ? user.deptId : null,
          roleIds: data.roleIds || [],
          status: user.status != null ? String(user.status) : '0'
        })
        this.syncDeptTreeCurrent()
        this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
      }).catch(() => {
        this.$message.error('加载用户详情失败')
        this.dialogVisible = false
      })
    },
    onSubmit () {
      this.$refs.form.validate(valid => {
        if (!valid) return
        this.submitting = true
        const payload = Object.assign({}, this.form)
        if (payload.userName) payload.userName = String(payload.userName).trim()
        if (payload.email != null && !String(payload.email).trim()) payload.email = null
        if (!payload.deptId) payload.deptId = null
        delete payload.deptName
        delete payload.createTime
        if (this.dialogMode === 'edit') {
          delete payload.password
          delete payload.userId
        }
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
    },
    openResetPwdDialog (row) {
      this.resetPwdTarget = { userId: row.userId, userName: row.userName }
      this.resetPwdForm = { password: '', confirmPassword: '' }
      this.resetPwdVisible = true
      this.$nextTick(() => this.$refs.resetPwdForm && this.$refs.resetPwdForm.clearValidate())
    },
    onResetPwdClosed () {
      this.resetPwdForm = { password: '', confirmPassword: '' }
      this.resetPwdTarget = { userId: null, userName: '' }
    },
    onResetPwdSubmit () {
      this.$refs.resetPwdForm.validate(valid => {
        if (!valid) return
        this.resetPwdSubmitting = true
        resetUserPassword(this.resetPwdTarget.userId, this.resetPwdForm.password)
          .then(res => {
            this.$message({ message: res.msg || '密码重置成功', type: 'success' })
            this.resetPwdVisible = false
          })
          .finally(() => { this.resetPwdSubmitting = false })
      })
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
.reset-tip { margin: 0 0 16px; color: #606266; font-size: 13px; }
.protected-tip { margin-left: 8px; color: #909399; font-size: 12px; }
.dept-tree-panel { max-height: 320px; display: flex; flex-direction: column; gap: 8px; }
.dept-select-tree {
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 4px 0;
}
.dept-tree-node {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
  padding: 2px 0;
  cursor: pointer;
  flex: 1;
}
.dept-tree-node__name { font-size: 13px; color: #303133; }
.dept-tree-node__path { font-size: 11px; color: #909399; margin-top: 2px; }
.dept-tree-input >>> .el-input__inner { cursor: pointer; }
.dept-clear-icon { cursor: pointer; }
.dept-clear-icon:hover { color: #909399; }
</style>

<style>
/* popover 挂载在 body，需非 scoped */
.user-dept-tree-popover { padding: 12px !important; }
</style>

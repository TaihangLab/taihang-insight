<template>
  <div class="asset-page user-manage-page">
    <div class="asset-page-header">
      <div class="asset-page-header__main">
        <div class="asset-page-title-row">
          <div class="asset-page-icon asset-page-icon--user">
            <i class="el-icon-user" />
          </div>
          <h2 class="asset-page-title">用户管理</h2>
        </div>
        <p class="asset-page-desc">
          创建账号、分配平台管理员和标注角色；忘记密码时可直接重置。新账号只能由管理员在此创建。
        </p>
      </div>
      <div class="asset-page-header__actions">
        <el-button icon="el-icon-refresh" size="small" @click="loadUsers">刷新</el-button>
        <el-button type="primary" icon="el-icon-plus" size="small" @click="openCreate">新建用户</el-button>
      </div>
    </div>

    <div class="asset-stat-row">
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--total"><i class="el-icon-user" /></div>
        <div>
          <div class="asset-stat-card__value">{{ stats.total }}</div>
          <div class="asset-stat-card__label">用户总数</div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--online"><i class="el-icon-s-custom" /></div>
        <div>
          <div class="asset-stat-card__value">{{ stats.admins }}</div>
          <div class="asset-stat-card__label">管理员</div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--idle"><i class="el-icon-circle-check" /></div>
        <div>
          <div class="asset-stat-card__value">{{ stats.active }}</div>
          <div class="asset-stat-card__label">启用</div>
        </div>
      </div>
      <div class="asset-stat-card">
        <div class="asset-stat-card__icon asset-stat-card__icon--offline"><i class="el-icon-circle-close" /></div>
        <div>
          <div class="asset-stat-card__value">{{ stats.disabled }}</div>
          <div class="asset-stat-card__label">停用</div>
        </div>
      </div>
    </div>

    <div class="asset-main">
      <div class="asset-toolbar">
        <div class="asset-toolbar__left">
          <el-input
            v-model="keyword"
            size="small"
            clearable
            placeholder="搜索用户名 / 昵称"
            prefix-icon="el-icon-search"
            style="width: 240px"
          />
        </div>
      </div>
      <div class="asset-table-wrap">
        <el-table :data="filteredUsers" v-loading="loading" height="100%" stripe>
          <el-table-column prop="username" label="用户名" min-width="120" />
          <el-table-column prop="nickname" label="昵称" min-width="120" />
          <el-table-column label="平台角色" width="110">
            <template slot-scope="scope">
              <el-tag :type="scope.row.is_admin ? 'danger' : ''" size="mini">
                {{ scope.row.platform_role_label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="标注角色" width="130">
            <template slot-scope="scope">
              <el-tag type="info" size="mini">{{ scope.row.label_role_label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template slot-scope="scope">
              <el-tag :type="scope.row.is_active ? 'success' : 'info'" size="mini">
                {{ scope.row.is_active ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="last_login_at" label="最近登录" min-width="170">
            <template slot-scope="scope">{{ formatTime(scope.row.last_login_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="mini" @click="openEdit(scope.row)">编辑</el-button>
              <el-button type="text" size="mini" @click="openReset(scope.row)">重置密码</el-button>
              <el-button
                type="text"
                size="mini"
                :disabled="isSelf(scope.row)"
                @click="toggleActive(scope.row)"
              >
                {{ scope.row.is_active ? '停用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog :title="dialogMode === 'create' ? '新建用户' : '编辑用户'" :visible.sync="dialogVisible" width="480px">
      <el-form ref="userForm" :model="form" :rules="formRules" label-width="90px">
        <el-form-item v-if="dialogMode === 'create'" label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="2～32 个字符，不含空格和 @" />
        </el-form-item>
        <el-form-item v-else label="用户名">
          <el-input :value="form.username" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" placeholder="可选" />
        </el-form-item>
        <el-form-item v-if="dialogMode === 'create'" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="至少 6 位" />
        </el-form-item>
        <el-form-item label="平台角色">
          <el-switch v-model="form.is_admin" active-text="管理员" inactive-text="普通用户" />
        </el-form-item>
        <el-form-item label="标注角色">
          <el-select v-model="form.label_role" style="width: 100%">
            <el-option v-for="item in labelRoles" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="dialogMode === 'edit'" label="状态">
          <el-switch v-model="form.is_active" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitUser">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="重置密码" :visible.sync="resetVisible" width="420px">
      <p class="reset-tip">将直接覆盖「{{ resetUser.username }}」的密码，对方需用新密码登录。</p>
      <el-form ref="resetForm" :model="resetForm" :rules="resetRules" label-width="90px">
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetForm.password" type="password" show-password placeholder="至少 6 位" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm">
          <el-input v-model="resetForm.confirm" type="password" show-password />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="resetVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetting" @click="submitReset">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import '../deviceManagement/asset-page.css'
import userService from '../../service/UserService'

export default {
  name: 'UserManage',
  data() {
    const validateConfirm = (rule, value, callback) => {
      if (value !== this.resetForm.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    return {
      loading: false,
      submitting: false,
      resetting: false,
      keyword: '',
      users: [],
      dialogVisible: false,
      dialogMode: 'create',
      editingId: null,
      form: {
        username: '',
        nickname: '',
        password: '',
        is_admin: false,
        label_role: 'none',
        is_active: true
      },
      formRules: {
        username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码至少 6 位', trigger: 'blur' }
        ]
      },
      labelRoles: [
        { value: 'none', label: '不参与标注' },
        { value: 'annotator', label: '标注员' },
        { value: 'auditor', label: '审核员' },
        { value: 'admin', label: '标注管理员' }
      ],
      resetVisible: false,
      resetUser: {},
      resetForm: { password: '', confirm: '' },
      resetRules: {
        password: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码至少 6 位', trigger: 'blur' }
        ],
        confirm: [
          { required: true, message: '请再次输入新密码', trigger: 'blur' },
          { validator: validateConfirm, trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    currentUser() {
      return userService.getUser() || {}
    },
    filteredUsers() {
      const kw = (this.keyword || '').trim().toLowerCase()
      if (!kw) return this.users
      return this.users.filter((u) => {
        return [u.username, u.nickname, u.email].some((v) => String(v || '').toLowerCase().indexOf(kw) >= 0)
      })
    },
    stats() {
      const list = this.users || []
      return {
        total: list.length,
        admins: list.filter((u) => u.is_admin).length,
        active: list.filter((u) => u.is_active).length,
        disabled: list.filter((u) => !u.is_active).length
      }
    }
  },
  created() {
    if (!userService.isAdmin()) {
      this.$message.warning('需要管理员权限')
      this.$router.replace('/systemManage/profile')
      return
    }
    this.loadUsers()
  },
  methods: {
    isSelf(row) {
      return row && this.currentUser.id && row.id === this.currentUser.id
    },
    formatTime(value) {
      if (!value) return '-'
      return String(value).replace('T', ' ').slice(0, 19)
    },
    apiError(e, fallback) {
      const detail = e && e.response && e.response.data && e.response.data.detail
      return (typeof detail === 'string' && detail) ? detail : fallback
    },
    loadUsers() {
      this.loading = true
      userService.listUsers().then((list) => {
        this.users = Array.isArray(list) ? list : []
      }).catch((e) => {
        this.$message.error(this.apiError(e, '加载用户失败'))
      }).finally(() => {
        this.loading = false
      })
    },
    openCreate() {
      this.dialogMode = 'create'
      this.editingId = null
      this.form = {
        username: '',
        nickname: '',
        password: '',
        is_admin: false,
        label_role: 'none',
        is_active: true
      }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.userForm && this.$refs.userForm.clearValidate())
    },
    openEdit(row) {
      this.dialogMode = 'edit'
      this.editingId = row.id
      this.form = {
        username: row.username,
        nickname: row.nickname || '',
        password: '',
        is_admin: !!row.is_admin,
        label_role: row.label_role || 'none',
        is_active: !!row.is_active
      }
      this.dialogVisible = true
    },
    submitUser() {
      this.$refs.userForm.validate((ok) => {
        if (!ok) return
        this.submitting = true
        const req = this.dialogMode === 'create'
          ? userService.createUser({
              username: this.form.username,
              password: this.form.password,
              nickname: this.form.nickname || undefined,
              is_admin: this.form.is_admin,
              label_role: this.form.label_role
            })
          : userService.updateUser(this.editingId, {
              nickname: this.form.nickname,
              is_admin: this.form.is_admin,
              label_role: this.form.label_role,
              is_active: this.form.is_active
            })
        req.then(() => {
          this.$message.success(this.dialogMode === 'create' ? '用户已创建' : '用户已更新')
          this.dialogVisible = false
          this.loadUsers()
        }).catch((e) => {
          this.$message.error(this.apiError(e, '保存失败'))
        }).finally(() => {
          this.submitting = false
        })
      })
    },
    toggleActive(row) {
      if (this.isSelf(row)) return
      const next = !row.is_active
      userService.updateUser(row.id, { is_active: next }).then(() => {
        this.$message.success(next ? '已启用' : '已停用')
        this.loadUsers()
      }).catch((e) => {
        this.$message.error(this.apiError(e, '操作失败'))
      })
    },
    openReset(row) {
      this.resetUser = row
      this.resetForm = { password: '', confirm: '' }
      this.resetVisible = true
      this.$nextTick(() => this.$refs.resetForm && this.$refs.resetForm.clearValidate())
    },
    submitReset() {
      this.$refs.resetForm.validate((ok) => {
        if (!ok) return
        this.resetting = true
        userService.resetPassword(this.resetUser.id, this.resetForm.password).then(() => {
          this.$message.success('密码已重置')
          this.resetVisible = false
        }).catch((e) => {
          this.$message.error(this.apiError(e, '重置失败'))
        }).finally(() => {
          this.resetting = false
        })
      })
    }
  }
}
</script>

<style scoped>
.user-manage-page .asset-main {
  flex: 1;
  min-height: 0;
}
.reset-tip {
  margin: 0 0 16px;
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
}
</style>

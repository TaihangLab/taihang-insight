<template>
  <div class="profile">
    <div class="page-header">
      <h2>个人中心</h2>
    </div>
    <div class="page-content">
      <el-row :gutter="20">
        <!-- 左侧个人信息卡片和安全设置 -->
        <el-col :xs="24" :sm="24" :md="8" :lg="6">
          <el-card class="profile-card">
            <div class="profile-avatar">
              <el-avatar :size="80" icon="el-icon-user" class="avatar"></el-avatar>
              <h3 class="username">{{ userInfo.nickName || userInfo.userName || '-' }}</h3>
              <p class="role">{{ roleNames || '-' }}</p>
            </div>
            <el-divider></el-divider>
            <div class="profile-stats">
              <div class="stat-item">
                <span class="stat-label">账号</span>
                <span class="stat-value">{{ userInfo.userName || '-' }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">账户状态</span>
                <el-tag :type="userInfo.status === '0' ? 'success' : 'danger'" size="mini" class="status-tag">
                  {{ userInfo.status === '0' ? '正常' : '停用' }}
                </el-tag>
              </div>
            </div>
          </el-card>

          <!-- 安全设置卡片 -->
          <el-card class="security-card">
            <div slot="header" class="card-header">
              <span>安全设置</span>
            </div>
            <div class="security-options">
              <div class="security-item" @click="changePassword">
                <i class="el-icon-key"></i>
                <div class="security-content">
                  <h4>修改密码</h4>
                  <p>定期修改密码，保障账户安全</p>
                </div>
                <i class="el-icon-arrow-right"></i>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧基本信息 -->
        <el-col :xs="24" :sm="24" :md="16" :lg="18">
          <el-card class="info-card">
            <div slot="header" class="card-header">
              <span>基本信息</span>
              <el-button
                type="primary"
                size="small"
                class="edit-btn"
                :loading="saving"
                @click="saveProfile"
              >保存</el-button>
            </div>

            <el-form ref="profileForm" :model="userInfo" :rules="profileRules" label-width="100px" class="profile-form">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="账号">
                    <el-input :value="userInfo.userName" disabled></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="昵称" prop="nickName">
                    <el-input v-model="userInfo.nickName" placeholder="请输入昵称" maxlength="64" clearable/>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="邮箱" prop="email">
                    <el-input v-model="userInfo.email" placeholder="可选" clearable/>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="手机号" prop="phonenumber">
                    <el-input v-model="userInfo.phonenumber" placeholder="可选" maxlength="20" clearable/>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="创建时间">
                    <el-input :value="userInfo.createTime" disabled></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="角色权限">
                    <el-input :value="roleNames" disabled></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 修改密码对话框（与顶部菜单复用同一个组件） -->
    <changePasswordDialog ref="changePasswordDialog"></changePasswordDialog>
  </div>
</template>

<script>
import { getUserProfile, updateUserProfile } from '@/api/auth'
import { setUser } from '@/utils/auth'
import changePasswordDialog from '../../dialog/changePassword.vue'

export default {
  name: 'Profile',
  components: { changePasswordDialog },
  data() {
    return {
      userInfo: {
        userName: '',
        nickName: '',
        email: '',
        phonenumber: '',
        status: '0',
        createTime: ''
      },
      roles: [],
      saving: false,
      profileRules: {
        nickName: [
          { required: true, message: '请输入昵称', trigger: 'blur' },
          { max: 64, message: '昵称长度不能超过 64 个字符', trigger: 'blur' }
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
        }],
        phonenumber: [{ max: 20, message: '手机号长度不能超过 20 个字符', trigger: 'blur' }]
      }
    }
  },
  computed: {
    roleNames() {
      const storeRoles = (this.$store && this.$store.getters && this.$store.getters.roles) || []
      const list = this.roles && this.roles.length ? this.roles : storeRoles
      return (list || []).join('、')
    }
  },
  mounted() {
    this.loadUserInfo()
  },
  methods: {
    loadUserInfo() {
      const storeUser = (this.$store && this.$store.getters && this.$store.getters.userInfo) || {}
      Object.assign(this.userInfo, storeUser)
      this.roles = ((this.$store && this.$store.getters && this.$store.getters.roles) || []).slice()

      getUserProfile().then((res) => {
        const data = (res && res.data) || {}
        const user = data.user || data
        if (user && typeof user === 'object') {
          Object.assign(this.userInfo, user)
        }
        if (Array.isArray(data.roles)) {
          this.roles = data.roles
        }
      }).catch((err) => {
        console.warn('[profile] 拉取个人信息失败，使用 store 缓存数据', err)
      })
    },
    changePassword() {
      this.$refs.changePasswordDialog.openDialog()
    },
    syncStoreUser () {
      if (this.$store && this.$store.commit) {
        this.$store.commit('SET_USER_INFO', { ...this.userInfo })
      }
      setUser(this.userInfo)
    },
    saveProfile () {
      this.$refs.profileForm.validate(valid => {
        if (!valid) return
        this.saving = true
        const payload = {
          nickName: (this.userInfo.nickName || '').trim(),
          phonenumber: (this.userInfo.phonenumber || '').trim() || null,
          email: (this.userInfo.email || '').trim() || null
        }
        updateUserProfile(payload)
          .then((res) => {
            const data = (res && res.data) || {}
            const user = data.user || data
            if (user && typeof user === 'object') {
              Object.assign(this.userInfo, user)
            }
            if (Array.isArray(data.roles)) {
              this.roles = data.roles
            }
            this.syncStoreUser()
            this.$message.success((res && res.msg) || data.msg || '保存成功')
          })
          .finally(() => { this.saving = false })
      })
    }
  }
}
</script>

<style scoped>
.profile {
  padding: 20px;
  background-color: #f5f5f5;
  height: calc(100vh - 100px);
  overflow: hidden;
}

.page-header {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 16px 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.page-header h2 {
  color: #1e40af;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.page-content {
  height: calc(100% - 80px);
  overflow: hidden;
}

.profile-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
  text-align: center;
  overflow: hidden;
  margin-bottom: 20px;
  height: calc(50% - 10px);
}

.profile-avatar {
  padding: 20px 0;
}

.avatar {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  border: 3px solid rgba(59, 130, 246, 0.3);
  margin-bottom: 15px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.username {
  margin: 10px 0 5px 0;
  color: #1e40af;
  font-size: 18px;
  font-weight: 600;
}

.role {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.profile-stats {
  text-align: left;
  padding: 0 20px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.stat-value {
  color: #1e40af;
  font-size: 14px;
  font-weight: 600;
}

.status-tag {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  border-color: #10b981 !important;
  color: white !important;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3) !important;
  border-radius: 10px !important;
}

.info-card, .security-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
  overflow: hidden;
}

.info-card {
  height: calc(100% + 20px);
  display: flex;
  flex-direction: column;
}

.security-card {
  height: calc(50% - 10px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1e40af;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  padding: 16px 20px;
  flex-shrink: 0;
}

.edit-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%) !important;
  border: none !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3) !important;
  color: white !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
}

.edit-btn:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%) !important;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4) !important;
  transform: translateY(-1px) !important;
}

.profile-form {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.profile-form >>> .el-form-item__label {
  color: #4b5563;
  font-weight: 500;
}

.profile-form >>> .el-input__inner {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: #374151;
}

.profile-form >>> .el-input__inner:hover {
  border-color: #3b82f6;
}

.profile-form >>> .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.profile-form >>> .el-textarea__inner {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: #374151;
  resize: vertical;
}

.profile-form >>> .el-textarea__inner:hover {
  border-color: #3b82f6;
}

.profile-form >>> .el-textarea__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.profile-form >>> .el-input.is-disabled .el-input__inner {
  background-color: #f9fafb;
  border-color: #e5e7eb;
  color: #6b7280;
}

.form-actions {
  text-align: center;
  margin-top: 20px;
}

.save-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%) !important;
  border: none !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3) !important;
  color: white !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
  padding: 8px 20px !important;
}

.save-btn:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%) !important;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4) !important;
  transform: translateY(-1px) !important;
}

.cancel-btn {
  background: white !important;
  border: 1px solid #d1d5db !important;
  color: #4b5563 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
  padding: 8px 20px !important;
}

.cancel-btn:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
}

.security-options {
  padding: 20px;
}

.security-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #fafbff 0%, #f0f4ff 100%);
}

.security-item:hover {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
}

.security-item i:first-child {
  font-size: 24px;
  color: #3b82f6;
  margin-right: 15px;
}

.security-content {
  flex: 1;
}

.security-content h4 {
  margin: 0 0 5px 0;
  color: #1e40af;
  font-size: 16px;
  font-weight: 600;
}

.security-content p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.security-item i:last-child {
  color: #9ca3af;
  font-size: 16px;
  transition: all 0.3s ease;
}

.security-item:hover i:last-child {
  color: #3b82f6;
  transform: translateX(2px);
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .profile {
    padding: 10px;
  }
  
  .page-content {
    height: calc(100% - 70px);
  }
  
  .profile-card, .security-card {
    height: auto;
    margin-bottom: 15px;
  }
  
  .info-card {
    height: auto;
  }
  
  .profile-form .el-col {
    margin-bottom: 10px;
  }
  
  .security-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .security-item i:first-child {
    margin-bottom: 10px;
  }
}
</style> 
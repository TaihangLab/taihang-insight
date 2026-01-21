<template>
  <div class="ui-header">
    <!-- 左侧面包屑导航 -->
    <div class="header-left">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentMenuName">{{ currentMenuName }}</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentPageName">{{ currentPageName }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 右侧用户操作区 -->
    <div class="header-right">
      <!-- 系统时间 -->
      <div class="system-time">
        <el-icon><Clock /></el-icon>
        <span>{{ currentTime }}</span>
      </div>

      <!-- 用户信息 - 仅在已登录时显示 -->
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" class="user-avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <span class="username">{{ username }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown">
            <el-dropdown-item command="profile">
              <el-icon><UserFilled /></el-icon>
              <span>个人中心</span>
            </el-dropdown-item>
            <el-dropdown-item command="password">
              <el-icon><Key /></el-icon>
              <span>修改密码</span>
            </el-dropdown-item>
            <el-dropdown-item command="clearCache">
              <el-icon><Delete /></el-icon>
              <span>清除缓存</span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 修改密码对话框 -->
    <changePasswordDialog ref="changePasswordDialog"></changePasswordDialog>
  </div>
</template>

<script>
import changePasswordDialog from '../components/dialog/changePassword.vue'
import userService from '../components/service/UserService.js'
import RBACService from '../components/service/RBACService.js'
import {
  Clock,
  User,
  UserFilled,
  ArrowDown,
  Key,
  Delete,
  SwitchButton
} from '@element-plus/icons-vue'

export default {
  name: "UiHeader",
  components: {
    changePasswordDialog,
    Clock,
    User,
    UserFilled,
    ArrowDown,
    Key,
    Delete,
    SwitchButton
  },
  data() {
    return {
      username: userService.getUser().username || '访客',
      isLoggedIn: userService.getToken() != null,
      currentTime: '',
      currentMenuName: '',
      currentPageName: ''
    };
  },
  created() {
    this.updateTime();
    this.updateBreadcrumb();
    // 每秒更新时间
    setInterval(this.updateTime, 1000);
  },
  watch: {
    $route() {
      this.updateBreadcrumb();
    }
  },
  methods: {
    updateTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      this.currentTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    updateBreadcrumb() {
      const path = this.$route.path;
      const routeMap = {
        '/monitoring': { menu: '监控预警', page: '' },
        '/monitoring/realtime': { menu: '监控预警', page: '实时监控' },
        '/monitoring/statistics': { menu: '监控预警', page: '统计分析' },
        '/monitoring/warningArchive': { menu: '监控预警', page: '预警档案' },
        '/monitoring/warningManage': { menu: '监控预警', page: '预警管理' },
        '/monitoring/intelligentReview': { menu: '监控预警', page: '智能复判' },
        '/deviceManage/camera': { menu: '设备配置', page: '摄像头' },
        '/deviceManage/localVideo': { menu: '设备配置', page: '本地视频' },
        '/modelManage/modelList': { menu: '模型管理', page: '模型列表' },
        '/skillManage/deviceSkills': { menu: '技能管理', page: '视觉模型技能' },
        '/skillManage/multimodalLlmSkills': { menu: '技能管理', page: '多模态大模型技能' },
        '/skillManage/multimodalReview': { menu: '技能管理', page: '多模态大模型复判' },
        '/systemManage/appSettings': { menu: '系统管理', page: '应用设置' },
        '/systemManage/userManagement': { menu: '系统管理', page: '用户管理' },
        '/systemManage/roleManagement': { menu: '系统管理', page: '角色管理' },
        '/systemManage/permissionManagement': { menu: '系统管理', page: '权限管理' },
        '/systemManage/tenantManagement': { menu: '系统管理', page: '租户管理' },
        '/systemManage/departmentManagement': { menu: '系统管理', page: '部门管理' },
        '/systemManage/positionManagement': { menu: '系统管理', page: '岗位管理' },
        '/systemManage/knowledgeBase': { menu: '系统管理', page: '知识库管理' },
        '/visualCenter': { menu: '可视中心', page: '可视中心首页' },
        '/algorithmInference': { menu: '可视中心', page: '算法推理平台' },
        '/visualCenter/parkManagement': { menu: '可视中心', page: '园区封闭管理平台' }
      };
      
      const route = routeMap[path];
      if (route) {
        this.currentMenuName = route.menu;
        this.currentPageName = route.page;
      } else {
        this.currentMenuName = '';
        this.currentPageName = '';
      }
    },
    handleCommand(command) {
      switch (command) {
        case 'profile':
          this.$router.push('/systemManage/profile');
          break;
        case 'password':
          this.$refs.changePasswordDialog.openDialog();
          break;
        case 'clearCache':
          this.clearCache();
          break;
        case 'logout':
          this.logout();
          break;
      }
    },
    clearCache() {
      this.$confirm('确定要清除所有本地缓存吗？包括部门缓存、租户缓存等数据。', '清除缓存', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        try {
          // 清除所有 RBAC 缓存（部门树、租户等）
          RBACService.clearAllCache();

          this.$message({
            showClose: true,
            message: '缓存已清除',
            type: 'success'
          });

          // 刷新页面以重新加载数据
          setTimeout(() => {
            location.reload();
          }, 500);
        } catch (error) {
          console.error('清除缓存失败:', error);
          this.$message({
            showClose: true,
            message: '清除缓存失败: ' + error.message,
            type: 'error'
          });
        }
      }).catch(() => {
        // 用户取消
      });
    },
    logout() {
      userService.clearToken();

      this.$message({
        showClose: true,
        message: '已安全退出登录',
        type: 'success'
      });

      setTimeout(() => {
        this.$router.push('/login');
      }, 500);
    }
  }
}
</script>

<style scoped>
/* 顶部导航栏容器 */
.ui-header {
  width: 100%;
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

/* 左侧面包屑导航 */
.header-left {
  flex: 1;
}

.header-left :deep(.el-breadcrumb) {
  font-size: var(--font-size-sm);
  line-height: var(--header-height);
}

.header-left :deep(.el-breadcrumb__item) {
  font-size: var(--font-size-base);
}

.header-left :deep(.el-breadcrumb__inner) {
  color: var(--text-secondary);
  font-weight: var(--font-weight-normal);
}

.header-left :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

/* 右侧操作区 */
.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

/* 系统时间 */
.system-time {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  padding: 0 var(--spacing-base);
}

.system-time i {
  font-size: var(--font-size-base);
}

/* 用户信息 */
.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-base);
  cursor: pointer;
  border-radius: var(--border-radius-base);
  transition: all var(--transition-base);
}

.user-info:hover {
  background-color: var(--bg-secondary);
}

.user-avatar {
  background: linear-gradient(135deg, var(--primary-color) 0%, #5a96f8 100%);
  border: 2px solid var(--primary-color-light);
}

.username {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  font-weight: var(--font-weight-medium);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info i.el-icon-arrow-down {
  font-size: 12px;
  color: var(--text-tertiary);
  transition: transform var(--transition-base);
}

.user-info:hover i.el-icon-arrow-down {
  transform: rotate(180deg);
}

/* 用户下拉菜单 */
.user-dropdown {
  margin-top: var(--spacing-xs);
}

.user-dropdown :deep(.el-dropdown-menu__item) {
  padding: 0 var(--spacing-base);
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.user-dropdown :deep(.el-dropdown-menu__item i) {
  margin-right: var(--spacing-xs);
  color: var(--text-secondary);
}

.user-dropdown :deep(.el-dropdown-menu__item:hover) {
  background-color: var(--bg-secondary);
  color: var(--primary-color);
}

.user-dropdown :deep(.el-dropdown-menu__item:hover i) {
  color: var(--primary-color);
}

/* 分割线 */
.user-dropdown :deep(.el-dropdown-menu__item--divided) {
  border-top: 1px solid var(--border-color);
}

.user-dropdown :deep(.el-dropdown-menu__item--divided:before) {
  display: none;
}
</style>

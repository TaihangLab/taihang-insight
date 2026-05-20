<template>
  <div id="UiHeader">
    <el-menu router
      :default-active="activeIndex"
      menu-trigger="click"
      background-color="#001F3F"
      text-color="#CCD6F6"
      active-text-color="#4BD8FF"
      mode="horizontal"
      :unique-opened="true"
      class="modern-menu">

      <!-- Logo区域 -->
      <div class="logo-container">
        <img src="static/logo.png" alt="Logo" class="logo-image"/>
        <div class="logo-text-container">
          <div class="logo-brand-name">
            <span class="brand-group">太行</span>
            <span class="brand-dot">·</span>
            <span class="brand-group">慧眼</span>
          </div>
          <div class="logo-text-right">
            <span class="logo-text">太行视觉AI平台</span>
            <span class="logo-subtitle"><span class="logo-subtitle-highlight">洞察万象，识图于微</span></span>
          </div>
        </div>
      </div>

      <!-- 全部业务菜单与系统管理菜单都来自后端 RBAC（/system/menu/getRouters）。
           顶栏只负责渲染，权限粒度仅到菜单级——没有按钮/接口级控制 -->
      <template v-for="menu in dynamicMenus">
        <template v-if="!menu.hidden">
          <el-submenu
            v-if="menu.children && menu.children.length > 0"
            :key="'sub-' + (menu.path || menu.name)"
            :index="buildMenuIndex(menu)"
            popper-class="modern-submenu"
          >
            <template slot="title">
              <i :class="iconClass(menu.icon)"></i>
              <span>{{ menu.title }}</span>
            </template>
            <template v-for="child in menu.children">
              <el-menu-item
                v-if="!child.hidden"
                :key="'item-' + buildChildIndex(menu, child)"
                :index="buildChildIndex(menu, child)"
              >
                {{ child.title }}
              </el-menu-item>
            </template>
          </el-submenu>
          <el-menu-item
            v-else
            :key="'item-' + (menu.path || menu.name)"
            :index="buildMenuIndex(menu)"
          >
            <i :class="iconClass(menu.icon)"></i>
            <span>{{ menu.title }}</span>
          </el-menu-item>
        </template>
      </template>

      <!-- 用户菜单 -->
      <el-submenu index="" class="user-menu" popper-class="modern-submenu">
        <template slot="title">
          <el-avatar :size="28" icon="el-icon-user" class="user-avatar"></el-avatar>
          <span>{{ username }}</span>
          <span
            v-if="isSuperAdmin && isViewingOtherTenant"
            class="tenant-badge"
            :title="'当前以租户 ' + dynamicTenantId + ' 的视角查看数据（本人租户：' + selfTenantId + '）'"
          >
            ［查看租户 {{ dynamicTenantId }}］
          </span>
        </template>
        <el-menu-item v-if="isSuperAdmin" @click="openSwitchTenantDialog">
          <i class="el-icon-refresh"></i>
          <span>切换租户视图</span>
        </el-menu-item>
        <el-menu-item v-if="isSuperAdmin && dynamicTenantId" @click="resetTenantView">
          <i class="el-icon-back"></i>
          <span>回到我的租户</span>
        </el-menu-item>
        <el-menu-item @click="goToProfile">
          <i class="el-icon-user-solid"></i>
          <span>个人中心</span>
        </el-menu-item>
        <el-menu-item @click="changePassword">
          <i class="el-icon-key"></i>
          <span>修改密码</span>
        </el-menu-item>
        <el-menu-item @click="loginout">
          <i class="el-icon-switch-button"></i>
          <span>注销</span>
        </el-menu-item>
      </el-submenu>
    </el-menu>
    <changePasswordDialog ref="changePasswordDialog"></changePasswordDialog>

    <!-- 切换租户视图对话框（仅超管） -->
    <el-dialog title="切换租户视图" :visible.sync="switchDialogVisible" width="420px" :close-on-click-modal="false">
      <el-form size="small" label-width="80px">
        <el-form-item label="目标租户">
          <el-select v-model="targetTenantId" placeholder="选择要查看的租户" style="width:100%" filterable>
            <el-option v-for="opt in tenantOptions" :key="opt.tenantId" :label="opt.companyName + '（' + opt.tenantId + '）'" :value="opt.tenantId"/>
          </el-select>
        </el-form-item>
        <div style="color:#909399;font-size:12px;line-height:1.6">
          切换后，本次会话中查询到的用户、角色、部门等数据将归属于目标租户。<br/>
          通过「回到我的租户」可立即恢复。
        </div>
      </el-form>
      <div slot="footer">
        <el-button @click="switchDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!targetTenantId" @click="confirmSwitchTenant">切 换</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import changePasswordDialog from '../components/dialog/changePassword.vue'
import userService from '../components/service/UserService'
import {Notification} from 'element-ui';
import { getLoginTenantList, switchTenant, clearDynamicTenant } from '@/api/tenant'

export default {
  name: "UiHeader",
  components: {Notification, changePasswordDialog},
  data() {
    const path = (this.$route && this.$route.path) || '/';
    const secondSlash = path.indexOf('/', 1);
    const activeIndex = secondSlash > 0 ? path.substring(0, secondSlash) : path;
    return {
      activeIndex,
      switchDialogVisible: false,
      tenantOptions: [],
      targetTenantId: ''
    };
  },
  computed: {
    username () {
      const ui = (this.$store && this.$store.state.user && this.$store.state.user.userInfo) || {};
      return ui.nickName || ui.userName || (userService.getUser() && userService.getUser().username) || '未登录';
    },
    dynamicMenus () {
      return (this.$store && this.$store.getters && this.$store.getters.sidebarMenus) || [];
    },
    editUser () {
      const roles = (this.$store && this.$store.getters && this.$store.getters.roles) || [];
      return roles.indexOf('superadmin') !== -1 || roles.indexOf('admin') !== -1;
    },
    isSuperAdmin () {
      return !!(this.$store && this.$store.getters && this.$store.getters.isSuperAdmin);
    },
    dynamicTenantId () {
      return (this.$store && this.$store.getters && this.$store.getters.dynamicTenantId) || '';
    },
    selfTenantId () {
      return (this.$store && this.$store.getters && this.$store.getters.tenantId) || '';
    },
    /** 超管已切换到其它租户（非本人所属租户） */
    isViewingOtherTenant () {
      return !!(
        this.dynamicTenantId
        && this.selfTenantId
        && this.dynamicTenantId !== this.selfTenantId
      );
    }
  },
  created() {
    if (this.$route.path.startsWith("/channelList")) {
      this.activeIndex = "/deviceList";
    }
  },
  mounted() {
    // 添加通道管理菜单的特殊处理
    this.$nextTick(() => {
      // 获取到通道管理的菜单项
      const channelSubmenu = document.querySelector('.el-submenu[index="/channel"]');
      if (channelSubmenu) {
        const channelTitle = channelSubmenu.querySelector('.el-submenu__title');
        if (channelTitle) {
          // 阻止点击通道管理时的冒泡，防止触发父菜单的关闭
          channelTitle.addEventListener('click', (e) => {
            e.stopPropagation();
          });
        }
      }
    });
  },
  methods: {
    loginout() {
      const finish = () => {
        userService.clearUserInfo();
        userService.clearLoginStatus();
        this.$message({
          showClose: true,
          message: '已安全退出登录',
          type: 'success'
        });
        this.$router.push('/login');
        setTimeout(() => {
          window.location.reload();
        }, 100);
      };
      if (this.$store && this.$store.dispatch) {
        this.$store.dispatch('LogOut').then(finish).catch(finish);
      } else {
        finish();
      }
    },
    changePassword() {
      this.$refs.changePasswordDialog.openDialog()
    },
    goToProfile() {
      this.$router.push('/systemManage/profile');
    },
    openSwitchTenantDialog() {
      this.switchDialogVisible = true;
      this.targetTenantId = this.dynamicTenantId || '';
      getLoginTenantList().then(res => {
        const data = res.data || {};
        this.tenantOptions = Array.isArray(data.voList) ? data.voList : [];
      });
    },
    confirmSwitchTenant() {
      if (!this.targetTenantId) return;
      if (this.targetTenantId === this.selfTenantId) {
        this.$message({ message: '目标租户与当前所属租户相同，无需切换', type: 'info' });
        return;
      }
      switchTenant(this.targetTenantId).then(res => {
        this.$store.commit('SET_DYNAMIC_TENANT_ID', this.targetTenantId);
        this.switchDialogVisible = false;
        this.$message({
          message: res.msg || ('已切换到租户 ' + this.targetTenantId + '，正在刷新…'),
          type: 'success'
        });
        setTimeout(() => window.location.reload(), 600);
      }).catch(() => {
        this.$message({
          message: '切换失败：请确认 Redis 已启动（动态租户状态保存在 Redis）',
          type: 'error',
          duration: 5000
        });
      });
    },
    resetTenantView() {
      clearDynamicTenant().then(() => {
        this.$store.commit('SET_DYNAMIC_TENANT_ID', '');
        this.$message({ message: '已恢复到本人租户', type: 'success' });
        setTimeout(() => window.location.reload(), 600);
      });
    },
    openDoc() {
      console.log(process.env.BASE_API)
      window.open(!!process.env.BASE_API ? process.env.BASE_API + "/doc.html" : "/doc.html")
    },
    /** 顶层菜单 / 单菜单的 index：保证以 "/" 开头 */
    buildMenuIndex(menu) {
      const p = (menu && menu.path) || ''
      if (!p) return '/' + (menu && menu.name ? menu.name : '')
      return p.charAt(0) === '/' ? p : ('/' + p)
    },
    /**
     * 子菜单 index：
     *  - 若子菜单 path 以 "/" 开头视为绝对路径（如 /visualCenter），直接使用
     *  - 否则与父路径拼接（如 /monitoring + realtime → /monitoring/realtime）
     */
    buildChildIndex(parent, child) {
      const cp = (child && child.path) || ''
      if (cp.charAt(0) === '/') return cp
      const base = this.buildMenuIndex(parent)
      if (!cp) return base
      return (base.endsWith('/') ? base.slice(0, -1) : base) + '/' + cp
    },
    /** 把后端的 icon 字段（"video-camera" / "el-icon-cpu" / "#" 等）规整为 class */
    iconClass(icon) {
      if (!icon || icon === '#') return 'el-icon-menu'
      return icon.startsWith('el-icon-') ? icon : ('el-icon-' + icon)
    }
  },
  destroyed() {
    // 组件销毁时的清理工作
  },

}

</script>
<style>
#UiHeader {
  width: 100%;
  padding: 0;
  margin: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 现代化菜单 */
.modern-menu {
  width: 100%;
  padding: 0;
  margin: 0;
  border-right: none;
  border-bottom: none;
  display: flex;
  align-items: center;
  height: 60px;
  /* 保持原来的深蓝色背景 */
  background-color: #001F3F;
  position: relative;
  overflow: hidden;
}

/* 添加科技感光效 */
.modern-menu::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(75, 216, 255, 0.1) 50%,
    transparent 100%);
  animation: shimmer 8s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* Logo样式 */
.logo-container {
  display: flex;
  align-items: center;
  padding: 0 20px;
  margin-right: 20px;
  height: 60px;
  border-right: 1px solid rgba(75, 216, 255, 0.2);
  position: relative;
  z-index: 2;
  min-width: 280px;
}

.logo-image {
  height: 36px;
  width: auto;
  margin-right: 10px;
  object-fit: contain;
  transition: all 0.3s ease;
}

.logo-container:hover .logo-image {
  transform: scale(1.05);
  filter: drop-shadow(0 0 10px rgba(75, 216, 255, 0.6));
}

.logo-text-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  line-height: 1.2;
  gap: 12px;
}

.logo-brand-name {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  color: #4BD8FF;
  font-size: 14px;
  font-weight: 600;
  text-shadow: 0 0 12px rgba(75, 216, 255, 0.6);
  border-right: 2px solid rgba(75, 216, 255, 0.3);
  padding-right: 8px;
  height: 42px;
  gap: 3px;
}

.brand-group {
  writing-mode: vertical-lr;
  text-orientation: upright;
  letter-spacing: 0.5px;
  line-height: 1;
}

.brand-dot {
  font-size: 8px;
  color: #00BFFF;
  text-shadow: 0 0 10px rgba(0, 191, 255, 0.8);
  margin: 0;
  line-height: 1;
  align-self: center;
  width: 8px;
  text-align: center;
}

.logo-text-right {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.logo-text {
  color: #4BD8FF;
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
  letter-spacing: 0.5px;
  text-shadow: 0 0 15px rgba(75, 216, 255, 0.6);
  position: relative;
  margin-bottom: 2px;
}

.logo-subtitle {
  color: #CCD6F6;
  font-size: 11px;
  font-weight: 400;
  white-space: nowrap;
  letter-spacing: 0.3px;
  text-shadow: 0 0 8px rgba(204, 214, 246, 0.4);
  opacity: 0.8;
  transition: all 0.3s ease;
}

.logo-subtitle-highlight {
  font-size: 13px;
  font-weight: 500;
  color: #4BD8FF;
  text-shadow: 0 0 12px rgba(75, 216, 255, 0.6);
  opacity: 1;
}

.logo-container:hover .logo-brand-name {
  color: #00BFFF;
  text-shadow: 0 0 15px rgba(0, 191, 255, 0.8);
  border-right-color: rgba(0, 191, 255, 0.6);
}

.logo-container:hover .brand-group {
  color: #00BFFF;
  text-shadow: 0 0 15px rgba(0, 191, 255, 0.8);
}

.logo-container:hover .brand-dot {
  color: #FFFFFF;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.9);
}

.logo-container:hover .logo-subtitle {
  opacity: 1;
  color: #4BD8FF;
  text-shadow: 0 0 10px rgba(75, 216, 255, 0.5);
}

.logo-container:hover .logo-subtitle-highlight {
  color: #00BFFF;
  text-shadow: 0 0 15px rgba(0, 191, 255, 0.8);
}

.logo-text::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #4BD8FF, #06b6d4);
  transition: width 0.3s ease;
}

.logo-container:hover .logo-text::after {
  width: 100%;
}

/* 用户菜单 */
.user-menu {
  margin-left: auto !important;
  position: relative;
  z-index: 2;
}

.user-menu .el-submenu__title {
  padding: 0 20px;
  position: relative;
  transition: all 0.3s ease;
}

.user-avatar {
  margin-right: 8px;
  background: linear-gradient(135deg, #4BD8FF 0%, #06b6d4 100%);
  border: 2px solid rgba(75, 216, 255, 0.3);
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(75, 216, 255, 0.3);
}

.user-menu:hover .user-avatar {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(75, 216, 255, 0.8);
  border-color: rgba(75, 216, 255, 0.8);
}

/* 样式已移除，不再需要switch-label */

/* 菜单项样式 */
.modern-menu .el-menu-item,
.modern-menu .el-submenu__title {
  height: 60px;
  line-height: 60px;
  padding: 0 15px;
  font-size: 14px;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
  border-radius: 4px;
  margin: 0 2px;
}

.modern-menu .el-menu-item:hover,
.modern-menu .el-submenu__title:hover {
  background: linear-gradient(135deg,
    rgba(75, 216, 255, 0.1) 0%,
    rgba(75, 216, 255, 0.05) 100%) !important;
  color: #4BD8FF !important;
  box-shadow: 0 4px 15px rgba(75, 216, 255, 0.2);
  transform: translateY(-1px);
}

.modern-menu .el-menu-item i,
.modern-menu .el-submenu__title i {
  margin-right: 5px;
  font-size: 18px;
  vertical-align: middle;
  transition: all 0.3s ease;
}

.modern-menu .el-menu-item:hover i,
.modern-menu .el-submenu__title:hover i {
  transform: translateY(-2px) scale(1.1);
  text-shadow: 0 0 10px rgba(75, 216, 255, 0.8);
}

/* 子菜单样式 */
.modern-submenu {
  background: linear-gradient(135deg, #002B56 0%, #003B76 100%) !important;
  border: 1px solid rgba(75, 216, 255, 0.2) !important;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
              0 0 20px rgba(75, 216, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modern-submenu .el-menu-item {
  color: #CCD6F6 !important;
  height: 40px;
  line-height: 40px;
  padding: 0 15px;
  transition: all 0.3s ease;
  border-radius: 4px;
  margin: 2px 4px;
}

.modern-submenu .el-menu-item:hover {
  background: linear-gradient(135deg,
    rgba(75, 216, 255, 0.15) 0%,
    rgba(75, 216, 255, 0.08) 100%) !important;
  color: #4BD8FF !important;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(75, 216, 255, 0.2);
}

.modern-submenu .el-menu-item.is-active {
  background: linear-gradient(135deg,
    rgba(75, 216, 255, 0.2) 0%,
    rgba(75, 216, 255, 0.1) 100%) !important;
  color: #4BD8FF !important;
  border-left: 3px solid #4BD8FF;
}

/* 嵌套子菜单 */
.nested-submenu {
  min-width: 150px;
}

/* 活动状态样式 */
#UiHeader .el-menu-item.is-active {
  color: #4BD8FF !important;
  background: linear-gradient(135deg,
    rgba(75, 216, 255, 0.15) 0%,
    rgba(75, 216, 255, 0.08) 100%) !important;
  border-bottom: 3px solid #4BD8FF;
  box-shadow: 0 4px 15px rgba(75, 216, 255, 0.3);
  position: relative;
}

#UiHeader .el-menu-item.is-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(75, 216, 255, 0.1) 50%,
    transparent 100%);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

#UiHeader .el-submenu.is-active .el-submenu__title {
  color: #4BD8FF !important;
  background: linear-gradient(135deg,
    rgba(75, 216, 255, 0.15) 0%,
    rgba(75, 216, 255, 0.08) 100%) !important;
  border-bottom: 3px solid #4BD8FF;
  box-shadow: 0 4px 15px rgba(75, 216, 255, 0.3);
}

#UiHeader .el-submenu.is-active .el-submenu__icon-arrow {
  color: #4BD8FF !important;
  text-shadow: 0 0 10px rgba(75, 216, 255, 0.8);
}

/* 箭头图标位置调整 */
.el-submenu__icon-arrow {
  margin-top: 0;
  font-size: 12px;
  margin-left: 5px;
  transition: all 0.3s ease;
}

.el-submenu:hover .el-submenu__icon-arrow {
  transform: rotate(180deg);
}

/* 调整菜单响应式行为 */
@media screen and (max-width: 1200px) {
  .modern-menu .el-menu-item,
  .modern-menu .el-submenu__title {
    padding: 0 10px;
  }

  .logo-container {
    padding: 0 10px;
    margin-right: 10px;
  }

  .logo-text {
    font-size: 16px;
  }
}

@media screen and (max-width: 992px) {
  .modern-menu .el-menu-item span,
  .modern-menu .el-submenu__title span {
    display: none;
  }

  .modern-menu .el-menu-item i,
  .modern-menu .el-submenu__title i {
    margin-right: 0;
    font-size: 20px;
  }

  .logo-text {
    display: none;
  }
}

@media screen and (max-width: 768px) {
  .logo-container {
    min-width: auto;
    padding: 0 15px;
  }

  .logo-text-container {
    flex-direction: column;
    gap: 8px;
  }

  .logo-brand-name {
    flex-direction: row;
    border-right: none;
    border-bottom: 2px solid rgba(75, 216, 255, 0.3);
    padding-right: 0;
    padding-bottom: 4px;
    height: auto;
    width: 100%;
    justify-content: center;
    gap: 4px;
  }

  .logo-text {
    font-size: 14px;
    display: block;
  }

  .logo-subtitle-highlight {
    font-size: 11px;
  }
}

/* 动画定义 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 多租户：当前查看租户徽章（仅超管 + 动态切换时显示） */
.tenant-badge {
  margin-left: 8px;
  padding: 2px 8px;
  font-size: 12px;
  color: #FFE066;
  border: 1px solid rgba(255, 224, 102, 0.5);
  border-radius: 10px;
  background: rgba(255, 224, 102, 0.08);
  vertical-align: middle;
  line-height: 1;
}
</style>

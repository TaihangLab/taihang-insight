<template>
  <div class="side-menu-container" :class="{ collapsed: isCollapsed }">
    <!-- Logo 区域 -->
    <div class="logo-section">
      <img src="/static/logo.png" alt="Logo" class="logo-img" v-if="!isCollapsed"/>
      <img src="/static/logo.png" alt="Logo" class="logo-img-small" v-else/>
      <div class="logo-text-container" v-if="!isCollapsed">
        <div class="brand-row">
          <span class="brand-name-text">太行·慧眼</span>
        </div>
        <div class="system-title">太行视觉AI平台</div>
        <div class="system-subtitle">洞察万象，识图于微</div>
      </div>
    </div>

    <!-- 折叠按钮 -->
    <div class="collapse-trigger" @click="toggleCollapse">
      <i :class="isCollapsed ? 'el-icon-s-unfold' : 'el-icon-s-fold'"></i>
    </div>

    <!-- 菜单区域 -->
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapsed"
      :collapse-transition="false"
      :unique-opened="true"
      class="sidebar-menu"
      background-color="#FFFFFF"
      text-color="#1F2937"
      active-text-color="#4185F7"
      router
    >
      <!-- 监控预警 -->
      <el-submenu index="/monitoring">
        <template slot="title">
          <i class="el-icon-video-camera menu-icon"></i>
          <span slot="title">监控预警</span>
        </template>
        <el-menu-item index="/monitoring/realtime">
          <span slot="title">实时监控</span>
        </el-menu-item>
        <el-menu-item index="/monitoring/statistics">
          <span slot="title">统计分析</span>
        </el-menu-item>
        <el-menu-item index="/monitoring/warningArchive">
          <span slot="title">预警档案</span>
        </el-menu-item>
        <el-menu-item index="/monitoring/warningManage">
          <span slot="title">预警管理</span>
        </el-menu-item>
        <el-menu-item index="/monitoring/intelligentReview">
          <span slot="title">智能复判</span>
        </el-menu-item>
      </el-submenu>

      <!-- 设备配置 -->
      <el-submenu index="/deviceManage">
        <template slot="title">
          <i class="el-icon-cpu menu-icon"></i>
          <span slot="title">设备配置</span>
        </template>
        <el-menu-item index="/deviceManage/camera">
          <span slot="title">摄像头</span>
        </el-menu-item>
        <el-menu-item index="/deviceManage/localVideo">
          <span slot="title">本地视频</span>
        </el-menu-item>
      </el-submenu>

      <!-- 模型管理 -->
      <el-submenu index="/modelManage">
        <template slot="title">
          <i class="el-icon-data-analysis menu-icon"></i>
          <span slot="title">模型管理</span>
        </template>
        <el-menu-item index="/modelManage/modelList">
          <span slot="title">模型列表</span>
        </el-menu-item>
      </el-submenu>

      <!-- 技能管理 -->
      <el-submenu index="/skillManage">
        <template slot="title">
          <i class="el-icon-magic-stick menu-icon"></i>
          <span slot="title">技能管理</span>
        </template>
        <el-menu-item index="/skillManage/deviceSkills">
          <span slot="title">视觉模型技能</span>
        </el-menu-item>
        <el-menu-item index="/skillManage/multimodalLlmSkills">
          <span slot="title">多模态大模型技能</span>
        </el-menu-item>
        <el-menu-item index="/skillManage/multimodalReview">
          <span slot="title">多模态大模型复判</span>
        </el-menu-item>
      </el-submenu>

      <!-- 系统管理 -->
      <el-submenu index="/systemManage">
        <template slot="title">
          <i class="el-icon-setting menu-icon"></i>
          <span slot="title">系统管理</span>
        </template>
        <el-menu-item index="/systemManage/appSettings">
          <span slot="title">应用设置</span>
        </el-menu-item>
        <el-menu-item index="/systemManage/userManagement">
          <span slot="title">用户管理</span>
        </el-menu-item>
        <el-menu-item index="/systemManage/roleManagement">
          <span slot="title">角色管理</span>
        </el-menu-item>
        <el-menu-item index="/systemManage/tenantManagement">
          <span slot="title">租户管理</span>
        </el-menu-item>
        <el-menu-item index="/systemManage/departmentManagement">
          <span slot="title">部门管理</span>
        </el-menu-item>
        <el-menu-item index="/systemManage/positionManagement">
          <span slot="title">岗位管理</span>
        </el-menu-item>
        <el-menu-item index="/systemManage/knowledgeBase">
          <span slot="title">知识库管理</span>
        </el-menu-item>
      </el-submenu>

      <!-- 可视中心 -->
      <el-submenu index="/visualAI">
        <template slot="title">
          <i class="el-icon-view menu-icon"></i>
          <span slot="title">可视中心</span>
        </template>
        <el-menu-item index="/visualCenter">
          <span slot="title">可视中心首页</span>
        </el-menu-item>
        <el-menu-item index="/algorithmInference">
          <span slot="title">算法推理平台</span>
        </el-menu-item>
        <el-menu-item index="/visualCenter/parkManagement">
          <span slot="title">园区封闭管理平台</span>
        </el-menu-item>
      </el-submenu>
    </el-menu>
  </div>
</template>

<script>
export default {
  name: "SideMenu",
  data() {
    return {
      isCollapsed: false,
      activeMenu: this.$route.path
    };
  },
  watch: {
    $route(to) {
      this.activeMenu = to.path;
    }
  },
  methods: {
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
      this.$emit('collapse-change', this.isCollapsed);
    }
  }
};
</script>

<style scoped>
/* 侧边栏容器 */
.side-menu-container {
  width: var(--sidebar-width);
  height: 100vh;
  background-color: var(--bg-primary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-base);
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  overflow: hidden;
}

.side-menu-container.collapsed {
  width: var(--sidebar-collapsed-width);
}

/* Logo 区域 */
.logo-section {
  min-height: 88px;
  height: auto;
  display: flex;
  align-items: center;
  padding: var(--spacing-base);
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-primary);
  gap: var(--spacing-base);
}

.logo-img {
  height: 52px;
  width: auto;
  transition: all var(--transition-base);
  flex-shrink: 0;
}

.logo-img-small {
  height: 32px;
  width: 32px;
  margin: 0 auto;
}

/* Logo文字容器 */
.logo-text-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

/* 太行·慧眼横排文字 */
.brand-row {
  display: flex;
  align-items: center;
}

.brand-name-text {
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  color: var(--primary-color);
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(65, 133, 247, 0.3);
  white-space: nowrap;
}

.system-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: 1.3;
  white-space: nowrap;
}

.system-subtitle {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.3;
  white-space: nowrap;
}

/* 折叠按钮 */
.collapse-trigger {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-base);
}

.collapse-trigger:hover {
  background-color: var(--primary-color-light);
  color: var(--primary-color);
}

.collapse-trigger i {
  font-size: var(--font-size-lg);
  transition: transform var(--transition-base);
}

/* 菜单区域 */
.sidebar-menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 滚动条样式 */
.sidebar-menu::-webkit-scrollbar {
  width: 6px;
}

.sidebar-menu::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.sidebar-menu::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.sidebar-menu::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* 菜单项样式 */
.sidebar-menu >>> .el-submenu__title,
.sidebar-menu >>> .el-menu-item {
  height: var(--menu-item-height);
  line-height: var(--menu-item-height);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  padding-left: var(--spacing-lg) !important;
  transition: all var(--transition-base);
}

/* 图标样式 */
.menu-icon {
  font-size: var(--menu-icon-size);
  margin-right: var(--menu-icon-gap);
  color: var(--text-secondary);
  transition: color var(--transition-base);
}

/* 悬停效果 */
.sidebar-menu >>> .el-submenu__title:hover,
.sidebar-menu >>> .el-menu-item:hover {
  background-color: var(--bg-secondary) !important;
}

.sidebar-menu >>> .el-submenu__title:hover .menu-icon,
.sidebar-menu >>> .el-menu-item:hover i {
  color: var(--primary-color);
}

/* 激活状态 */
.sidebar-menu >>> .el-menu-item.is-active {
  background-color: var(--primary-color-light) !important;
  color: var(--primary-color) !important;
  font-weight: var(--font-weight-semibold);
  position: relative;
}

.sidebar-menu >>> .el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: var(--primary-color);
}

.sidebar-menu >>> .el-menu-item.is-active i {
  color: var(--primary-color);
}

/* 子菜单项样式 */
.sidebar-menu >>> .el-menu--inline .el-menu-item {
  height: 48px;
  line-height: 48px;
  padding-left: calc(var(--spacing-lg) + var(--submenu-indent)) !important;
  font-size: var(--font-size-sm);
}

/* 展开的子菜单标题 */
.sidebar-menu >>> .el-submenu.is-opened > .el-submenu__title {
  background-color: var(--bg-secondary);
}

/* 折叠状态样式 */
.side-menu-container.collapsed .sidebar-menu >>> .el-submenu__title,
.side-menu-container.collapsed .sidebar-menu >>> .el-menu-item {
  padding-left: 0 !important;
  text-align: center;
}

.side-menu-container.collapsed .menu-icon {
  margin-right: 0;
  font-size: 20px;
}

/* 子菜单弹出样式 */
.sidebar-menu >>> .el-menu--popup {
  min-width: 180px;
  padding: var(--spacing-xs) 0;
}

.sidebar-menu >>> .el-menu--popup .el-menu-item {
  height: 40px;
  line-height: 40px;
  font-size: var(--font-size-sm);
}

/* 箭头图标 */
.sidebar-menu >>> .el-submenu__icon-arrow {
  font-size: 12px;
  color: var(--text-secondary);
}

.sidebar-menu >>> .el-submenu.is-opened > .el-submenu__title .el-submenu__icon-arrow {
  color: var(--primary-color);
}
</style>


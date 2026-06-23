<template>
  <div class="layout-container">
    <!-- 左侧菜单 -->
    <side-menu v-show="fixSiderbar" @collapse-change="handleCollapseChange" />

    <!-- 右侧内容区域 -->
    <div class="layout-main" :class="!fixSiderbar ? 'layout-collapsed' : ''">
      <!-- 顶部导航栏 -->
      <el-header v-show="fixedHeader" class="layout-header">
        <ui-header />
      </el-header>

      <!-- 主内容区 -->
      <el-main class="layout-content">
        <div class="layout-main-inner">
          <router-view :key="$route.fullPath"></router-view>
        </div>
      </el-main>
    </div>
    <!-- 太行·问道助手 -->
    <taihang-assistant />
  </div>
</template>

<script>
import SideMenu from "./SideMenu.vue";
import uiHeader from "./UiHeader.vue";
import TaihangAssistant from "../components/visionAI/chatAssistant/TaihangAssistant.vue";

export default {
  name: "index",
  components: {
    SideMenu,
    uiHeader,
    TaihangAssistant
  },
  created() {},
  data() {
    return {
      fixedHeader: true,
      fixSiderbar: true,
    };
  },
  methods: {
    handleCollapseChange(collapsed) {
      this.fixSiderbar = collapsed;
    },
  },
};
</script>
<style scoped>
/* 布局容器 */
.layout-container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: var(--bg-secondary);
}

/* 右侧主内容区 */
.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: var(--sidebar-width);
  transition: margin-left var(--transition-base);
  height: 100vh;
  overflow: hidden;
  min-height: 0;
}

.layout-collapsed {
  margin-left: 0;
}

/* 顶部导航栏 */
.layout-header {
  height: var(--header-height);
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  padding: 0;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* 主内容区 */
.layout-content {
  flex: 1 1 0;
  min-height: 0;
  background-color: var(--bg-secondary);
  overflow: hidden !important;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.layout-main-inner {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto !important;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.layout-main-inner::-webkit-scrollbar {
  width: 8px;
}

.layout-main-inner::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.layout-main-inner::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.layout-main-inner::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

/* 页面标题栏通用样式 */
.layout-content >>> .page-header {
  background-color: var(--bg-primary);
  margin-bottom: var(--spacing-base);
  padding: var(--spacing-base);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.layout-content >>> .page-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.layout-content >>> .page-header-btn {
  display: flex;
  gap: var(--spacing-sm);
}
</style>
<style>
/* 子页面根节点：由 layout-main-inner 统一滚动，避免多次进入后高度异常导致底部被裁切 */
.layout-main-inner > * {
  min-height: 100%;
  height: auto;
  overflow: visible !important;
}

.fade-enter {
  visibility: hidden;
  opacity: 0;
}

.fade-leave-to {
  display: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-to,
.fade-leave {
  visibility: visible;
  opacity: 1;
}
</style>

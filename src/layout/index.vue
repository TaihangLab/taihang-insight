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
        <router-view :key="$route.fullPath"></router-view>
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
.layout-container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: var(--bg-secondary);
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: var(--sidebar-width);
  transition: margin-left var(--transition-base);
  height: 100vh;
  overflow: hidden;
}

.layout-collapsed {
  margin-left: 0;
}

.layout-header {
  height: var(--header-height);
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  padding: 0;
  display: flex;
  align-items: center;
}

.layout-content {
  flex: 1;
  background-color: var(--bg-secondary);
  overflow-y: auto;
  overflow-x: hidden;
}

.layout-content::-webkit-scrollbar {
  width: 8px;
}

.layout-content::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 4px;
}

.layout-content::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.layout-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}

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

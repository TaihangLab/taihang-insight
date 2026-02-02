<template>
  <div class="layout-container" :class="{ 'in-fullscreen': isFullscreen }">
    <!-- 左侧菜单 - 全屏时隐藏 -->
    <dynamic-menu
      v-show="!isFullscreen"
      @collapse-change="handleCollapseChange"
    />

    <!-- 右侧内容区域 -->
    <div
      class="layout-main"
      :class="{ 'layout-collapsed': isMenuCollapsed, 'fullscreen-mode': isFullscreen }"
    >
      <!-- 顶部导航栏 - 全屏时隐藏 -->
      <el-header v-show="!isFullscreen && fixedHeader" class="layout-header">
        <ui-header />
      </el-header>

      <!-- 主内容区 -->
      <el-main class="layout-content">
        <router-view></router-view>
      </el-main>
    </div>

    <!-- 太行智能助手 - 全屏时隐藏 -->
    <intelligent-assistant v-show="!isFullscreen" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import DynamicMenu from '@/components/common/DynamicMenu.vue'
import UiHeader from '@/layout/UiHeader.vue'
import IntelligentAssistant from '@/components/visionAI/chatAssistant/IntelligentAssistant.vue'

// 固定 Header
const fixedHeader = ref(true)

// 菜单折叠状态
const isMenuCollapsed = ref(false)

// 全屏状态
const isFullscreen = ref(false)

// 处理菜单折叠变化
const handleCollapseChange = (collapsed: boolean) => {
  isMenuCollapsed.value = collapsed
}

// 处理全屏变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
  console.log('[Layout] 全屏状态变化:', isFullscreen.value)
}

onMounted(() => {
  // 初始化检查
  isFullscreen.value = !!document.fullscreenElement
  // 监听全屏变化
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onBeforeUnmount(() => {
  // 移除监听
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
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

/* 菜单折叠时的样式 */
.layout-collapsed {
  margin-left: var(--sidebar-collapsed-width);
}

/* 全屏时主内容区样式 */
.fullscreen-mode {
  margin-left: 0 !important;
}

/* 顶部导航栏 */
.layout-header {
  height: var(--header-height);
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  padding: 0;
  display: flex;
  align-items: center;
}

/* 主内容区 */
.layout-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
  /* padding: var(--spacing-lg); */
  overflow: hidden;
  /* 重置 Element Plus el-main 的默认样式 */
  padding: 0 !important;
}

/* 让 router-view 内容充满容器 */
.layout-content > * {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

/* 内容区滚动条样式 */
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

/* 页面标题栏通用样式 */
.layout-content :deep(.page-header) {
  background-color: var(--bg-primary);
  margin-bottom: var(--spacing-base);
  padding: var(--spacing-base);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.layout-content :deep(.page-title) {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.layout-content :deep(.page-header-btn) {
  display: flex;
  gap: var(--spacing-sm);
}

/* 动画效果 */
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

<template>
  <div class="side-menu-container" :class="{ collapsed: isCollapsed }">
    <!-- Logo 区域 -->
    <div class="logo-section">
      <img src="@static/logo.png" alt="Logo" class="logo-img" v-if="!isCollapsed"/>
      <img src="@static/logo.png" alt="Logo" class="logo-img-small" v-else/>
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
      <el-icon v-if="isCollapsed"><Expand /></el-icon>
      <el-icon v-else><Fold /></el-icon>
    </div>

    <!-- 菜单区域 -->
    <el-scrollbar height="calc(100vh - 128px)">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        :collapse-transition="false"
        :unique-opened="true"
        router
      >
        <!-- 动态菜单 -->
        <template v-if="hasMenu">
          <MenuItem
            v-for="item in menuTree"
            :key="item.id"
            :item="item"
          />
        </template>

        <!-- 加载状态 -->
        <template v-else-if="loading">
          <div class="menu-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载菜单中...</span>
          </div>
        </template>

        <!-- 无菜单数据 -->
        <template v-else>
          <div class="menu-empty">
            <el-icon><Warning /></el-icon>
            <span>暂无菜单权限</span>
          </div>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import { useDynamicMenu } from '@/composables/useDynamicMenu'
import MenuItem from './MenuItem.vue'
import {
  Expand,
  Fold,
  Loading,
  Warning
} from '@element-plus/icons-vue'

// 定义 emit
const emit = defineEmits<{
  collapseChange: [collapsed: boolean]
}>()

// 路由
const route = useRoute()

// Store
const userStore = useUserStore()

// 动态菜单
const { menuTree, hasMenu } = useDynamicMenu()

// 菜单折叠状态
const isCollapsed = ref(false)

// 当前激活的菜单
const activeMenu = ref(route.path)

// 加载状态
const loading = computed(() => !userStore.isLoggedIn || (userStore.isLoggedIn && menuTree.value.length === 0))

// 监听路由变化
watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = newPath
  }
)

// 切换折叠状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('collapseChange', isCollapsed.value)
}
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

/* 菜单加载状态 */
.menu-loading,
.menu-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  gap: 12px;
}

.menu-loading .el-icon,
.menu-empty .el-icon {
  font-size: 32px;
}

.menu-loading span,
.menu-empty span {
  font-size: 14px;
}
</style>

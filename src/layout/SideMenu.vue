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
        <!-- 动态渲染菜单树 -->
        <template v-for="menuItem in menuTree" :key="menuItem.id">
          <!-- 有子菜单的情况 -->
          <el-sub-menu v-if="menuItem.children && menuItem.children.length > 0" :index="String(menuItem.path || menuItem.id)">
            <template #title>
               <el-icon><component :is="menuItem.icon" /></el-icon>
              <span>1{{ menuItem.menu_name }}</span>
            </template>
            <!-- 递归渲染子菜单 -->
            <template v-for="child in menuItem.children" :key="child.id">
              <el-menu-item
                v-if="child.menu_type !== 'button' && child.path"
                :index="String(child.path)"
              >
                <span>{{ child.menu_name }}</span>
              </el-menu-item>
            </template>
          </el-sub-menu>
          
          <!-- 没有子菜单的情况 -->
          <el-menu-item v-else-if="menuItem.menu_type !== 'button'" :index="String(menuItem.path || menuItem.id)">
           <el-icon><component :is="menuItem.icon" /></el-icon>
            <span>1{{ menuItem.menu_name }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMenusStore, useTokenStore } from '@/stores'
import {
  VideoCamera,
  Cpu,
  DataAnalysis,
  MagicStick,
  Setting,
  OfficeBuilding,
  User,
  UserFilled,
  Lock,
  School,
  Notebook,
  View,
  Fold,
  Expand,
  Document,
  Tools,
  Monitor,
  Platform,
  Histogram,
  Warning,
  DataLine
} from '@element-plus/icons-vue'

// 定义 emit
const emit = defineEmits<{
  collapseChange: [collapsed: boolean]
}>()

// 路由
const route = useRoute()

// 使用新的独立 stores
const menusStore = useMenusStore()
const tokenStore = useTokenStore()

// 菜单折叠状态
const isCollapsed = ref(false)

// 当前激活的菜单
const activeMenu = ref(route.path)

// 从 store 获取菜单树（使用 getter 方法）
// 登录时数据已加载，使用同步版本即可
const menuTree = computed(() => menusStore.getMenuTreeSync() || [])

// 图标映射
const iconMap: Record<string, any> = {
  'VideoCamera': VideoCamera,
  'Cpu': Cpu,
  'DataAnalysis': DataAnalysis,
  'MagicStick': MagicStick,
  'Setting': Setting,
  'OfficeBuilding': OfficeBuilding,
  'User': User,
  'UserFilled': UserFilled,
  'Lock': Lock,
  'School': School,
  'Notebook': Notebook,
  'View': View,
  'Document': Document,
  'Tools': Tools,
  'Monitor': Monitor,
  'Platform': Platform,
  'Histogram': Histogram,
  'Warning': Warning,
  'DataLine': DataLine
}

// 获取图标组件
const getIconComponent = (iconName?: string) => {
  if (!iconName) return Setting
  return iconMap[iconName] || Setting
}

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

// 组件挂载时，如果菜单树为空且有 token，尝试获取菜单
onMounted(async () => {
  if (menuTree.value.length === 0 && tokenStore.hasToken()) {
    // 菜单树应该在登录时已加载
  }
})
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
</style>

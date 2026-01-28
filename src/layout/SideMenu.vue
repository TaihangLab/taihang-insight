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
              <el-icon class="menu-icon">
                <component :is="getIconComponent(menuItem.icon)" />
              </el-icon>
              <span>{{ menuItem.menu_name }}</span>
            </template>
            <!-- 递归渲染子菜单 -->
            <template v-for="child in menuItem.children" :key="child.id">
              <el-menu-item v-if="child.menu_type !== 'button'" :index="String(child.path || child.id)">
                <span>{{ child.menu_name }}</span>
              </el-menu-item>
            </template>
          </el-sub-menu>

          <!-- 没有子菜单的情况 -->
          <el-menu-item v-else-if="menuItem.menu_type !== 'button'" :index="String(menuItem.path || menuItem.id)">
            <el-icon class="menu-icon">
              <component :is="getIconComponent(menuItem.icon)" />
            </el-icon>
            <span>{{ menuItem.menu_name }}</span>
          </el-menu-item>
        </template>

        <!-- 降级方案：如果 menuTree 为空，显示默认菜单 -->
        <template v-if="menuTree.length === 0">
          <!-- 监控预警 -->
          <el-sub-menu index="/monitoring">
            <template #title>
              <el-icon class="menu-icon"><VideoCamera /></el-icon>
              <span>监控预警</span>
            </template>
            <el-menu-item index="/monitoring/realtime">
              <span>实时监控</span>
            </el-menu-item>
            <el-menu-item index="/monitoring/statistics">
              <span>统计分析</span>
            </el-menu-item>
            <el-menu-item index="/monitoring/warningArchive">
              <span>预警档案</span>
            </el-menu-item>
            <el-menu-item index="/monitoring/warningManage">
              <span>预警管理</span>
            </el-menu-item>
            <el-menu-item index="/monitoring/intelligentReview">
              <span>智能复判</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 设备配置 -->
          <el-sub-menu index="/deviceManage">
            <template #title>
              <el-icon class="menu-icon"><Cpu /></el-icon>
              <span>设备配置</span>
            </template>
            <el-menu-item index="/deviceManage/camera">
              <span>摄像头</span>
            </el-menu-item>
            <el-menu-item index="/deviceManage/localVideo">
              <span>本地视频</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 模型管理 -->
          <el-sub-menu index="/modelManage">
            <template #title>
              <el-icon class="menu-icon"><DataAnalysis /></el-icon>
              <span>模型管理</span>
            </template>
            <el-menu-item index="/modelManage/modelList">
              <span>模型列表</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 技能管理 -->
          <el-sub-menu index="/skillManage">
            <template #title>
              <el-icon class="menu-icon"><MagicStick /></el-icon>
              <span>技能管理</span>
            </template>
            <el-menu-item index="/skillManage/deviceSkills">
              <span>视觉模型技能</span>
            </el-menu-item>
            <el-menu-item index="/skillManage/multimodalLlmSkills">
              <span>多模态大模型技能</span>
            </el-menu-item>
            <el-menu-item index="/skillManage/multimodalReview">
              <span>多模态大模型复判</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 系统管理 -->
          <el-sub-menu index="/systemManage">
            <template #title>
              <el-icon class="menu-icon"><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/systemManage/appSettings">
              <el-icon><Setting /></el-icon>
              <span>应用设置</span>
            </el-menu-item>
            <el-menu-item index="/systemManage/tenantManagement">
              <el-icon><OfficeBuilding /></el-icon>
              <span>租户管理</span>
            </el-menu-item>
            <el-menu-item index="/systemManage/userManagement">
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="/systemManage/roleManagement">
              <el-icon><UserFilled /></el-icon>
              <span>角色管理</span>
            </el-menu-item>
            <el-menu-item index="/systemManage/permissionManagement">
              <el-icon><Lock /></el-icon>
              <span>权限管理</span>
            </el-menu-item>
            <el-menu-item index="/systemManage/departmentManagement">
              <el-icon><School /></el-icon>
              <span>部门管理</span>
            </el-menu-item>
            <el-menu-item index="/systemManage/knowledgeBase">
              <el-icon><Notebook /></el-icon>
              <span>知识库管理</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 可视中心 -->
          <el-sub-menu index="/visualAI">
            <template #title>
              <el-icon class="menu-icon"><View /></el-icon>
              <span>可视中心</span>
            </template>
            <el-menu-item index="/visualCenter">
              <span>可视中心首页</span>
            </el-menu-item>
            <el-menu-item index="/algorithmInference">
              <span>算法推理平台</span>
            </el-menu-item>
            <el-menu-item index="/visualCenter/parkManagement">
              <span>园区封闭管理平台</span>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/modules/user'
import type { MenuItem } from '@/types/auth'
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

// 用户 Store
const userStore = useUserStore()

// 菜单折叠状态
const isCollapsed = ref(false)

// 当前激活的菜单
const activeMenu = ref(route.path)

// 从 store 获取菜单树
const menuTree = computed(() => userStore.menuTree || [])

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
  if (menuTree.value.length === 0 && userStore.isLoggedIn) {
    try {
      console.log('🔄 菜单树为空，尝试从后端获取...')
      await userStore.fetchMenuTree(true)
      console.log('✅ 菜单树已更新:', userStore.menuTree.length, '个顶级菜单项')
    } catch (error) {
      console.error('⚠️ 获取菜单树失败，将使用默认菜单')
    }
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

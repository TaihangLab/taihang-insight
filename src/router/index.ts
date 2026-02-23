/**
 * 太行视觉AI平台 - 路由配置
 * 使用 Vue Router 4 + 动态路由权限控制
 */
import { createRouter, createWebHashHistory, type RouteRecordRaw, type RouterOptions } from 'vue-router'
import type { MenuItem } from '@/types/auth'

// 导入布局组件（同步加载，必须）
import Layout from '@/layout/index.vue'
import { StorageKey } from '@/stores/modules/storageKeys'

// ============== 基础路由（不需要权限） ==============
const login = () => import('../pages/commons/Login.vue')

// 通用组件路由（懒加载）
const gbRecordDetail = () => import('../components/visionAI/deviceManagement/managementPages/GBRecordDetail.vue')
const cloudRecordDetail = () => import('../components/visionAI/deviceManagement/managementPages/CloudRecordDetail.vue')
const deviceTree = () => import('../components/common/DeviceTree.vue')
const wasmPlayer = () => import('../components/common/jessibuca.vue')
const rtcPlayer = () => import('../components/dialog/rtcPlayer.vue')

// ============== 业务路由组件映射（懒加载） ==============
// 路由路径 -> 组件的映射关系，用于动态路由生成
const componentMap: Record<string, () => Promise<any>> = {
  // 可视化中心
  '/visualCenter': () => import('../pages/center/visualCenter.vue'),
  '/visual': () => import('../pages/center/visualCenter.vue'),
  '/visual/algorithm': () => import('../pages/center/algorithmInference.vue'),
  '/algorithmInference': () => import('../pages/center/algorithmInference.vue'),
  '/visual/park': () => import('../components/visionAI/ivisualCenter/parkManagement.vue'),
  '/visualCenter/parkManagement': () => import('../components/visionAI/ivisualCenter/parkManagement.vue'),

  // 监控预警
  '/monitoring/realtime': () => import('../components/visionAI/monitoringWarning/realTimeMonitoring.vue'),
  '/monitoring/statistics': () => import('../components/visionAI/monitoringWarning/statisticsAnalysis.vue'),
  '/monitoring/warningArchive': () => import('../components/visionAI/monitoringWarning/warningArchives.vue'),
  '/monitoring/warningManage': () => import('../components/visionAI/monitoringWarning/warningManagement.vue'),
  '/monitoring/reviewRecords': () => import('../components/visionAI/monitoringWarning/reviewRecords.vue'),
  '/monitoring/intelligentReview': () => import('../components/visionAI/monitoringWarning/intelligentReview.vue'),
  '/monitoring/warnings': () => import('../components/visionAI/monitoringWarning/warningArchives.vue'),
  '/monitoring/review': () => import('../components/visionAI/monitoringWarning/reviewRecords.vue'),
  '/monitoring/intelligent-review': () => import('../components/visionAI/monitoringWarning/intelligentReview.vue'),

  // 设备管理（支持后端返回的路径）
  '/deviceManage/camera': () => import('../components/visionAI/deviceManagement/camera.vue'),
  '/deviceManage/cameraManagement': () => import('../components/visionAI/deviceManagement/CameraManagementMain.vue'),
  '/deviceManage/localVideo': () => import('../components/visionAI/deviceManagement/localVideo.vue'),
  '/devices/cameras': () => import('../components/visionAI/deviceManagement/camera.vue'),
  '/devices/cameras-main': () => import('../components/visionAI/deviceManagement/CameraManagementMain.vue'),
  '/devices/local-video': () => import('../components/visionAI/deviceManagement/localVideo.vue'),

  // 模型管理（支持后端返回的路径）
  '/modelManage/modelList': () => import('../components/visionAI/modelManagement/modelList.vue'),
  '/models': () => import('../components/visionAI/modelManagement/modelList.vue'),
  '/models/list': () => import('../components/visionAI/modelManagement/modelList.vue'),

  // 技能管理（支持后端返回的路径）
  '/skillManage/deviceSkills': () => import('../components/visionAI/skillManagement/deviceSkills.vue'),
  '/skillManage/multimodalLlmSkills': () => import('../components/visionAI/skillManagement/multimodalLlmSkills.vue'),
  '/skillManage/multimodalCreateDetail': () => import('../components/visionAI/skillManagement/LlmSkillCreateDialogDetail.vue'),
  '/skillManage/multimodalReview': () => import('../components/visionAI/skillManagement/multimodalReview.vue'),
  '/skillManage/multimodalReviewCreate': () => import('../components/visionAI/skillManagement/multimodalReviewCreate.vue'),
  '/skills': () => import('../components/visionAI/skillManagement/deviceSkills.vue'),
  '/skills/device': () => import('../components/visionAI/skillManagement/deviceSkills.vue'),
  '/skills/multimodal-llm': () => import('../components/visionAI/skillManagement/multimodalLlmSkills.vue'),
  '/skills/multimodal-review': () => import('../components/visionAI/skillManagement/multimodalReview.vue'),

  // 智能控制（支持后端返回的路径）
  '/intelligentControl/logRecord': () => import('../components/visionAI/smartControl/logRecords.vue'),
  '/control': () => import('../components/visionAI/smartControl/logRecords.vue'),
  '/control/logs': () => import('../components/visionAI/smartControl/logRecords.vue'),

  // 边缘管理（支持后端返回的路径）
  '/edgeManage/edgeServer': () => import('../components/visionAI/edgeManagement/edgeServer.vue'),
  '/edgeManage/edgeBox': () => import('../components/visionAI/edgeManagement/edgeBox.vue'),
  '/edge': () => import('../components/visionAI/edgeManagement/edgeServer.vue'),
  '/edge/servers': () => import('../components/visionAI/edgeManagement/edgeServer.vue'),
  '/edge/boxes': () => import('../components/visionAI/edgeManagement/edgeBox.vue'),

  // 系统管理
  '/systemManage/appSettings': () => import('../pages/system/applicationSettings.vue'),
  '/systemManage/tenantManagement': () => import('../pages/system/tenantManagement.vue'),
  '/systemManage/userManagement': () => import('../pages/system/userManagement.vue'),
  '/systemManage/roleManagement': () => import('../pages/system/roleManagement.vue'),
  '/systemManage/roleAssignment/:userId/:user_name': () => import('../pages/system/components/role/RoleUserAssignmentPage.vue'),
  '/visionAI/systemManagement/userAssignment': () => import('../pages/system/components/user/UserAssignmentPage.vue'),
  '/systemManage/departmentManagement': () => import('../pages/system/departmentManagement.vue'),
  '/systemManage/positionManagement': () => import('../pages/system/positionManagement.vue'),
  '/systemManage/profile': () => import('../pages/system/profile.vue'),
  '/systemManage/knowledgeBase': () => import('../pages/system/knowledgeBase.vue'),
  '/system/knowledge-detail': () => import('../pages/system/knowledgeBaseDetail.vue'),
  '/systemManage/permissionManagement': () => import('../pages/system/permissionManagement.vue')
}

/**
 * 基础路由配置（不需要认证的白名单路由）
 */
const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: login,
    meta: { title: '登录' }
  },
  {
    path: '/test',
    name: 'Test',
    component: deviceTree,
    meta: { hidden: true }
  },
  // 播放器路由
  {
    path: '/play/wasm/:url',
    name: 'WasmPlayer',
    component: wasmPlayer,
    meta: { hidden: true }
  },
  {
    path: '/play/rtc/:url',
    name: 'RtcPlayer',
    component: rtcPlayer,
    meta: { hidden: true }
  },
  // 录像详情路由
  {
    path: '/gbRecordDetail/:deviceId/:channelId/',
    name: 'GBRecordDetail',
    component: gbRecordDetail,
    meta: { hidden: true }
  },
  {
    path: '/cloudRecordDetail/:app/:stream',
    name: 'CloudRecordDetail',
    component: cloudRecordDetail,
    meta: { hidden: true }
  },
  {
    path: '/cloudRecordDetail/:mediaServerId/:app/:stream',
    name: 'CloudRecordDetail2',
    component: cloudRecordDetail,
    meta: { hidden: true }
  },
  // 主布局路由（包含所有业务路由的父路由）
  {
    path: '/',
    name: 'Layout',
    component: Layout,
    redirect: '/visual',
    children: [] // 占位，动态路由会添加到这里
  }
]

// 动态路由是否已添加的标记
let asyncRoutesAdded = false

/**
 * ============== localStorage 辅助函数 ==============
 * 直接从 localStorage 读取数据，避免 Pinia 持久化延迟问题
 */

/**
 * 从 localStorage 获取 token
 * token 是直接存储的字符串（JWT 格式）
 */
function getTokenFromStorage(): string | null {
  try {
    const token = localStorage.getItem(StorageKey.ADMIN_TOKEN)
    return token || null
  } catch {
    return null
  }
}

/**
 * 从 localStorage 获取菜单树
 */
function getMenuTreeFromStorage(): MenuItem[] {
  try {
    const menusData = localStorage.getItem(StorageKey.MENUS)
    if (!menusData) return []

    const parsed = JSON.parse(menusData)
    return parsed.menuTree || []
  } catch {
    return []
  }
}

/**
 * 动态生成并添加业务路由
 * 根据后端返回的菜单树生成路由配置并添加到路由器
 */
export function setupAsyncRoutes(menuItems: any[]): void {
  if (asyncRoutesAdded) {
    return
  }

  const routes: RouteRecordRaw[] = []

  /**
   * 递归处理菜单树
   */
  function processMenuItems(items: any[]) {
    for (const item of items) {
      // 兼容后端不同字段名：permission_name/menu_name, permission_type/menu_type
      const menuName = item.menu_name || item.permission_name || item.name
      const menuType = item.menu_type || item.permission_type || item.type
      const path = item.path

      // 只处理 menu 类型的菜单项（跳过 folder 和 button）
      // menu_type 可能是: 'menu', 'folder', 'button' 或数字 1, 2, 3
      const isMenu = menuType === 'menu' || menuType === 1 || (!menuType && path)

      if (isMenu && path) {
        const component = componentMap[path]
        if (!component) {
          console.warn(`⚠️ 路径 "${path}" (${menuName}) 没有对应的组件，跳过`)
        } else {
          const route: RouteRecordRaw = {
            path: path,
            name: String(item.id),
            component,
            meta: {
              title: menuName,
              icon: item.icon
            }
          }
          routes.push(route)
        }
      }

      // 递归处理子菜单
      if (item.children?.length) {
        processMenuItems(item.children)
      }
    }
  }

  // 开始处理菜单树
  processMenuItems(menuItems)

  // 添加所有动态路由到 Layout 下
  routes.forEach(route => {
    router.addRoute('Layout', route)
  })

  asyncRoutesAdded = true
}

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes
} as RouterOptions)

// 修复 router.push 的重复导航错误
const originalPush = router.push
router.push = function push(location) {
  return originalPush.call(this, location).catch((err: Error) => {
    if (err.name !== 'NavigationDuplicated') {
      throw err
    }
  })
} as typeof router.push

/**
 * 全局前置守卫 - 认证检查（简化版）
 * 动态路由已在 main.ts 中根据菜单创建，无需重复校验
 */
router.beforeEach((to, _from, next) => {
  // 白名单路径（不需要认证）
  const whiteList = ['/login', '/test', '/play/wasm', '/play/rtc', '/gbRecordDetail', '/cloudRecordDetail']

  // 检查是否在白名单中
  const isWhitelisted = whiteList.some(path => to.path.startsWith(path))

  if (isWhitelisted) {
    next()
    return
  }

  // ========== 检查认证状态 ==========
  const token = getTokenFromStorage()

  // 未登录，重定向到登录页
  if (!token) {
    console.warn('⚠️ 未登录，重定向到登录页')
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // 已登录，直接放行
  // 动态路由已在 main.ts 中根据菜单创建完成
  // Vue Router 会自动处理路由匹配，不存在路由会返回 404
  next()
})

/**
 * 全局后置钩子 - 设置页面标题
 */
router.afterEach((to) => {
  const title = to.meta?.title as string | undefined
  if (title) {
    document.title = `${title} - 太行视觉AI平台`
  } else {
    document.title = '太行视觉AI平台'
  }
})

/**
 * 重置动态路由（用于登出时清除动态路由）
 */
export function resetAsyncRoutes(): void {
  asyncRoutesAdded = false
}

export default router
export { componentMap }

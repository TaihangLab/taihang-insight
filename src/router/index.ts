import { createRouter, createWebHashHistory, type RouterOptions } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 导入布局组件（保留同步，因为它是必须的）
import Layout from '@/layout/index.vue'

// 使用懒加载导入页面组件 - 优化启动性能
const gbRecordDetail = () => import('../components/visionAI/deviceManagement/managementPages/GBRecordDetail.vue')
const login = () => import('../pages/commons/Login.vue')
const cloudRecordDetail = () => import('../components/visionAI/deviceManagement/managementPages/CloudRecordDetail.vue')
const deviceTree = () => import('../components/common/DeviceTree.vue')
const wasmPlayer = () => import('../components/common/jessibuca.vue')
const rtcPlayer = () => import('../components/dialog/rtcPlayer.vue')

// 视觉AI - 可视化中心
const visualCenter = () => import('../pages/center/visualCenter.vue')
const algorithmInference = () => import('../components/visionAI/ivisualCenter/algorithmInference.vue')
const parkManagement = () => import('../components/visionAI/ivisualCenter/parkManagement.vue')

// 监控预警
const realTimeMonitoring = () => import('../components/visionAI/monitoringWarning/realTimeMonitoring.vue')
const statisticsAnalysis = () => import('../components/visionAI/monitoringWarning/statisticsAnalysis.vue')
const warningArchives = () => import('../components/visionAI/monitoringWarning/warningArchives.vue')
const warningManagement = () => import('../components/visionAI/monitoringWarning/warningManagement.vue')
const reviewRecords = () => import('../components/visionAI/monitoringWarning/reviewRecords.vue')
const intelligentReview = () => import('../components/visionAI/monitoringWarning/intelligentReview.vue')

// 设备管理
const camera = () => import('../components/visionAI/deviceManagement/camera.vue')
const CameraManagementMain = () => import('../components/visionAI/deviceManagement/CameraManagementMain.vue')
const localVideo = () => import('../components/visionAI/deviceManagement/localVideo.vue')

// 模型管理
const modelList = () => import('../components/visionAI/modelManagement/modelList.vue')

// 技能管理
const deviceSkills = () => import('../components/visionAI/skillManagement/deviceSkills.vue')
const multimodalLlmSkills = () => import('../components/visionAI/skillManagement/multimodalLlmSkills.vue')
const multimodalCreateDetail = () => import('../components/visionAI/skillManagement/LlmSkillCreateDialogDetail.vue')
const multimodalReview = () => import('../components/visionAI/skillManagement/multimodalReview.vue')
const multimodalReviewCreate = () => import('../components/visionAI/skillManagement/multimodalReviewCreate.vue')

// 智能控制
const logRecords = () => import('../components/visionAI/smartControl/logRecords.vue')

// 边缘管理
const edgeServer = () => import('../components/visionAI/edgeManagement/edgeServer.vue')
const edgeBox = () => import('../components/visionAI/edgeManagement/edgeBox.vue')

// 系统管理
const applicationSettings = () => import('../pages/system/applicationSettings.vue')
const tenantManagement = () => import('../pages/system/tenantManagement.vue')
const userManagement = () => import('../pages/system/userManagement.vue')
const roleManagement = () => import('../pages/system/roleManagement.vue')
const roleAssignment = () => import('../pages/system/components/role/RoleUserAssignmentPage.vue')
const userAssignment = () => import('../pages/system/components/user/UserAssignmentPage.vue')
const departmentManagement = () => import('../pages/system/departmentManagement.vue')
const positionManagement = () => import('../pages/system/positionManagement.vue')
const profile = () => import('../pages/system/profile.vue')
const knowledgeBase = () => import('../pages/system/knowledgeBase.vue')
const knowledgeBaseDetail = () => import('../pages/system/knowledgeBaseDetail.vue')
const permissionManagement = () => import('../pages/system/permissionManagement.vue')

/**
 * 路由权限元数据类型
 */
interface RouteMeta {
  title?: string
  permission?: string | string[]  // 访问此路由需要的权限码
  icon?: string
  hidden?: boolean
}

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: Layout,
    redirect: '/visualCenter',
    children: [
      // 可视化中心
      {
        path: '/visualCenter',
        component: visualCenter,
        meta: { title: '可视化中心', permission: 'visual_center' }
      },
      {
        path: '/algorithmInference',
        component: algorithmInference,
        meta: { title: '算法推理', permission: 'algorithm_inference' }
      },
      {
        path: '/visualCenter/parkManagement',
        name: 'parkManagement',
        component: parkManagement,
        meta: { title: '园区管理', permission: 'park_management' }
      },
      // 监控预警
      {
        path: '/monitoring/realtime',
        name: 'realTimeMonitoring',
        component: realTimeMonitoring,
        meta: { title: '实时监控', permission: 'real_time_monitoring' }
      },
      {
        path: '/monitoring/statistics',
        name: 'statisticsAnalysis',
        component: statisticsAnalysis,
        meta: { title: '统计分析', permission: 'statistics_analysis' }
      },
      {
        path: '/monitoring/warningArchive',
        name: 'warningArchives',
        component: warningArchives,
        meta: { title: '预警档案', permission: 'warning_archives' }
      },
      {
        path: '/monitoring/warningManage',
        name: 'warningManagement',
        component: warningManagement,
        meta: { title: '预警管理', permission: 'warning_management' }
      },
      {
        path: '/monitoring/reviewRecords',
        name: 'reviewRecords',
        component: reviewRecords,
        meta: { title: '复核记录', permission: 'review_records' }
      },
      {
        path: '/monitoring/intelligentReview',
        name: 'intelligentReview',
        component: intelligentReview,
        meta: { title: '智能复核', permission: 'intelligent_review' }
      },
      // 设备管理
      {
        path: '/deviceManage/camera',
        name: 'camera',
        component: camera,
        meta: { title: '摄像头管理', permission: 'camera_management' }
      },
      {
        path: '/deviceManage/cameraManagement',
        name: 'CameraManagementMain',
        component: CameraManagementMain,
        meta: { title: '摄像头管理', permission: 'camera_management' }
      },
      {
        path: '/device/camera',
        redirect: '/deviceManage/camera',
        meta: { hidden: true }
      },
      {
        path: '/deviceManage/localVideo',
        name: 'localVideo',
        component: localVideo,
        meta: { title: '本地视频', permission: 'local_video' }
      },
      // 模型管理
      {
        path: '/modelManage/modelList',
        name: 'modelList',
        component: modelList,
        meta: { title: '模型列表', permission: 'model_list' }
      },
      // 技能管理
      {
        path: '/skillManage/deviceSkills',
        name: 'deviceSkills',
        component: deviceSkills,
        meta: { title: '设备技能', permission: 'device_skills' }
      },
      {
        path: '/skillManage/multimodalLlmSkills',
        name: 'multimodalLlmSkills',
        component: multimodalLlmSkills,
        meta: { title: '多模态技能', permission: 'multimodal_llm_skills' }
      },
      {
        path: '/skillManage/multimodalCreateDetail',
        name: 'multimodalCreateDetail',
        component: multimodalCreateDetail,
        meta: { title: '创建多模态技能', permission: 'multimodal_llm_skills' }
      },
      {
        path: '/skillManage/multimodalReview',
        name: 'multimodalReview',
        component: multimodalReview,
        meta: { title: '多模态复核', permission: 'intelligent_review' }
      },
      {
        path: '/skillManage/multimodalReviewCreate',
        name: 'multimodalReviewCreate',
        component: multimodalReviewCreate,
        meta: { title: '创建多模态复核', permission: 'intelligent_review' }
      },
      // 智能控制
      {
        path: '/intelligentControl/logRecord',
        name: 'logRecords',
        component: logRecords,
        meta: { title: '日志记录', permission: 'log_records' }
      },
      // 边缘管理
      {
        path: '/edgeManage/edgeServer',
        name: 'edgeServer',
        component: edgeServer,
        meta: { title: '边缘服务器', permission: 'edge_server' }
      },
      {
        path: '/edgeManage/edgeBox',
        name: 'edgeBox',
        component: edgeBox,
        meta: { title: '边缘盒子', permission: 'edge_box' }
      },
      // 系统管理
      {
        path: '/systemManage/appSettings',
        name: 'applicationSettings',
        component: applicationSettings,
        meta: { title: '应用设置', permission: 'application_settings' }
      },
      {
        path: '/systemManage/tenantManagement',
        name: 'tenantManagement',
        component: tenantManagement,
        meta: { title: '租户管理', permission: 'tenant_management' }
      },
      {
        path: '/systemManage/userManagement',
        name: 'userManagement',
        component: userManagement,
        meta: { title: '用户管理', permission: 'user_management' }
      },
      {
        path: '/systemManage/roleManagement',
        name: 'roleManagement',
        component: roleManagement,
        meta: { title: '角色管理', permission: 'role_management' }
      },
      {
        path: '/systemManage/roleAssignment/:userId/:user_name',
        name: 'RoleAssignment',
        component: roleAssignment,
        meta: { title: '角色分配', permission: 'role_management' }
      },
      {
        path: '/visionAI/systemManagement/userAssignment',
        name: 'userAssignment',
        component: userAssignment,
        meta: { title: '用户分配', permission: 'user_management' }
      },
      {
        path: '/systemManage/departmentManagement',
        name: 'departmentManagement',
        component: departmentManagement,
        meta: { title: '部门管理', permission: 'department_management' }
      },
      {
        path: '/systemManage/positionManagement',
        name: 'positionManagement',
        component: positionManagement,
        meta: { title: '岗位管理', permission: 'position_management' }
      },
      {
        path: '/systemManage/knowledgeBase',
        name: 'knowledgeBase',
        component: knowledgeBase,
        meta: { title: '知识库', permission: 'knowledge_base' }
      },
      {
        path: '/system/knowledge-detail',
        name: 'knowledgeBaseDetail',
        component: knowledgeBaseDetail,
        meta: { title: '知识库详情', permission: 'knowledge_base' }
      },
      {
        path: '/systemManage/profile',
        name: 'profile',
        component: profile,
        meta: { title: '个人中心' } // 个人中心不需要权限
      },
      {
        path: '/systemManage/permissionManagement',
        name: 'permissionManagement',
        component: permissionManagement,
        meta: { title: '权限管理', permission: 'permission_management' }
      },
      // 录像详情
      {
        path: '/gbRecordDetail/:deviceId/:channelId/',
        name: 'gbRecordDetail',
        component: gbRecordDetail
      },
      {
        path: '/cloudRecordDetail/:app/:stream',
        name: 'cloudRecordDetail',
        component: cloudRecordDetail
      },
      {
        path: '/cloudRecordDetail/:mediaServerId/:app/:stream',
        name: 'cloudRecordDetail2',
        component: cloudRecordDetail
      }
    ]
  },
  // 独立页面
  {
    path: '/login',
    name: 'login',
    component: login
  },
  {
    path: '/test',
    name: 'deviceTree',
    component: deviceTree
  },
  {
    path: '/play/wasm/:url',
    name: 'wasmPlayer',
    component: wasmPlayer
  },
  {
    path: '/play/rtc/:url',
    name: 'rtcPlayer',
    component: rtcPlayer
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes
} as RouterOptions)

const originalPush = router.push
router.push = function push(location) {
  return originalPush.call(this, location).catch((err: Error) => {
    // 忽略重复导航错误
    if (err.name !== 'NavigationDuplicated') {
      throw err
    }
  })
} as typeof router.push

// 全局前置守卫 - 认证和权限检查
router.beforeEach(async (to, _from, next) => {
  // 定义不需要认证的白名单路径
  const whiteList = ['/login', '/test']

  // 白名单路径直接放行
  if (whiteList.includes(to.path)) {
    next()
    return
  }

  // 从 Pinia 持久化存储中获取认证数据
  const authDataStr = localStorage.getItem('taihang-auth')
  if (!authDataStr) {
    console.warn('⚠️ 未登录，重定向到登录页')
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  const authData = JSON.parse(authDataStr)
  const token = authData.token
  const permissions: string[] = authData.permissions || []

  // 没有 token，重定向到登录页
  if (!token) {
    console.warn('⚠️ 未登录，重定向到登录页')
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  // 检查路由权限
  const requiredPermission = to.meta?.permission as string | string[] | undefined
  if (requiredPermission) {
    // 如果路由定义了需要的权限
    const hasPermission = Array.isArray(requiredPermission)
      ? requiredPermission.some(p => permissions.includes(p))
      : permissions.includes(requiredPermission)

    if (!hasPermission) {
      console.warn(`⚠️ 无访问权限: ${to.path}，需要权限: ${JSON.stringify(requiredPermission)}`)

      // 查找用户有权限的第一个菜单项
      const menuTree: any[] = authData.menuTree || []

      // 递归查找第一个可访问的菜单项（只返回 menu 类型，跳过 folder 和 button）
      function findFirstAccessibleMenu(items: any[]): string | null {
        for (const item of items) {
          // 只有 menu 类型才返回，folder 类型需要递归查找子菜单
          if (item.path && item.menu_type === 'menu') {
            return item.path
          }
          if (item.children?.length) {
            const found = findFirstAccessibleMenu(item.children)
            if (found) return found
          }
        }
        return null
      }

      const firstMenuPath = findFirstAccessibleMenu(menuTree)

      if (firstMenuPath && firstMenuPath !== to.path) {
        console.log('🔄 重定向到用户有权限的页面:', firstMenuPath)
        next({ path: firstMenuPath, replace: true })
        return
      }

      // 如果实在找不到有权限的页面，显示无权限提示
      console.error('❌ 用户没有任何可访问的页面')
      // 这里可以跳转到一个专门的 403 页面，或者停留在当前页面显示提示
      next() // 放行但页面内会显示无权限
      return
    }
  }

  // 有 token 且有权限，放行
  next()
})

export default router

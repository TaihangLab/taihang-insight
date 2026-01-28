import { createRouter, createWebHashHistory, type RouterOptions } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 导入布局组件（保留同步，因为它是必须的）
import Layout from '../layout/index.vue'

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
        component: visualCenter
      },
      {
        path: '/algorithmInference',
        component: algorithmInference
      },
      {
        path: '/visualCenter/parkManagement',
        name: 'parkManagement',
        component: parkManagement
      },
      // 监控预警
      {
        path: '/monitoring/realtime',
        name: 'realTimeMonitoring',
        component: realTimeMonitoring
      },
      {
        path: '/monitoring/statistics',
        name: 'statisticsAnalysis',
        component: statisticsAnalysis
      },
      {
        path: '/monitoring/warningArchive',
        name: 'warningArchives',
        component: warningArchives
      },
      {
        path: '/monitoring/warningManage',
        name: 'warningManagement',
        component: warningManagement
      },
      {
        path: '/monitoring/reviewRecords',
        name: 'reviewRecords',
        component: reviewRecords
      },
      {
        path: '/monitoring/intelligentReview',
        name: 'intelligentReview',
        component: intelligentReview
      },
      // 设备管理
      {
        path: '/deviceManage/camera',
        name: 'camera',
        component: camera
      },
      {
        path: '/deviceManage/cameraManagement',
        name: 'CameraManagementMain',
        component: CameraManagementMain
      },
      {
        path: '/device/camera',
        redirect: '/deviceManage/camera'
      },
      {
        path: '/deviceManage/localVideo',
        name: 'localVideo',
        component: localVideo
      },
      // 模型管理
      {
        path: '/modelManage/modelList',
        name: 'modelList',
        component: modelList
      },
      // 技能管理
      {
        path: '/skillManage/deviceSkills',
        name: 'deviceSkills',
        component: deviceSkills
      },
      {
        path: '/skillManage/multimodalLlmSkills',
        name: 'multimodalLlmSkills',
        component: multimodalLlmSkills
      },
      {
        path: '/skillManage/multimodalCreateDetail',
        name: 'multimodalCreateDetail',
        component: multimodalCreateDetail
      },
      {
        path: '/skillManage/multimodalReview',
        name: 'multimodalReview',
        component: multimodalReview
      },
      {
        path: '/skillManage/multimodalReviewCreate',
        name: 'multimodalReviewCreate',
        component: multimodalReviewCreate
      },
      // 智能控制
      {
        path: '/intelligentControl/logRecord',
        name: 'logRecords',
        component: logRecords
      },
      // 边缘管理
      {
        path: '/edgeManage/edgeServer',
        name: 'edgeServer',
        component: edgeServer
      },
      {
        path: '/edgeManage/edgeBox',
        name: 'edgeBox',
        component: edgeBox
      },
      // 系统管理
      {
        path: '/systemManage/appSettings',
        name: 'applicationSettings',
        component: applicationSettings
      },
      {
        path: '/systemManage/tenantManagement',
        name: 'tenantManagement',
        component: tenantManagement
      },
      {
        path: '/systemManage/userManagement',
        name: 'userManagement',
        component: userManagement
      },
      {
        path: '/systemManage/roleManagement',
        name: 'roleManagement',
        component: roleManagement
      },
      {
        path: '/systemManage/roleAssignment/:userId/:user_name',
        name: 'RoleAssignment',
        component: roleAssignment
      },
      {
        path: '/visionAI/systemManagement/userAssignment',
        name: 'userAssignment',
        component: userAssignment
      },
      {
        path: '/systemManage/departmentManagement',
        name: 'departmentManagement',
        component: departmentManagement
      },
      {
        path: '/systemManage/positionManagement',
        name: 'positionManagement',
        component: positionManagement
      },
      {
        path: '/systemManage/knowledgeBase',
        name: 'knowledgeBase',
        component: knowledgeBase
      },
      {
        path: '/system/knowledge-detail',
        name: 'knowledgeBaseDetail',
        component: knowledgeBaseDetail
      },
      {
        path: '/systemManage/profile',
        name: 'profile',
        component: profile
      },
      {
        path: '/systemManage/permissionManagement',
        name: 'permissionManagement',
        component: permissionManagement
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

// 解决 Vue Router 3.x 到 4.x 的 push 方法兼容性问题
const originalPush = router.push
router.push = function push(location) {
  return originalPush.call(this, location).catch((err: Error) => {
    // 忽略重复导航错误
    if (err.name !== 'NavigationDuplicated') {
      throw err
    }
  })
} as typeof router.push

export default router

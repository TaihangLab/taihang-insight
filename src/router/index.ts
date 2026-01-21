import { createRouter, createWebHashHistory, type RouterOptions } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 导入布局组件
import Layout from '../layout/index.vue'

// 导入页面组件
import gbRecordDetail from '../components/visionAI/deviceManagement/managementPages/GBRecordDetail.vue'
import login from '../components/Login.vue'
import cloudRecordDetail from '../components/visionAI/deviceManagement/managementPages/CloudRecordDetail.vue'
import deviceTree from '../components/common/DeviceTree.vue'
import wasmPlayer from '../components/common/jessibuca.vue'
import rtcPlayer from '../components/dialog/rtcPlayer.vue'

// 视觉AI - 可视化中心
import visualCenter from '../components/visionAI/ivisualCenter/index.vue'
import algorithmInference from '../components/visionAI/ivisualCenter/algorithmInference.vue'
import parkManagement from '../components/visionAI/ivisualCenter/parkManagement.vue'

// 监控预警
import realTimeMonitoring from '../components/visionAI/monitoringWarning/realTimeMonitoring.vue'
import statisticsAnalysis from '../components/visionAI/monitoringWarning/statisticsAnalysis.vue'
import warningArchives from '../components/visionAI/monitoringWarning/warningArchives.vue'
import warningManagement from '../components/visionAI/monitoringWarning/warningManagement.vue'
import reviewRecords from '../components/visionAI/monitoringWarning/reviewRecords.vue'
import intelligentReview from '../components/visionAI/monitoringWarning/intelligentReview.vue'

// 设备管理
import camera from '../components/visionAI/deviceManagement/camera.vue'
import CameraManagementMain from '../components/visionAI/deviceManagement/CameraManagementMain.vue'
import localVideo from '../components/visionAI/deviceManagement/localVideo.vue'

// 模型管理
import modelList from '../components/visionAI/modelManagement/modelList.vue'

// 技能管理
import deviceSkills from '../components/visionAI/skillManagement/deviceSkills.vue'
import multimodalLlmSkills from '../components/visionAI/skillManagement/multimodalLlmSkills.vue'
import multimodalCreateDetail from '../components/visionAI/skillManagement/LlmSkillCreateDialogDetail.vue'
import multimodalReview from '../components/visionAI/skillManagement/multimodalReview.vue'
import multimodalReviewCreate from '../components/visionAI/skillManagement/multimodalReviewCreate.vue'

// 智能控制
import logRecords from '../components/visionAI/smartControl/logRecords.vue'

// 边缘管理
import edgeServer from '../components/visionAI/edgeManagement/edgeServer.vue'
import edgeBox from '../components/visionAI/edgeManagement/edgeBox.vue'

// 系统管理
import applicationSettings from '../components/visionAI/systemManagement/applicationSettings.vue'
import tenantManagement from '../pages/system/tenantManagement.vue'
import userManagement from '../pages/system/userManagement.vue'
import roleManagement from '../pages/system/roleManagement.vue'
import roleAssignment from '../components/visionAI/systemManagement/rbac/roleAssignment.vue'
import userAssignment from '../components/visionAI/systemManagement/rbac/userAssignment.vue'
import departmentManagement from '../pages/system/departmentManagement.vue'
import positionManagement from '../pages/system/positionManagement.vue'
import profile from '../components/visionAI/systemManagement/profile.vue'
import knowledgeBase from '../components/visionAI/systemManagement/knowledgeBase.vue'
import knowledgeBaseDetail from '../components/visionAI/systemManagement/knowledgeBaseDetail.vue'
import permissionManagement from '../pages/system/permissionManagement.vue'

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

import Vue from 'vue'
import VueRouter from 'vue-router'
import Layout from "../layout/index.vue"
import { isTokenValid } from '@/utils/auth'



import gbRecordDetail from '../components/visionAI/deviceManagement/managementPages/GBRecordDetail.vue'



import login from '../components/Login.vue'


import cloudRecordDetail from '../components/visionAI/deviceManagement/managementPages/CloudRecordDetail.vue'




import deviceTree from '../components/common/DeviceTree.vue'


import wasmPlayer from '../components/common/jessibuca.vue'
import rtcPlayer from '../components/dialog/rtcPlayer.vue'




import visualCenter from '../components/visionAI/ivisualCenter/index.vue'
import algorithmInference from '../components/visionAI/ivisualCenter/algorithmInference.vue'
import realTimeMonitoring from '../components/visionAI/monitoringWarning/realTimeMonitoring.vue'
import statisticsAnalysis from '../components/visionAI/monitoringWarning/statisticsAnalysis.vue'
import warningArchives from '../components/visionAI/monitoringWarning/warningArchives.vue'
import warningManagement from '../components/visionAI/monitoringWarning/warningManagement.vue'
import reviewRecords from '../components/visionAI/monitoringWarning/reviewRecords.vue'
import intelligentReview from '../components/visionAI/monitoringWarning/intelligentReview.vue'
import camera from '../components/visionAI/deviceManagement/camera.vue'
import CameraManagementMain from '../components/visionAI/deviceManagement/CameraManagementMain.vue'
import modelList from '../components/visionAI/modelManagement/modelList.vue'
import deviceSkills from '../components/visionAI/skillManagement/deviceSkills.vue'
import multimodalLlmSkills from '../components/visionAI/skillManagement/multimodalLlmSkills.vue'
import multimodalCreateDetail from '../components/visionAI/skillManagement/LlmSkillCreateDialogDetail.vue'
import multimodalReview from '../components/visionAI/skillManagement/multimodalReview.vue'
import multimodalReviewCreate from '../components/visionAI/skillManagement/multimodalReviewCreate.vue'
import logRecords from '../components/visionAI/smartControl/logRecords.vue'
import edgeServer from '../components/visionAI/edgeManagement/edgeServer.vue'
import edgeBox from '../components/visionAI/edgeManagement/edgeBox.vue'
import applicationSettings from '../components/visionAI/systemManagement/applicationSettings.vue'
import userManagement from '../components/visionAI/systemManagement/userManagement.vue'
import roleManagement from '../components/visionAI/systemManagement/roleManagement.vue'
import roleAssignment from '../components/visionAI/systemManagement/roleAssignment.vue'
import userAssignment from '../components/visionAI/systemManagement/userAssignment.vue'
import tenantManagement from '../components/visionAI/systemManagement/tenantManagement.vue'
import departmentManagement from '../components/visionAI/systemManagement/departmentManagement.vue'
import positionManagement from '../components/visionAI/systemManagement/positionManagement.vue'
import profile from '../components/visionAI/systemManagement/profile.vue'
import parkManagement from '../components/visionAI/ivisualCenter/parkManagement.vue'
import knowledgeBase from '../components/visionAI/systemManagement/knowledgeBase.vue'
import knowledgeBaseDetail from '../components/visionAI/systemManagement/knowledgeBaseDetail.vue'
// 知识库管理

const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}

Vue.use(VueRouter)

const router = new VueRouter({
  mode:'hash',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Layout,
      redirect: '/visualCenter',
      meta: { requiresAuth: true }, // 需要认证
      children: [
        {
          path: '/visualCenter',
          component: visualCenter,
          meta: { requiresAuth: true }
        },
        {
          path: '/algorithmInference',
          component: algorithmInference,
          meta: { requiresAuth: true }
        },
        {
          path: '/visualCenter/parkManagement',
          name: 'parkManagement',
          component: parkManagement,
          meta: { requiresAuth: true }
        },
        {
          path: '/monitoring/realtime',
          name: 'realTimeMonitoring',
          component: realTimeMonitoring,
          meta: { requiresAuth: true }
        },
        {
          path: '/monitoring/statistics',
          name: 'statisticsAnalysis',
          component: statisticsAnalysis,
          meta: { requiresAuth: true }
        },
        {
          path: '/monitoring/warningArchive',
          name: 'warningArchives',
          component: warningArchives,
          meta: { requiresAuth: true }
        },
        {
          path: '/monitoring/warningManage',
          name: 'warningManagement',
          component: warningManagement,
          meta: { requiresAuth: true }
        },
        {
          path: '/monitoring/reviewRecords',
          name: 'reviewRecords',
          component: reviewRecords,
          meta: { requiresAuth: true }
        },
        {
          path: '/monitoring/intelligentReview',
          name: 'intelligentReview',
          component: intelligentReview,
          meta: { requiresAuth: true }
        },
        {
          path: '/deviceManage/camera',
          name: 'camera',
          component: camera,
          meta: { requiresAuth: true }
        },
        {
          path: '/deviceManage/cameraManagement',
          name: 'CameraManagementMain',
          component: CameraManagementMain,
          meta: { requiresAuth: true }
        },
        {
          path: '/device/camera',
          redirect: '/deviceManage/camera'
        },
        {
          path: '/modelManage/modelList',
          name: 'modelList',
          component: modelList,
          meta: { requiresAuth: true }
        },
        {
          path: '/skillManage/deviceSkills',
          name: 'deviceSkills',
          component: deviceSkills,
          meta: { requiresAuth: true }
        },
        {
          path: '/skillManage/multimodalLlmSkills',
          name: 'multimodalLlmSkills',
          component: multimodalLlmSkills,
          meta: { requiresAuth: true }
        },
        {
          path: '/skillManage/multimodalCreateDetail',
          name: 'multimodalCreateDetail',
          component: multimodalCreateDetail,
          meta: { requiresAuth: true }
        },
        {
          path: '/skillManage/multimodalReview',
          name: 'multimodalReview',
          component: multimodalReview,
          meta: { requiresAuth: true }
        },
        {
          path: '/skillManage/multimodalReviewCreate',
          name: 'multimodalReviewCreate',
          component: multimodalReviewCreate,
          meta: { requiresAuth: true }
        },
        {
          path: '/intelligentControl/logRecord',
          name: 'logRecords',
          component: logRecords,
          meta: { requiresAuth: true }
        },
        {
          path: '/edgeManage/edgeServer',
          name: 'edgeServer',
          component: edgeServer,
          meta: { requiresAuth: true }
        },
        {
          path: '/edgeManage/edgeBox',
          name: 'edgeBox',
          component: edgeBox,
          meta: { requiresAuth: true }
        },
        {
          path: '/systemManage/appSettings',
          name: 'applicationSettings',
          component: applicationSettings,
          meta: { requiresAuth: true }
        },
        {
          path: '/systemManage/userManagement',
          name: 'userManagement',
          component: userManagement,
          meta: { requiresAuth: true }
        },
        {
          path: '/systemManage/roleManagement',
          name: 'roleManagement',
          component: roleManagement,
          meta: { requiresAuth: true }
        },
        {
          path: '/systemManage/roleAssignment/:userId/:userName',
          name: 'RoleAssignment',
          component: roleAssignment,
          meta: { requiresAuth: true }
        },
        {
          path: '/visionAI/systemManagement/userAssignment',
          name: 'userAssignment',
          component: userAssignment,
          meta: { requiresAuth: true }
        },
        {
          path: '/systemManage/tenantManagement',
          name: 'tenantManagement',
          component: tenantManagement,
          meta: { requiresAuth: true }
        },
        {
          path: '/systemManage/departmentManagement',
          name: 'departmentManagement',
          component: departmentManagement,
          meta: { requiresAuth: true }
        },
        {
          path: '/systemManage/positionManagement',
          name: 'positionManagement',
          component: positionManagement,
          meta: { requiresAuth: true }
        },
        {
          path: '/systemManage/knowledgeBase',
          name: 'knowledgeBase',
          component: knowledgeBase,
          meta: { requiresAuth: true }
        },
        {
          path: '/system/knowledge-detail',
          name: 'knowledgeBaseDetail',
          component: knowledgeBaseDetail,
          meta: { requiresAuth: true }
        },
        {
          path: '/systemManage/profile',
          name: 'profile',
          component: profile,
          meta: { requiresAuth: true }
        },
        {
          path: '/gbRecordDetail/:deviceId/:channelId/',
          name: 'gbRecordDetail',
          component: gbRecordDetail,
          meta: { requiresAuth: true }
        },
        {
          path: '/cloudRecordDetail/:app/:stream',
          name: 'cloudRecordDetail',
          component: cloudRecordDetail,
          meta: { requiresAuth: true }
        },
        {
          path: '/cloudRecordDetail/:mediaServerId/:app/:stream',
          name: 'cloudRecordDetail',
          component: cloudRecordDetail,
          meta: { requiresAuth: true }
        },
      ]
    },
    {
      path: '/login',
      name: '登录',
      component: login,
      meta: { requiresAuth: false } // 不需要认证
    },
    {
      path: '/test',
      name: 'deviceTree',
      component: deviceTree,
    },
    {
      path: '/play/wasm/:url',
      name: 'wasmPlayer',
      component: wasmPlayer,
    },
    {
      path: '/play/rtc/:url',
      name: 'rtcPlayer',
      component: rtcPlayer,
    },
  ]
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 检查路由是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查token是否有效
    if (!isTokenValid()) {
      // token无效或不存在，跳转到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存用户想要访问的页面
      })
    } else {
      // token有效，继续导航
      next()
    }
  } else {
    // 不需要认证的路由，直接通过
    next()
  }
})

export default router
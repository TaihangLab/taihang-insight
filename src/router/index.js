import Vue from 'vue'
import VueRouter from 'vue-router'
import Layout from "../layout/index.vue"

// 基础/小体积组件保持同步加载
import deviceTree from '../components/common/DeviceTree.vue'
import wasmPlayer from '../components/common/jessibuca.vue'
import rtcPlayer from '../components/dialog/rtcPlayer.vue'

// visionAI 业务页面全部懒加载，按路由按需加载以减小首包体积
const visualCenter = () => import('../components/visionAI/ivisualCenter/index.vue')
const algorithmInference = () => import('../components/visionAI/ivisualCenter/algorithmInference.vue')
const realTimeMonitoring = () => import('../components/visionAI/monitoringWarning/realTimeMonitoring.vue')
const statisticsAnalysis = () => import('../components/visionAI/monitoringWarning/statisticsAnalysis.vue')
const warningArchives = () => import('../components/visionAI/monitoringWarning/warningArchives.vue')
const warningManagement = () => import('../components/visionAI/monitoringWarning/warningManagement.vue')
const reviewRecords = () => import('../components/visionAI/monitoringWarning/reviewRecords.vue')
const intelligentReview = () => import('../components/visionAI/monitoringWarning/intelligentReview.vue')
const camera = () => import('../components/visionAI/deviceManagement/camera.vue')
const CameraManagementMain = () => import('../components/visionAI/deviceManagement/CameraManagementMain.vue')
const localVideo = () => import('../components/visionAI/deviceManagement/localVideo.vue')
const gbRecordDetail = () => import('../components/visionAI/deviceManagement/managementPages/GBRecordDetail.vue')
const cloudRecordDetail = () => import('../components/visionAI/deviceManagement/managementPages/CloudRecordDetail.vue')
const modelList = () => import('../components/visionAI/modelManagement/modelList.vue')
const deviceSkills = () => import('../components/visionAI/skillManagement/deviceSkills.vue')
const multimodalLlmSkills = () => import('../components/visionAI/skillManagement/multimodalLlmSkills.vue')
const multimodalCreateDetail = () => import('../components/visionAI/skillManagement/LlmSkillCreateDialogDetail.vue')
const multimodalReview = () => import('../components/visionAI/skillManagement/multimodalReview.vue')
const multimodalReviewCreate = () => import('../components/visionAI/skillManagement/multimodalReviewCreate.vue')
const logRecords = () => import('../components/visionAI/smartControl/logRecords.vue')
const edgeServer = () => import('../components/visionAI/edgeManagement/edgeServer.vue')
const edgeBox = () => import('../components/visionAI/edgeManagement/edgeBox.vue')
const profile = () => import('../components/visionAI/systemManagement/profile.vue')
const applicationSettings = () => import('../components/visionAI/systemManagement/applicationSettings.vue')
const userManagement = () => import('../components/visionAI/systemManagement/userManagement.vue')
const roleManagement = () => import('../components/visionAI/systemManagement/roleManagement.vue')
const tenantManagement = () => import('../components/visionAI/systemManagement/tenantManagement.vue')
const departmentManagement = () => import('../components/visionAI/systemManagement/departmentManagement.vue')
const positionManagement = () => import('../components/visionAI/systemManagement/positionManagement.vue')
const knowledgeBase = () => import('../components/visionAI/systemManagement/knowledgeBase.vue')
const knowledgeBaseDetail = () => import('../components/visionAI/systemManagement/knowledgeBaseDetail.vue')
const modelFactory = () => import('../components/visionAI/mlPipeline/modelFactory.vue')
const parkManagement = () => import('../components/visionAI/ivisualCenter/parkManagement.vue')

const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}

Vue.use(VueRouter)


export default new VueRouter({
  mode:'hash',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Layout,
      redirect: '/visualCenter',
      children: [





        {
          path: '/visualCenter',
          component: visualCenter,
        },
        {
          path: '/algorithmInference',
          component: algorithmInference,
        },
        {
          path: '/monitoring/realtime',
          name: 'realTimeMonitoring',
          component: realTimeMonitoring,
        },
        {
          path: '/monitoring/statistics',
          name: 'statisticsAnalysis',
          component: statisticsAnalysis,
        },
        {
          path: '/monitoring/warningArchive',
          name: 'warningArchives',
          component: warningArchives,
        },
        {
          path: '/monitoring/warningManage',
          name: 'warningManagement',
          component: warningManagement,
        },
        {
          path: '/monitoring/reviewRecords',
          name: 'reviewRecords',
          component: reviewRecords,
        },
        {
          path: '/monitoring/intelligentReview',
          name: 'intelligentReview',
          component: intelligentReview,
        },
        {
          path: '/deviceManage/camera',
          name: 'camera',
          component: camera,
        },
        {
          path: '/deviceManage/cameraManagement',
          name: 'CameraManagementMain',
          component: CameraManagementMain,
        },
        {
          path: '/device/camera',
          redirect: '/deviceManage/camera'
        },
        {
          path: '/deviceManage/localVideo',
          name: 'localVideo',
          component: localVideo,
        },
        {
          path: '/modelManage/modelList',
          name: 'modelList',
          component: modelList,
        },
        {
          path: '/skillManage/deviceSkills',
          name: 'deviceSkills',
          component: deviceSkills,
        },
        {
          path: '/skillManage/multimodalLlmSkills',
          name: 'multimodalLlmSkills',
          component: multimodalLlmSkills,
        },
        {
          path: '/skillManage/multimodalCreateDetail',
          name: 'multimodalCreateDetail',
          component: multimodalCreateDetail,
        },
        {
          path: '/skillManage/multimodalReview',
          name: 'multimodalReview',
          component: multimodalReview,
        },
        {
          path: '/skillManage/multimodalReviewCreate',
          name: 'multimodalReviewCreate',
          component: multimodalReviewCreate,
        },
        {
          path: '/intelligentControl/logRecord',
          name: 'logRecords',
          component: logRecords,
        },
        {
          path: '/edgeManage/edgeServer',
          name: 'edgeServer',
          component: edgeServer,
        },
        {
          path: '/edgeManage/edgeBox',
          name: 'edgeBox',
          component: edgeBox,
        },
        {
          path: '/systemManage/profile',
          name: 'profile',
          component: profile,
        },
        {
          path: '/systemManage/appSettings',
          name: 'applicationSettings',
          component: applicationSettings,
        },
        {
          path: '/systemManage/userManagement',
          name: 'userManagement',
          component: userManagement,
        },
        {
          path: '/systemManage/roleManagement',
          name: 'roleManagement',
          component: roleManagement,
        },
        {
          path: '/systemManage/tenantManagement',
          name: 'tenantManagement',
          component: tenantManagement,
        },
        {
          path: '/systemManage/departmentManagement',
          name: 'departmentManagement',
          component: departmentManagement,
        },
        {
          path: '/systemManage/positionManagement',
          name: 'positionManagement',
          component: positionManagement,
        },
        {
          path: '/systemManage/knowledgeBase',
          name: 'knowledgeBase',
          component: knowledgeBase,
        },
        {
          path: '/systemManage/knowledgeBaseDetail',
          name: 'knowledgeBaseDetail',
          component: knowledgeBaseDetail,
        },
        {
          path: '/mlPipeline',
          name: 'modelFactory',
          component: modelFactory,
        },
        {
          path: '/visualCenter/parkManagement',
          name: 'parkManagement',
          component: parkManagement,
        },
        {
          path: '/mlPipeline',
          name: 'modelFactory',
          component: modelFactory,
        },

        {
          path: '/gbRecordDetail/:deviceId/:channelId/',
          name: 'gbRecordDetail',
          component: gbRecordDetail,
        },



        {
          path: '/cloudRecordDetail/:app/:stream',
          name: 'cloudRecordDetail',
          component: cloudRecordDetail,
        },
        {
          path: '/cloudRecordDetail/:mediaServerId/:app/:stream',
          name: 'cloudRecordDetail',
          component: cloudRecordDetail,
        },











        ]
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

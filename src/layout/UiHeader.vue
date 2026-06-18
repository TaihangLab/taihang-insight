<template>
  <div class="ui-header">
    <!-- 左侧面包屑导航 -->
    <div class="header-left">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentMenuName">{{ currentMenuName }}</el-breadcrumb-item>
        <el-breadcrumb-item v-if="currentPageName">{{ currentPageName }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 右侧用户操作区 -->
    <div class="header-right">
      <!-- 系统时间 -->
      <div class="system-time">
        <i class="el-icon-time"></i>
        <span>{{ currentTime }}</span>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <changePasswordDialog ref="changePasswordDialog"></changePasswordDialog>
  </div>
</template>

<script>
import changePasswordDialog from '../components/dialog/changePassword.vue'
import userService from '../components/service/UserService'

export default {
  name: "UiHeader",
  components: { changePasswordDialog },
  data() {
    return {
      currentTime: '',
      currentMenuName: '',
      currentPageName: ''
    };
  },
  created() {
    this.updateTime();
    this.updateBreadcrumb();
    setInterval(this.updateTime, 1000);
  },
  watch: {
    $route() {
      this.updateBreadcrumb();
    }
  },
  methods: {
    updateTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      this.currentTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    updateBreadcrumb() {
      const path = this.$route.path;
      const routeMap = {
        '/monitoring': { menu: '监控预警', page: '' },
        '/monitoring/realtime': { menu: '监控预警', page: '实时监控' },
        '/monitoring/statistics': { menu: '监控预警', page: '统计分析' },
        '/monitoring/warningArchive': { menu: '监控预警', page: '预警档案' },
        '/monitoring/warningManage': { menu: '监控预警', page: '预警管理' },
        '/monitoring/intelligentReview': { menu: '监控预警', page: '智能复判' },
        '/monitoring/reviewRecords': { menu: '监控预警', page: '复判记录' },
        '/deviceManage/camera': { menu: '设备配置', page: '摄像头' },
        '/deviceManage/localVideo': { menu: '设备配置', page: '本地视频' },
        '/modelManage/modelList': { menu: '模型管理', page: '模型列表' },
        '/modelManage/modelFactory': { menu: '模型管理', page: '模型工厂' },
        '/skillManage/skillList': { menu: '技能管理', page: '技能列表' },
        '/skillManage/multimodalReview': { menu: '技能管理', page: '多模态大模型复判' },
        '/skillManage/runPlan': { menu: '技能管理', page: '技能运行计划' },
        '/skillManage/skillGraphEditor': { menu: '技能管理', page: '技能图编辑器' },
        '/systemManage/appSettings': { menu: '系统管理', page: '应用设置' },
        '/systemManage/userManagement': { menu: '系统管理', page: '用户管理' },
        '/systemManage/roleManagement': { menu: '系统管理', page: '角色管理' },
        '/systemManage/tenantManagement': { menu: '系统管理', page: '租户管理' },
        '/systemManage/departmentManagement': { menu: '系统管理', page: '部门管理' },
        '/systemManage/positionManagement': { menu: '系统管理', page: '岗位管理' },
        '/systemManage/knowledgeBase': { menu: '系统管理', page: '知识库' },
        '/mlPipeline': { menu: '模型工厂', page: '' },
        '/visualCenter': { menu: '可视中心', page: '可视中心首页' },
        '/algorithmInference': { menu: '可视中心', page: 'AI智算中心' }
      };

      const route = routeMap[path];
      if (route) {
        this.currentMenuName = route.menu;
        this.currentPageName = route.page;
      } else {
        this.currentMenuName = '';
        this.currentPageName = '';
      }
    },
  }
}
</script>

<style scoped>
/* 顶部导航栏容器 */
.ui-header {
  width: 100%;
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
}

/* 左侧面包屑导航 */
.header-left {
  flex: 1;
}

.header-left >>> .el-breadcrumb {
  font-size: var(--font-size-sm);
  line-height: var(--header-height);
}

.header-left >>> .el-breadcrumb__item {
  font-size: var(--font-size-base);
}

.header-left >>> .el-breadcrumb__inner {
  color: var(--text-secondary);
  font-weight: var(--font-weight-normal);
}

.header-left >>> .el-breadcrumb__item:last-child .el-breadcrumb__inner {
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

/* 右侧操作区 */
.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

/* 系统时间 */
.system-time {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  padding: 0 var(--spacing-base);
}

.system-time i {
  font-size: var(--font-size-base);
}
</style>

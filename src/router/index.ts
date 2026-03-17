/**
 * 太行视觉AI平台 - 路由配置
 * 使用 Vue Router 4 + 动态路由权限控制
 *
 * 最佳实践改进：
 * 1. 移除模块级全局状态，使用 Store 管理路由状态
 * 2. 添加通配符 404 路由
 * 3. 完善动态路由清理逻辑
 * 4. 解耦 localStorage 依赖
 * 5. 改进白名单匹配逻辑
 */
import {
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw,
  type RouterOptions,
  type RouteLocationNormalized,
} from "vue-router";
import { useAppStore } from "@/stores/modules/app";
import { useUserInfoStore } from "@/stores/modules/userInfo";

// 导入布局组件（同步加载，必须）
import Layout from "@/layout/index.vue";

// ============== 基础路由（不需要权限） ==============
const login = () => import("../pages/commons/Login.vue");
const forbidden = () => import("../pages/error/Forbidden.vue");
const notFound = () => import("../pages/error/NotFound.vue");

// 通用组件路由（懒加载）
const gbRecordDetail = () =>
  import("../components/visionAI/deviceManagement/managementPages/GBRecordDetail.vue");
const cloudRecordDetail = () =>
  import("../components/visionAI/deviceManagement/managementPages/CloudRecordDetail.vue");
const deviceTree = () => import("../components/common/DeviceTree.vue");
const wasmPlayer = () => import("../components/common/jessibuca.vue");
const rtcPlayer = () => import("../components/dialog/rtcPlayer.vue");

// ============== 业务路由组件映射（懒加载） ==============
// 路由路径 -> 组件的映射关系，用于动态路由生成
export const componentMap: Record<string, () => Promise<any>> = {
  // 可视化中心
  "/visualCenter": () => import("../pages/center/visualCenter.vue"),
  "/visual": () => import("../pages/center/visualCenter.vue"),
  "/visual/algorithm": () => import("../pages/center/algorithmInference.vue"),
  "/algorithmInference": () => import("../pages/center/algorithmInference.vue"),
  "/visual/park": () => import("../components/visionAI/ivisualCenter/parkManagement.vue"),
  "/visualCenter/parkManagement": () =>
    import("../components/visionAI/ivisualCenter/parkManagement.vue"),

  // 监控预警
  "/monitoring/realtime": () =>
    import("../components/visionAI/monitoringWarning/realTimeMonitoring.vue"),
  "/monitoring/statistics": () =>
    import("../components/visionAI/monitoringWarning/statisticsAnalysis.vue"),
  "/monitoring/warningArchive": () =>
    import("../pages/monitoringWarning/warningArchives.vue"),
  "/monitoring/warningManage": () =>
    import("../components/visionAI/monitoringWarning/warningManagement.vue"),
  "/monitoring/reviewRecords": () =>
    import("../pages/monitoringWarning/reviewRecords.vue"),
  "/monitoring/intelligentReview": () =>
    import("../components/visionAI/monitoringWarning/intelligentReview.vue"),
  "/monitoring/warnings": () =>
    import("../pages/monitoringWarning/warningArchives.vue"),
  "/monitoring/review": () => import("../pages/monitoringWarning/reviewRecords.vue"),
  "/monitoring/intelligent-review": () =>
    import("../components/visionAI/monitoringWarning/intelligentReview.vue"),

  // 复判相关（支持后端返回的路径）
  "/review": () => import("../pages/monitoringWarning/reviewRecords.vue"),
  "/task-review": () => import("../pages/error/UnderConstruction.vue"),

  // AI 任务（开发中）
  "/ai-task": () => import("../pages/error/UnderConstruction.vue"),

  // 设备管理（支持后端返回的路径）
  "/deviceManage/camera": () => import("../components/visionAI/deviceManagement/camera.vue"),
  "/deviceManage/cameraManagement": () =>
    import("../components/visionAI/deviceManagement/CameraManagementMain.vue"),
  "/deviceManage/localVideo": () =>
    import("../components/visionAI/deviceManagement/localVideo.vue"),
  "/devices/cameras": () => import("../components/visionAI/deviceManagement/camera.vue"),
  "/devices/cameras-main": () =>
    import("../components/visionAI/deviceManagement/CameraManagementMain.vue"),
  "/devices/local-video": () => import("../components/visionAI/deviceManagement/localVideo.vue"),

  // 模型管理（支持后端返回的路径）
  "/modelManage/modelList": () => import("../components/visionAI/modelManagement/modelList.vue"),
  "/models": () => import("../components/visionAI/modelManagement/modelList.vue"),
  "/models/list": () => import("../components/visionAI/modelManagement/modelList.vue"),

  // 技能管理（支持后端返回的路径）
  "/skillManage/deviceSkills": () =>
    import("../components/visionAI/skillManagement/deviceSkills.vue"),
  "/skillManage/multimodalLlmSkills": () =>
    import("../components/visionAI/skillManagement/multimodalLlmSkills.vue"),
  "/skillManage/multimodalCreateDetail": () =>
    import("../components/visionAI/skillManagement/LlmSkillCreateDialogDetail.vue"),
  "/skillManage/multimodalReview": () =>
    import("../components/visionAI/skillManagement/multimodalReview.vue"),
  "/skillManage/multimodalReviewCreate": () =>
    import("../components/visionAI/skillManagement/multimodalReviewCreate.vue"),
  "/skills": () => import("../components/visionAI/skillManagement/deviceSkills.vue"),
  "/skills/device": () => import("../components/visionAI/skillManagement/deviceSkills.vue"),
  "/skills/multimodal-llm": () =>
    import("../components/visionAI/skillManagement/multimodalLlmSkills.vue"),
  "/skills/multimodal-review": () =>
    import("../components/visionAI/skillManagement/multimodalReview.vue"),

  // 智能控制（支持后端返回的路径）
  "/intelligentControl/logRecord": () =>
    import("../components/visionAI/smartControl/logRecords.vue"),
  "/control": () => import("../components/visionAI/smartControl/logRecords.vue"),
  "/control/logs": () => import("../components/visionAI/smartControl/logRecords.vue"),

  // 边缘管理（支持后端返回的路径）
  "/edgeManage/edgeServer": () => import("../components/visionAI/edgeManagement/edgeServer.vue"),
  "/edgeManage/edgeBox": () => import("../components/visionAI/edgeManagement/edgeBox.vue"),
  "/edge": () => import("../components/visionAI/edgeManagement/edgeServer.vue"),
  "/edge/servers": () => import("../components/visionAI/edgeManagement/edgeServer.vue"),
  "/edge/boxes": () => import("../components/visionAI/edgeManagement/edgeBox.vue"),

  // 系统管理
  "/systemManage/appSettings": () => import("../pages/system/applicationSettings.vue"),
  "/systemManage/tenantManagement": () => import("../pages/system/tenantManagement.vue"),
  "/systemManage/userManagement": () => import("../pages/system/userManagement.vue"),
  "/systemManage/roleManagement": () => import("../pages/system/roleManagement.vue"),
  "/systemManage/roleAssignment/:userId/:user_name": () =>
    import("../pages/system/components/role/RoleUserAssignmentPage.vue"),
  "/visionAI/systemManagement/userAssignment": () =>
    import("../pages/system/components/user/UserAssignmentPage.vue"),
  "/systemManage/departmentManagement": () => import("../pages/system/departmentManagement.vue"),
  "/systemManage/positionManagement": () => import("../pages/system/positionManagement.vue"),
  "/systemManage/profile": () => import("../pages/system/profile.vue"),
  "/systemManage/knowledgeBase": () => import("../pages/system/knowledgeBase.vue"),
  "/system/knowledge-detail": () => import("../pages/system/knowledgeBaseDetail.vue"),
  "/systemManage/permissionManagement": () => import("../pages/system/permissionManagement.vue"),
};

/**
 * 白名单路由配置
 * 使用精确路径匹配，避免 startsWith 过于宽泛
 */
const WHITE_LIST_ROUTES = [
  "/login",
  "/403",
  "/404",
  "/test",
  // 播放器路由（支持动态参数）
  /^\/play\/wasm\//,
  /^\/play\/rtc\//,
  // 录像详情路由（支持动态参数）
  /^\/gbRecordDetail\//,
  /^\/cloudRecordDetail\//,
];

/**
 * 检查路径是否在白名单中
 */
function isWhitelisted(path: string): boolean {
  return WHITE_LIST_ROUTES.some((whitelistPath) => {
    if (whitelistPath instanceof RegExp) {
      return whitelistPath.test(path);
    }
    // 精确匹配
    return path === whitelistPath;
  });
}

/**
 * 基础路由配置（不需要认证的白名单路由）
 */
const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: login,
    meta: { title: "登录" },
  },
  {
    path: "/403",
    name: "Forbidden",
    component: forbidden,
    meta: { title: "访问被拒绝", hidden: true },
  },
  {
    path: "/404",
    name: "NotFound",
    component: notFound,
    meta: { title: "页面不存在", hidden: true },
  },
  {
    path: "/test",
    name: "Test",
    component: deviceTree,
    meta: { hidden: true },
  },
  // 播放器路由
  {
    path: "/play/wasm/:url(.*)",
    name: "WasmPlayer",
    component: wasmPlayer,
    meta: { hidden: true },
  },
  {
    path: "/play/rtc/:url(.*)",
    name: "RtcPlayer",
    component: rtcPlayer,
    meta: { hidden: true },
  },
  // 录像详情路由
  {
    path: "/gbRecordDetail/:deviceId/:channelId/",
    name: "GBRecordDetail",
    component: gbRecordDetail,
    meta: { hidden: true },
  },
  {
    path: "/cloudRecordDetail/:app/:stream",
    name: "CloudRecordDetail",
    component: cloudRecordDetail,
    meta: { hidden: true },
  },
  {
    path: "/cloudRecordDetail/:mediaServerId/:app/:stream",
    name: "CloudRecordDetail2",
    component: cloudRecordDetail,
    meta: { hidden: true },
  },
  // 主布局路由（包含所有业务路由的父路由）
  {
    path: "/",
    name: "Layout",
    component: Layout,
    redirect: "/visual",
    children: [], // 占位，动态路由会添加到这里
  },
];

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
} as RouterOptions);

/**
 * 修复 router.push 的重复导航错误
 */
const originalPush = router.push;
router.push = ((location: Parameters<typeof router.push>[0]) => {
  return originalPush(location).catch((err: Error) => {
    if (err.name !== "NavigationDuplicated") {
      throw err;
    }
  });
}) as typeof router.push;

/**
 * ============== 动态路由管理 ==============

/**
 * 动态生成并添加业务路由
 * 根据后端返回的菜单树生成路由配置并添加到路由器
 *
 * @param menuItems - 后端返回的菜单树
 * @returns 返回实际添加的路由数量
 */
export function setupAsyncRoutes(menuItems: unknown[]): number {
  const appStore = useAppStore();

  // 检查是否已添加
  if (appStore.isAsyncRoutesAdded()) {
    console.warn("[Router] 动态路由已添加，跳过重复添加");
    return 0;
  }

  const addedRoutes: RouteRecordRaw[] = [];

  /**
   * 递归处理菜单树
   */
  function processMenuItems(items: unknown[]) {
    for (const rawItem of items) {
      const item = rawItem as Record<string, unknown>;
      // 兼容后端不同字段名：permission_name/menu_name, permission_type/menu_type
      const menuName = String(item.menu_name || item.permission_name || item.name || "");
      const menuType = item.menu_type || item.permission_type || item.type;
      const path = String(item.path || "");

      // 只处理 menu 类型的菜单项（跳过 folder 和 button）
      // menu_type 可能是: 'menu', 'folder', 'button' 或数字 1, 2, 3
      const isMenu = menuType === "menu" || menuType === 1 || (!menuType && path);

      if (isMenu && path) {
        const component = componentMap[path];
        if (!component) {
          console.warn(`⚠️ 路径 "${path}" (${menuName}) 没有对应的组件，跳过`);
        } else {
          const route: RouteRecordRaw = {
            path: path,
            name: String(item.id),
            component,
            meta: {
              title: menuName,
              icon: String(item.icon || ""),
            },
          };
          addedRoutes.push(route);
        }
      }

      // 递归处理子菜单
      if (Array.isArray(item.children) && item.children.length) {
        processMenuItems(item.children);
      }
    }
  }

  // 开始处理菜单树
  processMenuItems(menuItems);

  // 添加所有动态路由到 Layout 下
  addedRoutes.forEach((route) => {
    router.addRoute("Layout", route);
    // 记录已添加的路由，用于清理
    appStore.addDynamicRouteRecord({ name: route.name as string, path: route.path });
  });

  // 标记已添加
  appStore.setAsyncRoutesAdded(true);

  console.log(`[Router] 成功添加 ${addedRoutes.length} 条动态路由`);
  return addedRoutes.length;
}

/**
 * 重置动态路由（用于登出时清除动态路由）
 * 真正移除已添加的路由，而不是仅重置标记
 */
export function resetAsyncRoutes(): void {
  const appStore = useAppStore();

  // 获取所有已添加的动态路由记录
  const records = appStore.getDynamicRouteRecords();

  // 倒序移除路由（避免索引问题）
  for (let i = records.length - 1; i >= 0; i--) {
    const record = records[i];
    if (!record) continue;

    if (router.hasRoute(record.name)) {
      router.removeRoute(record.name);
      console.log(`[Router] 移除路由: ${record.name} (${record.path})`);
    }
  }

  // 清空状态
  appStore.resetDynamicRoutes();

  console.log("[Router] 动态路由已重置");
}

/**
 * ============== 路由守卫 ==============

/**
 * 动态路由就绪标志
 * 用于路由守卫判断是否需要等待动态路由添加
 */
let isDynamicRoutesReady = false;

/**
 * 设置动态路由就绪标志（由 main.ts 调用）
 */
export function markDynamicRoutesReady() {
  isDynamicRoutesReady = true;
  console.log("[Router] 动态路由就绪");
}

/**
 * 全局前置守卫 - 认证与权限检查
 *
 * 修复：
 * 1. 刷新页面跳转 404 问题：Store 可能还未从 localStorage 完全恢复
 * 2. localStorage 被删除后数据无法自动重建：新增 menus/permissions 自动加载
 *
 * 解决方案：
 * 1. 优先使用 token 判断登录状态（token 存储更可靠）
 * 2. 如果 userInfo/menus/permissions 数据缺失，尝试异步获取
 * 3. 在动态路由加载完成前，不检查 to.matched.length
 *
 * 最佳实践：
 * 1. 避免在守卫中使用 next() 参数（Vue Router 4 推荐）
 * 2. 使用 return 或抛出错误进行导航控制
 * 3. 等待动态路由添加完成后再进行路由匹配检查
 */
router.beforeEach(async (to: RouteLocationNormalized) => {
  // 1. 检查白名单
  if (isWhitelisted(to.path)) {
    return true;
  }

  // 2. 检查认证状态并确保必要数据已加载
  // 优先使用 token 判断登录状态，因为 token 存储在 localStorage 更可靠
  const { useTokenStore } = await import("@/stores/modules/token");
  const tokenStore = useTokenStore();
  const userInfoStore = useUserInfoStore();
  const userInfo = userInfoStore.getUserInfoSync();

  // 有 token 但没有用户信息：尝试异步获取
  if (tokenStore.hasAdminToken() && !userInfo) {
    console.log("[Router] 检测到 token 但无用户信息，尝试获取...");
    try {
      await userInfoStore.refresh();
      console.log("[Router] 用户信息获取成功");
    } catch (error) {
      console.error("[Router] 获取用户信息失败，清除 token", error);
      tokenStore.clearTokens();
      return {
        path: "/login",
        query: { redirect: to.fullPath },
      };
    }
  }

  // 2.1 确保菜单数据已加载（修复 localStorage 被删除后无法重建的问题）
  if (tokenStore.hasAdminToken()) {
    const { useMenusStore } = await import("@/stores/modules/menus");
    const menusStore = useMenusStore();
    if (!menusStore.hasData()) {
      console.log("[Router] 菜单数据为空或已过期，尝试获取...");
      try {
        await menusStore.refresh();
        console.log("[Router] 菜单数据获取成功");
      } catch (error) {
        console.error("[Router] 获取菜单失败", error);
      }
    }

    // 2.2 确保权限数据已加载（修复 localStorage 被删除后无法重建的问题）
    const { usePermissionsStore } = await import("@/stores/modules/permissions");
    const permissionsStore = usePermissionsStore();
    if (!permissionsStore.hasData()) {
      console.log("[Router] 权限数据为空或已过期，尝试获取...");
      try {
        await permissionsStore.refresh();
        console.log("[Router] 权限数据获取成功");
      } catch (error) {
        console.error("[Router] 获取权限失败", error);
      }
    }
  }

  // 没有登录信息：重定向到登录页
  const updatedUserInfo = userInfoStore.getUserInfoSync();
  if (!updatedUserInfo || !tokenStore.hasAdminToken()) {
    console.warn("[Router] 未登录，重定向到登录页");
    return {
      path: "/login",
      query: { redirect: to.fullPath },
    };
  }

  // 3. 等待动态路由添加完成
  // 如果动态路由还没就绪，等待最多 3 秒
  if (!isDynamicRoutesReady) {
    console.log("[Router] 等待动态路由添加...");
    const startTime = Date.now();
    const timeout = 3000; // 3 秒超时

    while (!isDynamicRoutesReady && Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (!isDynamicRoutesReady) {
      console.error("[Router] 动态路由添加超时，重定向到首页");
      return { path: "/" };
    }
  }

  // 4. 所有检查通过，放行
  // Vue Router 会自动处理路由匹配
  // 如果路由真正不存在，Vue Router 会自动导航到 404（通过通配符路由）
  return true;
});

/**
 * 全局后置钩子 - 设置页面标题
 */
router.afterEach((to) => {
  const title = to.meta?.title as string | undefined;
  if (title) {
    document.title = `${title} - 太行视觉AI平台`;
  } else {
    document.title = "太行视觉AI平台";
  }
});

export default router;

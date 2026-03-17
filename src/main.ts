// 首先初始化全局变量（必须在所有其他导入之前）
import "./setup-globals";

// 【性能优化】导入 UnoCSS 虚拟模块（按需生成样式）
import "virtual:uno.css";

// Element Plus 基础样式（先导入默认样式）
import "element-plus/dist/index.css";

// 【主题统一】导入 Element Plus 主题配置（后导入以覆盖默认样式）
import "./styles/theme.css";

// 【按需加载】video.js 样式移到组件内导入
// import 'video.js/dist/video-js.css'

import { createApp, nextTick } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import ElementPlus, { ElNotification } from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import dataV from "data-view-vue3";
// import Contextmenu from 'vue-contextmenujs' // 暂时注释 - Vue 3 不兼容
import App from "./App.vue";
// import router from './router'  // ❌ 移除静态导入，改为动态导入

// 创建应用实例
const app = createApp(App);

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 使用插件
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
app.use(ElementPlus);
app.use(dataV);
// app.use(Contextmenu) // 暂时注释 - vue-contextmenujs 不兼容 Vue 3，待后续使用 UnoCSS 重写

// 注册自定义指令
import { setupDirectives } from "@/directives";
setupDirectives(app);

// 全局属性
app.config.globalProperties.$notify = ElNotification;
app.config.globalProperties.$tableHeght = window.innerHeight - 170;
app.config.globalProperties.$channelTypeList = {
  1: { id: 1, name: "国标设备", style: { color: "#409eff", borderColor: "#b3d8ff" } },
  2: { id: 2, name: "推流设备", style: { color: "#67c23a", borderColor: "#c2e7b0" } },
  3: { id: 3, name: "拉流代理", style: { color: "#e6a23c", borderColor: "#f5dab1" } },
};

// ========== 用户态同步初始化 ==========
// 【关键】用户态是强诉求，必须在路由创建之前完成初始化
// 这样路由守卫和组件才能正确访问用户态数据
//
// 【最佳实践】动态路由管理：
// - 使用 useAppStore 管理路由状态，避免模块级全局变量
// - 登录时调用 resetAsyncRoutes() 清除旧路由
// - 使用 setupAsyncRoutes() 建立新的动态路由

// ========== 异步初始化函数 ==========
async function initializeApp() {
  try {
    // 1️⃣ 动态导入路由模块
    const { default: router, setupAsyncRoutes } = await import("./router");

    // 2️⃣ 注册路由到应用
    app.use(router);

    // 3️⃣ 挂载应用
    // Pinia 实例已在 app.use(pinia) 时注册，DevTools 连接已建立
    app.mount("#app");

    // 4️⃣ 挂载后立即创建 store 并建立动态路由
    // 此时应用已挂载，Pinia DevTools 已完全初始化
    await nextTick();

    // 创建 store 实例
    const { useMenusStore } = await import("@/stores");
    const menusStore = useMenusStore();

    // 获取菜单树（持久化插件已自动恢复数据）
    const menuTree = menusStore.getMenuTreeSync() || [];

    console.log("[main.ts] 菜单树检查:", menuTree.length, "个菜单");

    // 根据菜单建立动态路由
    if (menuTree.length > 0) {
      setupAsyncRoutes(menuTree);
      // 标记动态路由就绪，让路由守卫知道可以开始检查路由了
      const { markDynamicRoutesReady } = await import("./router");
      markDynamicRoutesReady();
      console.log("✅ 动态路由已建立");

      // 🔧 修复刷新后白屏问题（仅处理无匹配路由的情况）
      await nextTick(); // 等待 DOM 更新

      // 检查当前路由是否匹配（如果 matched 为空，说明没有找到匹配的路由）
      const currentRoute = router.currentRoute.value;
      if (!currentRoute || currentRoute.matched.length === 0) {
        // 尝试从 hash 获取当前路径
        const hashPath = window.location.hash.slice(1);
        if (hashPath && hashPath !== "/login" && hashPath !== "/") {
          console.log("[main.ts] 检测到未匹配路由，重新导航到:", hashPath);
          await router.replace(hashPath);
        }
      }
    } else {
      console.info("⚠️ 菜单树为空，跳过动态路由建立");
      // 即使没有动态路由，也要标记就绪，避免路由守卫一直等待
      const { markDynamicRoutesReady } = await import("./router");
      markDynamicRoutesReady();
    }
  } catch (e) {
    console.error("❌ 应用初始化失败:", e);
    // 即使失败也尝试挂载应用，让用户看到错误界面
    app.mount("#app");
  }
}

// ========== 启动应用 ==========
initializeApp();

<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
import  userService from './components/service/UserService'
export default {
  name: 'app',
  data(){
    return {
      isLogin: false,
      excludeLoginCheck: ["/play/wasm", "/play/rtc"],
      userInfo: { //保存用户信息
        nick: null,
        ulevel: null,
        uid: null,
        portrait: null
      }
    }
  },
  created() {
    // 🔓 已移除强制登录检查 - 允许访客访问所有页面
    // 用户可以选择在登录页面登录，登录后可以使用用户相关功能
    console.log('系统启动 - 无需登录即可访问');
    if (userService.getToken() != null) {
      console.log('检测到已登录用户:', userService.getUser().username);
    } else {
      console.log('当前为访客模式');
    }
  },

  mounted(){
    //组件开始挂载时获取用户信息
    // this.getUserInfo();
  },
  methods: {
  },
  components: {}
};
</script>

<style>
/* 全局样式重置 */
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  background-color: var(--bg-secondary);
  font-family: var(--font-family-base);
  color: var(--text-primary);
  box-sizing: border-box;
}
*,
*::before,
*::after {
  box-sizing: inherit;
}

/* Element UI 组件全局样式调整 */
.el-header,
.el-footer {
  color: var(--text-primary);
  text-align: center;
  width: 100%;
  padding: 0;
}

.el-main {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  padding: 0;
  width: 100%;
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  border-radius: 4px;
  background-color: var(--bg-tertiary);
}

::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: var(--border-color);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--text-tertiary);
}

/* 表格表头通用样式 */
.table-header {
  color: var(--text-primary);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
}
</style>

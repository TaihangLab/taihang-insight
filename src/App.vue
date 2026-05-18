<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
// 登录态/动态路由全部交由 src/router/permission.js 中的全局守卫处理。
// 这里只保留组件骨架，避免在 created 中做重复跳转逻辑。
export default {
  name: 'app',
  data () {
    return {}
  },
  methods: {},
  components: {}
};
</script>

<style>
/* 整站一屏：标题与内容一体，自适应填满、不溢出 */
html,
body {
  margin: 0;
  padding: 0;
  background-color: #e9eef3;
  height: 100%;
  width: 100%;
  overflow: hidden !important;
  box-sizing: border-box;
}
html {
  height: 100vh;
  max-height: 100vh;
}
body {
  max-height: 100vh;
}
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  min-height: 0;
  max-height: 100vh;
  width: 100%;
  overflow: hidden !important;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
#app > * {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}
*,
*::before,
*::after {
  box-sizing: inherit;
}
.el-header,
.el-footer {
  /* background-color: #b3c0d1; */
  color: #333;
  text-align: center;
  line-height: 60px;
  width: 100%;
  padding: 0;
}
.el-main {
  background-color: #f0f2f5;
  color: #333;
  text-align: center;
  padding: 0;
  width: 100%;
}

/*定义滚动条高宽及背景 高宽分别对应横竖滚动条的尺寸*/
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

/*定义滚动条轨道 内阴影+圆角*/
::-webkit-scrollbar-track {
  border-radius: 4px;
  background-color: #F5F5F5;
}

/*定义滑块 内阴影+圆角*/
::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background-color: #c8c8c8;
  box-shadow: inset 0 0 6px rgba(0, 0, 0, .1);
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, .1);
}
.table-header {
  color: #727272;
  font-weight: 600;
}
</style>

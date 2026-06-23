<template>
  <!-- 标题与内容一体占满一屏，不产生页面上下滚动 -->
  <el-container class="layout-container">
    <el-header class="layout-header">
      <ui-header/>
    </el-header>
    <el-main class="layout-main">
      <div class="layout-main-inner">
        <router-view :key="$route.fullPath"></router-view>
      </div>
    </el-main>
    <!-- 太行·问道助手 -->
    <taihang-assistant />
  </el-container>
</template>

<script>
import uiHeader from "./UiHeader.vue";
import TaihangAssistant from "../components/visionAI/chatAssistant/TaihangAssistant.vue";

export default {
  name: "index",
  components: {
    uiHeader,
    TaihangAssistant
  },
}
</script>
<style>
body{
  font-family: sans-serif;
}
/*定义标题栏*/
.page-header {
  background-color: #FFFFFF;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
}

.page-title {
  font-weight: bold;
  text-align: left;
  padding-left: 0.5rem;
}

.page-header-btn {
  text-align: right;
  padding-right: 0.5rem;
}
</style>
<style scoped>
/* 一屏布局：标题与内容一体，自适应填满视口、不溢出 */
.layout-container {
  height: 100%;
  min-height: 0;
  max-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden !important;
  box-sizing: border-box;
}
.layout-header {
  flex-shrink: 0;
  padding: 0;
  width: 100%;
  height: auto;
}
.layout-main {
  padding: 0;
  width: 100%;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}
.layout-main-inner {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto !important;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}
</style>
<style>
/* 内容区滚动条 */
.layout-main-inner::-webkit-scrollbar {
  width: 8px;
}
.layout-main-inner::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 4px;
}
.layout-main-inner::-webkit-scrollbar-thumb {
  background: #c8c8c8;
  border-radius: 4px;
}
.layout-main-inner::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 子页面根节点：由 layout-main-inner 统一滚动，避免多次进入后高度异常导致底部被裁切 */
.layout-main-inner > * {
  min-height: 100%;
  height: auto;
  overflow: visible !important;
}

.fade-enter {
  visibility: hidden;
  opacity: 0;
}

.fade-leave-to {
  display: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .5s ease;
}

.fade-enter-to,
.fade-leave {
  visibility: visible;
  opacity: 1;
}
</style>

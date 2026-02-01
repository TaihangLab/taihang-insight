<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<style>
/* 全局样式重置 */
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  background-color: var(--bg-secondary);
  font-family: var(--font-family-base);
  color: var(--text-primary);
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

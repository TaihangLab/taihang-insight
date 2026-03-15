<script setup lang="ts">
/**
 * 通用科技感页面容器组件
 * 用于 Login 等需要统一背景风格的页面
 */
interface Props {
  /** 左侧装饰区域是否显示 */
  showDecoration?: boolean;
}

withDefaults(defineProps<Props>(), {
  showDecoration: true,
});
</script>

<template>
  <div class="tech-page-container">
    <div class="tech-page-content">
      <!-- 左侧装饰区域 -->
      <div v-if="showDecoration" class="tech-decoration">
        <slot name="decoration">
          <!-- 默认装饰：静态圆环 -->
          <div class="tech-circle">
            <div class="inner-circle"></div>
          </div>
        </slot>
      </div>

      <!-- 右侧内容区域 -->
      <div class="tech-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 🔥 极致优化：移除所有动态效果，保证流畅 */

/* 主容器样式 */
.tech-page-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  /* 统一背景色 */
  background: #0c1929;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family-base);
}

/* 主内容区域 */
.tech-page-content {
  position: relative;
  display: flex;
  width: 90%;
  max-width: 1200px;
  height: 600px;
  /* 统一背景样式 */
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  z-index: 2;
  overflow: hidden;
}

/* 左侧装饰区域 */
.tech-decoration {
  flex: 1;
  position: relative;
  background: rgba(65, 133, 247, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 默认装饰：静态圆环 */
.tech-circle {
  width: 300px;
  height: 300px;
  border: 2px solid rgba(65, 133, 247, 0.25);
  border-radius: 50%;
  position: relative;
}

.inner-circle {
  width: 200px;
  height: 200px;
  border: 1px solid rgba(90, 150, 248, 0.25);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 右侧内容区域 */
.tech-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tech-page-content {
    flex-direction: column;
    width: 95%;
    height: auto;
    min-height: 600px;
  }

  .tech-decoration {
    display: none;
  }

  .tech-content {
    padding: 30px 20px;
  }
}

@media (max-width: 480px) {
  .tech-page-content {
    margin: 20px;
    width: calc(100% - 40px);
  }

  .tech-content {
    padding: 20px 15px;
  }
}
</style>

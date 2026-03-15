<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// 返回首页
const goHome = () => {
  router.push("/");
};

// 返回上一页
const goBack = () => {
  router.back();
};

// 粒子样式生成
const particleCount = 30;
const particles = ref<Array<{ id: number; style: Record<string, string> }>>([]);

// 生成粒子样式
function generateParticles() {
  const result: Array<{ id: number; style: Record<string, string> }> = [];
  for (let i = 0; i < particleCount; i++) {
    result.push({
      id: i,
      style: {
        left: Math.random() * 100 + "%",
        top: Math.random() * 100 + "%",
        animationDelay: Math.random() * 3 + "s",
        animationDuration: Math.random() * 3 + 2 + "s",
      },
    });
  }
  return result;
}

particles.value = generateParticles();
</script>

<template>
  <div class="error-container">
    <!-- 背景粒子效果 -->
    <div class="particles-background">
      <div
        v-for="particle in particles"
        :key="particle.id"
        class="particle"
        :style="particle.style"
      ></div>
    </div>

    <!-- 装饰线条 -->
    <div class="decoration-lines">
      <div class="line line-1"></div>
      <div class="line line-2"></div>
    </div>

    <!-- 主内容区域 -->
    <div class="error-content">
      <!-- 左侧装饰区域 -->
      <div class="decoration-area">
        <div class="tech-icon">
          <i class="i-carbon-software-resource-resource"></i>
          <div class="icon-glow"></div>
        </div>
        <div class="building-text">DEV</div>
      </div>

      <!-- 右侧信息区域 -->
      <div class="info-area">
        <!-- 标题 -->
        <div class="error-header">
          <h1 class="error-title">功能开发中</h1>
          <div class="error-divider"></div>
        </div>

        <!-- 描述 -->
        <div class="error-description">
          <p class="error-message">该功能正在开发中，敬请期待...</p>
          <p class="error-submessage">我们的团队正在努力为您打造更好的用户体验。</p>
        </div>

        <!-- 进度提示 -->
        <div class="progress-area">
          <div class="progress-item">
            <i class="i-carbon-time progress-icon"></i>
            <div class="progress-content">
              <div class="progress-title">预计上线时间</div>
              <div class="progress-value">待定</div>
            </div>
          </div>
          <div class="progress-item">
            <i class="i-carbon-chart-ripple progress-icon"></i>
            <div class="progress-content">
              <div class="progress-title">开发进度</div>
              <div class="progress-value">进行中</div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="error-actions">
          <button class="tech-btn tech-btn-primary" @click="goHome">
            <i class="i-carbon-home btn-icon"></i>
            返回首页
            <div class="btn-glow"></div>
          </button>
          <button class="tech-btn tech-btn-secondary" @click="goBack">
            <i class="i-carbon-arrow-left btn-icon"></i>
            返回上一页
          </button>
        </div>

        <!-- 底部信息 -->
        <div class="error-footer">
          <div class="footer-info">
            <i class="i-carbon-information"></i>
            如有疑问，请联系产品经理
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 主容器 */
.error-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #0c1929 0%, #1a2f47 50%, #2d4563 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family-base);
}

/* 粒子背景 */
.particles-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: var(--design-primary-color, #4185f7);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--design-primary-color, #4185f7);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) scale(1);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-20px) scale(1.1);
    opacity: 1;
  }
}

/* 装饰线条 */
.decoration-lines {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.line {
  position: absolute;
  background: linear-gradient(
    90deg,
    transparent,
    var(--design-primary-color, #4185f7),
    transparent
  );
  opacity: 0.4;
}

.line-1 {
  width: 100%;
  height: 1px;
  top: 25%;
  animation: slideRight 3s ease-in-out infinite;
}

.line-2 {
  width: 1px;
  height: 100%;
  left: 25%;
  animation: slideDown 4s ease-in-out infinite;
}

@keyframes slideRight {
  0%,
  100% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
}

@keyframes slideDown {
  0%,
  100% {
    transform: translateY(-100%);
  }
  50% {
    transform: translateY(100%);
  }
}

/* 主内容区域 */
.error-content {
  position: relative;
  display: flex;
  width: 85%;
  max-width: 1000px;
  min-height: 450px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  z-index: 2;
  overflow: hidden;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 左侧装饰区域 */
.decoration-area {
  flex: 1;
  position: relative;
  background: linear-gradient(45deg, rgba(65, 133, 247, 0.1), rgba(90, 150, 248, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.tech-icon {
  position: relative;
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80px;
  color: var(--design-primary-color, #4185f7);
  animation: pulse 2s ease-in-out infinite;
}

.icon-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(65, 133, 247, 0.3) 0%, transparent 70%);
  animation: glow 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes glow {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.building-text {
  position: absolute;
  bottom: 30px;
  font-size: 60px;
  font-weight: bold;
  color: rgba(65, 133, 247, 0.1);
  letter-spacing: 10px;
}

/* 右侧信息区域 */
.info-area {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 50px 40px;
}

/* 标题 */
.error-header {
  margin-bottom: 30px;
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 15px 0;
  text-shadow: 0 0 20px rgba(65, 133, 247, 0.4);
}

.error-divider {
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, var(--design-primary-color, #4185f7), transparent);
  border-radius: 2px;
}

/* 描述 */
.error-description {
  margin-bottom: 30px;
}

.error-message {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 10px 0;
  line-height: 1.6;
}

.error-submessage {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.6;
}

/* 进度区域 */
.progress-area {
  display: flex;
  gap: 20px;
  margin-bottom: 35px;
}

.progress-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.progress-icon {
  font-size: 24px;
  color: var(--design-primary-color, #4185f7);
}

.progress-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.progress-value {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

/* 操作按钮 */
.error-actions {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
}

.tech-btn {
  position: relative;
  flex: 1;
  height: 48px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.tech-btn-primary {
  background: linear-gradient(45deg, var(--design-primary-color, #4185f7), #2d5fd9);
  color: #ffffff;
  box-shadow: 0 8px 20px rgba(65, 133, 247, 0.3);
}

.tech-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(65, 133, 247, 0.4);
}

.tech-btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.tech-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(65, 133, 247, 0.5);
}

.btn-icon {
  font-size: 18px;
}

.btn-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.tech-btn-primary:hover .btn-glow {
  left: 100%;
}

/* 底部信息 */
.error-footer {
  margin-top: auto;
}

.footer-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-info i {
  color: var(--design-primary-color, #4185f7);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-content {
    flex-direction: column;
    width: 90%;
    min-height: auto;
  }

  .decoration-area {
    padding: 40px 20px;
    min-height: 200px;
  }

  .building-text {
    font-size: 40px;
  }

  .info-area {
    padding: 30px 25px;
  }

  .error-title {
    font-size: 26px;
  }

  .progress-area {
    flex-direction: column;
  }

  .error-actions {
    flex-direction: column;
  }
}
</style>

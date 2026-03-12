<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserInfoStore } from '@/stores'

const router = useRouter()
const userInfoStore = useUserInfoStore()

// 返回首页
const goHome = () => {
  router.push('/')
}

// 重新登录
const reLogin = () => {
  // 清除用户信息和 token
  userInfoStore.clearUserInfo()
  localStorage.removeItem('taihang-auth')
  localStorage.removeItem('adminToken')

  // 跳转到登录页
  router.push('/login')
}

// 粒子样式生成
const particleCount = 40
const particles = ref<Array<{ id: number; style: Record<string, string> }>>([])

// 生成粒子样式
function generateParticles() {
  const result: Array<{ id: number; style: Record<string, string> }> = []
  for (let i = 0; i < particleCount; i++) {
    result.push({
      id: i,
      style: {
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        animationDelay: Math.random() * 3 + 's',
        animationDuration: (Math.random() * 3 + 2) + 's'
      }
    })
  }
  return result
}

particles.value = generateParticles()
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
      <div class="line line-3"></div>
    </div>

    <!-- 主内容区域 -->
    <div class="error-content">
      <!-- 左侧装饰圆环 -->
      <div class="decoration-area">
        <div class="tech-circle">
          <div class="inner-circle"></div>
          <div class="core-circle"></div>
        </div>
        <div class="error-code-bg">403</div>
      </div>

      <!-- 右侧信息区域 -->
      <div class="info-area">
        <!-- 错误标题 -->
        <div class="error-header">
          <div class="error-code">403</div>
          <h1 class="error-title">访问被拒绝</h1>
          <div class="error-divider"></div>
        </div>

        <!-- 错误描述 -->
        <div class="error-description">
          <p class="error-message">
            抱歉，您没有权限访问该资源。
          </p>
          <p class="error-submessage">
            请确认您是否具有相应的权限，或联系管理员获取帮助。
          </p>
        </div>

        <!-- 可能的原因 -->
        <div class="error-reasons">
          <div class="reasons-title">可能的原因：</div>
          <ul class="reasons-list">
            <li class="reason-item">
              <i class="i-carbon-error-filled reason-icon"></i>
              您的账号权限不足
            </li>
            <li class="reason-item">
              <i class="i-carbon-time reason-icon"></i>
              登录状态已过期
            </li>
            <li class="reason-item">
              <i class="i-carbon-user-role reason-icon"></i>
              该资源需要特定角色权限
            </li>
          </ul>
        </div>

        <!-- 操作按钮 -->
        <div class="error-actions">
          <button class="tech-btn tech-btn-primary" @click="goHome">
            <i class="i-carbon-home btn-icon"></i>
            返回首页
            <div class="btn-glow"></div>
          </button>
          <button class="tech-btn tech-btn-secondary" @click="reLogin">
            <i class="i-carbon-logout btn-icon"></i>
            重新登录
          </button>
        </div>

        <!-- 底部帮助信息 -->
        <div class="error-footer">
          <div class="footer-info">
            <i class="i-carbon-information"></i>
            如有疑问，请联系系统管理员
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
  background: var(--design-primary-color, #4185F7);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--design-primary-color, #4185F7);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
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
  background: linear-gradient(90deg, transparent, var(--design-primary-color, #4185F7), transparent);
  opacity: 0.4;
}

.line-1 {
  width: 100%;
  height: 1px;
  top: 20%;
  animation: slideRight 3s ease-in-out infinite;
}

.line-2 {
  width: 1px;
  height: 100%;
  left: 30%;
  animation: slideDown 4s ease-in-out infinite;
}

.line-3 {
  width: 100%;
  height: 1px;
  bottom: 20%;
  animation: slideLeft 3.5s ease-in-out infinite;
}

@keyframes slideRight {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

@keyframes slideDown {
  0%, 100% { transform: translateY(-100%); }
  50% { transform: translateY(100%); }
}

@keyframes slideLeft {
  0%, 100% { transform: translateX(100%); }
  50% { transform: translateX(-100%); }
}

/* 主内容区域 */
.error-content {
  position: relative;
  display: flex;
  width: 85%;
  max-width: 1100px;
  min-height: 550px;
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

.tech-circle {
  width: 280px;
  height: 280px;
  border: 2px solid rgba(65, 133, 247, 0.3);
  border-radius: 50%;
  position: relative;
  animation: rotate 20s linear infinite;
}

.inner-circle {
  width: 180px;
  height: 180px;
  border: 1px solid rgba(90, 150, 248, 0.3);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: rotate 15s linear infinite reverse;
}

.core-circle {
  width: 80px;
  height: 80px;
  border: 2px solid rgba(65, 133, 247, 0.5);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(65, 133, 247, 0.1);
  box-shadow: 0 0 30px rgba(65, 133, 247, 0.3);
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-code-bg {
  position: absolute;
  font-size: 150px;
  font-weight: bold;
  color: rgba(65, 133, 247, 0.05);
  letter-spacing: 10px;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}

/* 右侧信息区域 */
.info-area {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 50px 40px;
}

/* 错误标题 */
.error-header {
  margin-bottom: 30px;
}

.error-code {
  font-size: 72px;
  font-weight: bold;
  color: var(--design-primary-color, #4185F7);
  text-shadow: 0 0 30px rgba(65, 133, 247, 0.6);
  line-height: 1;
  margin-bottom: 15px;
  animation: glitch 0.5s ease-in-out;
}

@keyframes glitch {
  0% {
    text-shadow: 0 0 30px rgba(65, 133, 247, 0.6);
  }
  50% {
    text-shadow: 2px 2px 0 rgba(255, 0, 0, 0.3), -2px -2px 0 rgba(0, 255, 255, 0.3);
  }
  100% {
    text-shadow: 0 0 30px rgba(65, 133, 247, 0.6);
  }
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
  background: linear-gradient(90deg, var(--design-primary-color, #4185F7), transparent);
  border-radius: 2px;
}

/* 错误描述 */
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

/* 可能的原因 */
.error-reasons {
  margin-bottom: 35px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.reasons-title {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 12px;
  font-weight: 500;
}

.reasons-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.reason-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  padding: 6px 0;
}

.reason-icon {
  color: var(--design-primary-color, #4185F7);
  font-size: 16px;
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
  background: linear-gradient(45deg, var(--design-primary-color, #4185F7), #2d5fd9);
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
  color: var(--design-primary-color, #4185F7);
}

/* 响应式设计 */
@media (max-width: 968px) {
  .error-content {
    flex-direction: column;
    width: 90%;
    min-height: auto;
  }

  .decoration-area {
    padding: 40px 20px;
    min-height: 250px;
  }

  .tech-circle {
    width: 200px;
    height: 200px;
  }

  .inner-circle {
    width: 130px;
    height: 130px;
  }

  .core-circle {
    width: 60px;
    height: 60px;
  }

  .error-code-bg {
    font-size: 100px;
  }

  .info-area {
    padding: 30px 25px;
  }

  .error-code {
    font-size: 56px;
  }

  .error-title {
    font-size: 26px;
  }

  .error-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .error-content {
    width: 95%;
    margin: 20px;
  }

  .info-area {
    padding: 25px 20px;
  }

  .error-code {
    font-size: 48px;
  }

  .error-title {
    font-size: 22px;
  }

  .error-reasons {
    padding: 15px;
  }

  .reason-item {
    font-size: 13px;
  }
}
</style>

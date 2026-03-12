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
</script>

<template>
  <div class="error-container">
    <!-- 主内容区域 -->
    <div class="error-content">
      <!-- 左侧装饰区域 - 极致优化：静态版本 -->
      <div class="decoration-area">
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
/* 🔥 极致优化：移除所有动态效果，保证流畅 */

/* 主容器 */
.error-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  /* 简化背景：移除渐变，使用纯色 */
  background: #0c1929;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family-base);
}

/* 主内容区域 */
.error-content {
  position: relative;
  display: flex;
  width: 85%;
  max-width: 1100px;
  min-height: 550px;
  /* 简化背景：移除 backdrop-filter，使用纯色半透明 */
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  /* 移除 box-shadow */
  z-index: 2;
  overflow: hidden;
  /* 移除入场动画 */
}

/* 左侧装饰区域 - 静态版本 */
.decoration-area {
  flex: 1;
  position: relative;
  /* 简化背景：纯色替代渐变 */
  background: rgba(65, 133, 247, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.error-code-bg {
  position: absolute;
  font-size: 150px;
  font-weight: bold;
  color: rgba(65, 133, 247, 0.08);
  letter-spacing: 10px;
  /* 移除动画 */
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
  /* 移除 text-shadow */
  line-height: 1;
  margin-bottom: 15px;
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 15px 0;
}

.error-divider {
  width: 60px;
  height: 3px;
  background: var(--design-primary-color, #4185F7);
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
  /* 简化 transition */
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.tech-btn-primary {
  background: linear-gradient(45deg, var(--design-primary-color, #4185F7), #2d5fd9);
  color: #ffffff;
}

.tech-btn-primary:hover {
  transform: translateY(-2px);
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

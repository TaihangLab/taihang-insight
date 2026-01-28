<template>
<div class="tech-login-container" id="login">
  <!-- 背景粒子效果 -->
  <div class="particles-background">
    <div class="particle" v-for="n in 50" :key="n" :style="getParticleStyle()"></div>
  </div>
  
  <!-- 主要登录区域 -->
  <div class="login-main-area">
    <!-- 左侧装饰区域 -->
    <div class="login-decoration">
      <div class="decoration-lines">
        <div class="line line-1"></div>
        <div class="line line-2"></div>
        <div class="line line-3"></div>
      </div>
      <div class="tech-circle">
        <div class="inner-circle"></div>
      </div>
    </div>
    
    <!-- 登录表单区域 -->
    <div class="login-form-container">
      <div class="login-form-wrapper">
        <!-- 标题 -->
        <div class="login-header">
          <div class="title-container">
            <div class="brand-name">
              <img src="/static/logo.png" alt="太行logo" class="brand-logo">
              <span class="brand-group">太行</span>
              <span class="brand-dot">·</span>
              <span class="brand-group">慧眼</span>
            </div>
            <div class="title-right">
              <h1 class="platform-title">太行视觉AI平台</h1>
              <p class="platform-subtitle"><span class="subtitle-highlight">洞察万象，识图于微</span></p>
            </div>
          </div>
        </div>

        <!-- 登录表单 -->
        <div class="login-form">
          <!-- 租户输入框 -->
          <div class="input-group">
            <div class="input-wrapper" :class="{'focused': tenantInputFocused}">
              <i class="input-icon i-carbon-enterprise"></i>
              <input
                link
                v-model="selectedTenant"
                placeholder="请输入租户编码"
                class="tech-input"
                @focus="tenantInputFocused = true; focusInput($event)"
                @blur="tenantInputFocused = false; blurInput($event)"
              >
              <div class="input-border"></div>
            </div>
          </div>

          <!-- 用户名输入框 -->
          <div class="input-group">
            <div class="input-wrapper">
              <i class="input-icon i-carbon-user"></i>
              <input 
                link 
                v-model="username" 
                placeholder="请输入用户名"
                class="tech-input"
                @focus="focusInput"
                @blur="blurInput"
              >
              <div class="input-border"></div>
            </div>
          </div>

          <!-- 密码输入框 -->
          <div class="input-group">
            <div class="input-wrapper">
              <i class="input-icon i-carbon-locked"></i>
              <input 
                :type="showPassword ? 'text' : 'password'"
                v-model="password" 
                placeholder="请输入密码"
                class="tech-input"
                @focus="focusInput"
                @blur="blurInput"
              >
              <i
                :class="showPassword ? 'i-carbon-view-off' : 'i-carbon-view'"
                class="password-toggle"
                @click="showPassword = !showPassword"
              ></i>
              <div class="input-border"></div>
            </div>
          </div>

          <!-- 登录按钮 -->
          <div class="login-btn-container">
            <button 
              class="tech-login-btn" 
              :class="{'loading': isLoging}"
              @click="login"
              :disabled="isLoging"
            >
              <span v-if="!isLoging">登录系统</span>
              <span v-else class="loading-text">
                <i class="i-carbon-circle-dash animate-spin"></i>
                登录中...
              </span>
              <div class="btn-glow"></div>
            </button>
          </div>
        </div>

        <!-- 底部装饰 -->
        <div class="login-footer">
          <div class="security-info">
            <i class="i-carbon-security"></i>
            <span>安全登录 · 数据加密传输</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/modules/user'
import authAPI from '@/api/auth/authAPI'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 表单数据
const isLoging = ref(false)
const showPassword = ref(false)
const username = ref('')
const password = ref('')
const selectedTenant = ref('')
const tenantInputFocused = ref(false)

// 粒子样式生成函数
function getParticleStyle() {
  return {
    left: Math.random() * 100 + '%',
    top: Math.random() * 100 + '%',
    animationDelay: Math.random() * 3 + 's',
    animationDuration: (Math.random() * 3 + 2) + 's'
  }
}

// 从本地缓存恢复租户信息
function restoreTenantFromCache(): void {
  const cachedTenant = localStorage.getItem('selectedTenant')
  if (cachedTenant) {
    selectedTenant.value = cachedTenant
  }
}

// 输入框聚焦效果
function focusInput(event: Event): void {
  const target = event.target as HTMLElement
  target.parentElement?.classList.add('focused')
}

// 输入框失焦效果
function blurInput(event: Event): void {
  const target = event.target as HTMLInputElement
  if (!target.value) {
    target.parentElement?.classList.remove('focused')
  }
}

// 回车键登录处理
function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    login()
  }
}

// 登录功能
async function login(): Promise<void> {
  if (selectedTenant.value === '') {
    ElMessage.warning({
      message: '请输入租户编码',
      showClose: true
    })
    return
  }

  if (username.value !== '' && password.value !== '') {
    isLoging.value = true

    try {
      // 调用登录 API
      const result = await authAPI.login({
        username: username.value,
        password: password.value,
        tenantCode: selectedTenant.value
      })

      if (result.code === 200) {
        // 登录成功，处理返回的数据
        const { token, adminToken, userInfo } = result.data

        // 存储token到 localStorage（与 User Store 兼容）
        localStorage.setItem('token', token)

        // 存储旧的wvp-token（兼容旧系统）
        localStorage.setItem('wvp-token', token)

        // 存储用户信息和Admin-Token
        localStorage.setItem('wvp-user', JSON.stringify(userInfo))
        localStorage.setItem('Admin-Token', adminToken)

        // 将租户信息存储到本地缓存
        localStorage.setItem('selectedTenant', selectedTenant.value)

        ElMessage.success({
          message: '登录成功',
          showClose: true
        })

        isLoging.value = false

        // 调用认证 API 获取用户权限和菜单信息
        try {
          const authInfoResult = await authAPI.getUserInfo()

          if (authInfoResult.code === 200) {
            const userData = authInfoResult.data

            // 存储用户信息到缓存
            localStorage.setItem('auth_user_info', JSON.stringify(userData))
            localStorage.setItem('auth_user_info_timestamp', Date.now().toString())

            // 存储权限码列表
            if (userData.permission_codes && userData.permission_codes.length > 0) {
              localStorage.setItem('auth_permissions', JSON.stringify(userData.permission_codes))
              localStorage.setItem('auth_permissions_timestamp', Date.now().toString())
            }

            // 存储菜单树
            if (userData.menu_tree && userData.menu_tree.length > 0) {
              localStorage.setItem('auth_menu', JSON.stringify(userData.menu_tree))
              localStorage.setItem('auth_menu_timestamp', Date.now().toString())
            }

            console.log('✅ 认证信息已加载:', {
              user: userData.user_name,
              permissions: userData.permission_codes?.length || 0,
              menuItems: userData.menu_tree?.length || 0
            })

            // 重新初始化 userStore 以加载刚刚存储的菜单数据
            userStore.initFromCache()
            console.log('✅ userStore 已重新初始化，菜单数据已加载到 store')
          }
        } catch (error) {
          console.error('加载认证信息失败:', error)
          // 即使出错，也尝试从缓存初始化 store
          userStore.initFromCache()
        }

        // 获取重定向路径（如果有）
        const redirect = (route.query.redirect as string) || '/'
        router.push(redirect)
      } else {
        // 登录失败
        ElMessage.error({
          message: result.message || '登录失败',
          showClose: true
        })
        isLoging.value = false
      }
    } catch (error) {
      console.error('登录请求失败:', error)
      ElMessage.error({
        message: '网络错误，请稍后重试',
        showClose: true
      })
      isLoging.value = false
    }
  } else {
    ElMessage.warning({
      message: '请输入用户名和密码',
      showClose: true
    })
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  restoreTenantFromCache()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/* 主容器样式 */
.tech-login-container {
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

/* 粒子背景效果 */
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
  background: var(--primary-color);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--primary-color);
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

/* 主登录区域 */
.login-main-area {
  position: relative;
  display: flex;
  width: 90%;
  max-width: 1200px;
  height: 600px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  z-index: 2;
  overflow: hidden;
}

/* 左侧装饰区域 */
.login-decoration {
  flex: 1;
  position: relative;
  background: linear-gradient(45deg, rgba(65, 133, 247, 0.1), rgba(90, 150, 248, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.decoration-lines {
  position: absolute;
  width: 100%;
  height: 100%;
}

.line {
  position: absolute;
  background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
  opacity: 0.6;
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

.tech-circle {
  width: 300px;
  height: 300px;
  border: 2px solid rgba(65, 133, 247, 0.3);
  border-radius: 50%;
  position: relative;
  animation: rotate 20s linear infinite;
}

.inner-circle {
  width: 200px;
  height: 200px;
  border: 1px solid rgba(90, 150, 248, 0.3);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: rotate 15s linear infinite reverse;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 登录表单容器 */
.login-form-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-form-wrapper {
  width: 100%;
  max-width: 400px;
}

/* 登录头部 */
.login-header {
  text-align: center;
  margin-bottom: 40px;
}



.title-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  margin-top: 10px;
}

.brand-name {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  text-shadow: 0 0 15px rgba(65, 133, 247, 0.6);
  border-right: 3px solid rgba(65, 133, 247, 0.4);
  padding-right: var(--spacing-sm);
  height: 70px;
  gap: 4px;
}

.brand-logo {
  width: 50px;
  height: 50px;
  object-fit: contain;
  margin-right: var(--spacing-xs);
  filter: drop-shadow(0 0 10px rgba(65, 133, 247, 0.5));
  transition: all var(--transition-base);
}

.brand-logo:hover {
  filter: drop-shadow(0 0 15px rgba(65, 133, 247, 0.8));
  transform: scale(1.05);
}

.brand-name .brand-group {
  writing-mode: vertical-lr;
  text-orientation: upright;
  letter-spacing: 1px;
  line-height: 1;
}

.brand-name .brand-dot {
  font-size: var(--font-size-xs);
  color: var(--primary-color);
  text-shadow: 0 0 15px rgba(65, 133, 247, 0.8);
  margin: 0;
  line-height: 1;
  align-self: center;
  width: 12px;
  text-align: center;
}

.title-right {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}

.platform-title {
  font-size: 28px;
  font-weight: var(--font-weight-semibold);
  color: #ffffff;
  margin: 0;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(65, 133, 247, 0.5);
}

.platform-subtitle {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  letter-spacing: 0.5px;
  text-shadow: 0 0 10px rgba(65, 133, 247, 0.3);
}

.subtitle-highlight {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--primary-color);
  text-shadow: 0 0 15px rgba(65, 133, 247, 0.6);
}

/* 表单样式 */
.login-form {
  width: 100%;
}

.input-group {
  margin-bottom: var(--spacing-lg);
}

.input-wrapper {
  position: relative;
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--input-border-radius);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all var(--transition-base);
  overflow: hidden;
}

.input-wrapper:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(65, 133, 247, 0.3);
}

.input-wrapper.focused {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--primary-color);
  box-shadow: 0 0 20px rgba(65, 133, 247, 0.3);
}

.input-icon {
  position: absolute;
  left: var(--spacing-base);
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-size-base);
  transition: color var(--transition-base);
  z-index: 2;
}

.input-wrapper.focused .input-icon {
  color: var(--primary-color);
}

.tech-input, .tech-select {
  width: 100%;
  height: var(--button-height-md);
  padding: 0 50px 0 45px;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: var(--font-size-base);
  font-family: var(--font-family-base);
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.tech-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.tech-select {
  cursor: pointer;
  padding-right: 45px;
}

.tech-select option {
  background-color: #1a1a2e;
  color: #ffffff;
  padding: 10px;
}

.tech-select option:hover {
  background-color: rgba(0, 212, 255, 0.2);
}



.select-arrow {
  position: absolute;
  right: var(--spacing-base);
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-size-sm);
  pointer-events: none;
  transition: color var(--transition-base), transform var(--transition-base);
  z-index: 2;
}

.input-wrapper.focused .select-arrow {
  color: var(--primary-color);
  transform: translateY(-50%) rotate(180deg);
}

.password-toggle {
  position: absolute;
  right: var(--spacing-base);
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: color var(--transition-base);
  z-index: 2;
}

.password-toggle:hover {
  color: var(--primary-color);
}

.input-border {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-color-hover));
  transition: width var(--transition-base);
}

.input-wrapper.focused .input-border {
  width: 100%;
}

/* 登录按钮 */
.login-btn-container {
  margin-top: var(--spacing-xl);
}

.tech-login-btn {
  position: relative;
  width: 100%;
  height: var(--button-height-lg);
  background: linear-gradient(45deg, var(--primary-color), var(--primary-color-hover));
  border: none;
  border-radius: var(--button-border-radius);
  color: #ffffff;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  overflow: hidden;
  transition: all var(--transition-base);
  box-shadow: 0 10px 30px rgba(65, 133, 247, 0.3);
}

.tech-login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(65, 133, 247, 0.4);
}

.tech-login-btn:active {
  transform: translateY(0);
}

.tech-login-btn.loading {
  pointer-events: none;
  opacity: 0.8;
}

.btn-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left var(--transition-slow);
}

.tech-login-btn:hover .btn-glow {
  left: 100%;
}

.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

/* 底部信息 */
.login-footer {
  margin-top: 30px;
  text-align: center;
}

.security-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-size-sm);
}

.security-info i {
  color: var(--primary-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-main-area {
    flex-direction: column;
    width: 95%;
    height: auto;
    min-height: 600px;
  }
  
  .login-decoration {
    display: none;
  }
  
  .login-form-container {
    padding: 30px 20px;
  }
  
  .title-container {
    flex-direction: column;
    gap: 15px;
  }
  
  .brand-name {
    flex-direction: row;
    border-right: none;
    border-bottom: 3px solid rgba(65, 133, 247, 0.4);
    padding-right: 0;
    padding-bottom: var(--spacing-xs);
    height: auto;
    width: 100%;
    justify-content: center;
    gap: 6px;
  }
  
  .brand-logo {
    width: 40px;
    height: 40px;
    margin-right: 6px;
  }
  
  .platform-title {
    font-size: 24px;
  }
  
  .tech-circle {
    width: 200px;
    height: 200px;
  }
  
  .inner-circle {
    width: 120px;
    height: 120px;
  }
}

@media (max-width: 480px) {
  .login-main-area {
    margin: 20px;
    width: calc(100% - 40px);
  }
  
  .platform-title {
    font-size: 20px;
  }
  
  .login-form-container {
    padding: 20px 15px;
  }
}
</style>


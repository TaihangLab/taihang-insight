<template>
<div class="tech-login-container" id="login">
  <!-- 主要登录区域 -->
  <div class="login-main-area">
    <!-- 左侧装饰区域 - 极致优化：移除所有动画 -->
    <div class="login-decoration">
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
import { useUserInfoStore } from '@/stores/modules/userInfo'
import { usePermissionsStore } from '@/stores/modules/permissions'
import { useMenusStore } from '@/stores/modules/menus'
import { logout, isLoggedIn } from '@/stores/modules/auth'
import authAPI from '@/api/auth/authAPI'
import storage from '@/stores/modules/storage'
import { setupAsyncRoutes, resetAsyncRoutes } from '@/router'

const router = useRouter()
const route = useRoute()

// 使用 stores（登录成功后设置数据）
const userInfoStore = useUserInfoStore()
const permissionsStore = usePermissionsStore()
const menusStore = useMenusStore()

// 表单数据
const isLoging = ref(false)
const showPassword = ref(false)
const username = ref('')
const password = ref('')
const selectedTenant = ref('')
const tenantInputFocused = ref(false)

// 从本地缓存恢复租户信息
function restoreTenantFromCache(): void {
  const cachedTenant = storage.getSelectedTenant()
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
  // 先检查租户编码
  if (selectedTenant.value === '') {
    ElMessage.warning({
      message: '请输入租户编码',
      showClose: true
    })
    return
  }

  // 精确的表单验证：分别提示缺失的字段
  if (username.value === '') {
    ElMessage.warning({
      message: '请输入用户名',
      showClose: true
    })
    return
  }

  if (password.value === '') {
    ElMessage.warning({
      message: '请输入密码',
      showClose: true
    })
    return
  }

  // 所有字段都已填写，执行登录
  isLoging.value = true

  try {
    // 调用登录 API
    const result = await authAPI.login({
      username: username.value,
      password: password.value,
      tenant_id: selectedTenant.value  // 后端期望蛇形命名
    })

    if (result.code === 200) {
      // 登录成功，处理返回的数据
      const { token, adminToken, userInfo } = result.data

      // 【关键】通过 Pinia Store 设置 token，触发持久化插件
      storage.setAdminToken(adminToken)

      // 存储租户信息用于下次登录自动填充
      storage.setSelectedTenant(selectedTenant.value)

      ElMessage.success({
        message: '登录成功',
        showClose: true
      })

      isLoging.value = false

      // 调用认证 API 获取用户权限和菜单信息
      // 使用 Store 的 refresh 方法，将 API 调用和缓存逻辑封装在 Store 内部
      try {
        // 1️⃣ 重置动态路由标记（清除之前的路由状态）
        resetAsyncRoutes()

        // 2️⃣ 并行刷新所有认证数据：用户信息、权限列表、菜单树
        await Promise.all([
          userInfoStore.refresh(),
          permissionsStore.refresh(),
          menusStore.refresh()
        ])

        // 3️⃣ 根据菜单树重新建立动态路由
        const menuTree = menusStore.getMenuTreeSync() || []
        if (menuTree.length > 0) {
          setupAsyncRoutes(menuTree)
        }

      } catch (error: any) {
        console.error('加载认证信息失败:', error)

        // 🔥 处理 403 错误：权限不足，清除认证数据并提示用户
        if (error?.status === 403) {
          // 使用统一的 logout 函数清除所有认证数据
          await logout()

          isLoging.value = false
          ElMessage.error({
            message: '登录成功，但获取权限信息失败。可能是因为您的账号权限配置有问题，请联系管理员',
            duration: 5000,
            showClose: true
          })
          return
        }

        // 其他错误：显示警告，但允许继续跳转
        ElMessage.warning({
          message: '获取用户信息失败，但已成功登录。部分功能可能不可用',
          showClose: true
        })
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
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  restoreTenantFromCache()

  // 检查是否已登录，使用统一的 isLoggedIn 函数
  if (isLoggedIn()) {
    // 从 Store 获取菜单树（已通过持久化插件恢复）
    const menuTree = menusStore.getMenuTreeSync() || []

    if (menuTree.length > 0) {
      // 已登录且有菜单，重定向到用户有权限的第一个页面
      const firstMenuPath = findFirstAccessibleMenu(menuTree)
      const targetPath = (route.query.redirect as string) || firstMenuPath || '/visualCenter'
      router.replace(targetPath)
    }
  }
})

/**
 * 从菜单树中查找第一个可访问的菜单路径
 */
function findFirstAccessibleMenu(menuItems: any[]): string | null {
  function search(items: any[]): string | null {
    for (const item of items) {
      if (item.path && item.menu_type === 'menu') {
        return item.path
      }
      if (item.children?.length) {
        const found = search(item.children)
        if (found) return found
      }
    }
    return null
  }
  return search(menuItems)
}

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/* 🔥 极致优化：移除所有动态效果，保证流畅 */

/* 主容器样式 */
.tech-login-container {
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

/* 主登录区域 */
.login-main-area {
  position: relative;
  display: flex;
  width: 90%;
  max-width: 1200px;
  height: 600px;
  /* 简化背景：移除 backdrop-filter，使用纯色半透明 */
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  /* 移除 box-shadow */
  z-index: 2;
  overflow: hidden;
}

/* 左侧装饰区域 - 静态版本，无动画 */
.login-decoration {
  flex: 1;
  position: relative;
  /* 简化背景：纯色替代渐变 */
  background: rgba(65, 133, 247, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.tech-circle {
  width: 300px;
  height: 300px;
  border: 2px solid rgba(65, 133, 247, 0.25);
  border-radius: 50%;
  position: relative;
  /* 移除动画：静态圆环 */
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
  /* 移除动画：静态圆环 */
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
  /* 移除 text-shadow */
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
  /* 移除 filter */
  transition: transform 0.3s ease;
}

.brand-logo:hover {
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
  /* 移除 text-shadow */
}

.platform-subtitle {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  letter-spacing: 0.5px;
}

.subtitle-highlight {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--primary-color);
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
  /* 使用 transform 替代其他属性以获得更好性能 */
  transition: border-color 0.2s ease, background-color 0.2s ease;
  overflow: hidden;
}

.input-wrapper:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(65, 133, 247, 0.3);
}

.input-wrapper.focused {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--primary-color);
}

.input-icon {
  position: absolute;
  left: var(--spacing-base);
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-size-base);
  transition: color 0.2s ease;
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

.password-toggle {
  position: absolute;
  right: var(--spacing-base);
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: color 0.2s ease;
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
  transition: width 0.2s ease;
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
  background: linear-gradient(45deg, #4185F7, #2d5fd9);
  border: none;
  border-radius: var(--button-border-radius);
  color: #ffffff;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 15px rgba(65, 133, 247, 0.3);
}

.tech-login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(65, 133, 247, 0.4);
}

.tech-login-btn:active {
  transform: translateY(0);
}

.tech-login-btn.loading {
  pointer-events: none;
  opacity: 0.8;
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

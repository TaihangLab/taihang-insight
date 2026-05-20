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
          <!-- 租户下拉（启用多租户时显示；预留高度避免接口返回后布局跳动） -->
          <div class="input-group tenant-group" v-if="showTenantField">
            <div class="input-wrapper" :class="{ focused: tenantFocused, 'tenant-loading': tenantLoading && !tenantOptions.length }">
              <i class="input-icon fa fa-building"></i>
              <select
                v-model="tenantId"
                class="tech-input tech-select"
                :disabled="tenantLoading && !tenantOptions.length"
                @focus="tenantFocused = true"
                @blur="tenantFocused = false"
              >
                <option v-if="tenantLoading && !tenantOptions.length" disabled value="">加载租户列表...</option>
                <option v-for="opt in tenantOptions" :key="opt.tenantId" :value="opt.tenantId">
                  {{ opt.companyName }}（{{ opt.tenantId }}）
                </option>
              </select>
              <i class="select-arrow fa fa-chevron-down"></i>
              <div class="input-border"></div>
            </div>
          </div>

          <!-- 用户名输入框 -->
          <div class="input-group">
            <div class="input-wrapper">
              <i class="input-icon fa fa-user"></i>
              <input 
                type="text" 
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
              <i class="input-icon fa fa-lock"></i>
              <input 
                :type="showPassword ? 'text' : 'password'"
                v-model="password" 
                placeholder="请输入密码"
                class="tech-input"
                @focus="focusInput"
                @blur="blurInput"
              >
              <i 
                :class="'password-toggle fa ' + (showPassword ? 'fa-eye-slash' : 'fa-eye')"
                @click="showPassword = !showPassword"
              ></i>
              <div class="input-border"></div>
            </div>
          </div>

          <!-- 验证码 -->
          <div class="input-group captcha-row" v-if="captchaEnabled">
            <div class="input-wrapper captcha-input">
              <i class="input-icon fa fa-shield"></i>
              <input
                type="text"
                v-model="captchaCode"
                placeholder="请输入验证码"
                class="tech-input"
                maxlength="6"
              >
              <div class="input-border"></div>
            </div>
            <img
              v-if="captchaImg"
              :src="captchaImg"
              class="captcha-image"
              alt="验证码"
              @click="refreshCaptcha"
              title="点击刷新"
            >
          </div>

          <!-- 登录按钮 -->
          <div class="login-btn-container">
            <button 
              class="tech-login-btn" 
              :class="{'loading': isLoging}"
              @click="doLogin"
              :disabled="isLoging"
            >
              <span v-if="!isLoging">登录系统</span>
              <span v-else class="loading-text">
                <i class="fa fa-spinner fa-spin"></i>
                登录中...
              </span>
              <div class="btn-glow"></div>
            </button>
          </div>

          <!-- 注册入口 -->
          <div class="register-link">
            <router-link to="/register">还没有账号？立即注册</router-link>
          </div>
        </div>

        <!-- 底部装饰 -->
        <div class="login-footer">
          <div class="security-info">
            <i class="fa fa-shield"></i>
            <span>安全登录 · 数据加密传输</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { getLoginBootstrap } from '@/api/auth'
import {
  readLoginBootstrapCache,
  prefetchLoginBootstrap,
  refreshLoginBootstrap,
  resolveDefaultTenantId
} from '@/utils/loginBootstrap'

export default {
  name: 'Login',
  data(){
    return {
      isLoging: false,
      showPassword: false,
      username: '',
      password: '',
      captchaEnabled: true,
      captchaCode: '',
      captchaUuid: '',
      captchaImg: '',
      redirect: '/',
      tenantEnabled: false,
      tenantOptions: [],
      tenantId: '',
      tenantFocused: false,
      tenantLoading: false
    }
  },
  computed: {
    showTenantField () {
      return this.tenantLoading || (this.tenantEnabled && this.tenantOptions.length > 0)
    }
  },
  created(){
    const that = this;
    document.onkeydown = function(e) {
      const key = window.event.keyCode;
      if (key === 13) {
        that.doLogin();
      }
    }
    this.redirect = (this.$route && this.$route.query && this.$route.query.redirect) || '/';
    this.initLoginPage();
  },
  methods:{
    getParticleStyle() {
      return {
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        animationDelay: Math.random() * 3 + 's',
        animationDuration: (Math.random() * 3 + 2) + 's'
      }
    },

    initLoginPage () {
      const cached = readLoginBootstrapCache()
      if (cached) {
        this.applyBootstrap(cached)
      } else {
        this.tenantLoading = true
      }
      prefetchLoginBootstrap()
        .then((data) => {
          if (data) this.applyBootstrap(data)
        })
        .finally(() => {
          this.tenantLoading = false
        })
    },

    applyBootstrap (data) {
      if (!data) return
      this.captchaEnabled = !!data.captchaEnabled
      this.captchaUuid = data.uuid || ''
      this.captchaImg = data.img ? `data:image/png;base64,${data.img}` : ''
      this.tenantEnabled = !!data.tenantEnabled
      const list = Array.isArray(data.voList) ? data.voList : []
      this.tenantOptions = list
      if (this.tenantEnabled) {
        const nextId = resolveDefaultTenantId(list)
        if (!this.tenantId || !list.some((t) => t.tenantId === this.tenantId)) {
          this.tenantId = nextId
        }
      }
    },

    refreshCaptcha () {
      refreshLoginBootstrap().then((data) => {
        if (data) this.applyBootstrap(data)
      }).catch(() => {
        this.captchaEnabled = false
      })
    },

    focusInput(event) {
      event.target.parentElement.classList.add('focused');
    },

    blurInput(event) {
      if (!event.target.value) {
        event.target.parentElement.classList.remove('focused');
      }
    },

    doLogin(){
      if (!this.username || !this.password) {
        this.$message({ showClose: true, message: '请输入用户名和密码', type: 'warning' });
        return;
      }
      if (this.captchaEnabled && !this.captchaCode) {
        this.$message({ showClose: true, message: '请输入验证码', type: 'warning' });
        return;
      }
      this.isLoging = true;
      this.$store.dispatch('Login', {
        username: this.username,
        password: this.password,
        code: this.captchaCode,
        uuid: this.captchaUuid,
        tenantId: this.tenantEnabled ? (this.tenantId || '000000') : ''
      }).then(() => Promise.all([
        this.$store.dispatch('GetInfo'),
        this.$store.dispatch('GenerateRoutes')
      ])).then(() => {
        this.$message({ showClose: true, message: '登录成功', type: 'success' });
        this.$router.push(this.redirect || '/');
      }).catch(err => {
        console.error('登录失败', err);
        this.refreshCaptcha();
      }).finally(() => {
        this.isLoging = false;
      });
    }
  }
}
</script>

<style scoped>
/* 引入Font Awesome图标字体 */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

/* 主容器样式 */
.tech-login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
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
  background: #00d4ff;
  border-radius: 50%;
  box-shadow: 0 0 10px #00d4ff;
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
  background: linear-gradient(45deg, rgba(0, 212, 255, 0.1), rgba(183, 33, 255, 0.1));
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
  background: linear-gradient(90deg, transparent, #00d4ff, transparent);
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
  border: 2px solid rgba(0, 212, 255, 0.3);
  border-radius: 50%;
  position: relative;
  animation: rotate 20s linear infinite;
}

.inner-circle {
  width: 200px;
  height: 200px;
  border: 1px solid rgba(183, 33, 255, 0.3);
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
  color: #00d4ff;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 0 15px rgba(0, 212, 255, 0.6);
  border-right: 3px solid rgba(0, 212, 255, 0.4);
  padding-right: 12px;
  height: 70px;
  gap: 4px;
}

.brand-logo {
  width: 50px;
  height: 50px;
  object-fit: contain;
  margin-right: 8px;
  filter: drop-shadow(0 0 10px rgba(0, 212, 255, 0.5));
  transition: all 0.3s ease;
}

.brand-logo:hover {
  filter: drop-shadow(0 0 15px rgba(0, 212, 255, 0.8));
  transform: scale(1.05);
}

.brand-name .brand-group {
  writing-mode: vertical-lr;
  text-orientation: upright;
  letter-spacing: 1px;
  line-height: 1;
}

.brand-name .brand-dot {
  font-size: 12px;
  color: #00BFFF;
  text-shadow: 0 0 15px rgba(0, 191, 255, 0.8);
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
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
}

.platform-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  letter-spacing: 0.5px;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
}

.subtitle-highlight {
  font-size: 16px;
  font-weight: 500;
  color: #00d4ff;
  text-shadow: 0 0 15px rgba(0, 212, 255, 0.6);
}

/* 表单样式 */
.login-form {
  width: 100%;
}

.input-group {
  margin-bottom: 25px;
}

.tenant-group {
  min-height: 55px;
}

.input-wrapper.tenant-loading .tech-select {
  color: rgba(255, 255, 255, 0.45);
}

.input-wrapper {
  position: relative;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
}

.input-wrapper:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(0, 212, 255, 0.3);
}

.input-wrapper.focused {
  background: rgba(255, 255, 255, 0.15);
  border-color: #00d4ff;
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.input-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  transition: color 0.3s ease;
  z-index: 2;
}

.input-wrapper.focused .input-icon {
  color: #00d4ff;
}

.tech-input, .tech-select {
  width: 100%;
  height: 55px;
  padding: 0 50px 0 45px;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 16px;
  font-family: inherit;
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
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  pointer-events: none;
  transition: color 0.3s ease, transform 0.3s ease;
  z-index: 2;
}

.input-wrapper.focused .select-arrow {
  color: #00d4ff;
  transform: translateY(-50%) rotate(180deg);
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  cursor: pointer;
  transition: color 0.3s ease;
  z-index: 2;
}

.password-toggle:hover {
  color: #00d4ff;
}

.input-border {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #00d4ff, #b721ff);
  transition: width 0.3s ease;
}

.input-wrapper.focused .input-border {
  width: 100%;
}

/* 登录按钮 */
.login-btn-container {
  margin-top: 35px;
}

.tech-login-btn {
  position: relative;
  width: 100%;
  height: 55px;
  background: linear-gradient(45deg, #00d4ff, #b721ff);
  border: none;
  border-radius: 12px;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(0, 212, 255, 0.3);
}

.tech-login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px rgba(0, 212, 255, 0.4);
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
  transition: left 0.5s ease;
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

/* 验证码 */
.captcha-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.captcha-input {
  flex: 1;
}
.captcha-image {
  width: 120px;
  height: 55px;
  border-radius: 8px;
  cursor: pointer;
  background: #fff;
  object-fit: contain;
  border: 1px solid rgba(0, 212, 255, 0.3);
}

/* 注册入口 */
.register-link {
  margin-top: 18px;
  text-align: center;
}
.register-link a {
  color: rgba(0, 212, 255, 0.9);
  font-size: 13px;
  text-decoration: none;
}
.register-link a:hover {
  color: #00d4ff;
  text-decoration: underline;
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
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.security-info i {
  color: #00d4ff;
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
    border-bottom: 3px solid rgba(0, 212, 255, 0.4);
    padding-right: 0;
    padding-bottom: 8px;
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


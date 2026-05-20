<template>
  <div class="tech-register-container" id="register">
    <div class="register-main-area">
      <div class="register-form-wrapper">
        <div class="register-header">
          <div class="title-container">
            <div class="brand-name">
              <img src="/static/logo.png" alt="太行logo" class="brand-logo">
              <span class="brand-group">太行</span>
              <span class="brand-dot">·</span>
              <span class="brand-group">慧眼</span>
            </div>
            <div class="title-right">
              <h1 class="platform-title">账号注册</h1>
              <p class="platform-subtitle"><span class="subtitle-highlight">创建你的太行视觉AI账号</span></p>
            </div>
          </div>
        </div>

        <el-form ref="registerForm" :model="form" :rules="rules" label-width="0" class="register-form">
          <el-form-item v-if="showTenantField" prop="tenantId">
            <el-select
              v-model="form.tenantId"
              placeholder="请选择租户"
              style="width:100%"
              filterable
              :loading="tenantLoading && !tenantOptions.length"
            >
              <el-option v-for="opt in tenantOptions" :key="opt.tenantId" :label="opt.companyName + '（' + opt.tenantId + '）'" :value="opt.tenantId"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="登录账号 (2-64 字符)" maxlength="64" prefix-icon="el-icon-user"/>
          </el-form-item>
          <el-form-item prop="nickName">
            <el-input v-model="form.nickName" placeholder="昵称（可选）" maxlength="64" prefix-icon="el-icon-edit"/>
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="密码 (8-20 位，字母+数字+特殊字符)" maxlength="20" show-password prefix-icon="el-icon-lock"/>
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" placeholder="确认密码" maxlength="64" show-password prefix-icon="el-icon-lock"/>
          </el-form-item>
          <el-form-item prop="email">
            <el-input v-model="form.email" placeholder="邮箱（可选）" maxlength="128" prefix-icon="el-icon-message"/>
          </el-form-item>
          <el-form-item prop="phonenumber">
            <el-input v-model="form.phonenumber" placeholder="手机号（可选）" maxlength="20" prefix-icon="el-icon-phone-outline"/>
          </el-form-item>
          <el-form-item v-if="captchaEnabled" prop="code">
            <div class="captcha-row">
              <el-input v-model="form.code" placeholder="验证码" maxlength="6" prefix-icon="el-icon-key"/>
              <img v-if="captchaImg" :src="captchaImg" class="captcha-image" alt="验证码" @click="refreshCaptcha" title="点击刷新">
            </div>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="isLoading" style="width:100%" @click="doRegister">立即注册</el-button>
          </el-form-item>
          <el-form-item>
            <div class="login-link">
              <router-link to="/login">已有账号？返回登录</router-link>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { getLoginBootstrap, register as registerApi } from '@/api/auth'
import {
  readLoginBootstrapCache,
  prefetchLoginBootstrap,
  refreshLoginBootstrap,
  resolveDefaultTenantId
} from '@/utils/loginBootstrap'

export default {
  name: 'Register',
  data () {
    const confirmValidator = (rule, value, cb) => {
      if (value === '') return cb(new Error('请再次输入密码'))
      if (value !== this.form.password) return cb(new Error('两次输入的密码不一致'))
      cb()
    }
    return {
      isLoading: false,
      captchaEnabled: true,
      captchaImg: '',
      tenantEnabled: false,
      tenantOptions: [],
      tenantLoading: false,
      form: {
        tenantId: '',
        username: '',
        nickName: '',
        password: '',
        confirmPassword: '',
        email: '',
        phonenumber: '',
        code: '',
        uuid: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入账号', trigger: 'blur' },
          { min: 2, max: 64, message: '账号长度 2-64 字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          {
            pattern: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[~!@#$%^&*()_+`\-={}:";'<>?,.\/]).{8,20}$/,
            message: '密码长度 8-20 位，必须同时包含字母、数字和特殊字符',
            trigger: 'blur'
          }
        ],
        confirmPassword: [
          { required: true, validator: confirmValidator, trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入验证码', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    showTenantField () {
      return this.tenantLoading || (this.tenantEnabled && this.tenantOptions.length > 0)
    }
  },
  created () {
    this.initRegisterPage()
  },
  methods: {
    initRegisterPage () {
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
      this.form.uuid = data.uuid || ''
      this.captchaImg = data.img ? `data:image/png;base64,${data.img}` : ''
      this.tenantEnabled = !!data.tenantEnabled
      const list = Array.isArray(data.voList) ? data.voList : []
      this.tenantOptions = list
      if (this.tenantEnabled) {
        const nextId = resolveDefaultTenantId(list)
        if (!this.form.tenantId || !list.some((t) => t.tenantId === this.form.tenantId)) {
          this.form.tenantId = nextId
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
    doRegister () {
      this.$refs.registerForm.validate(valid => {
        if (!valid) return
        this.isLoading = true
        registerApi({
          username: this.form.username.trim(),
          password: this.form.password,
          nickName: this.form.nickName || undefined,
          email: this.form.email || undefined,
          phonenumber: this.form.phonenumber || undefined,
          code: this.form.code,
          uuid: this.form.uuid,
          tenantId: this.tenantEnabled ? (this.form.tenantId || '000000') : undefined
        }).then(() => {
          this.$message({ message: '注册成功，请登录', type: 'success' })
          this.$router.push('/login')
        }).catch(() => {
          this.refreshCaptcha()
        }).finally(() => {
          this.isLoading = false
        })
      })
    }
  }
}
</script>

<style scoped>
.tech-register-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.register-main-area {
  width: 480px;
  padding: 32px 40px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}
.register-form-wrapper { color: #ffffff; }
.register-header { margin-bottom: 24px; text-align: center; }
.title-container { display: flex; align-items: center; gap: 16px; justify-content: center; }
.brand-name { display: flex; align-items: center; gap: 4px; color: #00d4ff; font-size: 16px; }
.brand-logo { width: 36px; height: 36px; }
.brand-group { writing-mode: vertical-lr; text-orientation: upright; }
.platform-title { margin: 0; color: #ffffff; font-size: 22px; }
.platform-subtitle { margin: 4px 0 0; font-size: 12px; color: rgba(255,255,255,0.6); }
.subtitle-highlight { color: #00d4ff; }
.register-form >>> .el-input__inner {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.1);
  color: #ffffff;
}
.register-form >>> .el-input__inner::placeholder {
  color: rgba(255,255,255,0.5);
}
.captcha-row { display: flex; align-items: center; gap: 12px; }
.captcha-image {
  width: 120px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  background: #fff;
  object-fit: contain;
  border: 1px solid rgba(0, 212, 255, 0.3);
}
.login-link { text-align: center; width: 100%; }
.login-link a { color: rgba(0,212,255,0.9); font-size: 13px; text-decoration: none; }
.login-link a:hover { color: #00d4ff; text-decoration: underline; }
</style>

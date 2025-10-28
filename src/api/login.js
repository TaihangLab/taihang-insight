import request from '@/utils/request'

// 用户登录
export function login(username, password, code, uuid) {
  const params = new URLSearchParams()
  params.append('username', username)
  params.append('password', password)
  params.append('code', code || '1234')
  params.append('uuid', uuid || 'test-uuid')
  
  return request({
    url: '/auth/login',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      isToken: false
    },
    method: 'post',
    data: params
  })
}

// 用户注册
export function register(data) {
  return request({
    url: '/auth/register',
    headers: {
      isToken: false
    },
    method: 'post',
    data: data
  })
}

// 获取用户详细信息
export function getInfo() {
  return request({
    url: '/auth/userinfo',
    method: 'get'
  })
}

// 退出方法
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

// 获取验证码
export function getCodeImg() {
  return request({
    url: '/auth/captcha',
    headers: {
      isToken: false
    },
    method: 'get',
    timeout: 20000
  })
}

// 刷新令牌
export function refreshToken() {
  return request({
    url: '/auth/refresh',
    method: 'post'
  })
}

// 测试认证
export function testAuth() {
  return request({
    url: '/auth/test',
    method: 'get'
  })
}

/**
 * 统一的axios请求封装
 * 参考若依框架设计
 */
import axios from 'axios'
import { Message, MessageBox } from 'element-ui'
import router from '@/router'
import userService from '@/components/service/UserService'

const config = require('../../config/index.js')

// 创建axios实例
const service = axios.create({
  baseURL: config.API_BASE_URL,
  withCredentials: false,
  timeout: 30000
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = userService.getAdminToken();
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 是否正在刷新token的标志
let isRefreshing = false

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data

    if (response.config.responseType === 'blob') {
      return response
    }

    if (response.status === 200) {
      if (res.code === 0 || res.code === 200 || res.code === undefined) {
        return response
      }

      if (res.code === 401) {
        if (!isRefreshing) {
          isRefreshing = true
          MessageBox.confirm('登录状态已过期，请重新登录', '系统提示', {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            userService.clearToken()
            router.push('/login')
          }).catch(() => {
            // 用户取消
          }).finally(() => {
            isRefreshing = false
          })
        }
      } else {
        Message({
          message: res.msg || res.message || '请求失败',
          type: 'error',
          duration: 3 * 1000
        })
      }
      return Promise.reject(new Error(res.msg || res.message || '请求失败'))
    }

    return response
  },
  error => {
    console.error('响应错误:', error)

    let message = '请求失败'
    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          if (!isRefreshing) {
            isRefreshing = true
            setTimeout(() => {
              userService.clearToken()
              router.push('/login')
              isRefreshing = false
            }, 1500)
          }
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求地址不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        case 504:
          message = '网关超时'
          break
        default:
          message = `连接错误${error.response.status}`
      }
    } else if (error.message) {
      if (error.message.includes('timeout')) {
        message = '请求超时，请检查网络连接'
      } else if (error.message.includes('Network Error')) {
        message = '网络连接异常，请检查网络'
      }
    }

    Message({
      message: message,
      type: 'error',
      duration: 3 * 1000
    })

    return Promise.reject(error)
  }
)

export default service

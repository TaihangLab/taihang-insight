/**
 * 统一的axios请求封装
 * 参考若依框架设计
 */
import axios from 'axios'
import { Message, MessageBox } from 'element-ui'
import router from '@/router'
import userService from '@/components/service/UserService'

// 创建axios实例
const service = axios.create({
  baseURL: (process.env.NODE_ENV === 'development') ? process.env.BASE_API : (window.baseUrl ? window.baseUrl : ""),
  withCredentials: true, // 跨域请求时发送cookies
  timeout: 30000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从userService获取token（如果存在）
    const token = userService.getToken()
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token
    }
    
    // 可以根据需要添加其他请求头
    // config.headers['X-Requested-With'] = 'XMLHttpRequest'
    
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 是否正在刷新token的标志
let isRefreshing = false
// 存储待重试的请求队列
let requestsQueue = []

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    
    // 如果是Blob类型（如文件下载、图片），直接返回
    if (response.config.responseType === 'blob') {
      return response
    }
    
    // 如果返回的状态码为200，说明接口请求成功，可以正常拿到数据
    // 否则的话抛出错误
    if (response.status === 200) {
      // 根据后端返回的code判断
      if (res.code === 0 || res.code === 200) {
        return response
      } else {
        // 业务错误处理
        if (res.code === 401) {
          // 未授权，跳转登录页
          if (!isRefreshing) {
            isRefreshing = true
            MessageBox.confirm('登录状态已过期，请重新登录', '系统提示', {
              confirmButtonText: '重新登录',
              cancelButtonText: '取消',
              type: 'warning'
            }).then(() => {
              // 清除用户信息
              userService.clearToken()
              router.push('/login')
            }).catch(() => {
              // 用户取消
            }).finally(() => {
              isRefreshing = false
            })
          }
        } else {
          // 其他错误信息提示
          Message({
            message: res.msg || res.message || '请求失败',
            type: 'error',
            duration: 3 * 1000
          })
        }
        return Promise.reject(new Error(res.msg || res.message || '请求失败'))
      }
    } else {
      return response
    }
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
          // 避免重复弹窗
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


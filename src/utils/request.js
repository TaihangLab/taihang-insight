import axios from 'axios'

let downloadLoadingInstance;
// 是否显示重新登录
export let isRelogin = { show: false };

// 设置默认请求头
axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'

// 创建axios实例
const service = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? (window.baseUrl || '') : '/api', // 开发环境使用代理路径
  timeout: 60000 // 请求超时时间
})

// request拦截器
service.interceptors.request.use(config => {
  // 是否需要设置 token
  const isToken = (config.headers || {}).isToken === false
  // 是否需要防止数据重复提交
  const isRepeatSubmit = (config.headers || {}).repeatSubmit === false
  
  if (getToken() && !isToken) {
    config.headers['Authorization'] = 'Bearer ' + getToken() // 让每个请求携带自定义token
  }
  
  // get请求映射params参数
  if (config.method === 'get' && config.params) {
    let url = config.url + '?' + tansParams(config.params);
    url = url.slice(0, -1);
    config.params = {};
    config.url = url;
  }
  
  if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put')) {
    const requestObj = {
      url: config.url,
      data: typeof config.data === 'object' ? JSON.stringify(config.data) : config.data,
      time: new Date().getTime()
    }
    const requestSize = Object.keys(JSON.stringify(requestObj)).length; // 请求数据大小
    const limitSize = 5 * 1024 * 1024; // 限制存放数据5M
    if (requestSize >= limitSize) {
      console.warn(`[${config.url}]: ` + '请求数据大小超出允许的5M限制，无法进行防重复提交验证。')
      return config;
    }
    const sessionObj = cache.session.getJSON('sessionObj')
    if (sessionObj === undefined || sessionObj === null || sessionObj === '') {
      cache.session.setJSON('sessionObj', requestObj)
    } else {
      const s_url = sessionObj.url;                // 请求地址
      const s_data = sessionObj.data;              // 请求数据
      const s_time = sessionObj.time;              // 请求时间
      const interval = 1000;                       // 间隔时间(ms)，小于此时间视为重复提交
      if (s_data === requestObj.data && requestObj.time - s_time < interval && s_url === requestObj.url) {
        const message = '数据正在处理，请勿重复提交';
        console.warn(`[${s_url}]: ` + message)
        return Promise.reject(new Error(message))
      } else {
        cache.session.setJSON('sessionObj', requestObj)
      }
    }
  }
  return config
}, error => {
    console.log(error)
    return Promise.reject(error)
})

// 响应拦截器
service.interceptors.response.use(res => {
    // 未设置状态码则默认成功状态
    const code = res.data.code || 200;
    // 获取错误信息
    const msg = errorCode[code] || res.data.msg || res.data.detail || errorCode['default']
    
    // 二进制数据则直接返回
    if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
      return res.data
    }
    
    if (code === 401) {
      if (!isRelogin.show) {
        isRelogin.show = true;
        console.warn('登录状态已过期，请重新登录')
        removeToken()
        // 跳转到登录页，并保存当前页面路径
        const currentPath = window.location.hash.replace('#', '') || '/'
        setTimeout(() => {
          isRelogin.show = false;
          window.location.href = '#/login?redirect=' + encodeURIComponent(currentPath);
        }, 1000);
      }
      return Promise.reject('无效的会话，或者会话已过期，请重新登录。')
    } else if (code === 500) {
      console.error('服务器错误:', msg)
      return Promise.reject(new Error(msg))
    } else if (code === 601) {
      console.warn('警告:', msg)
      return Promise.reject(new Error(msg))
    } else if (code !== 200) {
      console.error('请求错误:', msg)
      return Promise.reject('error')
    } else {
      return Promise.resolve(res.data)
    }
  },
  error => {
    console.log('请求错误:', error)
    let { message } = error;
    if (message === "Network Error") {
      message = "后端接口连接异常";
    } else if (message.includes("timeout")) {
      message = "系统接口请求超时";
    } else if (message.includes("Request failed with status code")) {
      message = "系统接口" + message.substr(message.length - 3) + "异常";
    }
    
    return Promise.reject(error)
  }
)

// 通用下载方法
export function download(url, params, filename, config) {
  // 简化版下载，暂时不使用Loading组件
  return service.post(url, params, {
    transformRequest: [(params) => { return tansParams(params) }],
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob',
    ...config
  }).then(async (data) => {
    const isBlob = blobValidate(data);
    if (isBlob) {
      const blob = new Blob([data])
      // 简化版保存文件
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = filename
      link.click()
      window.URL.revokeObjectURL(link.href)
    } else {
      const resText = await data.text();
      const rspObj = JSON.parse(resText);
      const errMsg = errorCode[rspObj.code] || rspObj.msg || errorCode['default']
      console.error('下载失败:', errMsg);
    }
  }).catch((r) => {
    console.error('下载文件出现错误:', r)
  })
}

// 获取token
export function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

// 设置token
export function setToken(token) {
  localStorage.setItem('token', token)
}

// 移除token
export function removeToken() {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
}

// 参数处理
export function tansParams(params) {
  let result = ''
  for (const propName of Object.keys(params)) {
    const value = params[propName];
    var part = encodeURIComponent(propName) + "=";
    if (value !== null && value !== "" && typeof (value) !== "undefined") {
      if (typeof value === 'object') {
        for (const key of Object.keys(value)) {
          if (value[key] !== null && value[key] !== "" && typeof (value[key]) !== 'undefined') {
            let params = propName + '[' + key + ']';
            var subPart = encodeURIComponent(params) + "=";
            result += subPart + encodeURIComponent(value[key]) + "&";
          }
        }
      } else {
        result += part + encodeURIComponent(value) + "&";
      }
    }
  }
  return result
}

// 验证是否为blob格式
export function blobValidate(data) {
  try {
    return data instanceof Blob;
  } catch (error) {
    return false;
  }
}

// 错误代码
const errorCode = {
  '401': '认证失败，无法访问系统资源',
  '403': '当前操作没有权限',
  '404': '访问资源不存在',
  '500': '服务器内部错误',
  'default': '系统未知错误，请反馈给管理员'
}

// 简化的缓存对象
const cache = {
  session: {
    setJSON: (key, value) => {
      sessionStorage.setItem(key, JSON.stringify(value))
    },
    getJSON: (key) => {
      const value = sessionStorage.getItem(key)
      return value ? JSON.parse(value) : null
    }
  }
}

export default service

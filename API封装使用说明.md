# API 接口封装使用说明

## 概述

本项目参考若依框架的设计思想，对所有的 API 接口进行了统一封装，避免在页面组件中直接暴露 `this.$axios`，提高代码的可维护性和可读性。

## 目录结构

```
src/
├── utils/
│   └── request.js          # axios 统一封装
├── api/
│   ├── index.js            # API 统一导出
│   ├── channel.js          # 通道相关 API
│   ├── device.js           # 设备相关 API
│   ├── system.js           # 系统相关 API
│   ├── region.js           # 行政区域相关 API
│   └── group.js            # 业务分组相关 API
└── components/
    └── ...                 # 业务组件
```

## 核心文件说明

### 1. request.js - 统一请求封装

位置：`src/utils/request.js`

这个文件封装了 axios，提供了：
- 统一的请求/响应拦截器
- 统一的错误处理
- 统一的超时设置
- 统一的请求头配置

```javascript
import request from '@/utils/request'

// 使用示例
request({
  url: '/api/xxx',
  method: 'get',
  params: { id: 1 }
})
```

### 2. API 模块文件

每个模块文件包含该模块相关的所有 API 接口，采用函数导出的方式。

#### 2.1 channel.js - 通道相关接口

```javascript
import { getChannelInfo, addChannel, updateChannel, resetChannel } from '@/api/channel'

// 获取通道信息
getChannelInfo(id).then(res => {
  console.log(res.data)
})

// 添加通道
addChannel(data).then(res => {
  console.log(res.data)
})

// 更新通道
updateChannel(data).then(res => {
  console.log(res.data)
})

// 重置通道
resetChannel(id).then(res => {
  console.log(res.data)
})
```

#### 2.2 device.js - 设备相关接口

```javascript
import { getDeviceList, getDeviceInfo, addDevice, updateDevice } from '@/api/device'

// 获取设备列表
getDeviceList({ page: 1, count: 10 }).then(res => {
  console.log(res.data)
})

// 获取设备详情
getDeviceInfo(deviceId).then(res => {
  console.log(res.data)
})
```

#### 2.3 system.js - 系统相关接口

```javascript
import { getSystemConfig, updateSystemConfig } from '@/api/system'

// 获取系统配置
getSystemConfig().then(res => {
  console.log(res.data)
})
```

#### 2.4 region.js - 行政区域接口

```javascript
import { getRegionList, getRegionTree, addRegion } from '@/api/region'

// 获取区域列表
getRegionList({ page: 1 }).then(res => {
  console.log(res.data)
})
```

#### 2.5 group.js - 业务分组接口

```javascript
import { getGroupList, getGroupTree, addGroup } from '@/api/group'

// 获取分组列表
getGroupList({ page: 1 }).then(res => {
  console.log(res.data)
})
```

### 3. index.js - 统一导出

位置：`src/api/index.js`

这个文件将所有模块的 API 统一导出，支持两种导入方式：

```javascript
// 方式1：从具体模块导入（推荐）
import { getChannelInfo, addChannel } from '@/api/channel'

// 方式2：从 index 统一导入
import { getChannelInfo, addChannel, getDeviceList } from '@/api'
```

## 使用示例

### 旧的写法（不推荐）

```javascript
export default {
  methods: {
    getData() {
      this.$axios({
        method: 'get',
        url: '/api/common/channel/one',
        params: { id: this.id }
      }).then(res => {
        if (res.data.code === 0) {
          this.data = res.data.data
        }
      }).catch(error => {
        console.error(error)
      })
    }
  }
}
```

### 新的写法（推荐）

```javascript
import { getChannelInfo } from '@/api/channel'

export default {
  methods: {
    getData() {
      getChannelInfo(this.id).then(res => {
        if (res.data.code === 0) {
          this.data = res.data.data
        }
      }).catch(error => {
        console.error(error)
      })
    }
  }
}
```

## 完整的组件改造示例

以 `CommonChannelEdit.vue` 为例：

### 改造前：

```vue
<script>
export default {
  methods: {
    onSubmit() {
      this.$axios({
        method: 'post',
        url: "/api/common/channel/update",
        data: this.form
      }).then(res => {
        // 处理响应
      })
    }
  }
}
</script>
```

### 改造后：

```vue
<script>
import { getChannelInfo, addChannel, updateChannel, resetChannel } from '@/api/channel'

export default {
  methods: {
    onSubmit() {
      updateChannel(this.form).then(res => {
        // 处理响应
      })
    },
    
    reset() {
      resetChannel(this.form.gbId).then(res => {
        // 处理响应
      })
    },
    
    getCommonChannel() {
      getChannelInfo(this.id).then(res => {
        if (res.data.code === 0) {
          this.form = res.data.data
        }
      })
    }
  }
}
</script>
```

## 如何添加新的 API

### 1. 在对应的 API 模块文件中添加函数

例如在 `src/api/channel.js` 中添加：

```javascript
/**
 * 批量删除通道
 * @param {Array} ids - 通道ID数组
 */
export function batchDeleteChannels(ids) {
  return request({
    url: '/api/common/channel/batch/delete',
    method: 'post',
    data: { ids }
  })
}
```

### 2. 在组件中使用

```javascript
import { batchDeleteChannels } from '@/api/channel'

export default {
  methods: {
    handleBatchDelete() {
      batchDeleteChannels(this.selectedIds).then(res => {
        if (res.data.code === 0) {
          this.$message.success('删除成功')
        }
      })
    }
  }
}
```

## 如何创建新的 API 模块

### 1. 创建新的模块文件

例如创建 `src/api/user.js`：

```javascript
/**
 * 用户管理相关API
 */
import request from '@/utils/request'

/**
 * 获取用户列表
 * @param {Object} params - 查询参数
 */
export function getUserList(params) {
  return request({
    url: '/api/user/list',
    method: 'get',
    params: params
  })
}

/**
 * 添加用户
 * @param {Object} data - 用户数据
 */
export function addUser(data) {
  return request({
    url: '/api/user/add',
    method: 'post',
    data: data
  })
}
```

### 2. 在 index.js 中导出

在 `src/api/index.js` 中添加：

```javascript
// 用户相关API
export * from './user'
```

## 注意事项

### 1. 不要在组件中直接使用 this.$axios

❌ 错误示例：
```javascript
this.$axios.get('/api/xxx')
```

✅ 正确示例：
```javascript
import { getXxx } from '@/api/xxx'
getXxx()
```

### 2. API 函数命名规范

- 查询列表：`getXxxList`
- 查询详情：`getXxxInfo` 或 `getXxx`
- 添加：`addXxx`
- 更新：`updateXxx`
- 删除：`deleteXxx`
- 批量操作：`batchXxx`

### 3. 参数说明

为每个 API 函数添加清晰的 JSDoc 注释：

```javascript
/**
 * 函数功能描述
 * @param {类型} 参数名 - 参数说明
 * @returns {Promise} 返回值说明
 */
export function functionName(params) {
  // ...
}
```

### 4. 错误处理

request.js 中已经统一处理了错误，但在特殊情况下可以在组件中单独处理：

```javascript
getChannelInfo(id).then(res => {
  // 成功处理
}).catch(error => {
  // 特殊错误处理
  console.error(error)
})
```

### 5. Loading 状态

```javascript
export default {
  data() {
    return {
      loading: false
    }
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const res = await getChannelInfo(this.id)
        this.data = res.data.data
      } finally {
        this.loading = false
      }
    }
  }
}
```

## 优势

1. **代码更清晰**：API 调用一目了然，不需要在组件中写大量的 axios 配置
2. **易于维护**：接口地址统一管理，修改接口只需修改对应的 API 文件
3. **类型安全**：可以很容易地添加 TypeScript 支持
4. **便于测试**：API 函数独立，易于编写单元测试
5. **统一错误处理**：在 request.js 中统一处理错误，避免重复代码
6. **便于文档生成**：通过 JSDoc 可以自动生成 API 文档

## 迁移计划

当前已完成：
- ✅ 创建 `utils/request.js` 统一封装
- ✅ 创建 `api/` 目录和基础模块文件
- ✅ 重构 `CommonChannelEdit.vue` 作为示例

待完成：
- [ ] 逐步重构其他组件（共约 69 个文件需要重构）
- [ ] 补充完善各个模块的 API 接口
- [ ] 添加更多的错误处理和拦截器功能
- [ ] 可选：添加 TypeScript 类型定义

## 参考资源

- [若依框架 - API 封装](http://doc.ruoyi.vip/)
- [Axios 官方文档](https://axios-http.com/)
- [Vue.js 最佳实践](https://vuejs.org/guide/best-practices/)

---

如有问题，请联系项目维护人员。



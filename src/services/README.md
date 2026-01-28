# VisionAI 服务模块使用指南

## 概述

本模块将原有的 `VisionAIService.js` 重构为 TypeScript 模块化架构，提供更好的类型安全和代码组织。

## 目录结构

```
src/services/
├── config/
│   └── axios.ts              # Axios 实例配置
├── types/
│   └── index.ts              # 类型定义
├── model.service.ts          # 模型管理服务
├── skill.service.ts          # 技能管理服务
├── ai-task.service.ts        # AI 任务管理服务
├── camera.service.ts         # 摄像头管理服务
├── alert.service.ts          # 预警管理服务
├── llm-skill.service.ts      # LLM 技能管理服务
├── chat.service.ts           # 聊天助手服务
├── index.ts                  # 统一导出
└── README.md                 # 本文件
```

## 使用方式

### 1. 导入服务

```typescript
// 方式一：导入单个服务
import { modelService } from '@/services'

// 方式二：导入多个服务
import { modelService, skillService, alertService } from '@/services'

// 方式三：导入类型
import type { Model, SkillClass, Alert } from '@/services'
```

### 2. 使用示例

#### 模型管理

```typescript
import { modelService } from '@/services'
import type { Model } from '@/services'

// 获取模型列表
const models = await modelService.getModelList({
  page: 1,
  limit: 10,
  name: 'yolo'
})

// 获取模型详情
const model = await modelService.getModelDetail('model-id')

// 加载模型
await modelService.loadModel('model-id')
```

#### 技能管理

```typescript
import { skillService } from '@/services'

// 获取技能列表
const skills = await skillService.getSkillList({
  page: 1,
  limit: 10,
  type: 'detection'
})

// 重新加载技能类
await skillService.reloadSkillClasses()

// 创建 AI 任务
await skillService.createAITask({
  name: '任务名称',
  camera_id: 'camera-id',
  skill_class_id: 'skill-id'
})
```

#### 预警管理

```typescript
import { alertService } from '@/services'

// 获取实时预警列表
const alerts = await alertService.getRealTimeAlerts({
  page: 1,
  limit: 20,
  alert_level: 1
})

// 创建 SSE 连接
const eventSource = alertService.createAlertSSEConnection(
  (data) => {
    console.log('收到预警:', data)
  },
  (error) => {
    console.error('SSE 错误:', error)
  }
)

// 关闭连接
eventSource.close()
```

#### 聊天助手

```typescript
import { chatService } from '@/services'

// 发送流式聊天消息
await chatService.sendChatMessage(
  {
    message: '你好',
    stream: true
  },
  (chunk) => {
    console.log('收到消息片段:', chunk)
  },
  (error) => {
    console.error('聊天错误:', error)
  }
)

// 获取会话列表
const conversations = await chatService.getChatConversations({ limit: 50 })
```

### 3. 类型使用

```typescript
import type { Model, SkillClass, Alert, ChatMessage } from '@/services'

// 使用类型进行约束
const handleModel = (model: Model) => {
  console.log(model.name, model.type)
}

const processAlerts = (alerts: Alert[]) => {
  alerts.forEach(alert => {
    console.log(alert.alert_type, alert.alert_level)
  })
}
```

### 4. 错误处理

```typescript
import { modelService } from '@/services'

try {
  const model = await modelService.getModelDetail('model-id')
  console.log(model)
} catch (error) {
  if (error instanceof Error) {
    console.error('获取模型失败:', error.message)
  }
}
```

## 环境变量配置

在 `.env` 文件中配置后端 API 地址：

```bash
# 开发环境
VITE_API_BASE_URL=http://localhost:8000

# 生产环境
VITE_API_BASE_URL=https://your-api-server.com
```

在 `vite.config.ts` 中配置代理：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true
    }
  }
}
```

## 迁移指南

### 从旧的 VisionAIService.js 迁移

**旧代码：**
```javascript
import VisionAIService from '@/components/service/VisionAIService'

const service = new VisionAIService()
const models = await service.getModelList({ page: 1 })
```

**新代码：**
```typescript
import { modelService } from '@/services'

const models = await modelService.getModelList({ page: 1 })
```

### 主要变化

1. **模块化**：服务按功能拆分为多个模块
2. **TypeScript**：完整的类型定义和约束
3. **环境变量**：使用 Vite 环境变量配置
4. **单例模式**：每个服务导出单例，无需 new
5. **更好的错误处理**：统一的错误处理机制

## API 覆盖情况

以下功能已迁移到新架构：

- ✅ 模型管理 (ModelService)
- ✅ 技能管理 (SkillService)
- ✅ AI 任务管理 (AITaskService)
- ✅ 摄像头管理 (CameraService)
- ✅ 预警管理 (AlertService)
- ✅ LLM 技能管理 (LlmSkillService)
- ✅ 聊天助手 (ChatService)

## 注意事项

1. **Token 处理**：Axios 拦截器会自动从 localStorage 读取并添加 token
2. **错误处理**：401 错误会自动清除 token 并跳转到登录页
3. **SSE 连接**：使用 `getApiBaseURL()` 获取完整地址用于 SSE 连接
4. **文件上传**：使用 FormData 处理文件上传

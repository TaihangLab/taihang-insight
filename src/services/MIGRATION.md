# VisionAIService.js 迁移指南

## 概述

本文档说明如何从 `VisionAIService.js` 迁移到新的 TypeScript 服务模块。

## 新的服务架构

```
src/services/
├── config/
│   └── axios.ts              # Axios 实例配置
├── types/
│   └── index.ts              # TypeScript 类型定义
├── model.service.ts          # 模型管理服务
├── skill.service.ts          # 技能管理服务
├── ai-task.service.ts        # AI 任务管理服务
├── camera.service.ts         # 摄像头管理服务
├── alert.service.ts          # 预警管理服务
├── llm-skill.service.ts      # LLM 技能管理服务
├── llm-task.service.ts       # LLM 任务管理服务
├── review-skill.service.ts   # 复判技能管理服务
├── review-record.service.ts  # 复判记录管理服务
├── chat.service.ts           # 聊天助手服务
├── channel.service.ts        # 通道管理服务
├── region.service.ts         # 区域/目录管理服务
└── index.ts                  # 统一导出
```

## 迁移映射表

| VisionAIService.js 方法 | 新服务 | 新方法 |
|------------------------|--------|--------|
| **模型管理** | | |
| getModelList | modelService | getModelList |
| getModelDetail | modelService | getModelDetail |
| updateModel | modelService | updateModel |
| deleteModel | modelService | deleteModel |
| batchDeleteModels | modelService | batchDeleteModels |
| loadModel | modelService | loadModel |
| unloadModel | modelService | unloadModel |
| **技能管理** | | |
| getSkillList | skillService | getSkillList |
| getAITaskSkillClasses | skillService | getAITaskSkillClasses |
| reloadSkillClasses | skillService | reloadSkillClasses |
| getSkillDetail | skillService | getSkillDetail |
| createAITask | skillService | createAITask |
| deleteSkill | skillService | deleteSkill |
| batchDeleteSkills | skillService | batchDeleteSkills |
| importSkill | skillService | importSkill |
| updateSkill | skillService | updateSkill |
| uploadSkillImage | skillService | uploadSkillImage |
| getSkillDevices | skillService | getSkillDevices |
| **AI 任务管理** | | |
| getAITaskDetail | aiTaskService | getAITaskDetail |
| updateAITask | aiTaskService | updateAITask |
| deleteAITask | aiTaskService | deleteAITask |
| getCameraAITasks | aiTaskService | getCameraAITasks |
| **摄像头管理** | | |
| getCameraList | cameraService | getCameraList |
| getCameraDetail | cameraService | getCameraDetail |
| updateCamera | cameraService | updateCamera |
| deleteCamera | cameraService | deleteCamera |
| batchDeleteCameras | cameraService | batchDeleteCameras |
| getCameraAITasks | cameraService | getCameraAITasks |
| **预警管理** | | |
| getRealTimeAlerts | alertService | getRealTimeAlerts |
| getAlertDetail | alertService | getAlertDetail |
| updateAlertStatus | alertService | updateAlertStatus |
| batchUpdateAlertStatus | alertService | batchUpdateAlertStatus |
| deleteAlert | alertService | deleteAlert |
| batchDeleteAlerts | alertService | batchDeleteAlerts |
| markAlertAsFalseAlarm | alertService | markAlertAsFalseAlarm |
| batchMarkAlertsAsFalseAlarm | alertService | batchMarkAlertsAsFalseAlarm |
| getAlertStatistics | alertService | getAlertStatistics |
| exportAlerts | alertService | exportAlerts |
| createAlertSSEConnection | alertService | createAlertSSEConnection |
| getSSEStatus | alertService | getSSEStatus |
| getConnectedClients | alertService | getConnectedClients |
| sendTestAlert | alertService | sendTestAlert |
| **LLM 技能管理** | | |
| createLlmSkill | llmSkillService | createLlmSkill |
| uploadLlmSkillIcon | llmSkillService | uploadLlmSkillIcon |
| previewTestLlmSkill | llmSkillService | previewTestLlmSkill |
| getLlmSkillList | llmSkillService | getLlmSkillList |
| getLlmSkillDetail | llmSkillService | getLlmSkillDetail |
| updateLlmSkill | llmSkillService | updateLlmSkill |
| publishLlmSkill | llmSkillService | publishLlmSkill |
| unpublishLlmSkill | llmSkillService | unpublishLlmSkill |
| deleteLlmSkill | llmSkillService | deleteLlmSkill |
| batchDeleteLlmSkills | llmSkillService | batchDeleteLlmSkills |
| **LLM 任务管理** | | |
| createLlmTask | llmTaskService | createLlmTask |
| deleteLlmTask | llmTaskService | deleteLlmTask |
| batchDeleteLlmTasks | llmTaskService | batchDeleteLlmTasks |
| getLlmTaskList | llmTaskService | getLlmTaskList |
| getLlmTaskDetail | llmTaskService | getLlmTaskDetail |
| **复判技能管理** | | |
| createReviewSkill | reviewSkillService | createReviewSkill |
| previewTestReviewSkill | reviewSkillService | previewTestReviewSkill |
| updateReviewSkill | reviewSkillService | updateReviewSkill |
| getReviewSkillList | reviewSkillService | getReviewSkillList |
| getReviewSkillDetail | reviewSkillService | getReviewSkillDetail |
| publishReviewSkill | reviewSkillService | publishReviewSkill |
| unpublishReviewSkill | reviewSkillService | unpublishReviewSkill |
| deleteReviewSkill | reviewSkillService | deleteReviewSkill |
| batchDeleteReviewSkills | reviewSkillService | batchDeleteReviewSkills |
| **复判记录管理** | | |
| getReviewServiceStatus | reviewRecordService | getReviewServiceStatus |
| startReviewService | reviewRecordService | startReviewService |
| stopReviewService | reviewRecordService | stopReviewService |
| getAITasksForReview | reviewRecordService | getAITasksForReview |
| getReviewRecords | reviewRecordService | getReviewRecords |
| getReviewRecordById | reviewRecordService | getReviewRecordById |
| getReviewRecordsByAlertId | reviewRecordService | getReviewRecordsByAlertId |
| createReviewRecord | reviewRecordService | createReviewRecord |
| updateReviewRecord | reviewRecordService | updateReviewRecord |
| deleteReviewRecord | reviewRecordService | deleteReviewRecord |
| getReviewRecordStatistics | reviewRecordService | getReviewRecordStatistics |
| **聊天助手** | | |
| sendChatMessage | chatService | sendChatMessage |
| getChatConversations | chatService | getChatConversations |
| getChatMessages | chatService | getChatMessages |
| deleteChatConversation | chatService | deleteChatConversation |
| clearAllChatConversations | chatService | clearAllChatConversations |
| quickChat | chatService | quickChat |
| getChatModels | chatService | getChatModels |
| checkChatHealth | chatService | checkChatHealth |
| createGroup | chatService | createGroup |
| getGroups | chatService | getGroups |
| deleteGroup | chatService | deleteGroup |
| updateConversationGroup | chatService | updateConversationGroup |
| getGroupConversations | chatService | getGroupConversations |
| autoGenerateTitle | chatService | autoGenerateTitle |
| updateConversationTitle | chatService | updateConversationTitle |
| saveMessageToConversation | chatService | saveMessageToConversation |
| stopGeneration | chatService | stopGeneration |
| **通道管理** | | |
| getChannelList | channelService | getChannelList |
| getChannelDetail | channelService | getChannelDetail |
| playChannel | channelService | playChannel |
| stopChannel | channelService | stopChannel |
| getChannelTree | channelService | getChannelTree |
| **区域/目录管理** | | |
| getRegionTree | regionService | getRegionTree |
| getGroupTree | regionService | getGroupTree |
| getTasksByCamera | regionService | getTasksByCamera |
| getDetectionResult | regionService | getDetectionResult |

## 迁移示例

### 示例 1: 获取模型列表

**旧代码:**
```javascript
import VisionAIService from '@/components/service/VisionAIService'

const service = new VisionAIService()
const models = await service.getModelList({ page: 1, limit: 10 })
```

**新代码:**
```typescript
import { modelService } from '@/services'
import type { Model } from '@/services'

const models = await modelService.getModelList({ page: 1, limit: 10 })
```

### 示例 2: 获取预警列表

**旧代码:**
```javascript
const service = new VisionAIService()
const alerts = await service.getRealTimeAlerts({ page: 1, limit: 20 })
```

**新代码:**
```typescript
import { alertService } from '@/services'

const alerts = await alertService.getRealTimeAlerts({ page: 1, limit: 20 })
```

### 示例 3: 创建 SSE 连接

**旧代码:**
```javascript
const service = new VisionAIService()
const eventSource = service.createAlertSSEConnection(
  (data) => console.log(data),
  (error) => console.error(error)
)
```

**新代码:**
```typescript
import { alertService } from '@/services'

const eventSource = alertService.createAlertSSEConnection(
  (data) => console.log(data),
  (error) => console.error(error)
)
```

### 示例 4: 流式聊天

**旧代码:**
```javascript
const service = new VisionAIService()
await service.createChatStream(
  { message: '你好' },
  (chunk) => console.log(chunk),
  null,
  () => console.log('完成')
)
```

**新代码:**
```typescript
import { chatService } from '@/services'

await chatService.sendChatMessage(
  { message: '你好', stream: true },
  (chunk) => console.log(chunk),
  (error) => console.error(error)
)
```

## 主要改进

1. **类型安全**: 完整的 TypeScript 类型定义
2. **模块化**: 按功能拆分为 13 个独立服务
3. **环境变量**: 使用 Vite 环境变量和代理
4. **单例模式**: 每个服务导出单例，无需 new
5. **更好的错误处理**: 统一的错误处理机制

## 注意事项

1. **导入路径**: 使用 `@/services` 而不是 `@/components/service/VisionAIService`
2. **类型约束**: 新方法有严格的类型检查，确保传入正确的参数
3. **返回值**: 返回值类型明确，可以使用 IDE 的自动补全
4. **环境变量**: 确保 `.env` 文件中配置了 `VITE_API_BASE_URL`

## 完整迁移步骤

1. 安装新的服务模块（已创建）
2. 在组件中替换导入语句
3. 更新方法调用（移除 `new` 关键字）
4. 添加类型注解（可选但推荐）
5. 测试功能是否正常

## 获取帮助

如有问题，请查看：
- `/src/services/README.md` - 详细使用指南
- `/src/services/types/index.ts` - 类型定义参考

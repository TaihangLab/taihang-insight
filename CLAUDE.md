# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

太行视觉AI平台 (Taihang Insight) 是一个基于 Vue.js 2.x 的可视化监控平台，主要用于展示 AI 算法推理系统的运行状态和数据统计。这是一个大屏可视化系统，具有科技感 UI 设计风格，提供实时监控、设备管理、AI 技能管理等功能。

### 技术栈
- **前端框架**: Vue.js 2.6.11
- **UI 组件**: Element UI 2.15.14
- **路由**: Vue Router 3.1.6
- **HTTP 客户端**: Axios 0.24.0
- **可视化**: Chart.js 3.9.1, ECharts 4.9.0, v-charts 1.19.0, @jiaminghi/data-view 2.10.0
- **3D 效果**: Three.js 0.137.5
- **视频播放**: @liveqing/liveplayer 2.7.10
- **地图**: OpenLayers (ol) 6.14.1
- **日志查看**: @femessage/log-viewer 1.5.0
- **构建工具**: Webpack 3.6.0

## 常用开发命令

### 安装依赖
```bash
npm install
```

### 开发模式运行
```bash
npm run dev
# 或
npm start
```
开发服务器将在 `http://localhost:8080` 启动，支持热重载。

### 生产环境构建
```bash
npm run build
```
构建产物将输出到 `dist/` 目录。

### 构建分析
```bash
npm run build --report
```
生成构建分析报告，查看 bundle 大小和组成。

## 项目架构

### 代码组织结构
```
src/
├── components/              # 组件目录
│   ├── common/              # 通用组件
│   │   ├── DeviceTree.vue   # 设备树组件
│   │   └── jessibuca.vue    # 视频播放器
│   ├── visionAI/            # 视觉AI相关组件
│   │   ├── ivisualCenter/   # 可视化中心（大屏展示）
│   │   ├── deviceManagement/# 设备管理
│   │   ├── skillManagement/ # 技能管理
│   │   ├── modelManagement/ # 模型管理
│   │   ├── monitoringWarning/  # 监控预警
│   │   ├── edgeManagement/  # 边缘设备管理
│   │   ├── systemManagement/  # 系统管理（含RBAC）
│   │   └── chatAssistant/   # 智能助手
│   ├── service/             # API服务封装
│   │   ├── VisionAIService.js   # 视觉AI服务（主要API）
│   │   ├── DeviceService.js     # 设备服务
│   │   ├── UserService.js       # 用户服务
│   │   ├── MediaServer.js       # 媒体服务器
│   │   ├── RBACService.js       # RBAC权限服务
│   │   └── rbac/            # RBAC服务实现
│   └── dialog/              # 对话框组件
├── layout/                  # 布局组件
├── router/                  # 路由配置
├── styles/                  # 全局样式
│   └── design-system.css    # 设计系统样式
└── main.js                  # 应用入口

config/
└── index.js                 # 项目配置文件（API地址等）

public/                      # 公共资源
static/                      # 静态资源
    └── img/                 # 图片资源
```

### 核心服务架构

项目使用模块化的服务层架构，所有 API 调用都通过专门的服务类进行：

#### VisionAIService（视觉AI服务 - 核心服务）
位置：`src/components/service/VisionAIService.js`

这是项目最重要的服务类，封装了所有视觉AI相关的API：
- **modelAPI**: 模型管理（加载、卸载、查询）
- **skillAPI**: 技能管理（创建、发布、编辑、删除）
- **cameraAPI**: 摄像头设备管理
- **alertAPI**: 预警管理（实时预警、历史预警、SSE连接）
- **reviewSkillAPI**: 复判技能管理
- **chatAssistantAPI**: 智能助手API
- **archiveAPI**: 档案管理
- **realtimeMonitorAPI**: 实时监控
- **realtimeDetectionAPI**: 实时检测

**关键特性**：
- 使用独立的 axios 实例，配置了认证拦截器
- 自定义参数序列化，支持数组参数
- 专门的 SSE（Server-Sent Events）连接管理用于实时预警
- 完整的数据转换机制（convertAPIWarningToFrontend等）

#### RBACService（权限管理服务）
位置：`src/components/service/RBACService.js`

提供完整的RBAC（基于角色的访问控制）功能：
- 用户管理、角色管理、部门管理
- 岗位管理、租户管理、权限管理
- 关联管理（用户-角色、角色-权限）

**智能降级机制**：当真实服务不可用时，自动切换到 Mock 服务（mockRBACService），确保开发体验。

#### DeviceService（设备服务）
位置：`src/components/service/DeviceService.js`

处理 WVP 视频平台的设备管理，包括国标设备、推流设备等。

### API 配置
位置：`config/index.js`

关键配置：
- `API_BASE_URL`: 主API服务地址
- `RBAC_API_BASE_URL`: RBAC服务地址
- 开发服务器端口：8080
- 生产构建配置

### 路由架构
位置：`src/router/index.js`

- 使用 hash 模式
- 主布局：Layout 组件
- 默认重定向到 `/visualCenter`
- 主要路由模块：
  - 可视化中心：`/visualCenter`, `/algorithmInference`
  - 监控预警：`/monitoring/*`
  - 设备管理：`/deviceManagement/*`
  - 技能管理：`/skillManagement/*`
  - 系统管理：`/systemManagement/*`

### 实时预警系统（SSE）
项目实现了基于 Server-Sent Events 的实时预警推送功能：

**SSE 端点**：`/api/v1/alerts/stream`

**关键实现**：
- `VisionAIService.createAlertSSEConnection()`: 建立 SSE 连接
- `realTimeMonitoring.vue`: 实时监控页面，接收并展示预警
- 连接状态指示器：绿色（已连接）、黄色（重连中）、红色（失败）
- 自动重连机制和错误处理

**数据流**：
```
AI任务执行器 → RabbitMQ → AlertService → SSE连接管理器 → 前端实时预警页面
```

### 状态管理
项目主要使用组件级状态管理和 localStorage，不使用 Vuex。
- 用户信息存储在 localStorage
- 预警状态管理在组件内
- 使用 Vue 的响应式系统进行组件间通信

### 设计系统
位置：`src/styles/design-system.css`

统一的设计系统，包括：
- 蓝色科技感配色方案
- 卡片、按钮、表单等组件样式
- 响应式布局设计
- 渐变、阴影、动画效果

### 太行智能助手
位置：`src/components/common/IntelligentAssistant.vue`

项目的特色功能，提供：
- 3D 科技形象设计（蓝色风格，旋转光圈、呼吸光环）
- 自由拖拽定位
- 智能自动隐藏（3秒无交互后隐藏到边缘）
- 智能问答功能（监控系统、设备管理、预警管理等）
- 全平台覆盖（所有页面显示）

## 开发指南

### 添加新的 API 接口
1. 在相应的 Service 类中添加新方法（通常在 VisionAIService.js）
2. 使用 visionAIAxios 实例发送请求
3. 如需特殊数据转换，添加对应的 convert 方法
4. 在组件中导入并使用

### 创建新页面
1. 在 `src/components/visionAI/` 下对应的模块目录创建 Vue 组件
2. 在 `src/router/index.js` 中添加路由配置
3. 如需菜单项，在布局组件中添加导航

### 使用 RBAC 服务
```javascript
import RBACService from '@/components/service/RBACService';

// 获取用户列表
const users = await RBACService.getUsers(page, size);

// 创建角色
const role = await RBACService.createRole(roleData);
```

RBAC 服务会自动选择真实服务或 Mock 服务。

### 使用视觉 AI 服务
```javascript
import { cameraAPI, skillAPI } from '@/components/service/VisionAIService';

// 获取摄像头列表
const cameras = await cameraAPI.getCameraList(page, size);

// 创建技能
const skill = await skillAPI.createSkill(skillData);
```

### SSE 实时预警集成
```javascript
import VisionAIService from '@/components/service/VisionAIService';

// 建立SSE连接
const eventSource = VisionAIService.createAlertSSEConnection(
  (message) => {
    // 处理接收到的预警消息
    console.log('新预警:', message);
  },
  (error) => {
    // 处理错误
    console.error('SSE错误:', error);
  }
);
```

### 组件开发规范
- 通用组件放在 `components/common/`
- 业务组件按功能模块组织在 `components/visionAI/`
- 对话框组件放在对应的 `dialogs/` 子目录
- 遵循 Vue.js 官方风格指南
- 组件命名采用帕斯卡命名法（PascalCase）
- 方法命名采用驼峰命名法（camelCase）

### 样式开发
- 优先使用 design-system.css 中定义的设计系统类
- 主要采用蓝色科技感配色
- 使用 Element UI 组件作为基础
- 自定义样式使用 scoped 样式

### 视频播放器
项目使用多个视频播放器：
- **jessibuca**: 主要播放器组件（`src/components/common/jessibuca.vue`）
- **rtcPlayer**: WebRTC 播放器（`src/components/dialog/rtcPlayer.vue`）
- **@liveqing/liveplayer**: LivePlayer 播放器

根据使用场景选择合适的播放器。

### 故障排除

#### 实时预警不更新
1. 检查 SSE 连接状态指示器（realTimeMonitoring 页面右上角）
2. 打开浏览器控制台查看是否有连接错误
3. 确认后端 API 服务可访问（config/index.js 中的 API_BASE_URL）
4. 使用页面调试功能发送测试预警

#### API 请求失败
1. 检查网络连接
2. 确认后端服务状态
3. 查看 config/index.js 中的 API 地址配置
4. 检查浏览器开发者工具 Network 面板的错误信息

#### 视频无法播放
1. 确认视频流地址正确
2. 检查媒体服务器状态（MediaServer.js）
3. 尝试不同的播放器组件
4. 查看浏览器控制台的错误信息

#### RBAC 功能异常
1. 检查控制台是否有 "真实RBAC服务不可用，使用模拟服务" 的警告
2. 确认 RBAC_API_BASE_URL 配置正确
3. 查看浏览器 Network 面板的 RBAC API 请求

## 重要提示

### API 响应格式转换
VisionAIService 包含完整的数据转换机制，将后端 API 响应转换为前端期望的格式：
- `convertAPIWarningToFrontend()`: 预警数据转换
- `convertAPIAlertToFrontend()`: 预警详情转换
- 转换方法会保持与前端展示组件的数据结构一致

### 多租户支持
项目支持多租户架构，RBAC 服务包含完整的租户管理功能。

### 权限控制
- 已上线技能不可编辑和删除（设备技能管理）
- 使用 RBAC 服务进行细粒度的权限控制
- 路由级别的权限控制可在路由配置中添加

### 浏览器指纹
项目使用 FingerprintJS2 生成唯一浏览器标识：
- 在 main.js 中初始化
- 存储在 `Vue.prototype.$browserId`
- 用于设备识别和会话管理

### 知识库
项目的知识库位于 `.wiki/` 目录，包含：
- code/: 代码分析和常用组件介绍
- plan/: 需求文档
- prompt/: 提示词文档

开发前建议先查阅相关知识库文档。

### 开发环境要求
- Node.js >= 6.0.0
- npm >= 3.0.0
- 现代浏览器（Chrome、Firefox、Edge 等）

### 生产部署注意事项
1. 修改 config/index.js 中的 API_BASE_URL 为生产环境地址
2. 运行 `npm run build` 构建
3. 将 dist/ 目录部署到 Web 服务器
4. 配置反向代理指向后端 API 服务
5. 确保 SSE 连接端点可访问
6. 配置正确的 CORS 策略

### 最新功能特性
- 智能归档系统（基于摄像头位置的档案选择）
- 位置区域筛选功能
- 预警详情操作历史记录系统
- 预警档案信息字段完善
- 技能编辑权限控制
- 技能复制功能
- 系统管理模块（用户、角色、租户管理）
- 个人中心页面
- 太行智能助手

查看 README.md 和 QWEN.md 获取更详细的功能介绍和更新日志。

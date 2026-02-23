# 铜矿峪矿综合管控平台项目 UI 设计规范

## 1. 概述

### 1.1 项目背景

铜矿峪矿综合管控平台是一个面向矿山企业管理的综合性信息化系统，旨在通过数字化手段提升矿山企业的管理效率和安全生产水平。

### 1.2 设计理念

**"科技、专业、高效、安全"**

- 科技感：采用现代化设计语言，体现数字化转型的前瞻性
- 专业性：符合矿山行业特点，突出实用性和可靠性
- 高效性：信息架构清晰，交互流程简洁高效
- 安全性：视觉设计强调安全警示，符合安全生产规范

### 1.3 适用范围

本规范适用于铜矿峪矿综合管控平台的所有前端界面设计，包括但不限于：

- Web 管理后台
- 数据可视化大屏
- 移动端应用
- 各业务子系统

---

## 2. 设计原则

### 2.1 一致性原则

- **视觉一致性**：相同功能的组件在不同页面保持一致的视觉表现
- **交互一致性**：相同的操作在不同场景下有相同的交互反馈
- **语言一致性**：文案、标签、提示信息使用统一的术语体系

### 2.2 层次感原则

- **信息层级**：通过字体大小、颜色深浅、间距疏密体现信息重要性
- **视觉层级**：使用阴影、边框、背景色区分不同层级的内容区域
- **交互层级**：主要操作突出显示，次要操作弱化处理

### 2.3 响应式原则

- 支持多种屏幕尺寸（1920px、1440px、1366px、1024px）
- 关键信息在小屏幕下优先展示
- 触控设备考虑手指操作的点击区域

### 2.4 可访问性原则

- 色彩对比度符合 WCAG 2.1 AA 标准
- 支持键盘导航
- 提供清晰的焦点状态
- 重要信息不仅依赖颜色传达

---

## 3. 色彩规范

### 3.1 主色调

| 色彩名称 | 色值 | HEX | 应用场景 |
|---------|------|-----|---------|
| **科技蓝（主色）** | RGB(65, 133, 247) | `#4185F7` | 主要按钮、链接、强调元素 |
| **深蓝色（主色悬停）** | RGB(45, 95, 217) | `#2d5fd9` | 主色悬停状态 |
| **浅蓝色（主色浅色）** | RGB(233, 243, 255) | `#e9f3ff` | 主色背景、浅色遮罩 |

```css
/* 主色变量 */
--primary-color: #4185F7;
--primary-hover: #2d5fd9;
--primary-light: #e9f3ff;
--primary-lighter: rgba(65, 133, 247, 0.1);
```

### 3.2 辅助色

| 色彩名称 | 色值 | HEX | 应用场景 |
|---------|------|-----|---------|
| **成功绿** | RGB(103, 194, 58) | `#67C23A` | 成功提示、启用状态 |
| **警告橙** | RGB(230, 162, 60) | `#E6A23C` | 警告提示、待处理状态 |
| **危险红** | RGB(245, 108, 108) | `#F56C6C` | 危险操作、删除、错误状态 |
| **信息蓝** | RGB(144, 147, 153) | `#909399` | 信息提示、中性状态 |

```css
/* 辅助色变量 */
--success-color: #67C23A;
--warning-color: #E6A23C;
--danger-color: #F56C6C;
--info-color: #909399;
```

### 3.3 中性色

| 色彩名称 | 色值 | HEX | 应用场景 |
|---------|------|-----|---------|
| **深灰（主文本）** | RGB(31, 41, 55) | `#1F2937` | 标题、重要文本 |
| **中灰（次文本）** | RGB(107, 114, 128) | `#6B7280` | 普通文本 |
| **浅灰（辅助文本）** | RGB(156, 163, 175) | `#9CA3AF` | 辅助说明文本 |
| **极浅灰（边框）** | RGB(229, 231, 235) | `#E5E7EB` | 边框、分割线 |
| **背景白（主背景）** | RGB(255, 255, 255) | `#FFFFFF` | 主背景 |
| **浅灰背景（次背景）** | RGB(249, 250, 251) | `#F9FAFB` | 次级背景 |
| **悬停背景** | RGB(243, 244, 246) | `#F3F4F6` | 悬停状态背景 |

```css
/* 中性色变量 */
--text-primary: #1F2937;
--text-secondary: #6B7280;
--text-tertiary: #9CA3AF;
--border-color: #E5E7EB;
--bg-primary: #FFFFFF;
--bg-secondary: #F9FAFB;
--bg-tertiary: #F3F4F6;
```

### 3.4 渐变色

| 渐变名称 | 起始色 | 结束色 | 应用场景 |
|---------|--------|--------|---------|
| **主色渐变** | `#4185F7` | `#2d5fd9` | 主按钮、卡片装饰 |
| **背景渐变** | `#f5f7fa` | `#c3cfe2` | 页面背景 |
| **卡片渐变** | `#ffffff` | `#f5f7fa` | 卡片背景 |

```css
/* 渐变变量 */
--gradient-primary: linear-gradient(135deg, #4185F7 0%, #2d5fd9 100%);
--gradient-background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
--gradient-card: linear-gradient(180deg, #ffffff 0%, #f5f7fa 100%);
```

### 3.5 色彩使用规范

#### 状态色彩

| 状态 | 色值 | HEX | Tag 类型 | 示例 |
|------|------|-----|---------|------|
| 启用/成功 | RGB(103, 194, 58) | `#67C23A` | `success` | 启用、在线、成功 |
| 警告/待处理 | RGB(230, 162, 60) | `#E6A23C` | `warning` | 待审核、即将过期 |
| 停用/错误 | RGB(245, 108, 108) | `#F56C6C` | `danger` | 停用、错误、离线 |
| 信息/中性 | RGB(144, 147, 153) | `#909399` | `info` | 未知、处理中 |

#### 数据可视化色彩

用于图表和统计展示：

```css
/* 图表色板 */
--chart-color-1: #4185F7;  /* 蓝色 */
--chart-color-2: #67C23A;  /* 绿色 */
--chart-color-3: #E6A23C;  /* 橙色 */
--chart-color-4: #F56C6C;  /* 红色 */
--chart-color-5: #909399;  /* 灰色 */
--chart-color-6: #9C27B0;  /* 紫色 */
```

---

## 4. 字体规范

### 4.1 字体家族

```css
/* 字体栈 */
--font-family-base: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
--font-family-mono: "SF Mono", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace;
--font-family-number: "DIN Alternate", "Roboto", "Helvetica Neue", Arial, sans-serif;
```

### 4.2 字号规范

| 用途 | 字号 | 行高 | 字重 | 应用场景 |
|------|------|------|------|---------|
| **大标题** | 24px | 32px | 600 | 页面主标题 |
| **中标题** | 20px | 28px | 600 | 卡片标题、区块标题 |
| **小标题** | 16px | 24px | 500 | 表格标题、列表标题 |
| **正文** | 14px | 22px | 400 | 正文内容、表格内容 |
| **辅助文字** | 12px | 20px | 400 | 提示信息、备注 |
| **数字** | - | - | - | 数值使用数字专用字体 |

```css
/* 字号变量 */
--font-size-xl: 24px;
--font-size-lg: 20px;
--font-size-md: 16px;
--font-size-base: 14px;
--font-size-sm: 12px;

/* 行高变量 */
--line-height-xl: 32px;
--line-height-lg: 28px;
--line-height-md: 24px;
--line-height-base: 22px;
--line-height-sm: 20px;
```

### 4.3 字重规范

| 字重值 | 名称 | 应用场景 |
|--------|------|---------|
| 300 | Light | 辅助说明文字 |
| 400 | Regular | 正文内容 |
| 500 | Medium | 次级标题、强调文字 |
| 600 | Semi-Bold | 标题、重要信息 |
| 700 | Bold | 特殊强调、页面大标题 |

```css
/* 字重变量 */
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### 4.4 文本颜色规范

| 文本类型 | 颜色值 | 应用场景 |
|---------|--------|---------|
| **主文本** | `#1F2937` | 页面主要内容文字 |
| **次文本** | `#6B7280` | 次要内容、描述文字 |
| **辅助文本** | `#9CA3AF` | 提示信息、占位符 |
| **禁用文本** | `#D1D5DB` | 禁用状态的文字 |
| **主色文本** | `#4185F7` | 链接、主色调文字 |
| **链接文本** | `#4185F7` | 可点击的链接文字 |
| **链接悬停** | `#2d5fd9` | 链接悬停状态 |

```css
/* 文本颜色变量 */
--text-color-primary: #1F2937;
--text-color-secondary: #6B7280;
--text-color-tertiary: #9CA3AF;
--text-color-disabled: #D1D5DB;
--text-color-primary-light: #4185F7;
```

---

## 5. 布局规范

### 5.1 页面布局

#### 整体布局结构

```
┌────────────────────────────────────────────────────────┐
│                     顶部导航栏 (60px)                    │
├──────┬─────────────────────────────────────────────────┤
│      │                                                 │
│ 侧边 │                                                 │
│ 边栏 │              主内容区域                          │
│(200px│                                                 │
│ ~240px│                                                 │
│      │                                                 │
└──────┴─────────────────────────────────────────────────┘
```

#### 页面容器

```css
/* 页面容器 */
.page-container {
  min-height: 100vh;
  background: var(--bg-secondary);
}

/* 内容区域 */
.content-wrapper {
  padding: var(--spacing-lg);
}
```

### 5.2 间距规范

基于 8px 基础单位的间距系统：

| 间距名称 | 数值 | 应用场景 |
|---------|------|---------|
| `--spacing-xs` | 4px | 紧凑元素间距 |
| `--spacing-sm` | 8px | 小元素间距、文字与图标 |
| `--spacing-base` | 16px | 基础间距、表单字段间距 |
| `--spacing-lg` | 24px | 区块间距、卡片内边距 |
| `--spacing-xl` | 32px | 页面级间距 |
| `--spacing-2xl` | 48px | 大区块间距 |

```css
/* 间距变量 */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-base: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

### 5.3 网格系统

采用 12 栅格系统：

```css
/* 栅格变量 */
--grid-columns: 12;
--grid-gutter: 24px;
--grid-gutter-sm: 16px;
```

### 5.4 卡片布局

```css
/* 卡片容器 */
.card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--spacing-lg);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-base);
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing-base);
}

/* 卡片标题 */
.card-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}
```

---

## 6. 圆角规范

| 元素类型 | 圆角值 | 应用场景 |
|---------|--------|---------|
| **大圆角** | 16px | 大卡片、模态框 |
| **中圆角** | 12px | 普通卡片、输入框 |
| **基础圆角** | 8px | 按钮、标签 |
| **小圆角** | 4px | 小标签、徽章 |
| **圆形** | 50% | 头像、圆形按钮 |

```css
/* 圆角变量 */
--border-radius-xl: 16px;
--border-radius-lg: 12px;
--border-radius-base: 8px;
--border-radius-sm: 4px;
--border-radius-full: 50%;
```

---

## 7. 阴影规范

```css
/* 阴影变量 */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* 主色调阴影 */
--shadow-primary: 0 4px 12px rgba(65, 133, 247, 0.3);
--shadow-primary-hover: 0 6px 16px rgba(65, 133, 247, 0.4);
```

---

## 8. 组件规范

### 8.1 按钮 Button

#### 主要按钮 (Primary)

```css
.btn-primary {
  background: linear-gradient(135deg, #4185F7 0%, #2d5fd9 100%);
  color: #FFFFFF;
  border: none;
  border-radius: var(--border-radius-base);
  padding: 10px 20px;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  box-shadow: var(--shadow-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2d5fd9 0%, #1a45c9 100%);
  box-shadow: var(--shadow-primary-hover);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  background: linear-gradient(135deg, #909399 0%, #6B7280 100%);
  cursor: not-allowed;
  box-shadow: none;
}
```

#### 次要按钮 (Default)

```css
.btn-default {
  background: #FFFFFF;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-base);
  padding: 10px 20px;
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-default:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-default:active {
  background: var(--primary-light);
}
```

#### 文字按钮 (Link)

```css
.btn-link {
  background: transparent;
  color: var(--primary-color);
  border: none;
  padding: 4px 8px;
  font-size: var(--font-size-base);
  cursor: pointer;
}

.btn-link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}
```

#### 按钮尺寸

| 尺寸 | 高度 | 水平内边距 | 字号 |
|------|------|-----------|------|
| Large | 40px | 16px | 14px |
| Default | 32px | 12px | 14px |
| Small | 28px | 10px | 12px |

### 8.2 输入框 Input

```css
.input {
  width: 100%;
  height: 40px;
  padding: 0 16px;
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-base);
  transition: all 0.3s ease;
}

.input:hover {
  border-color: var(--primary-color);
}

.input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-lighter);
}

.input::placeholder {
  color: var(--text-tertiary);
}

.input:disabled {
  background: var(--bg-secondary);
  color: var(--text-disabled);
  cursor: not-allowed;
}
```

### 8.3 选择框 Select

```css
.select {
  width: 100%;
  height: 40px;
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: #FFFFFF;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-base);
}

.select:hover {
  border-color: var(--primary-color);
}

.select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-lighter);
}
```

### 8.4 表格 Table

```css
.table {
  width: 100%;
  border-collapse: collapse;
  background: #FFFFFF;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.table thead {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
}

.table th {
  padding: 12px 16px;
  text-align: left;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-color);
}

.table td {
  padding: 12px 16px;
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
}

.table tbody tr:hover {
  background: var(--primary-lighter);
}

.table tbody tr:last-child td {
  border-bottom: none;
}
```

### 8.5 标签 Tag

```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius-base);
  white-space: nowrap;
}

/* 成功标签 */
.tag-success {
  background: #f0f9ff;
  color: var(--success-color);
  border: 1px solid rgba(103, 194, 58, 0.2);
}

/* 警告标签 */
.tag-warning {
  background: #fef3c7;
  color: var(--warning-color);
  border: 1px solid rgba(230, 162, 60, 0.2);
}

/* 危险标签 */
.tag-danger {
  background: #fef2f2;
  color: var(--danger-color);
  border: 1px solid rgba(245, 108, 108, 0.2);
}

/* 信息标签 */
.tag-info {
  background: #f3f4f6;
  color: var(--info-color);
  border: 1px solid rgba(144, 147, 153, 0.2);
}
```

### 8.6 卡片 Card

```css
.card {
  background: #FFFFFF;
  border: none;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.card-body {
  padding: var(--spacing-lg);
}

.card-footer {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}
```

### 8.7 模态框 Modal

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  background: #FFFFFF;
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-xl);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.modal-body {
  padding: var(--spacing-lg);
}

.modal-footer {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-base);
}
```

### 8.8 通知 Notification

```css
.notification {
  padding: var(--spacing-base) var(--spacing-lg);
  border-radius: var(--border-radius-base);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.notification-success {
  background: #f0f9ff;
  color: var(--success-color);
  border-left: 4px solid var(--success-color);
}

.notification-warning {
  background: #fef3c7;
  color: var(--warning-color);
  border-left: 4px solid var(--warning-color);
}

.notification-error {
  background: #fef2f2;
  color: var(--danger-color);
  border-left: 4px solid var(--danger-color);
}

.notification-info {
  background: #f3f4f6;
  color: var(--info-color);
  border-left: 4px solid var(--info-color);
}
```

---

## 9. 图标规范

### 9.1 图标尺寸

| 尺寸名称 | 数值 | 应用场景 |
|---------|------|---------|
| **超大图标** | 32px | 特殊强调、主要操作 |
| **大图标** | 24px | 按钮图标、卡片图标 |
| **中图标** | 20px | 表格图标、列表图标 |
| **小图标** | 16px | 输入框图标、文字前缀 |
| **超小图标** | 12px | 标签图标、辅助图标 |

### 9.2 图标颜色

| 状态 | 颜色值 | 应用场景 |
|------|--------|---------|
| **默认图标** | `#6B7280` | 普通状态图标 |
| **主色图标** | `#4185F7` | 强调、激活状态 |
| **成功图标** | `#67C23A` | 成功状态图标 |
| **警告图标** | `#E6A23C` | 警告状态图标 |
| **错误图标** | `#F56C6C` | 错误状态图标 |
| **禁用图标** | `#D1D5DB` | 禁用状态图标 |

### 9.3 图标使用原则

1. **语义明确**：图标应直观表达其代表的含义
2. **风格统一**：同一功能使用相同的图标
3. **尺寸适中**：图标大小与周围元素协调
4. **间距合理**：图标与文字保持适当间距
5. **避免过度使用**：重要操作使用图标，装饰性元素慎用

---

## 10. 动画规范

### 10.1 过渡时间

```css
/* 过渡时间变量 */
--transition-fast: 0.15s;
--transition-base: 0.3s;
--transition-slow: 0.5s;
```

### 10.2 缓动函数

```css
/* 缓动函数变量 */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
```

### 10.3 常用动画

```css
/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 淡入向上动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 缩放动画 */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 滑入动画 */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## 11. 响应式断点

```css
/* 断点变量 */
--breakpoint-xs: 480px;
--breakpoint-sm: 576px;
--breakpoint-md: 768px;
--breakpoint-lg: 992px;
--breakpoint-xl: 1200px;
--breakpoint-xxl: 1600px;

/* 媒体查询示例 */
@media (max-width: 768px) {
  /* 平板和以下 */
  .container {
    padding: var(--spacing-base);
  }
}

@media (max-width: 480px) {
  /* 手机 */
  .container {
    padding: var(--spacing-sm);
  }
}
```

---

## 12. 状态规范

### 12.1 加载状态

```css
/* 加载动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

### 12.2 空状态

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  color: var(--text-tertiary);
}

.empty-icon {
  width: 120px;
  height: 120px;
  margin-bottom: var(--spacing-base);
  opacity: 0.5;
}

.empty-text {
  font-size: var(--font-size-base);
  margin-bottom: var(--spacing-sm);
}
```

### 12.3 错误状态

```css
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
}

.error-icon {
  width: 80px;
  height: 80px;
  margin-bottom: var(--spacing-base);
  color: var(--danger-color);
}

.error-message {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.error-detail {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
}
```

---

## 13. Z-index 层级规范

```css
/* Z-index 层级 */
--z-index-dropdown: 1000;
--z-index-sticky: 1020;
--z-index-fixed: 1030;
--z-index-modal-backdrop: 1040;
--z-index-modal: 1050;
--z-index-popover: 1060;
--z-index-tooltip: 1070;
```

---

## 14. 设计资源

### 14.1 设计工具

- **Figma**: 主要界面设计工具
- **Sketch**: 辅助设计工具
- **Adobe XD**: 原型设计工具

### 14.2 图标资源

- **Element Plus Icons**: 主要图标库
- **Iconfont**: 自定义图标库
- **Flaticon**: 辅助图标资源

### 14.3 图片资源

- **Unsplash**: 免费高质量图片
- **Pexels**: 免费商用图片
- **图虫创意**: 国内图片资源

---

## 15. 附录

### 15.1 设计交付

设计交付应包含以下内容：

1. **设计源文件** (Figma/Sketch)
2. **标注文件** (蓝湖/MasterGo)
3. **切图资源** (PNG/SVG)
4. **设计规范文档** (本文档)
5. **原型演示** (交互原型)

### 15.2 开发协作

- 设计师与开发保持密切沟通
- 及时响应开发过程中的设计问题
- 定期进行设计走查和优化
- 收集用户反馈持续改进设计

### 15.3 版本历史

| 版本号 | 更新日期 | 更新内容 | 更新人 |
|--------|---------|---------|--------|
| v1.0.0 | 2024-01-01 | 初始版本发布 | 设计团队 |

---

## 16. 联系方式

如有设计相关问题，请联系：

- **设计团队**: design@tongkuangyu.com
- **前端团队**: frontend@tongkuangyu.com

---

*本文档由铜矿峪矿综合管控平台设计团队编制，版权所有，未经授权不得用于其他项目。*

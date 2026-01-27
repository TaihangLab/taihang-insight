import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

/**
 * UnoCSS 配置
 *
 * ==============================================
 * 重要说明: 所有颜色值引用 CSS 变量
 * - 确保 UnoCSS 与 Element Plus 颜色系统一致
 * - 修改主题颜色只需在 src/styles/theme.css 中修改
 * ==============================================
 *
 * 设计系统主题变量
 * - 主色: #4185F7 (蓝色) - var(--design-primary-color)
 * - 功能色: success (#67c23a), warning (#e6a23c), danger (#f56c6c), info (#909399)
 * - 间距: 4px 基准 (4px: 1, 8px: 2, 12px: 3, 16px: 4, 24px: 6, 32px: 8)
 */
export default defineConfig({
  // 预设配置
  presets: [
    // 默认预设，提供 Tailwind CSS 兼容的工具类
    presetUno(),
    // 属性化预设，支持属性模式使用工具类
    presetAttributify(),
    // 图标预设，支持纯 CSS 图标
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],

  // 主题变量 - 引用 CSS 变量（与 Element Plus 和设计系统保持一致）
  theme: {
    // ==========================================
    // 颜色系统 - 引用 theme.css 中定义的 CSS 变量
    // ==========================================
    colors: {
      // ===== 主色调 =====
      primary: {
        DEFAULT: 'var(--design-primary-color)', // #4185F7
        light: 'var(--design-primary-light)',    // #e9f3ff
        lighter: 'var(--design-primary-lighter)', // rgba(65, 133, 247, 0.1)
        hover: 'var(--design-primary-hover)',     // #2d5fd9
      },

      // ===== 功能色 =====
      success: {
        DEFAULT: 'var(--design-success-color)', // #67C23A
        light: 'var(--design-success-light)',   // #f0f9ff
      },
      warning: {
        DEFAULT: 'var(--design-warning-color)', // #E6A23C
        light: 'var(--design-warning-light)',   // #fef3c7
      },
      danger: {
        DEFAULT: 'var(--design-danger-color)',  // #F56C6C
        light: 'var(--design-danger-light)',   // #fef2f2
      },
      info: {
        DEFAULT: 'var(--design-info-color)',   // #909399 (灰色)
        light: 'var(--design-info-light)',     // #f3f4f6
      },

      // ===== 中性色 =====
      neutral: {
        50: 'var(--design-bg-secondary)',  // #F9FAFB
        100: 'var(--design-bg-hover)',      // #F3F4F6
        200: 'var(--design-border-color)',  // #E5E7EB
        300: 'var(--design-text-tertiary)', // #9CA3AF
        400: 'var(--design-text-tertiary)', // #9CA3AF
        500: 'var(--design-text-secondary)', // #6B7280
        600: 'var(--design-text-secondary)', // #6B7280
        700: 'var(--design-text-primary)',  // #1F2937
        800: 'var(--design-text-primary)',  // #1F2937
        900: '#111827',
      },

      // ===== 文本色 =====
      text: {
        primary: 'var(--design-text-primary)',   // #1F2937
        secondary: 'var(--design-text-secondary)', // #6B7280
        tertiary: 'var(--design-text-tertiary)',  // #9CA3AF
        disabled: 'var(--design-text-disabled)', // #D1D5DB
      },

      // ===== 背景色 =====
      bg: {
        primary: 'var(--design-bg-primary)',   // #FFFFFF
        secondary: 'var(--design-bg-secondary)', // #F9FAFB
        hover: 'var(--design-bg-hover)',       // #F3F4F6
      },

      // ===== 边框色 =====
      border: {
        DEFAULT: 'var(--design-border-color)', // #E5E7EB
        light: 'var(--design-bg-hover)',       // #F3F4F6
      },

      // ===== 图表色板 =====
      chart: {
        1: 'var(--design-chart-color-1)', // #4185F7 蓝色
        2: 'var(--design-chart-color-2)', // #67C23A 绿色
        3: 'var(--design-chart-color-3)', // #E6A23C 橙色
        4: 'var(--design-chart-color-4)', // #F56C6C 红色
        5: 'var(--design-chart-color-5)', // #909399 灰色
        6: 'var(--design-chart-color-6)', // #9C27B0 紫色
      },
    },

    // ==========================================
    // 间距系统 (4px 基准，与设计规范一致)
    // ==========================================
    spacing: {
      '0': '0',
      'px': '1px',
      '0.5': '2px',
      '1': '4px',
      '1.5': '6px',
      '2': '8px',
      '2.5': '10px',
      '3': '12px',
      '3.5': '14px',
      '4': '16px',
      '5': '20px',
      '6': '24px',
      '7': '28px',
      '8': '32px',
      '9': '36px',
      '10': '40px',
      '11': '44px',
      '12': '48px',
      '14': '56px',
      '16': '64px',
      '20': '80px',
      '24': '96px',
    },

    // ==========================================
    // 字体家族
    // ==========================================
    fontFamily: {
      sans: 'var(--design-font-family-base)',
      serif: '"Georgia", "Times New Roman", serif',
      mono: 'var(--design-font-family-mono)',
      number: 'var(--design-font-family-number)',
    },

    // ==========================================
    // 字体大小 (与设计规范一致)
    // ==========================================
    fontSize: {
      'xs': 'var(--design-font-size-xs)', // 12px
      'sm': 'var(--design-font-size-sm)', // 14px
      'base': 'var(--design-font-size-sm)', // 14px (正文)
      'md': 'var(--design-font-size-md)', // 16px
      'lg': 'var(--design-font-size-lg)', // 20px
      'xl': 'var(--design-font-size-xl)', // 24px
      '2xl': '30px',
      '3xl': '36px',
    },

    // ==========================================
    // 字重 (与设计规范一致)
    // ==========================================
    fontWeight: {
      'light': 'var(--design-font-weight-light)',   // 300
      'normal': 'var(--design-font-weight-normal)',  // 400
      'medium': 'var(--design-font-weight-medium)',  // 500
      'semibold': 'var(--design-font-weight-semibold)', // 600
      'bold': 'var(--design-font-weight-bold)',     // 700
    },

    // ==========================================
    // 圆角 (与设计规范一致)
    // ==========================================
    borderRadius: {
      'none': '0',
      'sm': 'var(--design-radius-sm)',    // 4px
      'DEFAULT': 'var(--design-radius-md)', // 8px
      'md': 'var(--design-radius-lg)',    // 12px
      'lg': 'var(--design-radius-xl)',    // 16px
      'xl': '20px',
      'full': 'var(--design-radius-full)', // 50%
    },

    // ==========================================
    // 阴影 (与设计规范一致)
    // ==========================================
    boxShadow: {
      'xs': 'var(--design-shadow-xs)',
      'sm': 'var(--design-shadow-sm)',
      'DEFAULT': 'var(--design-shadow-sm)',
      'md': 'var(--design-shadow-md)',
      'lg': 'var(--design-shadow-lg)',
      'xl': 'var(--design-shadow-xl)',
      // 主色调阴影
      'primary': 'var(--design-shadow-primary)',
      'primary-hover': 'var(--design-shadow-primary-hover)',
    },

    // ==========================================
    // 过渡时间 (与设计规范一致)
    // ==========================================
    transitionDuration: {
      'fast': 'var(--design-transition-fast)',   // 0.15s
      'DEFAULT': 'var(--design-transition-base)', // 0.3s
      'slow': 'var(--design-transition-slow)',   // 0.5s
    },

    // ==========================================
    // Z-index 层级 (与设计规范一致)
    // ==========================================
    zIndex: {
      'dropdown': 'var(--design-z-dropdown)',
      'sticky': 'var(--design-z-sticky)',
      'fixed': 'var(--design-z-fixed)',
      'modal-backdrop': 'var(--design-z-modal-backdrop)',
      'modal': 'var(--design-z-modal)',
      'popover': 'var(--design-z-popover)',
      'tooltip': 'var(--design-z-tooltip)',
    },
  },

  // ==========================================
  // 快捷方式 - 常用组合类
  // ==========================================
  shortcuts: {
    // ===== 布局容器 =====
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'flex-start': 'flex items-center justify-start',
    'flex-end': 'flex items-center justify-end',
    'flex-col-center': 'flex flex-col items-center justify-center',

    // ===== 卡片 =====
    'card': 'bg-white rounded-lg shadow-md p-6',
    'card-hover': 'card hover:shadow-lg transition-shadow',
    'card-compact': 'bg-white rounded-lg shadow p-4',

    // ===== 按钮 =====
    'btn': 'px-4 py-2 rounded text-sm transition-colors cursor-pointer font-medium',
    'btn-primary': 'btn bg-primary text-white shadow-primary hover:bg-primary-hover',
    'btn-secondary': 'btn border border-primary text-primary hover:bg-primary-lighter',
    'btn-sm': 'px-3 py-1.5 rounded text-xs',
    'btn-lg': 'px-6 py-3 rounded text-base',

    // ===== 输入框 =====
    'input': 'w-full px-3 py-2 border border-border rounded text-sm focus:outline-none focus:border-primary focus:shadow-primary',

    // ===== 文本 =====
    'text-clip': 'overflow-hidden text-ellipsis whitespace-nowrap',
    'text-break': 'break-words break-all',

    // ===== 页面 =====
    'page-container': 'p-6',
    'page-header': 'mb-6 text-lg font-semibold text-text-primary',
  },

  // ==========================================
  // 自定义规则
  // ==========================================
  rules: [
    // 文本选择颜色
    ['text-select-none', { 'user-select': 'none' }],
    ['text-select-all', { 'user-select': 'all' }],
  ],

  // ==========================================
  // 变换器
  // ==========================================
  transformers: [
    transformerDirectives(),  // 支持 @apply 指令
    transformerVariantGroup(), // 支持变体分组
  ],

  // ==========================================
  // 安全列表 - 需要保留的动态类名
  // ==========================================
  safelist: [
    // Element Plus 按钮类型
    'el-button--primary',
    'el-button--success',
    'el-button--warning',
    'el-button--danger',
    'el-button--info',
    // Element Plus 按钮尺寸
    'el-button--small',
    'el-button--medium',
    'el-button--large',
    // Element Plus 输入框
    'el-input__inner',
    'el-input--small',
    'el-input--large',
    // Element Plus 表格
    'el-table',
    // Element Plus 标签
    'el-tag--success',
    'el-tag--warning',
    'el-tag--danger',
    'el-tag--info',
  ],
})

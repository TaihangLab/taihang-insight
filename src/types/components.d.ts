/**
 * 通用组件类型定义
 */

/**
 * 错误页面原因项
 */
export interface ErrorReasonItem {
  /** 图标类名 */
  icon: string;
  /** 原因描述 */
  text: string;
}

/**
 * 错误页面操作按钮
 */
export interface ErrorActionButton {
  /** 按钮标签 */
  label: string;
  /** 图标类名 */
  icon: string;
  /** 按钮类型 */
  type?: "primary" | "secondary";
  /** 点击事件处理 */
  onClick: () => void;
}

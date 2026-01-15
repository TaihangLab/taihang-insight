/**
 * 命名转换工具
 * 在不同命名约定之间进行转换
 */

/**
 * kebab-case 转 snake_case
 * @example
 * kebabToSnake('user-management') => 'user_management'
 * kebabToSnake('real-time-monitoring') => 'real_time_monitoring'
 */
export function kebabToSnake(str) {
  return str.replace(/-/g, '_');
}

/**
 * PascalCase 转 snake_case
 * @example
 * pascalToSnake('UserManagement') => 'user_management'
 * pascalToSnake('RealTimeMonitoring') => 'real_time_monitoring'
 */
export function pascalToSnake(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')           // 小写后跟大写，中间加下划线
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')     // 多个大写字母后跟大写+小写，中间加下划线
    .toLowerCase();
}

/**
 * camelCase 转 snake_case
 * @example
 * camelToSnake('userManagement') => 'user_management'
 * camelToSnake('realTimeMonitoring') => 'real_time_monitoring'
 */
export function camelToSnake(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

/**
 * 智能转换为 snake_case（自动检测输入格式）
 * @example
 * toSnakeCase('user-management') => 'user_management'
 * toSnakeCase('UserManagement') => 'user_management'
 * toSnakeCase('userManagement') => 'user_management'
 */
export function toSnakeCase(str) {
  if (!str) return '';

  // 如果包含短横线，认为是 kebab-case
  if (str.includes('-')) {
    return kebabToSnake(str);
  }

  // 如果包含大写字母，认为是 PascalCase 或 camelCase
  if (/[A-Z]/.test(str)) {
    return pascalToSnake(str);
  }

  // 否则原样返回
  return str;
}

/**
 * snake_case 转 kebab-case
 * @example
 * snakeToKebab('user_management') => 'user-management'
 */
export function snakeToKebab(str) {
  return str.replace(/_/g, '-');
}

/**
 * snake_case 转 PascalCase
 * @example
 * snakeToPascal('user_management') => 'UserManagement'
 */
export function snakeToPascal(str) {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * snake_case 转 camelCase
 * @example
 * snakeToCamel('user_management') => 'userManagement'
 */
export function snakeToCamel(str) {
  const pascal = snakeToPascal(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * PostCSS 插件：将 Vue 2 深度选择器转换为 Vue 3 格式
 *
 * 转换规则：
 * - >>> :deep()
 * - /deep/ :deep()
 * - ::v-deep :deep()
 */

module.exports = (opts = {}) => {
  return {
    postcssPlugin: 'vue3-deep-selector',

    Once(root, { result }) {
      // 遍历所有规则
      root.walkRules(rule => {
        // 处理选择器
        rule.selectors = rule.selectors.map(selector => {
          // 处理 >>> 选择器
          if (selector.includes('>>>')) {
            selector = selector.replace(/([a-zA-Z0-9_\-\[\]\:#\.]+)\s*>>>\s*/g, '$1 :deep(')
            // 修复未闭合的括号
            selector = selector.replace(/:deep\(([a-zA-Z0-9_\-\[\]\:#\.]+)\s*\{/g, ':deep($1) {')
          }

          // 处理 /deep/ 选择器
          if (selector.includes('/deep/')) {
            selector = selector.replace(/([a-zA-Z0-9_\-\[\]\:#\.]+)\s*\/deep\/\s*/g, '$1 :deep(')
            // 修复未闭合的括号
            selector = selector.replace(/:deep\(([a-zA-Z0-9_\-\[\]\:#\.]+)\s*\{/g, ':deep($1) {')
          }

          // 处理 ::v-deep 选择器
          if (selector.includes('::v-deep')) {
            // ::v-deep(.class) → :deep(.class)
            selector = selector.replace(/::v-deep\s*\(/g, ':deep(')
            // ::v-deep .class → :deep(.class)
            selector = selector.replace(/::v-deep\s+([a-zA-Z0-9_\-\[\]\:#\.]+)(?=\s*\{)/g, ':deep($1)')
          }

          return selector
        })
      })
    }
  }
}

module.exports.postcss = true

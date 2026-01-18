import { ref } from 'vue'

/**
 * 租户导出 Composable
 * 统一使用后端API进行导出，支持选中项导出和筛选条件导出
 */
export function useTenantExport() {
  const exporting = ref(false)

  /**
   * 导出租户数据（使用后端API）
   * @param {Object} options - 导出选项
   * @param {Array<string>} options.selectedCodes - 选中的租户编码（如果有选中项）
   * @param {Object} options.searchConditions - 搜索条件（如果没有选中项）
   */
  const exportTenants = async ({ selectedCodes, searchConditions }) => {
    exporting.value = true
    try {
      let exportUrl = '/api/v1/rbac/tenants/export'
      const params = new URLSearchParams()

      // 如果有选中项，优先导出选中的数据
      if (selectedCodes && selectedCodes.length > 0) {
        selectedCodes.forEach(code => {
          params.append('tenant_ids', code)
        })
      } else {
        // 否则按搜索条件导出
        if (searchConditions) {
          if (searchConditions.tenant_id) {
            params.append('tenant_id', searchConditions.tenant_id)
          }
          if (searchConditions.tenant_name) {
            params.append('tenant_name', searchConditions.tenant_name)
          }
          if (searchConditions.company_name) {
            params.append('company_name', searchConditions.company_name)
          }
          if (searchConditions.status !== null && searchConditions.status !== '') {
            params.append('status', searchConditions.status)
          }
        }
      }

      // 添加查询参数
      if (params.toString()) {
        exportUrl += '?' + params.toString()
      }

      // 创建临时链接触发下载
      const link = document.createElement('a')
      link.href = exportUrl
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return { success: true, message: '租户信息导出成功' }
    } catch (error) {
      console.error('导出失败:', error)
      return { success: false, message: `导出失败: ${error.message || '未知错误'}` }
    } finally {
      exporting.value = false
    }
  }

  return {
    exporting,
    exportTenants
  }
}

import { ref } from 'vue'
import RBACService from '@/components/service/RBACService'

/**
 * 岗位导出 Composable
 * 负责导出岗位数据
 */
export function usePositionExport() {
  const exporting = ref(false)

  /**
   * 格式化状态
   * @param {number} status - 状态值 (1=正常, 0=停用)
   */
  function formatStatus(status) {
    return status === 1 ? '正常' : '停用'
  }

  /**
   * 导出岗位数据
   * @param {Object} searchConditions - 搜索条件
   * @param {Array} selectedPositions - 选中的岗位
   * @param {Object} exportOptions - 导出选项
   */
  const exportPositions = async (searchConditions = {}, selectedPositions = [], exportOptions = {}) => {
    exporting.value = true
    try {
      let positionsToExport = []

      // 根据导出范围获取数据
      if (exportOptions.range === 'selected' && selectedPositions.length > 0) {
        positionsToExport = selectedPositions
      } else {
        // 获取所有符合条件的数据
        const params = {
          skip: 0,
          limit: 10000,
          ...searchConditions
        }

        const response = await RBACService.getPositions(params)
        if (response && response.data && Array.isArray(response.data.items)) {
          positionsToExport = exportOptions.range === 'current'
            ? response.data.items.slice(0, searchConditions.limit || 10)
            : response.data.items
        } else {
          throw new Error('获取导出数据失败')
        }
      }

      if (positionsToExport.length === 0) {
        return { success: false, message: '没有数据可导出' }
      }

      // 根据选择的字段过滤数据
      const fields = exportOptions.fields || [
        'position_code', 'category_code', 'position_name',
        'department', 'order_num', 'status', 'create_time'
      ]

      // 字段显示名称映射
      const fieldLabels = {
        position_code: '岗位编码',
        category_code: '类别编码',
        position_name: '岗位名称',
        department: '部门',
        order_num: '排序',
        status: '状态',
        create_time: '创建时间'
      }

      // CSV 表头
      const headers = fields.map(f => fieldLabels[f] || f)

      // CSV 数据行
      const rows = positionsToExport.map(position => {
        return fields.map(field => {
          let value = position[field]
          if (field === 'status') {
            value = formatStatus(value)
          }
          return value !== undefined && value !== null ? String(value) : ''
        })
      })

      // 生成CSV内容（添加BOM以支持中文）
      const BOM = '\uFEFF'
      const csvContent = BOM + [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // 创建Blob并下载
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
      link.setAttribute('download', `岗位数据_${timestamp}.${exportOptions.format || 'csv'}`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return { success: true, message: `成功导出 ${positionsToExport.length} 条岗位数据` }
    } catch (error) {
      console.error('导出岗位数据失败:', error)
      throw error
    } finally {
      exporting.value = false
    }
  }

  return {
    exporting,
    exportPositions
  }
}

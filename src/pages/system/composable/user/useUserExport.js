import { ref } from 'vue'
import RBACService from '@/components/service/RBACService'

/**
 * 用户导出 Composable
 * 负责导出用户数据为CSV文件
 */
export function useUserExport() {
  const exporting = ref(false)

  /**
   * 格式化日期
   * @param {string} dateString - 日期字符串
   */
  function formatDate(dateString) {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * 格式化性别
   * @param {number} gender - 性别值
   */
  function formatGender(gender) {
    const genderMap = {
      0: '未知',
      1: '男',
      2: '女'
    }
    return genderMap[gender] || '未知'
  }

  /**
   * 格式化状态
   * @param {number} status - 状态值 (0=启用, 1=停用)
   */
  function formatStatus(status) {
    return status === 0 ? '启用' : '停用'
  }

  /**
   * 导出用户数据为CSV
   * @param {Object} searchConditions - 搜索条件（用于筛选导出数据）
   * @param {Array} selectedUsers - 选中的用户（如果有选中，优先导出选中项）
   */
  const exportUsers = async (searchConditions = {}, selectedUsers = []) => {
    exporting.value = true
    try {
      let usersToExport = []

      // 如果有选中的用户，优先导出选中项
      if (selectedUsers.length > 0) {
        usersToExport = selectedUsers
      } else {
        // 否则导出符合搜索条件的所有数据
        const params = {
          skip: 0,
          limit: 10000, // 获取所有数据
          ...searchConditions
        }

        const response = await RBACService.getUsers(params)
        if (response && response.data && Array.isArray(response.data.items)) {
          usersToExport = response.data.items
        } else {
          throw new Error('获取导出数据失败')
        }
      }

      if (usersToExport.length === 0) {
        return { success: false, message: '没有数据可导出' }
      }

      // CSV 表头
      const headers = [
        '用户名称',
        '用户昵称',
        '手机号码',
        '邮箱',
        '部门',
        '状态',
        '创建时间',
        '性别',
        '岗位'
      ]

      // CSV 数据行
      const rows = usersToExport.map(user => [
        user.user_name || '',
        user.nick_name || '',
        user.phone || '',
        user.email || '',
        user.department || '-',
        formatStatus(user.status),
        formatDate(user.create_time),
        formatGender(user.gender),
        user.position || '-'
      ])

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
      link.setAttribute('download', `用户数据_${timestamp}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return { success: true, message: `成功导出 ${usersToExport.length} 条用户数据` }
    } catch (error) {
      console.error('导出用户数据失败:', error)
      throw error
    } finally {
      exporting.value = false
    }
  }

  return {
    exporting,
    exportUsers
  }
}

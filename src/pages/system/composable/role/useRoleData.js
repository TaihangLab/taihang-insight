import { ref, computed } from 'vue'
import RBACService from '@/components/service/RBACService'

/**
 * 角色数据管理 Composable
 * 负责角色列表的获取、创建、更新、删除等数据操作
 */
export function useRoleData() {
  // 状态
  const roles = ref([])
  const total = ref(0)
  const loading = ref(false)

  // 计算属性
  const hasData = computed(() => roles.value.length > 0)

  /**
   * 获取角色列表
   * @param {Object} params - 查询参数
   * @param {number} params.skip - 跳过记录数
   * @param {number} params.limit - 每页数量
   * @param {string} params.sort_by - 排序字段
   * @param {string} params.order - 排序方向 (asc/desc)
   * @param {string} params.role_name - 角色名称
   * @param {string} params.role_code - 角色代码
   * @param {number} params.status - 状态 (0=启用, 1=禁用)
   */
  const fetchRoles = async (params = {}) => {
    loading.value = true
    try {
      // 添加按修改时间倒序排列的参数
      const queryParams = {
        ...params,
        sort_by: 'updated_at',  // 按修改时间排序
        order: 'desc'           // 倒序排列
      }

      const response = await RBACService.getRoles(queryParams)
      if (response && response.data && Array.isArray(response.data.items)) {
        roles.value = response.data.items.map(item => ({
          id: item.id,
          role_id: item.id,
          role_name: item.role_name,
          role_code: item.role_code,
          description: item.description || '',
          status: item.status,
          remarks: item.remarks || '',
          permissions: item.permissions || []
        }))
        total.value = response.data.total || response.data.items.length || 0
      } else {
        throw new Error('API返回格式异常')
      }
    } catch (error) {
      console.error('获取角色列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建角色
   * @param {Object} data - 角色数据
   */
  const createRole = async (data) => {
    loading.value = true
    try {
      await RBACService.createRole(data)
      return { success: true, message: '角色创建成功' }
    } catch (error) {
      console.error('创建角色失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新角色
   * @param {string|number} roleId - 角色ID
   * @param {Object} data - 更新数据
   */
  const updateRole = async (roleId, data) => {
    loading.value = true
    try {
      await RBACService.updateRole(roleId, data)
      return { success: true, message: '角色信息修改成功' }
    } catch (error) {
      console.error('更新角色失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除角色（批量）
   * @param {Array} roleIds - 角色ID数组
   */
  const deleteRoles = async (roleIds) => {
    loading.value = true
    try {
      await RBACService.deleteRoles(roleIds)
      return { success: true, message: '删除成功' }
    } catch (error) {
      console.error('删除角色失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 清空数据
   */
  const clearData = () => {
    roles.value = []
    total.value = 0
  }

  return {
    // 状态
    roles,
    total,
    loading,
    hasData,

    // 方法
    fetchRoles,
    createRole,
    updateRole,
    deleteRoles,
    clearData
  }
}

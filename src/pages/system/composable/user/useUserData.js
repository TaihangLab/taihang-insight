import { ref, computed } from 'vue'
import RBACService from '@/components/service/RBACService'

/**
 * 用户数据管理 Composable
 * 负责用户列表的获取、创建、更新、删除、重置密码等数据操作
 */
export function useUserData() {
  // 状态
  const users = ref([])
  const total = ref(0)
  const loading = ref(false)

  // 计算属性
  const hasData = computed(() => users.value.length > 0)

  /**
   * 获取用户列表
   * @param {Object} params - 查询参数
   * @param {number} params.skip - 跳过记录数
   * @param {number} params.limit - 每页数量
   * @param {string} params.user_name - 用户名称
   * @param {string} params.nick_name - 用户昵称
   * @param {string} params.phone - 手机号码
   * @param {number} params.status - 状态 (0=启用, 1=禁用)
   * @param {string} params.dept_id - 部门ID
   * @param {string} params.position_code - 岗位代码
   * @param {number} params.gender - 性别
   * @param {string} params.tenant_id - 租户代码
   */
  const fetchUsers = async (params) => {
    loading.value = true
    try {
      const queryParams = {
        ...params,
      }

      const response = await RBACService.getUsers(queryParams)
      if (response && response.data && Array.isArray(response.data.items)) {
        // 将API返回的数据映射到表格期望的字段
        users.value = response.data.items.map(item => ({
          id: item.id,
          tenant_id: item.tenant_id,
          user_name: item.user_name,
          nick_name: item.nick_name,
          email: item.email,
          phone: item.phone,
          status: item.status,
          create_time: formatDate(item.create_time),
          department: item.department || '-',
          dept_id: item.dept_id,
          position: item.position,
          position_code: item.position_code,
          gender: item.gender !== undefined && item.gender !== null ? item.gender : 0
        }))
        total.value = response.data.total || response.data.items.length || 0
      } else {
        throw new Error('API返回格式异常')
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建用户
   * @param {Object} data - 用户数据
   */
  const createUser = async (data) => {
    loading.value = true
    try {
      await RBACService.createUser(data)
      return { success: true, message: '用户添加成功' }
    } catch (error) {
      console.error('创建用户失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新用户
   * @param {string|number} userId - 用户ID
   * @param {Object} data - 更新数据
   */
  const updateUser = async (userId, data) => {
    loading.value = true
    try {
      await RBACService.updateUser(userId, data)
      return { success: true, message: '用户信息修改成功' }
    } catch (error) {
      console.error('更新用户失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除用户（批量）
   * @param {Array} userIds - 用户ID数组
   */
  const deleteUsers = async (userIds) => {
    loading.value = true
    try {
      await RBACService.deleteUsers(userIds)
      return { success: true, message: '删除成功' }
    } catch (error) {
      console.error('删除用户失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 重置用户密码
   * @param {string|number} userId - 用户ID
   * @param {string} newPassword - 新密码
   */
  const resetUserPassword = async (userId, newPassword) => {
    loading.value = true
    try {
      await RBACService.resetUserPassword(userId, newPassword)
      return { success: true, message: '密码重置成功' }
    } catch (error) {
      console.error('重置密码失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

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
   * 清空数据
   */
  const clearData = () => {
    users.value = []
    total.value = 0
  }

  return {
    // 状态
    users,
    total,
    loading,
    hasData,

    // 方法
    fetchUsers,
    createUser,
    updateUser,
    deleteUsers,
    resetUserPassword,
    clearData
  }
}

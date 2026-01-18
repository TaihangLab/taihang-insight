import { ref } from 'vue'
import RBACService from '@/components/service/RBACService'
import UserService from '@/components/service/UserService'

/**
 * 权限数据管理 Composable
 * 负责权限树的获取、创建、更新、删除等数据操作
 */
export function usePermissionData() {
  // 状态
  const permissionTree = ref([])
  const loading = ref(false)

  /**
   * 获取当前用户的租户编码
   * 注意：权限管理功能与租户无关，此函数仅保留用于兼容性
   */
  function getTenantCode() {
    // 权限管理功能与租户无关，返回 null 或不传递租户参数
    return null
  }

  /**
   * 加载权限树
   */
  const fetchPermissionTree = async () => {
    loading.value = true
    try {
      // 权限管理功能与租户无关，不传递租户参数
      const response = await RBACService.getPermissionTree({})
      permissionTree.value = response.data || []
    } catch (error) {
      console.error('加载权限树失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建权限节点
   * @param {Object} data - 权限数据
   */
  const createPermission = async (data) => {
    loading.value = true
    try {
      // 权限管理功能与租户无关，不设置租户参数
      await RBACService.createPermissionNode(data)
      return { success: true, message: '创建成功' }
    } catch (error) {
      console.error('创建权限失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新权限节点
   * @param {string|number} nodeId - 节点ID
   * @param {Object} data - 更新数据
   */
  const updatePermission = async (nodeId, data) => {
    loading.value = true
    try {
      await RBACService.updatePermissionNode(nodeId, data)
      return { success: true, message: '更新成功' }
    } catch (error) {
      console.error('更新权限失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除权限节点
   * @param {string|number} nodeId - 节点ID
   * @param {boolean} recursive - 是否递归删除子节点
   */
  const deletePermission = async (nodeId, recursive = true) => {
    loading.value = true
    try {
      await RBACService.deletePermissionNode(nodeId, recursive)
      return { success: true, message: '删除成功' }
    } catch (error) {
      console.error('删除权限失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 清空数据
   */
  const clearData = () => {
    permissionTree.value = []
  }

  return {
    // 状态
    permissionTree,
    loading,

    // 方法
    fetchPermissionTree,
    createPermission,
    updatePermission,
    deletePermission,
    clearData,
    getTenantCode
  }
}

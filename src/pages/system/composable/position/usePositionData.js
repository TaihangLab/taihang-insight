import { ref, computed } from 'vue'
import RBACService from '@/components/service/RBACService'

/**
 * 岗位数据管理 Composable
 * 负责岗位列表的获取、创建、更新、删除等数据操作
 */
export function usePositionData() {
  // 状态
  const positions = ref([])
  const total = ref(0)
  const loading = ref(false)

  // 计算属性
  const hasData = computed(() => positions.value.length > 0)

  /**
   * 获取岗位列表
   * @param {Object} params - 查询参数
   * @param {number} params.skip - 跳过记录数
   * @param {number} params.limit - 每页数量
   * @param {string} params.position_name - 岗位名称
   * @param {string} params.department - 部门
   * @param {number} params.status - 状态 (0=启用, 1=停用)
   * @param {string|number} params.tenant_id - 租户ID (bigint)
   */
  const fetchPositions = async (params) => {
    loading.value = true
    try {
      const queryParams = {
        ...params,
      }

      const response = await RBACService.getPositions(queryParams)
      if (response && response.data && Array.isArray(response.data.items)) {
        // 映射数据库字段到前端使用的格式
        positions.value = response.data.items.map(item => ({
          // 数据库字段（bigint ID）
          id: item.id,
          tenant_id: item.tenant_id,
          position_name: item.position_name,
          department: item.department,
          order_num: item.order_num || 0,
          status: item.status,       // 0=启用, 1=停用
          remark: item.remark,
          // 时间字段
          create_time: item.create_time,
          update_time: item.update_time
        }))
        total.value = response.data.total || response.data.items.length || 0
      } else {
        throw new Error('API返回格式异常')
      }
    } catch (error) {
      console.error('获取岗位列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建岗位
   * @param {Object} data - 岗位数据
   */
  const createPosition = async (data) => {
    loading.value = true
    try {
      await RBACService.createPosition(data)
      return { success: true, message: '岗位添加成功' }
    } catch (error) {
      console.error('创建岗位失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新岗位
   * @param {string|number} positionId - 岗位ID (bigint)
   * @param {Object} data - 更新数据
   */
  const updatePosition = async (positionId, data) => {
    loading.value = true
    try {
      await RBACService.updatePosition(positionId, data)
      return { success: true, message: '岗位信息修改成功' }
    } catch (error) {
      console.error('更新岗位失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除岗位
   * @param {string|number} positionId - 岗位ID (bigint)
   */
  const deletePosition = async (positionId) => {
    loading.value = true
    try {
      await RBACService.deletePosition(positionId)
      return { success: true, message: '岗位删除成功' }
    } catch (error) {
      console.error('删除岗位失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 批量删除岗位
   * @param {Array} positions - 岗位数组
   */
  const deletePositions = async (positions) => {
    loading.value = true
    try {
      for (const position of positions) {
        await RBACService.deletePosition(position.id)
      }
      return { success: true, message: `成功删除 ${positions.length} 个岗位` }
    } catch (error) {
      console.error('批量删除岗位失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 清空数据
   */
  const clearData = () => {
    positions.value = []
    total.value = 0
  }

  return {
    // 状态
    positions,
    total,
    loading,
    hasData,

    // 方法
    fetchPositions,
    createPosition,
    updatePosition,
    deletePosition,
    deletePositions,
    clearData
  }
}

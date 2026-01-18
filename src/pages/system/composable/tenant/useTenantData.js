import { ref, computed } from 'vue'
import RBACService from '@/components/service/RBACService'

/**
 * 租户数据管理 Composable
 * 负责租户列表的获取、状态切换、删除等数据操作
 */
export function useTenantData() {
  // 状态
  const tenants = ref([])
  const total = ref(0)
  const loading = ref(false)

  // 计算属性
  const hasData = computed(() => tenants.value.length > 0)

  /**
   * 获取租户列表
   * @param {Object} params - 查询参数
   * @param {number} params.skip - 跳过记录数
   * @param {number} params.limit - 每页数量
   * @param {string} params.sort_by - 排序字段
   * @param {string} params.order - 排序方向 (asc/desc)
   * @param {string} params.tenant_id - 租户编号
   * @param {string} params.tenant_name - 租户名称
   * @param {string} params.company_name - 企业名称
   * @param {number} params.status - 租户状态 (0=启用, 1=停用)
   */
  const fetchTenants = async (params) => {
    loading.value = true
    try {
      // 添加按修改时间倒序排列的参数
      const queryParams = {
        ...params,
        sort_by: 'updated_at',  // 按修改时间排序
        order: 'desc'           // 倒序排列
      }

      const response = await RBACService.getTenants(queryParams)
      if (response && response.data && Array.isArray(response.data.items)) {
        tenants.value = response.data.items
        total.value = response.data.total || response.data.items.length || 0
      } else {
        throw new Error('API返回格式异常')
      }
    } catch (error) {
      console.error('获取租户列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换租户状态
   * @param {Object} tenant - 租户对象
   */
  const toggleTenantStatus = async (tenant) => {
    loading.value = true
    try {
      const statusValue = tenant.status
      const tenantId = tenant.tenant_id || tenant.id
      if (!tenantId) {
        throw new Error('租户ID不能为空')
      }
      await RBACService.updateTenant(tenantId, { status: statusValue })
      const statusText = statusValue === 0 ? '启用' : '停用'
      return { success: true, message: `租户状态已${statusText}`, updatedTenant: { ...tenant, status: statusValue } }
    } catch (error) {
      console.error('更新租户状态失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除单个租户
   * @param {string} tenantCode - 租户编码
   */
  const deleteTenant = async (tenantCode) => {
    loading.value = true
    try {
      if (!tenantCode) {
        throw new Error('租户ID不能为空')
      }
      await RBACService.deleteTenant(tenantCode)
      return { success: true, message: '租户删除成功' }
    } catch (error) {
      console.error('删除租户失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 批量删除租户
   * @param {Array<string>} tenantCodes - 租户编码数组
   */
  const batchDeleteTenants = async (tenantCodes) => {
    loading.value = true
    try {
      await RBACService.batchDeleteTenants(tenantCodes)
      return { success: true, message: '批量删除成功' }
    } catch (error) {
      console.error('批量删除租户失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 清空数据
   */
  const clearData = () => {
    tenants.value = []
    total.value = 0
  }

  return {
    // 状态
    tenants,
    total,
    loading,
    hasData,

    // 方法
    fetchTenants,
    toggleTenantStatus,
    deleteTenant,
    batchDeleteTenants,
    clearData
  }
}

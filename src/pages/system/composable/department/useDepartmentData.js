import { ref, computed } from 'vue'
import RBACService from '@/components/service/RBACService'

/**
 * 部门数据管理 Composable
 * 负责部门列表的获取、创建、更新、删除等数据操作
 */
export function useDepartmentData() {
  // 状态
  const departments = ref([])
  const loading = ref(false)
  const parentDeptOptions = ref([])

  // 计算属性
  const hasData = computed(() => departments.value.length > 0)

  /**
   * 获取部门列表（树形结构）
   * @param {Object} params - 查询参数
   * @param {string} params.name - 部门名称
   * @param {string} params.id - 部门ID
   * @param {number} params.status - 状态 (0=启用, 1=停用)
   * @param {string} params.tenant_id - 租户编码
   */
  const fetchDepartments = async (params) => {
    loading.value = true
    try {
      const queryParams = {
        ...params,
      }

      const response = await RBACService.getDepartmentTree(queryParams)
      if (response && response.data) {
        // 安全地提取部门数据，支持多种返回格式
        let extractedDepartments = [];

        // 检查是否为分页格式 (response.data.items)
        if (response.data.items !== undefined) {
          extractedDepartments = Array.isArray(response.data.items) ? response.data.items : [];
        }
        // 检查是否为直接数组格式 (response.data)
        else if (Array.isArray(response.data)) {
          extractedDepartments = response.data;
        }
        // 如果都不是，抛出错误
        else {
          console.warn('API返回格式不符合预期:', response.data);
          throw new Error('API返回格式异常');
        }

        // 映射数据库字段到前端使用的格式
        departments.value = extractedDepartments.map(dept => ({
          // 数据库字段（bigint ID）
          id: dept.id,
          tenant_id: dept.tenant_id,
          name: dept.name,
          parent_id: dept.parent_id,
          path: dept.path,           // Materialized Path
          depth: dept.depth,         // 深度
          sort_order: dept.sort_order || 0, // 排序
          status: dept.status,       // 0=启用, 1=禁用
          // 时间字段
          create_time: dept.create_time,
          update_time: dept.update_time,
          // 子节点（树形结构）
          children: dept.children || []
        }));
      } else {
        throw new Error('API返回格式异常');
      }
      // 同时更新上级部门选项，传递租户ID
      await fetchParentDeptOptions(params.tenant_id)
    } catch (error) {
      console.error('获取部门列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取上级部门选项
   */
  const fetchParentDeptOptions = async (tenantId) => {
    try {
      const params = tenantId ? { tenant_id: tenantId } : {};
      const response = await RBACService.getDepartmentTree(params)

      console.log('部门树形结构:', response.data);
      
      let depts = [];

      // 安全地提取部门数据，支持多种返回格式
      if (response && response.data) {
        if (response.data.items !== undefined) {
          depts = Array.isArray(response.data.items) ? response.data.items : [];
        } else if (Array.isArray(response.data)) {
          depts = response.data;
        }
      }

      // 递归转换数据，确保所有 id 都是数字类型
      const convertToNumber = (nodes) => {
        return nodes.map(node => ({
          ...node,
          id: parseInt(node.id),
          parent_id: node.parent_id !== null && node.parent_id !== undefined 
            ? parseInt(node.parent_id) 
            : null,
          children: node.children && node.children.length > 0 
            ? convertToNumber(node.children) 
            : []
        }));
      };

      // 转换数据类型
      const convertedDepts = convertToNumber(depts);

      // 添加"无上级部门"选项（id为0）
      const noneOption = {
        id: 0,
        name: '无上级部门',
        parent_id: null,
        children: []
      };

      parentDeptOptions.value = [noneOption, ...convertedDepts];
      console.log('转换后的上级部门选项:', parentDeptOptions.value);
      
      return parentDeptOptions.value;

    } catch (error) {
      console.error('获取上级部门选项失败:', error)
      throw error
    }
  }

  /**
   * 创建部门
   * @param {Object} data - 部门数据
   */
  const createDepartment = async (data) => {
    loading.value = true
    try {
      await RBACService.createDepartment(data)
      return { success: true, message: '新增成功' }
    } catch (error) {
      console.error('创建部门失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新部门
   * @param {string|number} deptId - 部门ID (bigint)
   * @param {Object} data - 更新数据
   */
  const updateDepartment = async (deptId, data) => {
    loading.value = true
    try {
      await RBACService.updateDepartment(deptId, data)
      return { success: true, message: '修改成功' }
    } catch (error) {
      console.error('更新部门失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除部门
   * @param {string|number} deptId - 部门ID (bigint)
   */
  const deleteDepartment = async (deptId) => {
    loading.value = true
    try {
      await RBACService.deleteDepartment(deptId)
      return { success: true, message: '删除成功' }
    } catch (error) {
      console.error('删除部门失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 清空数据
   */
  const clearData = () => {
    departments.value = []
    parentDeptOptions.value = []
  }

  return {
    // 状态
    departments,
    loading,
    parentDeptOptions,
    hasData,

    // 方法
    fetchDepartments,
    fetchParentDeptOptions,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    clearData
  }
}

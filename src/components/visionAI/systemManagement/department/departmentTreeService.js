/**
 * 部门树CRUD操作服务
 * 提供部门的增删改查及树形结构操作功能
 */
import RBACService from '@/components/service/RBACService';
import { Message } from 'element-ui';

export default class DepartmentTreeService {
  /**
   * 获取部门列表
   * @param {Object} params - 查询参数
   * @returns {Promise}
   */
  static async getDepartments(params = {}) {
    try {
      const response = await RBACService.getDepartments(params);
      return response;
    } catch (error) {
      console.error('获取部门列表失败:', error);
      Message.error('获取部门列表失败');
      throw error;
    }
  }

  /**
   * 获取部门树
   * @param {string} tenantId - 租户ID
   * @returns {Promise}
   */
  static async getDepartmentTree(tenantId) {
    try {
      // 通过API获取部门树结构
      const response = await RBACService.getDepartmentTree();

      // 如果后端返回的是扁平列表（Materialized Path结构），需要转换为树形结构
      if (response.data && Array.isArray(response.data.items)) {
        // 使用Materialized Path服务转换数据
        const MaterializedPathTreeService = (await import('./materializedPathTreeService')).default;
        const treeData = MaterializedPathTreeService.buildTreeFromMaterializedPath(
          response.data.items,
          'id',
          'ancestors',
          'children'
        );

        // 返回包含树形结构的对象
        return {
          ...response,
          data: {
            ...response.data,
            tree: treeData
          }
        };
      }

      return response;
    } catch (error) {
      console.error('获取部门树失败:', error);
      Message.error('获取部门树失败');
      throw error;
    }
  }

  /**
   * 创建部门
   * @param {Object} departmentData - 部门数据
   * @returns {Promise}
   */
  static async createDepartment(departmentData) {
    try {
      const response = await RBACService.createDepartment(departmentData);
      Message.success('部门创建成功');
      return response;
    } catch (error) {
      console.error('创建部门失败:', error);
      Message.error(error.message || '创建部门失败');
      throw error;
    }
  }

  /**
   * 更新部门
   * @param {string} deptCode - 部门编码
   * @param {Object} departmentData - 部门数据
   * @param {string} tenantId - 租户ID
   * @returns {Promise}
   */
  static async updateDepartment(deptCode, departmentData, tenantId) {
    try {
      const response = await RBACService.updateDepartment(deptCode, {
        ...departmentData,
        tenantCode: tenantId
      });
      Message.success('部门更新成功');
      return response;
    } catch (error) {
      console.error('更新部门失败:', error);
      Message.error(error.message || '更新部门失败');
      throw error;
    }
  }

  /**
   * 删除部门
   * @param {string} deptCode - 部门编码
   * @param {string} tenantId - 租户ID
   * @returns {Promise}
   */
  static async deleteDepartment(deptCode, tenantId) {
    try {
      const response = await RBACService.deleteDepartment(deptCode, tenantId);
      Message.success('部门删除成功');
      return response;
    } catch (error) {
      console.error('删除部门失败:', error);
      Message.error(error.message || '删除部门失败');
      throw error;
    }
  }

  /**
   * 更新部门状态
   * @param {string} deptCode - 部门编码
   * @param {string} tenantId - 租户ID
   * @param {number} status - 状态值
   * @returns {Promise}
   */
  static async updateDepartmentStatus(deptCode, tenantId, status) {
    try {
      // 注意：这里假设后端有专门的更新状态API
      // 如果没有，可以使用updateDepartment方法
      const response = await RBACService.updateDepartment(deptCode, {
        status: status,
        tenantCode: tenantId
      });
      Message.success(status === 1 ? '部门已启用' : '部门已停用');
      return response;
    } catch (error) {
      console.error('更新部门状态失败:', error);
      Message.error(error.message || '更新部门状态失败');
      throw error;
    }
  }

  /**
   * 将扁平列表转换为树形结构
   * @param {Array} list - 扁平列表
   * @param {string} idField - ID字段名
   * @param {string} parentIdField - 父ID字段名
   * @param {string} childrenField - 子节点字段名
   * @returns {Array} 树形结构
   */
  static buildTreeFromList(
    list, 
    idField = 'id', 
    parentIdField = 'parentId', 
    childrenField = 'children'
  ) {
    if (!Array.isArray(list) || list.length === 0) {
      return [];
    }

    // 创建一个映射，便于快速查找
    const map = {};
    const roots = [];

    // 首先将所有项目放入映射
    for (let i = 0; i < list.length; i++) {
      map[list[i][idField]] = {
        ...list[i],
        [childrenField]: []
      };
    }

    // 然后将每个项目添加到其父级的children数组中
    for (let i = 0; i < list.length; i++) {
      const node = map[list[i][idField]];
      const parentId = list[i][parentIdField];

      if (parentId === 0 || parentId === null || parentId === undefined) {
        // 如果没有父级，将其添加到根级
        roots.push(node);
      } else {
        // 否则，将其添加到父级的children数组中
        if (map[parentId]) {
          map[parentId][childrenField].push(node);
        }
      }
    }

    return roots;
  }

  /**
   * 将树形结构转换为扁平列表
   * @param {Array} tree - 树形结构
   * @param {string} childrenField - 子节点字段名
   * @returns {Array} 扁平列表
   */
  static flattenTree(tree, childrenField = 'children') {
    const result = [];

    function traverse(nodes, level = 0, parentPath = []) {
      for (const node of nodes) {
        // 复制节点并添加层级信息
        const flatNode = { ...node };
        flatNode.level = level;
        flatNode.path = [...parentPath, node.id];

        // 移除子节点并添加到结果中
        delete flatNode[childrenField];
        result.push(flatNode);

        // 递归处理子节点
        if (node[childrenField] && Array.isArray(node[childrenField])) {
          traverse(node[childrenField], level + 1, [...parentPath, node.id]);
        }
      }
    }

    traverse(tree);
    return result;
  }

  /**
   * 查找树中的节点
   * @param {Array} tree - 树形结构
   * @param {Function} predicate - 查找条件函数
   * @param {string} childrenField - 子节点字段名
   * @returns {Object|null} 找到的节点或null
   */
  static findTreeNode(tree, predicate, childrenField = 'children') {
    function search(nodes) {
      for (const node of nodes) {
        if (predicate(node)) {
          return node;
        }

        if (node[childrenField] && Array.isArray(node[childrenField])) {
          const found = search(node[childrenField]);
          if (found) return found;
        }
      }
      return null;
    }

    return search(tree);
  }

  /**
   * 在Materialized Path结构中移动节点
   * @param {string} nodeCode - 要移动的节点编码
   * @param {string} targetParentCode - 目标父节点编码
   * @param {string} tenantId - 租户ID
   * @returns {Promise}
   */
  static async moveNode(nodeCode, targetParentCode, tenantId) {
    try {
      // 从后端获取节点信息
      // 这里需要调用后端API来处理节点移动
      // 后端需要更新移动节点及其所有子节点的ancestors字段
      const response = await RBACService.moveDepartment(nodeCode, targetParentCode, tenantId);
      Message.success('节点移动成功');
      return response;
    } catch (error) {
      console.error('移动节点失败:', error);
      Message.error(error.message || '移动节点失败');
      throw error;
    }
  }

  /**
   * 计算节点的新ancestors路径
   * @param {string} targetParentAncestors - 目标父节点的ancestors
   * @param {string} targetParentId - 目标父节点ID
   * @returns {string} 新的ancestors路径
   */
  static calculateNewAncestors(targetParentAncestors, targetParentId) {
    if (!targetParentAncestors || targetParentAncestors === '') {
      return String(targetParentId);
    }
    return `${targetParentAncestors},${targetParentId}`;
  }

  /**
   * 查找节点的路径
   * @param {Array} tree - 树形结构
   * @param {any} nodeId - 节点ID
   * @param {string} idField - ID字段名
   * @param {string} childrenField - 子节点字段名
   * @returns {Array} 节点路径数组
   */
  static getNodePath(tree, nodeId, idField = 'id', childrenField = 'children') {
    function findPath(nodes, targetId, currentPath = []) {
      for (const node of nodes) {
        const newPath = [...currentPath, node[idField]];
        
        if (node[idField] == targetId) {
          return newPath;
        }
        
        if (node[childrenField] && Array.isArray(node[childrenField])) {
          const path = findPath(node[childrenField], targetId, newPath);
          if (path) return path;
        }
      }
      return null;
    }

    return findPath(tree, nodeId);
  }

  /**
   * 获取节点的深度
   * @param {Array} tree - 树形结构
   * @param {any} nodeId - 节点ID
   * @param {string} idField - ID字段名
   * @param {string} childrenField - 子节点字段名
   * @returns {number} 节点深度
   */
  static getNodeDepth(tree, nodeId, idField = 'id', childrenField = 'children') {
    const path = this.getNodePath(tree, nodeId, idField, childrenField);
    return path ? path.length - 1 : -1;
  }

  /**
   * 检查节点是否有子节点
   * @param {Object} node - 节点对象
   * @param {string} childrenField - 子节点字段名
   * @returns {boolean} 是否有子节点
   */
  static hasChildren(node, childrenField = 'children') {
    return node[childrenField] && Array.isArray(node[childrenField]) && node[childrenField].length > 0;
  }

  /**
   * 计算树的深度
   * @param {Array} tree - 树形结构
   * @param {string} childrenField - 子节点字段名
   * @returns {number} 树的最大深度
   */
  static getTreeDepth(tree, childrenField = 'children') {
    if (!Array.isArray(tree) || tree.length === 0) {
      return 0;
    }

    function calculateDepth(nodes, currentLevel = 0) {
      if (!nodes || nodes.length === 0) {
        return currentLevel;
      }

      let maxDepth = currentLevel;
      for (const node of nodes) {
        if (node[childrenField] && Array.isArray(node[childrenField])) {
          const depth = calculateDepth(node[childrenField], currentLevel + 1);
          maxDepth = Math.max(maxDepth, depth);
        }
      }

      return maxDepth;
    }

    return calculateDepth(tree);
  }

  /**
   * 获取树中所有节点的数量
   * @param {Array} tree - 树形结构
   * @param {string} childrenField - 子节点字段名
   * @returns {number} 节点总数
   */
  static getTreeSize(tree, childrenField = 'children') {
    let count = 0;

    function countNodes(nodes) {
      for (const node of nodes) {
        count++;
        if (node[childrenField] && Array.isArray(node[childrenField])) {
          countNodes(node[childrenField]);
        }
      }
    }

    countNodes(tree);
    return count;
  }
}
/**
 * Materialized Path 树结构处理服务
 * 用于处理后端返回的扁平化树结构数据
 */
export default class MaterializedPathTreeService {
  /**
   * 将Materialized Path扁平列表转换为树形结构
   * @param {Array} list - 扁平列表，每个节点包含id, parent_id, ancestors等字段
   * @param {string} idField - ID字段名
   * @param {string} ancestorsField - 祖先路径字段名
   * @param {string} childrenField - 子节点字段名
   * @returns {Array} 树形结构
   */
  static buildTreeFromMaterializedPath(
    list,
    idField = 'id',
    ancestorsField = 'ancestors',
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
      const item = list[i];
      map[item[idField]] = {
        ...item,
        [childrenField]: []
      };
    }

    // 根据ancestors字段建立父子关系
    for (let i = 0; i < list.length; i++) {
      const node = map[list[i][idField]];
      const ancestors = list[i][ancestorsField] ? list[i][ancestorsField].split(',') : [];
      
      if (ancestors.length === 0 || ancestors[0] === '') {
        // 如果没有祖先，说明是根节点
        roots.push(node);
      } else {
        // 否则，找到它的父节点并添加到父节点的children中
        const parent_id = ancestors[ancestors.length - 1]; // 最后一个祖先就是父节点
        if (map[parent_id]) {
          map[parent_id][childrenField].push(node);
        } else {
          // 如果找不到父节点，可能是数据不一致，暂时作为根节点处理
          roots.push(node);
        }
      }
    }

    return roots;
  }

  /**
   * 将树形结构转换为Materialized Path扁平列表
   * @param {Array} tree - 树形结构
   * @param {string} childrenField - 子节点字段名
   * @param {string} ancestorsField - 祖先路径字段名
   * @param {string} idField - ID字段名
   * @returns {Array} 扁平列表
   */
  static flattenTreeToMaterializedPath(
    tree,
    childrenField = 'children',
    ancestorsField = 'ancestors',
    idField = 'id'
  ) {
    const result = [];

    function traverse(nodes, parentPath = []) {
      for (const node of nodes) {
        // 复制节点并计算祖先路径
        const flatNode = { ...node };
        flatNode[ancestorsField] = parentPath.join(',');
        
        // 移除子节点
        delete flatNode[childrenField];
        result.push(flatNode);

        // 递归处理子节点
        if (node[childrenField] && Array.isArray(node[childrenField])) {
          traverse(node[childrenField], [...parentPath, node[idField]]);
        }
      }
    }

    traverse(tree);
    return result;
  }

  /**
   * 获取节点的层级深度
   * @param {string} ancestors - 祖先路径字符串，用逗号分隔
   * @returns {number} 节点深度
   */
  static getNodeLevel(ancestors) {
    if (!ancestors || ancestors === '') {
      return 0; // 根节点
    }
    return ancestors.split(',').length;
  }

  /**
   * 获取节点的完整路径
   * @param {Object} node - 节点对象
   * @param {Array} allNodes - 所有节点的扁平列表
   * @param {string} idField - ID字段名
   * @param {string} ancestorsField - 祖先字段名
   * @param {string} labelField - 标签字段名
   * @returns {Array} 路径数组
   */
  static getNodeFullPath(node, allNodes, idField = 'id', ancestorsField = 'ancestors', labelField = 'name') {
    const path = [{ id: node[idField], label: node[labelField] }];
    
    if (node[ancestorsField]) {
      const ancestorIds = node[ancestorsField].split(',').filter(id => id !== '');
      for (const ancestorId of ancestorIds) {
        const ancestorNode = allNodes.find(n => n[idField] === ancestorId);
        if (ancestorNode) {
          path.unshift({ id: ancestorNode[idField], label: ancestorNode[labelField] });
        }
      }
    }
    
    return path;
  }

  /**
   * 检查节点是否为另一个节点的祖先
   * @param {Object} ancestorNode - 可能的祖先节点
   * @param {Object} childNode - 可能的子节点
   * @param {string} idField - ID字段名
   * @param {string} ancestorsField - 祖先字段名
   * @returns {boolean} 是否为祖先关系
   */
  static isAncestor(ancestorNode, childNode, idField = 'id', ancestorsField = 'ancestors') {
    if (!childNode[ancestorsField]) {
      return false;
    }
    
    const childAncestors = childNode[ancestorsField].split(',');
    return childAncestors.includes(ancestorNode[idField]);
  }

  /**
   * 获取子树（包括指定节点的所有后代）
   * @param {Array} flatList - 扁平列表
   * @param {any} nodeId - 节点ID
   * @param {string} idField - ID字段名
   * @param {string} ancestorsField - 祖先字段名
   * @returns {Array} 子树的扁平列表
   */
  static getSubtree(flatList, nodeId, idField = 'id', ancestorsField = 'ancestors') {
    // 首先找到指定节点
    const rootNode = flatList.find(node => node[idField] === nodeId);
    if (!rootNode) {
      return [];
    }

    // 包含根节点本身
    const result = [rootNode];

    // 查找所有后代节点
    for (const node of flatList) {
      if (this.isAncestor(rootNode, node, idField, ancestorsField)) {
        result.push(node);
      }
    }

    return result;
  }

  /**
   * 获取节点的所有后代节点
   * @param {Array} flatList - 扁平列表
   * @param {any} nodeId - 节点ID
   * @param {string} idField - ID字段名
   * @param {string} ancestorsField - 祖先字段名
   * @returns {Array} 后代节点列表
   */
  static getDescendants(flatList, nodeId, idField = 'id', ancestorsField = 'ancestors') {
    return flatList.filter(node => {
      if (!node[ancestorsField]) {
        return false;
      }
      const ancestors = node[ancestorsField].split(',');
      return ancestors.includes(String(nodeId));
    });
  }

  /**
   * 获取节点的直接子节点
   * @param {Array} flatList - 扁平列表
   * @param {any} nodeId - 节点ID
   * @param {string} idField - ID字段名
   * @param {string} ancestorsField - 祖先字段名
   * @returns {Array} 直接子节点列表
   */
  static getDirectChildren(flatList, nodeId, idField = 'id', ancestorsField = 'ancestors') {
    return flatList.filter(node => {
      if (!node[ancestorsField]) {
        return String(nodeId) === '0'; // 根节点的直接子节点
      }
      
      const ancestors = node[ancestorsField].split(',');
      // 直接子节点的倒数第一个祖先应该是当前节点
      return ancestors.length > 0 && ancestors[ancestorsField].split(',')[ancestors.length - 1] === String(nodeId);
    });
  }
}
/**
 * 树形数据处理工具函数
 */

/**
 * 为树形数据计算每个节点的深度
 * @param {Array} treeData - 树形数据
 * @param {string} childrenField - 子节点字段名，默认为 'children'
 * @param {number} currentDepth - 当前层级，默认为 0
 * @returns {Array} 包含深度信息的树形数据
 */
export function calculateTreeDepth(treeData, childrenField = 'children', currentDepth = 0) {
  if (!Array.isArray(treeData)) {
    return treeData;
  }

  return treeData.map(node => {
    // 为当前节点添加深度信息
    const nodeWithDepth = {
      ...node,
      depth: currentDepth
    };

    // 如果当前节点有子节点，则递归处理子节点，深度加1
    if (node[childrenField] && Array.isArray(node[childrenField])) {
      nodeWithDepth[childrenField] = calculateTreeDepth(
        node[childrenField],
        childrenField,
        currentDepth + 1
      );
    }

    return nodeWithDepth;
  });
}

/**
 * 将扁平数据转换为树形结构并计算深度
 * @param {Array} flatData - 扁平数据
 * @param {string} idField - ID字段名
 * @param {string} parentIdField - 父ID字段名
 * @param {string} childrenField - 子节点字段名
 * @returns {Array} 包含深度信息的树形数据
 */
export function flatDataToTreeWithDepth(flatData, idField = 'id', parentIdField = 'parent_id', childrenField = 'children') {
  if (!Array.isArray(flatData) || flatData.length === 0) {
    return [];
  }

  // 构建树形结构
  const tree = buildTreeFromFlatData(flatData, idField, parentIdField, childrenField);
  
  // 计算深度
  return calculateTreeDepth(tree, childrenField);
}

/**
 * 将扁平数据转换为树形结构
 * @param {Array} flatData - 扁平数据
 * @param {string} idField - ID字段名
 * @param {string} parentIdField - 父ID字段名
 * @param {string} childrenField - 子节点字段名
 * @returns {Array} 树形数据
 */
function buildTreeFromFlatData(flatData, idField = 'id', parentIdField = 'parent_id', childrenField = 'children') {
  if (!Array.isArray(flatData) || flatData.length === 0) {
    return [];
  }

  // 创建一个映射，便于快速查找
  const map = {};
  const roots = [];

  // 首先将所有项目放入映射
  for (let i = 0; i < flatData.length; i++) {
    map[flatData[i][idField]] = {
      ...flatData[i],
      [childrenField]: []
    };
  }

  // 然后将每个项目添加到其父级的children数组中
  for (let i = 0; i < flatData.length; i++) {
    const node = map[flatData[i][idField]];
    const parent_id = flatData[i][parentIdField];

    if (parent_id === 0 || parent_id === null || parent_id === undefined) {
      // 如果没有父级，将其添加到根级
      roots.push(node);
    } else {
      // 否则，将其添加到父级的children数组中
      if (map[parent_id]) {
        map[parent_id][childrenField].push(node);
      }
    }
  }

  return roots;
}
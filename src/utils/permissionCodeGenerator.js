/**
 * 权限码生成器
 * 根据路由路径和节点类型自动生成权限码
 */

class PermissionCodeGenerator {
  /**
   * 将驼峰/帕斯卡命名转换为蛇形命名
   * @param {String} str - 输入字符串
   * @returns {String} 蛇形命名字符串
   */
  static toSnakeCase(str) {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }

  /**
   * 将蛇形命名转换为驼峰命名
   * @param {String} str - 输入字符串
   * @returns {String} 驼峰命名字符串
   */
  static toCamelCase(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  /**
   * 标准化路径段
   * 将路径段转换为标准格式（小写蛇形命名）
   * @param {String} segment - 路径段
   * @returns {String} 标准化后的路径段
   */
  static normalizeSegment(segment) {
    return this.toSnakeCase(segment).replace(/^\/+|\/+$/g, '');
  }

  /**
   * 从页面名称提取资源标识
   * 例如: userManagement -> user, roleManagement -> role
   * @param {String} pageName - 页面名称
   * @returns {String} 资源标识
   */
  static extractResource(pageName) {
    const normalized = this.normalizeSegment(pageName);
    // 移除常见的管理后缀
    const suffixes = ['_management', '_manage', 'ment', 'manage'];
    let resource = normalized;

    for (const suffix of suffixes) {
      if (resource.toLowerCase().endsWith(suffix)) {
        resource = resource.substring(0, resource.length - suffix.length);
        break;
      }
    }

    return resource || normalized;
  }

  /**
   * 根据路由路径生成权限码
   * 规则：模块:页面:操作
   * @param {String} routePath - 路由路径，如 /systemManage/userManagement
   * @param {String} nodeType - 节点类型：folder/menu/button
   * @param {String} action - 操作类型：view/read/create/update/delete等
   * @param {String} parentCode - 父节点权限码（用于生成子节点权限码）
   * @returns {String} 生成的权限码
   */
  static generateFromRoute(routePath, nodeType = 'menu', action = 'view', parentCode = null) {
    if (!routePath && !parentCode) {
      return '';
    }

    switch (nodeType) {
      case 'folder':
        // 文件夹：使用路径首段，如 /systemManage -> system:manage
        if (routePath) {
          const segments = routePath.split('/').filter(s => s);
          if (segments.length > 0) {
            return this.normalizeSegment(segments[0]);
          }
        }
        return '';

      case 'menu':
        // 菜单/页面：模块:资源:view
        // 如 /systemManage/userManagement -> system:user:view
        if (routePath) {
          const segments = routePath.split('/').filter(s => s);
          if (segments.length >= 2) {
            const module = this.normalizeSegment(segments[0]);
            const page = this.extractResource(segments[segments.length - 1]);
            return `${module}:${page}:view`;
          } else if (segments.length === 1) {
            return `${this.normalizeSegment(segments[0])}:view`;
          }
        } else if (parentCode) {
          // 基于父节点权限码生成
          const parts = parentCode.split(':');
          if (parts.length >= 1) {
            return `${parts[0]}:view`;
          }
        }
        return '';

      case 'button':
        // 按钮：模块:资源:操作
        // 如基于父节点 system:user:view -> system:user:create
        if (parentCode) {
          const parts = parentCode.split(':');
          if (parts.length >= 2) {
            // 移除最后的 view/action，替换为新的 action
            parts[parts.length - 1] = action;
            return parts.join(':');
          }
          return `${parentCode}:${action}`;
        }
        return '';

      default:
        return '';
    }
  }

  /**
   * 生成默认按钮权限码集合
   * @param {String} menuCode - 菜单权限码
   * @returns {Object} 按钮权限码对象
   */
  static generateButtonPermissions(menuCode) {
    const baseCode = menuCode.replace(':view', '');
    const buttons = {
      view: `${baseCode}:view`,
      read: `${baseCode}:read`,
      create: `${baseCode}:create`,
      update: `${baseCode}:update`,
      delete: `${baseCode}:delete`,
      export: `${baseCode}:export`,
      import: `${baseCode}:import`
    };

    // 特殊处理：如果菜单权限码不包含 :view，则直接追加操作
    if (!menuCode.includes(':')) {
      Object.keys(buttons).forEach(key => {
        buttons[key] = `${menuCode}:${key}`;
      });
    }

    return buttons;
  }

  /**
   * 验证权限码格式
   * @param {String} code - 权限码
   * @returns {Boolean} 是否有效
   */
  static validatePermissionCode(code) {
    if (!code || typeof code !== 'string') {
      return false;
    }
    // 权限码格式：由小写字母、数字、冒号、下划线组成
    return /^[a-z][a-z0-9:_]*$/.test(code);
  }

  /**
   * 从权限码推断节点类型
   * @param {String} code - 权限码
   * @returns {String} 节点类型：folder/menu/button
   */
  static inferNodeTypeFromCode(code) {
    if (!code) {
      return 'folder';
    }

    const parts = code.split(':');

    if (parts.length === 1) {
      return 'folder';
    } else if (parts.length === 2 || (parts.length === 3 && parts[2] === 'view')) {
      return 'menu';
    } else {
      return 'button';
    }
  }

  /**
   * 格式化权限码显示
   * @param {String} code - 权限码
   * @returns {String} 格式化后的权限码
   */
  static formatCodeDisplay(code) {
    if (!code) return '';

    return code
      .split(':')
      .map(part => this.toCamelCase(part))
      .join(' : ');
  }
}

export default PermissionCodeGenerator;

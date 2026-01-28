/**
 * 太行视觉AI平台 - 权限配置基础数据
 * 用于系统权限管理和菜单控制
 */

// 页面级权限映射配置
export const PAGE_PERMISSIONS: Record<string, string> = {
  // 监控预警模块
  '/monitoring/realtime': 'monitor:realtime:page',
  '/monitoring/statistics': 'monitor:statistics:page',
  '/monitoring/warningArchive': 'monitor:warning:archive',
  '/monitoring/warningManage': 'monitor:warning:manage',
  '/monitoring/intelligentReview': 'monitor:review:intelligent',

  // 设备配置模块
  '/deviceManage/camera': 'device:camera:page',
  '/deviceManage/cameraManagement': 'device:camera:manage',
  '/deviceManage/localVideo': 'device:video:page',

  // 模型管理模块
  '/modelManage/modelList': 'model:list:page',

  // 技能管理模块
  '/skillManage/deviceSkills': 'skill:device:page',
  '/skillManage/multimodalLlmSkills': 'skill:multimodal:page',
  '/skillManage/multimodalCreateDetail': 'skill:create:page',
  '/skillManage/multimodalReview': 'skill:review:page',
  '/skillManage/multimodalReviewCreate': 'skill:review:create',

  // 系统管理模块
  '/systemManage/appSettings': 'system:setting:page',
  '/systemManage/userManagement': 'system:user:page',
  '/systemManage/roleManagement': 'system:role:page',
  '/systemManage/permissionManagement': 'system:permission:page',
  '/systemManage/tenantManagement': 'system:tenant:page',
  '/systemManage/departmentManagement': 'system:department:page',
  '/systemManage/positionManagement': 'system:position:page',
  '/systemManage/knowledgeBase': 'system:knowledge:page',
  '/systemManage/profile': 'system:profile:page',

  // 可视中心模块
  '/visualCenter': 'visual:center:page',
  '/algorithmInference': 'algorithm:inference:page',
  '/visualCenter/parkManagement': 'park:management:page',

  // 智能控制模块
  '/intelligentControl/logRecord': 'control:log:page',

  // 边缘管理模块
  '/edgeManage/edgeServer': 'edge:server:page',
  '/edgeManage/edgeBox': 'edge:box:page'
};

// 按钮级权限映射配置
export const BUTTON_PERMISSIONS: Record<string, string> = {
  // 通用操作权限
  'add': 'common:add',
  'edit': 'common:edit',
  'delete': 'common:delete',
  'query': 'common:query',
  'export': 'common:export',
  'import': 'common:import',

  // 用户管理按钮权限
  'user:add': 'system:user:add',
  'user:edit': 'system:user:edit',
  'user:delete': 'system:user:delete',
  'user:query': 'system:user:query',
  'user:export': 'system:user:export',
  'user:import': 'system:user:import',
  'user:resetpwd': 'system:user:resetpwd',

  // 角色管理按钮权限
  'role:add': 'system:role:add',
  'role:edit': 'system:role:edit',
  'role:delete': 'system:role:delete',
  'role:query': 'system:role:query',
  'role:export': 'system:role:export',
  'role:assign': 'system:role:assign',

  // 权限管理按钮权限
  'permission:add': 'system:permission:add',
  'permission:edit': 'system:permission:edit',
  'permission:delete': 'system:permission:delete',
  'permission:query': 'system:permission:query',
  'permission:export': 'system:permission:export',

  // 设备管理按钮权限
  'device:add': 'device:manage:add',
  'device:edit': 'device:manage:edit',
  'device:delete': 'device:manage:delete',
  'device:control': 'device:manage:control',
  'device:query': 'device:manage:query',
  'device:export': 'device:manage:export',

  // 监控预警按钮权限
  'monitor:handle': 'monitor:alarm:handle',
  'monitor:review': 'monitor:alarm:review',
  'monitor:export': 'monitor:data:export',
  'monitor:query': 'monitor:data:query',

  // 模型管理按钮权限
  'model:add': 'model:manage:add',
  'model:edit': 'model:manage:edit',
  'model:delete': 'model:manage:delete',
  'model:deploy': 'model:manage:deploy',
  'model:query': 'model:manage:query',

  // 技能管理按钮权限
  'skill:add': 'skill:manage:add',
  'skill:edit': 'skill:manage:edit',
  'skill:delete': 'skill:manage:delete',
  'skill:enable': 'skill:manage:enable',
  'skill:disable': 'skill:manage:disable'
};

// 数据级权限配置
export const DATA_PERMISSIONS: Record<string, string> = {
  // 数据权限范围
  'all': 'data:scope:all',           // 全部数据权限
  'dept': 'data:scope:dept',         // 本部门数据权限
  'dept_sub': 'data:scope:dept_sub', // 本部门及以下数据权限
  'self': 'data:scope:self',         // 仅本人数据权限
  'custom': 'data:scope:custom'      // 自定义数据权限
};

// 菜单项接口
export interface MenuItem {
  id: string;
  path?: string;
  index?: string;
  title: string;
  icon?: string;
  permission?: string;
  children?: MenuItem[];
}

// 菜单结构配置（用于动态菜单生成）
export const MENU_STRUCTURE: MenuItem[] = [
  {
    id: 'monitoring',
    index: '/monitoring',
    title: '监控预警',
    icon: 'el-icon-video-camera',
    children: [
      { id: 'realtime', path: '/monitoring/realtime', title: '实时监控', permission: 'monitor:realtime:page' },
      { id: 'statistics', path: '/monitoring/statistics', title: '统计分析', permission: 'monitor:statistics:page' },
      { id: 'warningArchive', path: '/monitoring/warningArchive', title: '预警档案', permission: 'monitor:warning:archive' },
      { id: 'warningManage', path: '/monitoring/warningManage', title: '预警管理', permission: 'monitor:warning:manage' },
      { id: 'intelligentReview', path: '/monitoring/intelligentReview', title: '智能复判', permission: 'monitor:review:intelligent' }
    ]
  },
  {
    id: 'deviceManage',
    index: '/deviceManage',
    title: '设备配置',
    icon: 'el-icon-cpu',
    children: [
      { id: 'camera', path: '/deviceManage/camera', title: '摄像头', permission: 'device:camera:page' },
      { id: 'localVideo', path: '/deviceManage/localVideo', title: '本地视频', permission: 'device:video:page' }
    ]
  },
  {
    id: 'modelManage',
    index: '/modelManage',
    title: '模型管理',
    icon: 'el-icon-data-analysis',
    children: [
      { id: 'modelList', path: '/modelManage/modelList', title: '模型列表', permission: 'model:list:page' }
    ]
  },
  {
    id: 'skillManage',
    index: '/skillManage',
    title: '技能管理',
    icon: 'el-icon-magic-stick',
    children: [
      { id: 'deviceSkills', path: '/skillManage/deviceSkills', title: '视觉模型技能', permission: 'skill:device:page' },
      { id: 'multimodalLlmSkills', path: '/skillManage/multimodalLlmSkills', title: '多模态大模型技能', permission: 'skill:multimodal:page' },
      { id: 'multimodalReview', path: '/skillManage/multimodalReview', title: '多模态大模型复判', permission: 'skill:review:page' }
    ]
  },
  {
    id: 'systemManage',
    index: '/systemManage',
    title: '系统管理',
    icon: 'el-icon-setting',
    children: [
      { id: 'appSettings', path: '/systemManage/appSettings', title: '应用设置', permission: 'system:setting:page' },
      { id: 'userManagement', path: '/systemManage/userManagement', title: '用户管理', permission: 'system:user:page' },
      { id: 'roleManagement', path: '/systemManage/roleManagement', title: '角色管理', permission: 'system:role:page' },
      { id: 'permissionManagement', path: '/systemManage/permissionManagement', title: '权限管理', permission: 'system:permission:page' },
      { id: 'tenantManagement', path: '/systemManage/tenantManagement', title: '租户管理', permission: 'system:tenant:page' },
      { id: 'departmentManagement', path: '/systemManage/departmentManagement', title: '部门管理', permission: 'system:department:page' },
      { id: 'positionManagement', path: '/systemManage/positionManagement', title: '岗位管理', permission: 'system:position:page' },
      { id: 'knowledgeBase', path: '/systemManage/knowledgeBase', title: '知识库管理', permission: 'system:knowledge:page' }
    ]
  },
  {
    id: 'visualAI',
    index: '/visualAI',
    title: '可视中心',
    icon: 'el-icon-view',
    children: [
      { id: 'visualCenter', path: '/visualCenter', title: '可视中心首页', permission: 'visual:center:page' },
      { id: 'algorithmInference', path: '/algorithmInference', title: '算法推理平台', permission: 'algorithm:inference:page' },
      { id: 'parkManagement', path: '/visualCenter/parkManagement', title: '园区封闭管理平台', permission: 'park:management:page' }
    ]
  },
  {
    id: 'intelligentControl',
    index: '/intelligentControl',
    title: '智能控制',
    icon: 'el-icon-s-operation',
    children: [
      { id: 'logRecord', path: '/intelligentControl/logRecord', title: '日志记录', permission: 'control:log:page' }
    ]
  },
  {
    id: 'edgeManage',
    index: '/edgeManage',
    title: '边缘管理',
    icon: 'el-icon-share',
    children: [
      { id: 'edgeServer', path: '/edgeManage/edgeServer', title: '边缘服务器', permission: 'edge:server:page' },
      { id: 'edgeBox', path: '/edgeManage/edgeBox', title: '边缘盒子', permission: 'edge:box:page' }
    ]
  }
];

// 权限验证工具类
export class PermissionChecker {
  private userPermissions: Set<string>;

  constructor(userPermissions: string[] = []) {
    this.userPermissions = new Set(userPermissions);
  }

  // 检查页面权限
  hasPagePermission(path: string): boolean {
    const permission = PAGE_PERMISSIONS[path];
    return permission ? this.userPermissions.has(permission) : true;
  }

  // 检查按钮权限
  hasButtonPermission(buttonKey: string): boolean {
    const permission = BUTTON_PERMISSIONS[buttonKey];
    return permission ? this.userPermissions.has(permission) : false;
  }

  // 检查数据权限
  hasDataPermission(scope: string): boolean {
    const permission = DATA_PERMISSIONS[scope];
    return permission ? this.userPermissions.has(permission) : false;
  }

  // 检查多个权限（或的关系）
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.userPermissions.has(permission));
  }

  // 检查多个权限（与的关系）
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.userPermissions.has(permission));
  }

  // 更新用户权限
  updatePermissions(permissions: string[]): void {
    this.userPermissions = new Set(permissions);
  }
}

// 默认权限配置（开发环境使用）
export const DEFAULT_PERMISSIONS: string[] = [
  // 系统基础权限
  'common:query',
  'common:add',
  'common:edit',

  // 页面访问权限
  'monitor:realtime:page',
  'monitor:statistics:page',
  'device:camera:page',
  'system:user:page',
  'system:role:page',
  'system:permission:page',
  'visual:center:page',

  // 按钮操作权限
  'system:user:add',
  'system:user:edit',
  'system:user:query',
  'system:role:add',
  'system:role:edit',
  'system:role:query',
  'system:permission:add',
  'system:permission:edit',
  'system:permission:query'
];

// 权限分组接口
export interface PermissionGroup {
  name: string;
  icon: string;
  permissions: string[];
}

// 权限分组配置（用于界面展示）
export const PERMISSION_GROUPS: Record<string, PermissionGroup> = {
  system: {
    name: '系统管理',
    icon: 'el-icon-setting',
    permissions: [
      'system:setting:page',
      'system:user:page',
      'system:role:page',
      'system:permission:page',
      'system:tenant:page',
      'system:department:page',
      'system:position:page',
      'system:knowledge:page',
      'system:profile:page'
    ]
  },
  monitor: {
    name: '监控预警',
    icon: 'el-icon-video-camera',
    permissions: [
      'monitor:realtime:page',
      'monitor:statistics:page',
      'monitor:warning:archive',
      'monitor:warning:manage',
      'monitor:review:intelligent'
    ]
  },
  device: {
    name: '设备管理',
    icon: 'el-icon-cpu',
    permissions: [
      'device:camera:page',
      'device:camera:manage',
      'device:video:page'
    ]
  },
  model: {
    name: '模型管理',
    icon: 'el-icon-data-analysis',
    permissions: [
      'model:list:page'
    ]
  },
  skill: {
    name: '技能管理',
    icon: 'el-icon-magic-stick',
    permissions: [
      'skill:device:page',
      'skill:multimodal:page',
      'skill:create:page',
      'skill:review:page',
      'skill:review:create'
    ]
  },
  visual: {
    name: '可视中心',
    icon: 'el-icon-view',
    permissions: [
      'visual:center:page',
      'algorithm:inference:page',
      'park:management:page'
    ]
  },
  edge: {
    name: '边缘管理',
    icon: 'el-icon-share',
    permissions: [
      'edge:server:page',
      'edge:box:page'
    ]
  },
  control: {
    name: '智能控制',
    icon: 'el-icon-s-operation',
    permissions: [
      'control:log:page'
    ]
  }
};

export default {
  PAGE_PERMISSIONS,
  BUTTON_PERMISSIONS,
  DATA_PERMISSIONS,
  MENU_STRUCTURE,
  PermissionChecker,
  DEFAULT_PERMISSIONS,
  PERMISSION_GROUPS
};

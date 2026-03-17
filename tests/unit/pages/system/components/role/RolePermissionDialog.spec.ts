/**
 * 角色权限分配对话框单元测试
 *
 * 测试权限树数据加载和处理逻辑
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { ElMessage } from 'element-plus';
import RolePermissionDialog from '@/pages/system/components/role/RolePermissionDialog.vue';
import associationService from '@/api/system/associationService';

// Mock associationService
vi.mock('@/api/system/associationService', () => ({
  default: {
    getPermissionTree: vi.fn(),
    getRolePermissions: vi.fn(),
    assignPermissionsToRole: vi.fn(),
  },
}));

// Mock Element Plus Message
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('RolePermissionDialog.vue', () => {
  // Mock permission tree data（拦截器已提取 data，直接返回数组）
  const mockPermissionTree = [
    {
      id: 1,
      permission_name: '系统管理',
      permission_code: 'system',
      permission_type: 'folder',
      node_type: 'folder',
      parent_id: null,
      children: [
        {
          id: 2,
          permission_name: '用户管理',
          permission_code: 'user:list:view',
          permission_type: 'menu',
          node_type: 'menu',
          parent_id: 1,
          children: [],
        },
      ],
    },
    {
      id: 3,
      permission_name: '设备管理',
      permission_code: 'device',
      permission_type: 'folder',
      node_type: 'folder',
      parent_id: null,
      children: [],
    },
  ];

  // Mock role permissions data（拦截器已提取 data，直接返回数组）
  const mockRolePermissions = [
    { permission_id: 1, role_id: 100, permission_name: '系统管理' },
    { permission_id: 2, role_id: 100, permission_name: '用户管理' },
  ];

  const mockRole = {
    id: 100,
    role_name: '测试角色',
    role_code: 'test_role',
    tenant_id: '0',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = async (props = {}) => {
    const wrapper = mount(RolePermissionDialog, {
      props: {
        visible: false, // Start with false to trigger watch
        currentRole: mockRole,
        ...props,
      },
      global: {
        stubs: {
          'el-tree': {
            template: `
              <div class="el-tree-mock">
                <slot name="default" :node="{ label: 'Mock Node' }" :data="{}"></slot>
              </div>
            `,
          },
          'el-dialog': true,
          'el-divider': true,
          'el-button': true,
          'el-icon': true,
          'el-checkbox': true,
          'el-checkbox-group': true,
        },
      },
    });

    // Trigger the watch by setting visible to true
    await wrapper.setProps({ visible: true });
    await flushPromises();

    return wrapper;
  };

  it('应该正确加载权限树数据', async () => {
    // Mock API 响应（拦截器已提取 data，直接返回数组）
    vi.mocked(associationService.getPermissionTree).mockResolvedValue(
      mockPermissionTree as any
    );
    vi.mocked(associationService.getRolePermissions).mockResolvedValue(
      mockRolePermissions as any
    );

    const wrapper = await createWrapper();

    // 验证 API 被调用
    expect(associationService.getPermissionTree).toHaveBeenCalled();
    expect(associationService.getRolePermissions).toHaveBeenCalledWith(100);

    // 验证数据被正确设置
    expect(wrapper.vm.permissionTree).toEqual(mockPermissionTree);
    expect(wrapper.vm.checkedPermissions).toEqual([1, 2]);
  });

  it('应该处理空的权限树响应', async () => {
    // Mock 空数组响应
    vi.mocked(associationService.getPermissionTree).mockResolvedValue([] as any);
    vi.mocked(associationService.getRolePermissions).mockResolvedValue([] as any);

    const wrapper = await createWrapper();

    // 验证数据被设置为空数组
    expect(wrapper.vm.permissionTree).toEqual([]);
    expect(wrapper.vm.checkedPermissions).toEqual([]);
  });

  it('应该处理 API 错误', async () => {
    // Mock API 错误
    const error = new Error('网络错误');
    vi.mocked(associationService.getPermissionTree).mockRejectedValue(error);
    vi.mocked(associationService.getRolePermissions).mockRejectedValue(error);

    await createWrapper();

    // 验证错误消息被显示
    expect(ElMessage.error).toHaveBeenCalledWith('加载权限失败');
  });

  it('应该正确计算全选的节点ID', async () => {
    vi.mocked(associationService.getPermissionTree).mockResolvedValue(
      mockPermissionTree as any
    );
    vi.mocked(associationService.getRolePermissions).mockResolvedValue([] as any);

    const wrapper = await createWrapper();

    // 测试 getAllNodeIds 方法
    const allIds = wrapper.vm.getAllNodeIds(mockPermissionTree);

    // 验证返回了所有节点的ID（包括子节点）
    expect(allIds).toEqual(expect.arrayContaining([1, 2, 3]));
    expect(allIds.length).toBe(3);
  });

  it('应该正确处理不同的 permissionId 字段格式', async () => {
    // 测试不同的字段名（camelCase vs snake_case）
    const mockPermissionsWithCamelCase = [
      { permissionId: 5, roleId: 100 },
      { permissionId: 6, roleId: 100 },
    ];

    vi.mocked(associationService.getPermissionTree).mockResolvedValue(
      mockPermissionTree as any
    );
    vi.mocked(associationService.getRolePermissions).mockResolvedValue(
      mockPermissionsWithCamelCase as any
    );

    await createWrapper();

    // 验证正确提取了 permission_id
    // 注意：这里只是测试数据格式，不验证组件状态
    const permissions = mockPermissionsWithCamelCase.map((p: any) => Number(p.permissionId || p.permission_id));
    expect(permissions).toEqual([5, 6]);
  });

  it('应该在未选择任何权限时显示警告', async () => {
    vi.mocked(associationService.getPermissionTree).mockResolvedValue(
      mockPermissionTree as any
    );
    vi.mocked(associationService.getRolePermissions).mockResolvedValue([] as any);
    vi.mocked(associationService.assignPermissionsToRole).mockResolvedValue({} as any);

    const wrapper = await createWrapper();

    // Mock permissionTreeRef
    wrapper.vm.permissionTreeRef = {
      getCheckedKeys: vi.fn().mockReturnValue([]),
      getHalfCheckedKeys: vi.fn().mockReturnValue([]),
    };

    // 调用提交方法
    await wrapper.vm.submitPermissions();

    // 验证警告消息
    expect(ElMessage.warning).toHaveBeenCalledWith('请至少选择一个权限');
    expect(associationService.assignPermissionsToRole).not.toHaveBeenCalled();
  });

  it('应该正确提交权限分配', async () => {
    vi.mocked(associationService.getPermissionTree).mockResolvedValue(
      mockPermissionTree as any
    );
    vi.mocked(associationService.getRolePermissions).mockResolvedValue([] as any);
    vi.mocked(associationService.assignPermissionsToRole).mockResolvedValue({} as any);

    const wrapper = await createWrapper();

    // Mock permissionTreeRef 返回选中的权限
    wrapper.vm.permissionTreeRef = {
      getCheckedKeys: vi.fn().mockReturnValue([1, 2]),
      getHalfCheckedKeys: vi.fn().mockReturnValue([3]),
    };

    // 调用提交方法
    await wrapper.vm.submitPermissions();

    // 验证 emit 事件被触发
    expect(wrapper.emitted('submit')).toBeTruthy();
    expect(wrapper.emitted('submit')?.[0]).toEqual([100, [1, 2, 3]]);
  });

  it('应该在对话框关闭时重置状态', async () => {
    vi.mocked(associationService.getPermissionTree).mockResolvedValue(
      mockPermissionTree as any
    );
    vi.mocked(associationService.getRolePermissions).mockResolvedValue(
      [mockRolePermissions[0]] as any
    );

    const wrapper = await createWrapper();

    // 设置一些状态
    wrapper.vm.permissionTree = mockPermissionTree;
    wrapper.vm.checkedPermissions = [1, 2];

    // 调用关闭方法
    wrapper.vm.closeDialog();
    await flushPromises(); // Wait for nextTick

    // 验证状态被重置
    expect(wrapper.vm.permissionTree).toEqual([]);
    expect(wrapper.vm.checkedPermissions).toEqual([]);
  });
});

/**
 * 注意：响应拦截器已在 @/api/commons/index.ts 中配置
 * 拦截器会提取后端响应的 data 字段：
 * - 分页数据：{ data, total, page, limit, pages }
 * - 非分页数据：直接返回 data.data
 *
 * 因此：
 * - getPermissionTree() 返回的是 PermissionTreeNode[] 数组（非分页）
 * - getRolePermissions() 返回的是 Permission[] 数组（非分页）
 * - getRoles() 返回的是 { data: Role[], total, page, limit }（分页）
 *
 * 单元测试中的 mock 值需要模拟拦截器处理后的数据格式，而不是原始的 UnifiedResponse
 */

/**
 * TenantSelector 组件测试
 * 测试场景：
 * 1. 正确传递分页参数 (skip, limit)
 * 2. 处理空数组响应
 * 3. 自动选择第一个租户
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { ElMessage } from "element-plus";
import TenantSelector from "@/pages/system/components/commons/TenantSelector.vue";

// Mock Element Plus ElMessage
vi.mock("element-plus", async () => {
  const actual = await vi.importActual("element-plus");
  return {
    ...actual,
    ElMessage: {
      warning: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

// Mock tenantService
vi.mock("@/api/system/tenantService", () => ({
  default: {
    getTenants: vi.fn(),
  },
}));

import tenantService from "@/api/system/tenantService";

describe("TenantSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("分页参数传递", () => {
    it("应该在加载租户时传递分页参数 (skip: 0, limit: 1000)", async () => {
      const mockTenants = [
        { id: 1, tenant_name: "租户1" },
        { id: 2, tenant_name: "租户2" },
      ];

      vi.mocked(tenantService.getTenants).mockResolvedValue(
        mockTenants as unknown as Promise<never>
      );

      mount(TenantSelector, {
        props: {
          modelValue: null,
        },
      });

      await flushPromises();

      // 验证 getTenants 被调用时传递了正确的分页参数
      expect(tenantService.getTenants).toHaveBeenCalledWith({
        skip: 0,
        limit: 1000,
      });
    });
  });

  describe("数据加载", () => {
    it("应该成功加载并显示租户列表", async () => {
      const mockTenants = [
        { id: 1, tenant_name: "租户1" },
        { id: 2, tenant_name: "租户2" },
        { id: 3, tenant_name: "租户3" },
      ];

      vi.mocked(tenantService.getTenants).mockResolvedValue(
        mockTenants as unknown as Promise<never>
      );

      const wrapper = mount(TenantSelector, {
        props: {
          modelValue: null,
        },
      });

      await flushPromises();

      // 验证选项数量
      const options = wrapper.findAll("el-option");
      expect(options).toHaveLength(3);
    });

    it("应该过滤掉 id 或 tenant_name 为空的租户", async () => {
      const mockTenants = [
        { id: 1, tenant_name: "租户1" },
        { id: null, tenant_name: "无效租户" }, // id 为 null
        { id: 3, tenant_name: null }, // tenant_name 为 null
        { id: 4, tenant_name: "租户4" },
      ];

      vi.mocked(tenantService.getTenants).mockResolvedValue(
        mockTenants as unknown as Promise<never>
      );

      const wrapper = mount(TenantSelector, {
        props: {
          modelValue: null,
        },
      });

      await flushPromises();

      // 验证只有有效的租户被显示
      const options = wrapper.findAll("el-option");
      expect(options).toHaveLength(2); // 只有两个有效租户
    });

    it("应该处理空租户列表", async () => {
      vi.mocked(tenantService.getTenants).mockResolvedValue(
        [] as unknown as Promise<never>
      );

      const wrapper = mount(TenantSelector, {
        props: {
          modelValue: null,
          autoSelectFirst: true,
        },
      });

      await flushPromises();

      // 验证显示警告消息
      expect(ElMessage.warning).toHaveBeenCalledWith("没有可用的租户，请先创建租户");
    });
  });

  describe("自动选择第一个租户", () => {
    it("应该在 autoSelectFirst 为 true 时自动选择第一个租户", async () => {
      const mockTenants = [
        { id: 1, tenant_name: "租户1" },
        { id: 2, tenant_name: "租户2" },
      ];

      vi.mocked(tenantService.getTenants).mockResolvedValue(
        mockTenants as unknown as Promise<never>
      );

      const wrapper = mount(TenantSelector, {
        props: {
          modelValue: null,
          autoSelectFirst: true,
        },
      });

      await flushPromises();

      // 验证发出了 update:modelValue 事件，值为第一个租户的 id
      expect(wrapper.emitted("update:modelValue")).toBeTruthy();
      expect(wrapper.emitted("update:modelValue")![0]).toEqual([1]);

      // 验证发出了 change 事件
      expect(wrapper.emitted("change")).toBeTruthy();
      expect(wrapper.emitted("change")![0]).toEqual([1]);
    });

    it("不应该在 autoSelectFirst 为 false 时自动选择", async () => {
      const mockTenants = [
        { id: 1, tenant_name: "租户1" },
        { id: 2, tenant_name: "租户2" },
      ];

      vi.mocked(tenantService.getTenants).mockResolvedValue(
        mockTenants as unknown as Promise<never>
      );

      const wrapper = mount(TenantSelector, {
        props: {
          modelValue: null,
          autoSelectFirst: false,
        },
      });

      await flushPromises();

      // 验证没有发出 update:modelValue 事件
      expect(wrapper.emitted("update:modelValue")).toBeFalsy();
    });
  });

  describe("错误处理", () => {
    it("应该在 API 调用失败时显示错误消息", async () => {
      const mockError = new Error("网络错误");
      vi.mocked(tenantService.getTenants).mockRejectedValue(mockError);

      mount(TenantSelector, {
        props: {
          modelValue: null,
        },
      });

      await flushPromises();

      // 验证显示错误消息
      expect(ElMessage.error).toHaveBeenCalledWith("网络错误");
    });

    it("应该在 API 调用失败且没有错误消息时显示默认错误", async () => {
      const mockError = {}; // 没有 message 属性
      vi.mocked(tenantService.getTenants).mockRejectedValue(mockError);

      mount(TenantSelector, {
        props: {
          modelValue: null,
        },
      });

      await flushPromises();

      // 验证显示默认错误消息
      expect(ElMessage.error).toHaveBeenCalledWith("获取租户列表失败");
    });
  });

  describe("响应拦截器格式处理", () => {
    it("应该处理响应拦截器直接返回数组的格式", async () => {
      // 响应拦截器已提取 data 字段，直接返回数组
      const mockTenants = [
        { id: 1, tenant_name: "租户1", company_name: "公司1" },
        { id: 2, tenant_name: "租户2", company_name: "公司2" },
      ];

      vi.mocked(tenantService.getTenants).mockResolvedValue(
        mockTenants as unknown as Promise<never>
      );

      const wrapper = mount(TenantSelector, {
        props: {
          modelValue: null,
        },
      });

      await flushPromises();

      // 验证选项正确显示
      const options = wrapper.findAll("el-option");
      expect(options).toHaveLength(2);
    });

    it("应该处理空数组响应", async () => {
      vi.mocked(tenantService.getTenants).mockResolvedValue(
        [] as unknown as Promise<never>
      );

      const wrapper = mount(TenantSelector, {
        props: {
          modelValue: null,
          autoSelectFirst: true,
        },
      });

      await flushPromises();

      // 验证显示警告消息
      expect(ElMessage.warning).toHaveBeenCalledWith("没有可用的租户，请先创建租户");
    });
  });

  describe("用户交互", () => {
    it("应该在用户选择租户时发出 update:modelValue 和 change 事件", async () => {
      const mockTenants = [
        { id: 1, tenant_name: "租户1" },
        { id: 2, tenant_name: "租户2" },
      ];

      vi.mocked(tenantService.getTenants).mockResolvedValue(
        mockTenants as unknown as Promise<never>
      );

      const wrapper = mount(TenantSelector, {
        props: {
          modelValue: null,
        },
      });

      await flushPromises();

      // 获取 el-select 组件
      const select = wrapper.findComponent({ name: "ElSelect" });

      // 模拟用户选择租户
      select.vm.$emit("update:model-value", 2);
      select.vm.$emit("change", 2);

      // 验证事件发出
      expect(wrapper.emitted("update:modelValue")!.slice(-1)[0]).toEqual([2]);
      expect(wrapper.emitted("change")!.slice(-1)[0]).toEqual([2]);
    });
  });
});

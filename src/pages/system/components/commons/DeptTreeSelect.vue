<!--
  DeptTreeSelect - 部门树级联选择器组件

  功能特性：
  - 支持部门树级联选择（多级部门）
  - 自动根据租户ID加载部门数据
  - 支持按状态过滤部门（默认只显示启用部门）
  - 自动转换API数据格式（name -> label）
  - 支持自定义级联选择器配置

  使用示例：
  <DeptTreeSelect
    v-model="formValue.dept_id"
    :tenant-id="formValue.tenant_id"
    :status="0"
    placeholder="选择部门"
    custom-style="width: 200px;"
  />

  API端点：
  GET /api/v1/rbac/depts/tree?status={status}&tenant_id={tenantId}

  注意事项：
  - tenantId 为必填项
  - status: 0=启用, 1=停用，默认为0
  - 返回值为数组，表示选择的部门路径
-->
<template>
  <el-cascader
    v-model="innerValue"
    :options="treeData"
    :props="cascaderProps"
    :placeholder="placeholder"
    :clearable="clearable"
    :disabled="disabled"
    :style="customStyle"
    @change="handleChange"
  />
</template>

<script>
import RBACService from '@/components/service/RBACService';

export default {
  name: 'DeptTreeSelect',

  props: {
    // v-model 绑定值（数组格式，表示部门路径）
    value: {
      type: [Array, String, Number],
      default: () => []
    },
    // 租户ID（必填）
    tenantId: {
      type: [String, Number],
      required: true
    },
    // 部门状态过滤（默认0表示只获取启用的部门，1表示获取停用的部门）
    status: {
      type: Number,
      default: 0
    },
    // 占位文本
    placeholder: {
      type: String,
      default: '选择部门'
    },
    // 是否可清空
    clearable: {
      type: Boolean,
      default: true
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    },
    // 自定义样式
    customStyle: {
      type: [String, Object],
      default: ''
    },
    // 级联选择器配置（可覆盖默认配置）
    props: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    return {
      treeData: [],
      loading: false,
      loaded: false  // 标记部门树数据是否已加载
    };
  },

  computed: {
    innerValue: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit('input', val);
      }
    },

    cascaderProps() {
      return {
        value: 'id',
        label: 'label',
        children: 'children',
        checkStrictly: true,
        expandTrigger: 'hover',
        // 自定义显示格式：编码 - 名称
        renderFormat: (labels, selectedOptions) => {
          return selectedOptions.map(option => {
            return `${option.code} - ${option.label}`;
          }).join('/');
        },
        ...this.props
      };
    }
  },

  watch: {
    tenantId: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.fetchDepartmentTree();
        } else {
          this.treeData = [];
        }
      }
    },

    status: {
      handler() {
        if (this.tenantId) {
          this.fetchDepartmentTree();
        }
      }
    }
  },

  methods: {
    // 获取部门树数据
    async fetchDepartmentTree() {
      if (!this.tenantId) {
        this.treeData = [];
        return;
      }

      this.loading = true;
      try {
        const response = await RBACService.getDepartmentTreeByTenantAndStatus(
          this.tenantId,
          this.status
        );
        this.treeData = this.transformDeptTree(response.data);
        this.loaded = true;
      } catch (error) {
        console.error('获取部门树失败:', error);
        this.$message.error(`获取部门树失败: ${error.message}`);
        this.treeData = [];
      } finally {
        this.loading = false;
      }
    },

    // 转换部门树数据：API返回的name字段转为label（级联选择器需要）
    transformDeptTree(depts) {
      if (!Array.isArray(depts)) return [];
      return depts.map(dept => ({
        id: parseInt(dept.id),  // 确保是数字类型
        label: dept.name,  // name -> label
        code: dept.id,     // 使用ID作为编码
        children: dept.children ? this.transformDeptTree(dept.children) : []
      }));
    },

    // 处理选择变化
    handleChange(value) {
      this.$emit('change', value);
    },

    // 刷新部门树（供外部调用）
    refresh() {
      this.loaded = false;
      this.fetchDepartmentTree();
    }
  }
};
</script>

<style scoped>
/* 可根据需要添加样式 */
</style>

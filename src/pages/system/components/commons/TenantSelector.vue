<template>
  <el-select
    :value="value"
    :placeholder="placeholder"
    :clearable="clearable"
    :style="customStyle"
    @change="handleChange"
    @focus="loadTenantsIfNeeded">
    <el-option
      v-for="tenant in tenants"
      :key="getTenantValue(tenant)"
      :label="tenant.tenant_name"
      :value="getTenantValue(tenant)">
    </el-option>
  </el-select>
</template>

<script>
import RBACService from '@/components/service/RBACService'

export default {
  name: 'TenantSelector',
  props: {
    value: {
      type: [Number, String],
      default: null
    },
    placeholder: {
      type: String,
      default: '请选择租户'
    },
    clearable: {
      type: Boolean,
      default: true
    },
    customStyle: {
      type: Object,
      default: () => ({ width: '200px' })
    },
    autoSelectFirst: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      tenants: [],
      loaded: false  // 标记租户数据是否已加载
    }
  },
  async mounted() {
    // 在mounted阶段确保租户列表已加载
    await this.loadTenantsIfNeeded()
  },
  methods: {
    async loadTenants() {
      if (this.loaded) return  // 如果已经加载过，直接返回

      try {
        const response = await RBACService.getTenants()
        if (response && response.data && Array.isArray(response.data.items)) {
          this.tenants = response.data.items
          this.loaded = true

          // 如果需要自动选择第一个租户且当前没有选中租户
          if (this.autoSelectFirst && (this.value === null || this.value === undefined || this.value === '') && this.tenants.length > 0) {
            const firstTenantCode = this.getTenantValue(this.tenants[0])
            this.$emit('input', firstTenantCode)  // 更新v-model绑定的值
            this.$emit('change', firstTenantCode) // 触发change事件
          } else if (this.autoSelectFirst && (this.value === null || this.value === undefined || this.value === '') && this.tenants.length === 0) {
            // 如果启用了自动选择但没有租户，发出警告
            console.warn('没有可用的租户，请先创建租户')
            this.$message({
              message: '没有可用的租户，请先创建租户',
              type: 'warning'
            })
          }
        }
      } catch (error) {
        console.error('获取租户列表失败:', error)
        this.$message({
          message: error.message || '获取租户列表失败',
          type: 'error'
        })
      }
    },
    
    async loadTenantsIfNeeded() {
      // 只有在尚未加载租户数据时才加载
      if (!this.loaded) {
        await this.loadTenants()
      }
    },
    
    handleChange(value) {
      this.$emit('input', value)   // 更新v-model绑定的值
      this.$emit('change', value)  // 触发change事件
    },

    getTenantValue(tenant) {
      // 返回tenant_id，优先使用id，如果没有则使用tenant_code
      return tenant.id !== undefined ? tenant.id : tenant.tenant_code;
    }
  },
  watch: {
    // 当外部值发生变化时，同步内部状态
    value: {
      handler(newValue) {
        // 如果传入的值不在租户列表中，且租户列表已加载，则尝试自动选择第一个
        if (this.loaded && newValue && !this.tenants.some(t => this.getTenantValue(t) === newValue)) {
          console.warn(`租户代码 "${newValue}" 不存在于租户列表中`)
        }
      },
      immediate: true
    }
  }
}
</script>

<style scoped>
/* 可以在这里添加特定的样式 */
</style>
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
      :key="tenant.tenantCode"
      :label="tenant.tenantName"
      :value="tenant.tenantCode">
    </el-option>
  </el-select>
</template>

<script>
import RBACService from '@/components/service/RBACService'

export default {
  name: 'TenantSelector',
  props: {
    value: {
      type: String,
      default: ''
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
  async created() {
    await this.loadTenants()
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
          if (this.autoSelectFirst && !this.value && this.tenants.length > 0) {
            const firstTenantCode = this.tenants[0].tenantCode
            this.$emit('input', firstTenantCode)  // 更新v-model绑定的值
            this.$emit('change', firstTenantCode) // 触发change事件
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
    }
  },
  watch: {
    // 当外部值发生变化时，同步内部状态
    value: {
      handler(newValue) {
        // 如果传入的值不在租户列表中，且租户列表已加载，则尝试自动选择第一个
        if (this.loaded && newValue && !this.tenants.some(t => t.tenantCode === newValue)) {
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
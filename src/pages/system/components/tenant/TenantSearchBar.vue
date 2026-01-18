<template>
  <div class="tenant-search-bar">
    <el-form :inline="true" :model="formValue" @submit.native.prevent="handleSearch">
      <el-form-item label="租户名称">
        <el-input
          v-model="formValue.tenant_name"
          placeholder="请输入租户名称"
          clearable
          @clear="handleSearch"
        ></el-input>
      </el-form-item>
      <el-form-item label="企业名称">
        <el-input
          v-model="formValue.company_name"
          placeholder="请输入企业名称"
          clearable
          @clear="handleSearch"
        ></el-input>
      </el-form-item>
      <el-form-item label="租户状态">
        <el-select
          v-model="formValue.status"
          placeholder="请选择状态"
          clearable
          @clear="handleSearch"
        >
          <el-option label="启用" :value="0"></el-option>
          <el-option label="停用" :value="1"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" data-testid="btn-search" @click="handleSearch">搜索</el-button>
        <el-button data-testid="btn-reset" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'TenantSearchBar',
  props: {
    value: {
      type: Object,
      default: () => ({
        tenant_id: '',
        tenant_name: '',
        company_name: '',
        status: null
      })
    }
  },
  data() {
    return {
      formValue: { ...this.value }
    }
  },
  watch: {
    value: {
      handler(newVal) {
        this.formValue = { ...newVal }
      },
      deep: true
    }
  },
  methods: {
    handleSearch() {
      this.$emit('search', this.formValue)
    },
    handleReset() {
      this.formValue = {
        tenant_id: '',
        tenant_name: '',
        company_name: '',
        status: null
      }
      this.$emit('reset')
    }
  }
}
</script>

<style scoped>
.tenant-search-bar {
  padding: 18px 24px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.05);
}

.tenant-search-bar .el-form-item {
  margin-bottom: 0;
}

.tenant-search-bar .el-form-item__label {
  color: #303133;
  font-weight: 500;
}
</style>

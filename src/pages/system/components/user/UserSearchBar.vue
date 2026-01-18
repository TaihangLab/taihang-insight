<template>
  <div class="user-search-bar">
    <el-form :inline="true" :model="formValue" class="search-form">
      <el-form-item label="租户">
        <TenantSelector
          ref="tenantSelector"
          v-model="formValue.tenant_id"
          @change="handleTenantChange"
        />
      </el-form-item>
      <el-form-item label="用户名称">
        <el-input
          v-model="formValue.user_name"
          placeholder="请输入用户名称"
          clearable
          style="width: 200px;"
        ></el-input>
      </el-form-item>
      <el-form-item label="用户昵称">
        <el-input
          v-model="formValue.nick_name"
          placeholder="请输入用户昵称"
          clearable
          style="width: 200px;"
        ></el-input>
      </el-form-item>
      <el-form-item label="手机号码">
        <el-input
          v-model="formValue.phone"
          placeholder="请输入手机号码"
          clearable
          style="width: 200px;"
        ></el-input>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="formValue.status" placeholder="用户状态" clearable style="width: 120px;">
          <el-option label="启用" :value="0"></el-option>
          <el-option label="禁用" :value="1"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="部门">
        <el-cascader
          v-model="formValue.dept_id"
          :options="departmentOptions"
          :props="cascaderProps"
          placeholder="选择部门"
          clearable
          style="width: 200px;"
        ></el-cascader>
      </el-form-item>
      <el-form-item label="岗位">
        <el-select v-model="formValue.position" placeholder="选择岗位" clearable style="width: 120px;">
          <el-option label="开发工程师" value="developer"></el-option>
          <el-option label="测试工程师" value="tester"></el-option>
          <el-option label="产品经理" value="pm"></el-option>
          <el-option label="UI设计师" value="designer"></el-option>
          <el-option label="运维工程师" value="ops"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="性别">
        <el-select v-model="formValue.gender" placeholder="选择性别" clearable style="width: 100px;">
          <el-option label="未知" :value="0"></el-option>
          <el-option label="男" :value="1"></el-option>
          <el-option label="女" :value="2"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" data-testid="btn-search" @click="handleSearch">搜索</el-button>
        <el-button icon="el-icon-refresh" data-testid="btn-reset" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import TenantSelector from '@/components/common/TenantSelector.vue'

export default {
  name: 'UserSearchBar',
  components: {
    TenantSelector
  },
  props: {
    value: {
      type: Object,
      default: () => ({
        tenant_id: '',
        user_name: '',
        nick_name: '',
        phone: '',
        status: null,
        dept_id: [],
        position: '',
        gender: null
      })
    },
    departmentOptions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      formValue: { ...this.value },
      cascaderProps: {
        value: 'id',
        label: 'label',
        children: 'children',
        checkStrictly: true,
        // 自定义显示模板，显示部门编码（编码在前，名称在后）
        renderFormat: (labels, selectedOptions) => {
          return selectedOptions.map(option => {
            return `${option.code} - ${option.label}`;
          }).join('/');
        }
      }
    }
  },
  watch: {
    value: {
      handler(newVal) {
        console.log('value change', newVal)
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
      const currentTenantCode = this.formValue.tenant_id
      this.formValue = {
        tenant_id: currentTenantCode,
        user_name: '',
        nick_name: '',
        phone: '',
        status: null,
        dept_id: [],
        position: '',
        gender: null
      }
      this.$emit('reset', this.formValue)
    },
    handleTenantChange() {
      this.$emit('input', this.formValue)
      this.$emit('tenant-change')
    }
  }
}
</script>

<style scoped>
.user-search-bar {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.search-form .el-form-item {
  margin-bottom: 10px;
  margin-right: 10px;
}
</style>

<template>
  <div class="permission-search-bar">
    <el-form :inline="true" :model="formValue" class="search-form">
      <el-form-item label="权限名称">
        <el-input
          v-model="formValue.name"
          placeholder="请输入权限名称"
          clearable
          style="width: 200px;"
        ></el-input>
      </el-form-item>
      <el-form-item label="权限码">
        <el-input
          v-model="formValue.code"
          placeholder="请输入权限码"
          clearable
          style="width: 200px;"
        ></el-input>
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="formValue.type" placeholder="全部" clearable style="width: 120px;">
          <el-option label="文件夹" value="folder"></el-option>
          <el-option label="页面" value="menu"></el-option>
          <el-option label="按钮" value="button"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="formValue.status" placeholder="全部" clearable style="width: 100px;">
          <el-option label="启用" :value="0"></el-option>
          <el-option label="禁用" :value="1"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
        <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'PermissionSearchBar',
  props: {
    value: {
      type: Object,
      default: () => ({
        name: '',
        code: '',
        type: '',
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
        name: '',
        code: '',
        type: '',
        status: null
      }
      this.$emit('reset', this.formValue)
    }
  }
}
</script>

<style scoped>
.permission-search-bar {
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

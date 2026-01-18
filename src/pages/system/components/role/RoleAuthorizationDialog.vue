<template>
  <el-dialog
    :visible.sync="visible"
    :title="`为【${roleName}】分配权限`"
    width="700px"
    :before-close="handleClose"
  >
    <div class="authorization-container">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="角色名称">
          <span>{{ roleName }}</span>
        </el-form-item>
        <el-form-item label="权限分配">
          <div class="permission-search">
            <el-input
              v-model="searchKeyword"
              prefix-icon="el-icon-search"
              placeholder="输入权限名称搜索"
              clearable
              @input="filterPermissions"
            />
          </div>
          <div class="permission-tree-container">
            <el-tree
              ref="permissionTree"
              :data="filteredPermissions"
              :props="treeProps"
              show-checkbox
              node-key="id"
              :default-expanded-keys="expandedPermissionKeys"
              :default-checked-keys="checkedPermissionKeys"
              :filter-node-method="filterNode"
              highlight-current
            />
          </div>
        </el-form-item>
      </el-form>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定授权</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'RoleAuthorizationDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    role: {
      type: Object,
      default: () => ({})
    },
    permissions: {
      type: Array,
      default: () => []
    },
    checkedPermissionKeys: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      formData: {},
      searchKeyword: '',
      filteredPermissions: [],
      expandedPermissionKeys: [],
      treeProps: {
        children: 'children',
        label: 'label'
      }
    }
  },
  computed: {
    roleName() {
      return this.role.role_name || ''
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.filteredPermissions = this.permissions
        // 设置默认展开的节点（第一层节点）
        this.expandedPermissionKeys = this.permissions.map(item => item.id)
      }
    },
    permissions: {
      handler(newVal) {
        if (this.visible) {
          this.filteredPermissions = newVal
        }
      },
      deep: true
    }
  },
  methods: {
    handleClose() {
      this.$emit('update:visible', false)
      this.searchKeyword = ''
      this.filteredPermissions = []
      this.expandedPermissionKeys = []
    },
    handleSubmit() {
      const checkedKeys = this.$refs.permissionTree.getCheckedKeys()
      const halfCheckedKeys = this.$refs.permissionTree.getHalfCheckedKeys()
      const allPermissionIds = [...checkedKeys, ...halfCheckedKeys]
      
      this.$emit('submit', {
        roleId: this.role.id,
        permissionIds: allPermissionIds
      })
    },
    filterPermissions() {
      if (this.searchKeyword) {
        this.$refs.permissionTree.filter(this.searchKeyword)
      } else {
        this.filteredPermissions = this.permissions
      }
    },
    filterNode(value, data) {
      if (!value) return true
      return data.label.toLowerCase().includes(value.toLowerCase())
    }
  }
}
</script>

<style scoped>
.authorization-container {
  max-height: 500px;
  overflow-y: auto;
}

.permission-search {
  margin-bottom: 15px;
}

.permission-tree-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  max-height: 350px;
  overflow-y: auto;
}
</style>
<template>
  <el-dialog
    v-model="dialogVisible"
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
              ref="permissionTreeRef"
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

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { ElTree } from 'element-plus'

interface Permission {
  id: string | number
  label: string
  children?: Permission[]
}

interface Role {
  id: string | number
  role_name?: string
}

const props = defineProps<{
  visible: boolean
  role: Role
  permissions: Permission[]
  checkedPermissionKeys: (string | number)[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [data: { roleId: string | number; permissionIds: (string | number)[] }]
}>()

const permissionTreeRef = ref<InstanceType<typeof ElTree>>()

const formData = reactive({})
const searchKeyword = ref('')
const filteredPermissions = ref<Permission[]>([])
const expandedPermissionKeys = ref<(string | number)[]>([])
const treeProps = {
  children: 'children',
  label: 'label'
}

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const roleName = computed(() => props.role.role_name || '')

watch(
  () => props.visible,
  (val) => {
    if (val) {
      filteredPermissions.value = props.permissions
      expandedPermissionKeys.value = props.permissions.map((item) => item.id)
    }
  }
)

watch(
  () => props.permissions,
  (newVal) => {
    if (props.visible) {
      filteredPermissions.value = newVal
    }
  },
  { deep: true }
)

const handleClose = () => {
  emit('update:visible', false)
  searchKeyword.value = ''
  filteredPermissions.value = []
  expandedPermissionKeys.value = []
}

const handleSubmit = () => {
  if (!permissionTreeRef.value) return

  const checkedKeys = permissionTreeRef.value.getCheckedKeys()
  const halfCheckedKeys = permissionTreeRef.value.getHalfCheckedKeys()
  const allPermissionIds = [...checkedKeys, ...halfCheckedKeys]

  emit('submit', {
    roleId: props.role.id,
    permissionIds: allPermissionIds
  })
}

const filterPermissions = () => {
  if (permissionTreeRef.value) {
    if (searchKeyword.value) {
      permissionTreeRef.value.filter(searchKeyword.value)
    } else {
      filteredPermissions.value = props.permissions
    }
  }
}

const filterNode = (value: string, data: Permission) => {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
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

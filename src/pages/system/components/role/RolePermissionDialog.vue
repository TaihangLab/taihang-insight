<template>
  <el-dialog
    title="分配权限"
    v-model="dialogVisible"
    width="700px"
    @close="closeDialog"
  >
    <div v-loading="loading" class="permission-dialog-content">
      <div class="role-info">
        <span class="label">角色：</span>
        <span class="value">{{ currentRole?.roleName }}</span>
        <span class="code">({{ currentRole?.roleCode }})</span>
      </div>

      <el-divider />

      <div class="permission-tree-container">
        <el-tree
          ref="permissionTreeRef"
          :data="permissionTree"
          :props="treeProps"
          show-checkbox
          node-key="id"
          :default-checked-keys="checkedPermissions"
          :default-expand-all="true"
          :check-strictly="false"
          @check="handleCheck"
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <el-icon v-if="data.permissionType === 'page'"><Folder /></el-icon>
              <el-icon v-else-if="data.permissionType === 'button'"><Operation /></el-icon>
              <el-icon v-else><Document /></el-icon>
              <span class="node-label">{{ node.label }}</span>
              <span v-if="data.permissionCode" class="node-code">({{ data.permissionCode }})</span>
            </span>
          </template>
        </el-tree>
      </div>
    </div>

    <template #footer>
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="submitPermissions" :loading="submitting">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Folder, Operation, Document } from '@element-plus/icons-vue'
import type { Role } from '@/types/rbac'
import type { PermissionTreeNode } from '@/types/rbac/permission'
import RBACService from '@/components/service/RBACService'

interface TreeProps {
  children: string
  label: string
}

const props = defineProps<{
  visible: boolean
  currentRole: Role | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [roleId: number, permissionIds: number[]]
}>()

const loading = ref(false)
const submitting = ref(false)
const permissionTreeRef = ref()
const permissionTree = ref<PermissionTreeNode[]>([])
const checkedPermissions = ref<number[]>([])

const treeProps: TreeProps = {
  children: 'children',
  label: 'permissionName'
}

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

watch(() => props.visible, async (newVal) => {
  if (newVal && props.currentRole) {
    await loadPermissions()
  }
})

const loadPermissions = async () => {
  loading.value = true
  try {
    // Load permission tree
    const treeResponse = await RBACService.getPermissionTree({ include_disabled: false })
    if (treeResponse?.data) {
      permissionTree.value = treeResponse.data as PermissionTreeNode[]
    }

    // Load role's current permissions
    if (props.currentRole) {
      const rolePermsResponse = await RBACService.getRolePermissions(props.currentRole.id)
      if (rolePermsResponse?.data) {
        checkedPermissions.value = (Array.isArray(rolePermsResponse.data)
          ? rolePermsResponse.data
          : []).map((p: any) => Number(p.permissionId || p.permission_id))
      }
    }

    nextTick(() => {
      permissionTreeRef.value?.setCheckedKeys(checkedPermissions.value)
    })
  } catch (error) {
    console.error('加载权限失败:', error)
    ElMessage.error('加载权限失败')
  } finally {
    loading.value = false
  }
}

const handleCheck = () => {
  // Handle check changes
}

const submitPermissions = () => {
  if (!props.currentRole) return

  // Get all checked and half-checked nodes
  const checkedKeys = permissionTreeRef.value?.getCheckedKeys() || []
  const halfCheckedKeys = permissionTreeRef.value?.getHalfCheckedKeys() || []

  // Combine both checked and half-checked keys
  const allCheckedKeys = [...checkedKeys, ...halfCheckedKeys]

  if (allCheckedKeys.length === 0) {
    ElMessage.warning('请至少选择一个权限')
    return
  }

  submitting.value = true

  // Emit submit event with role ID and permission IDs
  emit('submit', props.currentRole.id, allCheckedKeys as number[])
}

const closeDialog = () => {
  emit('update:visible', false)
  nextTick(() => {
    permissionTree.value = []
    checkedPermissions.value = []
  })
}

const cancel = () => {
  closeDialog()
}
</script>

<style scoped>
.permission-dialog-content {
  min-height: 400px;
}

.role-info {
  padding: 10px 0;
  font-size: 14px;
}

.role-info .label {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.role-info .value {
  font-weight: 500;
  color: var(--el-color-primary);
  margin-right: 8px;
}

.role-info .code {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.permission-tree-container {
  margin-top: 16px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 12px;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  padding: 0 8px;
}

.custom-tree-node .el-icon {
  font-size: 16px;
  color: var(--el-color-primary);
}

.node-label {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.node-code {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

:deep(.el-tree-node__content) {
  height: 36px;
  border-radius: 4px;
}

:deep(.el-tree-node__content:hover) {
  background-color: var(--el-fill-color-light);
}
</style>

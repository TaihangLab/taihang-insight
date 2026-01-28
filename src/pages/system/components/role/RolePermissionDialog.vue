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
        <span class="value">{{ currentRole?.role_name }}</span>
        <span class="code">({{ currentRole?.role_code }})</span>
      </div>

      <el-divider />

      <!-- 辅助操作按钮 -->
      <div class="action-bar">
        <el-button size="small" @click="checkAll">全选</el-button>
        <el-button size="small" @click="uncheckAll">全不选</el-button>
        <el-button size="small" @click="expandAll">展开全部</el-button>
        <el-button size="small" @click="collapseAll">收起全部</el-button>
      </div>

      <div class="permission-tree-container">
        <el-tree
          ref="permissionTreeRef"
          :data="permissionTree"
          :props="treeProps"
          show-checkbox
          node-key="id"
          :default-checked-keys="checkedPermissions"
          :default-expand-all="false"
          :check-strictly="false"
          @check="handleCheck"
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <el-icon v-if="data.node_type === 'folder'"><Folder /></el-icon>
              <el-icon v-else-if="data.node_type === 'menu'"><Menu /></el-icon>
              <el-icon v-else><Operation /></el-icon>
              <span class="node-label">{{ node.label }}</span>
              <span v-if="data.permission_code" class="node-code">({{ data.permission_code }})</span>
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
import { Folder, Operation, Menu } from '@element-plus/icons-vue'
import type { Role } from '@/types/rbac'
import type { PermissionTreeNode } from '@/types/rbac/permission'
import associationService from '@/api/system/associationService'

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
  label: 'permission_name'
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
    const treeResponse = await associationService.getPermissionTree()
    if (treeResponse?.data) {
      // Map Permission to PermissionTreeNode by adding missing fields
      permissionTree.value = (treeResponse.data as unknown as PermissionTreeNode[])
    }

    // Load role's current permissions
    if (props.currentRole) {
      const rolePermsResponse = await associationService.getRolePermissions(props.currentRole.id)
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

/**
 * 获取所有节点ID（递归）
 */
const getAllNodeIds = (nodes: PermissionTreeNode[]): number[] => {
  const ids: number[] = []
  const traverse = (nodeList: PermissionTreeNode[]) => {
    nodeList.forEach(node => {
      ids.push(node.id)
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(nodes)
  return ids
}

/**
 * 全选所有权限
 */
const checkAll = () => {
  const allIds = getAllNodeIds(permissionTree.value)
  permissionTreeRef.value?.setCheckedKeys(allIds)
}

/**
 * 全不选
 */
const uncheckAll = () => {
  permissionTreeRef.value?.setCheckedKeys([])
}

/**
 * 展开全部节点
 */
const expandAll = () => {
  const allKeys = getAllNodeIds(permissionTree.value)
  allKeys.forEach(key => {
    permissionTreeRef.value?.setExpanded(key, true)
  })
}

/**
 * 收起全部节点
 */
const collapseAll = () => {
  const allKeys = getAllNodeIds(permissionTree.value)
  allKeys.forEach(key => {
    permissionTreeRef.value?.setExpanded(key, false)
  })
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

.action-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.permission-tree-container {
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

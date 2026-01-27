<template>
  <div class="permission-tree-panel" v-loading="loading">
    <el-tree
      ref="permissionTreeRef"
      :data="treeData"
      :props="treeProps"
      :filter-node-method="filterNode"
      :expand-on-click-node="false"
      highlight-current
      node-key="id"
      default-expand-all
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <span class="tree-node-content">
          <span class="node-left">
            <i :class="getNodeIconClass(data.type)" class="node-icon"></i>
            <span class="node-label">{{ data.name }}</span>
            <span class="node-code">{{ data.code }}</span>
            <el-tag v-if="data.type === 'button'" size="mini" :type="getCategoryTagType(data.category)">
              {{ getCategoryLabel(data.category) }}
            </el-tag>
            <el-tag v-if="data.type === 'menu' && !data.visible" size="mini" type="info">隐藏</el-tag>
            <el-tag v-if="data.status === 1" size="mini" type="danger">禁用</el-tag>
          </span>
          <span class="node-actions">
            <el-button
              v-if="data.type !== 'button'"
              link
              size="mini"
              icon="el-icon-plus"
              @click.stop="handleAddChild(data)"
              title="添加子项"
            >子项</el-button>
            <el-button
              link
              size="mini"
              icon="el-icon-edit"
              @click.stop="handleEdit(data)"
              title="编辑"
            >编辑</el-button>
            <el-button
              link
              size="mini"
              icon="el-icon-delete"
              class="delete-btn"
              @click.stop="handleDelete(data)"
              title="删除"
            >删除</el-button>
          </span>
        </span>
      </template>
    </el-tree>

    <!-- 空状态 -->
    <div v-if="!loading && (!treeData || treeData.length === 0)" class="empty-state">
      <i class="el-icon-folder-opened"></i>
      <p>暂无权限数据</p>
      <el-button type="primary" size="small" @click="handleCreateFirst">创建第一个权限</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { ElTree } from 'element-plus'

interface PermissionNode {
  id: string | number
  name: string
  code: string
  type: string
  category?: string
  visible?: boolean
  status: number
  children?: PermissionNode[]
}

defineExpose({
  expandAll,
  collapseAll
})

const props = withDefaults(
  defineProps<{
    treeData: PermissionNode[]
    loading: boolean
    filterText: string
  }>(),
  {
    treeData: () => [],
    loading: false,
    filterText: ''
  }
)

const emit = defineEmits<{
  nodeClick: [data: PermissionNode]
  addChild: [data: PermissionNode]
  edit: [data: PermissionNode]
  delete: [data: PermissionNode]
  createFirst: []
}>()

const permissionTreeRef = ref<InstanceType<typeof ElTree>>()

const treeProps = {
  children: 'children',
  label: 'name'
}

watch(
  () => props.filterText,
  (val) => {
    if (permissionTreeRef.value) {
      permissionTreeRef.value.filter(val)
    }
  }
)

const handleNodeClick = (data: PermissionNode) => {
  emit('nodeClick', data)
}

const filterNode = (value: string, data: PermissionNode) => {
  if (!value) return true
  const searchText = value.toLowerCase()
  return (
    (data.name && data.name.toLowerCase().includes(searchText)) ||
    (data.code && data.code.toLowerCase().includes(searchText))
  )
}

const getNodeIconClass = (type: string) => {
  const icons: Record<string, string> = {
    folder: 'el-icon-folder',
    menu: 'el-icon-menu',
    button: 'el-icon-document'
  }
  return icons[type] || 'el-icon-document'
}

const getCategoryTagType = (category?: string) => {
  const types: Record<string, string> = {
    READ: 'primary',
    WRITE: 'success',
    DELETE: 'danger',
    SPECIAL: 'warning'
  }
  return types[category || ''] || 'info'
}

const getCategoryLabel = (category?: string) => {
  const labels: Record<string, string> = {
    READ: '读取',
    WRITE: '写入',
    DELETE: '删除',
    SPECIAL: '特殊'
  }
  return labels[category || ''] || category
}

const handleAddChild = (data: PermissionNode) => {
  emit('addChild', data)
}

const handleEdit = (data: PermissionNode) => {
  emit('edit', data)
}

const handleDelete = (data: PermissionNode) => {
  emit('delete', data)
}

const handleCreateFirst = () => {
  emit('createFirst')
}

const expandAll = () => {
  if (!permissionTreeRef.value) return
  const nodes = permissionTreeRef.value.store.nodesMap
  for (const key in nodes) {
    nodes[key].expanded = true
  }
}

const collapseAll = () => {
  if (!permissionTreeRef.value) return
  const nodes = permissionTreeRef.value.store.nodesMap
  for (const key in nodes) {
    nodes[key].expanded = false
  }
}
</script>

<style scoped>
.permission-tree-panel {
  min-height: 400px;
  position: relative;
}

.tree-node-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 8px;
}

.node-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
}

.node-icon {
  font-size: 16px;
  color: #409eff;
}

.node-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.node-code {
  font-size: 12px;
  color: #909399;
  font-family: 'Courier New', monospace;
}

.node-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node-content:hover .node-actions {
  opacity: 1;
}

.delete-btn {
  color: #f56c6c;
}

.delete-btn:hover {
  color: #ff8d8d;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #909399;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.empty-state p {
  font-size: 14px;
  margin-bottom: 20px;
}
</style>

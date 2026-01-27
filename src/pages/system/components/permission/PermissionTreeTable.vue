<template>
  <div class="permission-tree-table">
    <el-table
      ref="treeTableRef"
      :data="processedData"
      v-loading="loading"
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      :default-expand-all="defaultExpandAll"
    >
      <!-- 权限类型图标 + 名称 -->
      <el-table-column label="权限名称"  min-width="200"  header-align="center">
        <template #default="scope">
            <span class="name-text">{{ scope.row.permission_name }}</span>
        </template>
      </el-table-column>


     <el-table-column label="权限图标" header-align="center">
        <template #default="scope">
           <i :class="getTypeIcon(scope.row.permission_type)" class="type-icon"></i>
        </template>
      </el-table-column>

      <!-- 权限码 -->
      <el-table-column prop="permission_code" label="权限码" min-width="200" align="center">
        <template #default="scope">
          <code class="permission-code">{{ scope.row.permission_code }}</code>
        </template>
      </el-table-column>

      <!-- 路由路径 -->
      <el-table-column prop="path" label="路由路径" min-width="180" align="center">
        <template #default="scope">
          <span class="path-text">{{ scope.row.path || '-' }}</span>
        </template>
      </el-table-column>

      <!-- 类型标签 -->
      <el-table-column label="类型" width="100" align="center">
        <template #default="scope">
          <el-tag :type="getTypeTagType(scope.row.permission_type)" size="small">
            {{ getTypeLabel(scope.row.permission_type) }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 排序 -->
      <el-table-column prop="sort_order" label="排序" width="80" align="center">
        <template #default="scope">
          {{ scope.row.sort_order || 0 }}
        </template>
      </el-table-column>

      <!-- 状态 -->
      <el-table-column label="状态" width="80" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'" size="mini">
            {{ scope.row.status === 0 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 操作 -->
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="scope">
          <div class="operation-buttons">
            <el-button
              v-if="scope.row.permission_type !== 'button'"
              link
              class="add-btn"
              @click="handleAddSub(scope.row)"
              title="添加子项"
            >添加</el-button>
            <el-button
              link
              class="edit-btn"
              @click="handleEdit(scope.row)"
              title="编辑"
            >编辑</el-button>
            <el-button
              link
              class="delete-btn"
              @click="handleDelete(scope.row)"
              title="删除"
            >删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { ElTable } from 'element-plus'
import { calculateTreeDepth } from '@/utils/treeUtils'

interface Permission {
  permission_name: string
  permission_type: string
  permission_code: string
  path?: string
  sort_order: number
  status: number
  children?: Permission[]
  [key: string]: any
}

defineExpose({
  toggleExpandAll
})

const props = withDefaults(
  defineProps<{
    data: Permission[]
    loading: boolean
    defaultExpandAll: boolean
  }>(),
  {
    data: () => [],
    loading: false,
    defaultExpandAll: true
  }
)

const emit = defineEmits<{
  edit: [row: Permission]
  addSub: [row: Permission]
  delete: [row: Permission]
}>()

const treeTableRef = ref<InstanceType<typeof ElTable>>()

const processedData = computed(() => {
  return calculateTreeDepth(props.data, 'children', 0)
})

const handleEdit = (row: Permission) => {
  emit('edit', row)
}

const handleAddSub = (row: Permission) => {
  emit('addSub', row)
}

const handleDelete = (row: Permission) => {
  emit('delete', row)
}

const getTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    folder: 'el-icon-folder',
    menu: 'el-icon-menu',
    button: 'el-icon-document'
  }
  return icons[type] || 'el-icon-document'
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    folder: '文件夹',
    menu: '页面',
    button: '按钮'
  }
  return labels[type] || type
}

const getTypeTagType = (type: string) => {
  const types: Record<string, string> = {
    folder: '',
    menu: 'primary',
    button: 'info'
  }
  return types[type] || 'info'
}

const getCategoryTagType = (category: string) => {
  const types: Record<string, string> = {
    READ: 'primary',
    WRITE: 'success',
    DELETE: 'danger',
    SPECIAL: 'warning'
  }
  return types[category] || 'info'
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    READ: '读取',
    WRITE: '写入',
    DELETE: '删除',
    SPECIAL: '特殊'
  }
  return labels[category] || category
}

const toggleExpandAll = async (expand: boolean) => {
  await nextTick()
  await setTableExpandState(processedData.value, expand)
}

const setTableExpandState = async (data: Permission[], expand: boolean) => {
  for (const item of data) {
    if (item.children && item.children.length > 0) {
      if (treeTableRef.value) {
        treeTableRef.value.toggleRowExpansion(item, expand)
      }
      await nextTick()
      await setTableExpandState(item.children, expand)
    }
  }
}
</script>

<style scoped>
/* 组件样式继承自父组件的全局样式 */
</style>

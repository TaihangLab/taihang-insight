<template>
  <div class="position-list-container">
    <!-- 表格操作区域 -->
    <PositionTableActions
      :selected-count="selectedCount"
      @add="handleAdd"
      @batch-delete="handleBatchDelete"
      @export="handleExport"
    />

    <!-- 表格 -->
    <PositionTable
      :data="data"
      :loading="loading"
      @selection-change="handleSelectionChange"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- 分页 -->
    <PositionPagination
      :current-page="currentPage"
      :page-size="pageSize"
      :total="total"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PositionTableActions from '@/pages/system/components/position/PositionTableActions.vue'
import PositionTable from '@/pages/system/components/position/PositionTable.vue'
import PositionPagination from '@/pages/system/components/position/PositionPagination.vue'

interface Pagination {
  currentPage: number
  pageSize: number
}

interface PositionItem {
  _selected?: boolean
  [key: string]: any
}

defineProps<{
  data: PositionItem[]
  loading: boolean
  pagination: Pagination
  total: number
}>()

const emit = defineEmits<{
  selectionChange: [selection: PositionItem[]]
  add: []
  edit: [row: PositionItem]
  delete: [row: PositionItem]
  batchDelete: []
  export: []
  pageChange: [page: number]
  sizeChange: [size: number]
}>()

const currentPage = computed(() => props.pagination.currentPage)
const pageSize = computed(() => props.pagination.pageSize)
const selectedCount = computed(() => props.data.filter((item) => item._selected).length)

const handleSelectionChange = (selection: PositionItem[]) => {
  emit('selectionChange', selection)
}

const handleAdd = () => {
  emit('add')
}

const handleEdit = (row: PositionItem) => {
  emit('edit', row)
}

const handleDelete = (row: PositionItem) => {
  emit('delete', row)
}

const handleBatchDelete = () => {
  emit('batchDelete')
}

const handleExport = () => {
  emit('export')
}

const handlePageChange = (page: number) => {
  emit('pageChange', page)
}

const handleSizeChange = (size: number) => {
  emit('sizeChange', size)
}
</script>

<style scoped>
.position-list-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>

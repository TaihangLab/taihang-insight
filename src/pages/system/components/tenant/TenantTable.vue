<template>
  <el-table
    :data="data"
    v-loading="loading"
    :border="false"
    class="custom-table"
    style="width: 100%"
    @selection-change="handleSelectionChange"
  >
    <el-table-column type="selection" width="55" align="center"></el-table-column>
    <el-table-column prop="id" label="租户编号" width="120" align="center"></el-table-column>
    <el-table-column prop="tenant_name" label="租户名称" width="120" align="center"></el-table-column>
    <el-table-column prop="company_name" label="企业名称" width="180" align="center"></el-table-column>
    <el-table-column prop="status" label="租户状态" width="100" align="center">
      <template slot-scope="scope">
        <el-switch
          :data-testid="'switch-status-' + scope.row.id"
          v-model="scope.row.status"
          :active-value="0"
          :inactive-value="1"
          active-color="#3b82f6"
          inactive-color="#9ca3af"
          @change="handleStatusChange(scope.row)"
        ></el-switch>
      </template>
    </el-table-column>
    <el-table-column prop="contact_person" label="联系人" width="120" align="center"></el-table-column>
    <el-table-column prop="contact_phone" label="联系电话" width="140" align="center"></el-table-column>
    <el-table-column prop="package" label="租户套餐" width="100" align="center">
      <template slot-scope="scope">
        {{ packageLabels[scope.row.package] || scope.row.package || '' }}
      </template>
    </el-table-column>
    <el-table-column prop="expire_time" label="过期时间" width="120" align="center">
      <template slot-scope="scope">
        {{ formatDate(scope.row.expire_time) }}
      </template>
    </el-table-column>
    <el-table-column prop="user_count" label="用户数量" width="100" align="center"></el-table-column>
    <el-table-column prop="domain" label="绑定域名" width="150" align="center"></el-table-column>
    <el-table-column prop="address" label="企业地址" width="200" align="center"></el-table-column>
    <el-table-column prop="company_code" label="企业代码" width="150" align="center"></el-table-column>
    <el-table-column prop="description" label="企业简介" width="200" align="center"></el-table-column>
    <el-table-column prop="remark" label="备注" width="150" align="center"></el-table-column>
    <el-table-column prop="create_time" label="创建时间" width="180" align="center">
      <template slot-scope="scope">
        {{ formatDateTime(scope.row.create_time) }}
      </template>
    </el-table-column>
    <el-table-column prop="update_time" label="更新时间" width="180" align="center">
      <template slot-scope="scope">
        {{ formatDateTime(scope.row.update_time) }}
      </template>
    </el-table-column>
    <el-table-column prop="create_by" label="创建人" width="120" align="center"></el-table-column>

    <el-table-column label="操作" width="120" fixed="right" align="center">
      <template slot-scope="scope">
        <div class="operation-buttons">
          <el-button type="text" class="edit-btn" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="text" class="delete-btn" @click="handleDelete(scope.row)">删除</el-button>
        </div>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
// 套餐标签映射常量
const PACKAGE_LABELS = {
  'basic': '基础版',
  'standard': '标准版',
  'premium': '高级版',
  'enterprise': '企业版'
}

export default {
  name: 'TenantTable',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    selectedCodes: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      packageLabels: PACKAGE_LABELS
    }
  },
  methods: {
    formatDate(timestamp) {
      if (!timestamp) return ''
      return new Date(timestamp).toLocaleDateString()
    },
    formatDateTime(timestamp) {
      if (!timestamp) return ''
      return new Date(timestamp).toLocaleString()
    },
    handleSelectionChange(selection) {
      const codes = selection.map(row => row.id)
      this.$emit('selection-change', codes, selection)
    },
    handleStatusChange(row) {
      this.$emit('status-change', row)
    },
    handleEdit(row) {
      this.$emit('edit', row)
    },
    handleDelete(row) {
      this.$emit('delete', row)
    }
  }
}
</script>

<style scoped>
.custom-table {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.custom-table >>> .el-table__cell {
  border-right: none;
}

.custom-table >>> .el-table::before {
  height: 0;
}

.custom-table >>> .el-table__header-wrapper th {
  font-weight: bold;
  text-align: center;
  background: #f5f7fa !important;
  color: #303133 !important;
  border-bottom: 1px solid #ebeef5 !important;
}

.custom-table >>> .el-table__fixed-right-header-wrapper th,
.custom-table >>> .el-table__fixed-header-wrapper th {
  font-weight: bold;
  text-align: center;
  background: #f5f7fa !important;
  color: #303133 !important;
  border-bottom: 1px solid #ebeef5 !important;
}

.custom-table >>> .el-table__row td {
  text-align: center;
}

.custom-table >>> .el-table .el-table__body tr:hover > td {
  background: #f5f7fa !important;
}

.custom-table >>> .el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: #fafafa;
}

.operation-buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.edit-btn,
.delete-btn {
  padding: 2px 8px !important;
  font-size: 11px !important;
  border-radius: 4px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  background: #f5f7fa !important;
  border-color: #e4e7ed !important;
  color: #606266 !important;
  height: 24px !important;
  min-width: 50px !important;
}

.edit-btn:hover,
.delete-btn:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e3a8a !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2) !important;
  transform: translateY(-1px) !important;
}
</style>

<template>
  <div class="dept-mgmt">
    <div class="page-header">
      <h2>部门管理</h2>
      <p class="subtitle">维护本租户的组织架构（树形）</p>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="query" size="small">
        <el-form-item label="部门名称">
          <el-input v-model="query.deptName" placeholder="部门名称" clearable @keyup.enter.native="loadList"/>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width:120px">
            <el-option label="正常" value="0"/>
            <el-option label="停用" value="1"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="loadList">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
          <el-button type="text" @click="toggleExpand">{{ allExpanded ? '收起全部' : '展开全部' }}</el-button>
        </el-form-item>
        <el-form-item style="float:right">
          <el-button type="success" icon="el-icon-plus" @click="openCreateDialog()">新增部门</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table v-loading="loading" :data="tableData" border stripe size="small" row-key="deptId"
        :tree-props="{ children: 'children' }" :default-expand-all="allExpanded">
        <el-table-column label="部门名称" prop="deptName" min-width="200"/>
        <el-table-column label="排序" prop="orderNum" width="80"/>
        <el-table-column label="负责人" prop="leader" min-width="120"/>
        <el-table-column label="联系电话" prop="phone" width="140"/>
        <el-table-column label="邮箱" prop="email" min-width="160"/>
        <el-table-column label="状态" width="80">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'" size="mini">
              {{ scope.row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template slot-scope="scope">
            <el-button type="text" @click="openCreateDialog(scope.row)">新增子项</el-button>
            <el-button type="text" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button type="text" style="color:#f56c6c" @click="onDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog :title="dialogMode === 'create' ? '新增部门' : '编辑部门'" :visible.sync="dialogVisible" width="560px" :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" size="small">
        <el-form-item label="上级部门">
          <el-cascader v-model="form.parentId" :options="cascaderOptions" :props="cascaderProps" clearable placeholder="顶层部门" style="width:100%"/>
        </el-form-item>
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="form.deptName"/>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.orderNum" :min="0"/>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="form.leader"/>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone"/>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email"/>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmit">保 存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listDepts, deptTree, addDept, updateDept, deleteDept, getDept } from '@/api/dept'

export default {
  name: 'DeptManagement',
  data () {
    return {
      query: { deptName: '', status: '' },
      flatList: [], tableData: [], cascaderOptions: [],
      cascaderProps: { value: 'deptId', label: 'deptName', children: 'children', checkStrictly: true, emitPath: false },
      loading: false, allExpanded: true,
      dialogVisible: false, dialogMode: 'create', submitting: false,
      form: this.emptyForm(),
      rules: {
        deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
        email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }]
      }
    }
  },
  mounted () {
    this.loadList()
  },
  methods: {
    emptyForm () {
      return { deptId: null, parentId: 0, deptName: '', orderNum: 0, leader: '', phone: '', email: '', status: '0' }
    },
    loadList () {
      this.loading = true
      Promise.all([listDepts(this.query), deptTree()]).then(([listRes, treeRes]) => {
        this.flatList = listRes.data || []
        const tree = treeRes.data || this.buildTree(this.flatList)
        this.tableData = tree
        this.cascaderOptions = [{ deptId: 0, deptName: '顶层部门', children: tree }]
      }).finally(() => { this.loading = false })
    },
    buildTree (flat, parentId = 0) {
      return flat.filter(d => d.parentId === parentId).map(d => ({
        ...d, children: this.buildTree(flat, d.deptId)
      }))
    },
    resetQuery () {
      this.query = { deptName: '', status: '' }
      this.loadList()
    },
    toggleExpand () {
      this.allExpanded = !this.allExpanded
      const tmp = this.tableData
      this.tableData = []
      this.$nextTick(() => { this.tableData = tmp })
    },
    openCreateDialog (parentRow) {
      this.dialogMode = 'create'
      this.form = this.emptyForm()
      if (parentRow) this.form.parentId = parentRow.deptId
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    },
    openEditDialog (row) {
      this.dialogMode = 'edit'
      getDept(row.deptId).then(res => {
        this.form = Object.assign(this.emptyForm(), res.data || row)
        this.dialogVisible = true
        this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
      })
    },
    onSubmit () {
      this.$refs.form.validate(valid => {
        if (!valid) return
        const payload = Object.assign({}, this.form)
        if (!payload.parentId) payload.parentId = 0
        this.submitting = true
        const api = this.dialogMode === 'create' ? addDept(payload) : updateDept(this.form.deptId, payload)
        api.then(res => {
          this.$message({ message: res.msg || '操作成功', type: 'success' })
          this.dialogVisible = false
          this.loadList()
        }).finally(() => { this.submitting = false })
      })
    },
    onDelete (row) {
      this.$confirm(`确认删除部门「${row.deptName}」？如果它有子部门或用户将一并失败`, '确认删除', { type: 'warning' }).then(() => {
        deleteDept(row.deptId).then(res => {
          this.$message({ message: res.msg || '删除成功', type: 'success' })
          this.loadList()
        })
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.dept-mgmt { padding: 16px; }
.page-header { margin-bottom: 12px; }
.page-header h2 { margin: 0 0 4px; }
.subtitle { margin: 0; color: #909399; font-size: 12px; }
.filter-card { margin-bottom: 12px; }
</style>

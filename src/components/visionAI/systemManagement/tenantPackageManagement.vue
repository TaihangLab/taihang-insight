<template>
  <div class="package-mgmt">
    <div class="page-header">
      <h2>租户套餐</h2>
      <p class="subtitle">套餐定义了租户能看到的菜单白名单。修改套餐后可点击「同步」把权限刷新到使用该套餐的所有租户管理员角色上。</p>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="query" size="small">
        <el-form-item label="套餐名称">
          <el-input v-model="query.packageName" placeholder="套餐名称" clearable @keyup.enter.native="loadList(1)"/>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width:120px">
            <el-option label="正常" value="0"/>
            <el-option label="停用" value="1"/>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" @click="loadList(1)">查询</el-button>
          <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
        <el-form-item style="float:right">
          <el-button type="success" icon="el-icon-plus" @click="openCreateDialog">新增套餐</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table v-loading="loading" :data="list" border stripe size="small">
        <el-table-column label="ID" prop="packageId" width="80"/>
        <el-table-column label="套餐名称" prop="packageName" min-width="160"/>
        <el-table-column label="菜单数" width="100">
          <template slot-scope="scope">{{ (scope.row.menuIds || []).length }}</template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="200" show-overflow-tooltip/>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-switch
              :value="scope.row.status === '0'"
              @change="onToggleStatus(scope.row, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="170"/>
        <el-table-column label="操作" width="160">
          <template slot-scope="scope">
            <el-button type="text" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button type="text" style="color:#f56c6c" @click="onDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-row">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :current-page.sync="query.pageNum"
          :page-size.sync="query.pageSize"
          :page-sizes="[10, 20, 50]"
          @current-change="loadList()"
          @size-change="loadList(1)"
        />
      </div>
    </el-card>

    <el-dialog :title="dialogMode === 'create' ? '新增套餐' : '编辑套餐'" :visible.sync="dialogVisible" width="640px" :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" size="small">
        <el-form-item label="套餐名称" prop="packageName">
          <el-input v-model="form.packageName"/>
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-tree
            ref="menuTree"
            :data="menuTree"
            show-checkbox
            node-key="menuId"
            :check-strictly="form.menuCheckStrictly === 0"
            :default-checked-keys="form.menuIds"
            :props="{ label: 'menuName' }"
            :default-expand-all="false"
            class="menu-tree"
          />
          <div style="margin-top:6px">
            <el-checkbox :true-label="1" :false-label="0" v-model="form.menuCheckStrictly">父子菜单关联勾选</el-checkbox>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" rows="2"/>
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
import {
  listTenantPackages,
  addTenantPackage,
  updateTenantPackage,
  deleteTenantPackages,
  changeTenantPackageStatus,
  getTenantPackage
} from '@/api/tenantPackage'
import { listMenuTree } from '@/api/auth'

export default {
  name: 'TenantPackageManagement',
  data () {
    return {
      query: { pageNum: 1, pageSize: 10, packageName: '', status: '' },
      list: [],
      total: 0,
      loading: false,
      menuTree: [],
      dialogVisible: false,
      dialogMode: 'create',
      submitting: false,
      form: this.emptyForm(),
      rules: {
        packageName: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }]
      }
    }
  },
  mounted () {
    this.loadMenus()
    this.loadList()
  },
  methods: {
    emptyForm () {
      return { packageId: null, packageName: '', menuIds: [], menuCheckStrictly: 1, remark: '', status: '0' }
    },
    loadMenus () {
      if (!listMenuTree) {
        this.menuTree = []
        return
      }
      listMenuTree().then(res => {
        this.menuTree = res.data || []
      }).catch(() => {
        this.menuTree = []
      })
    },
    loadList (page) {
      if (page) this.query.pageNum = page
      this.loading = true
      listTenantPackages(this.query).then(res => {
        const data = res.data || {}
        this.list = data.rows || []
        this.total = data.total || 0
      }).finally(() => { this.loading = false })
    },
    resetQuery () {
      this.query = { pageNum: 1, pageSize: 10, packageName: '', status: '' }
      this.loadList()
    },
    openCreateDialog () {
      this.dialogMode = 'create'
      this.form = this.emptyForm()
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.menuTree) this.$refs.menuTree.setCheckedKeys([])
        if (this.$refs.form) this.$refs.form.clearValidate()
      })
    },
    openEditDialog (row) {
      this.dialogMode = 'edit'
      getTenantPackage(row.packageId).then(res => {
        const data = res.data || row
        this.form = Object.assign(this.emptyForm(), data)
        this.dialogVisible = true
        this.$nextTick(() => {
          if (this.$refs.menuTree) this.$refs.menuTree.setCheckedKeys(this.form.menuIds || [])
          if (this.$refs.form) this.$refs.form.clearValidate()
        })
      })
    },
    onSubmit () {
      this.$refs.form.validate(valid => {
        if (!valid) return
        const checked = this.$refs.menuTree ? this.$refs.menuTree.getCheckedKeys() : []
        const halfChecked = this.$refs.menuTree ? this.$refs.menuTree.getHalfCheckedKeys() : []
        const allMenuIds = Array.from(new Set([].concat(checked, halfChecked).filter(x => x != null)))
        const payload = Object.assign({}, this.form, { menuIds: allMenuIds })
        this.submitting = true
        const api = this.dialogMode === 'create' ? addTenantPackage(payload) : updateTenantPackage(payload)
        api.then(res => {
          this.$message({ message: res.msg || '操作成功', type: 'success' })
          this.dialogVisible = false
          this.loadList()
        }).finally(() => { this.submitting = false })
      })
    },
    onToggleStatus (row, on) {
      const newStatus = on ? '0' : '1'
      changeTenantPackageStatus(row.packageId, newStatus).then(() => {
        row.status = newStatus
        this.$message({ message: '已更新', type: 'success' })
      })
    },
    onDelete (row) {
      this.$confirm(`确认删除套餐「${row.packageName}」？`, '确认删除', { type: 'warning' }).then(() => {
        deleteTenantPackages(row.packageId).then(res => {
          this.$message({ message: res.msg || '删除成功', type: 'success' })
          this.loadList()
        })
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.package-mgmt { padding: 16px; }
.page-header { margin-bottom: 12px; }
.page-header h2 { margin: 0 0 4px; }
.subtitle { margin: 0; color: #909399; font-size: 12px; }
.filter-card { margin-bottom: 12px; }
.pagination-row { margin-top: 12px; text-align: right; }
.menu-tree { max-height: 320px; overflow: auto; border: 1px solid #ebeef5; border-radius: 4px; padding: 4px; }
</style>

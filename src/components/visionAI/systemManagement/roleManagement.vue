<template>
  <div class="role-mgmt">
    <div class="page-header">
      <h2>角色管理</h2>
      <p class="subtitle">管理本租户内的角色，并通过菜单树分配权限</p>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="query" size="small">
        <el-form-item label="角色名称">
          <el-input v-model="query.roleName" placeholder="角色名称" clearable @keyup.enter.native="loadList(1)"/>
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
          <el-button type="success" icon="el-icon-plus" @click="openCreateDialog">新增角色</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table v-loading="loading" :data="list" border stripe size="small">
        <el-table-column label="ID" prop="roleId" width="80"/>
        <el-table-column label="角色名称" prop="roleName" min-width="140"/>
        <el-table-column label="角色权限字符" prop="roleKey" min-width="140"/>
        <el-table-column label="排序" prop="roleSort" width="80"/>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'" size="mini">
              {{ scope.row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="160"/>
        <el-table-column label="操作" width="180">
          <template slot-scope="scope">
            <el-button type="text" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button type="text" style="color:#f56c6c"
              :disabled="isProtectedSuperRole(scope.row)"
              @click="onDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-row">
        <el-pagination background layout="total, sizes, prev, pager, next, jumper"
          :total="total" :current-page.sync="query.pageNum" :page-size.sync="query.pageSize"
          :page-sizes="[10, 20, 50]" @current-change="loadList()" @size-change="loadList(1)"/>
      </div>
    </el-card>

    <el-dialog :title="dialogMode === 'create' ? '新增角色' : '编辑角色'" :visible.sync="dialogVisible" width="640px" :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="110px" size="small">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName"/>
        </el-form-item>
        <el-form-item label="角色权限字符" prop="roleKey">
          <el-input v-model="form.roleKey" :disabled="dialogMode === 'edit' && isProtectedSuperRole(form)" placeholder="如 common / manager"/>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.roleSort" :min="0"/>
        </el-form-item>
        <el-form-item label="数据范围">
          <el-select v-model="form.dataScope" style="width:240px">
            <el-option label="全部" value="1"/>
            <el-option label="自定义" value="2"/>
            <el-option label="本部门" value="3"/>
            <el-option label="本部门及以下" value="4"/>
            <el-option label="仅本人" value="5"/>
          </el-select>
        </el-form-item>
        <el-form-item label="菜单权限">
          <el-tree ref="menuTree" :data="menuTreeData" show-checkbox node-key="menuId"
            :default-checked-keys="form.menuIds" :props="{ label: 'menuName' }" class="menu-tree"/>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status" :disabled="isProtectedSuperRole(form)">
            <el-radio label="0">正常</el-radio>
            <el-radio label="1">停用</el-radio>
          </el-radio-group>
          <span v-if="isProtectedSuperRole(form)" class="protected-tip">超级管理员角色不可停用</span>
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
import { listRoles, addRole, updateRole, deleteRole, getRole } from '@/api/role'
import { menuTree } from '@/api/menu'

export default {
  name: 'RoleManagement',
  data () {
    return {
      query: { pageNum: 1, pageSize: 10, roleName: '', status: '' },
      list: [], total: 0, loading: false,
      menuTreeData: [],
      dialogVisible: false, dialogMode: 'create', submitting: false,
      form: this.emptyForm(),
      rules: {
        roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
        roleKey: [{ required: true, message: '请输入角色权限字符', trigger: 'blur' }]
      }
    }
  },
  mounted () {
    this.loadMenus()
    this.loadList()
  },
  methods: {
    isProtectedSuperRole (row) {
      return row && row.roleKey === 'superadmin'
    },
    emptyForm () {
      return {
        roleId: null, roleName: '', roleKey: '', roleSort: 0, dataScope: '1',
        status: '0', remark: '', menuIds: []
      }
    },
    loadMenus () {
      menuTree().then(res => {
        this.menuTreeData = res.data || []
      }).catch(() => { this.menuTreeData = [] })
    },
    loadList (page) {
      if (page) this.query.pageNum = page
      this.loading = true
      listRoles(this.query).then(res => {
        const data = res.data || {}
        this.list = data.rows || []
        this.total = data.total || 0
      }).finally(() => { this.loading = false })
    },
    resetQuery () {
      this.query = { pageNum: 1, pageSize: 10, roleName: '', status: '' }
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
      getRole(row.roleId).then(res => {
        const data = res.data || {}
        const role = data.role || data
        this.form = Object.assign(this.emptyForm(), role, { menuIds: data.menuIds || [] })
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
        const menuIds = Array.from(new Set([].concat(checked, halfChecked).filter(x => x != null)))
        const payload = Object.assign({}, this.form, { menuIds })
        this.submitting = true
        const api = this.dialogMode === 'create' ? addRole(payload) : updateRole(this.form.roleId, payload)
        api.then(res => {
          this.$message({ message: res.msg || '操作成功', type: 'success' })
          this.dialogVisible = false
          this.loadList()
        }).finally(() => { this.submitting = false })
      })
    },
    onDelete (row) {
      this.$confirm(`确认删除角色「${row.roleName}」？`, '确认删除', { type: 'warning' }).then(() => {
        deleteRole(row.roleId).then(res => {
          this.$message({ message: res.msg || '删除成功', type: 'success' })
          this.loadList()
        })
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.role-mgmt { padding: 16px; }
.page-header { margin-bottom: 12px; }
.page-header h2 { margin: 0 0 4px; }
.subtitle { margin: 0; color: #909399; font-size: 12px; }
.filter-card { margin-bottom: 12px; }
.pagination-row { margin-top: 12px; text-align: right; }
.menu-tree { max-height: 280px; overflow: auto; border: 1px solid #ebeef5; border-radius: 4px; padding: 4px; }
.protected-tip { margin-left: 8px; color: #909399; font-size: 12px; }
</style>

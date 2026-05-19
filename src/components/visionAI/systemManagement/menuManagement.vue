<template>
  <div class="menu-mgmt">
    <div class="page-header">
      <h2>菜单管理</h2>
      <p class="subtitle">维护系统菜单（目录 M / 菜单 C / 按钮 F）。菜单为全局共享，所有租户可见。</p>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="query" size="small">
        <el-form-item label="菜单名称">
          <el-input v-model="query.menuName" placeholder="菜单名称" clearable @keyup.enter.native="loadList"/>
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
          <el-button type="success" icon="el-icon-plus" @click="openCreateDialog()">新增菜单</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table v-loading="loading" :data="tableData" border stripe size="small" row-key="menuId"
        :tree-props="{ children: 'children' }" :default-expand-all="allExpanded">
        <el-table-column label="菜单名称" prop="menuName" min-width="200"/>
        <el-table-column label="类型" width="80">
          <template slot-scope="scope">
            <el-tag size="mini" :type="typeTagColor(scope.row.menuType)">{{ typeLabel(scope.row.menuType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="orderNum" width="80"/>
        <el-table-column label="路径" prop="path" min-width="140"/>
        <el-table-column label="组件" prop="component" min-width="180" show-overflow-tooltip/>
        <el-table-column label="权限标识" prop="perms" min-width="160" show-overflow-tooltip/>
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

    <el-dialog :title="dialogMode === 'create' ? '新增菜单' : '编辑菜单'" :visible.sync="dialogVisible" width="640px" :close-on-click-modal="false">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px" size="small">
        <el-form-item label="上级菜单">
          <el-cascader v-model="form.parentId" :options="cascaderOptions" :props="cascaderProps" clearable placeholder="顶层菜单" style="width:100%"/>
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="form.menuType">
            <el-radio label="M">目录</el-radio>
            <el-radio label="C">菜单</el-radio>
            <el-radio label="F">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="form.menuName"/>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.orderNum" :min="0"/>
        </el-form-item>
        <el-form-item v-if="form.menuType !== 'F'" label="路由地址" prop="path">
          <el-input v-model="form.path" placeholder="如 user / tenant"/>
        </el-form-item>
        <el-form-item v-if="form.menuType === 'C'" label="组件路径">
          <el-input v-model="form.component" placeholder="如 visionAI/systemManagement/userManagement"/>
        </el-form-item>
        <el-form-item label="权限标识">
          <el-input v-model="form.perms" placeholder="如 system:user:list"/>
        </el-form-item>
        <el-form-item v-if="form.menuType !== 'F'" label="图标">
          <el-input v-model="form.icon" placeholder="el-icon-* 或自定义"/>
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
import { listMenus, addMenu, updateMenu, deleteMenu, getMenu, menuTree } from '@/api/menu'

export default {
  name: 'MenuManagement',
  data () {
    return {
      query: { menuName: '', status: '' },
      flatList: [],
      tableData: [],
      cascaderOptions: [],
      cascaderProps: { value: 'menuId', label: 'menuName', children: 'children', checkStrictly: true, emitPath: false },
      loading: false,
      allExpanded: false,
      dialogVisible: false, dialogMode: 'create', submitting: false,
      form: this.emptyForm(),
      rules: {
        menuType: [{ required: true, message: '请选择菜单类型', trigger: 'change' }],
        menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
        path: [{ required: true, message: '请输入路由地址', trigger: 'blur' }]
      }
    }
  },
  mounted () {
    this.loadList()
  },
  methods: {
    emptyForm () {
      return {
        menuId: null, parentId: 0, menuName: '', menuType: 'C', orderNum: 0,
        path: '', component: '', perms: '', icon: '#', status: '0',
        isFrame: 1, isCache: 0, visible: '0'
      }
    },
    typeLabel (t) { return { M: '目录', C: '菜单', F: '按钮' }[t] || t },
    typeTagColor (t) { return { M: '', C: 'success', F: 'info' }[t] || '' },
    loadList () {
      this.loading = true
      Promise.all([listMenus(this.query), menuTree()]).then(([listRes, treeRes]) => {
        this.flatList = listRes.data || []
        const tree = treeRes.data || this.buildTree(this.flatList)
        this.tableData = tree
        this.cascaderOptions = [{ menuId: 0, menuName: '顶层菜单', children: tree }]
      }).finally(() => { this.loading = false })
    },
    buildTree (flat, parentId = 0) {
      return flat.filter(m => m.parentId === parentId).map(m => ({
        ...m, children: this.buildTree(flat, m.menuId)
      }))
    },
    resetQuery () {
      this.query = { menuName: '', status: '' }
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
      if (parentRow) this.form.parentId = parentRow.menuId
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
    },
    openEditDialog (row) {
      this.dialogMode = 'edit'
      getMenu(row.menuId).then(res => {
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
        const api = this.dialogMode === 'create' ? addMenu(payload) : updateMenu(this.form.menuId, payload)
        api.then(res => {
          this.$message({ message: res.msg || '操作成功', type: 'success' })
          this.dialogVisible = false
          this.loadList()
        }).finally(() => { this.submitting = false })
      })
    },
    onDelete (row) {
      this.$confirm(`确认删除菜单「${row.menuName}」？如果它有子菜单将一并失败`, '确认删除', { type: 'warning' }).then(() => {
        deleteMenu(row.menuId).then(res => {
          this.$message({ message: res.msg || '删除成功', type: 'success' })
          this.loadList()
        })
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.menu-mgmt { padding: 16px; }
.page-header { margin-bottom: 12px; }
.page-header h2 { margin: 0 0 4px; }
.subtitle { margin: 0; color: #909399; font-size: 12px; }
.filter-card { margin-bottom: 12px; }
</style>

<template>
  <div class="menu-mgmt">
    <div class="page-header">
      <h2>菜单管理</h2>
      <p class="subtitle">维护系统菜单（目录 M / 菜单 C）。权限粒度仅到菜单级，按需通过角色绑定。</p>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="query" size="small">
        <el-form-item label="菜单名称">
          <el-input v-model="query.menuName" placeholder="菜单名称" clearable @keyup.enter.native="loadList"/>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width:120px" @change="loadList">
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
        <el-table-column label="菜单名称" prop="menuName" min-width="200">
          <template slot-scope="scope">
            <i v-if="scope.row.icon" :class="iconClass(scope.row.icon)" style="margin-right:6px;color:#409EFF"></i>
            <span>{{ scope.row.menuName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80">
          <template slot-scope="scope">
            <el-tag size="mini" :type="typeTagColor(scope.row.menuType)">{{ typeLabel(scope.row.menuType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="orderNum" width="80"/>
        <el-table-column label="路径" prop="path" min-width="180"/>
        <el-table-column label="组件" prop="component" min-width="220" show-overflow-tooltip/>
        <el-table-column label="状态" width="80">
          <template slot-scope="scope">
            <el-tag :type="isMenuActive(scope.row.status) ? 'success' : 'danger'" size="mini">
              {{ isMenuActive(scope.row.status) ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template slot-scope="scope">
            <el-button v-if="scope.row.menuType === 'M'" type="text" @click="openCreateDialog(scope.row)">新增子项</el-button>
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
          </el-radio-group>
          <span style="margin-left:12px;color:#909399;font-size:12px">
            目录用于聚合子菜单（如"监控预警"）；菜单对应一个具体页面（如"实时监控"）
          </span>
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="form.menuName"/>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.orderNum" :min="0"/>
        </el-form-item>
        <el-form-item label="路由地址" prop="path">
          <el-input v-model="form.path" :placeholder="pathPlaceholder"/>
        </el-form-item>
        <el-form-item v-if="form.menuType === 'C'" label="组件路径">
          <el-input v-model="form.component" placeholder="如 visionAI/monitoringWarning/realTimeMonitoring"/>
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="el-icon-* 或省略前缀如 video-camera"/>
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
  computed: {
    pathPlaceholder () {
      if (this.form.menuType === 'M') {
        return '如 monitoring（顶级目录会自动加 /）'
      }
      return '如 realtime（拼到父目录下）或 /visualCenter（绝对路径）'
    }
  },
  mounted () {
    this.loadList()
  },
  methods: {
    emptyForm () {
      // 权限粒度仅到菜单级：不再使用 perms / F 按钮，statically pass through 字段保持后端兼容
      return {
        menuId: null, parentId: 0, menuName: '', menuType: 'C', orderNum: 0,
        path: '', component: '', icon: '#', status: '0',
        isFrame: 1, isCache: 0, visible: '0', perms: null
      }
    },
    typeLabel (t) { return { M: '目录', C: '菜单' }[t] || t },
    typeTagColor (t) { return { M: '', C: 'success' }[t] || '' },
    iconClass (icon) {
      if (!icon || icon === '#') return ''
      return icon.startsWith('el-icon-') ? icon : ('el-icon-' + icon)
    },
    isMenuActive (status) {
      return String(status) === '0'
    },
    /** 树形表格在数据变更后需先清空再赋值，否则状态等字段可能不刷新 */
    applyTableData (tree) {
      const data = tree || []
      this.tableData = []
      this.$nextTick(() => {
        this.tableData = data
      })
    },
    filterMenuTree (list) {
      return (list || []).filter(m => m.menuType !== 'F').map(m => ({
        ...m,
        children: this.filterMenuTree(m.children)
      }))
    },
    loadList () {
      this.loading = true
      // 列表/筛选走 list（支持 status）；上级菜单级联走 tree（全量，不受筛选影响）
      Promise.all([listMenus(this.query), menuTree()]).then(([listRes, treeRes]) => {
        this.flatList = (listRes.data || []).filter(m => m.menuType !== 'F')
        const tableTree = this.filterMenuTree(this.buildTree(this.flatList))
        this.applyTableData(tableTree)

        const cascaderTree = this.filterMenuTree(treeRes.data || this.buildTree(this.flatList))
        this.cascaderOptions = [{ menuId: 0, menuName: '顶层菜单', children: this.dirOnly(cascaderTree) }]
      }).finally(() => { this.loading = false })
    },
    /** 保存/停用后刷新顶栏动态菜单 */
    refreshSidebarMenus () {
      if (this.$store && this.$store.dispatch) {
        this.$store.dispatch('GenerateRoutes').catch(() => {})
      }
    },
    /** 上级菜单选择器只展示目录（M），避免把菜单/按钮当父级 */
    dirOnly (nodes) {
      return (nodes || [])
        .filter(n => n.menuType === 'M')
        .map(n => ({ ...n, children: this.dirOnly(n.children) }))
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
        const data = res.data || row
        this.form = Object.assign(this.emptyForm(), data, {
          status: data.status != null ? String(data.status) : '0'
        })
        this.dialogVisible = true
        this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())
      })
    },
    onSubmit () {
      this.$refs.form.validate(valid => {
        if (!valid) return
        const payload = Object.assign({}, this.form)
        if (!payload.parentId) payload.parentId = 0
        // 目录类型不需要 component
        if (payload.menuType === 'M') payload.component = null
        this.submitting = true
        const api = this.dialogMode === 'create' ? addMenu(payload) : updateMenu(this.form.menuId, payload)
        api.then(res => {
          this.$message({ message: res.msg || '操作成功', type: 'success' })
          this.dialogVisible = false
          this.loadList()
          this.refreshSidebarMenus()
        }).finally(() => { this.submitting = false })
      })
    },
    onDelete (row) {
      this.$confirm(`确认删除菜单「${row.menuName}」？如果它有子菜单将一并失败`, '确认删除', { type: 'warning' }).then(() => {
        deleteMenu(row.menuId).then(res => {
          this.$message({ message: res.msg || '删除成功', type: 'success' })
          this.loadList()
          this.refreshSidebarMenus()
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

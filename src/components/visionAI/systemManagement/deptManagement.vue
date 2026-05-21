<template>

  <div class="dept-mgmt">

    <div class="page-header">

      <h2>部门管理</h2>

      <p class="subtitle">维护组织架构（树形）</p>

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

      <div v-if="deptCount > 0" class="table-summary">共 {{ deptCount }} 个部门</div>

      <el-table

        ref="deptTable"

        v-loading="loading"

        :data="tableData"

        border

        stripe

        size="small"

        row-key="deptId"

        :tree-props="{ children: 'children' }"

        :default-expand-all="allExpanded"

        empty-text="暂无部门数据"

      >

        <el-table-column label="部门名称" prop="deptName" min-width="200" show-overflow-tooltip/>

        <el-table-column label="级联路径" min-width="220" show-overflow-tooltip>

          <template slot-scope="scope">

            <span class="dept-path">{{ formatDeptPath(scope.row) }}</span>

          </template>

        </el-table-column>

        <el-table-column label="上级部门" min-width="120" show-overflow-tooltip>

          <template slot-scope="scope">

            {{ formatParentName(scope.row) }}

          </template>

        </el-table-column>

        <el-table-column label="排序" prop="orderNum" width="72" align="center"/>

        <el-table-column label="负责人" prop="leader" min-width="100" show-overflow-tooltip>

          <template slot-scope="scope">{{ scope.row.leader || '—' }}</template>

        </el-table-column>

        <el-table-column label="联系电话" prop="phone" width="130" show-overflow-tooltip>

          <template slot-scope="scope">{{ scope.row.phone || '—' }}</template>

        </el-table-column>

        <el-table-column label="邮箱" prop="email" min-width="160" show-overflow-tooltip>

          <template slot-scope="scope">{{ scope.row.email || '—' }}</template>

        </el-table-column>

        <el-table-column label="用户数" prop="userCount" width="72" align="center">

          <template slot-scope="scope">

            {{ scope.row.userCount != null ? scope.row.userCount : 0 }}

          </template>

        </el-table-column>

        <el-table-column label="状态" width="88" align="center">

          <template slot-scope="scope">

            <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'" size="mini">

              {{ scope.row.status === '0' ? '正常' : '停用' }}

            </el-tag>

          </template>

        </el-table-column>

        <el-table-column label="创建时间" prop="createTime" width="160" show-overflow-tooltip/>

        <el-table-column label="操作" width="220" fixed="right">

          <template slot-scope="scope">

            <el-button type="text" @click="openCreateDialog(scope.row)">新增子项</el-button>

            <el-button type="text" @click="openEditDialog(scope.row)">编辑</el-button>

            <el-button
              type="text"
              style="color:#f56c6c"
              :disabled="isDeptDeleteDisabled(scope.row)"
              @click="onDelete(scope.row)">删除</el-button>

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

          <el-radio-group v-model="form.status" :disabled="isDeptStatusDisabled()">

            <el-radio label="0">正常</el-radio>

            <el-radio label="1">停用</el-radio>

          </el-radio-group>

          <span v-if="deptStatusBlockReason()" class="protected-tip">{{ deptStatusBlockReason() }}</span>

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



const DEPT_PATH_SEP = ' / '



export default {

  name: 'DeptManagement',

  data () {

    return {

      query: { deptName: '', status: '' },

      allFlat: [],

      deptById: {},

      flatList: [],

      tableData: [],

      deptCount: 0,

      cascaderOptions: [],

      cascaderProps: { value: 'deptId', label: 'deptName', children: 'children', checkStrictly: true, emitPath: false },

      loading: false,

      allExpanded: true,

      dialogVisible: false,

      dialogMode: 'create',

      submitting: false,

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

    hasAssignedUsers (row) {

      return row && Number(row.userCount) > 0

    },

    hasChildDepts (row) {

      if (!row) return false

      if (row.children && row.children.length) return true

      return Number(row.childCount) > 0

    },

    isDeptDeleteDisabled (row) {

      return this.hasChildDepts(row) || this.hasAssignedUsers(row)

    },

    isDeptStatusDisabled () {

      return this.dialogMode === 'edit' && !!this.deptStatusBlockReason()

    },

    deptStatusBlockReason () {

      if (this.dialogMode !== 'edit') return ''

      const reasons = []

      if (Number(this.form.childCount) > 0) {

        reasons.push(`存在 ${this.form.childCount} 个下级部门`)

      }

      if (Number(this.form.userCount) > 0) {

        reasons.push(`已分配 ${this.form.userCount} 个用户`)

      }

      if (!reasons.length) return ''

      return reasons.join('，') + '，不可停用'

    },

    emptyForm () {

      return { deptId: null, parentId: 0, deptName: '', orderNum: 0, leader: '', phone: '', email: '', status: '0', userCount: 0, childCount: 0 }

    },

    rebuildDeptIndex (flat) {

      const map = {}

      ;(flat || []).forEach(d => { map[d.deptId] = d })

      this.deptById = map

    },

    formatParentName (row) {

      if (!row || !row.parentId) return '—'

      const parent = this.deptById[row.parentId]

      return parent ? parent.deptName : '—'

    },

    formatDeptPath (row) {

      if (!row) return '—'

      const parts = []

      const ancestors = (row.ancestors || '').split(',')

      ancestors.forEach(token => {

        const id = parseInt(token, 10)

        if (!id) return

        const d = this.deptById[id]

        if (d) parts.push(d.deptName)

      })

      parts.push(row.deptName)

      return parts.join(DEPT_PATH_SEP) || row.deptName || '—'

    },

    countTreeNodes (nodes) {

      let n = 0

      ;(nodes || []).forEach(item => {

        n += 1

        if (item.children && item.children.length) {

          n += this.countTreeNodes(item.children)

        }

      })

      return n

    },

    applyTableData (tree) {

      const data = tree || []

      this.tableData = []

      this.$nextTick(() => {

        this.tableData = data

        this.deptCount = this.countTreeNodes(data)

      })

    },

    /** 筛选命中节点时补齐祖先链，保证树表结构完整 */

    withAncestorChain (matched, all) {

      const byId = {}

      ;(all || []).forEach(d => { byId[d.deptId] = d })

      const out = new Map()

      const add = (d) => {

        if (!d || out.has(d.deptId)) return

        out.set(d.deptId, d)

        if (d.parentId && d.parentId !== 0 && byId[d.parentId]) {

          add(byId[d.parentId])

        }

      }

      ;(matched || []).forEach(add)

      return Array.from(out.values())

    },

    applyClientFilter (allFlat) {

      let rows = allFlat

      const kw = (this.query.deptName || '').trim()

      if (kw) {

        rows = rows.filter(d => (d.deptName || '').includes(kw))

      }

      if (this.query.status) {

        rows = rows.filter(d => String(d.status) === String(this.query.status))

      }

      if (kw || this.query.status) {

        rows = this.withAncestorChain(rows, allFlat)

      }

      return rows

    },

    buildTree (flat, parentId = 0) {

      return flat

        .filter(d => d.parentId === parentId)

        .map(d => {

          const children = this.buildTree(flat, d.deptId)

          const node = { ...d }

          if (children.length) node.children = children

          return node

        })

    },

    loadList () {

      this.loading = true

      Promise.all([listDepts({}), deptTree()]).then(([listRes, treeRes]) => {

        this.allFlat = listRes.data || []

        this.rebuildDeptIndex(this.allFlat)

        this.flatList = this.applyClientFilter(this.allFlat)

        this.applyTableData(this.buildTree(this.flatList))



        const cascaderTree = treeRes.data || this.buildTree(this.allFlat)

        this.cascaderOptions = [{ deptId: 0, deptName: '顶层部门', children: cascaderTree }]

      }).finally(() => { this.loading = false })

    },

    resetQuery () {

      this.query = { deptName: '', status: '' }

      this.loadList()

    },

    toggleExpand () {

      this.allExpanded = !this.allExpanded

      const table = this.$refs.deptTable

      if (!table) return

      const walk = (rows) => {

        ;(rows || []).forEach(row => {

          table.toggleRowExpansion(row, this.allExpanded)

          if (row.children && row.children.length) walk(row.children)

        })

      }

      this.$nextTick(() => walk(this.tableData))

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

        this.form = Object.assign(this.emptyForm(), res.data || row, {

          parentId: (res.data && res.data.parentId != null) ? res.data.parentId : 0,

          status: (res.data && res.data.status != null) ? String(res.data.status) : '0',

          userCount: (res.data && res.data.userCount != null) ? res.data.userCount : (row.userCount || 0),

          childCount: (res.data && res.data.childCount != null) ? res.data.childCount : (row.childCount || 0)

        })

        this.dialogVisible = true

        this.$nextTick(() => this.$refs.form && this.$refs.form.clearValidate())

      }).catch(() => {

        this.$message.error('加载部门详情失败')

      })

    },

    onSubmit () {

      this.$refs.form.validate(valid => {

        if (!valid) return

        if (this.dialogMode === 'edit' && this.form.status === '1') {

          const blockReason = this.deptStatusBlockReason()

          if (blockReason) {

            this.$message.warning(blockReason)

            return

          }

        }

        const payload = Object.assign({}, this.form)

        delete payload.userCount

        delete payload.childCount

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

      if (this.hasChildDepts(row)) {

        this.$message.warning(`部门「${row.deptName}」存在下级部门，请先删除子部门`)

        return

      }

      if (this.hasAssignedUsers(row)) {

        this.$message.warning(`部门「${row.deptName}」已分配 ${row.userCount} 个用户，请先在用户管理中调整所属部门后再删除`)

        return

      }

      this.$confirm(`确认删除部门「${row.deptName}」？`, '确认删除', { type: 'warning' }).then(() => {

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

.table-summary { margin-bottom: 8px; font-size: 13px; color: #909399; }

.dept-path { color: #606266; font-size: 12px; }

.protected-tip { margin-left: 8px; font-size: 12px; color: #e6a23c; }

</style>



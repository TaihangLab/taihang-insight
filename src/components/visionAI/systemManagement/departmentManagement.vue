<template>
  <div class="department-management-container">
    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <el-form :inline="true">
        <el-form-item label="部门名称">
          <el-input
            v-model="searchForm.deptName"
            placeholder="请输入部门名称"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="正常" value="0"></el-option>
            <el-option label="停用" value="1"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchDepts">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 部门列表表格 -->
    <div class="table-container">
      <div class="table-operations">
        <el-button type="primary" icon="el-icon-plus" size="small" @click="addDept">新增</el-button>
        <el-button icon="el-icon-s-unfold" size="small" @click="toggleExpandAll">展开/折叠</el-button>
      </div>
      
      <el-table
        ref="customTable"
        :data="tableData"
        v-loading="loading"
        row-key="id"
        :tree-props="{children: 'children', hasChildren: 'hasChildren'}"
        :border="false"
        class="custom-table"
        style="width: 100%"
        table-layout="fixed"
        :default-expand-all="false"
      >
        <el-table-column prop="deptName" label="部门名称" min-width="200" align="left" header-align="center">
          <template slot-scope="scope">
            <span :style="{ paddingLeft: (scope.row.level * 20) + 'px' }">{{ scope.row.deptName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" label="排序" width="80" align="center"></el-table-column>
        <el-table-column prop="leader" label="负责人" min-width="100" align="center"></el-table-column>
        <el-table-column prop="phone" label="联系电话" min-width="120" align="center"></el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="150" align="center"></el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="mini">
              {{ scope.row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="160" align="center"></el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template slot-scope="scope">
            <div class="operation-buttons">
              <el-button type="text" class="edit-btn" @click="editDept(scope.row)">编辑</el-button>
              <el-button type="text" class="add-btn" @click="addSubDept(scope.row)">添加</el-button>
              <el-button type="text" class="delete-btn" @click="deleteDept(scope.row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <!-- 新增/编辑部门对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="deptDialogVisible"
      width="600px"
      class="dept-dialog"
    >
      <el-form :model="deptForm" :rules="deptRules" ref="deptForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="上级部门">
              <el-select v-model="deptForm.parentId" placeholder="选择上级部门" style="width: 100%">
                <el-option
                  v-for="dept in parentDeptOptions"
                  :key="dept.id"
                  :label="dept.deptName"
                  :value="dept.id">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门名称" prop="deptName" required>
              <el-input v-model="deptForm.deptName" placeholder="请输入部门名称"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="显示排序" prop="orderNum" required>
              <el-input-number v-model="deptForm.orderNum" :min="0" :max="999" controls-position="right" style="width: 100%"></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-select v-model="deptForm.leader" placeholder="请选择负责人" style="width: 100%">
                <el-option
                  v-for="user in userOptions"
                  :key="user.id"
                  :label="user.name"
                  :value="user.name">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="deptForm.phone" placeholder="请输入联系电话"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="deptForm.email" placeholder="请输入邮箱"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="部门状态">
              <el-radio-group v-model="deptForm.status">
                <el-radio label="0">正常</el-radio>
                <el-radio label="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="deptDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDept">确定</el-button>
      </span>
    </el-dialog>
    
    <!-- 删除确认对话框 -->
    <el-dialog
      title="确认删除"
      :visible.sync="deleteDialogVisible"
      width="400px"
    >
      <div class="confirm-message">
        <i class="el-icon-warning"></i>
        <span>确定要删除选中的部门吗？此操作不可恢复。</span>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确定删除</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { 
  listDept, 
  getDept, 
  addDept, 
  updateDept, 
  delDept, 
  listDeptExcludeChild 
} from '@/api/system/dept'
import { listUser } from '@/api/system/user'

export default {
  name: 'DepartmentManagement',
  
  data() {
    return {
      // 搜索表单
      searchForm: {
        deptName: '',
        status: ''
      },
      
      // 表格数据
      tableData: [],
      loading: false,
      expandAll: true,
      
      // 部门表单
      deptForm: {
        deptId: null,
        parentId: 0,
        deptName: '',
        orderNum: 0,
        status: '0',
        leader: '',
        phone: '',
        email: ''
      },
      
      // 上级部门选项
      parentDeptOptions: [],
      
      // 用户选项
      userOptions: [],
      
      // 表单验证规则
      deptRules: {
        deptName: [
          { required: true, message: '请输入部门名称', trigger: 'blur' },
          { min: 2, max: 30, message: '部门名称长度在2到30个字符', trigger: 'blur' }
        ],
        orderNum: [
          { required: true, message: '请输入显示排序', trigger: 'blur' }
        ]
      },
      
      // 对话框
      deptDialogVisible: false,
      deleteDialogVisible: false,
      dialogTitle: '添加部门',
      currentDept: null
    }
  },
  
  created() {
    this.getDeptList()
    this.getUserOptions()
  },
  
  methods: {
    // 获取部门列表
    async getDeptList() {
      this.loading = true
      try {
        const params = {
          dept_name: this.searchForm.deptName || undefined,
          status: this.searchForm.status || undefined
        }
        
        const response = await listDept(params)
        if (response.code === 200) {
          // 后端已经返回树形结构，直接转换字段格式
          this.tableData = this.convertDeptData(response.data || [])
          
          // 加载完成后展开所有节点
          this.$nextTick(() => {
            this.setTableExpandState(this.tableData, true)
          })
        } else {
          this.$message.error(response.msg || '获取部门列表失败')
        }
      } catch (error) {
        console.error('获取部门列表失败:', error)
        this.$message.error('获取部门列表失败')
      } finally {
        this.loading = false
      }
    },
    
    // 转换部门数据格式（后端已经是树形结构）
    convertDeptData(deptList) {
      return deptList.map(dept => {
        const deptNode = {
          id: dept.deptId,
          deptId: dept.deptId,
          parentId: dept.parentId,
          deptName: dept.deptName,
          orderNum: dept.orderNum,
          status: dept.status === '0' ? 1 : 0, // 转换状态显示
          leader: dept.leader,
          phone: dept.phone,
          email: dept.email,
          createTime: dept.createTime ? new Date(dept.createTime).toLocaleString() : '',
          children: dept.children ? this.convertDeptData(dept.children) : []
        }
        return deptNode
      }).sort((a, b) => a.orderNum - b.orderNum)
    },
    
    // 搜索部门
    async searchDepts() {
      await this.getDeptList()
      this.$message.success('搜索成功')
    },
    
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        deptName: '',
        status: ''
      }
      this.getDeptList()
    },
    
    // 展开/折叠
    toggleExpandAll() {
      this.expandAll = !this.expandAll
      this.$nextTick(() => {
        this.setTableExpandState(this.tableData, this.expandAll)
      })
    },
    
    // 递归设置表格展开状态
    setTableExpandState(data, expand) {
      data.forEach(item => {
        if (item.children && item.children.length > 0) {
          this.$refs.customTable.toggleRowExpansion(item, expand)
          this.setTableExpandState(item.children, expand)
        }
      })
    },
    
    // 添加部门
    addDept() {
      this.dialogTitle = '添加部门'
      this.deptForm = {
        deptId: null,
        parentId: 0,
        deptName: '',
        orderNum: 0,
        status: '0',
        leader: '',
        phone: '',
        email: ''
      }
      this.getParentDeptOptions()
      this.deptDialogVisible = true
      
      this.$nextTick(() => {
        this.$refs.deptForm && this.$refs.deptForm.clearValidate()
      })
    },
    
    // 添加子部门
    addSubDept(row) {
      this.dialogTitle = '添加子部门'
      this.deptForm = {
        deptId: null,
        parentId: row.deptId,
        deptName: '',
        orderNum: 0,
        status: '0',
        leader: '',
        phone: '',
        email: ''
      }
      this.getParentDeptOptions()
      this.deptDialogVisible = true
      
      this.$nextTick(() => {
        this.$refs.deptForm && this.$refs.deptForm.clearValidate()
      })
    },
    
    // 编辑部门
    async editDept(row) {
      this.dialogTitle = '编辑部门'
      this.currentDept = row
      
      try {
        const response = await getDept(row.deptId)
        if (response.code === 200) {
          const deptData = response.data
          this.deptForm = {
            deptId: deptData.deptId,
            parentId: deptData.parentId,
            deptName: deptData.deptName,
            orderNum: deptData.orderNum,
            status: deptData.status,
            leader: deptData.leader || '',
            phone: deptData.phone || '',
            email: deptData.email || ''
          }
        } else {
          this.$message.error(response.msg || '获取部门详情失败')
          return
        }
      } catch (error) {
        console.error('获取部门详情失败:', error)
        this.$message.error('获取部门详情失败')
        return
      }
      
      this.getParentDeptOptions(row.deptId)
      this.deptDialogVisible = true
      
      this.$nextTick(() => {
        this.$refs.deptForm && this.$refs.deptForm.clearValidate()
      })
    },
    
    // 删除部门
    deleteDept(row) {
      this.currentDept = row
      this.deleteDialogVisible = true
    },
    
    // 确认删除
    async confirmDelete() {
      try {
        this.loading = true
        const response = await delDept(this.currentDept.deptId)
        
        if (response.code === 200) {
          this.$message.success('删除成功')
          this.deleteDialogVisible = false
          this.getDeptList()
        } else {
          this.$message.error(response.msg || '删除失败')
        }
      } catch (error) {
        console.error('删除部门失败:', error)
        this.$message.error('删除部门失败')
      } finally {
        this.loading = false
      }
    },
    
    // 保存部门
    async saveDept() {
      try {
        await this.$refs.deptForm.validate()
        
        this.loading = true
        
        // 转换字段名格式，从驼峰转为下划线
        const deptData = {
          dept_id: this.deptForm.deptId,
          parent_id: this.deptForm.parentId,
          dept_name: this.deptForm.deptName,
          order_num: this.deptForm.orderNum,
          status: this.deptForm.status,
          leader: this.deptForm.leader || '',
          phone: this.deptForm.phone || '',
          email: this.deptForm.email || ''
        }
        
        let response
        if (this.deptForm.deptId) {
          // 编辑部门
          response = await updateDept(deptData)
        } else {
          // 新增部门
          response = await addDept(deptData)
        }
        
        if (response.code === 200) {
          this.$message.success(this.deptForm.deptId ? '修改成功' : '新增成功')
          this.deptDialogVisible = false
          this.getDeptList()
        } else {
          this.$message.error(response.msg || '操作失败')
        }
      } catch (error) {
        if (error !== false) { // 不是表单验证错误
          console.error('保存部门失败:', error)
          this.$message.error('保存部门失败')
        }
      } finally {
        this.loading = false
      }
    },
    
    // 获取上级部门选项
    async getParentDeptOptions(excludeDeptId = null) {
      try {
        let response
        if (excludeDeptId) {
          // 编辑时排除当前部门及其子部门
          response = await listDeptExcludeChild(excludeDeptId)
        } else {
          // 新增时获取所有部门
          response = await listDept({})
        }
        
        if (response.code === 200) {
          const deptList = response.data || []
          this.parentDeptOptions = [
            { id: 0, deptName: '无上级部门' },
            ...deptList.map(dept => ({
              id: dept.deptId,
              deptName: dept.deptName
            }))
          ]
        }
      } catch (error) {
        console.error('获取上级部门选项失败:', error)
      }
    },
    
    // 获取用户选项
    async getUserOptions() {
      try {
        const response = await listUser({ pageNum: 1, pageSize: 1000 })
        if (response.code === 200) {
          const users = response.data.rows || []
          this.userOptions = users.map(user => ({
            id: user.user_id,
            name: user.nick_name || user.user_name
          }))
        }
      } catch (error) {
        console.error('获取用户选项失败:', error)
        // 用户选项获取失败不影响主要功能，只记录错误
      }
    }
  }
}
</script>

<style scoped>
/* 整体背景 */
.department-management-container {
  padding: 20px;
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%);
  min-height: calc(100vh - 100px);
}

/* 搜索区卡片 */
.filter-section {
  margin-bottom: 20px;
  padding: 18px 24px;
  background: #f5f7fa;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.05);
}

/* 搜索表单美化 */
.filter-section .el-form-item {
  margin-bottom: 0;
}
.filter-section .el-form-item__label {
  color: #303133;
  font-weight: 500;
}
.filter-section >>> .el-input__inner,
.filter-section >>> .el-select .el-input__inner {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: #fff;
}
.filter-section >>> .el-input__inner:hover,
.filter-section >>> .el-select .el-input__inner:hover {
  border-color: #3b82f6;
}
.filter-section >>> .el-input__inner:focus,
.filter-section >>> .el-select .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 搜索按钮 */
.filter-section >>> .el-button--primary {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #06b6d4 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4), 0 2px 4px rgba(30, 64, 175, 0.3);
  color: white;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s ease;
}
.filter-section >>> .el-button--primary:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0891b2 100%);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5), 0 4px 8px rgba(30, 64, 175, 0.4);
  transform: translateY(-2px);
}
.filter-section >>> .el-button:not(.el-button--primary) {
  background: #f5f7fa;
  border-color: #e4e7ed;
  color: #606266;
  border-radius: 8px;
  transition: all 0.3s ease;
}
.filter-section >>> .el-button:not(.el-button--primary):hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  color: #1e3a8a;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
  transform: translateY(-1px);
}

/* 主卡片样式 */
.table-container {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  margin-top: 0;
  position: relative;
  overflow: hidden;
}

/* 操作按钮区 */
.table-operations {
  padding: 18px 24px 18px 24px;
  text-align: left;
  border-bottom: none;
}
.table-operations >>> .el-button {
  margin-right: 8px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}
.table-operations >>> .el-button--primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  border: none;
  color: #fff;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}
.table-operations >>> .el-button--primary:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}
.table-operations >>> .el-button:not(.el-button--primary) {
  background: #f5f7fa;
  border-color: #e4e7ed;
  color: #606266;
}
.table-operations >>> .el-button:not(.el-button--primary):hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #3b82f6;
  color: #1e3a8a;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
  transform: translateY(-1px);
}

/* 表格样式 */
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

/* 部门名称列左对齐 */
.custom-table >>> .el-table__row td:first-child {
  text-align: left !important;
  padding-left: 16px !important;
}

.custom-table >>> .el-table__header-wrapper th:first-child {
  text-align: left !important;
  padding-left: 16px !important;
}

/* 树形表格缩进样式 */
.custom-table >>> .el-table__row--level-1 td:first-child {
  padding-left: 36px !important;
}

.custom-table >>> .el-table__row--level-2 td:first-child {
  padding-left: 56px !important;
}

.custom-table >>> .el-table__row--level-3 td:first-child {
  padding-left: 76px !important;
}

.custom-table >>> .el-table__row--level-4 td:first-child {
  padding-left: 96px !important;
}

/* 折叠展开图标样式 */
.custom-table >>> .el-table__expand-icon {
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  margin-right: 8px;
  color: #3b82f6;
  font-size: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 3px;
  background: #f8fafc;
  transition: all 0.3s ease;
}

.custom-table >>> .el-table__expand-icon:hover {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.custom-table >>> .el-table__expand-icon--expanded {
  transform: rotate(90deg);
}

/* 更通用的树形缩进处理 */
.custom-table >>> .el-table__body .el-table__row .el-table__indent {
  width: 20px;
}

.custom-table >>> .el-table__placeholder {
  width: 20px;
  display: inline-block;
}

/* 通过深度选择器处理不同层级的缩进 */
.custom-table >>> .el-table__row[aria-rowindex] td:first-child .cell {
  padding-left: 0;
  display: flex;
  align-items: center;
}

/* 树形节点的样式调整 */
.custom-table >>> .el-table__row td:first-child .cell {
  text-align: left;
  display: flex;
  align-items: center;
}

.custom-table >>> .el-table__row td:first-child .el-table__expand-icon {
  flex-shrink: 0;
  margin-right: 6px;
}

/* 表格操作按钮样式 */
.operation-buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.edit-btn, .delete-btn, .add-btn {
  padding: 2px 6px !important;
  font-size: 11px !important;
  border-radius: 4px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  background: #f5f7fa !important;
  border-color: #e4e7ed !important;
  color: #606266 !important;
  height: 24px !important;
  min-width: 45px !important;
}

.edit-btn:hover, .delete-btn:hover, .add-btn:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e3a8a !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2) !important;
  transform: translateY(-1px) !important;
}

/* 科技感状态标签样式 */
.department-management-container >>> .el-table .el-tag--success {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
  color: #065f46 !important;
  border: 1px solid #a7f3d0 !important;
  border-radius: 6px !important;
  font-weight: 500 !important;
  font-size: 12px !important;
  padding: 0 8px !important;
  height: 24px !important;
  line-height: 22px !important;
}

.department-management-container >>> .el-table .el-tag--danger {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%) !important;
  color: #991b1b !important;
  border: 1px solid #fca5a5 !important;
  border-radius: 6px !important;
  font-weight: 500 !important;
  font-size: 12px !important;
  padding: 0 8px !important;
  height: 24px !important;
  line-height: 22px !important;
}

.department-management-container >>> .el-table .el-tag--warning {
  background: linear-gradient(135deg, #fffbeb 0%, #fed7aa 100%) !important;
  color: #92400e !important;
  border: 1px solid #fbbf24 !important;
  border-radius: 6px !important;
  font-weight: 500 !important;
  font-size: 12px !important;
  padding: 0 8px !important;
  height: 24px !important;
  line-height: 22px !important;
}

.department-management-container >>> .el-table .el-tag--info {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  color: #1e40af !important;
  border: 1px solid #93c5fd !important;
  border-radius: 6px !important;
  font-weight: 500 !important;
  font-size: 12px !important;
  padding: 0 8px !important;
  height: 24px !important;
  line-height: 22px !important;
}

/* 统一表格内所有标签样式 */
.department-management-container >>> .el-table .el-tag {
  border-radius: 6px !important;
  font-weight: 500 !important;
  font-size: 12px !important;
  padding: 0 8px !important;
  height: 24px !important;
  line-height: 22px !important;
  transition: all 0.3s ease !important;
}

.department-management-container >>> .el-table .el-tag:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

/* 确认消息样式 */
.confirm-message {
  display: flex;
  align-items: center;
}
.confirm-message i {
  font-size: 20px;
  color: #e6a23c;
  margin-right: 10px;
}

/* 弹框样式 */
.department-management-container >>> .el-dialog {
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1) !important;
}

.department-management-container >>> .el-dialog__header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1) !important;
  padding: 16px 20px !important;
}

.department-management-container >>> .el-dialog__title {
  color: #1f2937 !important;
  font-weight: 600 !important;
}

.department-management-container >>> .el-dialog__close {
  color: #6b7280 !important;
  transition: color 0.3s ease !important;
}

.department-management-container >>> .el-dialog__close:hover {
  color: #3b82f6 !important;
}

.department-management-container >>> .el-dialog__body {
  padding: 20px !important;
  background: #ffffff !important;
}

.department-management-container >>> .el-dialog__footer {
  padding: 10px 20px 20px !important;
  text-align: right !important;
  border-top: 1px solid rgba(59, 130, 246, 0.1) !important;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
}

/* 弹框内按钮样式 */
.department-management-container >>> .el-dialog .el-button--primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%) !important;
  border: none !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3) !important;
  color: white !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
}

.department-management-container >>> .el-dialog .el-button--primary:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%) !important;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4) !important;
  transform: translateY(-1px) !important;
}

.department-management-container >>> .el-dialog .el-button--default {
  background: white !important;
  border: 1px solid #d1d5db !important;
  color: #4b5563 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
}

.department-management-container >>> .el-dialog .el-button--default:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
}

.department-management-container >>> .el-dialog .el-button--danger {
  background: linear-gradient(135deg, #f56c6c 0%, #e53e3e 100%) !important;
  border: none !important;
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.3) !important;
  color: white !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
}

.department-management-container >>> .el-dialog .el-button--danger:hover {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%) !important;
  box-shadow: 0 4px 10px rgba(245, 108, 108, 0.4) !important;
  transform: translateY(-1px) !important;
}

/* 表单样式美化 */
.department-management-container >>> .el-form-item__label {
  color: #303133;
  font-weight: 500;
}

.department-management-container >>> .el-form-item.is-required .el-form-item__label:before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

.department-management-container >>> .el-input__inner,
.department-management-container >>> .el-date-editor .el-input__inner,
.department-management-container >>> .el-select .el-input__inner,
.department-management-container >>> .el-textarea__inner {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.department-management-container >>> .el-input__inner:hover,
.department-management-container >>> .el-date-editor .el-input__inner:hover,
.department-management-container >>> .el-select .el-input__inner:hover,
.department-management-container >>> .el-textarea__inner:hover {
  border-color: #3b82f6;
}

.department-management-container >>> .el-input__inner:focus,
.department-management-container >>> .el-date-editor .el-input__inner:focus,
.department-management-container >>> .el-select .el-input__inner:focus,
.department-management-container >>> .el-textarea__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 下拉框样式优化 */
.department-management-container >>> .el-select-dropdown {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

/* 适配小屏幕 */
@media screen and (max-width: 768px) {
  .table-container {
    border-radius: 8px;
    padding: 0 2px;
  }
  .filter-section {
    border-radius: 8px;
    padding: 12px 8px;
  }
  .operation-buttons {
    flex-direction: column;
    gap: 4px;
  }
  .operation-buttons .el-button {
    font-size: 11px;
    padding: 2px 6px;
  }
  .el-dialog {
    border-radius: 8px;
  }
}
</style> 
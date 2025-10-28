<template>
  <div class="user-management-container">
    <div class="content-layout">
      <!-- 左侧组织架构树 -->
      <div class="left-panel">
        <div class="tree-container">
          <el-input
            placeholder="请输入部门名称"
            v-model="filterText"
            prefix-icon="el-icon-search"
            size="small"
            class="tree-search">
          </el-input>
          <el-tree
            class="department-tree"
            :data="treeData"
            :props="defaultProps"
            :filter-node-method="filterNode"
            ref="tree"
            node-key="id"
            :expand-on-click-node="false"
            :highlight-current="true"
            @node-click="handleNodeClick">
            <span class="custom-tree-node" slot-scope="{ node, data }">
              <span class="tree-label">{{ node.label }}</span>
              <span class="tree-count" v-if="data.deptId !== 0">({{ getUserCountByDept(data.deptId) }})</span>
            </span>
          </el-tree>
        </div>
      </div>

      <!-- 右侧用户管理区域 -->
      <div class="right-panel">
        <!-- 搜索筛选区域 -->
        <div class="filter-section">
          <el-form :inline="true" :model="searchForm" class="search-form">
            <el-form-item label="用户名称">
              <el-input
                v-model="searchForm.userName"
                placeholder="请输入用户名称"
                clearable
                style="width: 200px;">
              </el-input>
            </el-form-item>
            <el-form-item label="用户昵称">
              <el-input
                v-model="searchForm.nickName"
                placeholder="请输入用户昵称"
                clearable
                style="width: 200px;">
              </el-input>
            </el-form-item>
            <el-form-item label="手机号码">
              <el-input
                v-model="searchForm.phonenumber"
                placeholder="请输入手机号码"
                clearable
                style="width: 200px;">
              </el-input>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="用户状态" clearable style="width: 120px;">
                <el-option label="启用" value="1"></el-option>
                <el-option label="禁用" value="0"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="创建时间">
              <el-date-picker
                v-model="searchForm.createTimeRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd"
                style="width: 240px;">
              </el-date-picker>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" @click="handleSearch">搜索</el-button>
              <el-button icon="el-icon-refresh" @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- 表格操作区域 -->
        <div class="table-container">
          <div class="table-operations">
            <div class="left-buttons">
              <el-button type="primary" icon="el-icon-plus" size="small" @click="addUser">新增</el-button>
              <el-button icon="el-icon-delete" size="small" @click="batchDelete">删除</el-button>
              <el-dropdown @command="handleMoreAction" class="more-dropdown">
                <el-button size="small">
                  更多<i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="downloadTemplate">下载模板</el-dropdown-item>
                  <el-dropdown-item command="importData">导入数据</el-dropdown-item>
                  <el-dropdown-item command="exportData">导出数据</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            <div class="right-buttons">
              <el-button icon="el-icon-search" size="small" circle @click="toggleAdvancedSearch"></el-button>
              <el-button icon="el-icon-refresh" size="small" circle @click="refreshData"></el-button>
              <el-button icon="el-icon-setting" size="small" circle @click="showTableSetting"></el-button>
            </div>
          </div>

          <!-- 用户表格 -->
          <el-table
            :data="tableData"
            v-loading="loading"
            style="width: 100%"
            class="custom-table"
            @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="50" align="center"></el-table-column>
            <el-table-column prop="userName" label="用户名称" min-width="140" align="center"></el-table-column>
            <el-table-column prop="userNickname" label="用户昵称" min-width="150" align="center"></el-table-column>
            <el-table-column prop="department" label="部门" min-width="80" align="center"></el-table-column>
            <el-table-column prop="phoneNumber" label="手机号码" min-width="120" align="center"></el-table-column>
            <el-table-column prop="role" label="角色" min-width="100" align="center">
              <template slot-scope="scope">
                <span>{{ scope.row.role === 'admin' ? '管理员' : scope.row.role === 'user' ? '普通用户' : scope.row.role === 'guest' ? '访客' : scope.row.role }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template slot-scope="scope">
                <el-switch
                  v-model="scope.row.status"
                  active-color="#3b82f6"
                  inactive-color="#9ca3af"
                  @change="handleStatusChange(scope.row)">
                </el-switch>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" min-width="140" align="center"></el-table-column>
            <el-table-column label="操作" min-width="240" fixed="right" align="center">
              <template slot-scope="scope">
                <div class="operation-buttons">
                  <el-button type="text" class="edit-btn" @click="editUser(scope.row)">编辑</el-button>
                  <el-button type="text" class="delete-btn" @click="deleteUser(scope.row)">删除</el-button>
                  <el-button type="text" class="reset-btn" @click="resetPassword(scope.row)">重置</el-button>
                  <el-button type="text" class="assign-role-btn" @click="assignRole(scope.row)">分配角色</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页器 -->
          <div class="pagination-container">
            <el-pagination
              :current-page.sync="pagination.currentPage"
              :page-sizes="[10, 20, 50, 100]"
              :page-size.sync="pagination.pageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="pagination.total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange">
            </el-pagination>
    </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="userDialogVisible"
      width="700px">
      <el-form :model="userForm" :rules="userRules" ref="userForm" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickName" required>
              <el-input v-model="userForm.nickName" placeholder="请输入用户昵称"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="归属部门" prop="deptId">
              <el-select
                v-model="userForm.deptId"
                placeholder="请选择归属部门"
                style="width: 100%"
                filterable>
                <el-option
                  v-for="dept in flatDepartmentOptions"
                  :key="dept.value"
                  :label="dept.label"
                  :value="dept.value">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="userForm.phonenumber" placeholder="请输入手机号码"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="userForm.email" placeholder="请输入邮箱"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名称" prop="userName" required>
              <el-input v-model="userForm.userName" placeholder="请输入用户名称"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户密码" :prop="currentUser ? '' : 'password'" :required="!currentUser">
              <el-input
                v-model="userForm.password"
                :placeholder="currentUser ? '留空则不修改密码' : '请输入用户密码'"
                type="password"
                show-password>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户性别" prop="sex">
              <el-select v-model="userForm.sex" placeholder="请选择" style="width: 100%;">
                <el-option label="男" value="0"></el-option>
                <el-option label="女" value="1"></el-option>
                <el-option label="未知" value="2"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="userForm.status">
                <el-radio label="0">正常</el-radio>
                <el-radio label="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="岗位" prop="postIds">
              <el-select v-model="userForm.postIds" placeholder="请选择" style="width: 100%;" multiple>
                <el-option 
                  v-for="post in postList" 
                  :key="post.postId" 
                  :label="post.postName" 
                  :value="post.postId">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="roleIds">
              <el-select v-model="userForm.roleIds" placeholder="请选择" style="width: 100%;" multiple>
                <el-option 
                  v-for="role in roleList" 
                  :key="role.roleId" 
                  :label="role.roleName" 
                  :value="role.roleId">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="userForm.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入内容">
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">确定</el-button>
      </span>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      title="确认删除"
      :visible.sync="deleteDialogVisible"
      width="400px">
      <div class="confirm-message">
        <i class="el-icon-warning"></i>
        <span>确定要删除选中的用户吗？此操作不可恢复。</span>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确定删除</el-button>
      </span>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      title="提示"
      :visible.sync="resetPasswordDialogVisible"
      width="400px">
      <div class="reset-password-content">
        <div class="reset-password-message">
          请输入"{{ resetPasswordUser ? resetPasswordUser.userName : '' }}"的新密码
        </div>
        <el-input
          v-model="newPassword"
          type="password"
          placeholder=""
          show-password
          style="margin-top: 15px;">
        </el-input>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmResetPassword">确定</el-button>
      </span>
    </el-dialog>

    <!-- 角色分配对话框 -->
    <el-dialog
      title="分配角色"
      :visible.sync="roleDialogVisible"
      width="600px">
      <el-form label-width="80px">
        <el-form-item label="用户名称">
          <el-input :value="currentUser ? currentUser.userName : ''" disabled></el-input>
        </el-form-item>
        <el-form-item label="用户昵称">
          <el-input :value="currentUser ? currentUser.userNickname : ''" disabled></el-input>
        </el-form-item>
        <el-form-item label="角色">
          <el-checkbox-group v-model="selectedRoles">
            <el-checkbox 
              v-for="role in roleList" 
              :key="role.roleId" 
              :label="role.roleId"
              :disabled="role.status === '1'">
              {{ role.roleName }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRoleAssignment">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { 
  listUser, 
  getUser, 
  addUser, 
  updateUser, 
  delUser, 
  resetUserPwd, 
  changeUserStatus,
  getAuthRole,
  updateAuthRole
} from '@/api/system/user'
import { listAllRoles } from '@/api/system/role' // 修改：使用listAllRoles
import { listDept } from '@/api/system/dept' // 修改：使用正确的部门API

export default {
  name: 'UserManagement',
  
  data() {
    return {
      loading: false,
      filterText: '',
      selectedDepartment: null,
      
      // 搜索表单
      searchForm: {
        userName: '',
        nickName: '', // 修改为后端期望的字段名
        phonenumber: '', // 修改为后端期望的字段名
        status: '',
        deptId: null, // 添加部门ID字段
        beginTime: '', // 修改为后端期望的字段名
        endTime: '' // 修改为后端期望的字段名
      },
      
      // 表格数据
      tableData: [],
      allUsersData: [], // 添加：存储所有用户数据，用于部门用户数量统计
      selectedRows: [],
      
      // 分页
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      
      // 组织架构树数据
      treeData: [],
      
      defaultProps: {
        children: 'children',
        label: 'deptName',
        value: 'deptId'
      },
      
      // 用户表单
      userForm: {
        userId: null,
        userName: '',
        nickName: '', // 修改为后端期望的字段名
        phonenumber: '', // 修改为后端期望的字段名
        email: '',
        deptId: null, // 修改为后端期望的字段名
        password: '',
        sex: '0', // 修改为后端期望的字段名和默认值
        status: '0', // 修改为后端期望的字段名和默认值
        postIds: [], // 修改为后端期望的字段名
        roleIds: [], // 修改为后端期望的字段名
        remark: ''
      },
      
      // 表单验证规则
      userRules: {
        userName: [
          { required: true, message: '请输入用户名称', trigger: 'blur' },
          { min: 2, max: 20, message: '用户名称长度必须介于 2 和 20 之间', trigger: 'blur' }
        ],
        nickName: [
          { required: true, message: '请输入用户昵称', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入用户密码', trigger: 'blur' },
          { min: 5, max: 20, message: '用户密码长度必须介于 5 和 20 之间', trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        phonenumber: [
          { pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ]
      },
      
      // 对话框
      userDialogVisible: false,
      deleteDialogVisible: false,
      resetPasswordDialogVisible: false,
      roleDialogVisible: false, // 添加角色分配对话框
      dialogTitle: '新增用户',
      currentUser: null,
      resetPasswordUser: null,
      newPassword: '',
      
      // 角色相关
      roleList: [],
      selectedRoles: [],
      
      // 岗位相关
      postList: []
    }
  },
  
  computed: {
    departmentOptions() {
      // 过滤掉"全部"选项，只返回真实的部门数据用于表单选择
      const realDepts = this.treeData.filter(dept => dept.deptId !== 0)
      // 确保级联选择器能正确显示树形结构
      return this.buildCascaderOptions(realDepts)
    },
    
    // 扁平化的部门选项，用于普通选择器
    flatDepartmentOptions() {
      const options = []
      const flatten = (depts, level = 0) => {
        depts.forEach(dept => {
          if (dept.deptId !== 0) { // 排除"全部"选项
            const prefix = '　'.repeat(level) // 使用全角空格表示层级
            options.push({
              value: dept.deptId,
              label: prefix + dept.deptName
            })
            if (dept.children && dept.children.length > 0) {
              flatten(dept.children, level + 1)
            }
          }
        })
      }
      flatten(this.treeData)
      return options
    },
    
    // 检查数据是否准备就绪
    isDataReady() {
      return this.allUsersData && this.allUsersData.length > 0
    }
  },
  
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val)
    },
    
    'searchForm.createTimeRange'(val) {
      if (val && val.length === 2) {
        this.searchForm.beginTime = val[0]
        this.searchForm.endTime = val[1]
      } else {
        this.searchForm.beginTime = ''
        this.searchForm.endTime = ''
      }
    }
  },
  
  created() {
    this.initializeData()
  },
  
  methods: {
    // 初始化数据
    async initializeData() {
      try {
        // 并行加载基础数据
        await Promise.all([
          this.fetchUsers(),
          this.fetchAllUsersForCount(),
          this.loadRoles(),
          this.loadPosts()
        ])
        
        // 在用户数据加载完成后再加载部门树
        await this.loadDeptTree()
      } catch (error) {
        console.error('初始化数据失败:', error)
      }
    },
    
    // 过滤树节点
    filterNode(value, data) {
      if (!value) return true
      return data.deptName.indexOf(value) !== -1
    },
    
    // 点击树节点
    handleNodeClick(data) {
      this.selectedDepartment = data
      // 如果选择"全部"，则不设置部门ID筛选
      if (data.deptId === 0) {
        this.searchForm.deptId = null
      } else {
        this.searchForm.deptId = data.deptId
      }
      this.pagination.currentPage = 1
      this.fetchUsers()
    },
    
    // 获取用户数据
    async fetchUsers() {
      this.loading = true
      try {
        // 如果选择了特定部门，获取所有用户后在前端进行层级筛选
        const needHierarchicalFilter = this.searchForm.deptId && this.searchForm.deptId !== null
        
        const params = {
          page_num: needHierarchicalFilter ? 1 : this.pagination.currentPage,
          page_size: needHierarchicalFilter ? 100 : this.pagination.pageSize,
          user_name: this.searchForm.userName || undefined,
          nick_name: this.searchForm.nickName || undefined,
          phonenumber: this.searchForm.phonenumber || undefined,
          status: this.searchForm.status || undefined,
          dept_id: needHierarchicalFilter ? undefined : (this.searchForm.deptId || undefined),
          begin_time: this.searchForm.beginTime || undefined,
          end_time: this.searchForm.endTime || undefined
        }
        
        const response = await listUser(params)
        if (response.code === 200) {
          const data = response.data
          let users = data.rows || []
          
          // 如果需要层级筛选，在前端进行筛选
          if (needHierarchicalFilter) {
            const deptIds = this.getAllChildDeptIds(this.searchForm.deptId)
            users = users.filter(user => {
              return deptIds.includes(parseInt(user.dept_id))
            })
            
            // 重新计算分页
            const startIndex = (this.pagination.currentPage - 1) * this.pagination.pageSize
            const endIndex = startIndex + this.pagination.pageSize
            this.pagination.total = users.length
            users = users.slice(startIndex, endIndex)
          } else {
            this.pagination.total = data.total || 0
          }
          
          this.tableData = users
          
          // 转换数据格式以适配前端显示
          this.tableData = this.tableData.map(item => ({
            ...item,
            userName: item.user_name, // 添加用户名映射
            userNickname: item.nick_name,
            phoneNumber: item.phonenumber,
            department: item.dept_name || '',
            departmentId: item.dept_id,
            createTime: item.create_time,
            status: item.status === '0', // 转换为boolean
            role: item.role_display || (item.admin ? '管理员' : '普通用户') // 使用后端返回的角色显示名称
          }))
        }
      } catch (error) {
        console.error('获取用户列表失败:', error)
        this.$message.error('获取用户列表失败')
      } finally {
        this.loading = false
      }
    },
    
    // 获取所有用户数据用于部门用户数量统计
    async fetchAllUsersForCount() {
      try {
        // 获取所有用户数据，使用最大允许的分页大小
        const params = {
          page_num: 1,
          page_size: 100 // 后端限制最大值为100
        }
        
        const response = await listUser(params)
        if (response.code === 200) {
          const data = response.data
          // 转换数据格式并存储
          this.allUsersData = (data.rows || []).map(item => ({
            ...item,
            departmentId: item.dept_id,
            department: item.dept_name || ''
          }))
          
          // 强制触发Vue的响应式更新
          this.$nextTick(() => {
            this.$forceUpdate()
          })
        }
      } catch (error) {
        console.error('获取所有用户数据失败:', error)
      }
    },
    
    // 加载部门树
    async loadDeptTree() {
      try {
        const response = await listDept({}) // 使用部门列表API
        if (response.code === 200) {
          // 后端返回的是树形结构，直接转换字段格式
          this.treeData = this.convertDeptTreeData(response.data || [])
          
          // 默认选中"全部"节点并展开所有节点
          this.$nextTick(() => {
            if (this.$refs.tree && this.treeData.length > 0) {
              this.$refs.tree.setCurrentKey(0) // 选中"全部"节点
              this.expandAllNodes() // 展开所有节点
            }
          })
        }
      } catch (error) {
        console.error('获取部门树失败:', error)
      }
    },
    
    // 展开所有节点
    expandAllNodes() {
      if (this.$refs.tree) {
        const expandKeys = []
        const collectKeys = (nodes) => {
          nodes.forEach(node => {
            if (node.children && node.children.length > 0) {
              expandKeys.push(node.id)
              collectKeys(node.children)
            }
          })
        }
        collectKeys(this.treeData)
        expandKeys.forEach(key => {
          this.$refs.tree.store.nodesMap[key] && this.$refs.tree.store.nodesMap[key].expand()
        })
      }
    },
    
    // 获取指定部门的用户数量（包含子部门）
    getUserCountByDept(deptId) {
      if (!this.allUsersData || this.allUsersData.length === 0) {
        return 0
      }
      
      // 获取当前部门及其所有子部门的ID列表
      const deptIds = this.getAllChildDeptIds(deptId)
      
      // 统计所有相关部门的用户数量
      return this.allUsersData.filter(user => {
        const userDeptId = parseInt(user.departmentId)
        return deptIds.includes(userDeptId)
      }).length
    },
    
    // 递归获取部门及其所有子部门的ID
    getAllChildDeptIds(deptId) {
      const targetDeptId = parseInt(deptId)
      const deptIds = [targetDeptId] // 包含当前部门
      
      // 递归查找子部门
      const findChildren = (dept) => {
        if (dept.children && dept.children.length > 0) {
          dept.children.forEach(child => {
            deptIds.push(child.deptId)
            findChildren(child) // 递归查找子部门的子部门
          })
        }
      }
      
      // 从部门树中找到目标部门并递归查找其子部门
      const findDeptInTree = (depts) => {
        for (const dept of depts) {
          if (dept.deptId === targetDeptId) {
            findChildren(dept)
            return true
          }
          if (dept.children && dept.children.length > 0) {
            if (findDeptInTree(dept.children)) {
              return true
            }
          }
        }
        return false
      }
      
      findDeptInTree(this.treeData)
      return deptIds
    },
    
    // 构建级联选择器选项（保留以备后用）
    buildCascaderOptions(deptList) {
      return deptList.map(dept => {
        const option = {
          value: dept.deptId,
          label: dept.deptName,
          deptId: dept.deptId,
          deptName: dept.deptName
        }
        
        if (dept.children && dept.children.length > 0) {
          option.children = this.buildCascaderOptions(dept.children)
        }
        
        return option
      })
    },
    
    // 转换部门树数据格式
    convertDeptTreeData(deptList) {
      const convertedList = deptList.map(dept => {
        const deptNode = {
          id: dept.deptId,
          deptId: dept.deptId,
          deptName: dept.deptName,
          parentId: dept.parentId,
          orderNum: dept.orderNum,
          children: dept.children ? this.convertDeptTreeData(dept.children) : []
        }
        return deptNode
      }).sort((a, b) => a.orderNum - b.orderNum)
      
      // 在顶部添加"全部"选项
      if (convertedList.length > 0) {
        convertedList.unshift({
          id: 0,
          deptId: 0,
          deptName: '全部',
          parentId: -1,
          orderNum: -1,
          children: []
        })
      }
      
      return convertedList
    },
    
    // 加载角色列表
    async loadRoles() {
      try {
        const response = await listAllRoles() // 修改：使用listAllRoles API
        if (response.code === 200) {
          this.roleList = response.data || [] // 修改：直接使用data数组
        }
      } catch (error) {
        console.error('获取角色列表失败:', error)
      }
    },
    
    // 加载岗位列表
    async loadPosts() {
      try {
        // 这里暂时使用空数组，等后端岗位接口完善后再实现
        this.postList = []
      } catch (error) {
        console.error('获取岗位列表失败:', error)
      }
    },
    
    // 搜索用户
    handleSearch() {
      this.pagination.currentPage = 1
      this.fetchUsers()
    },
    
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        userName: '',
        nickName: '',
        phonenumber: '',
        status: '',
        deptId: null,
        beginTime: '',
        endTime: ''
      }
      this.selectedDepartment = null
      // 重置树的选中状态到"全部"
      this.$nextTick(() => {
        if (this.$refs.tree && this.treeData.length > 0) {
          this.$refs.tree.setCurrentKey(0) // 选中"全部"节点
        }
      })
      this.pagination.currentPage = 1
      this.fetchUsers()
    },
    
    // 刷新数据
    refreshData() {
      this.fetchUsers()
    },
    
    // 切换高级搜索
    toggleAdvancedSearch() {
      this.$message({
        message: '高级搜索功能开发中',
        type: 'info'
      })
    },
    
    // 显示表格设置
    showTableSetting() {
      this.$message({
        message: '表格设置功能开发中',
        type: 'info'
      })
    },
    
    // 处理分页
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.fetchUsers()
    },
    
    handleCurrentChange(page) {
      this.pagination.currentPage = page
      this.fetchUsers()
    },
    
    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },
    
    // 新增用户
    addUser() {
      this.dialogTitle = '新增用户'
      this.currentUser = null
      this.userForm = {
        userId: null,
        userName: '',
        nickName: '',
        phonenumber: '',
        email: '',
        deptId: null,
        password: '',
        sex: '0',
        status: '0',
        postIds: [],
        roleIds: [],
        remark: ''
      }
      // 重置表单验证
      this.$nextTick(() => {
        if (this.$refs.userForm) {
          this.$refs.userForm.clearValidate()
        }
      })
      this.userDialogVisible = true
    },
    
    // 编辑用户
    async editUser(row) {
      this.dialogTitle = '编辑用户'
      this.currentUser = row
      
      try {
        const response = await getUser(row.user_id) // 修正：使用row.user_id
        if (response.code === 200) {
          const userData = response.data.user // 修正：访问user字段
          this.userForm = {
            userId: userData.user_id, // 修正：使用后端返回的字段名
            userName: userData.user_name, // 修正：使用后端返回的字段名
            nickName: userData.nick_name, // 修正：使用后端返回的字段名
            phonenumber: userData.phonenumber || '',
            email: userData.email || '',
            deptId: userData.dept_id, // 修正：使用后端返回的字段名
            password: '',
            sex: userData.sex || '0',
            status: userData.status || '0',
            postIds: userData.post_ids || [], // 修正：使用后端返回的字段名
            roleIds: userData.role_ids || [], // 修正：使用后端返回的字段名
            remark: userData.remark || ''
          }
        }
      } catch (error) {
        console.error('获取用户详情失败:', error)
        this.$message.error('获取用户详情失败')
        return
      }
      
      // 重置表单验证
      this.$nextTick(() => {
        if (this.$refs.userForm) {
          this.$refs.userForm.clearValidate()
        }
      })
      this.userDialogVisible = true
    },
    
    // 保存用户
    async saveUser() {
      try {
        await this.$refs.userForm.validate()
        
        this.loading = true
        
        // 转换字段名格式，从驼峰转为下划线
        const userData = {
          user_id: this.userForm.userId,
          dept_id: this.userForm.deptId,
          user_name: this.userForm.userName,
          nick_name: this.userForm.nickName,
          user_type: this.userForm.userType || '00',
          email: this.userForm.email || '',
          phonenumber: this.userForm.phonenumber || '',
          sex: this.userForm.sex || '0',
          avatar: this.userForm.avatar || '',
          status: this.userForm.status || '0',
          remark: this.userForm.remark || '',
          role_ids: this.userForm.roleIds || [],
          post_ids: this.userForm.postIds || []
        }
        
        // 记录是否需要更新密码
        const needUpdatePassword = this.userForm.password && this.userForm.password.trim().length > 0
        const newPassword = this.userForm.password
        
        // 编辑用户时不传密码字段，我们会单独处理密码更新
        // 新增用户时需要传密码字段
        if (!this.currentUser && this.userForm.password) {
          userData.password = this.userForm.password
        }
        
        let response
        if (this.currentUser) {
          response = await updateUser(userData)
        } else {
          response = await addUser(userData)
        }
        
        if (response.code === 200) {
          // 如果是编辑用户且需要更新密码，单独调用密码重置接口
          if (this.currentUser && needUpdatePassword) {
            try {
              const resetResponse = await resetUserPwd(this.userForm.userId, newPassword)
              if (resetResponse.code !== 200) {
                this.$message.error(resetResponse.msg || '密码更新失败')
                return
              }
            } catch (error) {
              console.error('密码更新失败:', error)
              this.$message.error('密码更新失败')
              return
            }
          }
          
          this.$message.success(this.currentUser ? '用户信息修改成功' : '用户添加成功')
          this.userDialogVisible = false
          this.fetchUsers()
          this.fetchAllUsersForCount() // 更新用户统计数据
        } else {
          this.$message.error(response.msg || '操作失败')
        }
      } catch (error) {
        if (error !== false) { // 不是表单验证错误
          console.error('保存用户失败:', error)
          this.$message.error('保存用户失败')
        }
      } finally {
        this.loading = false
      }
    },
    
    // 删除用户
    deleteUser(row) {
      this.currentUser = row
      this.deleteDialogVisible = true
    },
    
    // 确认删除
    async confirmDelete() {
      try {
        this.loading = true
        const response = await delUser(this.currentUser.user_id) // 修正：使用user_id
        
        if (response.code === 200) {
          this.$message.success('用户删除成功')
          this.deleteDialogVisible = false
          this.fetchUsers()
          this.fetchAllUsersForCount() // 更新用户统计数据
        } else {
          this.$message.error(response.msg || '删除失败')
        }
      } catch (error) {
        console.error('删除用户失败:', error)
        this.$message.error('删除用户失败')
      } finally {
        this.loading = false
      }
    },
    
    // 批量删除
    async batchDelete() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请选择要删除的用户')
        return
      }
      
      try {
        await this.$confirm(`确定要删除选中的 ${this.selectedRows.length} 个用户吗？`, '确认删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        this.loading = true
        const userIds = this.selectedRows.map(row => row.user_id).join(',') // 修正：使用user_id
        const response = await delUser(userIds)
        
        if (response.code === 200) {
          this.$message.success('批量删除成功')
          this.fetchUsers()
          this.fetchAllUsersForCount() // 更新用户统计数据
        } else {
          this.$message.error(response.msg || '批量删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量删除失败:', error)
          this.$message.error('批量删除失败')
        }
      } finally {
        this.loading = false
      }
    },
    
    // 处理更多操作
    handleMoreAction(command) {
      switch (command) {
        case 'downloadTemplate':
          this.downloadTemplate()
          break
        case 'importData':
          this.importData()
          break
        case 'exportData':
          this.exportData()
          break
      }
    },
    
    // 下载模板
    downloadTemplate() {
      this.$message({
        message: '模板下载成功',
        type: 'success'
      })
    },
    
    // 导入数据
    importData() {
      this.$message({
        message: '导入数据功能开发中',
        type: 'info'
      })
    },
    
    // 导出数据
    exportData() {
      this.$message({
        message: '数据导出成功',
        type: 'success'
      })
    },
    
    // 重置密码
    resetPassword(row) {
      this.resetPasswordUser = row
      this.newPassword = ''
      this.resetPasswordDialogVisible = true
    },

    // 确认重置密码
    async confirmResetPassword() {
      if (!this.newPassword || this.newPassword.trim() === '') {
        this.$message.warning('请输入新密码')
        return
      }
      
      if (this.newPassword.length < 5 || this.newPassword.length > 20) {
        this.$message.warning('密码长度必须介于 5 和 20 之间')
        return
      }
      
      try {
        this.loading = true
        const response = await resetUserPwd(this.resetPasswordUser.user_id, this.newPassword) // 修正：使用user_id
        
        if (response.code === 200) {
          this.$message.success('密码重置成功')
          this.resetPasswordDialogVisible = false
          this.newPassword = ''
          this.resetPasswordUser = null
        } else {
          this.$message.error(response.msg || '密码重置失败')
        }
      } catch (error) {
        console.error('密码重置失败:', error)
        this.$message.error('密码重置失败')
      } finally {
        this.loading = false
      }
    },
    
    // 分配角色
    async assignRole(row) {
      try {
        // 获取用户已分配的角色
        const response = await getAuthRole(row.user_id) // 修正：使用user_id
        if (response.code === 200) {
          this.currentUser = row
          this.selectedRoles = response.user.roleIds || []
          this.roleDialogVisible = true
        } else {
          this.$message.error('获取用户角色信息失败')
        }
      } catch (error) {
        console.error('获取用户角色失败:', error)
        this.$message.error('获取用户角色信息失败')
      }
    },
    
    // 保存角色分配
    async saveRoleAssignment() {
      try {
        this.loading = true
        const data = {
          userId: this.currentUser.user_id, // 修正：使用user_id
          roleIds: this.selectedRoles.join(',')
        }
        
        const response = await updateAuthRole(data)
        if (response.code === 200) {
          this.$message.success('角色分配成功')
          this.roleDialogVisible = false
          this.fetchUsers()
        } else {
          this.$message.error(response.msg || '角色分配失败')
        }
      } catch (error) {
        console.error('角色分配失败:', error)
        this.$message.error('角色分配失败')
      } finally {
        this.loading = false
      }
    },
    
    // 处理状态变化
    async handleStatusChange(row) {
      try {
        this.loading = true
        const status = row.status ? '0' : '1' // 转换为后端期望的格式
        const response = await changeUserStatus(row.user_id, status) // 修正：使用row.user_id
        
        if (response.code === 200) {
          const statusText = row.status ? '启用' : '停用'
          this.$message.success(`用户状态已${statusText}`)
          // 更新本地状态
          row.status = status === '0'
        } else {
          // 恢复原状态
          row.status = !row.status
          this.$message.error(response.msg || '状态修改失败')
        }
      } catch (error) {
        // 恢复原状态
        row.status = !row.status
        console.error('状态修改失败:', error)
        this.$message.error('状态修改失败')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
/* 整体容器 */
.user-management-container {
  padding: 20px 20px 5px 20px;
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%);
  min-height: calc(100vh - 90px);
  height: calc(100vh - 90px);
  overflow: hidden;
}

/* 主要布局 */
.content-layout {
  display: flex;
  gap: 20px;
  height: calc(100vh - 100px);
  min-height: 600px;
}

/* 左侧面板 */
.left-panel {
  width: 280px;
  min-width: 280px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  overflow: hidden;
}

.tree-container {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-search {
  margin-bottom: 16px;
}

.tree-search >>> .el-input__inner {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.tree-search >>> .el-input__inner:hover {
  border-color: #3b82f6;
}

.tree-search >>> .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.department-tree {
  flex: 1;
  overflow: auto;
}

.department-tree >>> .el-tree-node__content {
  height: 36px;
  padding: 0 8px;
  border-radius: 6px;
  margin: 2px 0;
  transition: all 0.3s ease;
}

.department-tree >>> .el-tree-node__content:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
}

.department-tree >>> .el-tree-node.is-current > .el-tree-node__content {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: white;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.tree-label {
  font-weight: 500;
}

.tree-count {
  color: #909399;
  font-size: 12px;
  margin-left: 6px;
}

/* 右侧面板 */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 搜索区卡片 */
.filter-section {
  margin-bottom: 12px;
  padding: 14px 18px;
  background: #f5f7fa;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.05);
  flex-shrink: 0;
}

.search-form .el-form-item {
  margin-bottom: 12px;
}

.search-form .el-form-item__label {
  color: #303133;
  font-weight: 500;
}

.filter-section >>> .el-input__inner,
.filter-section >>> .el-select .el-input__inner,
.filter-section >>> .el-date-editor .el-input__inner {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: #fff;
}

.filter-section >>> .el-input__inner:hover,
.filter-section >>> .el-select .el-input__inner:hover,
.filter-section >>> .el-date-editor .el-input__inner:hover {
  border-color: #3b82f6;
}

.filter-section >>> .el-input__inner:focus,
.filter-section >>> .el-select .el-input__inner:focus,
.filter-section >>> .el-date-editor .el-input__inner:focus {
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

/* 表格容器 */
.table-container {
  flex: 1;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #ebeef5;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 500px;
  height: 100%;
}

/* 操作按钮区 */
.table-operations {
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.left-buttons {
  display: flex;
  gap: 8px;
}

.right-buttons {
  display: flex;
  gap: 8px;
}

.table-operations >>> .el-button {
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

.table-operations >>> .el-button.is-circle {
  width: 32px;
  height: 32px;
  padding: 0;
}

/* 下拉菜单 */
.more-dropdown >>> .el-dropdown-menu {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 表格样式 */
.custom-table {
  flex: 1;
  overflow: hidden;
  min-height: 500px;
  height: calc(100% - 120px);
}

.custom-table >>> .el-table__body-wrapper {
  max-height: calc(100vh - 320px);
  overflow-y: auto;
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
  vertical-align: middle;
}

.custom-table >>> .el-table .el-table__body tr:hover > td {
  background: #f5f7fa !important;
}

/* 表格内容样式优化 */
.custom-table >>> .el-table__body .el-table__row td .cell {
  padding: 0 8px;
  word-break: break-word;
  line-height: 1.5;
}

/* 状态开关居中 */
.custom-table >>> .el-switch {
  vertical-align: middle;
}

/* 表格操作按钮样式 */
.operation-buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: nowrap;
}

.edit-btn, .reset-btn, .delete-btn, .assign-role-btn {
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

.edit-btn:hover, .reset-btn:hover, .delete-btn:hover, .assign-role-btn:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e3a8a !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2) !important;
  transform: translateY(-1px) !important;
}

/* 表格行高调整 */
.custom-table >>> .el-table__body-wrapper .el-table__row {
  height: 48px;
}

.custom-table >>> .el-table__body-wrapper .el-table__row td {
  padding: 12px 0;
  vertical-align: middle;
}

.custom-table >>> .el-table__header-wrapper .el-table__header th {
  padding: 12px 0;
  height: 48px;
}

/* 分页器样式 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 10px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-top: 1px solid #ebeef5;
  margin-top: auto;
  flex-shrink: 0;
}

.pagination-container >>> .el-pagination {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-container >>> .el-pagination .el-pager li {
  min-width: 32px;
  height: 32px;
  line-height: 30px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #4b5563;
  margin: 0 3px;
  transition: all 0.3s ease;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.pagination-container >>> .el-pagination .el-pager li.active {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  border-color: #3b82f6;
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
}

.pagination-container >>> .el-pagination .el-pager li:hover {
  border-color: #3b82f6;
  color: #1e40af;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.pagination-container >>> .el-pagination button {
  min-width: 32px;
  height: 32px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #4b5563;
  margin: 0 3px;
  transition: all 0.3s ease;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.pagination-container >>> .el-pagination button:hover {
  border-color: #3b82f6;
  color: #1e40af;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

/* 弹框样式 */
.user-management-container >>> .el-dialog {
  border-radius: 12px !important;
  overflow: hidden !important;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1) !important;
}

.user-management-container >>> .el-dialog__header {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1) !important;
  padding: 16px 20px !important;
}

.user-management-container >>> .el-dialog__title {
  color: #1f2937 !important;
  font-weight: 600 !important;
}

.user-management-container >>> .el-dialog__close {
  color: #6b7280 !important;
  transition: color 0.3s ease !important;
}

.user-management-container >>> .el-dialog__close:hover {
  color: #3b82f6 !important;
}

.user-management-container >>> .el-dialog__body {
  padding: 20px !important;
  background: #ffffff !important;
}

.user-management-container >>> .el-dialog__footer {
  padding: 10px 20px 20px !important;
  text-align: right !important;
  border-top: 1px solid rgba(59, 130, 246, 0.1) !important;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
}

/* 弹框内按钮样式 */
.user-management-container >>> .el-dialog .el-button--primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%) !important;
  border: none !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3) !important;
  color: white !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
}

.user-management-container >>> .el-dialog .el-button--primary:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%) !important;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4) !important;
  transform: translateY(-1px) !important;
}

.user-management-container >>> .el-dialog .el-button--default {
  background: white !important;
  border: 1px solid #d1d5db !important;
  color: #4b5563 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
}

.user-management-container >>> .el-dialog .el-button--default:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
  border-color: #3b82f6 !important;
  color: #1e40af !important;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
}

.user-management-container >>> .el-dialog .el-button--danger {
  background: linear-gradient(135deg, #f56c6c 0%, #e53e3e 100%) !important;
  border: none !important;
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.3) !important;
  color: white !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  border-radius: 6px !important;
}

.user-management-container >>> .el-dialog .el-button--danger:hover {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%) !important;
  box-shadow: 0 4px 10px rgba(245, 108, 108, 0.4) !important;
  transform: translateY(-1px) !important;
}

/* 表单样式美化 */
.user-management-container >>> .el-form-item__label {
  color: #303133;
  font-weight: 500;
}

.user-management-container >>> .el-form-item.is-required .el-form-item__label:before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

.user-management-container >>> .el-input__inner,
.user-management-container >>> .el-date-editor .el-input__inner,
.user-management-container >>> .el-select .el-input__inner,
.user-management-container >>> .el-textarea__inner,
.user-management-container >>> .el-cascader .el-input__inner {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.user-management-container >>> .el-input__inner:hover,
.user-management-container >>> .el-date-editor .el-input__inner:hover,
.user-management-container >>> .el-select .el-input__inner:hover,
.user-management-container >>> .el-textarea__inner:hover,
.user-management-container >>> .el-cascader .el-input__inner:hover {
  border-color: #3b82f6;
}

.user-management-container >>> .el-input__inner:focus,
.user-management-container >>> .el-date-editor .el-input__inner:focus,
.user-management-container >>> .el-select .el-input__inner:focus,
.user-management-container >>> .el-textarea__inner:focus,
.user-management-container >>> .el-cascader .el-input__inner:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 下拉框样式优化 */
.user-management-container >>> .el-select-dropdown,
.user-management-container >>> .el-cascader__dropdown {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
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

/* 重置密码弹框样式 */
.reset-password-content {
  padding: 10px 0;
}

.reset-password-message {
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 5px;
}

/* 开关样式 */
.user-management-container >>> .el-switch {
  margin: 0 auto;
}

/* 适配小屏幕 */
@media screen and (max-width: 1200px) {
  .content-layout {
    flex-direction: column;
    height: auto;
    min-height: auto;
  }
  
  .left-panel {
    width: 100%;
    min-width: 100%;
    height: 300px;
  margin-bottom: 20px;
}

  .right-panel {
    margin-top: 0;
  }
}

@media screen and (max-width: 768px) {
  .user-management-container {
    padding: 12px;
  }
  
  .filter-section {
    padding: 12px 16px;
  }
  
  .table-operations {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    padding: 12px 16px;
  }
  
  .left-buttons,
  .right-buttons {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .search-form .el-form-item {
    width: 100%;
    margin-bottom: 16px;
  }
  
  .search-form >>> .el-form-item__label {
    width: 80px !important;
  }
  
  .search-form >>> .el-form-item__content {
    margin-left: 80px !important;
  }
  
  .operation-buttons {
    gap: 4px;
  }
  
  .operation-buttons .el-button {
    width: 24px !important;
    height: 24px !important;
  }
  
  .custom-table >>> .el-table__body .el-table__row td .cell {
    padding: 0 4px;
  }
}
</style> 
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
            </span>
          </el-tree>
        </div>
      </div>

      <!-- 右侧用户管理区域 -->
      <div class="right-panel">
        <!-- 搜索筛选区域 -->
        <div class="filter-section">
          <el-form :inline="true" :model="searchForm" class="search-form">
            <el-form-item label="租户">
              <TenantSelector
                ref="tenantSelector"
                v-model="searchForm.tenant_code"
                @change="handleTenantChange"/>
            </el-form-item>
            <el-form-item label="用户名称">
              <el-input
                v-model="searchForm.user_name"
                placeholder="请输入用户名称"
                clearable
                style="width: 200px;">
              </el-input>
            </el-form-item>
            <el-form-item label="用户昵称">
              <el-input
                v-model="searchForm.nick_name"
                placeholder="请输入用户昵称"
                clearable
                style="width: 200px;">
              </el-input>
            </el-form-item>
            <el-form-item label="手机号码">
              <el-input
                v-model="searchForm.phone"
                placeholder="请输入手机号码"
                clearable
                style="width: 200px;">
              </el-input>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="用户状态" clearable style="width: 120px;">
                <el-option label="启用" value="0"></el-option>
                <el-option label="禁用" value="1"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="部门">
              <el-cascader
                v-model="searchForm.dept_id"
                :options="departmentOptions"
                :props="cascaderProps"
                placeholder="选择部门"
                clearable
                style="width: 200px;">
              </el-cascader>
            </el-form-item>
            <el-form-item label="岗位">
              <el-select v-model="searchForm.position" placeholder="选择岗位" clearable style="width: 120px;">
                <el-option label="开发工程师" value="developer"></el-option>
                <el-option label="测试工程师" value="tester"></el-option>
                <el-option label="产品经理" value="pm"></el-option>
                <el-option label="UI设计师" value="designer"></el-option>
                <el-option label="运维工程师" value="ops"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="性别">
              <el-select v-model="searchForm.gender" placeholder="选择性别" clearable style="width: 100px;">
                <el-option label="未知" :value="0"></el-option>
                <el-option label="男" :value="1"></el-option>
                <el-option label="女" :value="2"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="创建时间">
              <el-date-picker
                v-model="searchForm.create_time_range"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd">
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
              <el-dropdown @command="handle_more_action" class="more-dropdown">
                <el-button size="small">
                  更多<i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="download_template">下载模板</el-dropdown-item>
                  <el-dropdown-item command="import_data">导入数据</el-dropdown-item>
                  <el-dropdown-item command="export_data">导出数据</el-dropdown-item>
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
            <el-table-column prop="user_name" label="用户名称" min-width="140" align="center"></el-table-column>
            <el-table-column prop="nick_name" label="用户昵称" min-width="150" align="center"></el-table-column>
            <el-table-column prop="department" label="部门" min-width="80" align="center"></el-table-column>
            <el-table-column prop="phone" label="手机号码" min-width="120" align="center"></el-table-column>
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template slot-scope="scope">
                <el-switch
                  v-model="scope.row.status"
                  :active-value="0"
                  :inactive-value="1"
                  active-color="#3b82f6"
                  inactive-color="#9ca3af"
                  @change="handle_status_change(scope.row)">
                </el-switch>
              </template>
            </el-table-column>
            <el-table-column prop="create_time" label="创建时间" min-width="140" align="center"></el-table-column>
            <el-table-column label="操作" min-width="180" fixed="right" align="center">
              <template slot-scope="scope">
                <div class="operation-buttons">
                  <el-button type="text" class="edit-btn" @click="editUser(scope.row)">编辑</el-button>
                  <el-button type="text" class="delete-btn" @click="deleteUser(scope.row)">删除</el-button>
                  <el-button type="text" class="reset-btn" @click="reset_password(scope.row)">重置</el-button>
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
            <el-form-item label="用户昵称" prop="nick_name" required>
              <el-input v-model="userForm.nick_name" placeholder="请输入用户昵称"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="归属部门" prop="dept_id">
              <el-cascader
                v-model="userForm.dept_id"
                :options="departmentOptions"
                :props="cascaderProps"
                placeholder="请选择归属部门"
                style="width: 100%">
              </el-cascader>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phone">
              <el-input v-model="userForm.phone" placeholder="请输入手机号码"></el-input>
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
            <el-form-item label="用户名称" prop="user_name" required>
              <el-input v-model="userForm.user_name" placeholder="请输入用户名称"></el-input>
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
            <el-form-item label="用户性别" prop="gender">
              <el-select v-model="userForm.gender" placeholder="请选择" style="width: 100%;">
                <el-option label="未知" :value="0"></el-option>
                <el-option label="男" :value="1"></el-option>
                <el-option label="女" :value="2"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="userForm.status">
                <el-radio :label="0">正常</el-radio>
                <el-radio :label="1">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="岗位" prop="position">
              <el-select v-model="userForm.position" placeholder="请选择" style="width: 100%;">
                <el-option label="开发工程师" value="developer"></el-option>
                <el-option label="测试工程师" value="tester"></el-option>
                <el-option label="产品经理" value="pm"></el-option>
                <el-option label="UI设计师" value="designer"></el-option>
                <el-option label="运维工程师" value="ops"></el-option>
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
          请输入"{{ resetPasswordUser ? resetPasswordUser.user_name : '' }}"的新密码
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
        <el-button type="primary" @click="confirm_reset_password">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import RBACService from '@/components/service/RBACService'
import TenantSelector from '@/components/common/TenantSelector.vue'

export default {
  name: 'UserManagement',

  components: {
    TenantSelector
  },

  data() {
    return {
      loading: false,
      filterText: '',
      selectedDepartment: null,

      // 搜索表单
      searchForm: {
        user_name: '',
        nick_name: '',
        phone: '',
        status: '',
        dept_id: [],
        position: '',
        gender: '',
        create_time_range: [],
        tenant_code: ''
      },


      // 表格数据
      tableData: [],
      selectedRows: [],

      // 分页
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },

      // 组织架构树数据
      treeData: [
        {
          id: 1,
          label: 'XXX科技',
          children: [
            {
              id: 2,
              label: '深圳总公司',
              children: [
                { id: 3, label: '研发部门' },
                { id: 4, label: '市场部门' },
                { id: 5, label: '测试部门' },
                { id: 6, label: '财务部门' },
                { id: 7, label: '运维部门' }
              ]
            },
            {
              id: 8,
              label: '长沙分公司',
              children: [
                { id: 9, label: '市场部门' },
                { id: 10, label: '财务部门' }
              ]
            }
          ]
        }
      ],

      defaultProps: {
        children: 'children',
        label: 'label'
      },

      // 用户表单
      userForm: {
        user_name: '',
        nick_name: '',
        phone: '',
        email: '',
        dept_id: [],
        password: '',
        gender: '',
        status: 1,
        position: '',
        remark: ''
      },

      // 表单验证规则
      userRules: {
        user_name: [
          { required: true, message: '请输入用户名称', trigger: 'blur' }
        ],
        nick_name: [
          { required: true, message: '请输入用户昵称', trigger: 'blur' }
        ],
        phone: [
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ]
      },

      // 对话框
      userDialogVisible: false,
      deleteDialogVisible: false,
      resetPasswordDialogVisible: false,
      dialogTitle: '新增用户',
      currentUser: null,
      resetPasswordUser: null,
      newPassword: '',

      // 级联选择器配置
      cascaderProps: {
        value: 'id',
        label: 'label',
        children: 'children',
        checkStrictly: true
      },

      // 租户缓存
      cachedTenants: []
    }
  },

  computed: {
    departmentOptions() {
      return this.treeData
    }
  },

  watch: {
    filterText(val) {
      this.$refs.tree.filter(val)
    }
  },

  async created() {
    // 加载租户信息，TenantSelector 的 autoSelectFirst 会触发 change 事件
    // 由 handleTenantChange 来调用 fetchUsers()，避免重复请求
    await this.loadTenantsIfNeeded();
  },

  methods: {
    // 加载租户信息（如果尚未加载）
    async loadTenantsIfNeeded() {
      // 如果已有缓存的租户信息，则直接使用
      if (this.cachedTenants && this.cachedTenants.length > 0) {
        // 不再手动设置租户，让 TenantSelector 组件处理
        return;
      }

      // 检查租户选择器组件是否已加载租户数据
      const tenantSelector = this.$refs.tenantSelector;
      if (tenantSelector && typeof tenantSelector.loadTenantsIfNeeded === 'function') {
        await tenantSelector.loadTenantsIfNeeded();
        // 更新缓存
        this.cachedTenants = [...tenantSelector.tenants];
        // 注意：不再手动设置 tenant_code，由 TenantSelector 的 autoSelectFirst 处理
      } else {
        // 如果无法直接访问租户选择器，则直接调用API获取租户
        try {
          const response = await RBACService.getTenants();
          if (response && response.data && Array.isArray(response.data.items)) {
            // 缓存租户信息
            this.cachedTenants = [...response.data.items];
            // 注意：不再手动设置 tenant_code，由 TenantSelector 的 autoSelectFirst 处理
          }
        } catch (error) {
          console.error('获取租户列表失败:', error);
          this.$message.error(`获取租户列表失败: ${error.message}`);
        }
      }
    },

    // 处理租户变化
    handleTenantChange() {
      this.pagination.currentPage = 1
      this.fetchUsers()
    },

    // 获取当前租户信息
    getCurrentTenant() {
      if (this.cachedTenants && this.searchForm.tenant_code) {
        return this.cachedTenants.find(tenant => tenant.tenant_code === this.searchForm.tenant_code);
      }
      return null;
    },

    // 过滤树节点
    filterNode(value, data) {
      if (!value) return true
      return data.label.indexOf(value) !== -1
    },

    // 点击树节点
    handleNodeClick(data) {
      this.selectedDepartment = data
      this.pagination.currentPage = 1
      this.fetchUsers()
    },

    // 获取用户数据
    async fetchUsers() {
      // 检查是否选择了租户，如果没有选择租户则提示用户
      if (!this.searchForm.tenant_code) {
        this.$message.warning('请先选择租户');
        this.tableData = [];
        this.pagination.total = 0;
        this.loading = false;
        return;
      }

      this.loading = true

      try {
        // 尝试从API获取数据
        const skip = (this.pagination.currentPage - 1) * this.pagination.pageSize;
        const params = {
          skip: skip,
          limit: this.pagination.pageSize,
          user_name: this.searchForm.user_name || undefined,
          nick_name: this.searchForm.nick_name || undefined,
          phone: this.searchForm.phone || undefined,
          status: this.searchForm.status || undefined,
          role_code: this.searchForm.role || undefined,
          dept_id: this.searchForm.dept_id && this.searchForm.dept_id.length > 0 ? this.searchForm.dept_id[this.searchForm.dept_id.length - 1] : (this.selectedDepartment ? this.selectedDepartment.id : undefined),
          position_code: this.searchForm.position || undefined,
          gender: this.searchForm.gender !== '' ? this.searchForm.gender : undefined,
          tenant_code: this.searchForm.tenant_code || undefined,
        }

        const response = await RBACService.getUsers(params)

        if (response && response.data && Array.isArray(response.data.items)) {
          // API调用成功，使用API数据
          console.log('✅ 使用API数据获取用户列表')

          // 将API返回的数据映射到表格期望的字段（使用snake_case）
          this.tableData = response.data.items.map(item => ({
            id: item.id,
            tenant_code: item.tenant_code,
            user_name: item.user_name,
            nick_name: item.nick_name,
            email: item.email,
            phone: item.phone,
            status: item.status,
            create_time: item.create_time ? this.formatDate(item.create_time) : '',
            // 以下字段可能从关联查询获取
            department: item.department || '-',
            dept_id: item.dept_id,
            role: item.role || 'user',
            position: item.position,
            position_code: item.position_code,
            user_name: item.user_name || item.user_code || item.id.toString(),
            gender: item.gender !== undefined && item.gender !== null ? item.gender : 0 // 保持原始数字值
          }))

          this.pagination.total = response.data.total || response.data.items.length || 0
        } else {
          // API返回格式异常
          throw new Error('API返回格式异常')
        }
      } catch (error) {
        // API调用失败
        console.error('⚠️ API调用失败:', error.message);
        // 检查错误是否与租户相关
        if (error.response && error.response.status === 422) {
          this.$message.error('请求参数错误，请检查租户信息是否正确');
        } else {
          this.$message.error(`获取用户列表失败: ${error.message}`);
        }
        // 在API调用失败时清空表格数据
        this.tableData = [];
        this.pagination.total = 0;
      }

      this.loading = false
    },


    // 搜索用户
    handleSearch() {
      this.pagination.currentPage = 1
      this.fetchUsers()
    },

    // 重置搜索
    resetSearch() {
      // 保留租户选择，只重置其他搜索条件
      const currentTenantCode = this.searchForm.tenant_code;
      this.searchForm = {
        user_name: '',
        nick_name: '',
        phone: '',
        status: '',
        role: '',
        dept_id: [],
        position: '',
        gender: '',
        create_time_range: [],
        tenant_code: currentTenantCode  // 保留当前租户选择
      }
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
        user_name: '',
        nick_name: '',
        phone: '',
        email: '',
        dept_id: [],
        password: '',
        gender: '',
        status: 1,
        position: '',
        remark: ''
      }
      this.userDialogVisible = true
    },

    // 编辑用户
    editUser(row) {
      this.dialogTitle = '编辑用户'
      this.currentUser = row
      // 将性别文本转换为数字
      const genderValue = this.parseGender(row.gender)
      this.userForm = {
        ...row,
        dept_id: row.dept_id ? [row.dept_id] : [],
        password: '',
        gender: genderValue !== undefined ? genderValue : 0,
        position: row.position || '',
        status: row.status ? 0 : 1  // 确保状态值为数字格式，0为正常，1为停用
      }
      this.userDialogVisible = true
    },

    // 保存用户
    async saveUser() {
      if (!this.currentUser && !this.userForm.password) {
        this.$message({
          message: '请输入用户密码',
          type: 'warning'
        })
        return
      }

      this.$refs.userForm.validate(async (valid) => {
        if (valid) {
          this.loading = true

          try {
            // 确保用户数据中包含租户信息
            const userData = {
              ...this.userForm,
              tenant_code: this.searchForm.tenant_code || this.userForm.tenant_code, // 优先使用当前选择的租户
              dept_id: this.userForm.dept_id && this.userForm.dept_id.length > 0 ? this.userForm.dept_id[this.userForm.dept_id.length - 1] : undefined
            }

            if (this.currentUser) {
              // 编辑用户
              const tenant_code = this.currentUser.tenant_code || this.searchForm.tenant_code || 'default';
              // 使用 user_name 而不是 user_code，以避免使用可遍历的 id
              await RBACService.updateUser(this.currentUser.user_name, tenant_code, userData)
              this.$message({
                message: '用户信息修改成功',
                type: 'success'
              })
            } else {
              // 新增用户，必须有租户信息
              if (!this.searchForm.tenant_code) {
                this.$message.error('请选择租户后再添加用户');
                return;
              }
              await RBACService.createUser(userData)
              this.$message({
                message: '用户添加成功',
                type: 'success'
              })
            }

            this.userDialogVisible = false
            this.fetchUsers()
          } catch (error) {
            console.error('保存用户失败:', error)
            this.$message({
              message: `保存用户失败: ${error.message}`,
              type: 'error'
            })
          } finally {
            this.loading = false
          }
        }
      })
    },

    // 删除用户
    deleteUser(row) {
      this.currentUser = row
      this.deleteDialogVisible = true
    },

    // 确认删除
    async confirmDelete() {
      this.deleteDialogVisible = false
      this.loading = true

      try {
          // 使用当前用户的租户信息或当前选择的租户
          const tenant_code = this.currentUser.tenant_code || this.searchForm.tenant_code || 'default';
          // 使用 user_name 而不是 user_code，以避免使用可遍历的 id
          await RBACService.deleteUser(this.currentUser.user_name, tenant_code)
          this.$message({
            message: '用户删除成功',
            type: 'success'
          })
          this.fetchUsers()
        } catch (error) {
          console.error('删除用户失败:', error)
          this.$message({
            message: `删除用户失败: ${error.message}`,
            type: 'error'
          })
        } finally {
        this.loading = false
      }
    },

    // 批量删除
    async batchDelete() {
      if (this.selectedRows.length === 0) {
        this.$message({
          message: '请选择要删除的用户',
          type: 'warning'
        })
        return
      }

      this.$confirm(`确定要删除选中的 ${this.selectedRows.length} 个用户吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        this.loading = true
        try {
          // 批量删除用户，使用Promise.all并行处理
          // 确保每个删除请求都使用正确的租户信息
          const deletePromises = this.selectedRows.map(row => {
            const tenant_code = row.tenant_code || this.searchForm.tenant_code || 'default';
            // 使用 user_name 而不是 user_code，以避免使用可遍历的 id
            return RBACService.deleteUser(row.user_name, tenant_code);
          })
          await Promise.all(deletePromises)
          this.$message({
            message: '批量删除成功',
            type: 'success'
          })
          this.fetchUsers()
        } catch (error) {
          console.error('批量删除用户失败:', error)
          this.$message({
            message: `批量删除用户失败: ${error.message}`,
            type: 'error'
          })
        } finally {
          this.loading = false
        }
      }).catch(() => {})
    },

    // 处理更多操作
    handle_more_action(command) {
      switch (command) {
        case 'download_template':
          this.download_template()
          break
        case 'import_data':
          this.import_data()
          break
        case 'export_data':
          this.export_data()
          break
      }
    },

    // 下载模板
    download_template() {
      this.$message({
        message: '模板下载成功',
        type: 'success'
      })
    },

    // 导入数据
    import_data() {
      this.$message({
        message: '导入数据功能开发中',
        type: 'info'
      })
    },

    // 导出数据
    export_data() {
      this.$message({
        message: '数据导出成功',
        type: 'success'
      })
    },

    // 重置密码
    reset_password(row) {
      this.resetPasswordUser = row
      this.newPassword = ''
      this.resetPasswordDialogVisible = true
    },

    // 确认重置密码
    async confirm_reset_password() {
      if (!this.newPassword || this.newPassword.trim() === '') {
        this.$message({
          message: '请输入新密码',
          type: 'warning'
        })
        return
      }

      this.loading = true
      try {
        // 使用当前用户的租户信息或当前选择的租户
        const tenant_code = this.resetPasswordUser.tenant_code || this.searchForm.tenant_code || 'default';
        // 使用 user_name 而不是 user_code，以避免使用可遍历的 id
        await RBACService.resetUserPassword(this.resetPasswordUser.user_name, tenant_code)
        this.$message({
          message: '密码重置成功',
          type: 'success'
        })
        this.resetPasswordDialogVisible = false
        this.newPassword = ''
        this.resetPasswordUser = null
      } catch (error) {
        console.error('重置密码失败:', error)
        this.$message({
          message: `重置密码失败: ${error.message}`,
          type: 'error'
        })
      } finally {
        this.loading = false
      }
    },

    // 分配角色
    assign_role(row) {
      // 跳转到分配角色页面，传递用户信息和租户信息
      this.$router.push({
        name: 'RoleAssignment',
        params: {
          user_name: row.user_name,
          tenant_code: row.tenant_code || this.searchForm.tenant_code || 'default'
        }
      })
    },

    // 处理状态变化
    async handle_status_change(row) {
      this.loading = true

      try {
        // 确保状态值为数字格式（0为正常/启用，1为停用）
        const statusValue = row.status;  // 现在row.status已经是正确的值（0或1）因为我们设置了active-value和inactive-value
        // 使用 user_name 而不是 user_code，以避免使用可遍历的 id
        await RBACService.updateUser(row.user_name, row.tenant_code || 'default', { status: statusValue })
        const status = statusValue === 0 ? '启用' : '停用';  // 0表示启用，1表示停用
        this.$message({
          message: `用户状态已${status}`,
          type: 'success'
        })
      } catch (error) {
        console.error('更新用户状态失败:', error)
        this.$message({
          message: `更新用户状态失败: ${error.message}`,
          type: 'error'
        })
        // 恢复原状态
        this.fetchUsers()
      } finally {
        this.loading = false
      }
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '';

      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    // 格式化性别（数字转文本）
    formatGender(genderValue) {
      const genderMap = {
        0: '未知',
        1: '男',
        2: '女'
      };
      return genderMap[genderValue] || '未知';
    },

    // 格式化性别（文本转数字）
    parseGender(genderText) {
      const genderMap = {
        '': undefined,
        '未知': 0,
        '男': 1,
        '女': 2
      };
      return genderMap[genderText];
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

/* .department-tree >>> .el-tree-node__content:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
}

.department-tree >>> .el-tree-node.is-current > .el-tree-node__content {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: white;
} */

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

/* 右侧面板 */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 搜索区卡片 */
.filter-section {
  margin-bottom: 12px;
  /* padding: 14px 18px; */
  background: #fff;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.05);
  flex-shrink: 0;
}

.search-form .el-form-item {
  /* margin-bottom: 12px; */
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
/* .filter-section >>> .el-button--primary {
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
} */

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

/* .table-operations >>> .el-button {
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
} */

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
  background: white;
  margin-top: 0!important;
  padding-bottom: 10px!important;
}

.pagination-container >>> .el-pagination__total {
  padding-top: 3px;
}

.pagination-container >>> .el-pagination {
  display: flex;
  justify-content: center;
}

.pagination-container >>> .el-pagination .el-pager li {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 4px;
  color: #3b82f6;
  margin: 0 2px;
}

.pagination-container >>> .el-pagination .el-pager li:hover {
  color: #1d4ed8;
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.05);
}

.pagination-container >>> .el-pagination .el-pager li.active {
  background: #3b82f6 !important;
  border-color: #3b82f6 !important;
  color: white !important;
  font-weight: 600 !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.pagination-container >>> .el-pagination button {
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.pagination-container >>> .el-pagination button:hover {
  color: #1d4ed8;
  border-color: #3b82f6;
}

.pagination-container >>> .el-pagination .btn-prev,
.pagination-container >>> .el-pagination .btn-next {
  background-color: white !important;
  border: 1px solid #dcdfe6 !important;
  color: #606266 !important;
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
/* .user-management-container >>> .el-dialog .el-button--primary {
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
} */

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
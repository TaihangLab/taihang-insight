<template>
  <div class="department-tree-management">
    <div class="page-header">
      <h2>部门树管理</h2>
      <p class="page-description">管理企业组织架构，支持多租户隔离</p>
    </div>

    <div class="main-content">
      <div class="content-wrapper">
        <!-- 租户选择区域（仅超管可见） -->
        <div class="tenant-selector" v-if="isSuperAdmin">
          <h3>选择租户</h3>
          <el-select 
            v-model="selectedTenant" 
            placeholder="请选择租户"
            @change="onTenantChange"
            style="width: 100%;"
          >
            <el-option
              v-for="tenant in tenants"
              :key="tenant.id"
              :label="tenant.tenant_name"
              :value="tenant.tenantId"
            />
          </el-select>
        </div>

        <!-- 部门树操作区域 -->
        <div class="tree-actions">
          <el-button type="primary" icon="el-icon-plus" @click="addRootDepartment">新增根部门</el-button>
          <el-button icon="el-icon-refresh" @click="refreshTree">刷新</el-button>
          <el-button icon="el-icon-circle-plus-outline" @click="expandAll">展开全部</el-button>
          <el-button icon="el-icon-remove-outline" @click="collapseAll">收起全部</el-button>
        </div>

        <!-- 部门树区域 -->
        <div class="tree-container">
          <el-input
            v-model="filterText"
            placeholder="输入关键字进行过滤"
            prefix-icon="el-icon-search"
            clearable
            class="tree-filter-input"
          />
          <el-tree
            ref="departmentTree"
            :data="departmentTree"
            :props="treeProps"
            :filter-node-method="filterNode"
            :expand-on-click-node="false"
            :default-expanded-keys="expandedKeys"
            node-key="id"
            highlight-current
            @node-click="onNodeClick"
            @node-contextmenu="onRightClick"
            @node-drop="handleDrop"
            draggable
            :allow-drop="allowDrop"
            :allow-drag="allowDrag"
            class="department-tree"
          >
            <span class="tree-node" slot-scope="{ node, data }">
              <span class="node-content">
                <i :class="getDeptIcon(data)" class="node-icon"></i>
                <span class="node-label">{{ node.label }}</span>
                <el-tag
                  v-if="data.status === 1"
                  type="danger"
                  size="mini"
                  class="status-tag"
                >
                  已停用
                </el-tag>
              </span>
              <span class="node-actions">
                <el-button
                  type="text"
                  size="mini"
                  @click="() => append(data)"
                  class="action-btn"
                  title="添加子部门"
                >
                  <i class="el-icon-plus"></i>
                </el-button>
                <el-button
                  type="text"
                  size="mini"
                  @click="() => edit(data)"
                  class="action-btn"
                  title="编辑部门"
                >
                  <i class="el-icon-edit"></i>
                </el-button>
                <el-button
                  type="text"
                  size="mini"
                  @click="() => remove(node, data)"
                  class="action-btn delete-btn"
                  title="删除部门"
                >
                  <i class="el-icon-delete"></i>
                </el-button>
              </span>
            </span>
          </el-tree>
        </div>
      </div>

      <!-- 部门信息侧边栏 -->
      <div class="sidebar" v-if="selectedDepartment">
        <div class="sidebar-header">
          <h3>{{ selectedDepartment.name }}</h3>
          <el-tag :type="selectedDepartment.status === 0 ? 'success' : 'danger'">
            {{ selectedDepartment.status === 0 ? '启用' : '停用' }}
          </el-tag>
        </div>
        <div class="sidebar-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="部门编码">
              {{ selectedDepartment.id }}
            </el-descriptions-item>
            <el-descriptions-item label="部门名称">
              {{ selectedDepartment.name }}
            </el-descriptions-item>
            <el-descriptions-item label="负责人" v-if="selectedDepartment.leader">
              {{ selectedDepartment.leader }}
            </el-descriptions-item>
            <el-descriptions-item label="联系电话" v-if="selectedDepartment.phone">
              {{ selectedDepartment.phone }}
            </el-descriptions-item>
            <el-descriptions-item label="邮箱" v-if="selectedDepartment.email">
              {{ selectedDepartment.email }}
            </el-descriptions-item>
            <el-descriptions-item label="排序">
              {{ selectedDepartment.order_num }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ selectedDepartment.create_time }}
            </el-descriptions-item>
            <el-descriptions-item label="更新时间">
              {{ selectedDepartment.update_time }}
            </el-descriptions-item>
          </el-descriptions>
          
          <div class="department-actions">
            <el-button 
              type="primary" 
              size="small" 
              @click="edit(selectedDepartment)"
            >
              编辑部门
            </el-button>
            <el-button
              :type="selectedDepartment.status === 0 ? 'success' : 'danger'"
              size="small"
              @click="toggleStatus(selectedDepartment)"
            >
              {{ selectedDepartment.status === 0 ? '启用' : '停用' }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 部门操作对话框 -->
      <el-dialog
        :title="dialogTitle"
        :visible.sync="dialogVisible"
        width="600px"
        :close-on-click-modal="false"
      >
        <el-form :model="departmentForm" :rules="departmentRules" ref="departmentForm" label-width="100px">
          <el-form-item label="部门名称" prop="name">
            <el-input v-model="departmentForm.name" placeholder="请输入部门名称" />
          </el-form-item>
          <el-form-item label="部门编码" prop="ids">
            <el-input 
              v-model="departmentForm.id" 
              placeholder="请输入部门编码" 
              :disabled="!!departmentForm.id"
            />
            <div class="form-tip">部门编码一旦创建不可修改</div>
          </el-form-item>
          <el-form-item label="上级部门">
            <el-cascader
              v-model="departmentForm.parent_id"
              :options="departmentOptions"
              :props="cascaderProps"
              placeholder="请选择上级部门"
              clearable
              filterable
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="负责人">
            <el-input v-model="departmentForm.leader" placeholder="请输入负责人姓名" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="departmentForm.phone" placeholder="请输入联系电话" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="departmentForm.email" placeholder="请输入邮箱地址" />
          </el-form-item>
          <el-form-item label="排序">
            <el-input-number 
              v-model="departmentForm.order_num" 
              :min="0" 
              :max="999" 
              controls-position="right"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-radio-group v-model="departmentForm.status">
              <el-radio :label="0">正常</el-radio>
              <el-radio :label="1">停用</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注">
            <el-input 
              v-model="departmentForm.remark" 
              type="textarea" 
              :rows="3"
              placeholder="请输入备注信息"
            />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitDepartment">确定</el-button>
        </div>
      </el-dialog>

      <!-- 右键菜单 -->
      <el-popover
        ref="contextMenu"
        placement="bottom-start"
        trigger="manual"
        :visible="contextMenuVisible"
        width="150"
      >
        <div class="context-menu">
          <el-button type="text" @click="addSubDepartment">添加子部门</el-button>
          <el-button type="text" @click="editContextMenu">编辑部门</el-button>
          <el-button type="text" class="delete-btn" @click="deleteContextMenu">删除部门</el-button>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<script>
import RBACService from '@/components/service/RBACService';
import DepartmentTreeService from './departmentTreeService.js';

export default {
  name: 'DepartmentTreeManagement',
  data() {
    return {
      // 租户相关
      tenants: [],
      selectedTenant: '',
      isSuperAdmin: false, // 模拟是否为超管

      // 部门树相关
      departmentTree: [],
      treeProps: {
        children: 'children',
        label: 'name',
        disabled: 'disabled'
      },
      expandedKeys: [],
      filterText: '',

      // 当前选中部门
      selectedDepartment: null,

      // 对话框相关
      dialogVisible: false,
      dialogType: '', // 'add', 'edit', 'addChild'
      departmentForm: {
        id: null,
        name: '',
        parent_id: null,
        leader: '',
        phone: '',
        email: '',
        order_num: 1,
        status: 1,
        remark: '',
        tenantId: ''
      },

      // 表单验证规则
      departmentRules: {
        name: [
          { required: true, message: '请输入部门名称', trigger: 'blur' },
          { min: 2, max: 50, message: '部门名称长度在2到50个字符', trigger: 'blur' }
        ]
      },

      // 级联选择器配置
      departmentOptions: [],
      cascaderProps: {
        value: 'id',
        label: 'name',
        checkStrictly: true,
        emitPath: false,
        expandTrigger: 'hover'
      },

      // 右键菜单
      contextMenuVisible: false,
      rightClickedNode: null,
      rightClickedData: null
    }
  },

  computed: {
    dialogTitle() {
      if (this.dialogType === 'add') return '新增部门';
      if (this.dialogType === 'addChild') return '新增子部门';
      return '编辑部门';
    }
  },

  watch: {
    filterText(val) {
      this.$refs.departmentTree.filter(val);
    }
  },

  async created() {
    // 检查用户权限
    this.checkUserPermission();

    // 加载初始数据
    await this.loadInitialData();
  },

  methods: {
    // 检查用户权限
    checkUserPermission() {
      // 这里应该根据用户角色判断是否为超管
      // 模拟：假设有权限标识
      const userRole = localStorage.getItem('userRole') || 'user';
      this.isSuperAdmin = userRole === 'super_admin';

      // 如果不是超管，使用当前用户租户
      if (!this.isSuperAdmin) {
        this.selectedTenant = localStorage.getItem('tenantId') || 'default';
      }
    },

    // 加载初始数据
    async loadInitialData() {
      if (this.isSuperAdmin) {
        await this.loadTenants();
      }

      if (this.selectedTenant) {
        await this.loadDepartmentTree();
      }
    },

    // 加载租户列表
    async loadTenants() {
      try {
        // 从后端获取租户列表
        const response = await RBACService.getTenants();
        this.tenants = response.data.items || [];

        // 默认选择第一个租户
        if (this.tenants.length > 0 && !this.selectedTenant) {
          this.selectedTenant = this.tenants[0].tenantId;
        }
      } catch (error) {
        console.error('加载租户列表失败:', error);
        this.$message.error('加载租户列表失败');
      }
    },

    // 加载部门树
    async loadDepartmentTree() {
      try {
        // 从后端获取部门树
        const response = await DepartmentTreeService.getDepartmentTree(this.selectedTenant);
        this.departmentTree = Array.isArray(response.data) ? response.data : response.data.tree || [];

        // 展开根节点
        if (this.departmentTree.length > 0) {
          this.expandedKeys = this.departmentTree.map(node => node.id);
        }
      } catch (error) {
        console.error('加载部门树失败:', error);
        this.$message.error('加载部门树失败');
      }
    },

    // 刷新树
    async refreshTree() {
      await this.loadDepartmentTree();
      this.$message.success('部门树已刷新');
    },

    // 展开全部
    expandAll() {
      this.expandNode(this.departmentTree, true);
    },

    // 收起全部
    collapseAll() {
      this.expandNode(this.departmentTree, false);
    },

    // 展开或收起节点
    expandNode(nodes, expand) {
      nodes.forEach(node => {
        this.$refs.departmentTree.store.nodesMap[node.id].expanded = expand;
        if (node.children) {
          this.expandNode(node.children, expand);
        }
      });
    },

    // 过滤节点
    filterNode(value, data) {
      if (!value) return true;
      return data.name.indexOf(value) !== -1 ||
             data.id.indexOf(value) !== -1 ||
             (data.leader && data.leader.indexOf(value) !== -1);
    },

    // 租户切换
    async onTenantChange(tenantId) {
      this.selectedTenant = tenantId;
      await this.loadDepartmentTree();
      this.selectedDepartment = null;
    },

    // 节点点击
    onNodeClick(data) {
      this.selectedDepartment = data;
    },

    // 右键点击
    onRightClick(event, node, data) {
      event.preventDefault();
      this.rightClickedNode = node;
      this.rightClickedData = data;
      this.contextMenuVisible = true;

      // 定位菜单到点击位置
      const popover = this.$refs.contextMenu.$refs.popper;
      popover.style.left = event.clientX + 'px';
      popover.style.top = event.clientY + 'px';
    },

    // 添加根部门
    async addRootDepartment() {
      this.dialogType = 'add';
      this.departmentForm = {
        id: null,
        name: '',
        parent_id: 0, // 根部门，确保是数字类型
        leader: '',
        phone: '',
        email: '',
        order_num: 1,
        status: 1,
        remark: '',
        tenantId: this.selectedTenant
      };
      this.loadDepartmentOptions(); // 加载部门选项
      this.dialogVisible = true;
    },

    // 添加子部门
    async append(data) {
      this.dialogType = 'addChild';
      this.departmentForm = {
        id: null,
        name: '',
        parent_id: parseInt(data.id),  // 确保传递整数ID
        leader: '',
        phone: '',
        email: '',
        order_num: 1,
        status: 1,
        remark: '',
        tenantId: this.selectedTenant
      };
      this.loadDepartmentOptions(); // 加载部门选项
      this.dialogVisible = true;
    },

    // 编辑部门
    async edit(data) {
      this.dialogType = 'edit';
      this.departmentForm = { ...data };
      // 确保 parent_id 是数字类型，与级联选择器的 value 类型一致
      if (this.departmentForm.parent_id !== null && this.departmentForm.parent_id !== undefined) {
        this.departmentForm.parent_id = parseInt(this.departmentForm.parent_id);
      }
      console.log('编辑部门 - 原始数据:', data);
      console.log('编辑部门 - departmentForm.parent_id:', this.departmentForm.parent_id, '类型:', typeof this.departmentForm.parent_id);
      this.loadDepartmentOptions(); // 加载部门选项
      console.log('编辑部门 - departmentOptions:', this.departmentOptions);
      console.log('编辑部门 - 查找匹配的选项:', this.departmentOptions.find(opt => opt.id === this.departmentForm.parent_id));
      this.dialogVisible = true;
    },

    // 编辑右键菜单
    editContextMenu() {
      this.edit(this.rightClickedData);
      this.contextMenuVisible = false;
    },

    // 删除节点
    async remove(node, data) {
      this.$confirm(`确定要删除部门 "${data.name}" 吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          // 调用后端API删除部门
          await DepartmentTreeService.deleteDepartment(data.id, this.selectedTenant);

          // 从本地树中移除
          const parent = node.parent;
          const children = parent.data.children || parent.data;
          const index = children.findIndex(d => d.id === data.id);
          children.splice(index, 1);

          this.$message.success('部门删除成功');

          // 清除选中状态
          if (this.selectedDepartment && this.selectedDepartment.id === data.id) {
            this.selectedDepartment = null;
          }
        } catch (error) {
          console.error('删除部门失败:', error);
          this.$message.error('删除部门失败');
        }
      }).catch(() => {
        // 用户取消删除
      });
    },

    // 删除右键菜单
    deleteContextMenu() {
      this.remove(this.rightClickedNode, this.rightClickedData);
      this.contextMenuVisible = false;
    },

    // 添加子部门（右键菜单）
    addSubDepartment() {
      this.append(this.rightClickedData);
      this.contextMenuVisible = false;
    },

    // 提交部门信息
    async submitDepartment() {
      this.$refs.departmentForm.validate(async (valid) => {
        if (!valid) {
          return;
        }

        try {
          if (this.dialogType === 'edit') {
            const updateData = { ...this.departmentForm, tenantId: this.selectedTenant };
            await DepartmentTreeService.updateDepartment(
              this.departmentForm.id, 
              updateData,
              this.selectedTenant
            );

            // 更新本地数据
            const node = this.findTreeNode(this.departmentTree, this.departmentForm.id);
            if (node) {
              Object.assign(node, this.departmentForm);
            }

            this.$message.success('部门信息更新成功');
          } else {
            // 创建部门时，需要处理Materialized Path结构
            const departmentData = { ...this.departmentForm, tenantId: this.selectedTenant };

            // 确保parent_id是数字类型，以便后端正确解析
            if (departmentData.parent_id) {
              departmentData.parent_id = typeof departmentData.parent_id === 'string'
                ? parseInt(departmentData.parent_id)
                : departmentData.parent_id;
            }

            // 如果有父部门，需要计算ancestors路径
            if (this.departmentForm.parent_id && this.departmentForm.parent_id !== 0) {
              // 从现有树中获取父部门信息以计算ancestors
              const parentDept = this.findTreeNode(this.departmentTree, this.departmentForm.parent_id);
              if (parentDept) {
                // 根据Materialized Path规则计算ancestors
                departmentData.ancestors = parentDept.ancestors
                  ? `${parentDept.ancestors},${parentDept.id}`
                  : `${parentDept.id}`;
              }
            } else {
              // 根部门，ancestors为空
              departmentData.ancestors = '';
            }

            const response = await DepartmentTreeService.createDepartment(departmentData);

            // 刷新整个树以确保Materialized Path结构正确
            await this.loadDepartmentTree();

            this.$message.success('部门创建成功');
          }

          this.dialogVisible = false;
          this.refreshTree(); // 刷新树以确保数据同步
        } catch (error) {
          console.error('保存部门失败:', error);
          this.$message.error('保存部门失败');
        }
      });
    },

    // 查找树节点
    findTreeNode(nodes, id) {
      for (const node of nodes) {
        if (node.id == id) {
          return node;
        }
        if (node.children) {
          const found = this.findTreeNode(node.children, id);
          if (found) return found;
        }
      }
      return null;
    },

    // 切换部门状态
    async toggleStatus(dept) {
      try {
        const newStatus = dept.status === 0 ? 1 : 0;  // 0为正常，1为停用

        // 调用后端API更新状态
        await DepartmentTreeService.updateDepartmentStatus(
          dept.id,
          this.selectedTenant,
          newStatus
        );

        // 更新本地数据
        dept.status = newStatus;
        dept.update_time = new Date().toISOString().slice(0, 19).replace('T', ' ');

        this.$message.success(`部门已${newStatus === 1 ? '启用' : '停用'}`);
      } catch (error) {
        console.error('更新部门状态失败:', error);
        this.$message.error('更新部门状态失败');
      }
    },

    // 获取部门图标
    getDeptIcon(data) {
      if (data.parent_id === 0) {
        return 'el-icon-office-building'; // 根部门
      }
      if (data.children && data.children.length > 0) {
        return 'el-icon-folder-opened'; // 有子部门
      }
      return 'el-icon-folder'; // 末级部门
    },

    // 拖拽相关方法
    async allowDrop(draggingNode, dropNode, type) {
      // 不允许跨租户拖拽
      if (draggingNode.data.tenantId !== dropNode.data.tenantId) {
        this.$message.error('不允许跨租户拖拽');
        return false;
      }

      // 不允许将父部门拖拽到自己的子部门下
      if (dropNode.level > draggingNode.level && dropNode.data.id === draggingNode.data.id) {
        this.$message.error('不能将部门拖拽到自身或其子部门下');
        return false;
      }

      // 检查是否形成循环引用
      if (this.isDescendant(dropNode.data, draggingNode.data)) {
        this.$message.error('不能将父部门拖拽到子部门下');
        return false;
      }

      return true;
    },

    allowDrag(draggingNode) {
      // 超管可以拖拽所有部门，普通用户只能拖拽自己租户的部门
      return draggingNode.data.tenantId === this.selectedTenant;
    },

    // 检查一个节点是否是另一个节点的后代
    isDescendant(parentNode, childNode) {
      if (!childNode.ancestors) return false;
      const ancestors = childNode.ancestors.split(',').filter(id => id !== '');
      return ancestors.includes(String(parentNode.id));
    },

    // 节点拖拽结束后的处理
    async handleDrop(draggingNode, dropNode, dropType) {
      try {
        // 确认用户操作
        const confirmResult = await this.$confirm(
          `确定要将部门 "${draggingNode.data.name}" 移动到 "${dropNode.data.name}" 下吗？`,
          '确认移动',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );

        if (confirmResult !== 'confirm') {
          // 如果用户取消，需要手动恢复节点位置
          this.refreshTree();
          return;
        }

        // 调用后端API移动节点
        await DepartmentTreeService.moveNode(
          draggingNode.data.id,
          dropNode.data.id,
          this.selectedTenant
        );

        // 刷新树以反映变动
        await this.loadDepartmentTree();

        this.$message.success('部门移动成功');
      } catch (error) {
        console.error('移动部门失败:', error);
        this.$message.error('移动部门失败');

        // 刷新树以恢复状态
        await this.loadDepartmentTree();
      }
    },

    // 加载部门选项（用于级联选择器）
    loadDepartmentOptions() {
      // 将树形结构转换为级联选择器可用的格式
      const options = this.convertTreeToCascaderOptions(this.departmentTree);
      
      // 添加"无上级部门"选项（id为0）
      const noneOption = {
        id: 0,
        name: '无上级部门',
        label: '无上级部门',
        children: []
      };
      
      this.departmentOptions = [noneOption, ...options];
      console.log('加载部门选项 - departmentOptions:', this.departmentOptions);
    },

    // 转换树形结构为级联选择器格式
    convertTreeToCascaderOptions(treeNodes) {
      return treeNodes.map(node => {
        const option = {
          id: parseInt(node.id),  // 确保 id 字段是数字类型（cascaderProps.value 使用的是 'id'）
          name: node.name,
          label: node.name
        };

        if (node.children && node.children.length > 0) {
          option.children = this.convertTreeToCascaderOptions(node.children);
        }

        return option;
      });
    }
  }
}
</script>

<style scoped>
.department-tree-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.main-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
}

.content-wrapper {
  flex: 1;
  padding: 20px;
}

.sidebar {
  width: 350px;
  border-left: 1px solid #e5e7eb;
  padding: 20px;
  background-color: #fafafa;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}

.department-actions {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tenant-selector {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.tenant-selector h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 500;
  color: #374151;
}

.tree-actions {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tree-filter-input {
  margin-bottom: 15px;
}

.tree-container {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 15px;
  background: white;
  min-height: 500px;
}

.department-tree {
  overflow: auto;
  max-height: 600px;
}

.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.node-content {
  display: flex;
  align-items: center;
}

.node-icon {
  margin-right: 8px;
  color: #4f46e5;
}

.node-label {
  font-weight: 500;
  color: #1f2937;
}

.status-tag {
  margin-left: 8px;
  height: 20px;
  padding: 0 6px;
  font-size: 12px;
}

.node-actions {
  display: none;
}

.department-tree :deep(.el-tree-node__content:hover .node-actions) {
  display: inline-block;
}

.action-btn {
  margin-left: 5px;
  padding: 2px 4px;
  color: #6b7280;
}

.action-btn:hover {
  color: #4f46e5;
}

.delete-btn {
  color: #ef4444;
}

.delete-btn:hover {
  color: #dc2626;
}

.form-tip {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 5px;
}

.context-menu {
  display: flex;
  flex-direction: column;
}

.context-menu .el-button {
  text-align: left;
  padding: 8px 12px;
  margin: 0;
}

.context-menu .el-button:hover {
  background-color: #f3f4f6;
}

.dialog-footer {
  text-align: right;
}
</style>
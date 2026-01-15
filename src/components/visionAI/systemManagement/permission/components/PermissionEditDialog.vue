<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="visible"
    width="650px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="form" :rules="rules" ref="permissionForm" label-width="100px">
      <!-- 组件路径（树形选择） -->
      <el-form-item label="组件路径" prop="component">
        <el-cascader
          v-if="isCreate"
          v-model="selectedComponentPath"
          :options="componentTree"
          :props="cascaderProps"
          placeholder="请选择组件目录或文件"
          style="width: 100%"
          @change="handleComponentChange"
          clearable
          filterable
        >
          <template slot-scope="{ node, data }">
            <span>
              <i :class="data.isDir ? 'el-icon-folder' : 'el-icon-document'"></i>
              {{ data.label }}
            </span>
          </template>
        </el-cascader>
        <el-input
          v-else
          v-model="form.component"
          placeholder="组件路径"
          disabled
        />
        <div class="form-tip" v-if="isCreate">
          选择文件夹作为目录节点，或选择页面文件
        </div>
      </el-form-item>

      <!-- 路由路径（自动生成，可修改） -->
      <el-form-item label="路由路径" prop="path">
        <el-input
          v-model="form.path"
          placeholder="自动生成，可修改"
          @input="handlePathInput"
        />
      </el-form-item>

      <!-- 权限类型（根据选择自动确定） -->
      <el-form-item label="权限类型" prop="type" v-if="isCreate">
        <el-radio-group v-model="form.type">
          <el-radio label="folder" :disabled="!canCreateFolder">
            <i class="el-icon-folder"></i> 文件夹
          </el-radio>
          <el-radio label="menu" :disabled="!canCreateMenu">
            <i class="el-icon-menu"></i> 页面
          </el-radio>
          <el-radio label="button" :disabled="!canCreateButton">
            <i class="el-icon-document"></i> 按钮
          </el-radio>
        </el-radio-group>
        <div class="form-tip" v-if="parentNode">
          父节点：{{ parentNode.name }} ({{ getTypeLabel(parentNode.type) }})
          <span v-if="parentNode.component" style="color: #409eff">
            <br>组件：{{ parentNode.component }}
          </span>
        </div>
      </el-form-item>

      <!-- 基本信息 -->
      <el-form-item label="权限名称" prop="name">
        <el-input v-model="form.name" placeholder="自动生成蛇形命名" />
        <div class="form-tip">
          蛇形命名：user_management
        </div>
      </el-form-item>

      <el-form-item label="权限描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          placeholder="请输入权限描述"
        />
      </el-form-item>

      <!-- 权限码（自动生成） -->
      <el-form-item label="权限码" prop="code">
        <el-input v-model="form.code" placeholder="自动生成">
          <template slot="append">
            <el-button @click="generateCode">生成</el-button>
          </template>
        </el-input>
        <div class="form-tip">
          格式：模块:资源:操作，如 system:user_management:view
        </div>
      </el-form-item>

      <!-- 菜单相关字段（folder 和 menu） -->
      <template v-if="form.type === 'folder' || form.type === 'menu'">
        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="el-icon-user">
            <template slot="prepend">
              <i :class="form.icon || 'el-icon-question'"></i>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="1" :max="9999" />
        </el-form-item>

        <!-- 仅 menu 类型显示 visible 字段 -->
        <el-form-item label="菜单显示" prop="visible" v-if="form.type === 'menu'">
          <el-switch
            v-model="form.visible"
            active-text="显示"
            inactive-text="隐藏"
          />
        </el-form-item>
      </template>

      <!-- 按钮相关字段（button） -->
      <template v-if="form.type === 'button'">
        <el-form-item label="操作分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择" style="width: 100%">
            <el-option label="读取" value="READ" />
            <el-option label="写入" value="WRITE" />
            <el-option label="删除" value="DELETE" />
            <el-option label="特殊" value="SPECIAL" />
          </el-select>
        </el-form-item>

        <el-form-item label="资源" prop="resource">
          <el-input v-model="form.resource" placeholder="user_management, role_management" />
        </el-form-item>

        <el-form-item label="操作" prop="action">
          <el-select v-model="form.action" placeholder="请选择" style="width: 100%" @change="generateCode">
            <el-option label="查看" value="view" />
            <el-option label="读取" value="read" />
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="导出" value="export" />
            <el-option label="导入" value="import" />
            <el-option label="启用" value="enable" />
            <el-option label="禁用" value="disable" />
            <el-option label="重置密码" value="reset_password" />
          </el-select>
        </el-form-item>
      </template>

      <!-- 状态 -->
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :label="0">启用</el-radio>
          <el-radio :label="1">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { toSnakeCase } from '@/utils/namingConverter';

// 使用 webpack require.context 获取 pages 目录结构并转换为树形
function getComponentTree() {
  const baseContext = require.context(
    '@/pages',
    true,
    /\.vue$/
  );

  const tree = [];
  const nodeMap = {};

  baseContext.keys().forEach(key => {
    // 移除 './' 前缀和 '.vue' 后缀
    const path = key.replace(/^\.\//, '').replace(/\.vue$/, '');

    // 跳过子组件目录
    if (path.includes('/components/') || path.includes('/dialog/') || path.includes('/dialogs/')) {
      return;
    }

    const segments = path.split('/');
    let currentLevel = tree;

    // 构建目录结构
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      const nodeKey = segments.slice(0, i + 1).join('/');

      if (!nodeMap[nodeKey]) {
        const newNode = {
          value: nodeKey,
          label: segment,
          isDir: true,
          children: []
        };
        nodeMap[nodeKey] = newNode;
        currentLevel.push(newNode);
        currentLevel = newNode.children;
      } else {
        currentLevel = nodeMap[nodeKey].children;
      }
    }

    // 添加文件节点
    const fileName = segments[segments.length - 1];
    const fileKey = path;
    const node = {
      value: fileKey,
      label: fileName,
      isDir: false
    };
    currentLevel.push(node);
  });

  return tree;
}

// 生成权限名称（蛇形）
function generatePermissionName(componentPath) {
  if (!componentPath) return '';

  // 取最后一个段
  const segments = componentPath.split('/');
  const lastSegment = segments[segments.length - 1];

  // 转换为蛇形命名（支持 kebab-case、PascalCase、camelCase）
  return toSnakeCase(lastSegment);
}

// 生成权限码
function generatePermissionCode(componentPath, type, action, parentCode) {
  if (!componentPath) return '';

  const segments = componentPath.split('/').filter(s => s);

  // 将所有段转为蛇形命名（支持 kebab-case、PascalCase、camelCase）
  const snakeSegments = segments.map(seg => toSnakeCase(seg));

  switch (type) {
    case 'folder':
      // 文件夹：所有段用冒号连接
      // system-management => system_management
      // system-management/user-management => system:management:user_management
      if (snakeSegments.length === 1) {
        return snakeSegments[0];
      }
      return snakeSegments.join(':');

    case 'menu':
      // 页面：所有段加 :view
      // user-management => user_management:view
      // system-management/user-management => system:management:user_management:view
      return snakeSegments.join(':') + ':view';

    case 'button':
      // 按钮：基于父页面权限码，替换 :view 为具体操作
      if (parentCode && action) {
        return parentCode.replace(':view', `:${action}`);
      }
      break;
  }

  return '';
}

// 组件树数据
const componentTree = getComponentTree();

export default {
  name: 'PermissionEditDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    mode: {
      type: String,
      default: 'create'
    },
    node: {
      type: Object,
      default: null
    },
    parentNode: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      componentTree: componentTree,
      selectedComponentPath: [],
      cascaderProps: {
        value: 'value',
        label: 'label',
        children: 'children',
        checkStrictly: true,
        emitPath: true
      },
      form: {
        id: '',
        code: '',
        name: '',
        description: '',
        type: 'menu',
        parentId: null,
        component: '',
        path: '',
        icon: '',
        visible: true,
        sortOrder: 1,
        category: '',
        resource: '',
        action: '',
        status: 0
      },
      rules: {
        component: [{ required: true, message: '请选择组件', trigger: 'change' }],
        path: [{ required: true, message: '请输入路由路径', trigger: 'blur' }],
        type: [{ required: true, message: '请选择权限类型', trigger: 'change' }],
        name: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
        code: [{ required: true, message: '请输入权限码', trigger: 'blur' }],
        category: [{ required: true, message: '请选择操作分类', trigger: 'change' }],
        resource: [{ required: true, message: '请输入资源', trigger: 'blur' }],
        action: [{ required: true, message: '请选择操作', trigger: 'change' }]
      },
      loading: false
    };
  },
  computed: {
    isCreate() {
      return this.mode === 'create';
    },
    dialogTitle() {
      if (this.isCreate) {
        return '新增权限';
      }
      return `编辑权限 - ${(this.node && this.node.name) || ''}`;
    },
    canCreateFolder() {
      if (!this.parentNode) return true;
      return this.parentNode.type === 'folder';
    },
    canCreateMenu() {
      if (!this.parentNode) return false;
      return this.parentNode.type === 'folder';
    },
    canCreateButton() {
      if (!this.parentNode) return false;
      return this.parentNode.type === 'menu';
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.initForm();
      }
    }
  },
  methods: {
    initForm() {
      if (this.isCreate) {
        let defaultType = 'menu';
        if (!this.parentNode) {
          defaultType = 'folder';
        } else if (this.parentNode.type === 'folder') {
          defaultType = 'menu';
        } else if (this.parentNode.type === 'menu') {
          defaultType = 'button';
        }

        this.form = {
          id: '',
          code: '',
          name: '',
          description: '',
          type: defaultType,
          parentId: (this.parentNode && this.parentNode.id) || null,
          component: '',
          path: '',
          icon: '',
          visible: true,
          sortOrder: 1,
          category: '',
          resource: '',
          action: '',
          status: 0
        };
        this.selectedComponentPath = [];
      } else if (this.node) {
        this.form = { ...this.node };
      }
    },

    handleComponentChange(pathArray) {
      if (!pathArray || pathArray.length === 0) {
        this.form.component = '';
        this.form.path = '';
        this.form.name = '';
        this.form.code = '';
        return;
      }

      const componentPath = Array.isArray(pathArray) ? pathArray[pathArray.length - 1] : pathArray;
      this.form.component = componentPath;

      // 判断是目录还是文件
      const isDir = this.isDirectoryInTree(pathArray);

      // 根据选择自动设置权限类型
      if (isDir) {
        this.form.type = 'folder';
      } else {
        this.form.type = 'menu';
      }

      // 生成路由路径（不加前缀 /，避免和自动挂载的路径冲突）
      this.form.path = componentPath.replace(/\\/g, '/');

      // 生成蛇形命名的权限名称
      this.form.name = generatePermissionName(componentPath);

      // 生成权限码
      this.generateCode();
    },

    // 判断选择的路径是否是目录
    isDirectoryInTree(pathArray) {
      const findNodeByPath = (nodes, targetPath, pathIndex) => {
        for (const node of nodes) {
          if (node.value === targetPath[pathIndex]) {
            if (pathIndex === targetPath.length - 1) {
              return node;
            }
            if (node.children && pathIndex < targetPath.length - 1) {
              const found = findNodeByPath(node.children, targetPath, pathIndex + 1);
              if (found) return found;
            }
          }
        }
        return null;
      };

      const node = findNodeByPath(this.componentTree, pathArray, 0);
      return node && node.isDir;
    },

    handlePathInput() {
      this.generateCode();
    },

    handleTypeChange() {
      this.generateCode();
    },

    generateCode() {
      if (!this.isCreate) return;

      const parentCode = (this.parentNode && this.parentNode.code) || '';

      this.form.code = generatePermissionCode(
        this.form.component,
        this.form.type,
        this.form.action,
        parentCode
      );

      // 自动设置资源名（按钮类型）
      if (this.form.type === 'button' && this.form.component && !this.form.resource) {
        this.form.resource = generatePermissionName(this.form.component);
      }
    },

    getTypeLabel(type) {
      const labels = {
        folder: '文件夹',
        menu: '页面',
        button: '按钮'
      };
      return labels[type] || type;
    },

    handleSubmit() {
      this.$refs.permissionForm.validate(async (valid) => {
        if (!valid) return;

        this.loading = true;
        try {
          const submitData = { ...this.form };

          if (submitData.type === 'button' && !submitData.category) {
            const action = submitData.action;
            if (['read', 'view'].includes(action)) {
              submitData.category = 'READ';
            } else if (['create', 'update', 'import'].includes(action)) {
              submitData.category = 'WRITE';
            } else if (['delete'].includes(action)) {
              submitData.category = 'DELETE';
            } else {
              submitData.category = 'SPECIAL';
            }
          }

          this.$emit('saved', submitData);
          this.handleClose();
        } catch (error) {
          console.error('提交失败:', error);
          this.$message.error(error.message || '操作失败');
        } finally {
          this.loading = false;
        }
      });
    },

    handleClose() {
      this.$emit('update:visible', false);
      if (this.$refs.permissionForm) {
        this.$refs.permissionForm.resetFields();
      }
    }
  }
};
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.5;
}

.dialog-footer {
  text-align: right;
}
</style>

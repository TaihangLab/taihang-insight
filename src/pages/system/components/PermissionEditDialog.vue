<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="visible"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="form" :rules="rules" ref="permissionForm" label-width="110px">
      <!-- 1. 权限类型（必填，首字段） -->
      <el-form-item label="权限类型" prop="type">
        <el-radio-group v-model="form.type" :disabled="!isCreate" @change="handleTypeChange">
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
        </div>
      </el-form-item>

      <!-- ============ 文件夹类型字段 ============ -->
      <template v-if="form.type === 'folder'">
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="权限名称" prop="name">
          <el-input v-model="form.name" placeholder="如：系统管理" />
        </el-form-item>

        <el-form-item label="路由路径" prop="path">
          <el-input v-model="form.path" placeholder="如：system-management" @input="handlePathInput" />
          <div class="form-tip">用于生成权限码，支持 kebab-case 或 camelCase</div>
        </el-form-item>

        <el-form-item label="权限码" prop="code">
          <el-input v-model="form.code" placeholder="自动生成">
            <template slot="append">
              <el-button @click="generateCode">生成</el-button>
            </template>
          </el-input>
          <div class="form-tip">格式：system_management</div>
        </el-form-item>

        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="el-icon-folder">
            <template slot="prepend">
              <i :class="form.icon || 'el-icon-question'"></i>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="1" :max="9999" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="权限说明文字"
          />
        </el-form-item>
      </template>

      <!-- ============ 页面类型字段 ============ -->
      <template v-if="form.type === 'menu'">
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="权限名称" prop="name">
          <el-input v-model="form.name" placeholder="如：用户管理" />
        </el-form-item>

        <el-form-item label="路由路径" prop="path">
          <el-input v-model="form.path" placeholder="如：system/user-management" @input="handlePathInput" />
        </el-form-item>

        <el-form-item label="权限码" prop="code">
          <el-input v-model="form.code" placeholder="自动生成">
            <template slot="append">
              <el-button @click="generateCode">生成</el-button>
            </template>
          </el-input>
          <div class="form-tip">格式：system:user_management:view</div>
        </el-form-item>

        <el-form-item label="组件路径" prop="component">
          <el-input v-model="form.component" placeholder="如：@/pages/system-manage/userManagement.vue" />
          <div class="form-tip">支持 @ 别名，相对路径</div>
        </el-form-item>

        <el-divider content-position="left">显示设置</el-divider>

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

        <el-form-item label="显示选项">
          <el-checkbox v-model="form.layout">需要 Layout</el-checkbox>
          <el-checkbox v-model="form.visible">在菜单中显示</el-checkbox>
          <el-checkbox v-model="form.openNewTab">新窗口打开</el-checkbox>
          <el-checkbox v-model="form.keepAlive">页面缓存</el-checkbox>
        </el-form-item>

        <el-form-item label="路由参数" prop="routeParams">
          <el-input
            v-model="routeParamsJson"
            type="textarea"
            :rows="2"
            placeholder='{"status": "active"}'
            @blur="parseRouteParams"
          />
          <div class="form-tip">JSON 格式，定义路由的默认参数</div>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="权限说明文字"
          />
        </el-form-item>
      </template>

      <!-- ============ 按钮类型字段 ============ -->
      <template v-if="form.type === 'button'">
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="权限名称" prop="name">
          <el-input v-model="form.name" placeholder="如：新增用户" />
        </el-form-item>

        <el-form-item label="所属页面" prop="parentMenuId">
          <el-select
            v-model="form.parentId"
            placeholder="请选择所属页面"
            style="width: 100%"
            filterable
            :disabled="!!parentNode"
          >
            <el-option
              v-for="menu in menuOptions"
              :key="menu.id"
              :label="`${menu.name} (${menu.code})`"
              :value="menu.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="权限码" prop="code">
          <el-input v-model="form.code" placeholder="自动生成">
            <template slot="append">
              <el-button @click="generateCode">生成</el-button>
            </template>
          </el-input>
          <div class="form-tip">格式：system:user:create</div>
        </el-form-item>

        <el-divider content-position="left">API 配置</el-divider>

        <el-form-item label="API 地址" prop="apiPath">
          <el-input v-model="form.apiPath" placeholder="/api/system/user" />
          <div class="form-tip">必须以 /api/ 开头</div>
        </el-form-item>

        <el-form-item label="请求方式" prop="methods">
          <el-checkbox-group v-model="form.methods">
            <el-checkbox label="GET">GET - 查询</el-checkbox>
            <el-checkbox label="POST">POST - 新增</el-checkbox>
            <el-checkbox label="PUT">PUT - 更新</el-checkbox>
            <el-checkbox label="PATCH">PATCH - 部分更新</el-checkbox>
            <el-checkbox label="DELETE">DELETE - 删除</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="操作分类" prop="category">
          <el-radio-group v-model="form.category">
            <el-radio label="READ">读取 (READ)</el-radio>
            <el-radio label="WRITE">写入 (WRITE)</el-radio>
            <el-radio label="DELETE">删除 (DELETE)</el-radio>
            <el-radio label="SPECIAL">特殊 (SPECIAL)</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="资源标识" prop="resource">
          <el-input v-model="form.resource" placeholder="user" />
          <div class="form-tip">受保护的资源名称，小写字母和下划线</div>
        </el-form-item>

        <el-divider content-position="left">高级配置</el-divider>

        <el-form-item label="路径参数">
          <el-input
            v-model="pathParamsJson"
            type="textarea"
            :rows="2"
            placeholder='{"id": "number"}'
            @blur="parsePathParams"
          />
          <div class="form-tip">JSON 格式，定义路径参数类型</div>
        </el-form-item>

        <el-form-item label="请求体验证">
          <el-input
            v-model="bodySchemaJson"
            type="textarea"
            :rows="2"
            placeholder='{"type": "object"}'
            @blur="parseBodySchema"
          />
          <div class="form-tip">JSON Schema 格式</div>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="权限说明文字"
          />
        </el-form-item>
      </template>

      <!-- ============ 通用字段 ============ -->
      <el-divider content-position="left">状态设置</el-divider>

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
import { toSnakeCase, camelToSnake, kebabToSnake } from '@/utils/namingConverter';
import permissionService from '@/components/service/rbac/permissionService';

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
    },
    permissionTree: {
      type: Array,
      default: () => []
    }
  },
  data() {
    // 自定义验证规则
    const validateCode = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入权限码'));
        return;
      }
      if (!/^[a-z:_]+$/.test(value)) {
        callback(new Error('权限码只能包含小写字母、冒号和下划线'));
        return;
      }
      callback();
    };

    const validatePath = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入路由路径'));
        return;
      }
      if (!/^[a-z0-9/-]+$/.test(value)) {
        callback(new Error('路由路径只能包含小写字母、数字、斜杠和短横线'));
        return;
      }
      callback();
    };

    const validateApiPath = (rule, value, callback) => {
      if (this.form.type === 'button' && !value) {
        callback(new Error('请输入 API 地址'));
        return;
      }
      if (value && !/^\/api\/.+/.test(value)) {
        callback(new Error('API 地址必须以 /api/ 开头'));
        return;
      }
      callback();
    };

    const validateMethods = (rule, value, callback) => {
      if (this.form.type === 'button' && (!value || value.length === 0)) {
        callback(new Error('请选择至少一种请求方式'));
        return;
      }
      callback();
    };

    return {
      form: {
        id: '',
        type: 'menu',
        name: '',
        code: '',
        path: '',
        component: '',
        icon: '',
        sortOrder: 1,
        visible: true,
        layout: true,
        openNewTab: false,
        keepAlive: true,
        routeParams: null,
        parentMenuId: null,
        parentId: null,
        apiPath: '',
        methods: [],
        category: 'WRITE',
        resource: '',
        pathParams: null,
        bodySchema: null,
        description: '',
        status: 0
      },
      routeParamsJson: '',
      pathParamsJson: '',
      bodySchemaJson: '',
      menuOptions: [],
      rules: {
        type: [{ required: true, message: '请选择权限类型', trigger: 'change' }],
        name: [
          { required: true, message: '请输入权限名称', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入权限码', trigger: 'blur' },
          { validator: validateCode, trigger: 'blur' }
        ],
        path: [
          { required: true, message: '请输入路由路径', trigger: 'blur' },
          { validator: validatePath, trigger: 'blur' }
        ],
        component: [{ required: true, message: '请输入组件路径', trigger: 'blur' }],
        apiPath: [{ validator: validateApiPath, trigger: 'blur' }],
        methods: [{ validator: validateMethods, trigger: 'change' }],
        category: [{ required: true, message: '请选择操作分类', trigger: 'change' }],
        resource: [
          { required: true, message: '请输入资源标识', trigger: 'blur' },
          { pattern: /^[a-z_]+$/, message: '资源标识只能包含小写字母和下划线', trigger: 'blur' }
        ]
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
      if (!this.isCreate) return false;
      if (!this.parentNode) return true;
      return this.parentNode.type === 'folder';
    },
    canCreateMenu() {
      if (!this.isCreate) return false;
      if (!this.parentNode) return false;
      return this.parentNode.type === 'folder';
    },
    canCreateButton() {
      if (!this.isCreate) return false;
      if (!this.parentNode) return false;
      return this.parentNode.type === 'menu';
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.initForm();
      }
    },
    'form.type'() {
      this.$nextTick(() => {
        if (this.$refs.permissionForm) {
          this.$refs.permissionForm.clearValidate();
        }
      });
    }
  },

  methods: {
    /**
     * 初始化表单
     */
    initForm() {
      // 提取所有菜单选项（用于按钮类型选择父菜单）
      this.extractMenuOptions();

      if (this.isCreate) {
        // 根据父节点类型确定默认类型
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
          type: defaultType,
          name: '',
          code: '',
          path: '',
          component: '',
          icon: '',
          sortOrder: 1,
          visible: true,
          layout: true,
          openNewTab: false,
          keepAlive: true,
          routeParams: null,
          parentId: (this.parentNode && this.parentNode.id) || null,
          apiPath: '',
          methods: [],
          category: 'WRITE',
          resource: '',
          pathParams: null,
          bodySchema: null,
          description: '',
          status: 0
        };

        this.routeParamsJson = '';
        this.pathParamsJson = '';
        this.bodySchemaJson = '';

        // 如果有父节点，生成默认的权限码前缀
        if (this.parentNode) {
          this.generateCode();
        }
      } else if (this.node) {
        this.form = { ...this.node };

        // 将对象转换为 JSON 字符串显示
        if (this.form.routeParams && typeof this.form.routeParams === 'object') {
          this.routeParamsJson = JSON.stringify(this.form.routeParams, null, 2);
        }
        if (this.form.pathParams && typeof this.form.pathParams === 'object') {
          this.pathParamsJson = JSON.stringify(this.form.pathParams, null, 2);
        }
        if (this.form.bodySchema && typeof this.form.bodySchema === 'object') {
          this.bodySchemaJson = JSON.stringify(this.form.bodySchema, null, 2);
        }
      }
    },

    /**
     * 提取所有菜单类型的节点作为选项
     */
    extractMenuOptions() {
      const menus = [];
      const extract = (nodes) => {
        nodes.forEach(node => {
          if (node.type === 'menu') {
            menus.push(node);
          }
          if (node.children && node.children.length > 0) {
            extract(node.children);
          }
        });
      };
      extract(this.permissionTree);
      this.menuOptions = menus;
    },

    /**
     * 权限类型变更
     */
    handleTypeChange() {
      if (this.isCreate) {
        this.generateCode();
      }
    },

    /**
     * 路径输入变更
     */
    handlePathInput() {
      if (this.isCreate) {
        this.generateCode();
      }
    },

    /**
     * 生成权限码
     */
    generateCode() {
      if (!this.isCreate) return;

      const path = this.form.path;

      if (!path) {
        return;
      }

      // 将路由路径转换为蛇形命名
      let code = kebabToSnake(path); // system/user-management -> system/user_management
      code = code.replace(/\//g, ':'); // system:user_management

      switch (this.form.type) {
        case 'folder':
          // 文件夹：保持原样
          break;
        case 'menu':
          // 页面：添加 :view 后缀
          code += ':view';
          break;
        case 'button':
          // 按钮：需要基于父页面
          if (this.parentNode && this.parentNode.code) {
            const parentCode = this.parentNode.code;
            // 如果父页面是 menu 类型，替换 :view 为默认操作
            if (parentCode.endsWith(':view')) {
              code = parentCode.replace(':view', ':create');
            } else {
              code = parentCode + ':create';
            }
          } else {
            code = '';
          }
          break;
      }

      this.form.code = code;

      // 自动生成资源名（按钮类型）
      if (this.form.type === 'button' && path && !this.form.resource) {
        const segments = path.split('/').filter(s => s);
        const lastSegment = segments[segments.length - 1];
        this.form.resource = toSnakeCase(lastSegment);
      }
    },

    /**
     * 解析路由参数
     */
    parseRouteParams() {
      if (!this.routeParamsJson.trim()) {
        this.form.routeParams = null;
        return;
      }
      try {
        this.form.routeParams = JSON.parse(this.routeParamsJson);
      } catch (e) {
        this.$message.error('路由参数 JSON 格式错误');
        this.routeParamsJson = this.form.routeParams ? JSON.stringify(this.form.routeParams, null, 2) : '';
      }
    },

    /**
     * 解析路径参数
     */
    parsePathParams() {
      if (!this.pathParamsJson.trim()) {
        this.form.pathParams = null;
        return;
      }
      try {
        this.form.pathParams = JSON.parse(this.pathParamsJson);
      } catch (e) {
        this.$message.error('路径参数 JSON 格式错误');
        this.pathParamsJson = this.form.pathParams ? JSON.stringify(this.form.pathParams, null, 2) : '';
      }
    },

    /**
     * 解析请求体验证
     */
    parseBodySchema() {
      if (!this.bodySchemaJson.trim()) {
        this.form.bodySchema = null;
        return;
      }
      try {
        this.form.bodySchema = JSON.parse(this.bodySchemaJson);
      } catch (e) {
        this.$message.error('请求体验证 JSON 格式错误');
        this.bodySchemaJson = this.form.bodySchema ? JSON.stringify(this.form.bodySchema, null, 2) : '';
      }
    },

    /**
     * 获取类型标签
     */
    getTypeLabel(type) {
      const labels = {
        folder: '文件夹',
        menu: '页面',
        button: '按钮'
      };
      return labels[type] || type;
    },

    /**
     * 提交表单
     */
    handleSubmit() {
      this.$refs.permissionForm.validate(async (valid) => {
        if (!valid) return;

        // 验证 JSON 字段
        if (this.form.type === 'menu' && this.routeParamsJson) {
          try {
            this.form.routeParams = JSON.parse(this.routeParamsJson);
          } catch (e) {
            this.$message.error('路由参数 JSON 格式错误');
            return;
          }
        }

        if (this.form.type === 'button') {
          if (this.pathParamsJson) {
            try {
              this.form.pathParams = JSON.parse(this.pathParamsJson);
            } catch (e) {
              this.$message.error('路径参数 JSON 格式错误');
              return;
            }
          }
          if (this.bodySchemaJson) {
            try {
              this.form.bodySchema = JSON.parse(this.bodySchemaJson);
            } catch (e) {
              this.$message.error('请求体验证 JSON 格式错误');
              return;
            }
          }

          // 自动设置 category
          if (!this.form.category && this.form.methods && this.form.methods.length > 0) {
            if (this.form.methods.includes('GET')) {
              this.form.category = 'READ';
            } else if (this.form.methods.includes('DELETE')) {
              this.form.category = 'DELETE';
            } else {
              this.form.category = 'WRITE';
            }
          }
        }

        this.loading = true;
        try {
          const submitData = { ...this.form };
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

    /**
     * 关闭对话框
     */
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

.el-divider {
  margin: 15px 0;
}

.el-checkbox {
  margin-right: 15px;
}
</style>
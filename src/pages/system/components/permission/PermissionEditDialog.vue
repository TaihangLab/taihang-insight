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
      <el-form-item label="权限类型" prop="permission_type">
        <el-radio-group v-model="form.permission_type" @change="handleTypeChange">
          <el-radio label="folder">
            <i class="el-icon-folder"></i> 文件夹
          </el-radio>
          <el-radio label="menu">
            <i class="el-icon-menu"></i> 页面
          </el-radio>
          <el-radio label="button">
            <i class="el-icon-document"></i> 按钮
          </el-radio>
        </el-radio-group>
        <div class="form-tip" v-if="parentNode">
          父节点：{{ parentNode.permission_name }} ({{ getTypeLabel(parentNode.permission_type) }})
        </div>
      </el-form-item>

      <!-- ============ 文件夹类型字段 ============ -->
      <template v-if="form.permission_type === 'folder'">
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="权限名称" prop="permission_name">
          <el-input v-model="form.permission_name" placeholder="如：系统管理" />
        </el-form-item>

        <el-form-item label="路由路径" prop="path">
          <el-input v-model="form.path" placeholder="如：/system-management" @input="handlePathInput" />
          <div class="form-tip">用于生成权限码，支持 kebab-case 或 camelCase，建议以 / 开头</div>
        </el-form-item>

        <el-form-item label="权限码" prop="permission_code">
          <el-input v-model="form.permission_code" placeholder="自动生成">
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

        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="1" :max="9999" />
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
      <template v-if="form.permission_type === 'menu'">
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="权限名称" prop="permission_name">
          <el-input v-model="form.permission_name" placeholder="如：用户管理" />
        </el-form-item>

        <el-form-item label="路由路径" prop="path">
          <el-input v-model="form.path" placeholder="如：/system/user-management" @input="handlePathInput" />
        </el-form-item>

        <el-form-item label="权限码" prop="permission_code">
          <el-input v-model="form.permission_code" placeholder="自动生成">
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

        <el-divider content-position="left">API 配置</el-divider>

        <el-form-item label="API 地址" prop="api_path">
          <el-input v-model="form.api_path" placeholder="/api/system/user" />
          <div class="form-tip">必须以 /api/ 开头</div>
        </el-form-item>

        <el-form-item label="请求方式" prop="methods">
          <el-radio-group v-model="form.methods">
            <el-radio label="GET">GET - 查询</el-radio>
            <el-radio label="POST">POST - 新增</el-radio>
            <el-radio label="PUT">PUT - 更新</el-radio>
            <el-radio label="PATCH">PATCH - 部分更新</el-radio>
            <el-radio label="DELETE">DELETE - 删除</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-divider content-position="left">显示设置</el-divider>

        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="el-icon-user">
            <template slot="prepend">
              <i :class="form.icon || 'el-icon-question'"></i>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="1" :max="9999" />
        </el-form-item>

        <el-form-item label="显示选项">
          <el-checkbox v-model="form.layout">需要 Layout</el-checkbox>
          <el-checkbox v-model="form.visible">在菜单中显示</el-checkbox>
          <el-checkbox v-model="form.open_new_tab">新窗口打开</el-checkbox>
          <el-checkbox v-model="form.keep_alive">页面缓存</el-checkbox>
        </el-form-item>

        <el-form-item label="路由参数" prop="route_params">
          <el-input
            v-model="route_params_json"
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
      <template v-if="form.permission_type === 'button'">
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="权限名称" prop="permission_name">
          <el-input v-model="form.permission_name" placeholder="如：新增用户" />
        </el-form-item>

        <el-form-item label="所属页面" prop="parent_menu_id">
          <el-select
            v-model="form.parent_id"
            placeholder="请选择所属页面"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="menu in menuOptions"
              :key="menu.id"
              :label="`${menu.permission_name} (${menu.permission_code})`"
              :value="menu.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="权限码" prop="permission_code">
          <el-input v-model="form.permission_code" placeholder="自动生成">
            <template slot="append">
              <el-button @click="generateCode">生成</el-button>
            </template>
          </el-input>
          <div class="form-tip">格式：system:user:create</div>
        </el-form-item>

        <el-divider content-position="left">API 配置</el-divider>

        <el-form-item label="API 地址" prop="api_path">
          <el-input v-model="form.api_path" placeholder="/api/system/user" />
          <div class="form-tip">必须以 /api/ 开头</div>
        </el-form-item>

        <el-form-item label="请求方式" prop="methods">
          <el-radio-group v-model="form.methods">
            <el-radio label="GET">GET - 查询</el-radio>
            <el-radio label="POST">POST - 新增</el-radio>
            <el-radio label="PUT">PUT - 更新</el-radio>
            <el-radio label="PATCH">PATCH - 部分更新</el-radio>
            <el-radio label="DELETE">DELETE - 删除</el-radio>
          </el-radio-group>
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
            v-model="path_params_json"
            type="textarea"
            :rows="2"
            placeholder='{"id": "number"}'
            @blur="parsePathParams"
          />
          <div class="form-tip">JSON 格式，定义路径参数类型</div>
        </el-form-item>

        <el-form-item label="请求体验证">
          <el-input
            v-model="body_schema_json"
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
      if (!value.startsWith('/')) {
        callback(new Error('路由路径必须以 / 开头'));
        return;
      }
      callback();
    };

    const validateApiPath = (rule, value, callback) => {
      if (this.form.permission_type === 'button' && !value) {
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
      if ((this.form.permission_type === 'button' || this.form.permission_type === 'menu') && this.form.api_path && !value) {
        callback(new Error('当指定了API地址时，请选择请求方式'));
        return;
      }
      callback();
    };

    return {
      form: {
        id: '',
        permission_type: 'menu',
        permission_name: '',
        permission_code: '',
        path: '',
        component: '',
        icon: '',
        sort_order: 1,
        visible: true,
        layout: true,
        open_new_tab: false,
        keep_alive: true,
        route_params: null,
        parent_menu_id: null,
        parent_id: null,
        api_path: '',
        methods: '',
        category: 'WRITE',
        resource: '',
        path_params: null,
        body_schema: null,
        description: '',
        status: 0
      },
      route_params_json: '',
      path_params_json: '',
      body_schema_json: '',
      menuOptions: [],
      rules: {
        permission_type: [{ required: true, message: '请选择权限类型', trigger: 'change' }],
        permission_name: [
          { required: true, message: '请输入权限名称', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        permission_code: [
          { required: true, message: '请输入权限码', trigger: 'blur' },
          { validator: validateCode, trigger: 'blur' }
        ],
        path: [
          { required: true, message: '请输入路由路径', trigger: 'blur' },
          { validator: validatePath, trigger: 'blur' }
        ],
        component: [{ required: true, message: '请输入组件路径', trigger: 'blur' }],
        api_path: [{ validator: validateApiPath, trigger: 'blur' }],
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
      return `编辑权限 - ${(this.node && this.node.permission_name) || ''}`;
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.initForm();
      }
    },
    'form.permission_type'() {
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
        // 根据父节点类型确定默认类型，如果没有父节点则默认为 folder
        let defaultType = 'folder';
        if (this.parentNode) {
          if (this.parentNode.permission_type === 'folder') {
            defaultType = 'menu';
          } else if (this.parentNode.permission_type === 'menu') {
            defaultType = 'button';
          }
        }

        this.form = {
          id: '',
          permission_type: defaultType,
          permission_name: '',
          permission_code: '',
          path: '',
          component: '',
          icon: '',
          sort_order: 1,
          visible: true,
          layout: true,
          open_new_tab: false,
          keep_alive: true,
          route_params: null,
          parent_id: (this.parentNode && this.parentNode.id) || null,
          api_path: '',
          methods: '',
          category: 'WRITE',
          resource: '',
          path_params: null,
          body_schema: null,
          description: '',
          status: 0
        };

        this.route_params_json = '';
        this.path_params_json = '';
        this.body_schema_json = '';

        // 如果有父节点，生成默认的权限码前缀
        if (this.parentNode) {
          this.generateCode();
        }
      } else if (this.node) {
        // 编辑模式：需要处理字段名映射和默认值
        this.form = {
          id: this.node.id || '',
          permission_type: this.node.permission_type || this.node.type || 'menu',
          permission_name: this.node.permission_name || this.node.name || '',
          permission_code: this.node.permission_code || this.node.code || '',
          path: this.node.path || '',
          component: this.node.component || '',
          icon: this.node.icon || '',
          sort_order: this.node.sort_order || this.node.sortOrder || 1,
          visible: this.node.visible !== undefined ? this.node.visible : true,
          layout: this.node.layout !== undefined ? this.node.layout : true,
          open_new_tab: this.node.open_new_tab !== undefined ? this.node.open_new_tab : false,
          keep_alive: this.node.keep_alive !== undefined ? this.node.keep_alive : true,
          route_params: this.node.route_params || null,
          parent_id: this.node.parent_id || this.node.parentId || null,
          api_path: this.node.api_path || '',
          methods: this.parseMethodsForForm(this.node.methods),
          category: this.node.category || 'WRITE',
          resource: this.node.resource || '',
          path_params: this.node.path_params || null,
          body_schema: this.node.body_schema || null,
          description: this.node.description || '',
          status: this.node.status !== undefined ? this.node.status : 0
        };

        // 在编辑模式下，也需要确保路径以 / 开头
        if (this.form.path && !this.form.path.startsWith('/')) {
          this.form.path = '/' + this.form.path;
        }

        // 将对象转换为 JSON 字符串显示
        if (this.form.route_params && typeof this.form.route_params === 'object') {
          this.route_params_json = JSON.stringify(this.form.route_params, null, 2);
        }
        if (this.form.path_params && typeof this.form.path_params === 'object') {
          this.path_params_json = JSON.stringify(this.form.path_params, null, 2);
        }
        if (this.form.body_schema && typeof this.form.body_schema === 'object') {
          this.body_schema_json = JSON.stringify(this.form.body_schema, null, 2);
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
          if (node.permission_type === 'menu') {
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
      this.generateCode();
    },

    /**
     * 路径输入变更
     */
    handlePathInput() {
      // 确保路径以 / 开头
      if (this.form.path && !this.form.path.startsWith('/')) {
        this.form.path = '/' + this.form.path;
      }
      // 在编辑模式下也需要重新生成权限码
      if (this.isCreate || this.form.permission_type === 'folder' || this.form.permission_type === 'menu') {
        this.generateCode();
      }
    },

    /**
     * 生成权限码
     */
    generateCode() {
      let path = this.form.path;

      // 如果是按钮类型且没有路径，尝试从父节点获取路径信息
      if (this.form.permission_type === 'button' && !path && this.parentNode && this.parentNode.path) {
        path = this.parentNode.path;
      }

      if (!path) {
        return;
      }

      // 移除路径开头的斜杠，便于后续处理
      let cleanPath = path.startsWith('/') ? path.substring(1) : path;

      // 将路由路径转换为蛇形命名
      let permission_code = kebabToSnake(cleanPath); // system/user-management -> system/user_management
      permission_code = permission_code.replace(/\//g, ':'); // system:user_management

      switch (this.form.permission_type) {
        case 'folder':
          // 文件夹：保持原样
          break;
        case 'menu':
          // 页面：添加 :view 后缀
          permission_code += ':view';
          break;
        case 'button':
          // 按钮：需要基于父页面
          if (this.parentNode && this.parentNode.permission_code) {
            const parentCode = this.parentNode.permission_code;
            // 如果父页面是 menu 类型，替换 :view 为默认操作
            if (parentCode.endsWith(':view')) {
              permission_code = parentCode.replace(':view', ':create');
            } else {
              permission_code = parentCode + ':create';
            }
          } else {
            permission_code = '';
          }
          break;
      }

      this.form.permission_code = permission_code;

      // 自动生成资源名（按钮类型）
      if (this.form.permission_type === 'button' && path && !this.form.resource) {
        const segments = cleanPath.split('/').filter(s => s);
        const lastSegment = segments[segments.length - 1];
        this.form.resource = toSnakeCase(lastSegment);
      }
    },

    /**
     * 解析路由参数
     */
    parseRouteParams() {
      if (!this.route_params_json.trim()) {
        this.form.route_params = null;
        return;
      }
      try {
        this.form.route_params = JSON.parse(this.route_params_json);
      } catch (e) {
        this.$message.error('路由参数 JSON 格式错误');
        this.route_params_json = this.form.route_params ? JSON.stringify(this.form.route_params, null, 2) : '';
      }
    },

    /**
     * 解析路径参数
     */
    parsePathParams() {
      if (!this.path_params_json.trim()) {
        this.form.path_params = null;
        return;
      }
      try {
        this.form.path_params = JSON.parse(this.path_params_json);
      } catch (e) {
        this.$message.error('路径参数 JSON 格式错误');
        this.path_params_json = this.form.path_params ? JSON.stringify(this.form.path_params, null, 2) : '';
      }
    },

    /**
     * 解析请求体验证
     */
    parseBodySchema() {
      if (!this.body_schema_json.trim()) {
        this.form.body_schema = null;
        return;
      }
      try {
        this.form.body_schema = JSON.parse(this.body_schema_json);
      } catch (e) {
        this.$message.error('请求体验证 JSON 格式错误');
        this.body_schema_json = this.form.body_schema ? JSON.stringify(this.form.body_schema, null, 2) : '';
      }
    },

    /**
     * 获取类型标签
     */
    getTypeLabel(permission_type) {
      const labels = {
        folder: '文件夹',
        menu: '页面',
        button: '按钮'
      };
      return labels[permission_type] || permission_type;
    },

    /**
     * 提交表单
     */
    handleSubmit() {
      this.$refs.permissionForm.validate(async (valid) => {
        if (!valid) return;

        // 验证 JSON 字段
        if (this.form.permission_type === 'menu' && this.route_params_json) {
          try {
            this.form.route_params = JSON.parse(this.route_params_json);
          } catch (e) {
            this.$message.error('路由参数 JSON 格式错误');
            return;
          }
        }

        if (this.form.permission_type === 'button') {
          if (this.path_params_json) {
            try {
              this.form.path_params = JSON.parse(this.path_params_json);
            } catch (e) {
              this.$message.error('路径参数 JSON 格式错误');
              return;
            }
          }
          if (this.body_schema_json) {
            try {
              this.form.body_schema = JSON.parse(this.body_schema_json);
            } catch (e) {
              this.$message.error('请求体验证 JSON 格式错误');
              return;
            }
          }

          // 自动设置 category
          if (!this.form.category && this.form.methods) {
            if (this.form.methods === 'GET') {
              this.form.category = 'READ';
            } else if (this.form.methods === 'DELETE') {
              this.form.category = 'DELETE';
            } else {
              this.form.category = 'WRITE';
            }
          }
        }

        // 确保路径字段被正确设置，特别是对于按钮类型权限
        if (this.form.permission_type === 'button' && !this.form.path && this.parentNode && this.parentNode.path) {
          this.form.path = this.parentNode.path;
        }

        // 确保路径以 / 开头
        if (this.form.path && !this.form.path.startsWith('/')) {
          this.form.path = '/' + this.form.path;
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
     * 解析methods字段用于表单显示
     */
    parseMethodsForForm(methods) {
      if (!methods) return '';
      // methods 现在只支持单个字符串
      return methods;
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
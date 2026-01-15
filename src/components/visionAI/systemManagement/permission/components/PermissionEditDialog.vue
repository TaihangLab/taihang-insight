<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="visible"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="form" :rules="rules" ref="permissionForm" label-width="100px">
      <!-- 权限类型选择（仅新增时显示） -->
      <el-form-item label="权限类型" prop="type" v-if="isCreate">
        <el-select
          v-model="form.type"
          placeholder="请选择权限类型"
          style="width: 100%"
          @change="handleTypeChange"
        >
          <el-option
            v-for="option in availableTypes"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <div class="form-tip" v-if="parentNode">
          父节点：{{ parentNode.name }} ({{ getTypeLabel(parentNode.type) }})
        </div>
      </el-form-item>

      <!-- 基本信息 -->
      <el-form-item label="权限名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入权限名称" />
      </el-form-item>

      <el-form-item label="权限描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入权限描述"
        />
      </el-form-item>

      <!-- 权限码（可编辑） -->
      <el-form-item label="权限码" prop="code">
        <el-input v-model="form.code" placeholder="自动生成或手动输入" />
        <div class="form-tip">
          <el-button type="text" size="small" @click="generateCode">
            <i class="el-icon-magic-stick"></i> 自动生成权限码
          </el-button>
        </div>
      </el-form-item>

      <!-- 菜单相关字段（folder 和 menu） -->
      <template v-if="form.type === 'folder' || form.type === 'menu'">
        <el-form-item label="路由路径" prop="path">
          <el-input v-model="form.path" placeholder="如：/systemManage/userManagement" />
          <div class="form-tip" v-if="form.type === 'menu'">
            用于页面路由配置
          </div>
        </el-form-item>

        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="如：el-icon-user">
            <template slot="prepend">
              <i :class="form.icon || 'el-icon-question'"></i>
            </template>
          </el-input>
          <div class="form-tip">
            Element UI 图标类名
          </div>
        </el-form-item>

        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="1" :max="9999" />
        </el-form-item>

        <!-- 仅 menu 类型显示 visible 字段 -->
        <el-form-item label="菜单显示" prop="visible" v-if="form.type === 'menu'">
          <el-switch v-model="form.visible" />
          <div class="form-tip">
            关闭后该菜单不在侧边栏显示
          </div>
        </el-form-item>
      </template>

      <!-- 按钮相关字段（button） -->
      <template v-if="form.type === 'button'">
        <el-form-item label="操作分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择操作分类" style="width: 100%">
            <el-option label="读取（READ）" value="READ" />
            <el-option label="写入（WRITE）" value="WRITE" />
            <el-option label="删除（DELETE）" value="DELETE" />
            <el-option label="特殊（SPECIAL）" value="SPECIAL" />
          </el-select>
        </el-form-item>

        <el-form-item label="资源" prop="resource">
          <el-input v-model="form.resource" placeholder="如：user, role, permission" />
        </el-form-item>

        <el-form-item label="操作" prop="action">
          <el-select v-model="form.action" placeholder="请选择操作" style="width: 100%">
            <el-option label="查看（read）" value="read" />
            <el-option label="创建（create）" value="create" />
            <el-option label="更新（update）" value="update" />
            <el-option label="删除（delete）" value="delete" />
            <el-option label="导出（export）" value="export" />
            <el-option label="导入（import）" value="import" />
            <el-option label="启用（enable）" value="enable" />
            <el-option label="禁用（disable）" value="disable" />
            <el-option label="重置密码（reset_password）" value="reset_password" />
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
import PermissionCodeGenerator from '@/utils/permissionCodeGenerator';

export default {
  name: 'PermissionEditDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    mode: {
      type: String,
      default: 'create', // create | edit
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
      form: {
        id: '',
        code: '',
        name: '',
        description: '',
        type: 'menu',
        parentId: null,
        path: '',
        icon: '',
        visible: true,
        sortOrder: 1,
        category: 'READ',
        resource: '',
        action: '',
        status: 0
      },
      rules: {
        type: [{ required: true, message: '请选择权限类型', trigger: 'change' }],
        name: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
        code: [{ required: true, message: '请输入权限码', trigger: 'blur' }],
        path: [{ required: true, message: '请输入路由路径', trigger: 'blur' }],
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
      return `编辑权限 - ${this.node?.name || ''}`;
    },
    // 根据父节点类型确定可创建的子节点类型
    availableTypes() {
      if (!this.parentNode) {
        // 没有父节点，只能创建文件夹
        return [
          { label: '文件夹（Folder）', value: 'folder' }
        ];
      }

      switch (this.parentNode.type) {
        case 'folder':
          // 文件夹下可以创建文件夹或页面
          return [
            { label: '文件夹（Folder）', value: 'folder' },
            { label: '页面（Menu）', value: 'menu' }
          ];
        case 'menu':
          // 页面下只能创建按钮
          return [
            { label: '按钮（Button）', value: 'button' }
          ];
        default:
          return [];
      }
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
        // 新增模式
        this.form = {
          id: '',
          code: '',
          name: '',
          description: '',
          type: this.availableTypes[0]?.value || 'menu',
          parentId: this.parentNode?.id || null,
          path: '',
          icon: '',
          visible: true,
          sortOrder: 1,
          category: 'READ',
          resource: '',
          action: '',
          status: 0
        };
        // 自动生成权限码
        this.$nextTick(() => {
          this.generateCode();
        });
      } else if (this.node) {
        // 编辑模式
        this.form = { ...this.node };
      }
    },

    handleTypeChange() {
      // 类型改变时重新生成权限码
      this.generateCode();
    },

    generateCode() {
      if (!this.isCreate) return;

      let code = '';
      const parentCode = this.parentNode?.code || '';

      switch (this.form.type) {
        case 'folder':
          // 文件夹：基于路径生成
          if (this.form.path) {
            code = PermissionCodeGenerator.generateFromRoute(
              this.form.path,
              'folder',
              null,
              parentCode
            );
          }
          break;

        case 'menu':
          // 页面：基于路径生成
          if (this.form.path) {
            code = PermissionCodeGenerator.generateFromRoute(
              this.form.path,
              'menu',
              'view',
              parentCode
            );
          }
          break;

        case 'button':
          // 按钮：基于父节点和操作生成
          if (parentCode && this.form.action) {
            code = PermissionCodeGenerator.generateFromRoute(
              null,
              'button',
              this.form.action,
              parentCode
            );
          }
          break;
      }

      this.form.code = code;
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

          // 按钮类型需要设置 category
          if (submitData.type === 'button') {
            // 根据 action 自动推断 category
            if (!submitData.category) {
              const action = submitData.action;
              if (['read'].includes(action)) {
                submitData.category = 'READ';
              } else if (['create', 'update', 'import'].includes(action)) {
                submitData.category = 'WRITE';
              } else if (['delete'].includes(action)) {
                submitData.category = 'DELETE';
              } else {
                submitData.category = 'SPECIAL';
              }
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
      this.$refs.permissionForm?.resetFields();
    }
  }
};
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.dialog-footer {
  text-align: right;
}
</style>

<template>
  <div class="smart-fill-assistant" :style="{ right: isOpen ? '20px' : '-300px' }">
    <div class="toggle-button" @click="toggleAssistant">
      <i class="el-icon-magic-stick"></i>
      <span v-if="isOpen">智能填充</span>
    </div>
    <div v-if="isOpen" class="assistant-content">
      <h3>智能填充助手</h3>

      <div class="fill-options">
        <div class="option-group">
          <h4>当前页面</h4>
          <el-button
            v-for="(option, key) in getPageOptions()"
            :key="key"
            size="mini"
            @click="fillPage(option.data, option.target)"
            class="fill-btn"
          >
            {{ option.label }}
          </el-button>
        </div>

        <div class="option-group">
          <h4>通用数据</h4>
          <el-button size="mini" @click="fillRandomData" class="fill-btn">随机数据</el-button>
          <el-button size="mini" @click="clearForm" class="fill-btn">清空表单</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import mockData from '@/mock';
import mockService from '@/mock/service';

export default {
  name: 'SmartFillAssistant',
  props: {
    // 当前页面标识
    currentPage: {
      type: String,
      required: true
    },
    // 表单引用
    formRef: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      isOpen: false,
      isEnabled: import.meta.env.VITE_MOCK_ENABLED ? import.meta.env.VITE_MOCK_ENABLED === 'true' : true
    }
  },
  methods: {
    toggleAssistant() {
      this.isOpen = !this.isOpen;
    },

    getPageOptions() {
      const options = {};

      switch(this.currentPage) {
        case 'tenant':
          options.fillTenantForm = {
            label: '填充租户信息',
            data: mockData.tenant.tenantManagement(),
            target: 'tenantForm'
          };
          break;

        case 'user':
          options.fillUserForm = {
            label: '填充用户信息',
            data: mockData.user.userManagement(),
            target: 'userForm'
          };
          break;

        case 'role':
          options.fillRoleForm = {
            label: '填充角色信息',
            data: mockData.role.roleManagement(),
            target: 'roleForm'
          };
          break;

        // 可以在这里添加更多页面的选项
        default:
          console.warn(`未找到页面 ${this.currentPage} 的填充选项`);
      }

      return options;
    },

    fillPage(data, target) {
      if (!this.formRef) {
        console.error('未传入有效的表单引用');
        return;
      }

      // 根据目标表单填充数据
      switch(target) {
        case 'tenantForm':
          if (this.formRef.tenantForm) {
            Object.keys(data).forEach(key => {
              if (this.formRef.tenantForm.hasOwnProperty(key)) {
                this.$set(this.formRef.tenantForm, key, data[key]);
              }
            });
          }
          break;

        case 'userForm':
          if (this.formRef.userForm) {
            Object.keys(data).forEach(key => {
              if (this.formRef.userForm.hasOwnProperty(key)) {
                this.$set(this.formRef.userForm, key, data[key]);
              }
            });
          }
          break;

        case 'roleForm':
          if (this.formRef.roleForm) {
            Object.keys(data).forEach(key => {
              if (this.formRef.roleForm.hasOwnProperty(key)) {
                this.$set(this.formRef.roleForm, key, data[key]);
              }
            });
          }
          break;

        default:
          console.warn(`未识别的目标表单: ${target}`);
      }

      this.$message.success('已填充测试数据');
    },

    fillRandomData() {
      if (!this.formRef) {
        console.error('未传入有效的表单引用');
        return;
      }

      // 检测当前可用的表单并填充随机数据
      if (this.formRef.tenantForm) {
        this.fillRandomDataForForm(this.formRef.tenantForm);
      } else if (this.formRef.userForm) {
        this.fillRandomDataForForm(this.formRef.userForm);
      } else if (this.formRef.roleForm) {
        this.fillRandomDataForForm(this.formRef.roleForm);
      }

      this.$message.success('已填充随机数据');
    },

    fillRandomDataForForm(form) {
      Object.keys(form).forEach(key => {
        if (typeof form[key] === 'string') {
          this.$set(form, key, `测试数据-${key}-${Math.floor(Math.random() * 10000)}`);
        } else if (typeof form[key] === 'number') {
          this.$set(form, key, Math.floor(Math.random() * 1000));
        } else if (typeof form[key] === 'boolean') {
          this.$set(form, key, Math.random() > 0.5);
        } else if (Array.isArray(form[key])) {
          this.$set(form, key, [Math.floor(Math.random() * 10)]);
        } else if (form[key] instanceof Date) {
          this.$set(form, key, new Date());
        } else if (typeof form[key] === 'object' && form[key] !== null) {
          this.$set(form, key, { test: 'test' });
        }
      });
    },

    clearForm() {
      if (!this.formRef) {
        console.error('未传入有效的表单引用');
        return;
      }

      // 检测当前可用的表单并清空
      if (this.formRef.tenantForm) {
        this.clearFormData(this.formRef.tenantForm);
      } else if (this.formRef.userForm) {
        this.clearFormData(this.formRef.userForm);
      } else if (this.formRef.roleForm) {
        this.clearFormData(this.formRef.roleForm);
      }

      this.$message.info('表单已清空');
    },

    clearFormData(form) {
      Object.keys(form).forEach(key => {
        if (typeof form[key] === 'string') {
          this.$set(form, key, '');
        } else if (typeof form[key] === 'number') {
          this.$set(form, key, 0);
        } else if (typeof form[key] === 'boolean') {
          this.$set(form, key, false);
        } else if (Array.isArray(form[key])) {
          this.$set(form, key, []);
        } else if (form[key] instanceof Date) {
          this.$set(form, key, null);
        } else if (typeof form[key] === 'object' && form[key] !== null) {
          this.$set(form, key, {});
        }
      });
    }
  }
}
</script>

<style scoped>
.smart-fill-assistant {
  position: fixed;
  top: 20%;
  right: 20px;
  z-index: 9999;
  transition: right 0.3s ease;
  background: white;
  border-radius: 20px 0 0 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: auto;
  min-width: 60px;
}

.toggle-button {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  background: #409EFF;
  color: white;
  border-radius: 20px 0 0 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.toggle-button i {
  margin-right: 5px;
}

.assistant-content {
  width: 280px;
  padding: 15px;
  background: white;
  border-radius: 0 0 0 10px;
  max-height: 400px;
  overflow-y: auto;
}

.assistant-content h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
  text-align: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.option-group {
  margin-bottom: 20px;
}

.option-group h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #606266;
}

.fill-btn {
  display: block;
  width: 100%;
  margin-bottom: 8px;
  background: #f5f7fa;
  border-color: #e4e7ed;
  color: #606266;
}

.fill-btn:hover {
  background: #ecf5ff;
  border-color: #b3d8ff;
  color: #409EFF;
}
</style>
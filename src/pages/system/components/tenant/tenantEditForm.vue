<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="dialogVisible"
    width="700px"
    @close="closeDialog"
  >
    <!-- 智能填充助手 -->
    <div style="position: relative; z-index: 9999; margin-bottom: 20px;">
      <SmartFillAssistant
        currentPage="tenant"
        :form-ref="dialogVisible ? { tenantForm: this.tenantForm } : null"
        v-if="dialogVisible"
      />
      <!-- 测试按钮 -->
      <el-button
        type="primary"
        size="small"
        @click="testSmartFill"
        style="margin-bottom: 10px;"
      >
        测试智能填充
      </el-button>
    </div>

    <el-form :model="tenantForm" :rules="tenantRules" ref="tenantForm" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="租户名称" prop="tenant_name" required>
            <el-input v-model="tenantForm.tenant_name" placeholder="请输入租户名称"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="企业名称" prop="company_name" required>
            <el-input v-model="tenantForm.company_name" placeholder="请输入企业名称"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="联系人" prop="contact_person" required>
            <el-input v-model="tenantForm.contact_person" placeholder="请输入联系人"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话" prop="contact_phone" required>
            <el-input v-model="tenantForm.contact_phone" placeholder="请输入联系电话"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户名" prop="username" required>
            <el-input v-model="tenantForm.username" placeholder="请输入系统用户名"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="用户密码" :prop="currentTenant ? '' : 'password'" :required="!currentTenant">
            <el-input
              v-model="tenantForm.password"
              :placeholder="currentTenant ? '留空则不修改密码' : '请输入系统用户密码'"
              type="password"
              show-password
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="租户套餐">
            <el-select v-model="tenantForm.package" placeholder="请选择租户套餐" style="width: 100%">
              <el-option label="基础版" value="basic"></el-option>
              <el-option label="标准版" value="standard"></el-option>
              <el-option label="高级版" value="premium"></el-option>
              <el-option label="企业版" value="enterprise"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="过期时间">
            <el-date-picker
              v-model="tenantForm.expire_time"
              type="date"
              placeholder="请选择过期时间"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              style="width: 100%"
              :picker-options="pickerOptions"
            ></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户数量">
            <el-input v-model.number="tenantForm.userCount" placeholder="0" type="number"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="绑定域名">
            <el-input v-model="tenantForm.domain" placeholder="请输入绑定域名"></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="企业地址">
        <el-input v-model="tenantForm.address" placeholder="请输入企业地址"></el-input>
      </el-form-item>
      <el-form-item label="企业代码">
        <el-input v-model="tenantForm.companyCode" placeholder="请输入统一社会信用代码"></el-input>
      </el-form-item>
      <el-form-item label="企业简介">
        <el-input
          v-model="tenantForm.description"
          type="textarea"
          :rows="3"
          placeholder="请输入企业简介"
        ></el-input>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="tenantForm.remark" placeholder="请输入备注"></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="submitForm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import RBACService from '@/components/service/RBACService';
import SmartFillAssistant from '@/mock/components/SmartFillAssistant.vue';

export default {
  name: 'TenantEditForm',
  components: {
    SmartFillAssistant
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    currentTenant: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      pickerOptions: {
        disabledDate: (time) => {
          // 禁止选择过去的日期
          return time.getTime() < Date.now() - 86400000;
        }
      },
      tenantForm: {
        tenant_id: '',
        tenant_name: '',
        company_name: '',
        contact_person: '',
        contact_phone: '',
        username: '',
        password: '',
        package: 'standard', // 默认选择标准版
        expire_time: this.getDefaultExpireTime(), // 设置默认过期时间为一年后
        userCount: 10, // 默认用户数量
        domain: '',
        address: '',
        companyCode: '',
        description: '',
        remark: ''
      },
      tenantRules: {
        tenant_id: [
          { required: true, message: '请输入租户编码', trigger: 'blur' },
          { pattern: /^[a-zA-Z0-9_-]+$/, message: '租户编码只能包含字母、数字、下划线和横线', trigger: 'blur' }
        ],
        tenant_name: [
          { required: true, message: '请输入租户名称', trigger: 'blur' }
        ],
        company_name: [
          { required: true, message: '请输入企业名称', trigger: 'blur' }
        ],
        contact_person: [
          { required: true, message: '请输入联系人', trigger: 'blur' }
        ],
        contact_phone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
        ],
        username: [
          { required: true, message: '请输入系统用户名', trigger: 'blur' }
        ],
        password: [
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible;
      },
      set(value) {
        this.$emit('update:visible', value);
      }
    },
    dialogTitle() {
      return this.currentTenant ? '编辑租户' : '添加租户';
    }
  },
  watch: {
    currentTenant: {
      handler(newVal) {
        if (newVal) {
          this.tenantForm = {
            tenant_id: newVal.tenant_id || newVal.id || '',
            tenant_name: newVal.tenant_name || '',
            company_name: newVal.company_name || '',
            contact_person: newVal.contact_person || '',
            contact_phone: newVal.contact_phone || '',
            username: newVal.username || '',
            password: '', // 编辑时不预填充密码
            package: newVal.package || 'standard',
            expire_time: newVal.expire_time || newVal.expireTime || null,
            userCount: newVal.user_count || newVal.userCount || 10,
            domain: newVal.domain || '',
            address: newVal.address || '',
            companyCode: newVal.company_code || newVal.companyCode || '',
            description: newVal.description || '',
            remark: newVal.remark || ''
          };
        } else {
          // 新增租户时，设置默认值
          this.resetForm();
          this.$nextTick(() => {
            this.tenantForm.package = 'standard'; // 默认选择标准版
            this.tenantForm.expire_time = this.getDefaultExpireTime(); // 设置默认过期时间为一年后
            this.tenantForm.userCount = 10; // 默认用户数量
          });
        }
      },
      immediate: true
    }
  },
  methods: {
    resetForm() {
      this.tenantForm = {
        tenant_id: '',
        tenant_name: '',
        company_name: '',
        contact_person: '',
        contact_phone: '',
        username: '',
        password: '',
        package: 'standard', // 默认选择标准版
        expire_time: this.getDefaultExpireTime(), // 设置默认过期时间为一年后
        userCount: 10, // 默认用户数量
        domain: '',
        address: '',
        companyCode: '',
        description: '',
        remark: ''
      };
    },

    async submitForm() {
      // 验证表单
      this.$refs.tenantForm.validate(async (valid) => {
        if (valid) {
          try {
            if (this.currentTenant) {
              // 编辑租户
              const updateData = {
                tenant_name: this.tenantForm.tenant_name,
                company_name: this.tenantForm.company_name,
                contact_person: this.tenantForm.contact_person,
                contact_phone: this.tenantForm.contact_phone,
                username: this.tenantForm.username,
                package: this.tenantForm.package,
                expire_time: this.tenantForm.expire_time || null,
                user_count: this.tenantForm.userCount || 0,
                domain: this.tenantForm.domain,
                address: this.tenantForm.address,
                company_code: this.tenantForm.companyCode,
                description: this.tenantForm.description,
                remark: this.tenantForm.remark
              };

              // 如果密码不为空，则包含密码字段
              if (this.tenantForm.password) {
                updateData.password = this.tenantForm.password;
              }

              // 确保tenant_id存在且有效
              const tenantId = this.currentTenant.tenant_id || this.currentTenant.id;
              if (!tenantId) {
                throw new Error('租户ID不能为空');
              }
              await RBACService.updateTenant(tenantId, updateData);
              this.$message({
                message: '租户信息修改成功',
                type: 'success'
              });
            } else {
              // 新增租户
              const createData = {
                tenant_id: this.tenantForm.tenant_id,
                tenant_name: this.tenantForm.tenant_name,
                company_name: this.tenantForm.company_name,
                contact_person: this.tenantForm.contact_person,
                contact_phone: this.tenantForm.contact_phone,
                username: this.tenantForm.username,
                password: this.tenantForm.password,
                package: this.tenantForm.package,
                expire_time: this.tenantForm.expire_time || null,
                user_count: this.tenantForm.userCount || 0,
                domain: this.tenantForm.domain,
                address: this.tenantForm.address,
                company_code: this.tenantForm.companyCode,
                description: this.tenantForm.description,
                remark: this.tenantForm.remark
              };

              await RBACService.createTenant(createData);
              this.$message({
                message: '租户添加成功',
                type: 'success'
              });
            }

            this.$emit('saved');
            this.closeDialog();
          } catch (error) {
            console.error('保存租户失败:', error);

            // 检查错误响应格式，如果是后端返回的特定格式，则提取其中的message
            let errorMessage = '未知错误';
            if (error.response && error.response.data) {
              const errorData = error.response.data;
              if (errorData && typeof errorData === 'object' && errorData.message) {
                errorMessage = errorData.message;
              } else if (typeof errorData === 'string') {
                errorMessage = errorData;
              }
            } else if (error.message) {
              errorMessage = error.message;
            }

            // 使用通知组件在右上角显示错误信息，这样会更显眼
            this.$notify({
              title: '保存失败',
              message: errorMessage,
              type: 'error',
              duration: 5000,
              offset: 50
            });
          }
        }
      });
    },

    closeDialog() {
      this.$emit('update:visible', false);
      this.$nextTick(() => {
        if (this.$refs.tenantForm) {
          this.$refs.tenantForm.clearValidate();
        }
      });
    },

    cancel() {
      this.closeDialog();
    },

    getDefaultExpireTime() {
      // 返回一年后的日期
      const now = new Date();
      const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      return oneYearLater.toISOString().split('T')[0]; // 转换为 'YYYY-MM-DD' 格式
    },

    // 测试智能填充功能
    testSmartFill() {
      try {
        // 直接填充测试数据
        const testData = {
          tenant_id: 'TEST' + Math.floor(Math.random() * 10000),
          tenant_name: '测试租户' + Math.floor(Math.random() * 1000),
          company_name: '测试公司' + Math.floor(Math.random() * 1000),
          contact_person: '张三',
          contact_phone: '138' + Math.floor(100000000 + Math.random() * 900000000).toString().substring(0, 8),
          username: 'testuser' + Math.floor(Math.random() * 1000),
          password: 'TestPass123!',
          package: ['basic', 'standard', 'premium', 'enterprise'][Math.floor(Math.random() * 4)],
          expire_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          userCount: Math.floor(Math.random() * 100),
          domain: 'test' + Math.floor(Math.random() * 1000) + '.com',
          address: '北京市朝阳区测试街道' + Math.floor(Math.random() * 1000) + '号',
          companyCode: '91' + Math.random().toString().substring(2, 16),
          description: '这是一个测试公司的简介',
          remark: '测试备注信息'
        };

        // 填充表单数据
        Object.keys(testData).forEach(key => {
          if (this.tenantForm.hasOwnProperty(key)) {
            this.$set(this.tenantForm, key, testData[key]);
          }
        });

        this.$message({
          message: '智能填充测试成功！已填充测试数据',
          type: 'success'
        });
      } catch (error) {
        console.error('智能填充测试失败:', error);
        this.$message({
          message: '智能填充测试失败: ' + error.message,
          type: 'error'
        });
      }
    }
  }
}
</script>

<style scoped>
/* 组件样式 */
</style>
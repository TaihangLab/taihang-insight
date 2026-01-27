<template>
  <el-dialog
    :title="dialogTitle"
    v-model="dialogVisible"
    width="700px"
    @close="closeDialog"
  >
    <!-- 智能填充助手 -->
    <SmartFillAssistant
      currentPage="user"
      :form-ref="dialogVisible ? { userForm: this.userForm } : null"
      v-if="dialogVisible"
    />
    <!-- 测试填充数据按钮 -->
    <el-button
      type="primary"
      size="small"
      @click="testSmartFill"
      style="margin-bottom: 10px;"
    >
      测试填充数据
    </el-button>

    <el-form :model="userForm" :rules="userRules" ref="userForm" label-width="80px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户昵称" prop="nick_name" required>
            <el-input v-model="userForm.nick_name" placeholder="请输入用户昵称"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="归属部门" prop="dept_id">
            <!-- DeptTreeSelect 暂时禁用 -->
            <el-input v-model="userForm.dept_id_text" placeholder="请输入部门ID" type="number"></el-input>
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
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="submitForm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { ref } from 'vue'
import SmartFillAssistant from '@/mock/components/SmartFillAssistant.vue'

export default {
  name: 'UserEditDialog',
  components: {
    SmartFillAssistant
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    currentUser: {
      type: Object,
      default: null
    },
    tenantId: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      userForm: {
        tenant_id: 1, // Default tenant ID
        user_name: '',
        nick_name: '',
        phone: '',
        email: '',
        dept_id: null,
        dept_id_text: '',
        password: '',
        gender: null,
        status: 0,
        position: '',
        remark: ''
      },
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
      }
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(value) {
        this.$emit('update:visible', value)
      }
    },
    dialogTitle() {
      return this.currentUser ? '编辑用户' : '新增用户'
    }
  },
  watch: {
    currentUser: {
      handler(newVal) {
        if (newVal) {
          this.userForm = {
            ...newVal,
            tenant_id: newVal.tenant_id || this.tenantId,
            dept_id: newVal.dept_id || null,
            dept_id_text: newVal.dept_id ? String(newVal.dept_id) : '',
            password: '',
            gender: this.normalizeGenderValue(newVal.gender),
            position: newVal.position || '',
            status: newVal.status || 0
          }
        } else {
          this.resetForm()
        }
      },
      immediate: true
    }
  },
  mounted() {
    // Initialize tenant_id from prop - only if it's a number
    // Backend expects int or null, not string
    if (this.tenantId && typeof this.tenantId === 'number' && !this.userForm.tenant_id) {
      this.userForm.tenant_id = this.tenantId
    }
  },
  methods: {
    resetForm() {
      this.userForm = {
        tenant_id: (typeof this.tenantId === 'number') ? this.tenantId : 1, // Default to tenant 1
        user_name: '',
        nick_name: '',
        phone: '',
        email: '',
        dept_id: null,
        dept_id_text: '',
        password: '',
        gender: null,
        status: 0,
        position: '',
        remark: ''
      }
    },
    normalizeGenderValue(gender) {
      if (typeof gender === 'string') {
        switch (gender.toLowerCase()) {
          case 'male':
          case '男':
            return 1
          case 'female':
          case '女':
            return 2
          default:
            return 0
        }
      }
      if (typeof gender === 'number') {
        return [0, 1, 2].includes(gender) ? gender : 0
      }
      return 0
    },
    submitForm() {
      this.$refs.userForm.validate((valid) => {
        if (valid) {
          // Transform data to match backend API
          const submitData = { ...this.userForm }
          // Remove dept_id_text (not used by backend)
          delete submitData.dept_id_text
          // Remove position field (backend expects position_id which is optional)
          delete submitData.position
          // Convert dept_id to number or null
          if (submitData.dept_id === '') {
            submitData.dept_id = null
          } else if (submitData.dept_id !== null) {
            submitData.dept_id = parseInt(submitData.dept_id) || null
          }
          this.$emit('submit', submitData)
        }
      })
    },
    closeDialog() {
      this.$emit('update:visible', false)
      this.$nextTick(() => {
        if (this.$refs.userForm) {
          this.$refs.userForm.clearValidate()
        }
      })
    },
    cancel() {
      this.closeDialog()
    },

    // 测试智能填充功能
    testSmartFill() {
      try {
        // 直接填充测试数据
        const testData = {
          tenant_id: 1, // Default tenant ID (required by backend, 0 is invalid)
          user_name: 'testuser' + Math.floor(Math.random() * 10000),
          nick_name: '测试用户' + Math.floor(Math.random() * 10000),
          phone: '138' + Math.floor(100000000 + Math.random() * 900000000).toString().substring(0, 8),
          email: 'test' + Math.floor(Math.random() * 10000) + '@example.com',
          dept_id: null,
          dept_id_text: '',
          password: 'TestPass123!',
          gender: [0, 1, 2][Math.floor(Math.random() * 3)],
          status: Math.round(Math.random()),
          position: '',
          remark: '这是测试用户的备注信息'
        };

        // 将测试数据填充到表单
        Object.keys(testData).forEach(key => {
          if (this.userForm.hasOwnProperty(key)) {
            this.userForm[key] = testData[key];
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
/* 组件样式继承自父组件的全局样式 */
</style>

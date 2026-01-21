<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="dialogVisible"
    width="600px"
    @close="closeDialog"
  >
    <SmartFillAssistant
      currentPage="role"
      :form-ref="dialogVisible ? { roleForm } : null"
      v-if="dialogVisible"
    />

    <el-form :model="roleForm" :rules="roleRules" ref="roleForm" label-width="100px">
      <el-form-item label="角色名称" prop="role_name">
        <el-input v-model="roleForm.role_name" placeholder="请输入角色名称" />
      </el-form-item>
      <el-form-item label="角色代码" prop="role_code">
        <el-input v-model="roleForm.role_code" placeholder="请输入角色代码" :disabled="!!currentRole" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="roleForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
      </el-form-item>
      <el-form-item label="权限" prop="permissions">
        <el-checkbox-group v-model="roleForm.permissions">
          <el-checkbox label="user:create">用户创建</el-checkbox>
          <el-checkbox label="user:read">用户读取</el-checkbox>
          <el-checkbox label="user:update">用户更新</el-checkbox>
          <el-checkbox label="user:delete">用户删除</el-checkbox>
          <el-checkbox label="role:create">角色创建</el-checkbox>
          <el-checkbox label="role:read">角色读取</el-checkbox>
          <el-checkbox label="role:update">角色更新</el-checkbox>
          <el-checkbox label="role:delete">角色删除</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-switch
          v-model="roleForm.status"
          :active-value="0"
          :inactive-value="1"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
      <el-form-item label="备注" prop="remarks">
        <el-input v-model="roleForm.remarks" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
    </el-form>

    <span slot="footer" class="dialog-footer">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="submitForm">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import SmartFillAssistant from '@/mock/components/SmartFillAssistant.vue'

export default {
  name: 'RoleEditDialog',
  components: {
    SmartFillAssistant
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    currentRole: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      roleForm: {
        role_id: '',
        role_name: '',
        role_code: '',
        permissions: [],
        description: '',
        status: 0,
        remarks: ''
      },
      roleRules: {
        role_name: [
          { required: true, message: '请输入角色名称', trigger: 'blur' }
        ],
        role_code: [
          { required: true, message: '请输入角色代码', trigger: 'blur' }
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
      return this.currentRole ? '编辑角色' : '新增角色'
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetForm()
        if (this.currentRole) {
          this.roleForm = { ...this.currentRole }
        }
      }
    }
  },
  methods: {
    resetForm() {
      this.roleForm = {
        role_id: '',
        role_name: '',
        role_code: '',
        permissions: [],
        description: '',
        status: 0,
        remarks: ''
      }
    },
    submitForm() {
      this.$refs.roleForm.validate((valid) => {
        if (valid) {
          this.$emit('submit', { ...this.roleForm })
        }
      })
    },
    closeDialog() {
      this.$emit('update:visible', false)
      this.$nextTick(() => {
        if (this.$refs.roleForm) {
          this.$refs.roleForm.clearValidate()
        }
      })
    },
    cancel() {
      this.closeDialog()
    }
  }
}
</script>

<style scoped>
/* 组件样式继承自父组件的全局样式 */
</style>

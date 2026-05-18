<template>
  <div id="changePassword">
    <el-dialog
      title="修改密码"
      width="40%"
      top="2rem"
      :close-on-click-modal="false"
      :visible.sync="showDialog"
      :destroy-on-close="true"
      @close="close()"
    >
      <div id="shared" v-loading="isLoging" style="margin-right: 20px;">
        <el-form ref="passwordForm" :model="form" :rules="rules" status-icon label-width="90px">
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input v-model="form.oldPassword" type="password" show-password autocomplete="off" placeholder="请输入旧密码"></el-input>
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="form.newPassword" type="password" show-password autocomplete="off" maxlength="20" placeholder="8-20 位，字母+数字+特殊字符"></el-input>
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="form.confirmPassword" type="password" show-password autocomplete="off" maxlength="20" placeholder="再次输入新密码"></el-input>
          </el-form-item>

          <el-form-item>
            <div style="float: right;">
              <el-button type="primary" :loading="isLoging" @click="onSubmit">保存</el-button>
              <el-button :disabled="isLoging" @click="close">取消</el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { updateUserPwd } from "@/api/auth";

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[~!@#$%^&*()_+`\-={}:";'<>?,.\/]).{8,20}$/;

export default {
  name: "changePassword",
  data() {
    const confirmValidator = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请再次输入新密码'));
      } else if (value !== this.form.newPassword) {
        callback(new Error('两次输入密码不一致!'));
      } else {
        callback();
      }
    };
    return {
      showDialog: false,
      isLoging: false,
      form: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      rules: {
        oldPassword: [
          { required: true, message: '请输入旧密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          {
            pattern: PASSWORD_PATTERN,
            message: '密码长度 8-20 位，必须同时包含字母、数字和特殊字符',
            trigger: 'blur'
          }
        ],
        confirmPassword: [
          { required: true, validator: confirmValidator, trigger: 'blur' }
        ]
      }
    };
  },
  methods: {
    openDialog() {
      this.showDialog = true;
      this.$nextTick(() => {
        if (this.$refs.passwordForm) {
          this.$refs.passwordForm.clearValidate();
        }
      });
    },
    onSubmit() {
      console.log('[changePassword] 点击保存', JSON.parse(JSON.stringify(this.form)));
      if (!this.$refs.passwordForm) {
        console.error('[changePassword] passwordForm ref 不存在');
        return;
      }
      this.$refs.passwordForm.validate((valid, invalidFields) => {
        if (!valid) {
          console.warn('[changePassword] 表单校验未通过：', invalidFields);
          const firstField = invalidFields && Object.keys(invalidFields)[0];
          const firstMsg = firstField && invalidFields[firstField][0] && invalidFields[firstField][0].message;
          if (firstMsg) {
            this.$message({ showClose: true, message: firstMsg, type: 'warning' });
          }
          return;
        }
        console.log('[changePassword] 校验通过，开始请求 /api/v1/system/user/profile/updatePwd');
        this.isLoging = true;
        updateUserPwd(this.form.oldPassword, this.form.newPassword)
          .then((res) => {
            console.log('[changePassword] 修改密码成功，响应：', res);
            this.$message({ showClose: true, message: '修改成功，请重新登录', type: 'success' });
            this.showDialog = false;
            setTimeout(() => {
              if (this.sseSource) {
                try { this.sseSource.close(); } catch (e) { /* ignore */ }
              }
              this.$store.dispatch('LogOut').finally(() => {
                this.$router.push('/login');
              });
            }, 800);
          })
          .catch((error) => {
            const respData = error && error.response && error.response.data;
            console.error('[changePassword] 修改密码失败：', error, respData);
            const fallbackMsg = (respData && (respData.msg || respData.detail))
              || (error && error.message)
              || '修改密码失败';
            this.$message({ showClose: true, message: String(fallbackMsg), type: 'error' });
          })
          .finally(() => {
            this.isLoging = false;
          });
      });
    },
    close() {
      this.showDialog = false;
      this.form.oldPassword = '';
      this.form.newPassword = '';
      this.form.confirmPassword = '';
      this.$nextTick(() => {
        if (this.$refs.passwordForm) {
          this.$refs.passwordForm.clearValidate();
        }
      });
    }
  }
};
</script>
